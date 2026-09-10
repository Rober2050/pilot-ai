import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function StrategyAnalystStage2() {
    const swotData = {
        strengths: [
            'AI-powered analysis',
            'Comprehensive methodology',
            'Real-time insights'
        ],
        weaknesses: [
            'Requires quality input data',
            'Learning curve for new users'
        ],
        opportunities: [
            'Growing market demand',
            'Strategic partnerships',
            'Product expansion'
        ],
        threats: [
            'Competitive landscape',
            'Market saturation'
        ]
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                    <TrendingUp className="text-emerald-400" size={16} />
                    <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Stage 2: SWOT Analysis</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Matriz SWOT</h3>
                <p className="text-slate-400">Análisis estratégico de fortalezas, debilidades, oportunidades y amenazas</p>
            </motion.div>

            {/* SWOT Matrix */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Strengths */}
                <motion.div
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="bg-emerald-900/20 border-2 border-emerald-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                        <h4 className="text-lg font-bold text-emerald-400 uppercase">Strengths</h4>
                    </div>
                    <ul className="space-y-2">
                        {swotData.strengths.map((item, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.2 }}
                                className="text-sm text-slate-300 flex items-start gap-2"
                            >
                                <span className="text-emerald-400 mt-1">✓</span>
                                {item}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>

                {/* Weaknesses */}
                <motion.div
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="bg-red-900/20 border-2 border-red-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-red-400 rounded-full" />
                        <h4 className="text-lg font-bold text-red-400 uppercase">Weaknesses</h4>
                    </div>
                    <ul className="space-y-2">
                        {swotData.weaknesses.map((item, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + i * 0.2 }}
                                className="text-sm text-slate-300 flex items-start gap-2"
                            >
                                <span className="text-red-400 mt-1">⚠</span>
                                {item}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>

                {/* Opportunities */}
                <motion.div
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="bg-cyan-900/20 border-2 border-cyan-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full" />
                        <h4 className="text-lg font-bold text-cyan-400 uppercase">Opportunities</h4>
                    </div>
                    <ul className="space-y-2">
                        {swotData.opportunities.map((item, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + i * 0.2 }}
                                className="text-sm text-slate-300 flex items-start gap-2"
                            >
                                <span className="text-cyan-400 mt-1">→</span>
                                {item}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>

                {/* Threats */}
                <motion.div
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="bg-amber-900/20 border-2 border-amber-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-amber-400 rounded-full" />
                        <h4 className="text-lg font-bold text-amber-400 uppercase">Threats</h4>
                    </div>
                    <ul className="space-y-2">
                        {swotData.threats.map((item, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.1 + i * 0.2 }}
                                className="text-sm text-slate-300 flex items-start gap-2"
                            >
                                <span className="text-amber-400 mt-1">!</span>
                                {item}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
