import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, ChevronLeft, ChevronRight, Info,
    Zap, Cpu, BrainCircuit, BookOpen, Lightbulb, Rocket, Star,
    Target, Trophy, BarChart, Network, Globe, Database, Shield
} from 'lucide-react';

// Small registry for dynamic role icons (config.icon field).
// Add new role icons here instead of using `import * as LucideIcons`.
const ROLE_ICON_MAP: Record<string, React.ComponentType<any>> = {
    Zap, Cpu, BrainCircuit, BookOpen, Lightbulb, Rocket, Star,
    Target, Trophy, BarChart, Network, Globe, Database, Shield
};
import CompletionIndicator from '../CompletionIndicator';
import { StageErrorBoundary } from '../StageErrorBoundary';
import DynamicStage from './DynamicStage';
import { TourConfig } from '../../../types/academy-schema';
import { getLocalizedString } from '../../../utils/tourExport';
import { useTranslation } from 'react-i18next';

interface DynamicTourProps {
    config: TourConfig;
    onClose: () => void;
    onBack: () => void;
    isPreview?: boolean;
}

export default function DynamicTour({ config, onClose, onBack, isPreview = false }: DynamicTourProps) {
    const STORAGE_KEY = `academy_progress_${config.id}`;
    const { i18n } = useTranslation('translation');
    const currentLanguage = (i18n.language || 'en').startsWith('es') ? 'es' : 'en';

    const [currentIndex, setCurrentIndex] = useState(() => {
        if (isPreview) return 0;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const { lastStage } = JSON.parse(saved);
            // If the user finished (reached the last stage or further), reset to 0
            if (config.stages && lastStage >= config.stages.length - 1) {
                return 0;
            }
            return (config.stages && lastStage < config.stages.length) ? lastStage : 0;
        }
        return 0;
    });
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showCompletion, setShowCompletion] = useState(false);

    const currentStage = config.stages[currentIndex];
    // Dynamic Role Icon
    const RoleIcon = ROLE_ICON_MAP[config.icon] || Zap;

    // Get localized title
    const displayTitle = getLocalizedString(config.title, currentLanguage, config.role);

    // Persist Progress (Only if not in preview)
    useEffect(() => {
        if (config.stages.length > 0 && !isPreview) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastStage: currentIndex, timestamp: Date.now() }));
        }
    }, [currentIndex, STORAGE_KEY, config.stages.length, isPreview]);

    // Timer Logic
    useEffect(() => {
        if (!isPlaying || !currentStage) return;
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    if (currentIndex < config.stages.length - 1) {
                        setCurrentIndex((c: number) => c + 1);
                        return 0;
                    } else {
                        // Tour completed - reset progress for next time
                        if (!isPreview) {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastStage: 0, timestamp: Date.now() }));
                        }
                        setIsPlaying(false);
                        setShowCompletion(true);
                        return 100;
                    }
                }
                return prev + (100 / (currentStage.duration * 10));
            });
        }, 100);
        return () => clearInterval(interval);
    }, [isPlaying, currentIndex, currentStage, config.stages.length, STORAGE_KEY, isPreview]);

    const handlePlayPause = useCallback(() => {
        if (showCompletion) {
            setShowCompletion(false);
            setCurrentIndex(0);
            setProgress(0);
            setIsPlaying(true);
        } else {
            setIsPlaying(p => !p);
        }
    }, [showCompletion]);

    // Keyboard Nav
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'Escape') onClose(); // Changed to onClose for Escape to ensure exit
            if (e.key === ' ') { e.preventDefault(); handlePlayPause(); }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, onClose]);

    const handleNext = useCallback(() => {
        if (currentIndex < config.stages.length - 1) {
            setCurrentIndex((c: number) => c + 1);
            setProgress(0);
        } else {
            // Tour completed - reset progress for next time
            if (!isPreview) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastStage: 0, timestamp: Date.now() }));
            }
            setShowCompletion(true);
        }
    }, [currentIndex, config.stages.length, STORAGE_KEY, isPreview]);

    const handlePrevious = useCallback(() => {
        if (currentIndex > 0) { setCurrentIndex((c: number) => c - 1); setProgress(0); }
    }, [currentIndex]);

    if (!currentStage) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col items-center justify-center font-sans">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <RoleIcon size={32} className="text-slate-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Tour Configuration Empty</h2>
                    <p className="text-slate-400 mb-6">This tour has no stages defined yet.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
                        Close Tour
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
            {config.layout === 'sidebar' ? (
                // SIDEBAR LAYOUT (Story Telling Mode)
                <div className="flex h-full relative">
                    {/* Left Sidebar */}
                    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col z-[100] shadow-2xl relative">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: config.theme.primary + '20' }}>
                                    <RoleIcon size={20} style={{ color: config.theme.primary }} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{config.role}</div>
                                    <h2 className="font-bold text-white leading-tight">{displayTitle}</h2>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onBack();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm text-slate-300 cursor-pointer z-50 hover:text-white border border-transparent hover:border-slate-600 shadow-lg"
                            >
                                <ChevronLeft size={16} /> Back to Academy
                            </button>
                        </div>

                        {/* Stages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {config.stages.map((stage, idx) => {
                                const isActive = idx === currentIndex;
                                const isCompleted = idx < currentIndex || (showCompletion && idx === currentIndex);
                                return (
                                    <button
                                        key={stage.id}
                                        onClick={() => { setCurrentIndex(idx); setProgress(0); }}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${isActive ? 'bg-slate-800 border-slate-700' : 'border-transparent hover:bg-slate-800/50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-white text-slate-900' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                {isCompleted ? '✓' : idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{getLocalizedString(stage.title as any, currentLanguage, '')}</div>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div className="h-full" style={{ width: `${progress}%`, backgroundColor: config.theme.primary }} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer Controls */}
                        <div className="p-4 border-t border-slate-800 flex gap-2">
                            <button onClick={handlePlayPause} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                <span className="text-sm font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-10 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${config.theme.gradient} opacity-10 pointer-events-none`} />
                        <div className="relative w-full max-w-6xl h-full flex flex-col">
                            <AnimatePresence mode="wait">
                                <motion.div key={currentStage.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="w-full h-full flex flex-col">
                                    <div className="flex-1">
                                        <StageErrorBoundary>
                                            <DynamicStage config={currentStage} isActive={true} />
                                        </StageErrorBoundary>
                                    </div>
                                    
                                    {/* Description Panel at Bottom */}
                                    {currentStage.description && (
                                        <div className="mt-8 p-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl flex items-start gap-4 mx-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                                                <Info className="text-cyan-400" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-2">{getLocalizedString(currentStage.title as any, currentLanguage, '')}</h3>
                                                <p className="text-slate-300 text-[15px] leading-relaxed">{getLocalizedString(currentStage.description as any, currentLanguage, '')}</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        {showCompletion && <CompletionIndicator onClose={onBack} />}
                    </div>
                </div>
            ) : (
                // DEFAULT IMMERSIVE LAYOUT
                <>
                    {/* Background with Theme Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.theme.gradient} pointer-events-none opacity-20`} />

                    {/* Header */}
                    <div className="relative p-6 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
                        <div className="flex items-center justify-between max-w-7xl mx-auto">
                            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                                <ChevronLeft size={20} />
                                <span className="text-sm font-medium">Back</span>
                            </button>

                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl border border-slate-500/30 flex items-center justify-center`} style={{ backgroundColor: config.theme.primary + '20', borderColor: config.theme.primary + '40' }}>
                                    <RoleIcon size={24} style={{ color: config.theme.primary }} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold tracking-widest uppercase" style={{ color: config.theme.primary }}>{config.role}</div>
                                    <h2 className="text-xl font-bold text-white">{displayTitle}</h2>
                                </div>
                            </div>

                            <button onClick={onClose} className="p-2.5 bg-slate-800/50 rounded-xl hover:bg-red-500/20 transition-colors group">
                                <X size={24} className="text-slate-400 group-hover:text-red-400" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 relative">
                        <AnimatePresence mode="wait">
                            <motion.div key={currentStage.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }} className="w-full h-full">
                                <StageErrorBoundary>
                                    <DynamicStage config={currentStage} isActive={true} />
                                </StageErrorBoundary>
                            </motion.div>
                        </AnimatePresence>
                        {showCompletion && <CompletionIndicator onClose={onBack} />}
                    </div>

                    {/* Footer Controls */}
                    <div className="relative p-6 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-400">Stage {currentIndex + 1} of {config.stages.length}: {getLocalizedString(currentStage.title as any, currentLanguage, '')}</span>
                                    <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                    <motion.div className="h-full" style={{ width: `${progress}%`, backgroundColor: config.theme.primary }} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <button onClick={handlePrevious} disabled={currentIndex === 0} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                    <ChevronLeft size={20} /><span className="font-medium">Previous</span>
                                </button>

                                <button onClick={handlePlayPause} className="flex items-center gap-2 px-6 py-2 rounded-xl hover:opacity-90 transition-all shadow-lg" style={{ background: `linear-gradient(to right, ${config.theme.primary}, ${config.theme.secondary})` }}>
                                    {isPlaying ? <><Pause size={20} /><span className="font-bold">Pause</span></> : <><Play size={20} /><span className="font-bold">Play</span></>}
                                </button>

                                <button onClick={handleNext} disabled={currentIndex === config.stages.length - 1 && progress < 100} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                    <span className="font-medium">{currentIndex === config.stages.length - 1 ? 'Finish' : 'Next'}</span><ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
