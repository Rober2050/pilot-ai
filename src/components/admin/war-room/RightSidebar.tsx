import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { Send, FileText, Download, CheckCircle2, LogOut, RotateCcw, Square, Terminal, Mic } from 'lucide-react';
import { ArtifactRenderer } from './ArtifactRenderer';
import { RoleId, WarRoomState } from '../../../types/war-room';
import { RoleConfig } from '../../../types/roles';
import { WarRoomService } from '../../../services/ai/WarRoomService';
import { warRoomStylesService } from '../../../services/firebase/warRoomStylesService';
import { WarRoomStyle } from '../../../types/prompt-composer';
import { HackerConsole } from './HackerConsole'; // ✅ BATCH 4.5: Import console
import { MentionsDropdown } from './MentionsDropdown'; // ✅ BATCH 4.5: Import mentions
import { useMentions, insertMention } from '../../../hooks/useMentions'; // ✅ BATCH 4.5: Import mentions hook
import { VoiceButton } from './VoiceButton'; // ✅ BATCH 5: Import voice button
import { useVoiceInteraction } from '../../../hooks/useVoiceInteraction'; // ✅ BATCH 5: Import voice hook
import { getUserDisplayName } from '../../../utils/getUserDisplayName'; // ✅ BATCH 5: User identity
import { audioOrchestrator } from '../../../services/AudioOrchestrator'; // ✅ BATCH 5: Audio coordination
import { audioManager } from '../../../services/audioManager'; // ✅ BATCH 6.6: Direct voice control

// ROLE COLOR MAPPING
const ROLE_COLORS: Record<string, string> = {
    'product-manager': 'text-blue-400',
    'architect': 'text-amber-400',
    'ux-designer': 'text-pink-400',
    'business-analyst': 'text-emerald-400',
    'project-manager': 'text-indigo-400',
    'strategy-analyst': 'text-cyan-400',
    'frontend-dev': 'text-violet-400',
    'backend-dev': 'text-orange-400',
    'qa-engineer': 'text-rose-400',
    'security': 'text-red-500',
    'devops': 'text-lime-400',
    'user': 'text-white'
};

const getRoleColor = (roleId: string, roleName: string) => {
    if (roleId === 'system') return 'text-purple-400';
    if (roleId === 'user') return 'text-slate-200';
    return ROLE_COLORS[roleId] || 'text-cyan-400';
};

