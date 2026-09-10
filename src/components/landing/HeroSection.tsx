import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlatformTour } from './PlatformTour';
import { DemoModal } from './DemoModal';

export const HeroSection = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('translation');
    const [showDemo, setShowDemo] = useState(false);

    return (
        <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />

            {/* Background Effects (Deep Space) */}
            <div className="absolute inset-0 bg-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent_70%)]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                {/* Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700/50 backdrop-blur-md text-cyan-400 text-xs font-bold uppercase tracking-wider mb-8 hover:border-cyan-500/50 transition-colors cursor-default"
                >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    {t('landing.hero.badge')}
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight"
                >
                    {t('landing.hero.titleStart')} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 animate-gradient-x">
                        {t('landing.hero.titleEnd')}
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-400 max-w-3xl mb-10 leading-relaxed font-light"
                >
                    {t('landing.hero.subtitle')}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20"
                >
                    <button
                        onClick={() => navigate('/login')}
                        className="group relative px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <span className="relative flex items-center justify-center gap-2">
                            {t('landing.hero.ctaPrimary')}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <button
                        onClick={() => setShowDemo(true)}
                        className="px-8 py-4 bg-slate-900/50 text-white border border-slate-700 hover:border-slate-500 rounded-xl font-bold text-lg backdrop-blur-sm transition-all hover:bg-slate-800/50 flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        {t('landing.hero.ctaSecondary')}
                    </button>
                </motion.div>

                {/* VISUAL MONITOR (Platform Tour) */}
                <motion.div
                    initial={{ opacity: 0, y: 50, rotateX: 10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="relative w-full max-w-6xl mx-auto perspective-1000 group"
                >
                    {/* Glow behind monitor */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-[2rem] opacity-20 blur-3xl group-hover:opacity-30 transition-opacity"></div>

                    {/* The Platform Tour Component */}
                    <PlatformTour />

                </motion.div>

            </div>
        </div>
    );
};
