import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Mic,
    Image as ImageIcon,
    Music,
    Loader2,
    Target,
    Package,
    Briefcase,
    TrendingUp,
    Palette,
    Workflow,
    Layout,
    Server,
    ShieldCheck,
    Infinity,
    Zap,
    Play,
    PauseCircle,
    Lock,
    X,
    BarChart3,
    Layers,
    RotateCcw,
    AlertTriangle
} from 'lucide-react';
import { loggingService } from '../services/firebase/loggingService';
import { projectsService } from '../services/firebase/projectsService';
import { rolesService } from '../services/firebase/rolesService';
import { subscriptionService } from '../services/firebase/subscriptionService';
import { RoleConfig } from '../types/roles';
import type { ProcessedPDFContent } from '../types/pdf';
import { FileUploadButton } from '../components/input/FileUploadButton';
import { ImageUploadButton } from '../components/input/ImageUploadButton';
import { AudioUploadButton } from '../components/input/AudioUploadButton';
import { MicrophoneButton } from '../components/input/MicrophoneButton';
import { ProcessedMedia, mediaProcessorService } from '../services/media/mediaProcessorService';
import { SmartPreviewModal } from '../components/modals/SmartPreviewModal';
import { AudioPreviewModal } from '../components/modals/AudioPreviewModal';
import type { ProcessedAudioContent } from '../types/audio';
import { ContentBlockEditor } from '../components/input/ContentBlockEditor';
import type { ContentBlock } from '../types/content';
import { createContentBlock, combineBlocksForAI } from '../types/content';

import { aiService } from '../services/ai/aiService';
import { PromptEngine } from '../ai/promptEngine';
import { Project, RoleOutput, SynthesisOutput } from '../types/blueprint';
import { generateSynthesis } from '../services/ai/SynthesisAgent';
import { cn } from '../lib/utils';
import ResultsWorkspace from '../components/ResultsWorkspace';
import { useAuth } from '../contexts/AuthContext';
import { useWorkflow } from '../contexts/WorkflowContext';
import { sanitizeForFirestore } from '../utils/firestoreUtils';
import {
    trackRoleStart,
    trackRoleEnd,
    isRoleRunning,
    MAX_ANALYSIS_DURATION_MS,
} from '../utils/runningRolesTracker';
import UpgradeModal from '../components/UpgradeModal';
import { RewardGateModal } from '../components/RewardGateModal';
import { usersService } from '../services/firebase/usersService';
import { usageService } from '../services/firebase/usageService';
import { WarRoomService } from '../services/ai/WarRoomService';
import { buildPreviousRolesContext } from '../utils/compactRoleContext';

type AutoStartPayload = { idea: string; methodology: 'agile' | 'pmo' | 'hybrid'; selectedRoles?: string[] };

// Per-role analysis timeout (ms). Heavy roles may need a stream continuation after the
// proxy's 150s Edge Function cut (see AnthropicProvider), so they get extra room.
const ROLE_TIMEOUTS_MS: Record<string, number> = {
    'ux-designer': 10 * 60 * 1000,  // 10 min — full HTML prototype
    'architect': 8 * 60 * 1000,     // 8 min — largest JSON output
};
const DEFAULT_TIMEOUT_MS = 6 * 60 * 1000; // 6 min for all other roles

// Deep patch: finds each key anywhere in the content tree (not just top level) and updates it.
// Falls back to adding the key at top level if not found. Enables AI patches like { "mvpInScope": [...] }
// to reach deeply nested fields like content.dashboard.productDetails.mvpInScope.
function hasFieldDeep(obj: unknown, key: string): boolean {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
    if (key in (obj as Record<string, unknown>)) return true;
    return Object.values(obj as Record<string, unknown>).some(v => hasFieldDeep(v, key));
}

function setFieldDeep(obj: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
    if (key in obj) return { ...obj, [key]: value };
    for (const k of Object.keys(obj)) {
        const child = obj[k];
        if (typeof child === 'object' && child !== null && !Array.isArray(child) &&
            hasFieldDeep(child, key)) {
            return { ...obj, [k]: setFieldDeep(child as Record<string, unknown>, key, value) };
        }
    }
    return { ...obj, [key]: value }; // not found anywhere — add at top level
}

function applyDeepPatch(content: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
    let result = { ...content };
    for (const [key, value] of Object.entries(patch)) {
        result = setFieldDeep(result, key, value);
    }
    return result;
}

