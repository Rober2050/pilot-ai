import React from 'react';
import { Flag, CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react';

interface RoadmapPhase {
    id?: string;
    phase: string;
    timeline: string;
    goal?: string;
    description?: string;
    features?: string[];
    milestones?: string[];
    status?: 'completed' | 'current' | 'future';
}

interface RoadmapViewProps {
    phases: RoadmapPhase[];
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ phases: rawPhases }) => {
    if (!rawPhases || rawPhases.length === 0) return <div className="text-slate-500 italic">No roadmap data available.</div>;

    // Safe normalization
    const phases = rawPhases.map((p, idx) => ({
        ...p,
        phase: p.phase || `Phase ${idx + 1}`,
        timeline: p.timeline || '',
        goal: p.goal || p.description || '',
        features: p.features || p.milestones || [],
        status: p.status || (idx === 0 ? 'current' : 'future') as 'completed' | 'current' | 'future',
    }));

    const statusConfig = {
        completed: {
            dot: 'bg-emerald-500 ring-emerald-100',
            line: 'bg-emerald-300',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-white" />,
        },
        current: {
            dot: 'bg-indigo-600 ring-indigo-100',
            line: 'bg-indigo-200',
            badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            icon: <Clock className="w-3.5 h-3.5 text-white animate-pulse" />,
        },
        future: {
            dot: 'bg-slate-300 ring-slate-100',
            line: 'bg-slate-200',
            badge: 'bg-slate-50 text-slate-500 border-slate-200',
            icon: <Circle className="w-3.5 h-3.5 text-white" />,
        },
    };

    return (
        <div className="relative">
            {phases.map((phase, idx) => {
                const config = statusConfig[phase.status];
                const isLast = idx === phases.length - 1;

                return (
                    <div key={idx} className="relative flex gap-4">
                        {/* Left: Timeline Spine */}
                        <div className="flex flex-col items-center shrink-0 w-8">
                            {/* Dot */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ring-4 shrink-0 ${config.dot}`}>
                                {config.icon}
                            </div>
                            {/* Connecting Line */}
                            {!isLast && (
                                <div className={`w-0.5 flex-1 my-1 ${config.line}`} />
                            )}
                        </div>

                        {/* Right: Card */}
                        <div className={`flex-1 pb-5 ${isLast ? '' : 'mb-1'}`}>
                            <div className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${phase.status === 'current' ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-slate-200'
                                }`}>
                                {/* Header Row: Badge + Title */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${config.badge}`}>
                                        {phase.timeline}
                                    </span>
                                    {phase.status === 'current' && (
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded animate-pulse">
                                            ● Active
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-sm font-bold text-slate-800 mb-0.5">{phase.phase}</h3>
                                {phase.goal && (
                                    <p className="text-[12px] text-slate-500 italic mb-2 font-sans">{phase.goal}</p>
                                )}

                                {/* Features/Milestones */}
                                {phase.features.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        {phase.features.map((feature, fIdx) => (
                                            <span key={fIdx} className="flex items-center gap-1.5 text-[12px] text-slate-600 font-sans">
                                                <Flag className="w-3 h-3 text-indigo-400 shrink-0" />
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
