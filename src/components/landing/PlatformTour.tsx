import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Sparkles, Target, Users, MessageSquare, Monitor, CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IdeoCard } from './IdeoCard';

const TOUR_STEPS = [
    { id: 'inception', icon: Sparkles, duration: 6000 },
    { id: 'strategy', icon: Target, duration: 8000 },
    { id: 'roles', icon: Users, duration: 8000 },
    { id: 'consult', icon: MessageSquare, duration: 6000 },
    { id: 'prototype', icon: Monitor, duration: 6000 }
];

export const PlatformTour = () => {
    const { t } = useTranslation('translation');
    const [activeStep, setActiveStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);

    // Auto-advance logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            const stepDuration = TOUR_STEPS[activeStep].duration;
            const tickRate = 50; // Update every 50ms

            interval = setInterval(() => {
                setProgress(prev => {
                    const newProgress = prev + (tickRate / stepDuration) * 100;
                    if (newProgress >= 100) {
                        setActiveStep(current => (current + 1) % TOUR_STEPS.length);
                        return 0;
                    }
                    return newProgress;
                });
            }, tickRate);
        }
        return () => clearInterval(interval);
    }, [isPlaying, activeStep]);

    const handleStepClick = (index: number) => {
        setActiveStep(index);
        setProgress(0);
        setIsPlaying(false);
    };

    return (
        <div className="flex h-[600px] w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">

            {/* LEFT SIDEBAR */}
            <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col p-6 z-20">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold tracking-wide uppercase text-sm">{t('landing.tour.title')}</h3>
                        <p className="text-slate-500 text-xs">{t('landing.tour.subtitle')}</p>
                    </div>
                </div>

                {/* Main Control */}
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-full py-3 mb-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    {isPlaying ? t('landing.tour.pause') : t('landing.tour.resume')}
                </button>

                {/* Steps List */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    {TOUR_STEPS.map((step, index) => {
                        const isActive = index === activeStep;
                        return (
                            <button
                                key={step.id}
                                onClick={() => handleStepClick(index)}
                                className={`w-full p-3 rounded-lg flex items-start gap-3 transition-all text-left relative overflow-hidden group ${isActive ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-800/50 border border-transparent'}`}
                            >
                                {/* Progress Bar Background for Active */}
                                {isActive && (
                                    <div
                                        className="absolute bottom-0 left-0 h-0.5 bg-cyan-500 transition-all duration-75"
                                        style={{ width: `${progress}%` }}
                                    />
                                )}

                                <div className={`mt-0.5 p-1.5 rounded-md ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'}`}>
                                    <step.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                        {t(`landing.tour.steps.${step.id}.label`)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 line-clamp-1">
                                        {t(`landing.tour.steps.${step.id}.desc`)}
                                    </div>
                                </div>
                                {isActive && <CheckCircle className="absolute top-3 right-3 w-3 h-3 text-cyan-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 relative bg-slate-950 flex flex-col">

                {/* Top Bar */}
                <div className="absolute top-0 w-full h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-900/20 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            STEP {activeStep + 1}/{TOUR_STEPS.length}
                        </span>
                        <div className="w-px h-4 bg-slate-700 mx-2"></div>
                        <span className="text-sm font-bold text-white">
                            {t(`landing.tour.steps.${TOUR_STEPS[activeStep].id}.label`)}
                        </span>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                    {/* Background Grids */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                    {/* Content Switcher */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            {renderStepContent(TOUR_STEPS[activeStep].id, t)}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const renderStepContent = (stepId: string, t: any) => {
    switch (stepId) {
        case 'inception':
            return <InceptionView t={t} />;
        case 'strategy':
            return <div className="scale-110"><IdeoCard show={true} /></div>;
        case 'roles':
            return <RolesView t={t} />;
        case 'consult':
            return <ConsultView t={t} />;
        case 'prototype':
            return <PrototypeView t={t} />;
        default:
            return null;
    }
};

/* --- SUB-COMPONENTS --- */

const InceptionView = ({ t }: any) => {
    return (
        <div className="w-full max-w-2xl text-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
            >
                <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{t('landing.tour.steps.inception.label')}</h2>
                <p className="text-slate-400">{t('landing.tour.steps.inception.desc')}</p>
            </motion.div>

            <div className="relative mx-auto bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-xl text-left max-w-lg">
                <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-bold">Input</div>
                <div className="text-xl text-emerald-400 font-mono typing-cursor">
                    {t('landing.tour.steps.inception.exampleIdea')}
                </div>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, delay: 0.5 }}
                    className="h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 mt-4 rounded-full"
                />
            </div>
        </div>
    );
};

const RolesView = ({ t }: any) => {
    const roles = [
        { name: 'Product Manager', color: 'bg-rose-500', delay: 0 },
        { name: 'Business Analyst', color: 'bg-amber-500', delay: 0.2 },
        { name: 'UX Designer', color: 'bg-purple-500', delay: 0.4 },
        { name: 'Software Architect', color: 'bg-cyan-500', delay: 0.6 },
        { name: 'QA Engineer', color: 'bg-emerald-500', delay: 0.8 },
    ];

    return (
        <div className="text-center w-full">
            <h2 className="text-2xl font-bold text-white mb-2">{t('landing.tour.steps.roles.title')}</h2>
            <p className="text-slate-400 mb-12">{t('landing.tour.steps.roles.subtitle')}</p>

            <div className="flex flex-wrap justify-center gap-6 mb-12">
                {roles.map((role) => (
                    <motion.div
                        key={role.name}
                        initial={{ opacity: 0, scale: 0, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: role.delay, type: 'spring' }}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className={`w-16 h-16 rounded-full ${role.color} shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center border-4 border-slate-950 relative z-10 group-hover:scale-110 transition-transform`}>
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div className={`text-[10px] font-bold text-white uppercase tracking-wider px-2 py-1 rounded bg-slate-800 ${role.color.replace('bg-', 'text-')}`}>
                            {role.name}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-center gap-4">
                {['prd', 'flow', 'cases'].map((card, i) => (
                    <motion.div
                        key={card}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + (i * 0.2) }}
                        className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded flex items-center gap-2 text-xs text-slate-300"
                    >
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        {t(`landing.tour.steps.roles.cards.${card}`)}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const ConsultView = ({ t }: any) => {
    return (
        <div className="w-full max-w-xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
            >
                {/* User Message */}
                <div className="flex gap-4 items-start mb-6 justify-end">
                    <div className="bg-indigo-600 px-4 py-3 rounded-2xl rounded-tr-sm text-white text-sm max-w-xs shadow-lg">
                        {t('landing.tour.steps.consult.message')}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0"></div>
                </div>

                {/* AI Response (Typing) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex gap-4 items-start"
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm text-slate-300 text-sm w-full shadow-lg">
                        <div className="flex gap-1 mb-2">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                        <div className="h-2 w-3/4 bg-slate-700 rounded mb-2"></div>
                        <div className="h-2 w-1/2 bg-slate-700 rounded"></div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

const PrototypeView = ({ t }: any) => {
    return (
        <div className="relative w-full max-w-2xl h-64 bg-slate-900 border border-slate-700 rounded-t-xl overflow-hidden shadow-2xl">
            <div className="h-8 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>

            <div className="p-6 grid grid-cols-3 gap-4">
                {/* Wireframe Elements */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-3 h-32 bg-slate-800 rounded-lg animate-pulse"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="col-span-1 h-20 bg-slate-800 rounded-lg animate-pulse"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="col-span-1 h-20 bg-slate-800 rounded-lg animate-pulse"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="col-span-1 h-20 bg-slate-800 rounded-lg animate-pulse"
                />
            </div>

            {/* Success Badge */}
            <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1.5, type: 'spring' }}
                className="absolute bottom-4 right-4 px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2"
            >
                <CheckCircle className="w-5 h-5" />
                UI Generated
            </motion.div>
        </div>
    );
};
