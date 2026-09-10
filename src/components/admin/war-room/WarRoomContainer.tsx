import React, { useEffect, useState } from 'react';
import { RoleConfig } from '../../../types/roles';
import { ImmersiveStage } from './ImmersiveStage';
import { useOvermind } from '../../../hooks/useOvermind';
import { RightSidebar } from './RightSidebar';
import { RoleId } from '../../../types/war-room';
import { HackerConsole } from './HackerConsole';
import { DiscoveryOverlay } from './DiscoveryOverlay';

interface WarRoomContainerProps {
    roles: RoleConfig[];
    theme?: 'holographic' | 'realistic';
    fullScreen?: boolean;
}

export const WarRoomContainer: React.FC<WarRoomContainerProps> = ({ roles }) => {
    // OVERMIND HOOK (New Brain)
    const {
        state: overmindState,
        startMission,
        resetMission,
        nextTurn,
        isThinking,
        thinkingRole,
        streamingLogs,
        setStreamingLogs,
        askQuestion,
        finishMission,
        showDiscovery,
        completeDiscovery,
        skipDiscovery,
        autoSummonedRoles,
        setAutoSummonedRoles,
        pauseDebate,     // ✅ BATCH 8
        resumeDebate      // ✅ BATCH 8
    } = useOvermind();

    const [language, setLanguage] = useState<'es' | 'en'>('es');

    // UI State: Setup Selection
    // Lifted state to visualize roles on Stage BEFORE simulation starts
    const [setupRoles, setSetupRoles] = useState<RoleId[]>([]);

    const handleToggleRole = (id: RoleId) => {
        if (setupRoles.includes(id)) {
            setSetupRoles(prev => prev.filter(r => r !== id));
        } else {
            if (setupRoles.length >= 4) {
                // Should show toast/alert
                return;
            }
            setSetupRoles(prev => [...prev, id]);
        }
    };

    const handleStart = (topic: string, mode: string, lang: 'es' | 'en') => {
        clearStreamingLogs();
        setLanguage(lang);

        const selectedConfigs = roles.filter(r => setupRoles.includes(r.roleId as RoleId));

        // ✅ PHASE 2: Start Discovery (no skip by default)
        startMission(selectedConfigs, topic, mode, false);
    };

    // ✅ NEW: HackerConsole visibility state
    const [showConsole, setShowConsole] = useState(false);

    // ✅ NEW: Clear streaming logs function
    const clearStreamingLogs = () => {
        setStreamingLogs([]);
    };

    // Auto-advance turns: waits for TTS to finish before next turn
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let advanceTimeout: NodeJS.Timeout;

        if (overmindState.status === 'active' && !isThinking && !overmindState.isPaused) {
            // Poll until TTS finishes, then schedule next turn
            interval = setInterval(() => {
                const isSpeaking = window.speechSynthesis?.speaking;
                if (!isSpeaking) {
                    clearInterval(interval);
                    // Small pause after speech ends for natural conversational flow
                    advanceTimeout = setTimeout(() => {
                        console.log('[WarRoom] ⏳ TTS done → advancing to next turn');
                        nextTurn("Continue debate", language);
                    }, 1500);
                }
            }, 500);
        }
        return () => {
            clearInterval(interval);
            clearTimeout(advanceTimeout);
        };
    }, [overmindState.status, overmindState.turnCount, overmindState.history.length, isThinking, overmindState.isPaused, language, nextTurn]);

    // ✅ BATCH 4.5 CRITICAL FIX: Phantom Roles Bug
    // ROOT CAUSE: displayedRoleIds filters roles array, but synthetic roles don't exist in static roles array
    // SOLUTION: In active mode, pass overmindState.activeRoles directly (includes ALL roles, synthetic + static)
    const displayedRoles = overmindState.status === 'setup'
        ? roles.filter(r => setupRoles.includes(r.roleId as RoleId))
        : overmindState.activeRoles; // ✅ Use activeRoles directly (includes synthetic)

    return (
        <div className="relative w-full h-full overflow-hidden bg-black font-sans selection:bg-indigo-500/30 flex">
            {/* LAYER 0: IMMERSIVE STAGE (LEFT - FLEX GROW) */}
            <div className="relative flex-1 h-full overflow-hidden">
                <ImmersiveStage
                    roles={displayedRoles} // ✅ BATCH 4.5: Pass ALL active roles (no filter)
                    activeSpeakerId={overmindState.history.length > 0 ? overmindState.history[overmindState.history.length - 1].roleId as string : null}
                    isSimulating={overmindState.status === 'active'}
                    autoSummonedRoleIds={autoSummonedRoles.map(r => r.roleId)} // ✅ BATCH 4: Pass auto-summoned role IDs
                    language={language} // ✅ BATCH 4: Pass language for Guest badge
                />

                {/* Thinking Badges Overlay */}
                {isThinking && thinkingRole && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-cyan-500/20 border border-cyan-500 text-cyan-300 px-4 py-1 rounded-full text-xs animate-pulse z-50">
                        {language === 'es' ? `Cargando pensamiento de ${thinkingRole}...` : `Loading thought from ${thinkingRole}...`}
                    </div>
                )}
            </div>

            {/* LAYER 1: RIGHT SIDEBAR (OVERMIND CONTROL) */}
            <RightSidebar
                overmindState={overmindState}
                onStart={handleStart}
                onReset={resetMission}
                onStop={() => finishMission(language)}
                currentLang={language}
                setLang={setLanguage}
                selectedRoles={setupRoles}
                onToggleRole={handleToggleRole}
                availableRoles={roles}
                onAsk={askQuestion}
                onPauseDebate={pauseDebate}    // ✅ BATCH 8
                onResumeDebate={resumeDebate}   // ✅ BATCH 8
                streamingLogs={streamingLogs}
                showConsole={showConsole}
                onToggleConsole={() => setShowConsole(!showConsole)}
                onClearConsole={clearStreamingLogs}
            />

            {/* ✅ BATCH 4.5: HackerConsole moved to RightSidebar header */}

            {/* ✅ PHASE 2: Discovery Overlay */}
            {showDiscovery && (
                <DiscoveryOverlay
                    initialInput={overmindState.missionTopic || ''}
                    lang={language}
                    onComplete={(manifest) => {
                        const selectedConfigs = roles.filter(r => setupRoles.includes(r.roleId as RoleId));
                        const mode = overmindState.aiMode || 'audit';
                        completeDiscovery(manifest, selectedConfigs, mode);
                    }}
                    onSkip={async () => {
                        // ✅ SKIP BUTTON FIX: Generate emergency manifest from partial history

                        // Show loading state
                        const loadingToast = document.createElement('div');
                        loadingToast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-cyan-500/20 border border-cyan-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-md';
                        loadingToast.innerHTML = `
                            <div class="flex items-center gap-3">
                                <div class="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></div>
                                <span class="text-cyan-300 font-medium">${language === 'es' ? 'Generando equipo...' : 'Generating team...'}</span>
                            </div>
                        `;
                        document.body.appendChild(loadingToast);

                        try {
                            // Import DiscoveryAgent
                            const { DiscoveryAgent } = await import('../../../services/ai/DiscoveryAgent');
                            const agent = new DiscoveryAgent(import.meta.env.VITE_GEMINI_API_KEY);

                            // Generate emergency manifest from partial history
                            const manifest = await agent.forceFinalAnalysis(
                                [`User: ${overmindState.missionTopic || 'General analysis'}`],
                                language
                            );

                            // Complete discovery with generated manifest
                            completeDiscovery(manifest, roles.filter(r => setupRoles.includes(r.roleId as RoleId)), overmindState.aiMode || 'audit');
                        } catch (error) {
                            console.error('[Skip] Emergency manifest generation failed:', error);
                            // Fallback: skip without manifest
                            skipDiscovery(roles.filter(r => setupRoles.includes(r.roleId as RoleId)), overmindState.missionTopic || '', overmindState.aiMode || 'audit');
                        } finally {
                            document.body.removeChild(loadingToast);
                        }
                    }}
                />
            )}

            {/* ✅ PHASE 2.5: Auto-Summon Notification - Only show AFTER Discovery completes */}
            {autoSummonedRoles.length > 0 && overmindState.status === 'active' && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4">
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-blue-300 font-semibold mb-1">
                                {language === 'es' ? '🧠 Expertos Convocados Automáticamente' : '🧠 Experts Auto-Summoned'}
                            </h3>
                            <p className="text-blue-200/80 text-sm mb-2">
                                {language === 'es'
                                    ? 'Basado en tu Discovery, hemos sumado los siguientes expertos a la reunión:'
                                    : 'Based on your Discovery, we have added the following experts to the meeting:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {autoSummonedRoles.map(role => (
                                    <span key={role.roleId} className="bg-blue-500/30 text-blue-100 px-3 py-1 rounded-full text-sm font-medium">
                                        {role.displayName}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setAutoSummonedRoles([])}
                            className="flex-shrink-0 text-blue-300 hover:text-blue-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
