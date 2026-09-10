import { motion } from 'framer-motion';
import {
    User, UploadCloud, ShieldCheck, Database, Code,
    LineChart, Target, Cpu, BrainCircuit, Network, Globe, FileJson,
    Braces, FileText, FileSpreadsheet, Presentation, Workflow,
    Zap, Info
} from 'lucide-react';

// Minimal icon registry — only icons used by the tour configs.
// Add new icons here instead of using `import * as LucideIcons`.
const ICON_MAP: Record<string, React.ComponentType<any>> = {
    User, UploadCloud, ShieldCheck, Database, Code,
    LineChart, Target, Cpu, BrainCircuit, Network, Globe, FileJson,
    Braces, FileText, FileSpreadsheet, Presentation, Workflow,
    Zap, Info
};

const COLORS: any = {
    cyan: { bg: 'bg-cyan-500', ring: 'ring-cyan-500/30', gradient: 'from-cyan-600 to-cyan-400', text: 'text-cyan-400', bg_soft: 'bg-cyan-500/20' },
    purple: { bg: 'bg-purple-500', ring: 'ring-purple-500/30', gradient: 'from-purple-600 to-purple-400', text: 'text-purple-400', bg_soft: 'bg-purple-500/20' },
    emerald: { bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', gradient: 'from-emerald-600 to-emerald-400', text: 'text-emerald-400', bg_soft: 'bg-emerald-500/20' },
    amber: { bg: 'bg-amber-500', ring: 'ring-amber-500/30', gradient: 'from-amber-600 to-amber-400', text: 'text-amber-400', bg_soft: 'bg-amber-500/20' },
    red: { bg: 'bg-red-500', ring: 'ring-red-500/30', gradient: 'from-red-600 to-red-400', text: 'text-red-400', bg_soft: 'bg-red-500/20' },
    slate: { bg: 'bg-slate-500', ring: 'ring-slate-500/30', gradient: 'from-slate-600 to-slate-400', text: 'text-slate-400', bg_soft: 'bg-slate-500/20' },
};

const getColor = (colorName: string) => COLORS[colorName] || COLORS['cyan'];

export const GenericMatrix = ({ config }: { config: any }) => (
    <div className="relative w-full max-w-4xl h-[400px]">
        {/* Background Quadrants */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-cyan-500/10 border-2 border-cyan-500/20 rounded-lg" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-lg" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-amber-500/10 border-2 border-amber-500/20 rounded-lg" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-500/10 border-2 border-red-500/20 rounded-lg" />

        {/* Axes */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-slate-600" />
        <div className="absolute bottom-0 left-0 w-px h-full bg-slate-600" />

        {/* Labels */}
        <div className="absolute -bottom-8 right-0 text-xs text-slate-500 font-bold">{config.axes.x} →</div>
        <div className="absolute -left-20 top-0 text-xs text-slate-500 font-bold -rotate-90 origin-left">{config.axes.y} →</div>

        {/* Quadrant Labels */}
        {config.quadrants.map((q: any, i: number) => {
            const positions = [
                'top-4 left-4', 'top-4 right-4', 'bottom-4 right-4', 'bottom-4 left-4'
            ];
            const posClass = i === 0 ? 'top-4 left-4' : i === 1 ? 'top-4 right-4' : i === 2 ? 'bottom-4 left-4 text-red-400' : 'bottom-4 right-4';
            return (
                <div key={i} className={`absolute ${posClass} text-sm font-bold opacity-80`} style={{ color: q.color }}>
                    {q.label}
                </div>
            );
        })}

        {/* Data Points */}
        {config.data.map((point: any, i: number) => {
            const colors = getColor(point.color);
            return (
                <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                    className="absolute group cursor-pointer"
                    style={{ left: `${point.x}%`, bottom: `${point.y}%` }}
                >
                    <div className={`w-8 h-8 rounded-full shadow-xl flex items-center justify-center font-bold text-white text-xs ${colors.bg} ring-4 ${colors.ring}`}>
                        {point.id}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 whitespace-nowrap text-xs z-10 pointer-events-none min-w-[120px]">
                        <div className="font-bold text-white">{point.label}</div>
                        {point.tooltip && <div className="text-slate-400 mt-1">{point.tooltip}</div>}
                    </div>
                </motion.div>
            );
        })}
    </div>
);

export const GenericBarChart = ({ config }: { config: any }) => (
    <div className="w-full max-w-3xl h-80 flex items-end justify-around gap-4 px-4 relative">
        {/* Y-axis simple grid */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-700" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-700" />

        {config.data.map((item: any, i: number) => {
            const colors = getColor(item.color || 'cyan');
            return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${item.heightPercentage}%` }}
                        transition={{ delay: i * 0.15, duration: 0.8 }}
                        className={`w-full max-w-[60px] rounded-t-lg bg-gradient-to-t ${colors.gradient} relative overflow-hidden`}
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>

                    <div className="mt-4 text-sm font-medium text-slate-400">{item.label}</div>

                    {/* Floating Value */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="absolute bottom-[calc(100%+8px)] font-bold text-white text-lg"
                        style={{ bottom: `${item.heightPercentage}%`, marginBottom: '12px' }}
                    >
                        {item.value}
                    </motion.div>

                    {item.secondaryValue && (
                        <div className={`absolute -top-8 px-2 py-1 ${colors.bg_soft} ${colors.text} text-xs rounded font-bold`}>
                            {item.secondaryValue}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);

export const GenericProcessFlow = ({ config }: { config: any }) => {
    // Responsive Layout Engine
    // We calculate coordinates based on logical 'gridCol' and 'gridRow' if available in AI output
    // Fallback to strict X/Y if old format
    // But we prefer to recalculate X to ensure it fits nicely.

    // 1. Determine Grid Dimensions
    const nodes = config.nodes || [];
    const maxCol = Math.max(...nodes.map((n: any) => n.gridCol || 1), 5); // Minimum 5 columns for spacing

    // 2. Constants for Layout
    const BASE_Y = 150;
    const ROW_HEIGHT = 120;
    const VIEW_WIDTH = 1200;
    const VIEW_HEIGHT = 400;
    const PADDING_X = 100;
    const AVAILABLE_WIDTH = VIEW_WIDTH - (PADDING_X * 2);
    const COL_WIDTH = AVAILABLE_WIDTH / Math.max(1, maxCol - 1 || 1);

    // 3. Helper to get coordinates
    const getCoords = (node: any) => {
        // If modern grid format
        if (node.gridCol !== undefined) {
            const col = node.gridCol - 1; // 0-indexed
            const row = (node.gridRow || 1) - 1; // 0-indexed
            return {
                x: PADDING_X + (col * COL_WIDTH),
                y: BASE_Y + (row * ROW_HEIGHT)
            };
        }
        // Fallback or "Hybrid": if X/Y provided but we want to scale X?
        // Let's rely on mapping strict X to grid if feasible, or just return raw X/Y
        return { x: node.x, y: node.y };
    };

        return (
            <svg className="w-full max-w-full h-auto min-h-[300px]" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="arrowhead-gen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
                    </marker>
                    {/* Add a subtle glow filter for that "stunning" technical look */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Render Connections */}
                {config.connections.map((conn: any, i: number) => {
                    const startNode = nodes.find((n: any) => n.id === conn.from);
                    const endNode = nodes.find((n: any) => n.id === conn.to);
                    if (!startNode || !endNode) return null;

                    const start = getCoords(startNode);
                    const end = getCoords(endNode);

                    let x1 = start.x;
                    let x2 = end.x;
                    let y1 = start.y;
                    let y2 = end.y;

                    const getXOffset = (node: any) => ['rect', 'diamond', 'document'].includes(node.type) ? 70 : 45;
                    const getYOffset = (node: any) => ['diamond', 'database'].includes(node.type) ? 50 : 40;

                    if (start.x < end.x) {
                        x1 += getXOffset(startNode);
                        x2 -= getXOffset(endNode);
                    } else if (start.x > end.x) {
                        x1 -= getXOffset(startNode);
                        x2 += getXOffset(endNode);
                    }
                    
                    if (start.y < end.y && Math.abs(start.x - end.x) < 50) {
                        y1 += getYOffset(startNode);
                        y2 -= getYOffset(endNode);
                    } else if (start.y > end.y && Math.abs(start.x - end.x) < 50) {
                        y1 -= getYOffset(startNode);
                        y2 += getYOffset(endNode);
                    }

                    // A nice curved path
                    const pathD = Math.abs(start.y - end.y) > 20 
                        ? `M ${x1} ${y1} C ${x1 + Math.max(50, (x2-x1)/2)} ${y1}, ${x1 + Math.max(50, (x2-x1)/2)} ${y2}, ${x2} ${y2}`
                        : `M ${x1} ${y1} L ${x2} ${y2}`;

                    return (
                        <motion.path
                            key={`path-${i}`}
                            d={pathD}
                            fill="none"
                            stroke={conn.color || "#8b5cf6"}
                            strokeWidth="3"
                            markerEnd="url(#arrowhead-gen)"
                            strokeDasharray={conn.style === 'dashed' ? "6,6" : "0"}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: i * 0.2 }}
                            filter="url(#glow)"
                        />
                    );
                })}

                {/* Render Nodes */}
                {nodes.map((node: any, i: number) => {
                    const { x, y } = getCoords(node);
                    const strokeColor = node.color || "#06b6d4";
                    
                    // Render Lucide Icon if provided
                    const IconComponent = node.icon ? ICON_MAP[node.icon] ?? null : null;

                    return (
                        <g key={`node-${i}`}>
                            {/* Shape Render */}
                            {node.type === 'circle' && (
                                <motion.circle
                                    cx={x} cy={y} r="45"
                                    fill="rgba(15, 23, 42, 0.8)" stroke={strokeColor} strokeWidth="3"
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                                    filter="url(#glow)"
                                />
                            )}
                            {node.type === 'rect' && (
                                <motion.rect
                                    x={x - 65} y={y - 35} width="130" height="70" rx="16"
                                    fill="rgba(15, 23, 42, 0.8)" stroke={strokeColor} strokeWidth="3"
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                                    filter="url(#glow)"
                                />
                            )}
                            {node.type === 'diamond' && (
                                <motion.path
                                    d={`M ${x} ${y - 45} L ${x + 65} ${y} L ${x} ${y + 45} L ${x - 65} ${y} Z`}
                                    fill="rgba(15, 23, 42, 0.8)" stroke={strokeColor} strokeWidth="3"
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                                    filter="url(#glow)"
                                />
                            )}
                            {node.type === 'database' && (
                                <motion.path
                                    d={`M ${x - 45} ${y - 15} C ${x - 45} ${y - 35}, ${x + 45} ${y - 35}, ${x + 45} ${y - 15} L ${x + 45} ${y + 25} C ${x + 45} ${y + 45}, ${x - 45} ${y + 45}, ${x - 45} ${y + 25} Z`}
                                    fill="rgba(15, 23, 42, 0.8)" stroke={strokeColor} strokeWidth="3"
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                                    filter="url(#glow)"
                                />
                            )}
                            {node.type === 'database' && (
                                <motion.path
                                    d={`M ${x - 45} ${y - 15} C ${x - 45} ${y + 5}, ${x + 45} ${y + 5}, ${x + 45} ${y - 15}`}
                                    fill="none" stroke={strokeColor} strokeWidth="3"
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                                />
                            )}
                            {node.type === 'document' && (
                                <motion.path
                                    d={`M ${x - 45} ${y - 40} L ${x + 25} ${y - 40} L ${x + 45} ${y - 20} L ${x + 45} ${y + 40} L ${x - 45} ${y + 40} Z`}
                                    fill="rgba(15, 23, 42, 0.8)" stroke={strokeColor} strokeWidth="3"
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                                    filter="url(#glow)"
                                />
                            )}

                            {/* Inner Icon Render */}
                            {IconComponent && (
                                <motion.foreignObject 
                                    x={x - 16} y={y - 16} width="32" height="32"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 + 0.3 }}
                                >
                                    <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                        <IconComponent size={24} style={{ color: strokeColor }} />
                                    </div>
                                </motion.foreignObject>
                            )}

                            {/* Label Render - Floating Below with Sublabel support */}
                            <g>
                                <rect
                                    x={x - 85}
                                    y={y + 55}
                                    width="170"
                                    height={node.sublabel ? "44" : "28"}
                                    rx="8"
                                    fill="rgba(15, 23, 42, 0.95)"
                                    stroke="rgba(51, 65, 85, 0.8)"
                                    strokeWidth="1"
                                    filter="url(#glow)"
                                />
                                <text
                                    x={x}
                                    y={node.sublabel ? y + 74 : y + 74}
                                    textAnchor="middle"
                                    className="text-[13px] fill-white font-bold pointer-events-none tracking-wide drop-shadow-md"
                                >
                                    {node.label}
                                </text>
                                {node.sublabel && (
                                    <text
                                        x={x}
                                        y={y + 90}
                                        textAnchor="middle"
                                        className="text-[11px] fill-slate-400 font-medium pointer-events-none tracking-wide"
                                    >
                                        {node.sublabel}
                                    </text>
                                )}
                            </g>
                        </g>
                    );
                })}
            </svg>
        );
};
