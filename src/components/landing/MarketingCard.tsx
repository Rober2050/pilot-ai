import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Globe } from 'lucide-react';

export const MarketingCard = ({ show }: { show: boolean }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="w-96 h-auto bg-[#0a0e17] rounded-3xl p-6 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-purple-400 fill-current" />
                <h3 className="text-white font-bold text-lg tracking-wide">Growth Engine AI</h3>
            </div>

            {/* Content Visual */}
            <div className="relative w-full aspect-square flex flex-col items-center justify-center">

                {/* Background Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

                {/* Central Persona */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] mb-8">
                    <Users className="w-10 h-10 text-purple-400" />
                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">New</div>
                </div>

                {/* Orbiting Channels */}
                <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center -rotate-[0deg]">
                        <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                </div>
                <div className="absolute inset-0 animate-[spin_15s_linear_infinite_reverse]">
                    <div className="absolute bottom-10 left-10 w-10 h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center">
                        <Target className="w-4 h-4 text-rose-400" />
                    </div>
                </div>

                {/* Metrics */}
                <div className="w-full space-y-3 relative z-10">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Target Audience Reach</span>
                        <span className="text-purple-400 font-bold">2.4M</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={show ? { width: '85%' } : { width: 0 }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Predicted Conversion</span>
                        <span className="text-pink-400 font-bold">4.8%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={show ? { width: '60%' } : { width: 0 }}
                            transition={{ duration: 1.5, delay: 0.7 }}
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
