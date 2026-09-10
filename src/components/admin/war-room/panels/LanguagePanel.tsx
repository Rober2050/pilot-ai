interface LanguagePanelProps {
    language: 'es' | 'en';
    onLanguageChange: (lang: 'es' | 'en') => void;
}

export const LanguagePanel: React.FC<LanguagePanelProps> = ({
    language,
    onLanguageChange
}) => {
    const isSpanish = language === 'es';

    return (
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
                {isSpanish
                    ? 'Selecciona el idioma de la interfaz'
                    : 'Select interface language'}
            </p>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onLanguageChange('es')}
                    className={`
                        px-6 py-4 rounded-xl border-2 transition-all font-bold text-sm uppercase tracking-wide
                        ${language === 'es'
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'}
                    `}
                >
                    🇪🇸 Español
                </button>
                <button
                    onClick={() => onLanguageChange('en')}
                    className={`
                        px-6 py-4 rounded-xl border-2 transition-all font-bold text-sm uppercase tracking-wide
                        ${language === 'en'
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'}
                    `}
                >
                    🇺🇸 English
                </button>
            </div>
        </div>
    );
};
