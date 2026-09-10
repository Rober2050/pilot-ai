import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Minimize2, Activity, ShieldAlert, CheckCircle2, Map } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell, YAxis } from 'recharts';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

interface ChatMessage {
    id: string;
    roleId: string;
    roleName: string;
    content: string;
    timestamp: number;
    isSystem?: boolean;
    isModerator?: boolean;
}

interface ElegantChatBoxProps {
    messages: ChatMessage[];
    language: 'es' | 'en';
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

// Color palette by role
const roleColors = {
    'product-manager': {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-200',
        name: 'text-purple-400',
        glow: 'shadow-[0_0_10px_rgba(168,85,247,0.3)]'
    },
    'architect': {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-200',
        name: 'text-blue-400',
        glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]'
    },
    'business-analyst': {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-200',
        name: 'text-emerald-400',
        glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]'
    },
    'ux-designer': {
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/30',
        text: 'text-pink-200',
        name: 'text-pink-400',
        glow: 'shadow-[0_0_10px_rgba(236,72,153,0.3)]'
    },
    'developer': {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-200',
        name: 'text-orange-400',
        glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]'
    },
    'qa-engineer': {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        text: 'text-cyan-200',
        name: 'text-cyan-400',
        glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]'
    },
    'strategy-analyst': {
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/30',
        text: 'text-indigo-200',
        name: 'text-indigo-400',
        glow: 'shadow-[0_0_10px_rgba(99,102,241,0.3)]'
    },
    'moderator': {
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        text: 'text-slate-200',
        name: 'text-slate-400',
        glow: 'shadow-[0_0_10px_rgba(100,116,139,0.3)]'
    }
};

