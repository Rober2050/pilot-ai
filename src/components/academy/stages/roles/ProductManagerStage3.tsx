import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function ProductManagerStage3() {
    const data = [
        { label: 'Q1 2024', value: 1.2, growth: 0, height: 30 },
        { label: 'Q2 2024', value: 1.8, growth: 50, height: 45 },
        { label: 'Q3 2024', value: 2.5, growth: 39, height: 62 },
        { label: 'Q4 2024', value: 3.2, growth: 28, height: 80 }
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                    <TrendingUp className="text-emerald-400" size={16} />
                    <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Stage 3: Market Analysis</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Market Growth Projection</h3>
                <p className="text-slate-400">Quarterly revenue forecast</p>
            </motion.div>

            <div className="w-full max-w-3xl">
                {/* Chart Container */}
                <div className="relative h-80 flex items-end justify-around gap-8 px-8">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-500 pr-4">
                        <span>$4M</span>
                        <span>$3M</span>
                        <span>$2M</span>
                        <span>$1M</span>
                        <span>$0</span>
                    </div>

                    {/* Bars */}
                    {data.map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                            {/* Growth percentage */}
                            {item.growth > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + i * 0.2 }}
                                    className="mb-2 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-bold text-emerald-400"
                                >
                                    +{item.growth}%
                                </motion.div>
                            )}

                            {/* Value label */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 + i * 0.2, type: "spring" }}
                                className="mb-2 text-lg font-bold text-white"
                            >
                                ${item.value}M
                            </motion.div>

                            {/* Bar */}
                            <div className="w-full relative" style={{ height: '240px' }}>
                                <motion.div
                                    className="absolute bottom-0 w-full rounded-t-xl bg-gradient-to-t from-purple-600 via-cyan-500 to-emerald-400 shadow-2xl"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${item.height}%` }}
                                    transition={{ delay: 0.3 + i * 0.2, duration: 0.8, ease: "easeOut" }}
                                >
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-xl" />
                                </motion.div>
                            </div>

                            {/* Quarter label */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 + i * 0.2 }}
                                className="mt-3 text-sm font-medium text-slate-400"
                            >
                                {item.label}
                            </motion.div>
                        </div>
                    ))}
                </div>

                {/* X-axis line */}
                <div className="w-full h-px bg-slate-700 mt-2 ml-12" />

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="mt-8 flex items-center justify-center gap-6"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-t from-purple-600 to-emerald-400" />
                        <span className="text-xs text-slate-400">Revenue Growth</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-400" />
                        <span className="text-xs text-slate-400">Quarterly Increase</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
