import { useState, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle2, Loader2, AlertCircle, Briefcase, Layers,
    Sparkles, BarChart3, Terminal, ShieldCheck, Users, User,
    PanelLeftClose, PanelLeftOpen,
    FileText, FileSpreadsheet, MonitorPlay, FileType, FileJson, FileCode,
    RotateCcw, Square, GitMerge, Lock, Play, RefreshCw, MessageSquare, Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import { RoleConfig } from '../types/roles';
import { RoleOutput, Project, SynthesisOutput } from '../types/blueprint';
import RolePanel from './RolePanel';
// Export generators are lazy-imported on click — they add ~460 KB to the bundle
// and are never needed until the user explicitly requests a download.

const SynthesisDashboard = lazy(() => import('./dashboard/SynthesisDashboard'));

const SYNTHESIS_ROLE_ID = '__synthesis__';

const SYNTHESIS_STEPS_EN = [
    'Reading all role outputs...',
    'Identifying alignments and consensus...',
    'Detecting tensions and blockers...',
    'Ranking unified risks...',
    'Synthesizing team verdict...',
];
const SYNTHESIS_STEPS_ES = [
    'Leyendo todos los análisis de roles...',
    'Identificando alineaciones y consensos...',
    'Detectando tensiones y bloqueos...',
    'Clasificando riesgos unificados...',
    'Sintetizando veredicto del equipo...',
];

function SynthesisProcessingPanel({ completedRolesCount }: { completedRolesCount: number }) {
    const { t, i18n } = useTranslation('project');
    const [stepIndex, setStepIndex] = useState(0);
    const steps = i18n.language === 'es' ? SYNTHESIS_STEPS_ES : SYNTHESIS_STEPS_EN;

    useState(() => {
        const interval = setInterval(() => {
            setStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 2500);
        return () => clearInterval(interval);
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
            <div className="space-y-2">
                <p className="text-slate-800 font-semibold text-base">{t('synthesis.generatingFull')}</p>
                <p className="text-indigo-500 text-sm font-medium">{steps[stepIndex]}</p>
            </div>
            <div className="flex gap-1.5">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-1.5 rounded-full transition-all duration-500',
                            i <= stepIndex ? 'bg-indigo-500 w-6' : 'bg-slate-200 w-3'
                        )}
                    />
                ))}
            </div>
            <p className="text-xs text-slate-400">{t('rolePanel.analysisTimeNote')}</p>
            <p className="text-xs text-slate-400">{t('synthesis.panelSubtitle', { count: completedRolesCount })}</p>
        </div>
    );
}

