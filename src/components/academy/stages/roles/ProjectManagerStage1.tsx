import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function ProjectManagerStage1() {
    const phases = [
        { name: 'Planning', start: 0, duration: 2, status: 'completed', color: 'emerald' },
        { name: 'Development', start: 2, duration: 8, status: 'current', color: 'cyan' },
        { name: 'Testing', start: 10, duration: 3, status: 'future', color: 'purple' },
        { name: 'Deployment', start: 13, duration: 1, status: 'future', color: 'amber' }
    ];

    const totalWeeks = 14;

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                    <Calendar className="text-cyan-400" size={16} />
                    <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Stage 1: Project Timeline</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Gantt Chart</h3>
                <p className="text-slate-400">14-week project timeline</p>
            </motion.div>

            <div className="w-full max-w-4xl space-y-4">
                {/* Timeline Header */}
                <div className="flex items-center gap-2 mb-4">
                    {Array.from({ length: totalWeeks }).map((_, i) => (
                        <div key={i} className="flex-1 text-center text-xs text-slate-500">
                            W{i + 1}
                        </div>
                    ))}
                </div>

                {/* Gantt Bars */}
                {phases.map((phase, i) => (
                    <div key={i} className="relative">
                        <div className="text-sm font-medium text-white mb-2">{phase.name}</div>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalWeeks }).map((_, weekIdx) => {
                                const isInPhase = weekIdx >= phase.start && weekIdx < phase.start + phase.duration;
                                return (
                                    <div key={weekIdx} className="flex-1 h-8">
                                        {isInPhase && (
                                            <motion.div
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{ delay: 0.3 + i * 0.2 + (weekIdx - phase.start) * 0.05, duration: 0.3 }}
                                                className={`h-full rounded ${phase.status === 'completed' ? 'bg-emerald-500' :
                                                        phase.status === 'current' ? 'bg-gradient-to-r from-cyan-500 to-purple-600' :
                                                            'bg-slate-700'
                                                    }`}
                                                style={{ transformOrigin: 'left' }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
