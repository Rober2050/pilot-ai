import React, { useEffect, useState } from 'react';
import { X, Play, Zap, Shield, BarChart3, TrendingUp, Cpu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DemoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [step, setStep] = useState(0);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Start simulation sequence
            const interval = setInterval(() => {
                setStep(s => (s + 1) % 4);
            }, 3000);
            return () => clearInterval(interval);
        } else {
            document.body.style.overflow = 'unset';
            setStep(0);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const demoSteps = [
        {
            title: "Analyzing Strategy",
            icon: Shield,
            color: "text-indigo-400",
            glow: "bg-indigo-500/20",
            stat: "IDEO Score: 92% Viability",
            msg: "Scanning market trends & competitor landscape..."
        },
        {
            title: "Information Architecture",
            icon: Zap,
            color: "text-cyan-400",
            glow: "bg-cyan-500/20",
            stat: "34 Site Components Mapped",
            msg: "Structuring user flows & navigation hierarchy..."
        },
        {
            title: "Performance Monitoring",
            icon: BarChart3,
            color: "text-emerald-400",
            glow: "bg-emerald-500/20",
            stat: "Revenue Forecast: +240%",
            msg: "Calculating LTV/CAC ratios & growth engines..."
        },
        {
            title: "AI Engine Processing",
            icon: Cpu,
            color: "text-purple-400",
            glow: "bg-purple-500/20",
            stat: "11 Agents Synchronized",
            msg: "Finalizing documentation & prototype code..."
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotateX: -20 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                        className="relative w-full max-w-5xl bg-slate-950 rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Header Decoration */}
                        <div className="absolute top-0 left-0 right-0 h-1 hidden sm:flex">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-purple-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            />
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 hover:border-white/20 active:scale-95 group"
                        >
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-2">

                            {/* Visual Side (Simulated Dashboard) */}
                            <div className="p-10 bg-slate-900/50 flex flex-col justify-center min-h-[400px] relative overflow-hidden">

                                {/* Background grid/noise */}
                                <div className="absolute inset-0 bg-slate-950/20"></div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="relative z-10"
                                    >
                                        <div className={`w-20 h-20 rounded-2xl ${demoSteps[step].glow} flex items-center justify-center mb-8 border border-white/5`}>
                                            {React.createElement(demoSteps[step].icon, { className: `w-10 h-10 ${demoSteps[step].color}` })}
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-3xl font-black text-white tracking-tight">{demoSteps[step].title}</h4>
                                            <p className="text-slate-400 text-lg font-medium">{demoSteps[step].msg}</p>

                                            <div className="pt-8 flex items-center gap-4">
                                                <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                                                    <span className={`text-sm font-bold tracking-widest uppercase ${demoSteps[step].color}`}>
                                                        {demoSteps[step].stat}
                                                    </span>
                                                </div>
                                                <div className="flex -space-x-3">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center">
                                                            <Sparkles className="w-3 h-3 text-cyan-500" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Progress Dots */}
                                <div className="absolute bottom-10 left-10 flex gap-2">
                                    {demoSteps.map((_, i) => (
                                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`}></div>
                                    ))}
                                </div>
                            </div>

                            {/* Content Side (The Cinematic Pitch) */}
                            <div className="p-10 flex flex-col justify-center text-left border-t lg:border-t-0 lg:border-l border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Live Simulation</span>
                                </div>

                                <h3 className="text-4xl font-black text-white mb-6 leading-tight">
                                    Ochestrate Your <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Future Empire</span>
                                </h3>

                                <div className="space-y-6 text-slate-400 font-medium text-sm leading-relaxed mb-10">
                                    <p>PILOTAI isn't just a tool; it's an autonomous executive board. While you sleep, 11 specialized AI Agents validate your pitch, build your architecture, and scan for market vulnerabilities.</p>
                                    <p>Experience zero-latency alignment between strategy, design, and code.</p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-indigo-500/10"
                                >
                                    Start Building Now
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const ArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);