interface RightSidebarProps {
    overmindState: WarRoomState;
    onStart: (topic: string, mode: string, lang: 'es' | 'en') => void;
    onReset: () => void;
    currentLang: 'es' | 'en';
    setLang: (lang: 'es' | 'en') => void;
    selectedRoles: RoleId[];
    onToggleRole: (id: RoleId) => void;
    availableRoles: RoleConfig[];
    onAsk?: (question: string, lang: 'es' | 'en', source?: 'text' | 'voice') => void;
    onStop?: () => void;
    // ✅ BATCH 8: Barge-In Props
    onPauseDebate?: () => void;
    onResumeDebate?: () => void;
    // Console props
    streamingLogs?: any[];
    showConsole?: boolean;
    onToggleConsole?: () => void;
    onClearConsole?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
    overmindState,
    onStart,
    onReset,
    currentLang,
    setLang,
    selectedRoles,
    onToggleRole,
    availableRoles,
    onAsk,
    onStop,
    onPauseDebate,    // ✅ BATCH 8
    onResumeDebate,   // ✅ BATCH 8
    streamingLogs = [],
    showConsole = false,
    onToggleConsole,
    onClearConsole
}) => {
    // 🔴 DIAGNOSTIC: If you see this in console, HMR served updated code
    React.useEffect(() => { console.log('[RightSidebar] 🟢 BATCH 8.1 LOADED — build: 2026-02-16T12:33'); }, []);

    // State for local inputs
    const [topic, setTopic] = React.useState('');
    const [aiMode, setAiMode] = React.useState('audit');
    const [showManifesto, setShowManifesto] = React.useState(false);

    // State for chat input
    const [query, setQuery] = React.useState('');
    const queryRef = React.useRef(''); // ✅ FIX: Ref always has latest query (no stale closures)
    queryRef.current = query; // Sync on every render
    const [cursorPosition, setCursorPosition] = React.useState(0);
    const chatEndRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const lastSpokenMessageId = React.useRef<string | null>(null);
    const hasGreetedRef = React.useRef(false);
    const forceVoiceResponseRef = React.useRef(false);

    // Track input type for voice response logic
    const [lastInputType, setLastInputType] = React.useState<'text' | 'voice'>('text');

    // ✅ Auto-resize textarea when query changes
    React.useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
        }
    }, [query]);

    // ✅ Topic voice input state
    const [isRecordingTopic, setIsRecordingTopic] = React.useState(false);
    const topicRecognitionRef = React.useRef<any>(null);

    // State for War Room Styles
    const [warRoomStyles, setWarRoomStyles] = React.useState<WarRoomStyle[]>([]);

    // ✅ BATCH 4.5: @Mentions integration
    const mentionState = useMentions(query, cursorPosition, overmindState.activeRoles || []);

    // ✅ BATCH 5: Voice interaction
    const voiceInteraction = useVoiceInteraction({
        language: currentLang,
        onTranscript: (transcript) => {
            // ✅ BATCH 6.8 FIX 2: Replace text (Discovery pattern - real-time display)
            setQuery(transcript);
            // ✅ BATCH 6: Mark as voice input for force voice response
            setLastInputType('voice');
            // Auto-focus input after transcript
            setTimeout(() => inputRef.current?.focus(), 100);
        },
        onError: (error) => {
            console.error('[RightSidebar] Voice error:', error);
        }
    });

    // ✅ Voice button: Mic → Talk → Stop → Review → Send
    const handleVoiceToggle = async () => {
        try {
            if (voiceInteraction.isListening) {
                // === STOP: Mic off, text stays in input for review ===
                console.log('[RightSidebar] ⏹️ STOP pressed. Stopping mic.');
                voiceInteraction.stopListening();
                setLastInputType('voice'); // Mark so Send knows to force TTS
                onResumeDebate?.(); // Resume debate flow
                console.log('[RightSidebar] ▶️ Mic stopped. User can review and send.');

            } else if (voiceInteraction.isSpeaking) {
                // === BARGE-IN: Interrupt AI speaking ===
                voiceInteraction.interrupt();
            } else {
                // === START: Freeze debate, clear input, start mic ===
                console.log('[RightSidebar] 🔇 Freezing debate for voice input');
                onPauseDebate?.();
                setQuery('');
                await voiceInteraction.startListening();
            }
        } catch (error) {
            console.error('[RightSidebar] Voice toggle error:', error);
            voiceInteraction.stopListening();
            onResumeDebate?.();
        }
    };

    // ✅ BATCH 8 FIX: Auto-play AI responses with voice
    React.useEffect(() => {
        if (overmindState.history.length === 0) return;

        const lastMessage = overmindState.history[overmindState.history.length - 1];

        // Skip user messages
        if (lastMessage.roleId === 'user') return;

        // Prevent re-speaking the same message
        if (lastSpokenMessageId.current === lastMessage.id) return;

        // Singleton lock for initial greeting
        if (!hasGreetedRef.current && overmindState.history.length === 1) {
            hasGreetedRef.current = true;
        }

        const playAudio = () => {
            lastSpokenMessageId.current = lastMessage.id;

            // ✅ FIX 1: forceVoiceResponseRef bypasses ALL checks (including 'system' roleId)
            if (forceVoiceResponseRef.current) {
                console.log('[RightSidebar] 🔊 FORCING AI voice response (voice input detected)');
                voiceInteraction.speak(lastMessage.text, lastMessage.roleId)
                    .catch(err => console.error('[RightSidebar] Voice error:', err));
                forceVoiceResponseRef.current = false;
            } else if (lastMessage.roleId !== 'system' && audioOrchestrator.canAISpeak()) {
                // Normal auto-play for debate messages (not system)
                console.log(`[RightSidebar] 🔊 Auto-playing AI response`);
                voiceInteraction.speak(lastMessage.text, lastMessage.roleId)
                    .catch(err => console.error('[RightSidebar] Voice error:', err));
            } else {
                console.log('[RightSidebar] ❌ Auto-play skipped');
            }
        };

        const debounceTimer = setTimeout(playAudio, 300);
        return () => clearTimeout(debounceTimer);
    }, [overmindState.history, currentLang]);

    // Load War Room Styles from Firestore
    React.useEffect(() => {
        const loadStyles = async () => {
            const styles = await warRoomStylesService.getEnabledStyles();
            setWarRoomStyles(styles);
            // Set first style as default if available
            if (styles.length > 0 && !aiMode) {
                setAiMode(styles[0].mode);
            }
        };
        loadStyles();
    }, []);

    // Auto-scroll to bottom of chat
    React.useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [overmindState.history]);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;

        // ... (Colors and Logic)
        const bgDark = '#0f172a';
        const textLight = '#e2e8f0';
        const accentCyan = '#06b6d4';
        const accentRed = '#ef4444';
        const accentGreen = '#10b981';

        const r = overmindState.finalReport || { decision: 'PENDING', summary: 'No data', risks: [], tradeOffs: [], roadmap: [] };

        try {
            // 1. Background
            doc.setFillColor(bgDark);
            doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

            // 2. Header
            doc.setTextColor(accentCyan);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text(currentLang === 'es' ? 'MANIFIESTO ESTRATÉGICO' : 'STRATEGIC MANIFESTO', margin, 30);

            doc.setTextColor(100, 116, 139); // Slate-500
            doc.setFontSize(10);
            doc.text(`ID: PILOTAI-WAR-ROOM-${Date.now().toString().slice(-6)}`, margin, 38);
            doc.text(`DATE: ${new Date().toLocaleDateString()}`, margin, 43);

            // 3. Verdict Badge
            const isGo = r.decision?.toUpperCase().includes('GO') && !r.decision?.toUpperCase().includes('NO-GO');
            doc.setFillColor(isGo ? accentGreen : accentRed);
            doc.roundedRect(pageWidth - margin - 50, 20, 50, 15, 3, 3, 'F');
            doc.setTextColor('#ffffff');
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(r.decision || 'PENDING', pageWidth - margin - 25, 30, { align: 'center' });

            let yPos = 60;

            // 4. Executive Summary
            doc.setDrawColor(accentCyan);
            doc.setLineWidth(1);
            doc.line(margin, yPos, margin, yPos + 30); // Vertical line

            doc.setTextColor(accentCyan);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(currentLang === 'es' ? 'RESUMEN EJECUTIVO' : 'EXECUTIVE SUMMARY', margin + 5, yPos + 5);

            doc.setTextColor(textLight);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            const summaryLines = doc.splitTextToSize(r.summary || r.decision || 'No summary', pageWidth - (margin * 2) - 10);
            doc.text(summaryLines, margin + 5, yPos + 15);

            yPos += 40 + (summaryLines.length * 5);

            // 5. Risks & Trade-offs (Side by Side)
            const colWidth = (pageWidth - (margin * 3)) / 2;

            // Risks
            doc.setFillColor('#450a0a'); // red-950
            doc.roundedRect(margin, yPos, colWidth, 60, 2, 2, 'F');

            doc.setTextColor(accentRed);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(currentLang === 'es' ? 'RIESGOS (RISKS)' : 'RISKS', margin + 5, yPos + 10);

            doc.setTextColor('#fca5a5'); // red-300
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            let riskY = yPos + 20;
            r.risks?.forEach((risk: string) => {
                const lines = doc.splitTextToSize(`• ${risk}`, colWidth - 10);
                doc.text(lines, margin + 5, riskY);
                riskY += (lines.length * 5) + 3;
            });

            // Trade-offs
            doc.setFillColor('#451a03'); // amber-950
            doc.roundedRect(margin + colWidth + margin, yPos, colWidth, 60, 2, 2, 'F');

            doc.setTextColor('#fbbf24'); // amber-400
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(currentLang === 'es' ? 'SACRIFICIOS (TRADE-OFFS)' : 'TRADE-OFFS', margin + colWidth + margin + 5, yPos + 10);

            doc.setTextColor('#fcd34d'); // amber-300
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            let tradeY = yPos + 20;
            r.tradeOffs?.forEach((item: string) => {
                const lines = doc.splitTextToSize(`• ${item}`, colWidth - 10);
                doc.text(lines, margin + colWidth + margin + 5, tradeY);
                tradeY += (lines.length * 5) + 3;
            });

            yPos += 70;

            // 6. Roadmap
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(currentLang === 'es' ? 'HOJA DE RUTA (ROADMAP)' : 'ROADMAP', margin, yPos);
            yPos += 10;

            r.roadmap?.forEach((step: string, index: number) => {
                doc.setFillColor('#1e293b'); // slate-800
                doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 15, 1, 1, 'F');

                doc.setTextColor(accentCyan);
                doc.setFont("courier", "bold");
                doc.text(`0${index + 1}`, margin + 5, yPos + 10);

                doc.setTextColor(textLight);
                doc.setFont("helvetica", "normal");
                doc.text(step, margin + 20, yPos + 10);

                yPos += 20;
            });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("GENERATED BY PILOTAI WAR ROOM SYSTEM", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

            doc.save("PILOTAI_MANIFESTO.pdf");
        } catch (e) {
            console.error("PDF Fail", e);
            alert("Error generating PDF");
        }
    };



    const [isValidating, setIsValidating] = useState(false);

    const handleStartMission = async () => {
        if (!topic.trim()) return;

        // 1. Validate Topic Quality (Gatekeeper Protocol)
        setIsValidating(true);
        const validation = await WarRoomService.validateTopic(topic, currentLang);
        setIsValidating(false);

        if (!validation.valid) {
            // Show error (using a simple alert for now, or a toast if available)
            // Ideally this should be a nice UI toast
            alert(validation.reason);
            return;
        }

        // 2. Start Mission
        onStart(topic, aiMode, currentLang);
    };

    const handleSendQuery = (source: 'text' | 'voice' = 'text') => {
        if (!query.trim() || !onAsk) return;

        // ✅ DEFINITIVE FIX: Auto-detect voice source
        let effectiveSource = source;
        if (voiceInteraction.state === 'listening' || lastInputType === 'voice') {
            effectiveSource = 'voice';
        }

        // Stop microphone if still listening
        if (voiceInteraction.state === 'listening') {
            voiceInteraction.stopListening();
        }

        // ✅ Force TTS response if voice input
        if (effectiveSource === 'voice') {
            forceVoiceResponseRef.current = true;
            console.log('[RightSidebar] 🎙️ Voice detected → forcing TTS on AI response');
        }

        const userName = getUserDisplayName(currentLang);
        console.log(`[RightSidebar] 💬 ${userName} sending message (source: ${effectiveSource}):`, query);

        onAsk(query, currentLang, effectiveSource);
        setQuery('');
        setLastInputType(effectiveSource);

        // ✅ ALWAYS resume debate when user sends a message
        onResumeDebate?.();
    };



    // ✅ BATCH 9: Resizable Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(400); // Default 400px
    const isDragging = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            // Calculating new width considering the sidebar is pinned to the right
            const newWidth = document.body.clientWidth - e.clientX;
            // Constrain between 350px and an arbitrary max based on screen size so it doesn't crush the left panel
            const constrainedWidth = Math.max(350, Math.min(newWidth, Math.min(1200, document.body.clientWidth * 0.75)));
            setSidebarWidth(constrainedWidth);
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                document.body.style.cursor = 'default';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // RENDER
    return (
        <div
            style={{ width: `${sidebarWidth}px` }}
            className="h-full bg-slate-950 border-l border-slate-800 flex flex-col font-sans relative z-10 shadow-2xl"
        >
            {/* DRAG HANDLE */}
            <div
                onMouseDown={handleMouseDown}
                className="absolute top-0 left-[-4px] w-[8px] h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 z-[100] transition-colors"
                title={currentLang === 'es' ? 'Arrastrar para redimensionar' : 'Drag to resize'}
            />

            {/* COMMON HEADER */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${overmindState.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="font-bold text-slate-200 text-xs tracking-widest uppercase">
                        {currentLang === 'es'
                            ? (overmindState.status === 'setup' ? 'CONFIGURACIÓN' : 'REGISTRO DE MISIÓN')
                            : (overmindState.status === 'setup' ? 'CONFIGURATION' : 'MISSION LOG')}
                    </span>
                </div>
                {/* TOOLBAR (Only in Active/Debrief) */}
                {overmindState.status !== 'setup' && (
                    <div className="flex items-center gap-1">
                        {/* ✅ BATCH 4.5: Terminal Console Button */}
                        {onToggleConsole && (
                            <button
                                onClick={onToggleConsole}
                                className={`p-2 rounded-md transition-colors ${showConsole ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-500 hover:text-cyan-400'}`}
                                title={currentLang === 'es' ? 'Consola de Desarrollo' : 'Developer Console'}
                            >
                                <Terminal size={16} />
                            </button>
                        )}
                        <button
                            onClick={onStop}
                            className="p-2 text-slate-500 hover:text-orange-400 transition-colors rounded-md hover:bg-orange-900/20"
                            title={currentLang === 'es' ? 'Finalizar y Reportar' : 'Stop and Report'}
                        >
                            <Square size={16} />
                        </button>
                        <button
                            onClick={onReset}
                            className="p-2 text-slate-500 hover:text-emerald-400 transition-colors rounded-md hover:bg-emerald-900/20"
                            title={currentLang === 'es' ? 'Nueva Reunión' : 'New Session'}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            onClick={onReset}
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-900/20"
                            title={currentLang === 'es' ? 'Salir' : 'Exit'}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* ✅ BATCH 4.5: Console Dropdown Popover */}
            {showConsole && onToggleConsole && (
                <div className="absolute top-14 right-0 w-full max-h-96 bg-slate-900 border-b border-slate-800 shadow-2xl z-50 overflow-hidden">
                    <HackerConsole
                        logs={streamingLogs}
                        isVisible={true}
                        onToggle={onToggleConsole}
                        onClear={onClearConsole}
                    />
                </div>
            )}

            {/* BODY CONTENT SWITCH */}
            {overmindState.status === 'setup' ? (
                // --- SETUP MODE UI ---
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar animate-in fade-in duration-300">

                    {/* 1. Global Config */}
                    <div className="space-y-4 bg-slate-900/50 p-4 rounded border border-slate-800/50">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-2">
                            {currentLang === 'es' ? 'Parámetros Globales' : 'Global Parameters'}
                        </label>

                        {/* Language */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 uppercase">Language / Idioma</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLang('es')}
                                    className={`flex-1 py-2 text-xs font-bold rounded border ${currentLang === 'es' ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                >
                                    ESPAÑOL
                                </button>
                                <button
                                    onClick={() => setLang('en')}
                                    className={`flex-1 py-2 text-xs font-bold rounded border ${currentLang === 'en' ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                >
                                    ENGLISH
                                </button>
                            </div>
                        </div>

                        {/* AI Mode */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 uppercase">{currentLang === 'es' ? 'Modo de Inteligencia' : 'Intelligence Mode'}</span>
                            <select
                                value={aiMode}
                                onChange={(e) => setAiMode(e.target.value)}
                                size={6}
                                className="bg-slate-800 text-white border border-slate-600 rounded px-3 py-2 text-xs w-full focus:ring-1 focus:ring-cyan-500 outline-none overflow-y-auto max-h-48"
                            >
                                {warRoomStyles.map((style) => (
                                    <option key={style.id} className="bg-slate-900 text-white" value={style.mode}>
                                        {currentLang === 'es' ? style.name : style.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 2. Mission Topic */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                            {currentLang === 'es' ? 'Objetivo de la Misión' : 'Mission Objective'}
                        </label>
                        <div className="relative">
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={currentLang === 'es'
                                    ? "Ej: Migrar a Microservicios para escalar..."
                                    : "Ex: Migrate to Microservices for scalability..."}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pr-10 text-sm text-slate-200 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none h-24 placeholder:text-slate-600"
                            />
                            {/* ✅ Mic button for topic/mission objective */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (isRecordingTopic) {
                                        // STOP
                                        if (topicRecognitionRef.current) {
                                            topicRecognitionRef.current.stop();
                                            topicRecognitionRef.current = null;
                                        }
                                        setIsRecordingTopic(false);
                                    } else {
                                        // START (same pattern as Discovery)
                                        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                        if (!SR) return;
                                        const rec = new SR();
                                        rec.lang = currentLang === 'es' ? 'es-ES' : 'en-US';
                                        rec.continuous = true;
                                        rec.interimResults = true;
                                        let finalT = '';
                                        rec.onstart = () => { finalT = ''; };
                                        rec.onresult = (ev: any) => {
                                            let interim = '';
                                            for (let i = ev.resultIndex; i < ev.results.length; i++) {
                                                if (ev.results[i].isFinal) finalT += ev.results[i][0].transcript + ' ';
                                                else interim += ev.results[i][0].transcript;
                                            }
                                            setTopic((finalT + interim).trim());
                                        };
                                        rec.onend = () => { setIsRecordingTopic(false); topicRecognitionRef.current = null; };
                                        rec.onerror = () => { setIsRecordingTopic(false); topicRecognitionRef.current = null; };
                                        topicRecognitionRef.current = rec;
                                        rec.start();
                                        setIsRecordingTopic(true);
                                    }
                                }}
                                className={`absolute right-2 bottom-2 p-1.5 rounded-full transition-all duration-200 ${isRecordingTopic
                                    ? 'bg-red-500/20 border border-red-500 text-red-400 animate-pulse'
                                    : 'bg-slate-800 border border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-500'
                                    }`}
                                title={currentLang === 'es' ? 'Dictar objetivo' : 'Dictate objective'}
                            >
                                {isRecordingTopic
                                    ? <Square size={12} className="fill-current" />
                                    : <Mic size={12} />
                                }
                            </button>
                        </div>
                    </div>

                    {/* 3. Role Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">
                            {currentLang === 'es' ? `Expertos Seleccionados (${selectedRoles.length})` : `Selected Experts (${selectedRoles.length})`}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {availableRoles.filter(r => r.roleId !== 'system' && r.roleId !== 'user').map((role) => {
                                const id = role.roleId as RoleId;
                                const isSelected = selectedRoles.includes(id);
                                return (
                                    <button
                                        key={role.roleId}
                                        onClick={() => onToggleRole(id)}
                                        className={`px-3 py-2 rounded border text-left text-[10px] transition-all duration-200 flex items-center gap-2
                                            ${isSelected
                                                ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-300'
                                                : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:border-slate-600'}
                                        `}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                        <span className="truncate w-full font-bold">{role.displayName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* START BUTTON */}
                    <div className="pt-4 sticky bottom-0 bg-slate-950 pb-2">
                        <button
                            onClick={handleStartMission}
                            disabled={!topic.trim() || selectedRoles.length < 2 || isValidating}
                            className={`w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs flex items-center justify-center gap-2 group ${isValidating ? 'animate-pulse' : ''}`}
                        >
                            {isValidating ? (
                                <span>{currentLang === 'es' ? 'ANALIZANDO TEMA...' : 'VALIDATING TOPIC...'}</span>
                            ) : (
                                <>
                                    <span>{currentLang === 'es' ? 'INICIAR SESIÓN' : 'START SESSION'}</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>
            ) : (
                // --- ACTIVE / DEBRIEF MODE UI ---
                <>
                    {/* CHAT FEED - EXPANDED (Radar removed) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

                        {/* Initial "Connecting" Message */}
                        {overmindState.history.length === 0 && (
                            <div className="text-center text-slate-600 text-[10px] mt-10 italic animate-pulse">
                                {currentLang === 'es' ? 'Estableciendo conexión segura...' : 'Establishing secure connection...'}
                            </div>
                        )}

                        {/* Message Stream */}
                        {overmindState.history.map((msg) => {
                            const roleColor = getRoleColor(msg.roleId as string, msg.roleName);
                            const isUser = msg.roleId === 'user';
                            const isSystem = msg.roleName === 'SYSTEM';

                            return (
                                <div key={msg.id} className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 ${isUser ? 'items-end' : 'items-start'}`}>
                                    {/* Header */}
                                    <div className="flex items-end gap-2 mb-1 px-1">
                                        {!isUser && (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>
                                                {msg.roleName}
                                            </span>
                                        )}
                                        <span className="text-[9px] text-slate-600">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isUser && (
                                            <span className={`text-[10px] font-bold uppercase tracking-wider text-slate-400`}>
                                                YOU
                                            </span>
                                        )}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`text-xs leading-relaxed p-3 rounded-xl max-w-[90%] 
                                        ${isSystem
                                            ? 'bg-purple-900/10 border border-purple-500/20 text-purple-200 italic w-full text-center'
                                            : (isUser
                                                ? 'bg-cyan-900/20 border border-cyan-500/30 text-cyan-50 rounded-tr-none'
                                                : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-none')}
                                    `}>
                                        {msg.text}
                                    </div>

                                    {/* 🔥 INJECT VISUAL ARTIFACTS HERE */}
                                    {msg.visual_artifact && (
                                        <ArtifactRenderer artifact={msg.visual_artifact} />
                                    )}
                                </div>
                            );
                        })}

                        {/* DEBRIEF REPORT CARD (In Stream) */}
                        {overmindState.status === 'debrief' && (
                            <div className="mt-8 mb-4 animate-in fade-in slide-in-from-bottom-4 px-4">
                                {/* Divider */}
                                <div className="flex items-center gap-2 mb-4 opacity-70">
                                    <div className="h-[1px] bg-slate-700 flex-1"></div>
                                    <div className="flex items-center gap-1 text-emerald-500">
                                        <CheckCircle2 size={12} />
                                        <span className="text-[10px] uppercase tracking-widest font-bold">
                                            {currentLang === 'es' ? 'SESIÓN FINALIZADA' : 'SESSION ENDED'}
                                        </span>
                                    </div>
                                    <div className="h-[1px] bg-slate-700 flex-1"></div>
                                </div>

                                {/* Report Card */}
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 flex items-center justify-between group transition-all duration-300 shadow-xl shadow-black/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500 group-hover:bg-emerald-500/20 transition-all">
                                            <Download className="text-emerald-500 w-5 h-5 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                                                {currentLang === 'es' ? 'Descargar Reporte' : 'Download Report'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                <FileText size={9} />
                                                <span>PDF • {currentLang === 'es' ? 'Completo' : 'Full'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-slate-600 group-hover:text-emerald-500 transition-colors pointer-events-none transform group-hover:translate-x-1 duration-300">
                                        →
                                    </div>
                                </button>

                                <div className="text-center mt-4 mb-2">
                                    <span className="text-[10px] text-slate-500 italic block">
                                        {currentLang === 'es'
                                            ? 'El canal permanece abierto para consultas adicionales.'
                                            : 'Channel remains open for further inquiries.'}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* INPUT AREA (Always visible in Active/Debrief) */}
                    <div className="p-3 border-t border-slate-800 bg-slate-950 flex-shrink-0 z-20">
                        {overmindState.status === 'debrief' && (
                            <div className="flex items-center gap-2 mb-2 px-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[9px] text-emerald-500 font-bold tracking-wide uppercase">
                                    {currentLang === 'es' ? 'Modo Consultivo Activado' : 'Consultative Mode Active'}
                                </span>
                            </div>
                        )}
                        <div className="relative">
                            {/* ✅ BATCH 4.5: @Mentions Dropdown */}
                            {mentionState.show && (
                                <MentionsDropdown
                                    roles={mentionState.filteredRoles}
                                    selectedIndex={mentionState.selectedIndex}
                                    onSelect={(roleName) => {
                                        const { newText, newCursorPosition } = insertMention(query, cursorPosition, roleName);
                                        setQuery(newText);
                                        mentionState.closeMentions();
                                        setTimeout(() => {
                                            inputRef.current?.focus();
                                            inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
                                        }, 0);
                                    }}
                                    language={currentLang}
                                />
                            )}
                            <textarea
                                ref={inputRef as any}
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setCursorPosition(e.target.selectionStart || 0);
                                }}
                                onKeyDown={(e) => {
                                    // ✅ BATCH 4.5: Handle mentions keyboard navigation
                                    if (mentionState.show) {
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            mentionState.selectMention(mentionState.selectedIndex + 1);
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            mentionState.selectMention(mentionState.selectedIndex - 1);
                                        } else if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (mentionState.filteredRoles.length > 0) {
                                                const { newText, newCursorPosition } = insertMention(
                                                    query,
                                                    cursorPosition,
                                                    mentionState.filteredRoles[mentionState.selectedIndex].displayName
                                                );
                                                setQuery(newText);
                                                mentionState.closeMentions();
                                                setTimeout(() => {
                                                    (inputRef.current as any)?.setSelectionRange(newCursorPosition, newCursorPosition);
                                                }, 0);
                                            }
                                        } else if (e.key === 'Escape') {
                                            mentionState.closeMentions();
                                        }
                                    } else if (e.key === 'Enter' && !e.shiftKey) {
                                        // ✅ BATCH 6: Enter sends, Shift+Enter new line
                                        e.preventDefault();
                                        handleSendQuery();
                                    }
                                }}
                                placeholder={
                                    overmindState.status === 'debrief'
                                        ? (currentLang === 'es' ? "Pregunta a los expertos..." : "Ask the experts...")
                                        : (currentLang === 'es' ? "Escribe tu intervención..." : "Type your intervention...")
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-24 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600 resize-none overflow-y-auto"
                                style={{ minHeight: '48px', maxHeight: '150px' }}
                            />
                            {/* ✅ BATCH 5: Voice Button */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                <VoiceButton
                                    state={voiceInteraction.state}
                                    isSupported={voiceInteraction.isSupported}
                                    onToggle={handleVoiceToggle}
                                    disabled={overmindState.status !== 'active' && overmindState.status !== 'debrief'}
                                    language={currentLang}
                                    transcript={voiceInteraction.transcript} // ✅ FIX: Show live transcript
                                />
                            </div>
                            <button
                                onClick={() => handleSendQuery()}
                                disabled={!query.trim()}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 ${query.trim()
                                    ? 'text-cyan-500 hover:text-white bg-cyan-500/10 hover:bg-cyan-500'
                                    : 'text-slate-600 bg-slate-800/50'
                                    }`}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
