import { motion } from 'framer-motion';

export default function GovernanceVisuals() {
    return (
        <div className="w-full h-full flex items-center justify-center p-8">
            <div className="w-full max-w-4xl">
                {/* IDEO Triangle */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">

                    {/* LEFT: Triangle */}
                    <div className="lg:col-span-2 flex justify-center">
                        <div className="relative w-64 h-64">
                            {/* SVG Triangle */}
                            <svg viewBox="0 0 200 200" className="w-full h-full">
                                {/* Triangle outline */}
                                <motion.path
                                    d="M 100 20 L 180 160 L 20 160 Z"
                                    fill="none"
                                    stroke="url(#gradient1)"
                                    strokeWidth="3"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                />

                                {/* Gradient definition */}
                                <defs>
                                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Labels */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8"
                            >
                                <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
                                    <span className="text-xs font-bold text-cyan-400">DESIRABILITY</span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 }}
                                className="absolute bottom-0 right-0 translate-x-4 translate-y-8"
                            >
                                <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                                    <span className="text-xs font-bold text-purple-400">VIABILITY</span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 }}
                                className="absolute bottom-0 left-0 -translate-x-4 translate-y-8"
                            >
                                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
                                    <span className="text-xs font-bold text-emerald-400">FEASIBILITY</span>
                                </div>
                            </motion.div>

                            {/* Center point */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.2, type: "spring" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full shadow-lg shadow-cyan-500/50"
                            />
                        </div>
                    </div>

                    {/* RIGHT: Decision Matrix */}
                    <div className="lg:col-span-3 grid grid-cols-2 gap-3">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                                <h4 className="text-sm font-bold text-emerald-400">HIGH IMPACT</h4>
                            </div>
                            <p className="text-xs text-slate-400">Strategic initiatives</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                                <h4 className="text-sm font-bold text-cyan-400">QUICK WINS</h4>
                            </div>
                            <p className="text-xs text-slate-400">Easy implementation</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                                <h4 className="text-sm font-bold text-amber-400">FILL-INS</h4>
                            </div>
                            <p className="text-xs text-slate-400">Low priority tasks</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-red-900/20 border border-red-500/30 rounded-xl p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-red-400 rounded-full" />
                                <h4 className="text-sm font-bold text-red-400">THANKLESS</h4>
                            </div>
                            <p className="text-xs text-slate-400">Avoid or delegate</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
