import React from 'react';
import { Play, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { DecisionResult } from '../../../../services/ai/decisionEngine';

interface ImprovedDecisionSummaryCardProps {
    result: DecisionResult;
    language: 'es' | 'en';
    onPlayAudio?: () => void;
    onDownloadPDF?: () => void;
    onClose?: () => void;
}

export const ImprovedDecisionSummaryCard: React.FC<ImprovedDecisionSummaryCardProps> = ({
    result,
    language,
    onPlayAudio,
    onDownloadPDF,
    onClose
}) => {
    const isSpanish = language === 'es';
    const isViable = result.verdict === 'GO';
    const score = result.finalScore;

    // Calculate metrics with robust error handling
    const getRiskCount = (): number => {
        try {
            if (!result.riskAnalysis) return 0;

            // Handle if riskAnalysis is a string
            if (typeof result.riskAnalysis === 'string') {
                return result.riskAnalysis.split('\n').filter(l => l.trim().length > 0).length;
            }

            // Handle if riskAnalysis is an array
            if (Array.isArray(result.riskAnalysis)) {
                return (result.riskAnalysis as any[]).length;
            }

            // Handle if riskAnalysis is an object with items
            if (typeof result.riskAnalysis === 'object' && 'items' in result.riskAnalysis) {
                const riskObj = result.riskAnalysis as any;
                return Array.isArray(riskObj.items) ? riskObj.items.length : 0;
            }

            // Fallback
            console.warn('[ImprovedDecisionSummaryCard] Unexpected riskAnalysis type:', typeof result.riskAnalysis);
            return 0;
        } catch (error) {
            console.error('[ImprovedDecisionSummaryCard] Error calculating risk count:', error);
            return 0;
        }
    };

    const riskCount = getRiskCount();
    const consensus = Math.round(isViable ? score : (100 - score));

    // Determine viability level
    const getViabilityLevel = (score: number): string => {
        if (score >= 80) return isSpanish ? 'Alta' : 'High';
        if (score >= 60) return isSpanish ? 'Media' : 'Medium';
        if (score >= 40) return isSpanish ? 'Baja' : 'Low';
        return isSpanish ? 'Muy Baja' : 'Very Low';
    };

    // Get recommendation text
    const getRecommendation = (): string => {
        if (isViable) {
            if (score >= 80) {
                return isSpanish
                    ? 'Proceder con implementación. Proyecto altamente viable.'
                    : 'Proceed with implementation. Highly viable project.';
            } else {
                return isSpanish
                    ? 'Proceder con implementación. Monitorear riesgos identificados.'
                    : 'Proceed with implementation. Monitor identified risks.';
            }
        } else {
            if (score < 40) {
                return isSpanish
                    ? 'No proceder. Requiere rediseño fundamental del proyecto.'
                    : 'Do not proceed. Requires fundamental project redesign.';
            } else {
                return isSpanish
                    ? 'No proceder en estado actual. Requiere ajustes significativos.'
                    : 'Do not proceed in current state. Requires significant adjustments.';
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Main Card */}
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-900/50 flex justify-between items-center">
                    <div className="w-8" /> {/* Spacer for centering Title */}
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider text-center">
                        {isSpanish ? 'Veredicto Final' : 'Final Verdict'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title={isSpanish ? 'Cerrar' : 'Close'}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Verdict Status */}
                <div className="px-8 py-6 text-center">
                    <div className={`
                        inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2
                        ${isViable
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                            : 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'}
                    `}>
                        {isViable ? (
                            <>
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                <div className="text-left">
                                    <div className="text-2xl font-bold text-emerald-400 uppercase tracking-wide">
                                        {isSpanish ? '🟢 Viable - Proceder' : '🟢 Viable - Proceed'}
                                    </div>
                                    <div className="text-sm text-emerald-300/80 mt-1">
                                        {isSpanish ? 'Puntuación' : 'Score'}: <span className="font-mono font-bold">{score}/100</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                                <div className="text-left">
                                    <div className="text-2xl font-bold text-red-400 uppercase tracking-wide">
                                        {isSpanish ? '🔴 No Viable' : '🔴 Not Viable'}
                                    </div>
                                    <div className="text-sm text-red-300/80 mt-1">
                                        {isSpanish ? 'Puntuación' : 'Score'}: <span className="font-mono font-bold">{score}/100</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 w-full">
                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                            <div
                                className={`h-full transition-all duration-1000 ${isViable
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                    : 'bg-gradient-to-r from-red-500 to-orange-400'
                                    }`}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
                            <span>0</span>
                            <span className={isViable ? 'text-emerald-400' : 'text-red-400'}>
                                {score}
                            </span>
                            <span>100</span>
                        </div>
                    </div>
                </div>

                {/* Analysis Section */}
                <div className="px-8 py-6 border-t border-white/10 bg-slate-800/30">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        📊 {isSpanish ? 'Análisis' : 'Analysis'}
                    </h3>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Risks */}
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-slate-400 mb-1">
                                {isSpanish ? 'Riesgos Identificados' : 'Identified Risks'}
                            </div>
                            <div className="text-2xl font-bold text-orange-400 font-mono">
                                {riskCount}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {riskCount === 0
                                    ? (isSpanish ? 'Ninguno' : 'None')
                                    : riskCount <= 2
                                        ? (isSpanish ? 'Menores' : 'Minor')
                                        : (isSpanish ? 'Significativos' : 'Significant')}
                            </div>
                        </div>

                        {/* Consensus */}
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-slate-400 mb-1">
                                {isSpanish ? 'Consenso del Equipo' : 'Team Consensus'}
                            </div>
                            <div className="text-2xl font-bold text-cyan-400 font-mono">
                                {consensus}%
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {consensus >= 80
                                    ? (isSpanish ? 'Muy Alto' : 'Very High')
                                    : consensus >= 60
                                        ? (isSpanish ? 'Alto' : 'High')
                                        : (isSpanish ? 'Bajo' : 'Low')}
                            </div>
                        </div>

                        {/* Viability */}
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-slate-400 mb-1">
                                {isSpanish ? 'Viabilidad Técnica' : 'Technical Viability'}
                            </div>
                            <div className={`text-2xl font-bold font-mono ${score >= 60 ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {getViabilityLevel(score)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                {score >= 60 ? (
                                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 text-red-400" />
                                )}
                                {score >= 60 ? (isSpanish ? 'Positivo' : 'Positive') : (isSpanish ? 'Negativo' : 'Negative')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendation */}
                <div className="px-8 py-6 border-t border-white/10 bg-slate-800/50">
                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        💡 {isSpanish ? 'Recomendación' : 'Recommendation'}
                    </h3>
                    <p className="text-slate-200 leading-relaxed">
                        {getRecommendation()}
                    </p>
                </div>

                {/* Actions */}
                <div className="px-8 py-6 border-t border-white/10 bg-slate-900/50 flex gap-4">
                    <button
                        onClick={onPlayAudio}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl border border-cyan-500/30 transition-all font-bold text-sm uppercase tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                    >
                        <Play className="w-4 h-4" />
                        {isSpanish ? 'Escuchar Resumen' : 'Listen Summary'}
                    </button>
                    <button
                        onClick={onDownloadPDF}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl border border-purple-500/30 transition-all font-bold text-sm uppercase tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
                    >
                        <Download className="w-4 h-4" />
                        {isSpanish ? 'Descargar PDF' : 'Download PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
};
