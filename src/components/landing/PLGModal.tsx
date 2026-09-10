import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, ArrowRight, LogIn } from 'lucide-react';

interface PLGModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PLGModal: React.FC<PLGModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation('landing');
    const navigate = useNavigate();

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Prevent body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Top accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                <div className="px-8 pt-8 pb-10 flex flex-col items-center text-center">

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
                        <Sparkles size={28} className="text-white" />
                    </div>

                    {/* Badge */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {t('plg.modal.badge')}
                    </span>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-slate-900 leading-tight mb-3">
                        {t('plg.modal.title')}
                    </h2>

                    {/* Message */}
                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-8">
                        {t('plg.modal.message')}
                    </p>

                    {/* CTA Buttons */}
                    <div className="w-full flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-500/25 text-sm"
                        >
                            {t('plg.modal.register')}
                            <ArrowRight size={16} />
                        </button>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 font-medium rounded-2xl transition-all duration-200 text-sm"
                        >
                            <LogIn size={15} />
                            {t('plg.modal.login')}
                        </button>
                    </div>

                    {/* Disclaimer */}
                    <p className="mt-5 text-xs text-slate-400">
                        {t('plg.modal.disclaimer')}
                    </p>
                </div>
            </div>
        </div>
    );
};
