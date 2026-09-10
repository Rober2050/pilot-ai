import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Cpu, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DynamicTour from '../academy/engine/DynamicTour';
import PlatformTour from './PlatformTour.tsx';
import * as TourData from '../../data/tours/index';
import { TourConfig } from '../../types/academy-schema';
import type { LucideIcon } from 'lucide-react';

const TOUR_ICONS: Record<string, LucideIcon> = { Cpu, Target };

interface AcademySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Dynamically load all valid tours from the index file
const getAllTours = (): TourConfig[] => {
    return Object.values(TourData).filter((item): item is TourConfig => {
        return (
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            'title' in item &&
            'stages' in item
        );
    });
};

const AVAILABLE_TOURS = getAllTours();

export default function AcademySelectionModal({ isOpen, onClose }: AcademySelectionModalProps) {
    const { i18n } = useTranslation('translation');
    const [selectedTour, setSelectedTour] = useState<TourConfig | null>(null);
    const [showTour, setShowTour] = useState(false);

    const handleTourClick = (tour: TourConfig) => {
        setSelectedTour(tour);
    };

    const handleBack = () => {
        setSelectedTour(null);
        setShowTour(false);
    };

    const currentLang = i18n.language as 'en' | 'es';

    // Show platform tour
    if (showTour) {
        return <PlatformTour onClose={handleBack} />;
    }

    // Show hardcoded tour
    if (selectedTour) {
        return <DynamicTour config={selectedTour} onClose={onClose} onBack={handleBack} />;
    }

    // Show selection grid
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="relative w-full max-w-6xl bg-slate-900/50 backdrop-blur-2xl border border-slate-800/50 rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative p-8 border-b border-slate-800/50 bg-gradient-to-r from-cyan-900/10 to-purple-900/10">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                                    <Play size={32} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white">PILOT ACADEMY</h1>
                                    <p className="text-slate-400 mt-1">
                                        {currentLang === 'en'
                                            ? 'Discover how our AI-powered roles work'
                                            : 'Descubre cómo funcionan nuestros roles potenciados por IA'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Platform Tour Card (Always first) */}
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0 }}
                                    onClick={() => setShowTour(true)}
                                    className="group relative bg-gradient-to-br from-cyan-900/20 to-purple-900/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 text-left hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-300" />

                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50">
                                            <Play size={28} className="text-white" />
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {currentLang === 'en' ? 'Platform Tour' : 'Tour de la Plataforma'}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {currentLang === 'en'
                                                ? 'Complete walkthrough of PILOTAI workflow'
                                                : 'Recorrido completo del flujo de trabajo de PILOTAI'}
                                        </p>
                                    </div>
                                </motion.button>

                                {/* Hardcoded Tours from TypeScript files */}
                                {AVAILABLE_TOURS.map((tour, index) => {
                                    const Icon = TOUR_ICONS[tour.icon] || Target;
                                    const title = typeof tour.title === 'string' ? tour.title : (tour.title[currentLang] || tour.title.en);
                                    const description = typeof tour.description === 'string' ? tour.description : (tour.description?.[currentLang] || tour.description?.en || 'Description of the tour...');

                                    return (
                                        <motion.button
                                            key={tour.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: (index + 1) * 0.1 }}
                                            onClick={() => handleTourClick(tour)}
                                            className="group relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-left hover:scale-105 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/30"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300" />

                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-xl bg-slate-700/50 group-hover:bg-cyan-500/20 flex items-center justify-center mb-4 transition-colors border border-slate-600/50 group-hover:border-cyan-500/50">
                                                    <Icon size={24} className="text-cyan-400" />
                                                </div>

                                                <h3 className="text-xl font-bold text-white mb-2">
                                                    {title}
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    {description}
                                                </p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-800/50 bg-slate-900/30">
                            <p className="text-center text-sm text-slate-500">
                                {currentLang === 'en'
                                    ? 'Click on any card to learn how each AI role analyzes and generates insights'
                                    : 'Haz clic en cualquier tarjeta para aprender cómo cada rol de IA analiza y genera insights'}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
