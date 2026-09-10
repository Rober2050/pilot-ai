import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ProjectManagerStage3() {
    const risks = [
        { name: 'API Integration Delays', probability: 70, impact: 85, severity: 'high' },
        { name: 'Resource Availability', probability: 50, impact: 60, severity: 'medium' },
        { name: 'Scope Creep', probability: 80, impact: 70, severity: 'high' },
        { name: 'Third-party Dependencies', probability: 40, impact: 50, severity: 'low' },
        { name: 'Budget Overrun', probability: 60, impact: 75, severity: 'high' },
        { name: 'Technical Debt', probability: 55, impact: 45, severity: 'medium' }
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
                    <AlertTriangle className="text-red-400" size={16} />
                    <span className="text-xs font-bold text-red-400 tracking-widest uppercase">Stage 3: Risk Management</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Risk Matrix</h3>
                <p className="text-slate-400">Probability vs Impact assessment</p>
            </motion.div>

            <div className="relative w-full max-w-4xl h-[400px]">
                {/* Quadrant Backgrounds */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500/10 border-2 border-red-500/20 rounded-lg" />
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-amber-500/10 border-2 border-amber-500/20 rounded-lg" />
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-lg" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-slate-700/10 border-2 border-slate-700/20 rounded-lg" />

                {/* Axes */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-slate-600" />
                <div className="absolute bottom-0 left-0 w-px h-full bg-slate-600" />
                <div className="absolute bottom-1/2 left-0 w-full h-px bg-slate-700/50" />
                <div className="absolute bottom-0 left-1/2 w-px h-full bg-slate-700/50" />

                {/* Labels */}
                <div className="absolute -bottom-8 right-0 text-xs text-slate-500 font-bold">High Probability →</div>
                <div className="absolute -left-20 top-0 text-xs text-slate-500 font-bold -rotate-90 origin-left">High Impact →</div>

                {/* Quadrant Labels */}
                <div className="absolute top-4 left-4 text-sm font-bold text-amber-400">MEDIUM RISK</div>
                <div className="absolute top-4 right-4 text-sm font-bold text-red-400">CRITICAL RISK</div>
                <div className="absolute bottom-4 left-4 text-sm font-bold text-slate-500">LOW RISK</div>
                <div className="absolute bottom-4 right-4 text-sm font-bold text-emerald-400">MONITOR</div>

                {/* Risk Dots */}
                {risks.map((risk, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
                        className="absolute group cursor-pointer"
                        style={{
                            left: `${risk.probability}%`,
                            bottom: `${risk.impact}%`
                        }}
                    >
                        <div className={`w-8 h-8 rounded-full shadow-2xl flex items-center justify-center ${risk.severity === 'high' ? 'bg-red-500 ring-4 ring-red-500/30' :
                                risk.severity === 'medium' ? 'bg-amber-500 ring-4 ring-amber-500/30' :
                                    'bg-emerald-500 ring-4 ring-emerald-500/30'
                            }`}>
                            <span className="text-white text-xs font-bold">{i + 1}</span>
                        </div>
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 whitespace-nowrap text-xs z-10 shadow-2xl">
                            <div className="font-bold text-white mb-1">{risk.name}</div>
                            <div className="flex gap-4 text-slate-400">
                                <span>Probability: <span className="text-cyan-400 font-bold">{risk.probability}%</span></span>
                                <span>Impact: <span className="text-purple-400 font-bold">{risk.impact}%</span></span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="absolute -bottom-20 left-0 right-0 flex justify-center gap-6"
                >
                    {risks.map((risk, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${risk.severity === 'high' ? 'bg-red-500' :
                                    risk.severity === 'medium' ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                }`}>
                                <span className="text-white text-[10px] font-bold">{i + 1}</span>
                            </div>
                            <span className="text-xs text-slate-400">{risk.name}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
