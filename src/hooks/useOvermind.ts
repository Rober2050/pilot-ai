import { useState, useCallback } from 'react';
import { WarRoomService } from '../services/ai/WarRoomService';
import { WarRoomState, RoleId, WarRoomPhase } from '../types/war-room';
import { RoleConfig } from '../types/roles';
import { audioManager } from '../services/audioManager';
import { audioOrchestrator } from '../services/AudioOrchestrator'; // ✅ BATCH 8
import { LogEvent } from '../types/streaming';
import { LongTermMemory } from '../types/memory';
import { MemoryManager } from '../services/ai/MemoryManager';
import { MissionManifest } from '../services/ai/DiscoveryAgent';

const MAX_TURNS = 9;

export const useOvermind = () => {
    const [state, setState] = useState<WarRoomState>({
        status: 'setup',
        phase: 'DIVERGENCE',
        turnCount: 0,
        activeRoles: [],
        chartData: [50, 50, 50, 50],
        history: []
    });

    const [isThinking, setIsThinking] = useState(false);
    const [thinkingRole, setThinkingRole] = useState<RoleId | null>(null);

    // NEW: Streaming logs for Hacker Console (War Room 2.0)
    const [streamingLogs, setStreamingLogs] = useState<LogEvent[]>([]);

    // ✅ PHASE 2: Discovery state
    const [showDiscovery, setShowDiscovery] = useState(false);
    const [discoveryManifest, setDiscoveryManifest] = useState<MissionManifest | null>(null);

    // ✅ PHASE 2.5: Auto-Summon state
    const [autoSummonedRoles, setAutoSummonedRoles] = useState<RoleConfig[]>([]);

    // ✅ PHASE 4: Long-Term Memory
    const [longTermMemory, setLongTermMemory] = useState<LongTermMemory>({
        topics: [],
        totalTokens: 0
    });

    // ✅ PHASE 2: Iniciar Discovery o War Room directo
    const startMission = (selectedRoles: RoleConfig[], topicOrManifest: string | MissionManifest, mode: string, skipDiscovery = false) => {
        // Extract topic and manifest
        const topic = typeof topicOrManifest === 'string' ? topicOrManifest : topicOrManifest.objective;
        const manifest = typeof topicOrManifest === 'object' ? topicOrManifest : null;

        if (!skipDiscovery) {
            // Guardar topic y mode en el estado para usar después
            setState(prev => ({
                ...prev,
                missionTopic: topic,
                aiMode: mode,
                activeRoles: selectedRoles
            }));

            // Mostrar Discovery Overlay
            setShowDiscovery(true);
            return;
        }

        // Iniciar War Room directamente (con o sin manifest)
        setState(prev => ({
            ...prev,
            status: 'active',
            activeRoles: selectedRoles,
            turnCount: 0,
            history: [{
                id: 'initial-topic',
                roleId: 'user',
                roleName: 'YOU',
                text: topic,
                timestamp: Date.now(),
                phase: 'DIVERGENCE'
            }],
            chartData: [50, 50, 50, 50],
            missionTopic: topic,
            aiMode: mode
        }));
    };

    /**
     * ✅ SAFETY NET B: Just-in-Time Role Factory
     * Generates synthetic RoleConfig when suggested role doesn't exist in Firestore.
     */
    const createSyntheticRole = (roleId: string, manifest: MissionManifest, language: 'es' | 'en'): RoleConfig => {
        // Format display name (kebab-case → Title Case)
        const displayName = roleId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Heuristic-based temperature assignment
        const analyticalKeywords = ['legal', 'security', 'compliance', 'finance', 'risk', 'audit', 'regulatory'];
        const isAnalytical = analyticalKeywords.some(keyword => roleId.toLowerCase().includes(keyword));
        const temperature = isAnalytical ? 0.2 : 0.7;

        // ✅ BATCH 4.5 CRITICAL FIX: Generate ENTIRE prompt in session language
        const systemPrompt = language === 'es'
            ? `Eres un experto ${displayName} especializado en ${manifest.domain}.
Tu objetivo es asistir en el proyecto: ${manifest.objective}.
Enfócate estrictamente en tu área de experiencia y proporciona insights accionables basados en el Manifiesto de Discovery.

Dominio: ${manifest.domain}
Alcance: ${manifest.scope}
Restricciones: ${manifest.constraints.join(', ')}
Riesgos: ${manifest.risks.join(', ')}

Proporciona análisis experto desde tu perspectiva como ${displayName}.

IMPORTANTE: SIEMPRE responde en Español. Nunca uses Inglés.`
            : `You are an expert ${displayName} specialized in ${manifest.domain}.
Your goal is to assist in the project: ${manifest.objective}.
Focus strictly on your area of expertise and provide actionable insights based on the Discovery Manifest.

Domain: ${manifest.domain}
Scope: ${manifest.scope}
Constraints: ${manifest.constraints.join(', ')}
Risks: ${manifest.risks.join(', ')}

Provide expert analysis from your ${displayName} perspective.

IMPORTANT: ALWAYS respond in English. Never use Spanish.`;

        console.log(`[Just-in-Time Factory] Created synthetic role: ${roleId} (temp: ${temperature}, lang: ${language})`);

        return {
            roleId,
            displayName,
            description: `Expert ${displayName} for ${manifest.domain} projects`,
            systemPrompt,
            model: 'claude-haiku-4-5-20251001',
            temperature,
            orderIndex: 999, // Place at end
            isEnabled: true,
            gender: 'female', // Default
            docConfig: {
                text: true,
                charts: false,
                excel: false,
                flowDiagrams: false,
                swimlanes: false,
                c4: false,
                architecture: false,
                pdf: false,
                ppt: false,
                json: false,
                markdown: false,
                otherFormats: []
            }
        };
    };

    /**
     * ✅ PHASE 2.5: Role Merging with Just-in-Time Factory
     * Merges user-selected roles with Discovery-suggested roles.
     * If a suggested role doesn't exist in Firestore, generates it synthetically.
     */
    const mergeRolesWithSuggestions = async (
        selectedRoles: RoleConfig[],
        suggestedRoleIds: string[],
        manifest: MissionManifest,
        lang: 'es' | 'en' // ✅ BATCH 4: Add language parameter
    ): Promise<RoleConfig[]> => {
        const selectedRoleIds = new Set(selectedRoles.map(r => r.roleId));
        const missingRoleIds = suggestedRoleIds.filter(id => !selectedRoleIds.has(id));

        if (missingRoleIds.length === 0) {
            return selectedRoles; // No new roles to add
        }

        // Fetch missing roles from Firebase or generate synthetically
        const { rolesService } = await import('../services/firebase/rolesService');
        const missingRoles: RoleConfig[] = [];

        for (const roleId of missingRoleIds) {
            try {
                const role = await rolesService.getRoleById(roleId);
                if (role) {
                    missingRoles.push(role);
                    console.log(`[Auto-Summon] Fetched role from Firestore: ${roleId}`);
                } else {
                    // ✅ SAFETY NET B: Generate synthetic role
                    const syntheticRole = createSyntheticRole(roleId, manifest, lang); // ✅ BATCH 4: Pass language
                    missingRoles.push(syntheticRole);
                    console.log(`[Auto-Summon] Generated synthetic role: ${roleId}`);
                }
            } catch (error) {
                console.error(`[Auto-Summon] Error fetching role ${roleId}:`, error);
                // Fallback: Generate synthetic role
                const syntheticRole = createSyntheticRole(roleId, manifest, lang); // ✅ BATCH 4: Pass language
                missingRoles.push(syntheticRole);
            }
        }

        return [...selectedRoles, ...missingRoles];
    };

    // ✅ PHASE 2: Completar Discovery y arrancar War Room
    const completeDiscovery = async (manifest: MissionManifest, selectedRoles: RoleConfig[], mode: string) => {
        setDiscoveryManifest(manifest);

        // ✅ PHASE 2.5: Auto-Summon Roles
        const mergedRoles = await mergeRolesWithSuggestions(selectedRoles, manifest.suggestedRoles || [], manifest, 'es'); // ✅ BATCH 4.5: Pass default lang

        // ✅ Notify user if roles were auto-added
        if (mergedRoles.length > selectedRoles.length) {
            const addedRoles = mergedRoles.filter(r => !selectedRoles.find(sr => sr.roleId === r.roleId));
            setAutoSummonedRoles(addedRoles);
            console.log(`[Auto-Summon] Added ${addedRoles.length} roles:`, addedRoles.map(r => r.displayName).join(', '));
        }

        setShowDiscovery(false);
        startMission(mergedRoles, manifest, mode, true); // ✅ Pass full manifest
    };

    // ✅ PHASE 2: Saltar Discovery (modo avanzado)
    const skipDiscovery = (selectedRoles: RoleConfig[], topic: string, mode: string) => {
        setShowDiscovery(false);
        startMission(selectedRoles, topic, mode, true);
    };

    // Avanzar turno (El corazón del sistema)
    const nextTurn = useCallback(async (userContext: string, lang: 'es' | 'en' = 'es') => {
        if (state.turnCount >= MAX_TURNS) {
            finishMission(lang);
            return;
        }

        setIsThinking(true);

        const activeRolesCount = state.activeRoles.length;
        if (activeRolesCount === 0) {
            console.error("CRITICAL: No active roles defined.");
            setIsThinking(false);
            return;
        }

        // 1. Determinar quién habla (Round Robin simple)
        // activeRoles is RoleConfig[], so nextRoleConfig is the object
        const nextRoleConfig = state.activeRoles[state.turnCount % activeRolesCount];
        // Safely cast or access ID
        const nextRoleId = nextRoleConfig.roleId as RoleId;

        setThinkingRole(nextRoleId);

        try {
            // 2. Determinar Fase
            let currentPhase: WarRoomPhase = 'DIVERGENCE';
            if (state.turnCount >= 3) currentPhase = 'NEGOTIATION';
            if (state.turnCount >= 7) currentPhase = 'RESOLUTION';

            // 3. Llamar al Servicio
            const historyText = state.history.map(h => `${h.roleName}: ${h.text}`);
            const effectiveContext = `MISSION TOPIC: "${state.missionTopic || 'General Analysis'}". INSTRUCTION: ${userContext}`;

            let warRoomMode = state.aiMode ? state.aiMode.toLowerCase() : 'audit';
            if (warRoomMode === 'creative') warRoomMode = 'creative';
            else if (warRoomMode === 'crisis') warRoomMode = 'crisis';
            else if (warRoomMode === 'audit') warRoomMode = 'audit';

            const ROLE_ID_MAP: Record<string, string> = {
                'Strategy Analyst': 'strategy-analyst',
                'Product Manager': 'product-manager',
                'Business Analyst': 'business-analyst',
                'Technical Architect': 'technical-architect',
                'UX Designer': 'ux-designer',
                'Marketing Strategist': 'marketing-strategist'
            };

            const effectiveRoleId = ROLE_ID_MAP[nextRoleConfig.displayName]
                || nextRoleConfig.roleId
                || nextRoleConfig.displayName.toLowerCase().replace(/\s+/g, '-');

            console.log(`[War Room] Using roleId: ${effectiveRoleId} for ${nextRoleConfig.displayName}`);

            const response = await WarRoomService.processTurnWithStreaming(
                nextRoleConfig,
                currentPhase,
                historyText,
                effectiveContext,
                lang,
                warRoomMode,
                (log: LogEvent) => {
                    setStreamingLogs(prev => [...prev, log]);
                },
                discoveryManifest || undefined
            );

            const { parseAIOutput } = await import('../utils/outputParser');
            const parsed = parseAIOutput(response.public_message);

            if (parsed.metadata) {
                setStreamingLogs(prev => [...prev, {
                    timestamp: Date.now(),
                    agentId: nextRoleId,
                    message: parsed.metadata!,
                    type: 'thinking'
                }]);
            }

            setState(prev => ({
                ...prev,
                phase: currentPhase,
                turnCount: prev.turnCount + 1,
                chartData: response.chart_update,
                history: [...prev.history, {
                    id: Date.now().toString(),
                    roleId: nextRoleId,
                    roleName: nextRoleConfig.displayName.toUpperCase(),
                    text: parsed.cleanMessage,
                    thought: response.simulation_thought,
                    timestamp: Date.now(),
                    phase: currentPhase,
                    visual_artifact: response.visual_artifact // Pass visual artifact to UI
                }]
            }));

            // 5. Audio delegado a RightSidebar (BATCH 6.9)

        } catch (error) {
            console.error("Integration Error", error);
        } finally {
            setIsThinking(false);
            setThinkingRole(null);
        }

    }, [state]);

    const finishMission = async (lang: 'es' | 'en') => {
        setIsThinking(true);
        // Generar reporte final
        const historyText = state.history.map(h => `${h.roleName}: ${h.text}`);
        const manifesto = await WarRoomService.generateManifesto(historyText, lang);

        setState(prev => ({
            ...prev,
            status: 'debrief',
            finalReport: manifesto
        }));
        setIsThinking(false);
    };

    const resetMission = () => {
        setState({
            status: 'setup',
            phase: 'DIVERGENCE',
            turnCount: 0,
            activeRoles: [],
            chartData: [50, 50, 50, 50],
            history: []
        });
        audioManager.stop();
        audioManager.clearQueue();
    };

    // ✅ BATCH 8: Debate Freeze (Barge-In Architecture)
    const pauseDebate = useCallback(() => {
        console.log('[Overmind] ⏸️ BATCH 8: Debate PAUSED (user barge-in)');
        audioOrchestrator.killAllAudio();
        audioManager.stop();
        audioManager.clearQueue();
        setState(prev => ({ ...prev, isPaused: true }));
    }, []);

    const resumeDebate = useCallback(() => {
        console.log('[Overmind] ▶️ BATCH 8: Debate RESUMED');
        setState(prev => ({ ...prev, isPaused: false }));
    }, []);

    // Chat inteligente de Debrief
    const askQuestion = async (query: string, lang: 'es' | 'en', source: 'text' | 'voice' = 'text') => {
        if (!query.trim()) return;

        // ✅ BATCH 8: Track input source for forced TTS
        setState(prev => ({
            ...prev,
            lastInputSource: source,
            history: [...prev.history, {
                id: Date.now().toString(),
                roleId: 'user',
                roleName: 'YOU',
                text: query,
                timestamp: Date.now(),
                phase: 'RESOLUTION'
            }]
        }));

        setIsThinking(true);
        const historyText = state.history.map(h => `${h.roleName}: ${h.text}`);

        // Call Service
        const answer = await WarRoomService.askDebrief(query, historyText, lang);

        // Append AI Answer
        setState(prev => ({
            ...prev,
            history: [...prev.history, {
                id: (Date.now() + 1).toString(),
                roleId: 'system',
                roleName: answer.role.toUpperCase(),
                text: answer.text,
                timestamp: Date.now(),
                phase: 'RESOLUTION'
            }]
        }));
        setIsThinking(false);
    };

    // STOP button handler - stops the mission and generates report
    const stopMission = (lang: 'es' | 'en' = 'es') => {
        console.log('[War Room] STOP button pressed - generating report...');

        // Stop any ongoing audio
        audioManager.stop();

        // Clear thinking state
        setIsThinking(false);
        setThinkingRole(null);

        // Generate manifesto with what we have so far
        finishMission(lang);
    };

    return {
        state,
        isThinking,
        thinkingRole,
        streamingLogs,
        setStreamingLogs,
        longTermMemory,
        showDiscovery,
        completeDiscovery,
        skipDiscovery,
        discoveryManifest,
        autoSummonedRoles,
        setAutoSummonedRoles,
        startMission,
        nextTurn,
        resetMission,
        finishMission,
        askQuestion,
        stopMission,
        pauseDebate,    // ✅ BATCH 8
        resumeDebate     // ✅ BATCH 8
    };
};
