import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, DollarSign, Zap } from 'lucide-react';

export const IdeoCard = ({ show }: { show: boolean }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="w-[450px] h-auto bg-[#0a0e17] rounded-3xl p-6 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col items-center"
        >
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
                <Zap className="w-5 h-5 text-indigo-400 fill-current" />
                <h3 className="text-white font-bold text-lg tracking-wide">IDEO Validation Framework</h3>
            </div>

            {/* HD Triangle Image Asset */}
            <div className="relative w-full aspect-square flex items-center justify-center">

                {/* Visual Asset */}
                <img
                    src="/assets/ideo-triangle-hd.png"
                    alt="IDEO Triangle"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain relative z-0 opacity-90"
                />

                {/* Overlay Animations (The "Magic" the user likes) */}
                <div className="absolute inset-0 z-10 pointer-events-none">

                    {/* Pulsing Sweet Spot */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                        transition={{ delay: 1, duration: 0.8, type: 'spring' }}
                        className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm shadow-xl border border-white/10">
                                Sweet Spot
                            </span>
                        </div>
                    </motion.div>

                    {/* Node Highlight Animations */}
                    <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border border-cyan-400/30 animate-ping opacity-20"></div>
                    <div className="absolute bottom-[20%] left-[15%] w-20 h-20 rounded-full border border-rose-400/30 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute bottom-[20%] right-[15%] w-20 h-20 rounded-full border border-emerald-400/30 animate-ping opacity-20" style={{ animationDelay: '1s' }}></div>
                </div>

            </div>
        </motion.div>
    );
};
