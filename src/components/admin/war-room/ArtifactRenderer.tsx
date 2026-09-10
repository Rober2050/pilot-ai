import React, { useMemo, useState, useRef, useCallback } from 'react';
import ReactFlow, { Background, Controls, Handle, Position, Panel } from 'reactflow';
import { Map, Maximize2, Minimize2, Download, BarChart2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import 'reactflow/dist/style.css';

// --- CUSTOM ELEGANT NODE ---
const ElegantNode = ({ data }: any) => {
    return (
        <div className="px-4 py-3 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-xl bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md min-w-[150px] text-center transition-all hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-cyan-400 border-none" />
            <div className="text-sm font-bold text-cyan-50 tracking-wide">
                {data.label}
            </div>
            {data.details && (
                <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
                    {data.details}
                </div>
            )}
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-cyan-400 border-none" />
        </div>
    );
};

const nodeTypes = {
    elegant: ElegantNode,
};

// --- RENDERER COMPONENT ---
interface ArtifactRendererProps {
    artifact: {
        type: string;
        data: any;
    };
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ artifact }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const flowRef = useRef<HTMLDivElement>(null);

    // Ensure we handle both stringified and native JSON objects
    const parsedData = useMemo(() => {
        try {
            return typeof artifact.data === 'string' ? JSON.parse(artifact.data) : artifact.data;
        } catch (e) {
            console.error("Artifact Parser Error", e);
            return null;
        }
    }, [artifact.data]);

    // Force elegant nodes and graceful defaults
    const nodes = useMemo(() => {
        if (!parsedData?.nodes) return [];
        return parsedData.nodes.map((n: any) => ({
            ...n,
            type: 'elegant', // Force our custom elegant node
            style: { ...n.style, opacity: 1 },
        }));
    }, [parsedData]);

    const edges = useMemo(() => {
        if (!parsedData?.edges || !parsedData?.nodes) return [];

        // Sanitize: Only keep edges where BOTH source and target nodes actually exist.
        // This prevents React Flow Crash Error 008 if the AI hallucinates connections.
        const validNodeIds = new Set(parsedData.nodes.map((n: any) => n.id));

        return parsedData.edges
            .filter((e: any) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
            .map((e: any) => ({
                ...e,
                animated: true,
                style: { stroke: '#06b6d4', strokeWidth: 2, opacity: 0.6 }, // Cyan glowing edges
            }));
    }, [parsedData]);

    const handleDownload = useCallback(() => {
        if (flowRef.current === null) return;
        toPng(flowRef.current, { backgroundColor: '#020617', quality: 1, pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `pilotai-architecture-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error('Failed to download image', err);
            });
    }, []);

    if (!artifact || !artifact.type || !parsedData) return null;

    if (artifact.type === 'react-flow') {
        const renderGraph = () => (
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                proOptions={{ hideAttribution: true }}
                minZoom={0.1}
            >
                <Background color="#1e293b" gap={24} size={1} />
                <Controls className="bg-slate-900 border-slate-700 fill-slate-300" showInteractive={false} />
            </ReactFlow>
        );

        return (
            <>
                <div className="mt-4 mb-2 p-1 bg-slate-900 rounded-xl border border-white/10 shadow-inner overflow-hidden relative group">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Map className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Interactive Architecture</span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Expand Diagram"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Inline View */}
                    <div className="h-[300px] w-full bg-slate-950 relative" ref={flowRef}>
                        {renderGraph()}
                    </div>
                </div>

                {/* Fullscreen Overlay Modal */}
                {isExpanded && (
                    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-sm flex flex-col p-4 sm:p-8 pt-20 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4 bg-slate-900/50 p-4 rounded-xl border border-white/10 mt-12 sm:mt-0 shadow-xl relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                                    <Map className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-lg font-bold text-white uppercase tracking-widest">Strategy Flow Explorer</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Deep dive interactive mode</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] sm:text-sm font-semibold rounded-lg shadow-lg shadow-cyan-900/50 transition-all font-mono"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">EXPORT PNG</span>
                                </button>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="p-2 bg-slate-800 hover:bg-red-900/50 rounded-lg text-slate-300 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-900/50 shadow-lg"
                                    title="Close View"
                                >
                                    <Minimize2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {/* Expanded View */}
                        <div className="flex-1 w-full bg-slate-950 rounded-xl border border-slate-800 shadow-[0_0_50px_rgba(6,182,212,0.1)] relative overflow-hidden" ref={flowRef}>
                            {renderGraph()}
                        </div>
                    </div>
                )}
            </>
        );
    }

    if (artifact.type === 'recharts') {
        const category = parsedData.chart_category || 'bar';
        const rawSeries = parsedData.chart_series || [];
        // Enforce valid numerical data to prevent recharts from crashing
        const series = rawSeries.map((s: any) => ({
            name: s.name || 'Unknown',
            value: typeof s.value === 'number' ? s.value : parseFloat(s.value) || 0,
            fill: s.fill || '#06b6d4'
        }));

        const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308'];

        const renderChart = () => {
            if (category === 'pie') {
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={series} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {series.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill && entry.fill !== '#06b6d4' ? entry.fill : COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#bae6fd' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            } else if (category === 'line') {
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#bae6fd' }} />
                            <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4, strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            } else {
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={series} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#bae6fd' }} />
                            <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                                {series.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill && entry.fill !== '#06b6d4' ? entry.fill : COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
            }
        };

        return (
            <>
                <div className="mt-4 mb-2 p-1 bg-slate-900 rounded-xl border border-white/10 shadow-inner overflow-hidden relative group">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-pink-400" />
                            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Statistical Analysis</span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Expand Chart"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Inline View */}
                    <div className="h-[250px] w-full bg-slate-950 p-4" ref={flowRef}>
                        {renderChart()}
                    </div>
                </div>

                {/* Fullscreen Overlay Modal (Reused Logic) */}
                {isExpanded && (
                    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-sm flex flex-col p-4 sm:p-8 pt-20 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4 bg-slate-900/50 p-4 rounded-xl border border-white/10 mt-12 sm:mt-0 shadow-xl relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/20 rounded-lg border border-pink-500/30">
                                    <BarChart2 className="w-5 h-5 text-pink-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-lg font-bold text-white uppercase tracking-widest">Market Data & Stats</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Deep dive qualitative analytics</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-[10px] sm:text-sm font-semibold rounded-lg shadow-lg shadow-pink-900/50 transition-all font-mono"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">EXPORT PNG</span>
                                </button>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="p-2 bg-slate-800 hover:bg-red-900/50 rounded-lg text-slate-300 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-900/50 shadow-lg"
                                    title="Close View"
                                >
                                    <Minimize2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {/* Expanded View */}
                        <div className="flex-1 w-full bg-slate-950 rounded-xl border border-slate-800 shadow-[0_0_50px_rgba(236,72,153,0.1)] relative overflow-hidden p-8" ref={flowRef}>
                            {renderChart()}
                        </div>
                    </div>
                )}
            </>
        );
    }

    return null;
};
