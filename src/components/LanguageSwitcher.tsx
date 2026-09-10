import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation('translation');

    const setLang = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    return (
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full p-1 ml-0 lg:ml-2">
            <button
                onClick={() => setLang('en')}
                className={cn(
                    "px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-xs font-bold transition-all",
                    i18n.language === 'en' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-400 hover:text-slate-600'
                )}
            >
                EN
            </button>
            <button
                onClick={() => setLang('es')}
                className={cn(
                    "px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-xs font-bold transition-all",
                    i18n.language === 'es' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-400 hover:text-slate-600'
                )}
            >
                ES
            </button>
        </div>
    );
}
