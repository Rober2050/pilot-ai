import { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { Database, Cloud, Play, Square, Activity, HelpCircle, Server, User, Globe, Box, Cpu } from 'lucide-react';

type AutoLevel = 'auto' | 'hybrid' | 'manual';

const AutoBadge = ({ level }: { level: AutoLevel }) => {
    const config = {
        auto: { label: 'AUTO', bg: 'bg-emerald-500' },
        hybrid: { label: 'MIX', bg: 'bg-amber-400' },
        manual: { label: 'MAN', bg: 'bg-slate-400' },
    }[level];
    return (
        <span
            className={`absolute -top-2.5 -right-2 z-30 text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded-full border-2 border-white shadow-md ${config.bg} text-white`}
            title={level === 'auto' ? 'Automatizable 100%' : level === 'hybrid' ? 'Automatización parcial (híbrido)' : 'Requiere intervención humana'}
        >
            {config.label}
        </span>
    );
};

const getNodeIcon = (type?: string) => {
    switch (type) {
        case 'database': return <Database className="w-5 h-5 text-blue-600" />;
        case 'cloud': return <Cloud className="w-5 h-5 text-sky-500" />;
        case 'start': return <Play className="w-5 h-5 text-green-600 fill-green-100" />;
        case 'end': return <Square className="w-5 h-5 text-red-600 fill-red-100" />;
        case 'condition': return <HelpCircle className="w-5 h-5 text-orange-500" />;
        case 'server': return <Server className="w-5 h-5 text-slate-600" />;
        case 'user': return <User className="w-5 h-5 text-indigo-600" />;
        case 'web': return <Globe className="w-5 h-5 text-cyan-600" />;
        default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
};

const getNodeStyle = (type?: string) => {
    const base = "px-4 py-3 shadow-lg border-2 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5";

    switch (type) {
        case 'start':
            return `${base} min-w-[180px] bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 rounded-full`;
        case 'end':
            return `${base} min-w-[180px] bg-gradient-to-br from-red-50 to-rose-50 border-red-500 border-4 rounded-full shadow-red-100/50`;
        case 'condition':
            return `${base} w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 border-orange-400`;
        case 'database':
            return `${base} min-w-[180px] bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 rounded-xl border-b-4`;
        case 'cloud':
            return `${base} min-w-[180px] bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-400 rounded-2xl border-dashed`;
        case 'group':
            return "px-4 py-10 bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-xl";
        default:
            return `${base} min-w-[180px] bg-white border-slate-200 rounded-xl`;
    }
};

// ─── C4 Architecture Node Types ────────────────────────────────────────────

/** C4 Level 1: Person — human actor who interacts with the system */
export const C4PersonNode = memo(({ data, selected }: NodeProps) => (
    <div className={`flex flex-col items-center gap-1.5 p-3 w-[140px] ${selected ? 'ring-2 ring-indigo-400 ring-offset-2 rounded-2xl' : ''}`}>
        <Handle type="target" position={Position.Top} id="top" className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white z-20" />
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg border-2 border-white">
            <User className="w-7 h-7 text-white" />
        </div>
        <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">{data.label}</span>
        {data.description && (
            <span className="text-[9px] text-slate-500 text-center leading-tight px-1">{data.description}</span>
        )}
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white z-20" />
        <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white z-20" />
        <Handle type="target" position={Position.Left} id="left" className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white z-20" />
    </div>
));

/** C4 Level 1: Software System — the system being designed */
export const C4SoftwareSystemNode = memo(({ data, selected }: NodeProps) => (
    <div className={`flex flex-col items-center gap-2 px-4 py-3 min-w-[160px] max-w-[200px] bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl shadow-xl border-2 ${selected ? 'border-white ring-4 ring-indigo-300/50' : 'border-indigo-400'} transition-all`}>
        <Handle type="target" position={Position.Top} id="top" className="!w-3 !h-3 !bg-white !border-2 !border-indigo-400 z-20" />
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
        </div>
        <span className="text-[12px] font-extrabold text-white text-center leading-tight">{data.label}</span>
        {data.description && (
            <span className="text-[9px] text-indigo-200 text-center leading-tight px-1">{data.description}</span>
        )}
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-white !border-2 !border-indigo-400 z-20" />
        <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-white !border-2 !border-indigo-400 z-20" />
        <Handle type="target" position={Position.Left} id="left" className="!w-3 !h-3 !bg-white !border-2 !border-indigo-400 z-20" />
    </div>
));

/** C4 Level 2: Container — deployable unit (web app, API, service) */
export const C4ContainerNode = memo(({ data, selected }: NodeProps) => (
    <div className={`flex flex-col gap-1.5 px-4 py-3 min-w-[160px] max-w-[200px] bg-white rounded-xl shadow-md border-2 ${selected ? 'border-blue-500 ring-4 ring-blue-200/50' : 'border-blue-300'} transition-all hover:shadow-lg`}>
        <Handle type="target" position={Position.Top} id="top" className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white z-20" />
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Box className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[12px] font-bold text-slate-800 leading-tight">{data.label}</span>
        </div>
        {data.description && (
            <span className="text-[9px] text-slate-500 leading-tight border-t border-slate-100 pt-1.5">{data.description}</span>
        )}
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white z-20" />
        <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white z-20" />
        <Handle type="target" position={Position.Left} id="left" className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white z-20" />
    </div>
));

/** C4 Level 2: Database — any data store (relational, NoSQL, cache) */
export const C4DatabaseNode = memo(({ data, selected }: NodeProps) => (
    <div className={`flex flex-col gap-1.5 px-4 py-3 min-w-[150px] max-w-[190px] bg-white rounded-xl shadow-md border-2 border-b-4 ${selected ? 'border-cyan-500 ring-4 ring-cyan-200/50' : 'border-cyan-300'} transition-all hover:shadow-lg`}>
        <Handle type="target" position={Position.Top} id="top" className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white z-20" />
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-cyan-600" />
            </div>
            <span className="text-[12px] font-bold text-slate-800 leading-tight">{data.label}</span>
        </div>
        {data.description && (
            <span className="text-[9px] text-slate-500 leading-tight border-t border-slate-100 pt-1.5">{data.description}</span>
        )}
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white z-20" />
        <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white z-20" />
        <Handle type="target" position={Position.Left} id="left" className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-white z-20" />
    </div>
));

/** C4 Level 1 & 2: External System — third-party service outside the boundary */
export const C4ExternalSystemNode = memo(({ data, selected }: NodeProps) => (
    <div className={`flex flex-col gap-1.5 px-4 py-3 min-w-[150px] max-w-[190px] bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-md border-2 border-dashed ${selected ? 'border-teal-500 ring-4 ring-teal-200/50' : 'border-teal-300'} transition-all hover:shadow-lg`}>
        <Handle type="target" position={Position.Top} id="top" className="!w-3 !h-3 !bg-teal-400 !border-2 !border-white z-20" />
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-[12px] font-bold text-teal-800 leading-tight">{data.label}</span>
        </div>
        {data.description && (
            <span className="text-[9px] text-teal-600/70 leading-tight border-t border-teal-100 pt-1.5">{data.description}</span>
        )}
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-teal-400 !border-2 !border-white z-20" />
        <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-teal-400 !border-2 !border-white z-20" />
        <Handle type="target" position={Position.Left} id="left" className="!w-3 !h-3 !bg-teal-400 !border-2 !border-white z-20" />
    </div>
));

// ─── BPMN / Process Node ────────────────────────────────────────────────────
export const CustomNode = memo(({ data, type, selected }: NodeProps) => {
    const isGroup = type === 'group';
    const isCondition = type === 'condition';
    const styleClass = getNodeStyle(type);
    const icon = getNodeIcon(type);

    if (isGroup) {
        const accentColor: string = data.accentColor || '#6366f1';
        const headerBg: string = data.headerBg || '#eef2ff';

        return (
            <div className="relative h-full w-full">
                <NodeResizer
                    color={accentColor}
                    isVisible={selected}
                    minWidth={260}
                    minHeight={200}
                />

                {/* Column header — full-width colored strip */}
                <div
                    className="absolute top-0 left-0 right-0 flex items-center gap-2.5 px-4 border-b border-slate-300/60"
                    style={{ height: '48px', backgroundColor: headerBg }}
                >
                    {/* Accent pill */}
                    <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: accentColor }}
                    />
                    <span
                        className="text-[12px] font-extrabold uppercase tracking-widest truncate"
                        style={{ color: accentColor }}
                    >
                        {data.label}
                    </span>
                </div>
            </div>
        );
    }

    if (isCondition) {
        return (
            <div className="relative w-[120px] h-[120px] flex items-center justify-center">
                {data.automationLevel && <AutoBadge level={data.automationLevel as AutoLevel} />}
                {/* Diamond Shape Background - Absolute Fill + Pure Rotation */}
                <div className={`${styleClass} absolute inset-0 transform rotate-45 rounded-xl ${selected ? 'border-primary-500 ring-4 ring-primary-100 scale-105' : ''}`}></div>

                {/* Content (Counter-rotated if we were rotating the parent, but here we just overlay) */}
                {/* Actually, since the background is absolute and rotated, the content is relative and NOT rotated, so it sits on top naturally. */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                    <div className="mb-2 p-1.5 rounded-full bg-white/60 shadow-sm">
                        {icon}
                    </div>
                    <span className="text-xs font-bold text-slate-700 leading-tight max-w-[100px]">
                        {data.label}
                    </span>
                </div>

                {/* Handles - Positioned for Diamond - Explicit IDs for intelligent branching */}
                <Handle
                    type="target"
                    position={Position.Top}
                    id="top"
                    className="!w-4 !h-4 !bg-slate-400 !border-2 !border-white !-mt-2.5 z-20 transition-transform hover:scale-150 cursor-crosshair"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="si"
                    className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-white !-mr-2.5 z-20 transition-transform hover:scale-150 cursor-crosshair"
                />
                <Handle
                    type="source"
                    position={Position.Left}
                    id="no"
                    className="!w-4 !h-4 !bg-red-500 !border-2 !border-white !-ml-2.5 z-20 transition-transform hover:scale-150 cursor-crosshair"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="bottom"
                    className="!w-4 !h-4 !bg-slate-300 !border-2 !border-white !-mb-2.5 z-20 transition-transform hover:scale-150 cursor-crosshair"
                />
            </div>
        );
    }

    return (
        <div className={`${styleClass} ${selected ? 'border-primary-500 ring-4 ring-primary-100' : ''} flex items-center gap-3 relative`}>
            {data.automationLevel && <AutoBadge level={data.automationLevel as AutoLevel} />}
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                className="!w-4 !h-4 !bg-slate-400 !border-2 !border-white !-mt-2 z-20 transition-all hover:!bg-primary-500 hover:scale-150 cursor-crosshair"
            />

            {/* Icon Container */}
            <div className={`p-2 rounded-lg bg-white/80 shadow-sm border border-slate-100 shrink-0`}>
                {icon}
            </div>

            {/* Label */}
            <div className="flex-1 text-center">
                <span className="text-sm font-semibold text-slate-700 leading-tight block">
                    {data.label}
                </span>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                className="!w-4 !h-4 !bg-slate-400 !border-2 !border-white !-mb-2 z-20 transition-all hover:!bg-primary-500 hover:scale-150 cursor-crosshair"
            />

            {/* Logic for End Node additional visual cue (Standard BPMN) */}
            {type === 'end' && (
                <div className="absolute inset-1 border border-red-200 rounded-full -z-10 opacity-50"></div>
            )}
        </div>
    );
});
