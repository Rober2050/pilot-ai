import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

export default function StrategyAnalystStage3() {
    const confidenceScore = 87;
    const factors = [
        { name: 'Market Size', score: 92, color: 'emerald' },
        { name: 'Competition', score: 78, color: 'amber' },
        { name: 'Technical Feasibility', score: 95, color: 'emerald' },
        { name: 'Financial Viability', score: 85, color: 'cyan' },
        { name: 'Team Capability', score: 88, color: 'cyan' }
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                    <Award className="text-purple-400" size={16} />
                    <span className="text-xs font-bold text-purple-400 tracking-widest uppercase">Stage 3: Confidence Score</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Puntaje de Confianza</h3>
                <p className="text-slate-400">Calculado en base a 15+ factores estratégicos</p>
            </motion.div>

            <div className="flex items-center gap-12">
                {/* Circular Progress */}
                <div className="relative w-64 h-64">
                    <svg className="w-full h-full transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="128"
                            cy="128"
                            r="110"
                            fill="none"
                            stroke="rgba(148, 163, 184, 0.1)"
                            strokeWidth="20"
                        />

                        {/* Progress circle */}
                        <motion.circle
                            cx="128"
                            cy="128"
                            r="110"
                            fill="none"
                            stroke="url(#gradient-confidence)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 110}
                            initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 110 * (1 - confidenceScore / 100) }}
                            transition={{ duration: 2, ease: "easeOut" }}
                        />

                        <defs>
                            <linearGradient id="gradient-confidence" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1, type: "spring", stiffness: 200 }}
                            className="text-center"
                        >
                            <div className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                                {confidenceScore}
                            </div>
                            <div className="text-sm text-slate-400 mt-2">CONFIDENCE</div>
                        </motion.div>
                    </div>
                </div>

                {/* Factors List */}
                <div className="space-y-3 flex-1 max-w-md">
                    {factors.map((factor, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.15 }}
                            className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white">{factor.name}</span>
                                <span className={`text-sm font-bold ${factor.color === 'emerald' ? 'text-emerald-400' :
                                        factor.color === 'cyan' ? 'text-cyan-400' :
                                            'text-amber-400'
                                    }`}>
                                    {factor.score}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${factor.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                            factor.color === 'cyan' ? 'bg-gradient-to-r from-cyan-500 to-cyan-400' :
                                                'bg-gradient-to-r from-amber-500 to-amber-400'
                                        }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${factor.score}%` }}
                                    transition={{ delay: 0.7 + i * 0.15, duration: 0.8 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
