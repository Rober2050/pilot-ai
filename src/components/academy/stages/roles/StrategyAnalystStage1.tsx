import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export default function StrategyAnalystStage1() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                    <Target className="text-cyan-400" size={16} />
                    <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Stage 1: IDEO Framework</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Triángulo de IDEO</h3>
                <p className="text-slate-400">Análisis de viabilidad desde 3 perspectivas críticas</p>
            </motion.div>

            {/* IDEO Triangle */}
            <div className="relative w-96 h-96">
                {/* SVG Triangle */}
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Triangle outline */}
                    <motion.path
                        d="M 100 20 L 180 160 L 20 160 Z"
                        fill="none"
                        stroke="url(#gradient-ideo)"
                        strokeWidth="4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    {/* Inner glow */}
                    <motion.path
                        d="M 100 20 L 180 160 L 20 160 Z"
                        fill="url(#glow-ideo)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        transition={{ delay: 2, duration: 1 }}
                    />

                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="gradient-ideo" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <radialGradient id="glow-ideo">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                </svg>

                {/* Labels */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12"
                >
                    <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-xl backdrop-blur-xl">
                        <div className="text-xs font-bold text-cyan-400 uppercase mb-1">Desirability</div>
                        <div className="text-xs text-slate-400">¿Lo quieren los usuarios?</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-0 right-0 translate-x-8 translate-y-12"
                >
                    <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-xl backdrop-blur-xl">
                        <div className="text-xs font-bold text-purple-400 uppercase mb-1">Viability</div>
                        <div className="text-xs text-slate-400">¿Es rentable?</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6 }}
                    className="absolute bottom-0 left-0 -translate-x-8 translate-y-12"
                >
                    <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-xl backdrop-blur-xl">
                        <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Feasibility</div>
                        <div className="text-xs text-slate-400">¿Es técnicamente posible?</div>
                    </div>
                </motion.div>

                {/* Center point - Sweet Spot */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 2.2, type: "spring", stiffness: 200 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                    <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-purple-600 to-emerald-500 rounded-full shadow-2xl shadow-cyan-500/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">SWEET<br />SPOT</span>
                        </div>
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
