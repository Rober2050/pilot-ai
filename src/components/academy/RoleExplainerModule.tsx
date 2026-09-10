import { motion } from 'framer-motion';
import { ArrowLeft, X, Target, Lightbulb, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AcademyContent } from '../../types/academy';

interface RoleExplainerModuleProps {
    content: AcademyContent;
    onBack: () => void;
    onClose: () => void;
}

const iconMap: Record<string, any> = {
    'Target': Target,
    'Lightbulb': Lightbulb,
    'FileText': FileText,
    'Calendar': Calendar
};

export default function RoleExplainerModule({ content, onBack, onClose }: RoleExplainerModuleProps) {
    const { i18n } = useTranslation('translation');
    const currentLang = i18n.language as 'en' | 'es';

    const Icon = iconMap[content.icon] || Target;
    const title = content.title[currentLang];
    const subtitle = content.subtitle[currentLang];
    const contentData = content.content[currentLang];

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

            {/* Header */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-5xl px-8">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg hover:bg-cyan-500/20 transition-colors group"
                        >
                            <ArrowLeft size={20} className="text-slate-400 group-hover:text-cyan-400" />
                            <span className="text-sm font-medium text-slate-400 group-hover:text-cyan-400">
                                {currentLang === 'en' ? 'Back to Selection' : 'Volver a Selección'}
                            </span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center">
                                <Icon className="text-cyan-400" size={24} />
                            </div>
                            <div>
                                <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase">
                                    {content.category.toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-white">{title}</h2>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2.5 bg-slate-800/50 rounded-xl hover:bg-red-500/20 transition-colors group"
                        >
                            <X size={24} className="text-slate-400 group-hover:text-red-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full h-full flex items-center justify-center pt-32 pb-40 px-8">
                <div className="w-full max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Left Column: Methodology & Key Points */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Subtitle */}
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">
                                    {currentLang === 'en' ? 'Overview' : 'Descripción General'}
                                </h3>
                                <p className="text-lg text-slate-300">{subtitle}</p>
                            </div>

                            {/* Methodology */}
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">
                                    {currentLang === 'en' ? 'Methodology' : 'Metodología'}
                                </h3>
                                <p className="text-base text-slate-300 leading-relaxed">{contentData.methodology}</p>
                            </div>

                            {/* Key Points */}
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">
                                    {currentLang === 'en' ? 'Key Capabilities' : 'Capacidades Clave'}
                                </h3>
                                <ul className="space-y-3">
                                    {contentData.keyPoints.map((point, index) => (
                                        <motion.li
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 size={14} className="text-cyan-400" />
                                            </div>
                                            <span className="text-sm text-slate-300">{point}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>

                        {/* Right Column: Visual Demo */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6"
                        >
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">
                                {currentLang === 'en' ? 'Visual Example' : 'Ejemplo Visual'}
                            </h3>

                            {contentData.visualDemo ? (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-white">{contentData.visualDemo.title}</h4>

                                    {/* Render based on type */}
                                    {contentData.visualDemo.type === 'matrix' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* SWOT Matrix */}
                                            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                                                <h5 className="text-xs font-bold text-emerald-400 uppercase mb-2">
                                                    {currentLang === 'en' ? 'Strengths' : 'Fortalezas'}
                                                </h5>
                                                <ul className="space-y-1">
                                                    {contentData.visualDemo.data.strengths?.map((item: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-300">• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                                <h5 className="text-xs font-bold text-red-400 uppercase mb-2">
                                                    {currentLang === 'en' ? 'Weaknesses' : 'Debilidades'}
                                                </h5>
                                                <ul className="space-y-1">
                                                    {contentData.visualDemo.data.weaknesses?.map((item: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-300">• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                                                <h5 className="text-xs font-bold text-cyan-400 uppercase mb-2">
                                                    {currentLang === 'en' ? 'Opportunities' : 'Oportunidades'}
                                                </h5>
                                                <ul className="space-y-1">
                                                    {contentData.visualDemo.data.opportunities?.map((item: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-300">• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                                                <h5 className="text-xs font-bold text-amber-400 uppercase mb-2">
                                                    {currentLang === 'en' ? 'Threats' : 'Amenazas'}
                                                </h5>
                                                <ul className="space-y-1">
                                                    {contentData.visualDemo.data.threats?.map((item: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-300">• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {contentData.visualDemo.type === 'chart' && (
                                        <div className="bg-slate-800/50 rounded-lg p-6">
                                            <div className="space-y-3">
                                                {contentData.visualDemo.data.labels?.map((label: string, i: number) => {
                                                    const value = contentData.visualDemo?.data.datasets?.[0]?.data?.[i] || 0;
                                                    const maxValue = Math.max(...(contentData.visualDemo?.data.datasets?.[0]?.data || [1]));
                                                    const percentage = (value / maxValue) * 100;

                                                    return (
                                                        <div key={i}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-slate-400">{label}</span>
                                                                <span className="text-xs font-bold text-cyan-400">${(value / 1000000).toFixed(1)}M</span>
                                                            </div>
                                                            <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${percentage}%` }}
                                                                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                                                                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-600"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {contentData.visualDemo.type === 'diagram' && (
                                        <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
                                            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                                                <div className="text-xs font-bold text-cyan-400 mb-2">{contentData.visualDemo.data.id}</div>
                                                <div className="space-y-2 text-sm text-slate-300">
                                                    <p><strong>{currentLang === 'en' ? 'As a:' : 'Como:'}</strong> {contentData.visualDemo.data.asA}</p>
                                                    <p><strong>{currentLang === 'en' ? 'I want:' : 'Quiero:'}</strong> {contentData.visualDemo.data.iWant}</p>
                                                    <p><strong>{currentLang === 'en' ? 'So that:' : 'Para que:'}</strong> {contentData.visualDemo.data.soThat}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">
                                                    {currentLang === 'en' ? 'Acceptance Criteria' : 'Criterios de Aceptación'}
                                                </h5>
                                                <ul className="space-y-1">
                                                    {contentData.visualDemo.data.acceptanceCriteria?.map((criteria: string, i: number) => (
                                                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                            <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                                            {criteria}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-slate-500">
                                    {currentLang === 'en' ? 'No visual demo available' : 'No hay demo visual disponible'}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-8">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl px-8 py-4 text-center">
                    <p className="text-sm text-slate-400">
                        {currentLang === 'en'
                            ? 'This AI role analyzes your project and generates professional insights automatically'
                            : 'Este rol de IA analiza tu proyecto y genera insights profesionales automáticamente'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
