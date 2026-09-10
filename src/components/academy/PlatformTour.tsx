import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { ACADEMY_MODULES, getAllModulesSorted } from './AcademyData';
import TourStage, { iconMap } from './TourStage';
import CompletionIndicator from './CompletionIndicator';
import { StageErrorBoundary } from './StageErrorBoundary';

interface PlatformTourProps {
    onClose: () => void;
}

export default function PlatformTour({ onClose }: PlatformTourProps) {
    const modules = getAllModulesSorted();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showCompletion, setShowCompletion] = useState(false);

    const currentModule = modules[currentIndex];

    // Auto-advance timer
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    // Move to next module
                    if (currentIndex < modules.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                        return 0;
                    } else {
                        setIsPlaying(false);
                        setShowCompletion(true);
                        return 100;
                    }
                }
                return prev + (100 / (currentModule.duration * 10));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, currentIndex, currentModule.duration, modules.length]);

    const handleNext = () => {
        if (currentIndex < modules.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            setShowCompletion(true);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    const handleModuleClick = (index: number) => {
        setCurrentIndex(index);
        setProgress(0);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'Escape') onClose();
            if (e.key === ' ') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, modules.length]);



    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950 text-white overflow-hidden flex font-sans"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-slate-950 to-purple-900/10 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(6,182,212,0.05)_0%,_transparent_50%)] pointer-events-none" />

            {/* Left Panel - Navigation */}
            <div className="w-[420px] h-full border-r border-slate-800/50 bg-slate-900/30 backdrop-blur-xl flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-slate-800/50">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                            <Play size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">PLATFORM TOUR</h1>
                            <p className="text-sm text-slate-400">Interactive Walkthrough</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl hover:from-cyan-500 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/30"
                        >
                            {isPlaying ? (
                                <>
                                    <Pause size={20} />
                                    <span className="font-bold">Pause</span>
                                </>
                            ) : (
                                <>
                                    <Play size={20} />
                                    <span className="font-bold">Play</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-800/50 rounded-xl hover:bg-red-500/20 transition-colors group"
                        >
                            <X size={24} className="text-slate-400 group-hover:text-red-400" />
                        </button>
                    </div>
                </div>

                {/* Module List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {modules.map((module, index) => {
                        const isActive = index === currentIndex;
                        const isCompleted = index < currentIndex;
                        const Icon = iconMap[module.icon];

                        return (
                            <button
                                key={module.id}
                                onClick={() => handleModuleClick(index)}
                                className={`
                  w-full p-4 rounded-xl transition-all duration-300 text-left
                  ${isActive
                                        ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                                        : isCompleted
                                            ? 'bg-slate-800/30 border border-emerald-500/30'
                                            : 'bg-slate-800/20 border border-slate-700/30 hover:bg-slate-800/40'
                                    }
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                    ${isActive
                                            ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white'
                                            : isCompleted
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-slate-700/50 text-slate-400'
                                        }
                  `}>
                                        {Icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`
                        text-xs font-bold uppercase tracking-wider
                        ${isActive ? 'text-cyan-400' : 'text-slate-500'}
                      `}>
                                                {module.category}
                                            </span>
                                            {isCompleted && (
                                                <span className="text-xs text-emerald-400">✓</span>
                                            )}
                                        </div>
                                        <h3 className={`
                      text-base font-bold truncate
                      ${isActive ? 'text-white' : 'text-slate-300'}
                    `}>
                                            {module.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 truncate">
                                            {module.subtitle}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar for active module */}
                                {isActive && (
                                    <div className="mt-3 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.1 }}
                                        />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Navigation Buttons */}
                <div className="p-4 border-t border-slate-800/50 flex gap-3">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Previous</span>
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === modules.length - 1}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="font-medium">Next</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Right Panel - Stage Content */}
            <div className="flex-1 h-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
                {/* Stage Header */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl px-6 py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                {iconMap[currentModule.icon]}
                            </div>
                            <div>
                                <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-0.5">
                                    {currentModule.category} • STEP {currentIndex + 1}/{modules.length}
                                </div>
                                <h2 className="text-xl font-bold text-white">{currentModule.title}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stage Content - MASSIVE VIEWPORT */}
                <div className="w-full h-full flex items-center justify-center p-20">
                    <div className="w-full max-w-[1600px] h-full max-h-[800px]">
                        <AnimatePresence mode="wait">
                            <StageErrorBoundary>
                                <TourStage key={currentModule.id} module={currentModule} isActive={true} />
                            </StageErrorBoundary>
                        </AnimatePresence>
                    </div>
                </div>

                {showCompletion && <CompletionIndicator onClose={onClose} />}

                {/* Stage Footer */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-8">
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl px-8 py-4 text-center">
                        <p className="text-lg text-slate-300">
                            {currentModule.subtitle}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