interface ResultsWorkspaceProps {
    roles: RoleConfig[];
    outputs: Record<string, RoleOutput | undefined>;
    initialRoleId?: string;
    onRunRole: (roleId: string) => void;
    onStopRole?: (roleId: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdateRole: (roleId: string, data: any) => void;
    project: Project;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
    onUpgradeRequired?: (requiredPlan?: string) => void;
    remainingAnalyses?: number | 'unlimited' | null;
    canCreateNewProject?: boolean;
    readOnly?: boolean;
    synthesis?: SynthesisOutput;
    synthesisStatus?: 'pending' | 'processing' | 'completed' | 'error';
    onRunSynthesis?: () => void;
}

// ─── Visual dictionary ────────────────────────────────────────────────────────
const ROLE_STYLES: Record<string, { icon: React.ReactElement; color: string; ring: string; bg: string; text: string }> = {
    'Strategy Analyst': { icon: <Briefcase size={18} />, color: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-400', text: 'text-yellow-700' },
    'Product Manager': { icon: <Layers size={18} />, color: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-400', text: 'text-purple-700' },
    'Marketing Manager': { icon: <Sparkles size={18} />, color: 'text-pink-600', bg: 'bg-pink-50', ring: 'ring-pink-400', text: 'text-pink-700' },
    'Business Analyst': { icon: <BarChart3 size={18} />, color: 'text-cyan-600', bg: 'bg-cyan-50', ring: 'ring-cyan-400', text: 'text-cyan-700' },
    'Software Architect': { icon: <Terminal size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-400', text: 'text-blue-700' },
    'QA Engineer': { icon: <ShieldCheck size={18} />, color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-400', text: 'text-green-700' },
};
const DEFAULT_STYLE = { icon: <Briefcase size={18} />, color: 'text-slate-600', bg: 'bg-slate-100', ring: 'ring-slate-300', text: 'text-slate-700' };

interface SynthesisChatPanelProps {
    synthesis: any;
    onSendMessage: (message: string) => Promise<string>;
    lang?: 'es' | 'en';
}

const SYNTHESIS_QUICK_ACTIONS: Record<string, string[]> = {
    es: [
        '¿Por qué el veredicto fue PIVOT?',
        '¿Cuál es el riesgo más importante?',
        '¿En qué están de acuerdo todos los roles?',
    ],
    en: [
        'Why was the verdict PIVOT?',
        'What is the most critical risk?',
        'What do all roles agree on?',
    ],
};

function SynthesisChatPanel({ synthesis, onSendMessage, lang = 'es' }: SynthesisChatPanelProps) {
    const { i18n } = useTranslation('project');
    const currentLang = lang || (i18n.language === 'es' ? 'es' : 'en');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
        ...(synthesis.feedback
            ? synthesis.feedback.split('\n\n').filter((line: string) => line.trim()).map((line: string) => {
                if (line.startsWith('User:')) return { role: 'user' as const, content: line.replace('User: ', '') };
                if (line.startsWith('Assistant:')) return { role: 'assistant' as const, content: line.replace('Assistant: ', '') };
                return null;
            }).filter(Boolean)
            : [])
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useState(() => {
        scrollToBottom();
    });

    const handleSubmit = async (e: React.FormEvent, message?: string) => {
        e.preventDefault();
        const finalMessage = message || input.trim();
        if (!finalMessage || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: finalMessage }]);
        setIsLoading(true);

        try {
            const response = await onSendMessage(finalMessage);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: currentLang === 'es' ? 'Error al procesar tu pregunta. Intenta de nuevo.' : 'Error processing your question. Try again.' }]);
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    const handleQuickAction = (action: string) => {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent, action);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-96">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center">
                        <p className="text-center text-slate-400 text-sm mb-4">
                            {currentLang === 'es' ? 'Haz una pregunta sobre el informe de síntesis' : 'Ask a question about the synthesis report'}
                        </p>
                        <div className="w-full space-y-2">
                            {SYNTHESIS_QUICK_ACTIONS[currentLang].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickAction(action)}
                                    disabled={isLoading}
                                    className="w-full text-left px-3 py-2 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.length > 0 && (
                    <>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    'flex gap-2',
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs">
                                        <Sparkles size={14} className="text-indigo-600" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'max-w-xs px-3 py-2 rounded-lg text-sm',
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-800'
                                    )}
                                >
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0 text-xs">
                                        <User size={14} className="text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                                </div>
                                <div className="bg-slate-100 px-3 py-2 rounded-lg text-slate-500 text-xs">
                                    {currentLang === 'es' ? 'Pensando...' : 'Thinking...'}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={currentLang === 'es' ? 'Pregunta sobre la síntesis...' : 'Ask about synthesis...'}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResultsWorkspace({
    roles,
    outputs,
    initialRoleId,
    onRunRole,
    onStopRole,
    onUpdateRole,
    project,
    onConvertToMaster,
    onUpgradeRequired,
    remainingAnalyses,
    readOnly = false,
    synthesis,
    synthesisStatus,
    onRunSynthesis,
}: ResultsWorkspaceProps) {
    const { t, i18n } = useTranslation('project');

    // Todos los roles son visibles en el sidebar; isEnabled determina si pueden ejecutarse
    const enabledRoles = roles;
    const defaultRole = initialRoleId
        ? (enabledRoles.find(r => r.roleId === initialRoleId) ?? enabledRoles[0])
        : enabledRoles[0];

    const [selectedRoleId, setSelectedRoleId] = useState<string>(defaultRole?.roleId ?? '');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [synthesisChatOpen, setSynthesisChatOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const isSynthesisSelected = selectedRoleId === SYNTHESIS_ROLE_ID;
    const completedRolesCount = enabledRoles.filter(r => outputs[r.roleId]?.status === 'completed').length;
    // Stale if: new roles completed since last synthesis, OR any previously-analyzed role was re-run after synthesis
    const hasNewRoles = synthesisStatus === 'completed' && !!synthesis && (synthesis.rolesAnalyzed?.length ?? 0) < completedRolesCount;
    const hasRerunRoles = synthesisStatus === 'completed' && !!synthesis && (synthesis.rolesAnalyzed ?? []).some(roleId => {
        const output = outputs[roleId];
        return output?.status === 'completed' && output.lastUpdated && synthesis.generatedAt
            && output.lastUpdated > synthesis.generatedAt;
    });
    const isStale = hasNewRoles || hasRerunRoles;

    // Roles completed after the last synthesis run (by name, for the stale banner)
    const newRolesSinceLastSynthesis = synthesis?.rolesAnalyzed
        ? enabledRoles
            .filter(r => outputs[r.roleId]?.status === 'completed' && !synthesis.rolesAnalyzed.includes(r.roleId))
            .map(r => r.displayName)
        : [];

    type SynthesisState = 'locked' | 'ready' | 'stale' | 'processing' | 'completed' | 'error';
    const synthState: SynthesisState = (() => {
        if (completedRolesCount < 2) return 'locked';
        if (synthesisStatus === 'processing') return 'processing';
        if (synthesisStatus === 'error') return 'error';
        if (synthesisStatus === 'completed' && isStale) return 'stale';
        if (synthesisStatus === 'completed') return 'completed';
        return 'ready';
    })();

    const selectedRole = isSynthesisSelected
        ? undefined
        : (enabledRoles.find(r => r.roleId === selectedRoleId) ?? enabledRoles[0]);
    const selectedOutput = selectedRole ? outputs[selectedRole.roleId] : undefined;

    // Determine if another role (not the selected one) is currently executing
    const executingRole = enabledRoles.find(r =>
        r.roleId !== selectedRole?.roleId && outputs[r.roleId]?.status === 'processing'
    );
    const anotherRoleExecuting = !!executingRole;

    // ─── Export handlers (lifted from RolePanel) ─────────────────────────────
    const buildBlueprint = () => {
        if (!selectedRole || !selectedOutput) return null;
        return project ? {
            ...project.blueprint,
            roles: { ...project.blueprint.roles, [selectedRole.roleId]: selectedOutput }
        } : {
            meta: { projectName: `${selectedRole.displayName} Report`, version: '1.0', createdAt: new Date().toISOString() },
            ideaOriginal: 'N/A',
            roles: { [selectedRole.roleId]: selectedOutput }
        };
    };

    const handleDownloadDoc = async () => {
        if (!selectedOutput?.content || !selectedRole) return;
        const { docxGenerator } = await import('../services/export/docxGenerator');

        // Project Manager has specialized PMBOK doc
        if (selectedRole.roleId === 'project-manager') {
            const bp = buildBlueprint();
            if (!bp) return;
            docxGenerator.generateReport(bp as any, [selectedRole]);
        } else {
            // Generic roles: use new professional doc generator
            const { normalizeRoleOutput } = await import('../services/export/contentNormalizer');
            const content = typeof selectedOutput.content === 'string'
                ? JSON.parse(selectedOutput.content)
                : selectedOutput.content;

            if (content && typeof content === 'object') {
                const lang = i18n.language === 'es' ? 'es' : 'en';
                const normalizedDoc = normalizeRoleOutput(
                    selectedRole.roleId,
                    selectedRole.displayName,
                    content,
                    project?.blueprint?.meta?.projectName || 'Project Report',
                    lang
                );
                await docxGenerator.generateGenericRoleDoc(normalizedDoc, selectedRole, lang);
            }
        }
    };

    const handleDownloadExcel = async () => {
        if (!selectedOutput?.content || !selectedRole) return;
        const { excelGenerator } = await import('../services/export/excelGenerator');

        // Project Manager has a specialized multi-sheet spreadsheet — keep it as-is (PROTECTED)
        if (selectedRole.roleId === 'project-manager') {
            const bp = buildBlueprint();
            if (!bp) return;
            excelGenerator.generateSpreadsheet(bp as any, [selectedRole]);
            return;
        }

        // All other roles: NormalizedDocument gives consistent, role-appropriate content
        const content = typeof selectedOutput.content === 'string'
            ? JSON.parse(selectedOutput.content)
            : selectedOutput.content;
        if (!content || typeof content !== 'object') return;

        const { normalizeRoleOutput } = await import('../services/export/contentNormalizer');
        const lang = i18n.language === 'es' ? 'es' : 'en';
        const normalizedDoc = normalizeRoleOutput(
            selectedRole.roleId,
            selectedRole.displayName,
            content,
            project?.blueprint?.meta?.projectName || 'Project Report',
            lang
        );
        excelGenerator.generateGenericSpreadsheet(normalizedDoc, selectedRole, true);
    };

    const handleDownloadPPT = async () => {
        if (!selectedOutput?.content || !selectedRole) return;
        const { pptGenerator } = await import('../services/export/pptGenerator');

        const content = typeof selectedOutput.content === 'string'
            ? JSON.parse(selectedOutput.content)
            : selectedOutput.content;

        if (content && typeof content === 'object') {
            const projectName = project?.blueprint?.meta?.projectName || 'Project Report';
            const lang = i18n.language === 'es' ? 'es' : 'en';
            // exportRegistry handles routing to premium or generic generator — no role checks here
            await pptGenerator.generateRolePPT(content, selectedRole, lang, projectName);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedRole || !selectedOutput?.content) return;
        const { pdfGenerator } = await import('../services/export/pdfGenerator');
        const { normalizeRoleOutput } = await import('../services/export/contentNormalizer');

        // Try programmatic PDF with structured content
        try {
            const content = typeof selectedOutput.content === 'string'
                ? JSON.parse(selectedOutput.content)
                : selectedOutput.content;

            if (content && typeof content === 'object') {
                const normalizedDoc = normalizeRoleOutput(
                    selectedRole.roleId,
                    selectedRole.displayName,
                    content,
                    project?.blueprint?.meta?.projectName || 'Project Report',
                    'es' // TODO: use current language from i18n
                );
                await pdfGenerator.generateProgrammaticPDF(
                    selectedRole.roleId,
                    selectedRole.displayName,
                    normalizedDoc,
                    project?.blueprint?.meta?.projectName || 'Project Report',
                    'es'
                );
            } else {
                throw new Error('Invalid content structure');
            }
        } catch (error) {
            console.warn('Programmatic PDF generation failed, falling back to screenshot:', error);
            // Fallback to screenshot method
            try {
                await pdfGenerator.generateScreenshotPDF(
                    `role-content-${selectedRole.roleId}`,
                    `${selectedRole.displayName}_Report`
                );
            } catch (screenshotError) {
                console.error('Screenshot PDF generation also failed:', screenshotError);
                alert('No se pudo generar el PDF. Intenta nuevamente.');
            }
        }
    };

    const handleDownloadJSON = async () => {
        if (!selectedOutput?.content || !selectedRole) return;
        let data = selectedOutput.content;
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch { /* ignore */ } }
        const { jsonGenerator } = await import('../services/export/jsonGenerator');
        jsonGenerator.downloadJSON(data, `${selectedRole.displayName}_Data`);
    };

    const handleDownloadMarkdown = async () => {
        if (!selectedOutput?.content || !selectedRole) return;
        const content = typeof selectedOutput.content === 'string'
            ? selectedOutput.content
            : JSON.stringify(selectedOutput.content, null, 2);
        const { markdownGenerator } = await import('../services/export/markdownGenerator');
        markdownGenerator.downloadMarkdown(content, `${selectedRole.displayName}_Notes`);
    };

    const handleDownloadSynthesisPPT = async () => {
        if (!synthesis) return;
        const { synthesisPPT } = await import('../services/export/ppt/synthesisPPT');
        const projectName = project?.blueprint?.meta?.projectName || 'Project';
        const lang = i18n.language === 'es' ? 'es' : 'en';
        await synthesisPPT.generate(synthesis, projectName, lang as 'es' | 'en');
    };

    const handleSynthesisChatSubmit = async (message: string): Promise<string> => {
        if (!synthesis || !project) {
            throw new Error('Synthesis or project not available');
        }

        // Defensive normalization: legacy synthesis docs in Firestore may have Spanish enum values
        // ("PROCEDER", "PIVOTAR", "DETENER"). Normalize to canonical English BEFORE passing to AI.
        const normalizeVerdict = (raw: unknown): 'PROCEED' | 'PIVOT' | 'HALT' => {
            if (typeof raw !== 'string') return 'PIVOT';
            const v = raw.trim().toUpperCase();
            if (v === 'PROCEDER' || v === 'PROCEED' || v === 'AVANZAR' || v === 'CONTINUAR') return 'PROCEED';
            if (v === 'PIVOT' || v === 'PIVOTAR' || v === 'AJUSTAR' || v === 'GIRAR') return 'PIVOT';
            if (v === 'HALT' || v === 'DETENER' || v === 'PARAR' || v === 'ABANDONAR') return 'HALT';
            return 'PIVOT';
        };
        const canonicalVerdict = normalizeVerdict(synthesis.teamVerdict);
        const normalizedSynthesis = { ...synthesis, teamVerdict: canonicalVerdict };

        // Build context for chat response — explicitly state the canonical verdict at the top
        const synthContext = `
═══════════════════════════════════════════════════════════
OFFICIAL TEAM VERDICT (SOURCE OF TRUTH): ${canonicalVerdict}
═══════════════════════════════════════════════════════════

SYNTHESIS REPORT DATA:
${JSON.stringify(normalizedSynthesis, null, 2)}

PROJECT IDEA:
${project.blueprint.ideaOriginal}

USER QUESTION:
${message}
        `;

        try {
            const { geminiService } = await import('../services/gemini/geminiService');
            const lang = i18n.language === 'es' ? 'es' : 'en';
            const langInstruction = lang === 'es'
                ? 'Responde en español. Sé conciso (máximo 1-2 párrafos).'
                : 'Respond in English. Be concise (max 1-2 paragraphs).';

            const systemPrompt = `You are an expert analyst answering questions about a business synthesis report.

CRITICAL RULES:
1. ONLY use information from the provided SYNTHESIS REPORT DATA. Never make assumptions or use general knowledge.
2. The teamVerdict field ALWAYS contains the definitive decision: PROCEED, PIVOT, or HALT. This is the SOURCE OF TRUTH.
3. If teamVerdict and verdictRationale contradict each other, ALWAYS trust teamVerdict and ignore the contradictory rationale.
4. If the user asks "Why PIVOT?" and teamVerdict="PIVOT", explain based on teamVerdict, tensions, and topRisks (ignore contradictory rationale if present).
5. If the user asks "Why PROCEED?" but teamVerdict="PIVOT", clearly state: "The verdict was PIVOT, not PROCEED" and explain based on the actual teamVerdict value and supporting data.
6. NEVER contradict the teamVerdict value under any circumstances. If you see contradictions in the JSON, mention them to the user and explain that teamVerdict is the official decision.
7. Base all answers on the actual data in the JSON, not on assumptions.
8. Cite specific sources when mentioning roles or data points (e.g., "According to the Strategy Analyst..." or "From the tensions analysis...").
9. NEVER expose internal JSON field names to the user. Instead use natural language equivalents:
   - verdictRationale → "el razonamiento del veredicto" / "the verdict rationale"
   - topRisks → "los principales riesgos identificados" / "the top risks identified"
   - teamVerdict → "el veredicto del equipo" / "the team verdict"
   - alignments → "los puntos de consenso" / "the consensus points"
   - tensions → "los puntos de tensión" / "the tension points"
   - verdictConfidence → "el nivel de confianza del análisis" / "the analysis confidence level"
   - numberReconciliation → "la reconciliación de datos numéricos" / "the numerical data reconciliation"

${langInstruction}`;

            const response = await geminiService.generateText(
                'gemini-2.5-pro',
                systemPrompt,
                synthContext
            );

            // Update synthesis feedback (chat history)
            if (project) {
                const feedbackContent = (synthesis.feedback || '') + `\n\nUser: ${message}\n\nAssistant: ${response}`;
                onUpdateRole('__synthesis__', { feedback: feedbackContent });
            }

            return response;
        } catch (error) {
            console.error('Synthesis chat error:', error);
            throw error;
        }
    };

    // ─── Guard ────────────────────────────────────────────────────────────────
    if (roles.length === 0) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
                No hay roles disponibles.
            </div>
        );
    }

    const currentStyle = ROLE_STYLES[selectedRole?.displayName ?? ''] || DEFAULT_STYLE;
    const hasOutput = selectedOutput?.status === 'completed';

    return (
        <div className="flex w-full h-full bg-slate-50">

            {/* ── Sidebar (Navegación de Roles) ── */}
            <aside className={cn(
                "bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-[500px] transition-all duration-300",
                isSidebarCollapsed ? "w-20" : "w-64 lg:w-72"
            )}>
                {/* Sidebar header */}
                <div className={cn(
                    "p-4 border-b border-gray-100 bg-slate-50/50 flex items-center",
                    isSidebarCollapsed ? "justify-center" : "justify-between"
                )}>
                    {!isSidebarCollapsed && (
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Users size={14} /> {t('rolePanel.teamExecuted')}
                        </h3>
                    )}
                    <button
                        onClick={() => setIsSidebarCollapsed(v => !v)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                        title={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        {isSidebarCollapsed
                            ? <PanelLeftOpen size={16} />
                            : <PanelLeftClose size={16} />
                        }
                    </button>
                </div>

                {/* Role list */}
                <nav className={cn("p-2 space-y-1 overflow-y-auto flex-1", isSidebarCollapsed && "flex flex-col items-center")}>
                    {enabledRoles.map(role => {
                        const status = outputs[role.roleId]?.status ?? 'pending';
                        const isSelected = role.roleId === selectedRoleId;
                        const style = ROLE_STYLES[role.displayName] || DEFAULT_STYLE;

                        if (isSidebarCollapsed) {
                            return (
                                <div key={role.roleId} className="group relative">
                                    <button
                                        onClick={() => setSelectedRoleId(role.roleId)}
                                        title={role.displayName}
                                        className={cn(
                                            "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                            isSelected
                                                ? `${style.bg} ${style.color} ring-2 ${style.ring} shadow-sm`
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                    >
                                        {style.icon}
                                        {status === 'completed' && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full group-hover:opacity-0 transition-opacity" />
                                        )}
                                        {status === 'processing' && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-indigo-400 border-2 border-white rounded-full animate-pulse" />
                                        )}
                                        {status === 'error' && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-400 border-2 border-white rounded-full" />
                                        )}
                                    </button>
                                    {status === 'completed' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRunRole(role.roleId); }}
                                            title="Re-ejecutar"
                                            className="absolute -bottom-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 w-4 h-4 rounded-full bg-slate-700 hover:bg-indigo-600 flex items-center justify-center shadow-md"
                                        >
                                            <RotateCcw size={8} className="text-white" />
                                        </button>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div
                                key={role.roleId}
                                className={cn(
                                    "group w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer",
                                    isSelected
                                        ? `bg-slate-50 shadow-sm ring-1 border border-gray-200 ${style.ring}`
                                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                )}
                                onClick={() => setSelectedRoleId(role.roleId)}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        isSelected ? `${style.bg} ${style.color}` : "bg-slate-100 text-slate-500"
                                    )}>
                                        {style.icon}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={cn("text-sm font-semibold truncate", isSelected ? style.text : "")}>
                                            {role.displayName}
                                        </span>
                                        {status === 'processing' && (
                                            <span className="text-[10px] text-indigo-500 flex items-center gap-1">
                                                <Loader2 size={10} className="animate-spin" /> Generando...
                                            </span>
                                        )}
                                        {status === 'error' && (
                                            <span className="text-[10px] text-red-500 flex items-center gap-1">
                                                <AlertCircle size={10} /> Error
                                            </span>
                                        )}
                                        {status !== 'processing' && status !== 'error' && status !== 'completed' && (
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {t('rolePanel.pending')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Processing: show stop (square) button */}
                                {status === 'processing' && onStopRole && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onStopRole(role.roleId); }}
                                        title="Detener análisis"
                                        className="shrink-0 w-6 h-6 rounded bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-sm transition-colors"
                                    >
                                        <Square size={10} className="text-white fill-white" />
                                    </button>
                                )}
                                {/* Completed: show checkmark, swap to re-run button on hover */}
                                {status === 'completed' && (
                                    <div className="shrink-0 relative w-6 h-6 flex items-center justify-center">
                                        <CheckCircle2
                                            size={16}
                                            className={cn(
                                                "absolute transition-opacity duration-150 group-hover:opacity-0",
                                                isSelected ? 'text-indigo-600' : 'text-green-500 opacity-50'
                                            )}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRunRole(role.roleId); }}
                                            title="Re-ejecutar"
                                            className="absolute opacity-0 group-hover:opacity-100 transition-all duration-150 w-6 h-6 rounded-full bg-slate-700 hover:bg-indigo-600 flex items-center justify-center shadow-md"
                                        >
                                            <RotateCcw size={10} className="text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Synthesis card — always visible, adapts to 6-state machine */}
                <div className="px-3 pb-1">
                    <div className="border-t border-dashed border-slate-200 my-2" />
                    <div
                        className={cn(
                            "group w-full flex items-center justify-between p-3 rounded-xl text-left transition-all",
                            synthState === 'locked'
                                ? "cursor-pointer hover:bg-slate-50 text-slate-400"
                                : "cursor-pointer",
                            synthState !== 'locked' && (isSynthesisSelected
                                ? "bg-indigo-50 shadow-sm ring-1 border border-indigo-200 ring-indigo-300"
                                : "hover:bg-indigo-50 text-slate-600 hover:text-indigo-700"),
                            synthState === 'stale' && !isSynthesisSelected && "border border-amber-200 bg-amber-50/50 hover:bg-amber-50"
                        )}
                        onClick={() => setSelectedRoleId(SYNTHESIS_ROLE_ID)}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                synthState === 'locked' && "bg-slate-100 text-slate-400",
                                synthState === 'ready' && (isSynthesisSelected ? "bg-indigo-100 text-indigo-600" : "bg-indigo-50 text-indigo-500"),
                                synthState === 'stale' && "bg-amber-100 text-amber-600",
                                synthState === 'processing' && "bg-indigo-100 text-indigo-600",
                                synthState === 'completed' && "bg-indigo-100 text-indigo-600",
                                synthState === 'error' && "bg-red-100 text-red-500",
                            )}>
                                {synthState === 'locked'     && <Lock size={16} />}
                                {synthState === 'ready'      && <Play size={16} />}
                                {synthState === 'stale'      && <RefreshCw size={16} />}
                                {synthState === 'processing' && <Loader2 size={16} className="animate-spin" />}
                                {synthState === 'completed'  && <GitMerge size={16} />}
                                {synthState === 'error'      && <AlertCircle size={16} />}
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                        "text-sm font-semibold truncate",
                                        synthState === 'locked' && "text-slate-400",
                                        synthState === 'ready' && (isSynthesisSelected ? "text-indigo-700" : "text-slate-600"),
                                        synthState === 'stale' && "text-amber-700",
                                        synthState === 'processing' && "text-indigo-700",
                                        synthState === 'completed' && (isSynthesisSelected ? "text-indigo-700" : "text-slate-700"),
                                        synthState === 'error' && "text-red-600",
                                    )}>
                                        {t('synthesis.cardTitle')}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] flex items-center gap-1",
                                        synthState === 'locked' && "text-slate-400",
                                        synthState === 'ready' && "text-indigo-400",
                                        synthState === 'stale' && "text-amber-500",
                                        synthState === 'processing' && "text-indigo-400",
                                        synthState === 'completed' && "text-indigo-400",
                                        synthState === 'error' && "text-red-400",
                                    )}>
                                        {synthState === 'locked'     && t('synthesis.stateNeedsMoreRoles')}
                                        {synthState === 'ready'      && t('synthesis.stateReady')}
                                        {synthState === 'stale'      && t('synthesis.stateStale')}
                                        {synthState === 'processing' && <><Loader2 size={10} className="animate-spin" /> {t('synthesis.generating')}</>}
                                        {synthState === 'completed'  && t('synthesis.ready')}
                                        {synthState === 'error'      && t('synthesis.error')}
                                    </span>
                                </div>
                            )}
                        </div>
                        {synthState === 'completed' && <span className="text-indigo-400 shrink-0 text-sm">✦</span>}
                        {synthState === 'stale'     && <RefreshCw size={13} className="text-amber-400 shrink-0" />}
                        {synthState === 'processing'&& <Loader2 size={13} className="animate-spin text-indigo-400 shrink-0" />}
                        {synthState === 'error'     && <AlertCircle size={13} className="text-red-400 shrink-0" />}
                    </div>
                </div>

                {/* Remaining analyses counter */}
                {!isSidebarCollapsed && remainingAnalyses !== null && remainingAnalyses !== undefined && remainingAnalyses !== 'unlimited' && (
                    <div className={cn(
                        "mx-3 mt-auto mb-2 px-3 py-2 rounded-lg text-xs font-medium text-center",
                        remainingAnalyses > 0
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-amber-50 text-amber-600"
                    )}>
                        {remainingAnalyses > 0
                            ? t('rolePanel.remainingAnalyses', { count: remainingAnalyses })
                            : t('rolePanel.noRemainingAnalyses')
                        }
                    </div>
                )}

            </aside>

            {/* ── Content panel ── */}
            <section className="flex-1 p-4 lg:p-8 overflow-y-auto" ref={contentRef}>

                {/* Synthesis panel */}
                {isSynthesisSelected && (
                    <div>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-4">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm shrink-0",
                                    synthState === 'stale' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                                )}>
                                    <GitMerge size={22} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{t('synthesis.panelTitle')}</h2>
                                    <p className="text-sm text-slate-500">
                                        {t('synthesis.panelSubtitle', { count: completedRolesCount })}
                                    </p>
                                </div>
                            </div>
                            {/* Export buttons — only when synthesis data is available */}
                            {(synthState === 'completed' || synthState === 'stale') && synthesis && (
                                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                    <button
                                        onClick={handleDownloadSynthesisPPT}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700 rounded-md transition-colors"
                                    >
                                        <MonitorPlay size={14} className="text-orange-500" /> PPT
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* State: locked */}
                        {synthState === 'locked' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Lock size={24} className="text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-700 mb-1">{t('synthesis.lockedTitle')}</h3>
                                    <p className="text-sm text-slate-500 max-w-xs">{t('synthesis.lockedDescription')}</p>
                                </div>
                                <div className="mt-1 px-4 py-2 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-200">
                                    {completedRolesCount} / 2 {t('synthesis.rolesMinimum')}
                                </div>
                            </div>
                        )}

                        {/* State: ready */}
                        {synthState === 'ready' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                                    <GitMerge size={24} className="text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800 mb-1">{t('synthesis.readyTitle')}</h3>
                                    <p className="text-sm text-slate-500 max-w-sm">{t('synthesis.readyDescription', { count: completedRolesCount })}</p>
                                </div>
                                <button
                                    onClick={onRunSynthesis}
                                    disabled={!onRunSynthesis}
                                    className="mt-1 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                                >
                                    <Play size={15} /> {t('synthesis.runButton')}
                                </button>
                            </div>
                        )}

                        {/* State: processing */}
                        {synthState === 'processing' && (
                            <SynthesisProcessingPanel completedRolesCount={completedRolesCount} />
                        )}

                        {/* State: completed */}
                        {synthState === 'completed' && synthesis && (
                            <div className="space-y-3">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <Suspense fallback={<div className="py-8 text-center text-slate-400 text-sm">{t('synthesis.loading')}</div>}>
                                        <SynthesisDashboard synthesis={synthesis} onRefresh={onRunSynthesis} />
                                    </Suspense>
                                </div>
                                {/* Chat button */}
                                <button
                                    onClick={() => setSynthesisChatOpen(!synthesisChatOpen)}
                                    className="flex items-center gap-2 px-4 py-2.5 w-full bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors"
                                >
                                    <MessageSquare size={16} />
                                    {synthesisChatOpen ? t('rolePanel.hideChat') : 'Hacer pregunta sobre síntesis'}
                                </button>
                                {synthesisChatOpen && synthesis && (
                                    <SynthesisChatPanel
                                        synthesis={synthesis}
                                        onSendMessage={handleSynthesisChatSubmit}
                                        lang={i18n.language === 'es' ? 'es' : 'en'}
                                    />
                                )}
                            </div>
                        )}

                        {/* State: stale — show old synthesis with stale banner */}
                        {synthState === 'stale' && synthesis && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                                    <RefreshCw size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <span>{t('synthesis.staleMessage', { count: newRolesSinceLastSynthesis.length })}</span>
                                        {newRolesSinceLastSynthesis.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {newRolesSinceLastSynthesis.map(name => (
                                                    <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={onRunSynthesis}
                                        disabled={!onRunSynthesis}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
                                    >
                                        <RefreshCw size={12} /> {t('synthesis.updateButton')}
                                    </button>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 opacity-90">
                                    <Suspense fallback={<div className="py-8 text-center text-slate-400 text-sm">{t('synthesis.loading')}</div>}>
                                        <SynthesisDashboard synthesis={synthesis} onRefresh={onRunSynthesis} />
                                    </Suspense>
                                </div>
                            </div>
                        )}

                        {/* State: error */}
                        {synthState === 'error' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 flex flex-col items-center justify-center gap-4 text-center">
                                <AlertCircle size={28} className="text-red-400" />
                                <div>
                                    <h3 className="text-base font-semibold text-slate-700 mb-1">{t('synthesis.error')}</h3>
                                    <p className="text-sm text-red-500">{t('synthesis.errorMessage')}</p>
                                </div>
                                <button
                                    onClick={onRunSynthesis}
                                    disabled={!onRunSynthesis}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={14} /> {t('synthesis.retryButton')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!isSynthesisSelected && selectedRole && (
                    <>
                        {/* Header: icon + title/description + export buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-4">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm shrink-0",
                                    currentStyle.bg, currentStyle.color
                                )}>
                                    {currentStyle.icon}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedRole.displayName}</h2>
                                    <p className="text-sm text-slate-500">{selectedRole.description}</p>
                                </div>
                            </div>

                            {/* Export buttons — only shown when output is completed */}
                            {hasOutput && (
                                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-wrap">
                                    {selectedRole.docConfig?.text && (
                                        <button
                                            onClick={handleDownloadDoc}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                                        >
                                            <FileText size={14} className="text-blue-500" /> DOCX
                                        </button>
                                    )}
                                    {selectedRole.docConfig?.excel && (
                                        <>
                                            <div className="w-px h-4 bg-gray-200" />
                                            <button
                                                onClick={handleDownloadExcel}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-md transition-colors"
                                            >
                                                <FileSpreadsheet size={14} className="text-emerald-500" /> Excel
                                            </button>
                                        </>
                                    )}
                                    {selectedRole.docConfig?.ppt && (
                                        <>
                                            <div className="w-px h-4 bg-gray-200" />
                                            <button
                                                onClick={handleDownloadPPT}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700 rounded-md transition-colors"
                                            >
                                                <MonitorPlay size={14} className="text-orange-500" /> PPT
                                            </button>
                                        </>
                                    )}
                                    {selectedRole.docConfig?.pdf && (
                                        <>
                                            <div className="w-px h-4 bg-gray-200" />
                                            <button
                                                onClick={handleDownloadPDF}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                                            >
                                                <FileType size={14} className="text-red-500" /> PDF
                                            </button>
                                        </>
                                    )}
                                    {selectedRole.docConfig?.json && (
                                        <>
                                            <div className="w-px h-4 bg-gray-200" />
                                            <button
                                                onClick={handleDownloadJSON}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                            >
                                                <FileJson size={14} className="text-slate-400" /> JSON
                                            </button>
                                        </>
                                    )}
                                    {selectedRole.docConfig?.markdown && (
                                        <>
                                            <div className="w-px h-4 bg-gray-200" />
                                            <button
                                                onClick={handleDownloadMarkdown}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                            >
                                                <FileCode size={14} className="text-slate-400" /> MD
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
                            <RolePanel
                                key={selectedRoleId}
                                role={selectedRole}
                                output={selectedOutput}
                                isActive={true}
                                onRun={() => onRunRole(selectedRole.roleId)}
                                onUpdate={(data) => onUpdateRole(selectedRole.roleId, data)}
                                project={project}
                                onConvertToMaster={onConvertToMaster}
                                onUpgradeRequired={() => onUpgradeRequired?.((selectedRole as any).requiredPlan || 'pro')}
                                readOnly={readOnly}
                                anotherRoleExecuting={anotherRoleExecuting}
                                executingRoleName={executingRole?.displayName}
                            />
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
