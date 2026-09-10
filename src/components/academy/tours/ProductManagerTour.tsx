import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import ProductManagerStage1 from '../stages/roles/ProductManagerStage1';
import ProductManagerStage2 from '../stages/roles/ProductManagerStage2';
import ProductManagerStage3 from '../stages/roles/ProductManagerStage3';
import CompletionIndicator from '../CompletionIndicator';
import { StageErrorBoundary } from '../StageErrorBoundary';

interface ProductManagerTourProps { onClose: () => void; onBack: () => void; }

const STAGES = [
    { id: 'roadmap', title: 'Product Roadmap', component: ProductManagerStage1, duration: 6 },
    { id: 'prioritization', title: 'Prioritization Matrix', component: ProductManagerStage2, duration: 7 },
    { id: 'market', title: 'Market Analysis', component: ProductManagerStage3, duration: 6 }
];

const STORAGE_KEY = 'academy_progress_product-manager';

export default function ProductManagerTour({ onClose, onBack }: ProductManagerTourProps) {
    const [currentIndex, setCurrentIndex] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).lastStage || 0 : 0;
    });
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showCompletion, setShowCompletion] = useState(false);
    const currentStage = STAGES[currentIndex];
    const StageComponent = currentStage.component;

    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastStage: currentIndex, timestamp: Date.now() })); }, [currentIndex]);

    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    if (currentIndex < STAGES.length - 1) { setCurrentIndex(currentIndex + 1); return 0; }
                    else { setIsPlaying(false); setShowCompletion(true); return 100; }
                }
                return prev + (100 / (currentStage.duration * 10));
            });
        }, 100);
        return () => clearInterval(interval);
    }, [isPlaying, currentIndex, currentStage.duration]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'Escape') onBack();
            if (e.key === ' ') { e.preventDefault(); setIsPlaying(prev => !prev); }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex]);

    const handleNext = useCallback(() => { if (currentIndex < STAGES.length - 1) { setCurrentIndex(currentIndex + 1); setProgress(0); } else { setShowCompletion(true); } }, [currentIndex]);
    const handlePrevious = useCallback(() => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setProgress(0); } }, [currentIndex]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-slate-950 to-cyan-900/10 pointer-events-none" />
            <div className="relative p-6 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg hover:bg-purple-500/20 transition-colors"><ChevronLeft size={20} /><span className="text-sm font-medium">Back</span></button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-600/20 border border-purple-500/30 flex items-center justify-center"><Lightbulb className="text-purple-400" size={24} /></div>
                        <div><div className="text-xs text-purple-400 font-bold tracking-widest uppercase">PRODUCT MANAGER</div><h2 className="text-xl font-bold text-white">Vision & Strategy</h2></div>
                    </div>
                    <button onClick={onBack} className="p-2.5 bg-slate-800/50 rounded-xl hover:bg-red-500/20 transition-colors group"><X size={24} className="text-slate-400 group-hover:text-red-400" /></button>
                </div>
            </div>
            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    <motion.div key={currentStage.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }} className="w-full h-full">
                        <StageErrorBoundary><StageComponent /></StageErrorBoundary>
                    </motion.div>
                </AnimatePresence>
                {showCompletion && <CompletionIndicator onClose={onBack} />}
            </div>
            <div className="relative p-6 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-400">Stage {currentIndex + 1} of {STAGES.length}: {currentStage.title}</span><span className="text-xs text-slate-400">{Math.round(progress)}%</span></div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-purple-500 to-cyan-600" style={{ width: `${progress}%` }} /></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <button onClick={handlePrevious} disabled={currentIndex === 0} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={20} /><span className="font-medium">Previous</span></button>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/30">{isPlaying ? <><Pause size={20} /><span className="font-bold">Pause</span></> : <><Play size={20} /><span className="font-bold">Play</span></>}</button>
                        <button onClick={handleNext} disabled={currentIndex === STAGES.length - 1 && progress < 100} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><span className="font-medium">{currentIndex === STAGES.length - 1 ? 'Finish' : 'Next'}</span><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
