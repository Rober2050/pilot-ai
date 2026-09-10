import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { projectsService } from '../services/firebase/projectsService';
import { useAuth } from '../contexts/AuthContext';
import { X, Sparkles, Loader2, BarChart3, Zap, Layers } from 'lucide-react';

type Methodology = 'agile' | 'pmo' | 'hybrid';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MethodologyCard {
    id: Methodology;
    icon: React.ReactNode;
    color: {
        border: string;
        bg: string;
        iconBg: string;
        iconColor: string;
        tag: string;
        tagText: string;
        selectedRing: string;
    };
}

const METHODOLOGY_CARDS: MethodologyCard[] = [
    {
        id: 'pmo',
        icon: <BarChart3 className="w-5 h-5" />,
        color: {
            border: 'border-slate-200 hover:border-slate-400',
            bg: 'hover:bg-slate-50',
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-600',
            tag: 'bg-slate-100',
            tagText: 'text-slate-600',
            selectedRing: 'border-slate-700 bg-slate-50 ring-2 ring-slate-300',
        },
    },
    {
        id: 'agile',
        icon: <Zap className="w-5 h-5" />,
        color: {
            border: 'border-indigo-200 hover:border-indigo-400',
            bg: 'hover:bg-indigo-50',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            tag: 'bg-indigo-100',
            tagText: 'text-indigo-700',
            selectedRing: 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200',
        },
    },
    {
        id: 'hybrid',
        icon: <Layers className="w-5 h-5" />,
        color: {
            border: 'border-emerald-200 hover:border-emerald-400',
            bg: 'hover:bg-emerald-50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            tag: 'bg-emerald-100',
            tagText: 'text-emerald-700',
            selectedRing: 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200',
        },
    },
];

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
    const { t } = useTranslation('planning');
    const [idea, setIdea] = useState('');
    const [language, setLanguage] = useState<'en' | 'es'>('en');
    const [methodology, setMethodology] = useState<Methodology>('pmo');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const projectId = await projectsService.createProject(user.uid, idea, language, methodology);

            // Small delay to ensure Firestore write completes
            await new Promise(resolve => setTimeout(resolve, 500));

            onClose();
            navigate(`/projects/${projectId}`);
        } catch (error) {
            console.error("Error creating project:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{t('modal.title')}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Idea textarea */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('modal.ideaLabel')}
                        </label>
                        <textarea
                            value={idea}
                            onChange={(e) => setIdea(e.target.value)}
                            className="input-field min-h-[120px] resize-none"
                            placeholder={t('modal.ideaPlaceholder')}
                            required
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            {t('modal.ideaHint')}
                        </p>
                    </div>

                    {/* Language selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('modal.languageLabel')}
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="language"
                                    value="en"
                                    checked={language === 'en'}
                                    onChange={() => setLanguage('en')}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-slate-700">English</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="language"
                                    value="es"
                                    checked={language === 'es'}
                                    onChange={() => setLanguage('es')}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-slate-700">Español</span>
                            </label>
                        </div>
                    </div>

                    {/* Methodology selector */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            {t('selector.question')}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {METHODOLOGY_CARDS.map((card) => {
                                const isSelected = methodology === card.id;
                                return (
                                    <button
                                        key={card.id}
                                        type="button"
                                        onClick={() => setMethodology(card.id)}
                                        className={`relative flex flex-col p-4 rounded-xl border-2 text-left transition-all cursor-pointer
                                            ${isSelected ? card.color.selectedRing : `${card.color.border} ${card.color.bg} border-slate-200`}
                                        `}
                                    >
                                        {/* Icon + tag */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-2 rounded-lg ${card.color.iconBg}`}>
                                                <span className={card.color.iconColor}>{card.icon}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${card.color.tag} ${card.color.tagText}`}>
                                                {t(`selector.${card.id}.tag`)}
                                            </span>
                                        </div>
                                        {/* Label */}
                                        <div className="font-bold text-slate-800 text-sm mb-2">
                                            {t(`selector.${card.id}.label`)}
                                        </div>
                                        {/* Descriptions */}
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] text-slate-500">{t(`selector.${card.id}.desc1`)}</p>
                                            <p className="text-[11px] text-slate-500">{t(`selector.${card.id}.desc2`)}</p>
                                            <p className="text-[11px] text-slate-400 italic">{t(`selector.${card.id}.desc3`)}</p>
                                        </div>
                                        {/* Selected indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current opacity-60" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            {t('modal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary min-w-[120px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {t('modal.submitting')}
                                </>
                            ) : (
                                t('modal.submit')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
