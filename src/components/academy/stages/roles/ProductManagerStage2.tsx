import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function ProductManagerStage2() {
    const features = [
        { name: 'User Authentication', impact: 90, effort: 30, quadrant: 'quick-wins', color: 'cyan' },
        { name: 'AI Analysis Engine', impact: 95, effort: 80, quadrant: 'strategic', color: 'emerald' },
        { name: 'Export Reports', impact: 70, effort: 40, quadrant: 'quick-wins', color: 'cyan' },
        { name: 'Advanced Analytics', impact: 85, effort: 90, quadrant: 'strategic', color: 'emerald' },
        { name: 'Email Notifications', impact: 40, effort: 20, quadrant: 'fill-ins', color: 'amber' },
        { name: 'Dark Mode', impact: 35, effort: 85, quadrant: 'thankless', color: 'red' }
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                    <Zap className="text-cyan-400" size={16} />
                    <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Stage 2: Prioritization Matrix</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Impact vs Effort</h3>
                <p className="text-slate-400">Data-driven feature prioritization</p>
            </motion.div>

            <div className="relative w-full max-w-4xl h-[400px]">
                {/* Quadrant Backgrounds */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-cyan-500/10 border-2 border-cyan-500/20 rounded-lg" />
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-lg" />
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-amber-500/10 border-2 border-amber-500/20 rounded-lg" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-500/10 border-2 border-red-500/20 rounded-lg" />

                {/* Axes */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-slate-600" />
                <div className="absolute bottom-0 left-0 w-px h-full bg-slate-600" />
                <div className="absolute bottom-1/2 left-0 w-full h-px bg-slate-700/50" />
                <div className="absolute bottom-0 left-1/2 w-px h-full bg-slate-700/50" />

                {/* Labels */}
                <div className="absolute -bottom-8 right-0 text-xs text-slate-500 font-bold">High Effort →</div>
                <div className="absolute -left-20 top-0 text-xs text-slate-500 font-bold -rotate-90 origin-left">High Impact →</div>

                {/* Quadrant Labels */}
                <div className="absolute top-4 left-4 text-sm font-bold text-emerald-400">STRATEGIC</div>
                <div className="absolute top-4 right-4 text-sm font-bold text-cyan-400">QUICK WINS</div>
                <div className="absolute bottom-4 left-4 text-sm font-bold text-red-400">THANKLESS</div>
                <div className="absolute bottom-4 right-4 text-sm font-bold text-amber-400">FILL-INS</div>

                {/* Feature Dots */}
                {features.map((feature, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
                        className="absolute group cursor-pointer"
                        style={{
                            left: `${feature.effort}%`,
                            bottom: `${feature.impact}%`
                        }}
                    >
                        <div className={`w-8 h-8 rounded-full shadow-2xl flex items-center justify-center ${feature.color === 'emerald' ? 'bg-emerald-500 ring-4 ring-emerald-500/30' :
                                feature.color === 'cyan' ? 'bg-cyan-500 ring-4 ring-cyan-500/30' :
                                    feature.color === 'amber' ? 'bg-amber-500 ring-4 ring-amber-500/30' :
                                        'bg-red-500 ring-4 ring-red-500/30'
                            }`}>
                            <span className="text-white text-xs font-bold">{i + 1}</span>
                        </div>
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 whitespace-nowrap text-xs z-10 shadow-2xl">
                            <div className="font-bold text-white mb-1">{feature.name}</div>
                            <div className="flex gap-4 text-slate-400">
                                <span>Impact: <span className="text-purple-400 font-bold">{feature.impact}%</span></span>
                                <span>Effort: <span className="text-cyan-400 font-bold">{feature.effort}%</span></span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="absolute -bottom-20 left-0 right-0 flex justify-center gap-4 flex-wrap"
                >
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${feature.color === 'emerald' ? 'bg-emerald-500' :
                                    feature.color === 'cyan' ? 'bg-cyan-500' :
                                        feature.color === 'amber' ? 'bg-amber-500' :
                                            'bg-red-500'
                                }`}>
                                <span className="text-white text-[10px] font-bold">{i + 1}</span>
                            </div>
                            <span className="text-xs text-slate-400">{feature.name}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