export default function StrategyHub() {
    const { t, i18n } = useTranslation(['translation', 'common']);
    const { user, userProfile } = useAuth();
    const { autoFlow, setAutoFlow, refreshProjects, setCurrentProjectName } = useWorkflow();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // Data State
    const [roles, setRoles] = useState<RoleConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [saveToDatabase, setSaveToDatabase] = useState(true);
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [methodology, setMethodology] = useState<'agile' | 'pmo' | 'hybrid'>('pmo');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [suggestedIdea, setSuggestedIdea] = useState<string | null>(null);
    const [suggestedModules, setSuggestedModules] = useState<string[] | null>(null);
    // When user accepts the AI suggestion, skip gatekeeper on the next Analyze press
    const skipValidationRef = useRef(false);
    // Tracks the last input text that was already validated/accepted — if current input matches,
    // skip re-validation on subsequent Analyze presses (persists across failed gates like missing roles)
    const lastProcessedTextRef = useRef<string>('');

    // Execution State
    const [project, setProject] = useState<Project | null>(null);
    const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [viewedRoleId, setViewedRoleId] = useState<string | null>(null);
    const [activeRoles, setActiveRoles] = useState<string[]>([]);
    const [maxSelectableRoles, setMaxSelectableRoles] = useState(2);

    // Usage counter — remaining analyses for post-trial users
    const [remainingAnalyses, setRemainingAnalyses] = useState<number | 'unlimited' | null>(null);
    const [monthlyLimit, setMonthlyLimit] = useState<number | 'unlimited'>(2);
    const [canCreateNewProject, setCanCreateNewProject] = useState(false);

    // Derived — keeps all downstream code that reads enabledRoles working as-is
    // useMemo ensures the Set reference is stable across re-renders when activeRoles hasn't changed
    const enabledRoles = useMemo(() => new Set(activeRoles), [activeRoles]);

    // Auto-flow tick counter — incremented when a role completes to force useEffect re-evaluation
    const [autoFlowTick, setAutoFlowTick] = useState(0);

    // Notification system — toast for role completion/errors
    const [notificationState, setNotificationState] = useState<{
        show: boolean;
        type: 'success' | 'error';
        message: string;
    }>({ show: false, type: 'success', message: '' });

    // Track role execution start time for duration display
    const roleStartTimeRef = useRef<{ [key: string]: number }>({});

    // Trial / Beta system
    const [trialCount, setTrialCount]         = useState(0);
    const [trialCompleted, setTrialCompleted] = useState(false);
    // Admin users bypass all trial restrictions — they are the platform owners
    const isAdmin = userProfile?.rol === 'admin';
    const [showRewardGate, setShowRewardGate] = useState(false);
    const skipGateRef = useRef(false); // set true after reward to bypass gate on re-trigger
    const postRewardRef = useRef(false); // true during post-reward analysis cycle; allows reward role to bypass security guard

    // Auto-Flow Logic Ref
    const processingRef = useRef(false);

    // Tracks roles started in this tab — backed by sessionStorage so it survives reloads.
    // See: src/utils/runningRolesTracker.ts
    // Note: tracking is per-project; the previous in-memory ref was wiped on every reload,
    // which caused mid-flight analyses to be misclassified as "interrupted" after F5.

    // Guard: prevent loadData() from running twice when both `user` and `userProfile` fire on reload
    const dataLoadedForUidRef = useRef<string | null>(null);

    // Stop/Cancel Analysis — set to true to ignore the result when it arrives
    const cancelledRef = useRef(false);
    const [stoppingRoleId, setStoppingRoleId] = useState<string | null>(null);

    // Convert-to-Master deferred single-role run
    const pendingAutoRunRoleRef = useRef<string | null>(null);

    // PLG Auto-Start — stores landing idea between mount and roles-load
    const pendingAutoStartRef = useRef<AutoStartPayload | null>(null);
    const [isAutoStartPending, setIsAutoStartPending] = useState(false);

    // Synthesis — tracks which projectId already ran synthesis to prevent re-triggers
    const synthesisRunRef = useRef<string | null>(null);

    useEffect(() => {
        if (user) {
            loadData();
        } else {
            // --- LOGOUT CLEANUP ---
            // Clear all data to prevent leakage between different users
            dataLoadedForUidRef.current = null; // Allow re-load on next login
            setRoles([]);
            setActiveRoles([]);
            setProject(null);
            setActiveProjectId(null);
            setLoading(false);
        }
    }, [user, userProfile]);

    // Deep Linking / Resume Project
    useEffect(() => {
        const projectId = searchParams.get('projectId');
        const isNew = searchParams.get('new');

        if (projectId && user) {
            loadProject(projectId);
        } else if (isNew) {
            handleNewProject();
        } else if (!projectId && !isNew) {
            // Logo click or bare /app/strategy-hub → volver a la pantalla de input limpia
            setProject(null);
            setProjectLoadError(null);
            setActiveProjectId(null);
            setViewedRoleId(null);
            setContentBlocks([]);
            setValidationError(null);
        }
    }, [searchParams.toString(), user]);

    // ── LCP Optimisation: preload IDEO triangle when a project page is detected ─
    // The IDEO triangle is the LCP element inside StrategyAnalystDashboard.
    // That component is lazy-loaded, so the browser only discovers the <img> tag
    // after: Auth resolves → Firestore fetch → lazy chunk download → render.
    // By injecting a <link rel="preload"> as soon as we see a ?projectId in the URL,
    // the browser starts fetching the PNG immediately — in parallel with all the async
    // steps above. When the img finally renders, the image is already in cache → instant paint.
    useEffect(() => {
        const projectId = searchParams.get('projectId');
        if (!projectId) return;

        // Guard: avoid duplicate preload links across re-renders
        if (document.querySelector('link[data-pilotai="ideo-preload"]')) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = '/assets/ideo-triangle-hd.png';
        link.setAttribute('fetchpriority', 'high');
        link.dataset.pilotai = 'ideo-preload';
        document.head.appendChild(link);

        // Remove preload tag when navigating away from the project
        return () => {
            document.querySelector('link[data-pilotai="ideo-preload"]')?.remove();
        };
    }, [searchParams.get('projectId')]);

    // ── Landing PLG hydration: inject pending idea + schedule Zero-Click auto-start ──
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('pilotai_pending_idea')
                ?? localStorage.getItem('pilotai_pending_idea');
            if (!raw) return;

            // Clear storage FIRST — one-time extraction, prevents re-injection on refresh
            sessionStorage.removeItem('pilotai_pending_idea');
            localStorage.removeItem('pilotai_pending_idea');

            const { idea, methodology: m, selectedRoles: sr } = JSON.parse(raw) as { idea: string; methodology: string; selectedRoles?: string[] };
            if (!idea?.trim()) return;

            const resolvedMethodology: 'agile' | 'pmo' | 'hybrid' =
                (m === 'agile' || m === 'pmo' || m === 'hybrid') ? m : 'pmo';

            // Fill textarea (user sees their idea pre-loaded while auto-start prepares)
            setContentBlocks([createContentBlock('text', idea.trim())]);
            setMethodology(resolvedMethodology);

            // Pre-select roles from landing page if provided
            if (Array.isArray(sr) && sr.length > 0) {
                setActiveRoles(sr);
            }

            // Store payload in ref — no re-render, safe from stale closures
            pendingAutoStartRef.current = { idea: idea.trim(), methodology: resolvedMethodology, selectedRoles: sr };
            setIsAutoStartPending(true);
        } catch (_) { /* Storage blocked or invalid JSON — silently ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Zero-Click Auto-Start: fires once user + roles are ready ──────────────
    // Guards prevent double-fire and respect existing sessions.
    useEffect(() => {
        if (!pendingAutoStartRef.current) return;
        if (!user || loading || roles.length === 0) return;
        if (isCreating || project) {
            // Can't auto-start right now — clear pending to avoid stale activation later
            pendingAutoStartRef.current = null;
            setIsAutoStartPending(false);
            return;
        }

        // Extract payload and clear ref BEFORE async call (race-condition guard)
        const payload = pendingAutoStartRef.current;
        pendingAutoStartRef.current = null;
        setIsAutoStartPending(false);

        // Enable Auto mode so roles execute automatically after project is created.
        // New PLG users expect to see the full analysis running, not a manual trigger.
        setAutoFlow(true);

        handleAnalyzeIdea(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loading, roles.length, isCreating, project]);

    // Sync active project name to global context (for TopNav breadcrumb)
    useEffect(() => {
        const name = project?.blueprint?.meta?.projectName
            ?? (typeof project?.ideaOriginal === 'string' ? project.ideaOriginal.slice(0, 50) : null)
            ?? null;
        setCurrentProjectName(name);
        return () => setCurrentProjectName(null);
    }, [project]);

    // Auto-Flow Effect — triggers when autoFlow is on and a role completes (via autoFlowTick)
    useEffect(() => {
        if (!autoFlow || !project || processingRef.current) return;

        const checkNextStep = async () => {
            // Safety: re-check processing (could have changed during the 1s delay)
            if (processingRef.current) return;

            // Find the first role that is ENABLED, NOT COMPLETED, and NOT PROCESSING
            // But we must ensure the PREVIOUS role is completed (sequential)

            // Sort roles by orderIndex
            const sortedRoles = [...roles].sort((a, b) => a.orderIndex - b.orderIndex);

            for (let i = 0; i < sortedRoles.length; i++) {
                const role = sortedRoles[i];
                const roleStatus = project.blueprint?.roles?.[role.roleId]?.status || 'pending';
                const isEnabled = enabledRoles.has(role.roleId);

                if (!isEnabled) continue; // Skip disabled roles

                if (roleStatus === 'completed') continue; // Already done

                if (roleStatus === 'processing') return; // Something is running, wait

                if (roleStatus === 'pending' || roleStatus === 'error') {
                    // Check if previous enabled role is completed
                    let previousCompleted = true;
                    for (let j = i - 1; j >= 0; j--) {
                        const prevRole = sortedRoles[j];
                        if (enabledRoles.has(prevRole.roleId)) {
                            const prevStatus = project.blueprint?.roles?.[prevRole.roleId]?.status;
                            if (prevStatus !== 'completed') {
                                previousCompleted = false;
                                break;
                            }
                        }
                    }

                    if (previousCompleted) {
                        // Trigger this role!
                        console.log(`[Auto-Flow] Triggering ${role.roleId} (tick: ${autoFlowTick})`);
                        await runRoleAnalysis(role);
                        return; // Only trigger one at a time
                    } else {
                        return; // Wait for previous
                    }
                }
            }

            console.log('[Auto-Flow] All enabled roles completed');
            if (project) {
                // If synthesis exists but is stale (new roles completed since last run),
                // reset the guard so autoFlow can trigger a fresh synthesis automatically.
                const enabledCompletedCount = roles.filter(
                    r => enabledRoles.has(r.roleId) && project.blueprint?.roles?.[r.roleId]?.status === 'completed'
                ).length;
                const existingSynthesis = project.blueprint?.synthesis;
                const isSynthesisStale = !existingSynthesis
                    || (existingSynthesis.rolesAnalyzed?.length ?? 0) < enabledCompletedCount;
                if (isSynthesisStale) {
                    synthesisRunRef.current = null;
                }
                runSynthesis(project);
            }
        };

        const timer = setTimeout(checkNextStep, 1500); // Delay to allow UI + state to settle
        return () => clearTimeout(timer);

    }, [autoFlow, project, roles, enabledRoles, autoFlowTick]);

    // Firestore Polling — keep project data fresh when user navigates
    // Sync project from Firestore while a role is actively processing.
    // Guard: only call setProject when blueprint.roles actually changed — prevents
    // unnecessary re-renders of the entire dashboard tree on every poll tick.
    useEffect(() => {
        if (!activeProjectId) return;

        const pollInterval = setInterval(async () => {
            // Skip poll when no role is running — avoids 2-second re-render loop on viewing results
            if (!processingRef.current) return;
            try {
                const updatedProject = await projectsService.getProjectById(activeProjectId);
                if (updatedProject) {
                    setProject(prev => {
                        // Reference-stable update: skip setState if roles content is identical
                        const prevRoles = JSON.stringify(prev?.blueprint?.roles ?? {});
                        const nextRoles = JSON.stringify(updatedProject.blueprint?.roles ?? {});
                        return prevRoles === nextRoles ? prev : updatedProject;
                    });
                }
            } catch (error) {
                console.error('[StrategyHub] Error polling project:', error);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [activeProjectId]);

    // Auto-dismiss notifications after 3 seconds
    useEffect(() => {
        if (!notificationState.show) return;

        const timer = setTimeout(() => {
            setNotificationState(prev => ({ ...prev, show: false }));
        }, 3000);

        return () => clearTimeout(timer);
    }, [notificationState.show]);

    // Convert-to-Master single-role trigger: fires once when the new project loads
    useEffect(() => {
        if (!pendingAutoRunRoleRef.current) return;
        if (!project || !user || roles.length === 0 || processingRef.current) return;

        const targetRoleId = pendingAutoRunRoleRef.current;
        pendingAutoRunRoleRef.current = null; // Consume immediately — one-shot

        const targetRole = roles.find(r => r.roleId === targetRoleId);
        if (!targetRole) return;

        // Small delay to let UI render the new project before starting analysis
        const timer = setTimeout(async () => {
            console.log(`Convert-to-Master: auto-running ${targetRoleId}`);
            await runRoleAnalysis(targetRole);
        }, 800);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id, roles.length]);

    // Stale processing cleanup — fires when a project loads (project.id changes).
    // A role is "stale" when ALL of these hold:
    //   1. status === 'processing' in the persisted blueprint
    //   2. NOT tracked as running in this tab's sessionStorage
    //      (so reloading mid-analysis doesn't falsely flag it as interrupted)
    //   3. older than MAX_ANALYSIS_DURATION_MS — past the longest legitimate run
    //
    // We don't blow away tracking when the project changes — we just clear the OLD
    // project's slot — because trackRoleStart/End are scoped per-project.
    useEffect(() => {
        if (!project?.id || !activeProjectId) return;

        const now = Date.now();

        const staleEntries = Object.entries(project.blueprint?.roles ?? {}).filter(([roleId, output]) => {
            if (output?.status !== 'processing') return false;
            if (isRoleRunning(activeProjectId, roleId)) return false; // in-flight in this tab — leave alone
            const startedAt = output.startedAt ? new Date(output.startedAt).getTime() : 0;
            return now - startedAt > MAX_ANALYSIS_DURATION_MS;
        });

        if (staleEntries.length === 0) return;

        const lang = project.language ?? 'es';
        const errorContent = lang === 'en'
            ? 'The analysis was interrupted (page reload or connection lost). Please try again.'
            : 'El análisis fue interrumpido (recarga de página o pérdida de conexión). Por favor, inténtalo de nuevo.';

        const patchedRoles = { ...project.blueprint?.roles };
        staleEntries.forEach(([roleId]) => {
            const errorOutput: RoleOutput = { status: 'error', content: errorContent, lastUpdated: new Date().toISOString() };
            patchedRoles[roleId] = errorOutput;
            projectsService.updateBlueprintRole(activeProjectId, roleId, errorOutput)
                .catch(e => console.warn('[StaleCheck] Failed to reset stale role:', roleId, e));
        });

        setProject(prev => prev ? { ...prev, blueprint: { ...prev.blueprint, roles: patchedRoles } } : null);

        const roleNames = staleEntries.map(([roleId]) => roles.find(r => r.roleId === roleId)?.displayName ?? roleId).join(', ');
        setNotificationState({ show: true, type: 'error', message: `⚠️ ${roleNames} fue interrumpido. Por favor, ejecútalo nuevamente.` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.id]);


    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeRequiredPlan, setUpgradeRequiredPlan] = useState<'pro' | 'enterprise'>('pro');

    // PDF Upload State
    const [pdfPreviewContent, setPdfPreviewContent] = useState<ProcessedPDFContent | null>(null);
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const [attachments, setAttachments] = useState<ProcessedMedia[]>([]);
    const [fullContext, setFullContext] = useState<string | null>(null);

    // Audio Preview Modal State
    const [audioPreviewContent, setAudioPreviewContent] = useState<ProcessedAudioContent | null>(null);
    const [isAudioPreviewOpen, setIsAudioPreviewOpen] = useState(false);

    const loadData = async () => {
        // --- TRANSITION GUARD ---
        // Fast-path: read cached profile from previous session (on F5 reload)
        // This avoids the extra render cycle where loadData returns early waiting for profile
        const effectiveProfile = userProfile ?? (() => {
            try {
                const raw = sessionStorage.getItem('pilot_upx');
                if (!raw) return null;
                const c = JSON.parse(raw);
                // Only use if same user (security: prevent cross-user cache)
                return (c.uid === user?.uid) ? c : null;
            } catch {
                return null;
            }
        })();
        if (user && !effectiveProfile) return;

        // Prevent double-execution: fires twice on reload (user → then userProfile arrives).
        // Once data is loaded for a uid, skip the second call — profile is already applied.
        if (dataLoadedForUidRef.current === user?.uid) return;
        dataLoadedForUidRef.current = user?.uid ?? null;
        // -------------------------

        try {
            const planId = effectiveProfile?.subscriptionPlan || 'free';
            const isAdminUser = effectiveProfile?.rol === 'admin';

            console.log('DEBUG: User Profile:', effectiveProfile);
            console.log('DEBUG: Is Admin?', isAdminUser);
            // Parallel reads: all independent Firebase operations
            // This reduces 6 sequential reads to 1 parallel batch
            const [allRoles, userPlan, freshProfile, usageStatus, projectCount] = await Promise.all([
                rolesService.getActiveRoles(),
                subscriptionService.getPlanById(planId).catch(() => null),
                user?.uid ? usersService.getUserById(user.uid).catch(() => null) : Promise.resolve(null),
                (!isAdminUser && user?.uid)
                    ? usageService.checkAnalysisLimit(user.uid, planId).catch(() => null)
                    : Promise.resolve(null),
                user?.uid ? projectsService.countUserProjects(user.uid).catch(() => 0) : Promise.resolve(0),
            ]);

            // Fallback: If plan doesn't have includedRoles, use default based on subscriptionPlan
            const includedRoles = userPlan?.includedRoles || getDefaultIncludedRoles(planId);

            // Dynamic role selection limit from plan — maxRoles is the source of truth
            const planLimit = userPlan?.maxRoles ?? userPlan?.includedRoles?.length ?? 2;
            setMaxSelectableRoles(isAdminUser ? 999 : planLimit);

            // Trial mode: user can select ANY roles from the system (not limited to plan's specific roles)
            const isInTrial = !(effectiveProfile?.trial_completed ?? false);

            // Map roles with access status
            // Model: plans define QUANTITY of roles (maxRoles), user chooses WHICH ones
            // All roles are accessible — the limit is enforced in toggleRole by maxSelectableRoles
            const rolesWithAccess = allRoles.map(role => ({
                ...role,
                isAccessible: true,
                requiredPlan: getRequiredPlan(role.roleId)
            }));

            setRoles(rolesWithAccess as any);

            // Enable only accessible roles by default (overridden in trial mode by Squad Freedom)
            const accessibleRoleIds = rolesWithAccess
                .filter(r => r.isAccessible)
                .map(r => r.roleId);

            // Sync trial state from effectiveProfile + fresh Firestore read (now parallelized)
            {
                // Primary: set from effectiveProfile (cached or live from AuthContext)
                const isTrialDone = effectiveProfile?.trial_completed ?? false;
                const savedSquad  = effectiveProfile?.squad_roles ?? [];
                setTrialCount(effectiveProfile?.trial_count ?? 0);
                setTrialCompleted(isTrialDone);
                // NEW PROJECT: don't pre-select roles — user chooses manually
                // EXISTING PROJECT: will be overridden by loadProject() restoration
                const isNewProject = !activeProjectId;
                if (isNewProject) {
                    setActiveRoles([]);
                } else {
                    setActiveRoles((isAdminUser || isTrialDone) ? accessibleRoleIds : savedSquad);
                }

                // Secondary: fresh Firestore read (already parallelized above) to override stale values
                if (freshProfile) {
                    const freshCount     = freshProfile.trial_count ?? 0;
                    const freshCompleted = freshProfile.trial_completed ?? false;
                    setTrialCount(freshCount);
                    setTrialCompleted(freshCompleted);
                    const isNewProj = !activeProjectId;
                    if (isNewProj) {
                        setActiveRoles([]);
                    } else {
                        setActiveRoles((isAdminUser || freshCompleted)
                            ? accessibleRoleIds
                            : (freshProfile.squad_roles ?? savedSquad)
                        );
                    }
                }
            }

            // Process usage and project limits (already parallelized above for non-admin users)
            if (!isAdminUser && user?.uid && usageStatus) {
                setMonthlyLimit(usageStatus.limit);
                if (usageStatus.limit === 'unlimited') {
                    setRemainingAnalyses('unlimited');
                } else {
                    setRemainingAnalyses(Math.max(0, usageStatus.limit - usageStatus.currentUsage));
                }
                // Check if user can create more projects (already parallelized — use userPlan and projectCount)
                const maxProjects = userPlan?.limits?.maxProjects;
                if (maxProjects === 'unlimited') {
                    setCanCreateNewProject(true);
                } else if (typeof maxProjects === 'number') {
                    setCanCreateNewProject(projectCount < maxProjects);
                } else {
                    setCanCreateNewProject(false);
                }
            } else if (isAdminUser) {
                setCanCreateNewProject(true);
            }
        } catch (error) {
            console.error("Error loading roles:", error);
            // Fallback: Load all roles without filtering if there's an error
            try {
                const allRoles = await rolesService.getActiveRoles();
                setRoles(allRoles);
                setActiveRoles(allRoles.map(r => r.roleId));
            } catch (fallbackError) {
                console.error("Critical error loading roles:", fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };




    // Helper: Get default included roles based on plan ID (fallback)
    const getDefaultIncludedRoles = (planId: string): string[] => {
        if (planId === 'free') return ['strategy-analyst', 'product-manager'];
        if (planId === 'pro') return ['strategy-analyst', 'product-manager', 'business-analyst', 'ux-designer', 'frontend-dev', 'backend-dev'];
        if (planId === 'enterprise') return ['strategy-analyst', 'product-manager', 'business-analyst', 'ux-designer', 'frontend-dev', 'backend-dev', 'devops', 'qa-engineer', 'architect', 'project-manager'];
        return ['strategy-analyst', 'product-manager']; // Default to free
    };


    // Helper: Determine which plan unlocks this role
    const getRequiredPlan = (roleId: string): 'free' | 'pro' | 'enterprise' => {
        if (['strategy-analyst', 'product-manager'].includes(roleId)) return 'free';
        if (['business-analyst', 'ux-designer', 'frontend-dev', 'backend-dev'].includes(roleId)) return 'pro';
        return 'enterprise';
    };

    const loadProject = async (id: string) => {
        let projectFoundId: string | null = null;
        try {
            setLoading(true);
            setProject(null);
            setProjectLoadError(null);

            const loadedProject = await projectsService.getProjectById(id);

            if (loadedProject) {
                setProject(loadedProject);
                setActiveProjectId(loadedProject.id);
                projectFoundId = loadedProject.id;

                // CRITICAL: Restore activeRoles from project's enabled roles
                const projectRoles = Object.keys(loadedProject.blueprint?.roles ?? {});
                if (projectRoles.length > 0) {
                    setActiveRoles(projectRoles);
                }

                setContentBlocks(prev => {
                    const textBlock = prev.find(b => b.type === 'text');
                    if (textBlock) {
                        return prev.map(b => b.type === 'text' ? { ...b, content: typeof loadedProject.ideaOriginal === 'string' ? loadedProject.ideaOriginal : JSON.stringify(loadedProject.ideaOriginal) } : b);
                    } else {
                        return [...prev, createContentBlock('text', typeof loadedProject.ideaOriginal === 'string' ? loadedProject.ideaOriginal : JSON.stringify(loadedProject.ideaOriginal))];
                    }
                });

                if (roles.length > 0) setViewedRoleId(roles[0].roleId);
            } else {
                setProjectLoadError('Proyecto no encontrado. Puede haber sido eliminado.');
            }
        } catch (error: any) {
            let errorMessage = 'Error al cargar el proyecto. Por favor, intenta de nuevo.';
            if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
                errorMessage = 'No tienes permiso para acceder a este proyecto.';
            } else if (error?.code === 'not-found') {
                errorMessage = 'Proyecto no encontrado.';
            }
            console.error('[ProjectLoad] Error loading project:', error);
            setProjectLoadError(errorMessage);
        } finally {
            setLoading(false); // ← UI unblocks here — context loads in background below
        }

        // Background load: project context is non-critical, must NOT block the loading spinner
        if (projectFoundId) {
            try {
                const projectContext = await projectsService.getProjectContext(projectFoundId);
                if (projectContext) setFullContext(projectContext);
            } catch (contextError: any) {
                if (!contextError?.code?.includes('permission') && !contextError?.message?.includes('permission')) {
                    console.warn('Non-critical: Failed to load project context', contextError);
                }
            }
        }
    };

    const handleNewProject = () => {
        setProject(null);
        setActiveProjectId(null);
        setContentBlocks([]);
        setFullContext(null); // Clear context on new project
        setTimeout(() => {
            document.getElementById('ai-command-center')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // PDF Upload Handlers
    const handlePDFProcessed = (content: ProcessedPDFContent) => {
        setPdfPreviewContent(content);
        setIsPdfPreviewOpen(true);
    };

    // --- Multimodal Handlers ---
    const handleImageProcessed = (media: ProcessedMedia) => {
        setAttachments(prev => [...prev, media]);
    };

    const handleTranscription = (text: string) => {
        // Handle microphone input directly into a text block
        const newBlock = createContentBlock(
            'text',
            text
        );

        setContentBlocks(prev => [...prev, newBlock]);

        loggingService.logInfo('microphone', 'transcription_added', {
            length: text.length
        });
    };

    const handleAudioTranscribed = (content: ProcessedAudioContent) => {
        setAudioPreviewContent(content);
        setIsAudioPreviewOpen(true);
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleAudioPreviewConfirm = (transcription: string) => {
        // Create audio block
        const audioBlock = createContentBlock(
            'audio',
            transcription,
            {
                fileName: audioPreviewContent?.metadata.fileName,
                duration: audioPreviewContent?.metadata.duration,
                size: audioPreviewContent?.metadata.sizeBytes,
                format: audioPreviewContent?.metadata.format,
                processingTime: audioPreviewContent?.processingTime
            }
        );

        setContentBlocks(prev => [...prev, audioBlock]);
        setIsAudioPreviewOpen(false);

        loggingService.logInfo('audio-upload', 'transcription_confirmed', {
            fileName: audioPreviewContent?.metadata.fileName,
            duration: audioPreviewContent?.metadata.duration,
            transcriptionLength: transcription.length
        });
    };

    const handlePDFPreviewConfirm = (summary: string) => {
        // Create PDF block
        const pdfBlock = createContentBlock(
            'pdf',
            summary,
            {
                fileName: pdfPreviewContent?.metadata.fileName,
                pages: pdfPreviewContent?.metadata.pageCount,
                size: pdfPreviewContent?.metadata.sizeBytes,
                format: 'pdf',
                processingTime: pdfPreviewContent?.processingTime
            }
        );

        setContentBlocks(prev => [...prev, pdfBlock]);

        // Store FULL content for AI context
        if (pdfPreviewContent) {
            setFullContext(pdfPreviewContent.fullText);
            console.log('PDF Full Context Stored:', pdfPreviewContent.fullText.length, 'characters');
        }
        setIsPdfPreviewOpen(false);

        // Log success
        loggingService.logInfo('pdf-upload', 'content_confirmed', {
            fileName: pdfPreviewContent?.metadata.fileName,
            pageCount: pdfPreviewContent?.metadata.pageCount,
            wordCount: pdfPreviewContent?.metadata.wordCount,
            method: pdfPreviewContent?.method
        });
    };

    const handlePDFError = (error: Error) => {
        // Enhanced error logging with full context
        console.error('═══ PDF PROCESSING ERROR ═══');
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Error Type:', error.constructor.name);
        console.error('═══════════════════════════');

        // Log to Diagnostic Center with detailed context
        loggingService.logError('pdf-upload', 'processing_failed', {
            errorMessage: error.message,
            errorType: error.constructor.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            language: i18n.language
        });

        // Determine specific error message based on error content
        let errorMessage: string;
        let errorDetails: string = '';

        if (error.message.includes('exceeds') || error.message.includes('SIZE_EXCEEDED')) {
            errorMessage = t('errors.fileSizeExceeded', 'File size exceeds 5MB limit.');
            errorDetails = t('errors.fileSizeDetails', 'Please use a smaller PDF file (maximum 5MB).');
        } else if (error.message.includes('Only PDF') || error.message.includes('INVALID_TYPE')) {
            errorMessage = t('errors.invalidFileType', 'Only PDF files are supported.');
            errorDetails = t('errors.invalidTypeDetails', 'Please select a valid PDF document.');
        } else if (error.message.includes('corrupted') || error.message.includes('CORRUPTED_FILE')) {
            errorMessage = t('errors.corruptedFile', 'Unable to read PDF. File may be corrupted.');
            errorDetails = t('errors.corruptedDetails', 'Try opening the file in a PDF reader to verify it works.');
        } else if (error.message.includes('Failed to extract text')) {
            errorMessage = t('errors.extractionFailed', 'Could not extract text from PDF.');
            errorDetails = `${t('errors.extractionDetails', 'Technical error')}: ${error.message}`;
        } else if (error.message.includes('Summary generation failed')) {
            errorMessage = t('errors.summaryFailed', 'Could not generate summary.');
            errorDetails = t('errors.summaryDetails', 'The PDF was read but AI summary failed. Try again.');
        } else {
            // Generic error with full technical details
            errorMessage = t('errors.pdfProcessingFailed', 'Failed to process PDF.');
            errorDetails = `${t('errors.technicalDetails', 'Technical details')}: ${error.message}`;
        }

        // Show detailed alert with both user-friendly message and technical details
        alert(`${errorMessage}\n\n${errorDetails}`);
    };

    const handleMultimediaError = (error: Error & { userMessage?: string }) => {
        console.error('═══ MEDIA PROCESSING ERROR ═══');
        console.error('Error:', error.message);

        loggingService.logError('media-upload', 'processing_failed', {
            errorMessage: error.message,
            timestamp: new Date().toISOString()
        });

        // Use enriched userMessage from component if available
        if (error.userMessage) {
            alert(error.userMessage);
            return;
        }

        // Fallback to generic error handling
        let errorMessage = t('errors.mediaProcessingFailed', 'Failed to process media.');
        let errorDetails = error.message;

        if (error.message.includes('too large') || error.message.includes('Limit')) {
            errorMessage = t('errors.fileSizeExceeded', 'File size exceeds the limit.');
            errorDetails = t('errors.audioSizeDetails', 'Please use a smaller file (Max 50MB for Audio/Images).');
        } else if (error.message.includes('not supported') || error.message.includes('Invalid type')) {
            errorMessage = t('errors.invalidFileType', 'File type not supported.');
        }

        alert(`${errorMessage}\n\n${errorDetails}`);
    };

    const handleConvertToMaster = async (node: any) => {
        const userId = user?.uid || userProfile?.uid;
        if (!userId) {
            alert("Please log in to modularize this process.");
            return;
        }

        const subProcessName = node.data?.label || "Sub-proceso";
        const masterProjectName = project?.blueprint?.meta?.projectName || "Proceso Maestro";
        const currentLang = (i18n.language === 'es' ? 'es' : 'en');

        const newContextIdea = currentLang === 'es'
            ? `DETALLE DEL SUB-PROCESO: "${subProcessName}". 
Este es un desglose modular del paso "${subProcessName}" identificado en el proceso maestro "${masterProjectName}".
OBJETIVO: Analizar, diagramar y optimizar este sub-proceso como una entidad independiente con sus propios actores y reglas.`
            : `SUB-PROCESS DETAIL: "${subProcessName}".
This is a modular breakdown of the step "${subProcessName}" identified in the master process "${masterProjectName}".
OBJECTIVE: Analyze, diagram, and optimize this sub-process as an independent entity with its own actors and rules.`;

        setIsCreating(true);
        try {
            console.log(`DEBUG: Starting modularization of "${subProcessName}" for user ${userId}`);

            // Create a new project for this modular sub-process
            const id = await projectsService.createProject(userId, newContextIdea, currentLang);
            console.log(`DEBUG: New project created with ID: ${id}`);

            // Schedule single-role run (Business Analyst only) on the new project.
            // We do NOT enable Auto-Flow — only BA runs.
            pendingAutoRunRoleRef.current = 'business-analyst';

            // Update UI State
            await refreshProjects(); // Refresh sidebar/list
            setSearchParams({ projectId: id }); // Navigate via URL

            // The useEffect above will trigger loadProject(id).
            // Do NOT clear activeRoles here — roles are user-level (loaded from loadData())
            // and must remain set so the new project's analysis can run.
            setActiveProjectId(id);
            setViewedRoleId(null);
            setContentBlocks([]);

            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            console.log('DEBUG: Modularization complete and navigation triggered.');
        } catch (err) {
            console.error("Conversion to master failed", err);
            alert("Error al modularizar el proceso. Por favor intenta de nuevo.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleAnalyzeIdea = async (payload?: AutoStartPayload) => {
        // Zero-Click hydration: payload.selectedRoles (from landing page) may differ from
        // activeRoles state (overwritten by loadData for new users with empty squad_roles).
        // Resolve once here so enabledRoles Set + AutoFlow + ResultsWorkspace stay in sync.
        const effectiveRoles = (payload?.selectedRoles && payload.selectedRoles.length > 0)
            ? payload.selectedRoles
            : activeRoles;
        if (payload?.selectedRoles && payload.selectedRoles.length > 0) {
            setActiveRoles(effectiveRoles);
        }

        const userId = user?.uid || userProfile?.uid;
        const combinedInput = payload?.idea?.trim()
            ? payload.idea.trim()
            : combineBlocksForAI(contentBlocks);
        const resolvedMethodology: 'agile' | 'pmo' | 'hybrid' = payload?.methodology ?? methodology;
        // Allow empty text input IF there are attachments (e.g. Image only)
        if (!combinedInput.trim() && attachments.length === 0) {
            setValidationError(t('dashboard.ideaPlaceholder'));
            return;
        }
        if (!userId) {
            alert("Please log in to continue.");
            return;
        }

        // --- TRIAL GATE ---
        // Note: The primary role-execution gate is in runRoleAnalysis (project-based counting).
        // This gate prevents creating NEW projects when trial is exhausted.
        console.log(`[TRIAL] handleAnalyzeIdea — trialCompleted: ${trialCompleted} | isAdmin: ${isAdmin}`);
        skipGateRef.current = false;
        // -----------------------------------------

        // --- MAX PROJECTS GATE ---
        if (!isAdmin && trialCompleted && saveToDatabase) {
            try {
                const planId = userProfile?.subscriptionPlan || 'free';
                const userPlan = await subscriptionService.getPlanById(planId);
                const maxProjects = userPlan?.limits?.maxProjects;
                if (maxProjects !== 'unlimited' && typeof maxProjects === 'number') {
                    const currentCount = await projectsService.countUserProjects(userId!);
                    if (currentCount >= maxProjects) {
                        console.log(`[PROJECTS] === LIMIT REACHED === ${currentCount}/${maxProjects}`);
                        setUpgradeRequiredPlan('pro');
                        setIsUpgradeModalOpen(true);
                        return;
                    }
                }
            } catch (e) {
                console.warn('[PROJECTS] Failed to check project limit — allowing through:', e);
            }
        }
        // -------------------------

        setIsCreating(true);
        try {
            const currentLang = (i18n.language === 'es' ? 'es' : 'en');

            // --- GATEKEEPER VALIDATION (SECURITY) ---
            // Skip validation if: no text, OR user already accepted suggestion, OR same input was already processed.
            // lastProcessedTextRef persists across failed gates (missing roles, etc) so re-presses don't re-validate.
            const currentText = combinedInput.trim();
            const alreadyProcessed = currentText !== '' && currentText === lastProcessedTextRef.current;
            if (currentText && !skipValidationRef.current && !alreadyProcessed) {
                const validation = await WarRoomService.validateTopic(combinedInput, currentLang);

                if (!validation.valid) {
                    // Clean failure: Show error
                    setValidationError(validation.reason);
                    setIsCreating(false);
                    return;
                }

                // Valid idea: show expanded business model suggestion (skip if suggestion equals original)
                if (validation.suggestion && validation.suggestion.trim() !== currentText) {
                    console.log('[VALIDATION] Idea is incomplete, showing suggestion');
                    console.log('[VALIDATION] Modules to add:', validation.addedModules);
                    setValidationError(validation.reason);
                    setSuggestedIdea(validation.suggestion);
                    setSuggestedModules(validation.addedModules || []);
                    // Remember this text was processed — next Analyze press on same text won't re-validate
                    lastProcessedTextRef.current = currentText;
                    setIsCreating(false);
                    return;
                }
            }
            // User is proceeding — mark this text as processed + clear suggestion UI
            lastProcessedTextRef.current = currentText;
            skipValidationRef.current = false;
            setSuggestedIdea(null);
            setSuggestedModules(null);
            setValidationError(null);
            // ----------------------------------------

            // --- ROLE SELECTION GATE ---
            // User must select at least one role before creating a project
            if (effectiveRoles.length === 0) {
                setValidationError(t('dashboard.enableRoles', 'Selecciona al menos un rol para ejecutar el análisis.'));
                setIsCreating(false);
                return;
            }
            // ----------------------------------------

            let newProject: Project | null = null;

            if (!saveToDatabase) {
                // Analysis-only mode — no DB save
                newProject = {
                    id: 'specialist-session',
                    userId: userId,
                    ideaOriginal: combinedInput,
                    language: currentLang,
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    blueprint: {
                        meta: {
                            projectName: 'Specialist Consultation',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            version: '1.0.0',
                            projectId: 'specialist-session',
                            language: currentLang
                        },
                        ideaOriginal: combinedInput,
                        roles: {},
                        documentationConfig: {}
                    }
                };
            } else {
                // Default to new project
                const id = await projectsService.createProject(userId, combinedInput, currentLang, resolvedMethodology);

                // SAVE CONTEXT (If available from PDF upload)
                if (fullContext) {
                    try {
                        await projectsService.saveProjectContext(id, fullContext);
                    } catch (saveError) {
                        console.error("Non-critical: Failed to save context", saveError);
                    }
                }

                setActiveProjectId(id);
                newProject = await projectsService.getProjectById(id);
                refreshProjects(); // Update the list in the other view
            }

            if (!newProject) throw new Error("Failed to create project object");

            setProject(newProject);
            setValidationError(null); // Clear any previous validation errors

            // Update URL to reflect the project — prevents losing project data on page refresh
            // (specialist-session is temp/analysis-only, don't update URL for those)
            if (newProject.id !== 'specialist-session') {
                navigate(`/app/strategy-hub?projectId=${newProject.id}`, { replace: true });
            }

            // Save squad_roles to user profile (for reference)
            if (userProfile && !isAdmin && !trialCompleted) {
                const uid = user?.uid || userProfile?.uid || '';
                try {
                    await usersService.updateTrialData(uid, { squad_roles: effectiveRoles });
                } catch (error) {
                    console.warn('[TRIAL] Failed to save squad_roles:', error);
                }
            }

            // Set initial view
            if (roles.length > 0) {
                setViewedRoleId(roles[0].roleId);
            }

            // Scroll to results
            setTimeout(() => {
                document.getElementById('role-intelligence-report')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);

        } catch (error: any) {
            console.error("Error creating project:", error);
            alert(`Failed to start analysis: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const runRoleAnalysis = async (role: RoleConfig) => {
        // Guard: processingRef covers current session; also check project state for stale Firestore processing roles
        const hasAnyProcessingRole = Object.values(project?.blueprint?.roles ?? {}).some(
            r => r?.status === 'processing'
        );
        if (!project || processingRef.current || hasAnyProcessingRole) return;

        // RACE CONDITION FIX: Acquire lock immediately (synchronously) before any await
        processingRef.current = true;
        if (activeProjectId) trackRoleStart(activeProjectId, role.roleId); // persistent tracking (sessionStorage)

        // Check if this role is already executing (prevent accidental re-triggers)
        const roleStatus = project.blueprint?.roles?.[role.roleId]?.status;
        if (roleStatus === 'processing') {
            processingRef.current = false;
            if (activeProjectId) trackRoleEnd(activeProjectId, role.roleId);
            setNotificationState({
                show: true,
                type: 'error',
                message: `${role.displayName} ya se está ejecutando...`
            });
            return;
        }

        // Track start time for duration display in notification
        const executionStartedAt = new Date().toISOString();
        roleStartTimeRef.current[role.roleId] = Date.now();

        // 0. SECURITY GUARD — Role execution gate (project-based counting)
        // Count how many roles have been executed (completed or processing) in the current project
        let executedRolesInProject = Object.values(project.blueprint?.roles ?? {})
            .filter(r => r?.status === 'completed' || r?.status === 'processing').length;

        // IMPORTANT: Re-runs COUNT as new executions against the trial limit
        // If user re-runs a completed role, increment the counter to enforce the limit
        const isReRun = project.blueprint?.roles?.[role.roleId]?.status === 'completed';
        if (isReRun) {
            executedRolesInProject += 1;
            console.log(`[TRIAL] === RE-RUN DETECTED === role: ${role.roleId} | new count: ${executedRolesInProject}`);
        }

        console.log(`[TRIAL] === INICIO ANÁLISIS: ${role.roleId} === executedInProject: ${executedRolesInProject}/${maxSelectableRoles} | trialCompleted: ${trialCompleted}`);

        if (!isAdmin) {
            // IMPORTANT: Re-runs count as NEW executions against the trial/usage limit
            // This prevents users from circumventing the free tier by re-running the same role

            if (!trialCompleted) {
                // TRIAL MODE: user gets maxSelectableRoles free executions (including re-runs)
                // At (maxSelectableRoles)th attempt → show RewardGateModal
                if (executedRolesInProject >= maxSelectableRoles) {
                    if (!postRewardRef.current && !skipGateRef.current) {
                        processingRef.current = false;
                        if (activeProjectId) trackRoleEnd(activeProjectId, role.roleId);
                        console.log(`[TRIAL] === REWARD GATE === executed ${executedRolesInProject} roles (limit: ${maxSelectableRoles}) — showing RewardGateModal`);
                        setShowRewardGate(true);
                        return;
                    }
                    // Bypass refs active — reward analysis in progress
                    console.log('[TRIAL] Reward gate bypassed via ref — permitido');
                }
            } else {
                // POST-TRIAL: trial completed — enforce monthly usage limits for ALL executions
                const usageStatus = await usageService.checkAnalysisLimit(
                    userProfile?.uid || '',
                    userProfile?.subscriptionPlan || 'free'
                );
                if (!usageStatus.allowed) {
                    processingRef.current = false;
                    if (activeProjectId) trackRoleEnd(activeProjectId, role.roleId);
                    console.log(`[TRIAL] === UPGRADE MODAL === monthly limit reached (${usageStatus.currentUsage}/${usageStatus.limit})`);
                    setUpgradeRequiredPlan('pro');
                    setIsUpgradeModalOpen(true);
                    return;
                }
            }
        }

        // Set up the processing state
        setViewedRoleId(role.roleId); // Switch view to running role

        // Optimistic update — include startedAt so AnalyzingPanel shows real elapsed time after navigation
        const newRoleOutput: RoleOutput = {
            status: 'processing',
            content: null,
            lastUpdated: new Date().toISOString(),
            startedAt: executionStartedAt
        };

        const updatedProject = {
            ...project,
            blueprint: {
                ...project.blueprint,
                roles: {
                    ...project.blueprint.roles,
                    [role.roleId]: newRoleOutput
                }
            }
        };

        // Use functional updater so concurrent state changes (e.g. synthesis completing in parallel)
        // are never overwritten. Only patch the specific role being started.
        setProject(prev => {
            if (!prev) return null;
            return {
                ...prev,
                blueprint: {
                    ...prev.blueprint,
                    roles: {
                        ...prev.blueprint.roles,
                        [role.roleId]: newRoleOutput
                    }
                }
            };
        });

        // Persist 'processing' status to Firestore immediately so polling doesn't overwrite local state
        // Without this: polling fetches Firestore (still 'pending') and overwrites local state every 2s
        if (activeProjectId) {
            await projectsService.updateBlueprintRole(activeProjectId, role.roleId, newRoleOutput);
        }

        let analysisTimeoutId: ReturnType<typeof setTimeout> | null = null;

        try {
            // Build Context from PREVIOUS roles
            const previousRolesContext = roles
                .filter(r => r.orderIndex < role.orderIndex)
                .map(r => ({
                    role: r.displayName,
                    output: updatedProject.blueprint?.roles?.[r.roleId]?.content
                }));

            // Use PromptEngine to inject technical protocols based on docConfig
            const enhancedSystemPrompt = PromptEngine.buildSystemPrompt(role);

            // ARCHITECTURE CHANGE: Inject Full PDF Context if available
            // This allows roles (like Business Analyst) to see the ENTIRE document (30+ pages)
            // even though the UI only shows the summary.
            const projectIdeaContext = fullContext
                ? `FULL DOCUMENT CONTENT:\n\n${fullContext}\n\nSUMMARY/IDEA:\n${typeof updatedProject.ideaOriginal === 'string' ? updatedProject.ideaOriginal : JSON.stringify(updatedProject.ideaOriginal)}`
                : `${typeof updatedProject.ideaOriginal === 'string' ? updatedProject.ideaOriginal : JSON.stringify(updatedProject.ideaOriginal)}`;

            const swimlaneInstruction = ['business-analyst', 'architect', 'process-architect'].includes(role.roleId)
                ? `\n        IMPORTANT DIAGRAM RULES for Process Mapping:
        1. ORGANIZACIÓN: Agrupa nodos en "Swimlanes" (carriles) usando la propiedad "group". Los carriles se mostrarán como COLUMNAS (Actor/Sistema).
        2. FLUJO: Dentro del carril, el proceso DEBE ser descendente (Top to Bottom).
        3. DECISIONES: Todo nodo "condition" DEBE tener etiquetas "Si" y "No". El motor enrutará "Si" a la DERECHA y "No" a la IZQUIERDA.
        4. TERMINALES: Asegúrate de que el nodo de tipo "end" esté presente al final de cada lógica.`
                : '';

            // ── Agile/Hybrid methodology instruction for project-manager role ─────
            const projectMethodology = updatedProject.blueprint?.meta?.methodology ?? 'pmo';
            const agileInstruction = (role.roleId === 'project-manager' && (projectMethodology === 'agile' || projectMethodology === 'hybrid'))
                ? `\n        METHODOLOGY: ${projectMethodology.toUpperCase()} MODE
        This project uses ${projectMethodology === 'agile' ? 'Agile/Scrum' : 'Hybrid (PMO + Agile)'} methodology.
        Your JSON response MUST include an "agileData" key with this exact structure:
        {
          "agileData": {
            "teamVelocity": <number — hours per sprint = teamSize × 2 × 40 × 0.7>,
            "sprints": [
              {
                "number": 1,
                "weekStart": 1,
                "weekEnd": 2,
                "goal": "Concise sprint goal describing what is delivered",
                "userStories": [
                  {
                    "id": "US-001",
                    "title": "As a [user type], I want [feature] so that [benefit]",
                    "estimate": <number — hours>,
                    "priority": "high" | "medium" | "low",
                    "acceptanceCriteria": [
                      "Given [context], when [action], then [outcome]",
                      "Criterion 2",
                      "Criterion 3"
                    ]
                  }
                ]
              }
            ]
          }
        }
        Rules:
        - Use 2-week sprints. Assign every feature to a sprint.
        - Each user story title MUST follow the "As a [user]..." format.
        - Each user story MUST have 2–4 acceptance criteria in Given/When/Then format.
        - Sort stories: high priority and critical features go in earlier sprints.
        ${projectMethodology === 'hybrid' ? '- Also include the standard "projectPhases" key for PMO planning alongside "agileData".' : '- You may also include "projectPhases" for reference.'}`
                : '';

            const promptContext = `
        Project Context: ${projectIdeaContext}
        Output Language: ${updatedProject.language === 'es' ? 'Spanish' : 'English'} (IMPORTANT: Generate all content in this language)

        Previous Analyses:
        ${buildPreviousRolesContext(previousRolesContext)}
        ${swimlaneInstruction}
        ${agileInstruction}

        Your Task:
        Perform your specific role analysis based on the complete context provided above.
        Return the result as a valid JSON object matching the requested schema.
      `;

            // 2. Enable Google Search if Role needs grounding
            const options: any = (role.grounding || role.roleId === 'ux-designer') ? { tools: [{ google_search: {} }] } : {};

            // 3. Attach Media (Images/Audio) if available and technically supported
            // Media attachments travel in options.media
            if (attachments.length > 0) {
                options.media = attachments.map(att => ({
                    mimeType: att.mimeType,
                    data: att.base64
                }));
            }

            // 4. Timeout guard — auto-cancel if AI takes too long (network loss, model hang, etc.)
            const timeoutMs = ROLE_TIMEOUTS_MS[role.roleId] ?? DEFAULT_TIMEOUT_MS;
            const timeoutMinutes = Math.round(timeoutMs / 60000);
            const timeoutPromise = new Promise<never>((_, reject) => {
                analysisTimeoutId = setTimeout(() => {
                    if (!cancelledRef.current) {
                        reject(new Error(`ANALYSIS_TIMEOUT:${timeoutMinutes}`));
                    }
                }, timeoutMs);
            });

            const result = await Promise.race([
                aiService.generateJSON(role.model, enhancedSystemPrompt, promptContext, options),
                timeoutPromise,
            ]);

            if (analysisTimeoutId) clearTimeout(analysisTimeoutId);

            // If user cancelled while the request was in-flight, discard result and reset
            if (cancelledRef.current) {
                cancelledRef.current = false;
                processingRef.current = false;
                setStoppingRoleId(null);
                return;
            }

            // 🔍 DEBUGGING: Log raw AI response
            console.log('[StrategyHub] Raw AI result for role:', role.roleId);
            console.log('[StrategyHub] Result keys:', Object.keys(result));
            if (result.dashboard) {
                console.log('[StrategyHub] dashboard keys:', Object.keys(result.dashboard));
                console.log('[StrategyHub] dashboard.sources:', result.dashboard.sources);
                console.log('[StrategyHub] dashboard.unitEconomics:', result.dashboard.unitEconomics);
            }
            console.log('[StrategyHub] result.sources:', result.sources);

            // Sanitize result to prevent Firestore "Nested arrays" error
            const sanitizedResult = sanitizeForFirestore(result);

            const completedOutput: RoleOutput = {
                status: 'completed',
                content: sanitizedResult,
                lastUpdated: new Date().toISOString()
            };

            // finalRoles is used only for the project-status count below.
            // Do NOT spread into setProject — updatedProject is stale and lacks synthesis data
            // written concurrently (e.g. user manually ran synthesis while this role was running).
            const finalRoles = {
                ...updatedProject.blueprint.roles,
                [role.roleId]: completedOutput
            };
            // Persist
            if (activeProjectId) {
                await projectsService.updateBlueprintRole(activeProjectId, role.roleId, completedOutput);

                // 2. Track Usage Success (Skip for Admins)
                if (userProfile?.rol !== 'admin') {
                    await usageService.trackUsage(userProfile?.uid || '', 'analysis_run', {
                        projectId: activeProjectId,
                        roleId: role.roleId
                    });
                    // Update remaining counter
                    setRemainingAnalyses(prev =>
                        typeof prev === 'number' ? Math.max(0, prev - 1) : prev
                    );
                }

                // Sync project status based on enabled roles completion
                {
                    const roleEntries = Object.values(finalRoles ?? {});
                    const completedCount = roleEntries.filter(r => r?.status === 'completed').length;
                    // Use enabled roles as total — 'completed' only when ALL enabled roles are done
                    const enabledRoleCount = roles.filter(r => enabledRoles.has(r.roleId)).length;
                    const newStatus: Project['status'] =
                        completedCount === 0 ? 'draft'
                        : completedCount >= enabledRoleCount ? 'completed'
                        : 'in_progress';
                    await projectsService.updateProjectStatus(activeProjectId, newStatus);
                }
            }

            // Update ref BEFORE state update to allow auto-flow to pick up next step
            processingRef.current = false;

            // Bump auto-flow tick to guarantee the auto-flow useEffect re-fires
            if (autoFlow) {
                setAutoFlowTick(prev => prev + 1);
            }

            if (postRewardRef.current) {
                console.log('[TRIAL] === REWARD ANÁLISIS COMPLETADO — setTrialCompleted(true) ===');
                setTrialCompleted(true);
            }
            postRewardRef.current = false;
            console.log(`[TRIAL] === ANÁLISIS COMPLETADO: ${role.roleId} | trial_count: ${trialCount} ===`);
            // Functional updater: merge ONLY the completed role into the CURRENT state.
            // This preserves any concurrent blueprint changes (synthesis, synthesisStatus, etc.)
            // that occurred after updatedProject was captured at the start of this execution.
            setProject(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    blueprint: {
                        ...prev.blueprint,
                        roles: {
                            ...prev.blueprint.roles,
                            [role.roleId]: completedOutput
                        }
                    }
                };
            });

            // Show completion notification with duration
            const duration = Math.round((Date.now() - (roleStartTimeRef.current[role.roleId] ?? Date.now())) / 1000);
            setNotificationState({
                show: true,
                type: 'success',
                message: `✅ ${role.displayName} completado en ${duration}s`
            });
            delete roleStartTimeRef.current[role.roleId];

        } catch (error: any) {
            if (analysisTimeoutId) clearTimeout(analysisTimeoutId);

            const isTimeout = typeof error.message === 'string' && error.message.startsWith('ANALYSIS_TIMEOUT:');
            const timeoutLimitMinutes = isTimeout ? error.message.split(':')[1] : null;

            // Elapsed time for user-facing message
            const elapsedMs = Date.now() - (roleStartTimeRef.current[role.roleId] ?? Date.now());
            const elapsedMin = Math.floor(elapsedMs / 60000);
            const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
            const elapsedStr = elapsedMin > 0 ? `${elapsedMin}m ${elapsedSec}s` : `${elapsedSec}s`;

            const lang = updatedProject.language ?? 'es';
            const timeoutContent = lang === 'en'
                ? `Analysis took more than ${timeoutLimitMinutes} minutes without completing. Please try again.`
                : `El análisis tardó más de ${timeoutLimitMinutes} minutos sin completarse. Por favor, inténtalo de nuevo.`;

            console.error(`Error running role ${role.roleId}:`, error);

            // Log to Diagnostic Center
            await loggingService.logError('StrategyHub', `Role Analysis Failed: ${role.displayName}`, {
                error: error.message,
                stack: error.stack,
                roleId: role.roleId,
                model: role.model,
                isTimeout,
                elapsedMs,
            });

            const errorOutput: RoleOutput = {
                status: 'error',
                content: isTimeout ? timeoutContent : "Analysis failed. Please try again.",
                lastUpdated: new Date().toISOString()
            };

            processingRef.current = false;

            // Bump auto-flow tick so it can recover and try next role
            if (autoFlow) {
                setAutoFlowTick(prev => prev + 1);
            }

            if (postRewardRef.current) {
                console.log('[TRIAL] === REWARD ANÁLISIS (ERROR) — setTrialCompleted(true) ===');
                setTrialCompleted(true);
            }
            postRewardRef.current = false;
            setProject(prev => prev ? ({
                ...prev,
                blueprint: {
                    ...prev.blueprint,
                    roles: {
                        ...prev.blueprint.roles,
                        [role.roleId]: errorOutput
                    }
                }
            }) : null);

            if (activeProjectId) {
                await projectsService.updateBlueprintRole(activeProjectId, role.roleId, errorOutput);
            }

            // Show error notification with elapsed time
            const notifMessage = isTimeout
                ? `⏱ ${role.displayName} tardó ${elapsedStr} sin completarse. Inténtalo de nuevo.`
                : `❌ ${role.displayName} falló. Intenta de nuevo.`;
            setNotificationState({ show: true, type: 'error', message: notifMessage });
            delete roleStartTimeRef.current[role.roleId];
        } finally {
            // CRITICAL: ALWAYS reset processingRef and session tracking to prevent the function from being blocked forever
            processingRef.current = false;
            if (activeProjectId) trackRoleEnd(activeProjectId, role.roleId);
        }
    };

    const stopRoleAnalysis = async (roleId: string) => {
        // Signal the in-flight request to be ignored when it resolves
        cancelledRef.current = true;
        processingRef.current = false;
        if (activeProjectId) trackRoleEnd(activeProjectId, roleId);
        setStoppingRoleId(roleId);

        // Reset role status to pending immediately in local state
        const pendingOutput: RoleOutput = {
            status: 'pending',
            content: null,
            lastUpdated: new Date().toISOString(),
        };
        setProject(prev => prev ? ({
            ...prev,
            blueprint: {
                ...prev.blueprint,
                roles: { ...prev.blueprint.roles, [roleId]: pendingOutput },
            },
        }) : null);

        // Persist the reset to Firestore so Firestore is in sync
        if (activeProjectId) {
            await projectsService.updateBlueprintRole(activeProjectId, roleId, pendingOutput);
        }
        setStoppingRoleId(null);
    };

    const runSynthesis = async (currentProject: Project) => {
        if (!activeProjectId) return;
        if (synthesisRunRef.current === activeProjectId) return;
        synthesisRunRef.current = activeProjectId;

        const completedRoles = roles
            .filter(r => currentProject.blueprint?.roles?.[r.roleId]?.status === 'completed')
            .map(r => ({
                roleId: r.roleId,
                displayName: r.displayName,
                content: currentProject.blueprint.roles[r.roleId].content,
            }));

        if (completedRoles.length < 2) {
            synthesisRunRef.current = null;
            return;
        }

        await projectsService.updateBlueprintSynthesis(activeProjectId, null, 'processing');
        setProject(prev => prev ? ({
            ...prev,
            blueprint: { ...prev.blueprint, synthesisStatus: 'processing' }
        }) : null);

        try {
            const lang = (i18n.language?.startsWith('es') ? 'es' : 'en') as 'en' | 'es';
            const synthesis = await generateSynthesis({
                ideaOriginal: currentProject.ideaOriginal,
                roleOutputs: completedRoles,
                language: lang,
            });

            await projectsService.updateBlueprintSynthesis(activeProjectId, synthesis, 'completed');
            setProject(prev => prev ? ({
                ...prev,
                blueprint: { ...prev.blueprint, synthesis, synthesisStatus: 'completed' }
            }) : null);
        } catch (err) {
            console.error('[Synthesis] Failed:', err);
            synthesisRunRef.current = null;
            await projectsService.updateBlueprintSynthesis(activeProjectId, null, 'error');
            setProject(prev => prev ? ({
                ...prev,
                blueprint: { ...prev.blueprint, synthesisStatus: 'error' }
            }) : null);
        }
    };

    const toggleRole = (roleId: string) => {
        // Admin has no restrictions
        if (isAdmin) {
            setActiveRoles(prev =>
                prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
            );
            return;
        }

        // Enforce maxSelectableRoles limit (applies to both trial and post-trial)
        const isActive = activeRoles.includes(roleId);
        if (!isActive && activeRoles.length >= maxSelectableRoles) {
            // Max reached — show upgrade modal
            setUpgradeRequiredPlan('pro');
            setIsUpgradeModalOpen(true);
            return;
        }

        setActiveRoles(prev =>
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleRewardComplete = (rewardRoleId: string) => {
        setShowRewardGate(false);
        // DO NOT set setTrialCompleted(true) here — it will be set AFTER the reward analysis completes
        setActiveRoles(prev => [...prev, rewardRoleId]);
        setTrialCount(3); // increment to show user has used the reward

        const uid = user?.uid || userProfile?.uid || '';
        postRewardRef.current = true; // flag: bypass security guard for this analysis cycle

        // Persist to Firestore (local state stays false until analysis completes)
        usersService.updateTrialData(uid, {
            trial_count: 3,
            trial_completed: true,
        });

        skipGateRef.current = true;

        // Run the reward role on the EXISTING project (don't create a new one)
        // The reward gate only appears after analysis 2, so `project` already exists
        const rewardRoleConfig = roles.find(r => r.roleId === rewardRoleId);
        if (rewardRoleConfig && project) {
            runRoleAnalysis(rewardRoleConfig);
        } else {
            // Fallback: if somehow no project exists, create one via handleAnalyzeIdea
            console.warn('[REWARD] No existing project found — falling back to handleAnalyzeIdea');
            handleAnalyzeIdea();
        }
    };

    // Helper to map role to icon
    const getRoleIcon = (index: number) => {
        const icons = [
            <Target size={20} />,
            <Package size={20} />,
            <Briefcase size={20} />,
            <TrendingUp size={20} />,
            <Palette size={20} />,
            <Workflow size={20} />,
            <Layout size={20} />,
            <Server size={20} />,
            <ShieldCheck size={20} />,
            <Infinity size={20} />
        ];
        return icons[index % icons.length];
    };

    // Role color palette — one unique color per slot
    const ROLE_COLORS = [
        { border: 'border-amber-400',   bg: 'bg-amber-50',   icon: 'text-amber-500',   dot: 'bg-amber-400',   avatar: 'bg-amber-400'   },
        { border: 'border-purple-400',  bg: 'bg-purple-50',  icon: 'text-purple-500',  dot: 'bg-purple-400',  avatar: 'bg-purple-400'  },
        { border: 'border-cyan-500',    bg: 'bg-cyan-50',    icon: 'text-cyan-600',    dot: 'bg-cyan-500',    avatar: 'bg-cyan-500'    },
        { border: 'border-teal-400',    bg: 'bg-teal-50',    icon: 'text-teal-600',    dot: 'bg-teal-400',    avatar: 'bg-teal-400'    },
        { border: 'border-rose-400',    bg: 'bg-rose-50',    icon: 'text-rose-500',    dot: 'bg-rose-400',    avatar: 'bg-rose-400'    },
        { border: 'border-blue-500',    bg: 'bg-blue-50',    icon: 'text-blue-600',    dot: 'bg-blue-500',    avatar: 'bg-blue-500'    },
        { border: 'border-indigo-400',  bg: 'bg-indigo-50',  icon: 'text-indigo-500',  dot: 'bg-indigo-400',  avatar: 'bg-indigo-400'  },
        { border: 'border-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-600', dot: 'bg-emerald-500', avatar: 'bg-emerald-500' },
        { border: 'border-orange-400',  bg: 'bg-orange-50',  icon: 'text-orange-500',  dot: 'bg-orange-400',  avatar: 'bg-orange-400'  },
        { border: 'border-pink-400',    bg: 'bg-pink-50',    icon: 'text-pink-500',    dot: 'bg-pink-400',    avatar: 'bg-pink-400'    },
    ];

    // Derive deliverable label from docConfig flags
    const getDeliverable = (role: any): string => {
        const cfg = role.docConfig || {};
        const parts: string[] = [];
        if (cfg.pdf || cfg.text) parts.push('DOC');
        if (cfg.ppt) parts.push('PPT');
        if (cfg.excel) parts.push('Excel');
        if (cfg.c4 || cfg.architecture || cfg.flowDiagrams) parts.push('Diagram');
        if (cfg.userStories) parts.push('Stories');
        if (cfg.marketing) parts.push('Plan Mkt');
        return parts.slice(0, 2).join(' / ') || 'Reporte';
    };

    // Short subtitle per role
    const getRoleSubtitle = (roleId: string): string => {
        const map: Record<string, string> = {
            'strategy-analyst': 'Strategy Lead',
            'product-manager':  'Product Manager',
            'business-analyst': 'Business Analyst',
            'project-manager':  'Project Lead',
            'marketing-manager':'CMO',
            'ux-designer':      'UX Designer',
            'frontend-dev':     'Frontend Dev',
            'backend-dev':      'Backend Dev',
            'qa-engineer':      'QA Lead',
            'devops':           'DevOps',
            'architect':        'CTO',
        };
        return map[roleId] || roleId;
    };

    // Timeline Logic - DYNAMIC
    const steps = roles.map((role, index) => ({
        ...role,
        title: t(`roles.${role.roleId}`, role.displayName),
        icon: getRoleIcon(index),
        enabled: enabledRoles.has(role.roleId),
        colorIdx: index,
    }));

    // Calculate progress
    const completedCount = roles.filter(r => project?.blueprint?.roles?.[r.roleId]?.status === 'completed').length;
    const totalProgress = (completedCount / Math.max(roles.length, 1)) * 100;

    const getStepStatus = (roleId: string, enabled: boolean) => {
        if (!enabled) return 'disabled';
        const output = project?.blueprint?.roles?.[roleId];
        if (output?.status === 'completed') return 'completed';
        if (output?.status === 'processing') return 'processing';
        if (output?.status === 'error') return 'error';
        if (viewedRoleId === roleId) return 'active';
        return 'pending';
    };

    // Keep spinner only when a projectId URL param exists but project hasn't loaded yet.
    // This prevents showing a blank screen while fetching a specific project.
    // When no projectId param exists (empty input screen), we render immediately —
    // the H1 "Transforma tu idea..." paints on first frame, which is the correct LCP candidate.
    const pendingProjectLoad = !project && !projectLoadError && !!searchParams.get('projectId');
    if (pendingProjectLoad) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 mb-5">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                    <p className="text-slate-700 font-semibold text-base">{t('dashboard.loading')}</p>
                    <p className="text-slate-400 text-sm mt-1">{t('dashboard.loadingSubtitle')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-full flex-col overflow-hidden">
            {projectLoadError ? (
                /* ── VISTA ERROR: Mensaje claro de qué salió mal ── */
                <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="text-center max-w-md">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error al cargar proyecto</h2>
                        <p className="text-slate-600 mb-6">{projectLoadError}</p>
                        <button
                            onClick={() => window.location.href = '/app/strategy-hub'}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Volver a proyectos
                        </button>
                    </div>
                </div>
            ) : project ? (
                /* ── VISTA 1: RESULTADOS — pantalla completa ── */
                <div className="flex-1 w-full h-full overflow-hidden">
                    <ResultsWorkspace
                        roles={steps.map(step => ({ ...step, isEnabled: true }))}
                        outputs={project.blueprint?.roles ?? {}}
                        initialRoleId={viewedRoleId ?? undefined}
                        onRunRole={(roleId) => {
                            const step = steps.find(s => s.roleId === roleId);
                            if (step) runRoleAnalysis(step);
                        }}
                        onStopRole={stopRoleAnalysis}
                        onUpdateRole={async (roleId, patch) => {
                            if (!project || !activeProjectId) return;
                            const current = project.blueprint?.roles?.[roleId];
                            if (!current) return;
                            const updatedContent = (
                                typeof patch === 'object' && patch !== null &&
                                typeof current.content === 'object' && current.content !== null
                            )
                                ? applyDeepPatch(current.content as Record<string, unknown>, patch as Record<string, unknown>)
                                : patch;
                            const updated = {
                                ...current,
                                content: updatedContent,
                                lastUpdated: new Date().toISOString(),
                            };
                            setProject(prev => prev ? {
                                ...prev,
                                blueprint: {
                                    ...prev.blueprint,
                                    roles: { ...prev.blueprint?.roles, [roleId]: updated }
                                }
                            } as Project : prev);
                            try {
                                await projectsService.updateBlueprintRole(activeProjectId, roleId, updated);
                            } catch (e) {
                                console.error('[ChatBox] Failed to persist modification:', e);
                            }
                        }}
                        project={project}
                        onConvertToMaster={handleConvertToMaster}
                        onUpgradeRequired={(requiredPlan) => {
                            setUpgradeRequiredPlan((requiredPlan as 'pro' | 'enterprise') || 'pro');
                            setIsUpgradeModalOpen(true);
                        }}
                        remainingAnalyses={isAdmin ? null : (() => {
                            if (!trialCompleted && project) {
                                const executedInProject = Object.values(project.blueprint?.roles ?? {})
                                    .filter((r: any) => r?.status === 'completed' || r?.status === 'processing').length;
                                return Math.max(0, maxSelectableRoles - executedInProject);
                            }
                            return remainingAnalyses;
                        })()}
                        canCreateNewProject={isAdmin || canCreateNewProject}
                        synthesis={project?.blueprint?.synthesis}
                        synthesisStatus={project?.blueprint?.synthesisStatus}
                        onRunSynthesis={() => {
                            synthesisRunRef.current = null;
                            if (project) runSynthesis(project);
                        }}
                    />
                </div>
            ) : (
                /* ── VISTA 2: INPUT — diseño original intacto ── */
                <div className="w-full max-w-[1100px] mx-auto space-y-8 lg:space-y-12 pb-20 overflow-y-auto flex-1 scrollbar-hide">
                    {/* Hero */}
                    <div className="text-center pt-6 lg:pt-8 pb-0">
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        Transforma tu idea en{' '}
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Estrategia Real
                        </span>
                        .
                    </h1>
                    <p className="mt-2 text-slate-400 text-sm lg:text-base max-w-lg mx-auto">
                        Describe tu idea y el equipo de IA generará un plan completo: estrategia, arquitectura, costos y riesgos.
                    </p>
                </div>

                {/* 2. AI Command Center (Input) */}
            <div id="ai-command-center" className="relative scroll-mt-24">
                {/* Auto-Start banner — shows while waiting for roles after PLG login */}
                {isAutoStartPending && !isCreating && !project && (
                    <div
                        role="status"
                        aria-live="polite"
                        aria-label={t('dashboard.autoStartLabel')}
                        className="flex items-center gap-2.5 px-4 py-2.5 mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-sm font-medium"
                    >
                        <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
                        {t('dashboard.autoStartPending')}
                    </div>
                )}

                {/* White Input Card */}
                <div className={cn("relative bg-white rounded-2xl border transition-all duration-300", isCreating ? 'border-indigo-300 ring-1 ring-indigo-100 shadow-[0_4px_24px_rgba(99,102,241,0.12)]' : 'border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)]')}>
                    <div className="p-4 lg:p-6">
                        <ContentBlockEditor
                            blocks={contentBlocks}
                            onBlocksChange={setContentBlocks}
                            disabled={isCreating || (!!project && !!activeProjectId)}
                            placeholder={t('dashboard.ideaPlaceholder')}
                            validationError={validationError}
                            onValidationErrorChange={setValidationError}
                            suggestedIdea={suggestedIdea}
                            onSuggestedIdeaChange={setSuggestedIdea}
                            suggestedModules={suggestedModules}
                            onSuggestedModulesChange={setSuggestedModules}
                            onIdeaAccepted={() => { skipValidationRef.current = true; }}
                        />

                        {/* Attachments Preview Strip */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4">
                                {attachments.map((att, idx) => (
                                    <div key={idx} className="relative group">
                                        {att.type === 'image' ? (
                                            <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                                <img src={att.url} alt="Attachment" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg border border-slate-200 flex items-center justify-center bg-slate-100">
                                                <span className="text-xs text-slate-600">Audio</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleRemoveAttachment(idx)}
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Methodology selector */}
                        {!project && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 justify-center lg:justify-start">
                                {([
                                    { id: 'pmo' as const, icon: <BarChart3 size={13} />, label: 'PMO' },
                                    { id: 'agile' as const, icon: <Zap size={13} />, label: 'Agile' },
                                    { id: 'hybrid' as const, icon: <Layers size={13} />, label: 'Hybrid' },
                                ] as const).map(({ id, icon, label }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setMethodology(id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                            methodology === id
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                        }`}
                                    >
                                        {icon}
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Bottom toolbar */}
                        <div className="flex flex-col lg:flex-row justify-between items-center mt-4 lg:mt-5 pt-3 lg:pt-4 border-t border-slate-100 gap-3 lg:gap-0">

                            {/* Left: media buttons */}
                            <div className="flex items-center gap-2 w-full lg:w-auto justify-center lg:justify-start">
                                <MicrophoneButton
                                    onTranscription={handleTranscription}
                                    onError={handleMultimediaError}
                                    disabled={isCreating || (!!project && !!activeProjectId)}
                                    variant="light"
                                />
                                <ImageUploadButton
                                    onImageProcessed={handleImageProcessed}
                                    onError={handleMultimediaError}
                                    disabled={isCreating || (!!project && !!activeProjectId)}
                                    variant="light"
                                />
                                <AudioUploadButton
                                    onAudioTranscribed={handleAudioTranscribed}
                                    onError={handleMultimediaError}
                                    disabled={isCreating || (!!project && !!activeProjectId)}
                                    variant="light"
                                />
                                <FileUploadButton
                                    onFileProcessed={handlePDFProcessed}
                                    onError={handlePDFError}
                                    disabled={isCreating || (!!project && !!activeProjectId)}
                                    variant="light"
                                />
                            </div>

                            {/* Right: Equipo seleccionado + toggle + Analyze */}
                            <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-end">

                                {/* Overlapping team avatars */}
                                {activeRoles.length > 0 && (
                                    <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
                                        <span className="text-[10px] text-slate-400 font-medium hidden lg:block whitespace-nowrap">
                                            {t('dashboard.analyzeWith', 'Equipo:')}
                                        </span>
                                        <div className="flex -space-x-2">
                                            {activeRoles.slice(0, 6).map((roleId, idx) => {
                                                const step = steps.find(s => s.roleId === roleId);
                                                if (!step) return null;
                                                const c = ROLE_COLORS[step.colorIdx % ROLE_COLORS.length];
                                                return (
                                                    <div
                                                        key={roleId}
                                                        title={step.title}
                                                        className={cn(
                                                            "w-7 h-7 rounded-full ring-2 ring-white flex items-center justify-center text-white shadow-sm shrink-0 transition-transform hover:scale-110 hover:z-10",
                                                            c.avatar
                                                        )}
                                                    >
                                                        {React.cloneElement(step.icon as React.ReactElement, { size: 12 })}
                                                    </div>
                                                );
                                            })}
                                            {activeRoles.length > 6 && (
                                                <div className="w-7 h-7 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0">
                                                    +{activeRoles.length - 6}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Grabar Proyecto toggle */}
                                {!project && (
                                    <label className="flex items-center gap-2 cursor-pointer select-none group shrink-0">
                                        <div
                                            onClick={() => setSaveToDatabase(v => !v)}
                                            className={cn(
                                                "w-8 h-4 rounded-full p-0.5 transition-all duration-200 flex items-center shrink-0",
                                                saveToDatabase ? 'bg-emerald-400' : 'bg-slate-200'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-3 h-3 rounded-full bg-white shadow transition-all duration-200",
                                                saveToDatabase ? 'translate-x-4' : 'translate-x-0'
                                            )} />
                                        </div>
                                        <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                                            {t('dashboard.recordProject', 'Grabar proyecto')}
                                        </span>
                                    </label>
                                )}

                                {/* Analyze Button */}
                                <button
                                    onClick={() => handleAnalyzeIdea()}
                                    disabled={
                                        (!combineBlocksForAI(contentBlocks).trim() && attachments.length === 0) ||
                                        isCreating ||
                                        (!!project && !!activeProjectId) ||
                                        (!isAdmin && activeRoles.length === 0)
                                    }
                                    className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 lg:px-8 py-2.5 font-semibold text-white transition-all duration-200 bg-indigo-600 hover:bg-indigo-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-sm shadow-sm"
                                >
                                    {isCreating ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Zap size={18} className="fill-white" />
                                    )}
                                    {isCreating ? t('common:creating') : t('dashboard.analyze')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Team Catalog */}
            <div id="process-flow" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            {(!isAdmin && !trialCompleted)
                                ? t('dashboard.rewardGate.squadTitle')
                                : 'Arma tu Equipo de Trabajo'}
                        </span>
                        {activeRoles.length > 0 && (
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                !isAdmin
                                    ? activeRoles.length >= maxSelectableRoles
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-amber-100 text-amber-600'
                                    : 'bg-indigo-100 text-indigo-600'
                            )}>
                                {isAdmin
                                    ? `${activeRoles.length} seleccionados`
                                    : `${activeRoles.length}/${maxSelectableRoles}`
                                }
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {project && (
                            <span className="text-xs font-medium text-slate-400">
                                {completedCount}/{roles.length}
                            </span>
                        )}
                        {autoFlow ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100">
                                <Play size={8} fill="currentColor" /> AUTO
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">
                                <PauseCircle size={8} /> MANUAL
                            </div>
                        )}
                    </div>
                </div>

                {/* Remaining analyses counter */}
                {!isAdmin && project && (() => {
                    const proj = project as Project;
                    const projectRoles = proj.blueprint?.roles ?? {};
                    const executedInProject = Object.values(projectRoles)
                        .filter((r: any) => r?.status === 'completed' || r?.status === 'processing').length;

                    if (!trialCompleted) {
                        // TRIAL MODE: show remaining free role executions in this project
                        const remaining = Math.max(0, maxSelectableRoles - executedInProject);
                        return (
                            <div className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b",
                                remaining > 0
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                                <Zap size={14} className={remaining > 0 ? "text-indigo-500" : "text-amber-500"} />
                                {remaining > 0
                                    ? t('dashboard.remainingAnalyses', {
                                        count: remaining,
                                        defaultValue: `Te quedan {{count}} análisis gratuitos`
                                    })
                                    : t('dashboard.noRemainingAnalyses', {
                                        defaultValue: 'Has alcanzado el límite de análisis gratuitos. ¡Califica para ganar 1 más!'
                                    })
                                }
                            </div>
                        );
                    } else if (remainingAnalyses !== null && remainingAnalyses !== 'unlimited') {
                        // POST-TRIAL: show monthly usage limit
                        return (
                            <div className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b",
                                (remainingAnalyses as number) > 0
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                                <Zap size={14} className={(remainingAnalyses as number) > 0 ? "text-indigo-500" : "text-amber-500"} />
                                {(remainingAnalyses as number) > 0
                                    ? t('dashboard.remainingAnalyses', {
                                        count: remainingAnalyses,
                                        defaultValue: `Te quedan {{count}} análisis este mes`
                                    })
                                    : t('dashboard.noRemainingAnalyses', {
                                        defaultValue: 'Has alcanzado el límite de análisis de tu plan este mes.'
                                    })
                                }
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Progress bar — only when project is running */}
                {project && (
                    <div className="h-0.5 bg-slate-100">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                            style={{ width: `${Math.max(2, totalProgress)}%` }}
                        />
                    </div>
                )}

                {/* Large catalog cards */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {steps.map((step) => {
                        const isActive   = activeRoles.includes(step.roleId);
                        // Quantity-based model: no individual roles are locked
                        // Limit is enforced in toggleRole by maxSelectableRoles
                        const isLocked   = false;
                        const status     = getStepStatus(step.roleId, step.enabled);
                        const isProcessing = status === 'processing';
                        const isCompleted  = status === 'completed';
                        const isError      = status === 'error';
                        const c = ROLE_COLORS[step.colorIdx % ROLE_COLORS.length];

                        return (
                            <div
                                key={step.roleId}
                                onClick={() => {
                                    if (isLocked) {
                                        loggingService.logInfo('subscription', 'role_locked_click', {
                                            roleId: step.roleId,
                                            requiredPlan: (step as any).requiredPlan,
                                            userPlan: userProfile?.subscriptionPlan || 'unknown'
                                        });
                                        setUpgradeRequiredPlan((step as any).requiredPlan);
                                        setIsUpgradeModalOpen(true);
                                        return;
                                    }
                                    toggleRole(step.roleId);
                                    if (project) setViewedRoleId(step.roleId);
                                }}
                                className={cn(
                                    "group relative flex flex-col items-center text-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 select-none",
                                    isLocked
                                        ? 'border-slate-100 bg-slate-50 cursor-default opacity-60'
                                        : isActive
                                            ? `${c.border} ${c.bg} shadow-md cursor-pointer`
                                            : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer'
                                )}
                            >
                                {/* Active dot */}
                                {isActive && !isLocked && (
                                    <span className={cn("absolute top-2.5 right-2.5 w-2 h-2 rounded-full", c.dot)} />
                                )}

                                {/* Processing spinner */}
                                {isProcessing && (
                                    <span className="absolute top-2.5 left-2.5">
                                        <Loader2 size={11} className="text-blue-500 animate-spin" />
                                    </span>
                                )}

                                {/* Completed check + re-run on hover */}
                                {isCompleted && !isProcessing && (
                                    <>
                                        <span className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        </span>
                                        {!isLocked && project && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); runRoleAnalysis(step); }}
                                                title="Re-run"
                                                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-150 w-5 h-5 rounded-full bg-slate-700 hover:bg-indigo-600 flex items-center justify-center shadow-md"
                                            >
                                                <RotateCcw size={9} className="text-white" />
                                            </button>
                                        )}
                                    </>
                                )}

                                {/* Error indicator */}
                                {isError && (
                                    <span className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    </span>
                                )}

                                {/* Lock badge */}
                                {isLocked && (
                                    <div className="absolute top-2 right-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <Lock size={6} />
                                        <span>{(step as any).requiredPlan?.toUpperCase()?.substring(0, 3)}</span>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                                    isActive && !isLocked
                                        ? `${c.bg} ${c.icon}`
                                        : 'bg-slate-100 text-slate-400'
                                )}>
                                    {React.cloneElement(step.icon as React.ReactElement, { size: 22 })}
                                </div>

                                {/* Name + subtitle */}
                                <div>
                                    <p className={cn(
                                        "text-[12px] font-bold leading-tight",
                                        isActive && !isLocked ? 'text-slate-800' : 'text-slate-500'
                                    )}>
                                        {step.title}
                                    </p>
                                    <p className={cn(
                                        "text-[9px] font-semibold uppercase tracking-wider mt-0.5",
                                        isActive && !isLocked ? c.icon : 'text-slate-300'
                                    )}>
                                        {getRoleSubtitle(step.roleId)}
                                    </p>
                                </div>

                                {/* Deliverable */}
                                <p className="text-[9px] text-slate-400 leading-tight">
                                    Entregable: {getDeliverable(step)}
                                </p>

                                {/* Run button — manual mode, active, project loaded */}
                                {!autoFlow && isActive && !isLocked && project && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isProcessing) runRoleAnalysis(step);
                                        }}
                                        disabled={isProcessing}
                                        title={isProcessing ? `${step.title} ya se está ejecutando...` : undefined}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-semibold transition-all",
                                            isProcessing
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                                                : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200'
                                        )}
                                    >
                                        {isProcessing
                                            ? <><Loader2 size={9} className="animate-spin" /> Ejecutando...</>
                                            : <><Play size={9} fill="currentColor" /> Ejecutar</>
                                        }
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

                </div>
            )}

            {/* Reward Gate Modal */}
            {showRewardGate && (
                <RewardGateModal
                    isOpen={showRewardGate}
                    squadRoles={activeRoles}
                    availableRoles={roles}
                    userId={user?.uid || userProfile?.uid || ''}
                    projectId={activeProjectId || ''}
                    onComplete={handleRewardComplete}
                />
            )}

            {/* Modals — disponibles en ambas vistas */}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                requiredPlan={upgradeRequiredPlan}
                currentPlan={userProfile?.subscriptionPlan || 'free'}
                onUpgrade={() => setIsUpgradeModalOpen(false)}
            />

            {pdfPreviewContent && (
                <SmartPreviewModal
                    isOpen={isPdfPreviewOpen}
                    content={pdfPreviewContent}
                    onConfirm={handlePDFPreviewConfirm}
                    onCancel={() => setIsPdfPreviewOpen(false)}
                />
            )}

            {audioPreviewContent && (
                <AudioPreviewModal
                    isOpen={isAudioPreviewOpen}
                    content={audioPreviewContent}
                    onConfirm={handleAudioPreviewConfirm}
                    onCancel={() => setIsAudioPreviewOpen(false)}
                />
            )}

            {/* Toast Notification — Role completion/error feedback */}
            {notificationState.show && (
                <div className={cn(
                    "fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg font-semibold text-sm transition-all duration-300 z-50 animate-in slide-in-from-bottom-4",
                    notificationState.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                )}>
                    {notificationState.message}
                </div>
            )}
        </div>
    );
}

