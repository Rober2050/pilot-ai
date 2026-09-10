import React from 'react';
import { DecisionResult } from '../../../../services/ai/decisionEngine';
import { useTranslation } from 'react-i18next';

interface DecisionSummaryCardProps {
    result: DecisionResult;
}

export const DecisionSummaryCard: React.FC<DecisionSummaryCardProps> = ({ result }) => {
    const { t, i18n } = useTranslation('translation');
    const isSpanish = i18n.language?.startsWith('es');

    // finalScore represents project viability (0-100)
    // If verdict is GO, finalScore is the confidence in GO
    // If verdict is NO GO, finalScore is still the project score, but it's below threshold
    const projectScore = result.finalScore;
    const isGo = result.verdict === 'GO';

    // For display: show how much the project aligns with GO vs NO GO
    const goConfidence = isGo ? projectScore : (100 - projectScore);
    const noGoConfidence = 100 - goConfidence;

    // Explanation text
    const explanationText = isSpanish
        ? `Puntuación del proyecto: ${projectScore}%. ${isGo ? 'El proyecto es viable y debe continuar.' : 'El proyecto no es viable en su estado actual.'}`
        : `Project Score: ${projectScore}%. ${isGo ? 'Project is viable and should proceed.' : 'Project is not viable in current state.'}`;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] min-w-[320px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {t('decision_summary', isSpanish ? 'Resumen de Decisión' : 'Decision Summary')}
                    </h3>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${result.verdict === 'GO'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        : result.verdict === 'NO GO'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        }`}>
                        {result.verdict}
                    </div>
                </div>

                {/* Explanation */}
                <div className="mb-3 p-2 bg-slate-800/50 rounded-lg border border-white/5">
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                        {explanationText}
                    </p>
                </div>

                {/* Progress Bars - Show confidence in decision */}
                <div className="space-y-2">
                    {/* GO Confidence */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-emerald-300 font-bold">
                                {isSpanish ? 'Confianza GO' : 'GO Confidence'}
                            </span>
                            <span className="text-emerald-400 font-mono">{goConfidence.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                style={{ width: `${goConfidence}%` }}
                            />
                        </div>
                    </div>

                    {/* NO GO Confidence */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-red-300 font-bold">
                                {isSpanish ? 'Confianza NO GO' : 'NO GO Confidence'}
                            </span>
                            <span className="text-red-400 font-mono">{noGoConfidence.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                style={{ width: `${noGoConfidence}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Score Indicator */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                        {t('project_score', isSpanish ? 'Puntuación Proyecto' : 'Project Score')}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1 h-3 rounded-full ${i < Math.round((projectScore / 100) * 5)
                                        ? 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]'
                                        : 'bg-slate-700'
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-cyan-300 font-mono font-bold">
                            {projectScore}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
