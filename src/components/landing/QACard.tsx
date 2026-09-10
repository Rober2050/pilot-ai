import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Bug, CheckCircle, Lock } from 'lucide-react';

export const QACard = ({ show }: { show: boolean }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="w-96 h-auto bg-[#0a0e17] rounded-3xl p-6 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-amber-400 fill-current" />
                <h3 className="text-white font-bold text-lg tracking-wide">Automated QA Shield</h3>
            </div>

            {/* Content Visual */}
            <div className="relative w-full aspect-square flex flex-col items-center justify-center">

                {/* Radar Scan Effect */}
                <div className="absolute inset-0 rounded-full border border-amber-500/10 overflow-hidden">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(245,158,11,0.2)_360deg)] opacity-50"
                    />
                </div>

                {/* Central Shield */}
                <div className="relative z-10 mb-8">
                    <Shield className="w-20 h-20 text-amber-500/80" />
                    <CheckCircle className="absolute -bottom-2 -right-2 w-8 h-8 text-emerald-400 bg-slate-900 rounded-full" />
                </div>

                {/* Detected Bugs (Popping up) */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={show ? { scale: 1, x: -60, y: -40 } : { scale: 0 }}
                    transition={{ delay: 1 }}
                    className="absolute z-20 px-2 py-1 bg-rose-500/20 border border-rose-500/50 rounded flex items-center gap-1"
                >
                    <Bug className="w-3 h-3 text-rose-400" />
                    <span className="text-[10px] text-rose-300">Null Pointer</span>
                </motion.div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={show ? { scale: 1, x: 60, y: 20 } : { scale: 0 }}
                    transition={{ delay: 1.5 }}
                    className="absolute z-20 px-2 py-1 bg-rose-500/20 border border-rose-500/50 rounded flex items-center gap-1"
                >
                    <Lock className="w-3 h-3 text-rose-400" />
                    <span className="text-[10px] text-rose-300">Auth Bypass</span>
                </motion.div>

                {/* Status Bar */}
                <div className="w-full bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">Test Coverage</span>
                        <span className="text-xs font-bold text-emerald-400">98.5%</span>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0.2 }}
                                animate={show ? { opacity: 1 } : { opacity: 0.2 }}
                                transition={{ delay: i * 0.1 }}
                                className="h-1.5 flex-1 rounded-full bg-emerald-500"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
