import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, BarChart3, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';

type Methodology = 'pmo' | 'agile' | 'hybrid';

const LOADING_STEPS_KEY = ['plg.analyze.step1', 'plg.analyze.step2', 'plg.analyze.step3'] as const;

interface SmartIdeaInputProps {
    idea: string;
    setIdea: (v: string) => void;
    methodology: Methodology;
    setMethodology: (m: Methodology) => void;
    isAnalyzing: boolean;
    loadingStep: number;
    onAnalyze: () => void;
    validationError: string | null;
    setValidationError: (v: string | null) => void;
    suggestedIdea?: string | null;
    setSuggestedIdea?: (v: string | null) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const SmartIdeaInput: React.FC<SmartIdeaInputProps> = ({
    idea,
    setIdea,
    methodology,
    setMethodology,
    isAnalyzing,
    loadingStep,
    onAnalyze,
    validationError,
    setValidationError,
    suggestedIdea,
    setSuggestedIdea,
    textareaRef,
}) => {
    const { t } = useTranslation('landing');

    // ── Rotating placeholder ────────────────────────────────────────────────
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [placeholderVisible, setPlaceholderVisible] = useState(true);

    useEffect(() => {
        if (idea.trim()) return;
        // Track inner timeout so it's cleaned up on unmount / idea change
        let innerTimeout: ReturnType<typeof setTimeout> | null = null;
        const interval = setInterval(() => {
            setPlaceholderVisible(false);
            innerTimeout = setTimeout(() => {
                setPlaceholderIdx(i => (i + 1) % 3);
                setPlaceholderVisible(true);
            }, 300);
        }, 3500);
        return () => {
            clearInterval(interval);
            if (innerTimeout !== null) clearTimeout(innerTimeout);
        };
    }, [idea]);

    // ── Auto-resize textarea ────────────────────────────────────────────────
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [idea, textareaRef]);

    const methodologyIcons: Record<Methodology, React.ReactNode> = {
        pmo: <BarChart3 size={13} />,
        agile: <Zap size={13} />,
        hybrid: <Layers size={13} />,
    };

    return (
        <div className={cn(
            'bg-white rounded-2xl border transition-all duration-300 shadow-sm',
            validationError
                ? 'border-rose-300 ring-1 ring-rose-100'
                : isAnalyzing
                    ? 'border-indigo-300 ring-1 ring-indigo-100 shadow-[0_4px_24px_rgba(99,102,241,0.12)]'
                    : 'border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)]'
        )}>
            <div className="p-4 sm:p-6">

                {/* Textarea with rotating placeholder overlay */}
                <div className="relative">
                    {/* Rotating placeholder — visible only when textarea is empty.
                        Uses `invisible` (visibility:hidden) when fading out so Chrome
                        excludes it from LCP measurements — opacity-only transitions
                        would update LCP on every rotation cycle. */}
                    {!idea.trim() && (
                        <div
                            aria-hidden="true"
                            className={cn(
                                'absolute top-0 left-0 right-0 pointer-events-none px-1 py-1',
                                'text-base sm:text-xl font-light leading-relaxed text-slate-400',
                                'transition-opacity duration-300',
                                placeholderVisible ? 'opacity-100' : 'opacity-0 invisible'
                            )}
                        >
                            {t(`plg.quickExamples.items.${placeholderIdx}`)}
                        </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        value={idea}
                        onChange={(e) => {
                            setIdea(e.target.value);
                            if (validationError) setValidationError(null);
                        }}
                        placeholder=""
                        aria-label={t('plg.inputPlaceholder')}
                        rows={2}
                        disabled={isAnalyzing}
                        className="w-full min-h-[52px] max-h-[300px] px-1 py-1 text-base sm:text-xl bg-transparent border-none outline-none resize-y leading-relaxed font-light tracking-wide text-slate-900 disabled:opacity-60 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent relative z-10"
                    />
                </div>

                {/* Validation error — guided, not punishing */}
                {validationError && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                        <p className="text-sm text-amber-800 font-medium flex items-center gap-1.5">
                            <span aria-hidden="true">💡</span>
                            {validationError}
                        </p>

                        {/* Smart Suggestion (if available) */}
                        {suggestedIdea && (
                            <div className="bg-white rounded-lg p-2.5 border border-amber-100 space-y-2">
                                <div className="flex items-start gap-2">
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider pt-1 shrink-0">
                                        ✨ {t('plg.suggestion.label')}
                                    </span>
                                    <p className="text-xs text-amber-900 leading-relaxed flex-1">
                                        {suggestedIdea}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIdea(suggestedIdea);
                                            setValidationError(null);
                                            if (setSuggestedIdea) setSuggestedIdea(null);
                                            textareaRef.current?.focus();
                                        }}
                                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-bold transition-all"
                                    >
                                        <Zap size={9} aria-hidden="true" />
                                        {t('plg.suggestion.use')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (setSuggestedIdea) setSuggestedIdea(null);
                                            textareaRef.current?.focus();
                                        }}
                                        className="px-3 py-1.5 rounded-full bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 text-[11px] font-medium transition-colors"
                                    >
                                        {t('plg.suggestion.edit')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Generic Examples (if no suggestion) */}
                        {!suggestedIdea && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                    {t('plg.validation.tryThis')}:
                                </span>
                                {[0, 1].map(i => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setIdea(t(`plg.quickExamples.items.${i}`));
                                            setValidationError(null);
                                            textareaRef.current?.focus();
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-amber-700 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-1"
                                    >
                                        <Zap size={9} aria-hidden="true" />
                                        {t(`plg.quickExamples.items.${i}`).slice(0, 48)}…
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">

                    {/* Methodology pills */}
                    <div className="flex items-center gap-2">
                        {(['pmo', 'agile', 'hybrid'] as Methodology[]).map((m) => {
                            const selected = methodology === m;
                            return (
                                <button
                                    key={m}
                                    onClick={() => setMethodology(m)}
                                    disabled={isAnalyzing}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1',
                                        'disabled:cursor-not-allowed',
                                        selected && m === 'pmo'    && 'bg-slate-700 text-white border-slate-700',
                                        selected && m === 'agile'  && 'bg-indigo-600 text-white border-indigo-600',
                                        selected && m === 'hybrid' && 'bg-emerald-600 text-white border-emerald-600',
                                        !selected && 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                                    )}
                                >
                                    <span aria-hidden="true">{methodologyIcons[m]}</span>
                                    {t(`plg.methodology.${m}`)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Analyze button */}
                    <button
                        onClick={onAnalyze}
                        disabled={isAnalyzing || !idea.trim()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-full transition-all duration-200 active:scale-95 shadow-sm min-w-[160px]"
                    >
                        {isAnalyzing ? (
                            <>
                                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                                <span className="truncate max-w-[180px]">
                                    {t(LOADING_STEPS_KEY[loadingStep])}
                                </span>
                            </>
                        ) : (
                            <>
                                <Zap size={15} className="fill-white shrink-0" aria-hidden="true" />
                                {t('plg.analyze.button')}
                            </>
                        )}
                    </button>
                </div>

                {/* Quick examples — visible only when textarea is empty and not analyzing */}
                {!isAnalyzing && !idea.trim() && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('plg.quickExamples.label')}:
                        </span>
                        {[0, 1, 2].map((i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setIdea(t(`plg.quickExamples.items.${i}`));
                                    setValidationError(null);
                                    textareaRef.current?.focus();
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-500 text-[11px] font-medium transition-colors border border-transparent hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1"
                            >
                                <Zap size={9} aria-hidden="true" />
                                {t('plg.quickExamples.use')} {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