export const ElegantChatBox: React.FC<ElegantChatBoxProps> = ({
    messages,
    language,
    isExpanded = true,
    onToggleExpand
}) => {
    const { t } = useTranslation('translation');
    const [height, setHeight] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle resize
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newHeight = containerRect.bottom - e.clientY;

            // Min height: 200px, Max height: 600px
            if (newHeight >= 200 && newHeight <= 600) {
                setHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const getRoleColor = (roleId: string) => {
        const normalizedId = roleId.toLowerCase().replace(/\s+/g, '-');
        return roleColors[normalizedId as keyof typeof roleColors] || roleColors['moderator'];
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /**
     * Parse and render content - detects JSON and renders it beautifully
     * Falls back to plain text if not JSON
     */
    const parseAndRenderContent = (content: string) => {
        // Try to detect JSON patterns
        const jsonPattern = /\{[\s\S]*"[\w_]+"[\s\S]*:[\s\S]*\}/;
        if (!jsonPattern.test(content)) {
            // Plain text - render as is
            return <span>{content}</span>;
        }

        try {
            // Try to parse as JSON
            const parsed = JSON.parse(content);

            // Render as beautiful UI
            // 0. VISUAL ARTIFACT INTERCEPTOR (Priority 1)
            let visualArtifactNode: React.ReactNode = null;
            if (parsed.visual_artifact?.type && parsed.visual_artifact?.data) {
                try {
                    const artifactData = parsed.visual_artifact.data; // Native object now, no JSON.parse needed
                    if (parsed.visual_artifact.type === 'react-flow') {
                        // Render Diagram/Map
                        const nodes = artifactData.nodes || [];
                        const edges = artifactData.edges || [];
                        visualArtifactNode = (
                            <div className="mt-4 p-1 bg-slate-900 rounded-xl border border-white/10 shadow-inner overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border-b border-white/5">
                                    <Map className="w-4 h-4 text-cyan-400" />
                                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Interactive Map Generated</span>
                                </div>
                                <div className="h-[250px] w-full bg-slate-950 relative">
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        fitView
                                        proOptions={{ hideAttribution: true }}
                                    >
                                        <Background color="#1e293b" gap={20} size={1} />
                                        <Controls className="bg-slate-900 border-slate-800 fill-white !mb-2 !mr-2" showInteractive={false} />
                                    </ReactFlow>
                                </div>
                            </div>
                        );
                    }
                    if (parsed.visual_artifact.type === 'recharts') {
                        visualArtifactNode = (
                            <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-white/5">
                                {/* Future complex chart implementations go here */}
                                <div className="text-xs text-slate-400 italic">Advanced statistical chart rendered.</div>
                            </div>
                        );
                    }
                } catch (e) {
                    console.error("Failed to parse visual_artifact data", e);
                }
            }

            // 1. STANDARD SIMULATION RESPONSE INTERCEPTOR
            if (parsed.public_message !== undefined) {
                return (
                    <div className="space-y-3">
                        {/* Simulation Thought (Internal reasoning, subtly shown) */}
                        {parsed.simulation_thought && (
                            <div className="text-slate-400 text-xs italic border-l-2 border-slate-700/50 pl-2 bg-slate-800/20 py-1 pr-2 rounded-r-md">
                                🧠 {parsed.simulation_thought}
                            </div>
                        )}

                        {/* Public Message (The actual spoken text) */}
                        <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                            {parsed.public_message}
                        </div>

                        {/* INJECT VISUAL ARTIFACT IN THE MIDDLE OF THE MESSAGE IF PRESENT */}
                        {visualArtifactNode}

                        {/* Chart Update Visual Intercept */}
                        {Array.isArray(parsed.chart_update) && parsed.chart_update.length === 4 && (
                            <div className="mt-4 p-3 bg-slate-900/40 rounded-xl border border-white/5 shadow-inner">
                                <div className="flex items-center gap-1.5 text-[10px] text-cyan-500/70 uppercase tracking-widest mb-3 font-mono font-semibold">
                                    <Activity className="w-3 h-3" /> Impact Analysis
                                </div>
                                <div className="h-16 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={parsed.chart_update.map((val: number, i: number) => ({
                                            name: ['Market', 'Tech', 'Risk', 'Cost'][i] || `M${i}`,
                                            value: val
                                        }))}>
                                            <YAxis domain={[0, 100]} hide />
                                            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                                {parsed.chart_update.map((val: number, index: number) => {
                                                    const color = val > 75 ? '#34d399' : val > 40 ? '#fbbf24' : '#f87171';
                                                    return <Cell key={`cell-${index}`} fill={color} /> as React.ReactElement;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Chart Labels */}
                                <div className="flex justify-between mt-2 px-1">
                                    {['Market', 'Tech', 'Risk', 'Cost'].map((label, i) => (
                                        <div key={i} className="text-[9px] text-slate-500 font-mono text-center w-1/4">
                                            {label}<br />
                                            <span className="text-slate-300 font-bold">{parsed.chart_update[i]}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Render any residual unidentified keys below */}
                        {Object.entries(parsed).filter(([k]) => !['simulation_thought', 'public_message', 'chart_update', 'visual_artifact'].includes(k)).length > 0 && (
                            <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                                {Object.entries(parsed).map(([key, value]) => {
                                    if (['simulation_thought', 'public_message', 'chart_update', 'visual_artifact'].includes(key)) return null;
                                    return (
                                        <div key={key} className="flex items-start gap-2">
                                            <span className="text-slate-500 text-[10px] uppercase font-mono mt-0.5">{key}:</span>
                                            <span className="text-slate-400 text-xs">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            }

            // 2. GATEKEEPER VALIDATION INTERCEPTOR
            if (parsed.valid !== undefined && parsed.reason !== undefined) {
                return (
                    <div className={`p-3 rounded-lg border ${parsed.valid ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {parsed.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-red-400" />}
                            <span className={`text-xs font-bold uppercase ${parsed.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                                {parsed.valid ? 'Topic Accepted' : 'Topic Rejected'}
                            </span>
                        </div>
                        <p className="text-slate-300 text-sm mt-2">{parsed.reason}</p>
                    </div>
                );
            }

            // 3. ASK DEBRIEF INTERCEPTOR
            if (parsed.text !== undefined && parsed.role !== undefined) {
                return (
                    <div className="space-y-1">
                        <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                            {parsed.text}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono uppercase text-right opacity-50">
                            Speaking as: {parsed.role}
                        </div>
                    </div>
                );
            }

            // 4. FALLBACK FULL JSON RENDERER
            return (
                <div className="space-y-2">
                    {Object.entries(parsed).map(([key, value]) => {
                        // Skip null/undefined
                        if (value === null || value === undefined) return null;

                        // Objects and Arrays
                        if (typeof value === 'object') {
                            return (
                                <div key={key} className="mt-1">
                                    <span className="text-slate-500 text-[10px] uppercase block mb-1 font-mono">{key}:</span>
                                    <div className="bg-slate-900/60 rounded p-2 text-xs font-mono text-slate-400 whitespace-pre-wrap">
                                        {JSON.stringify(value, null, 2)}
                                    </div>
                                </div>
                            );
                        }

                        // Default key-value pair
                        return (
                            <div key={key} className="flex items-start gap-2">
                                <span className="text-slate-500 text-[10px] uppercase font-mono mt-0.5">{key}:</span>
                                <span className="text-slate-300 text-sm">{String(value)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        } catch (e) {
            // Not valid JSON - render as plain text
            return <span>{content}</span>;
        }
    };

    if (!isExpanded) {
        // Collapsed state - minimal bar
        return (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                <button
                    onClick={onToggleExpand}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
                >
                    <span className="text-cyan-400 font-mono text-sm">
                        💬 {messages.length} {language === 'es' ? 'mensajes' : 'messages'}
                    </span>
                    <Maximize2 className="w-4 h-4 text-cyan-400" />
                </button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
            style={{ width: 'min(90%, 800px)' }}
        >
            {/* Resize Handle */}
            <div
                onMouseDown={handleMouseDown}
                className={`
                    absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full cursor-ns-resize
                    ${isResizing ? 'bg-cyan-400' : 'bg-slate-600 hover:bg-cyan-500'}
                    transition-colors
                `}
            />

            <div
                className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                style={{ height: `${height}px` }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-800/50">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        💬 {language === 'es' ? 'Conversación' : 'Conversation'}
                        <span className="text-xs text-slate-400 font-mono">
                            ({messages.length})
                        </span>
                    </h3>
                    <button
                        onClick={onToggleExpand}
                        className="text-slate-400 hover:text-white transition-colors"
                        title={language === 'es' ? 'Minimizar' : 'Minimize'}
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-3 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                            {language === 'es'
                                ? 'Esperando mensajes...'
                                : 'Waiting for messages...'}
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const colors = getRoleColor(msg.roleId);

                            return (
                                <div
                                    key={msg.id}
                                    className={`
                                        ${colors.bg} 
                                        ${colors.border} 
                                        ${colors.glow}
                                        border rounded-xl p-4
                                        backdrop-blur-sm
                                        transition-all duration-300
                                        hover:scale-[1.01]
                                    `}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`${colors.name} font-bold text-sm uppercase tracking-wider`}>
                                            {msg.roleName}
                                        </span>
                                        <span className="text-slate-500 text-xs font-mono">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </div>
                                    <div className={`${colors.text} leading-relaxed text-sm`}>
                                        {parseAndRenderContent(msg.content)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.5);
                }
            `}</style>
        </div>
    );
};
