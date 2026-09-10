import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, List, Grid3X3, Info } from 'lucide-react';

interface Risk {
    prob: number;
    impact: number;
    desc: string;
}

interface Task {
    name: string;
    risk: Risk;
}

interface Phase {
    name: string;
    tasks: Task[];
}

interface RiskMatrixProps {
    projectPhases: Phase[];
}

// Severity based on score = prob × impact (1–9 scale)
type SeverityKey = 'critical' | 'high' | 'medium' | 'low';
const getSeverity = (score: number): { labelKey: SeverityKey; color: string; bg: string; border: string; dot: string } => {
    if (score >= 7) return { labelKey: 'critical', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', dot: 'bg-red-500 ring-red-200' };
    if (score >= 5) return { labelKey: 'high', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300', dot: 'bg-orange-500 ring-orange-200' };
    if (score >= 3) return { labelKey: 'medium', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400 ring-amber-200' };
    return { labelKey: 'low', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500 ring-emerald-200' };
};

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ projectPhases }) => {
    const { t } = useTranslation('planning');
    const [activeView, setActiveView] = useState<'matrix' | 'register'>('matrix');
    const [sortBy, setSortBy] = useState<'score' | 'phase'>('score');

    const getProbLabel = (prob: number) =>
        ['', t('risk.probLevels.low'), t('risk.probLevels.medium'), t('risk.probLevels.high')][prob] ?? `${prob}`;
    const getImpactLabel = (impact: number) =>
        ['', t('risk.impactLevels.low'), t('risk.impactLevels.medium'), t('risk.impactLevels.high')][impact] ?? `${impact}`;

    const allRisks = useMemo(() => {
        return projectPhases.flatMap(phase =>
            (phase.tasks || []).map(task => ({
                task: task.name,
                phase: phase.name,
                prob: task.risk?.prob ?? 1,
                impact: task.risk?.impact ?? 1,
                desc: task.risk?.desc ?? '—',
                score: (task.risk?.prob ?? 1) * (task.risk?.impact ?? 1),
            }))
        );
    }, [projectPhases]);

    const sortedRisks = useMemo(() => {
        return [...allRisks].sort((a, b) =>
            sortBy === 'score' ? b.score - a.score : a.phase.localeCompare(b.phase)
        );
    }, [allRisks, sortBy]);

    const summary = useMemo(() => ({
        critical: allRisks.filter(r => r.score >= 7).length,
        high: allRisks.filter(r => r.score >= 5 && r.score < 7).length,
        medium: allRisks.filter(r => r.score >= 3 && r.score < 5).length,
        low: allRisks.filter(r => r.score < 3).length,
        total: allRisks.length,
    }), [allRisks]);

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-4">

            {/* Summary chips + view toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {summary.critical > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                            {summary.critical} {t('risk.critical')}
                        </span>
                    )}
                    {summary.high > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                            {summary.high} {t('risk.high')}
                        </span>
                    )}
                    {summary.medium > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                            {summary.medium} {t('risk.medium')}
                        </span>
                    )}
                    {summary.low > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            {summary.low} {t('risk.low')}
                        </span>
                    )}
                    <span className="text-xs text-slate-400 self-center ml-1">{summary.total} {t('risk.totalRisks')}</span>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1 self-start sm:self-auto">
                    <button
                        onClick={() => setActiveView('matrix')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeView === 'matrix' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Grid3X3 className="w-3.5 h-3.5" /> {t('risk.matrixView')}
                    </button>
                    <button
                        onClick={() => setActiveView('register')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeView === 'register' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <List className="w-3.5 h-3.5" /> {t('risk.registerView')}
                    </button>
                </div>
            </div>

            {/* MATRIX VIEW */}
            {activeView === 'matrix' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Visual scatter matrix */}
                    <div className="col-span-2 relative bg-slate-50 rounded-xl border border-slate-200 h-[420px] p-4 overflow-hidden">
                        {/* Axis labels */}
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('risk.impactAxis')}</div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('risk.probabilityAxis')}</div>

                        {/* Axes lines */}
                        <div className="absolute left-10 bottom-8 top-6 w-px bg-slate-300"></div>
                        <div className="absolute left-10 right-6 bottom-8 h-px bg-slate-300"></div>

                        {/* Quadrant backgrounds */}
                        {/* Top-left: High impact, Low prob → High risk */}
                        <div className="absolute left-10 right-[53%] top-6 bottom-[54%] bg-orange-50/70 rounded-tl-lg border-b border-r border-dashed border-orange-200 pointer-events-none"></div>
                        {/* Top-right: High impact, High prob → Critical */}
                        <div className="absolute left-[47%] right-6 top-6 bottom-[54%] bg-red-50/70 rounded-tr-lg border-b border-dashed border-red-200 pointer-events-none"></div>
                        {/* Bottom-left: Low impact, Low prob → Low */}
                        <div className="absolute left-10 right-[53%] top-[46%] bottom-8 bg-emerald-50/70 rounded-bl-lg border-r border-dashed border-emerald-200 pointer-events-none"></div>
                        {/* Bottom-right: Low impact, High prob → Medium */}
                        <div className="absolute left-[47%] right-6 top-[46%] bottom-8 bg-amber-50/70 rounded-br-lg border-dashed border-amber-200 pointer-events-none"></div>

                        {/* Quadrant labels */}
                        <div className="absolute top-8 left-12 text-[9px] font-bold text-orange-400 uppercase tracking-wider">{t('risk.highRiskQuadrant')}</div>
                        <div className="absolute top-8 right-8 text-[9px] font-bold text-red-400 uppercase tracking-wider">{t('risk.criticalQuadrant')}</div>
                        <div className="absolute bottom-10 left-12 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{t('risk.lowRiskQuadrant')}</div>
                        <div className="absolute bottom-10 right-8 text-[9px] font-bold text-amber-400 uppercase tracking-wider">{t('risk.monitoringQuadrant')}</div>

                        {/* Risk dots */}
                        {allRisks.map((risk, idx) => {
                            const sev = getSeverity(risk.score);
                            // Map prob/impact 1-3 to x/y positions (%)
                            // Base position (12% to 84% range to avoid overflow with dot size)
                            let xBase = 12 + ((risk.prob - 1) / 2) * 72;
                            let yBase = 12 + ((risk.impact - 1) / 2) * 72;

                            // Add jitter to separate overlapping risks, but keep within bounds
                            const jitterX = ((idx * 3.1) % 9) - 4;
                            const jitterY = ((idx * 2.7) % 9) - 4;

                            let xPct = Math.max(8, Math.min(92, xBase + jitterX));
                            let yPct = Math.max(8, Math.min(92, yBase + jitterY));

                            return (
                                <div
                                    key={idx}
                                    className={`absolute w-5 h-5 rounded-full shadow-md ring-4 cursor-pointer hover:scale-150 transition-transform group z-10 ${sev.dot}`}
                                    style={{
                                        left: `${xPct}%`,
                                        bottom: `${yPct}%`,
                                        transform: 'translate(-50%, 50%)'
                                    }}
                                >
                                    <div className="hidden group-hover:flex absolute bottom-7 left-1/2 -translate-x-1/2 flex-col w-52 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-2xl z-20 pointer-events-none">
                                        <div className="font-bold text-white mb-1 leading-tight">{risk.task}</div>
                                        <div className="text-slate-400 text-[10px] mb-2">{risk.phase}</div>
                                        <div className="text-slate-300 italic text-[10px] mb-2">{risk.desc}</div>
                                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700">
                                            <span className="text-[10px] text-slate-400">P:{risk.prob}/3 | I:{risk.impact}/3</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sev.bg} ${sev.color} border ${sev.border}`}>
                                                {t('risk.score')} {risk.score} — {t(`risk.${sev.labelKey}`)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right panel: top critical risks */}
                    <div className="space-y-3">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <h3 className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> {t('risk.topCritical')}
                            </h3>
                            <div className="space-y-2">
                                {sortedRisks.filter(r => r.score >= 5).slice(0, 4).map((risk, idx) => {
                                    const sev = getSeverity(risk.score);
                                    return (
                                        <div key={idx} className={`p-2.5 rounded-lg border ${sev.border} ${sev.bg}`}>
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="font-semibold text-xs text-slate-800 leading-tight">{risk.task}</div>
                                                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${sev.color} ${sev.bg} border ${sev.border}`}>
                                                    {risk.score}
                                                </span>
                                            </div>
                                            <div className={`text-[10px] font-semibold uppercase tracking-wider ${sev.color} mb-1`}>{t(`risk.${sev.labelKey}`)}</div>
                                            <div className="text-[10px] text-slate-500 italic">{risk.desc}</div>
                                        </div>
                                    );
                                })}
                                {sortedRisks.filter(r => r.score >= 5).length === 0 && (
                                    <div className="text-xs text-slate-400 italic p-2">{t('risk.noRisks')}</div>
                                )}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 mb-3">
                                <Info className="w-3.5 h-3.5" /> {t('risk.scoreFormula')}
                            </div>
                            <div className="space-y-2">
                                {([
                                    { range: '7–9', labelKey: 'critical' as SeverityKey, dotClass: 'bg-red-500 ring-red-200' },
                                    { range: '5–6', labelKey: 'high' as SeverityKey, dotClass: 'bg-orange-500 ring-orange-200' },
                                    { range: '3–4', labelKey: 'medium' as SeverityKey, dotClass: 'bg-amber-400 ring-amber-200' },
                                    { range: '1–2', labelKey: 'low' as SeverityKey, dotClass: 'bg-emerald-500 ring-emerald-200' },
                                ]).map(item => (
                                    <div key={item.range} className="flex items-center gap-2.5 text-xs">
                                        <div className={`w-3 h-3 rounded-full ring-2 shrink-0 ${item.dotClass}`}></div>
                                        <span className="font-semibold text-slate-700">{t(`risk.${item.labelKey}`)}</span>
                                        <span className="text-slate-400 font-mono ml-auto">{item.range}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                                {t('risk.scoreRange')}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REGISTER VIEW */}
            {activeView === 'register' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            {t('risk.registerDesc')}
                        </p>
                        <div className="flex gap-2 items-center text-xs text-slate-500">
                            {t('risk.sortBy')}
                            <button
                                onClick={() => setSortBy('score')}
                                className={`px-2 py-1 rounded font-semibold transition-all ${sortBy === 'score' ? 'bg-indigo-100 text-indigo-700' : 'hover:text-slate-700'}`}
                            >
                                {t('risk.score')}
                            </button>
                            <button
                                onClick={() => setSortBy('phase')}
                                className={`px-2 py-1 rounded font-semibold transition-all ${sortBy === 'phase' ? 'bg-indigo-100 text-indigo-700' : 'hover:text-slate-700'}`}
                            >
                                {t('risk.phase')}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-700 text-white uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-white">#</th>
                                    <th className="px-4 py-3 text-white">{t('risk.riskTask')}</th>
                                    <th className="px-4 py-3 text-white">{t('risk.phase')}</th>
                                    <th className="px-4 py-3 text-center text-white">{t('risk.probability')}</th>
                                    <th className="px-4 py-3 text-center text-white">{t('risk.impact')}</th>
                                    <th className="px-4 py-3 text-center text-white">{t('risk.score')}</th>
                                    <th className="px-4 py-3 text-center text-white">{t('risk.severity')}</th>
                                    <th className="px-4 py-3 text-white">{t('risk.description')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRisks.map((risk, idx) => {
                                    const sev = getSeverity(risk.score);
                                    return (
                                        <tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800 max-w-[180px]">
                                                <div className="truncate" title={risk.task}>{risk.task}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 max-w-[140px]">
                                                <div className="truncate" title={risk.phase}>{risk.phase}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span title={getProbLabel(risk.prob)} className="font-mono font-bold text-slate-700">{risk.prob}/3</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span title={getImpactLabel(risk.impact)} className="font-mono font-bold text-slate-700">{risk.impact}/3</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ring-2 ${sev.dot}`}>
                                                    {risk.score}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${sev.bg} ${sev.color} ${sev.border}`}>
                                                    {t(`risk.${sev.labelKey}`)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 italic max-w-[220px]">
                                                <div className="truncate" title={risk.desc}>{risk.desc}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">
                        {t('risk.methodology')}
                    </p>
                </div>
            )}
        </div>
    );
};
