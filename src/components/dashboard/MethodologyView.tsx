import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, TrendingUp, BookOpen, AlertTriangle, Users, Clock } from 'lucide-react';
import { Phase, Resource } from '../../types/project';

interface MethodologyViewProps {
    phases: Phase[];
    resources: Resource[];
    totalWeeks: number;
    totalCost: number;
    teamSize: number;
}

const EFFICIENCY_EXPONENT = 0.8;
const HOURS_PER_WEEK_PER_FTE = 30;
const HOURS_PER_MONTH = 160;
const WEEKS_PER_MONTH = 4.33;
const CONTINGENCY = 0.10;
const MGMT_RESERVE = 0.05;

export const MethodologyView: React.FC<MethodologyViewProps> = ({
    phases,
    resources,
    totalWeeks,
    totalCost,
    teamSize,
}) => {
    const { t } = useTranslation('planning');
    // Derive real numbers for display
    const totalTasks = phases.reduce((acc, p) => acc + (p.tasks?.length ?? 0), 0);
    const criticalTasks = phases.flatMap(p => p.tasks ?? []).filter(t => t.critical).length;
    const totalMonthly = resources.reduce((acc, r) => acc + r.rate * HOURS_PER_MONTH * r.count, 0);
    const capacityPerWeek = teamSize * HOURS_PER_WEEK_PER_FTE;
    const durationMonths = (totalWeeks / WEEKS_PER_MONTH).toFixed(1);

    // Example PERT from first critical task (or first task)
    const exampleTask = phases.flatMap(p => p.tasks ?? []).find(t => t.critical) ??
        phases.flatMap(p => p.tasks ?? [])[0];
    const pertOptimistic = exampleTask ? Math.round(exampleTask.days * 7) : 32;
    const pertProbable = exampleTask ? Math.round(exampleTask.days * 8) : 40;
    const pertPessimistic = exampleTask ? Math.round(exampleTask.days * 13) : 60;
    const pertResult = ((pertOptimistic + 4 * pertProbable + pertPessimistic) / 6).toFixed(1);
    const exampleTaskName = exampleTask?.name ?? 'Tarea crítica';

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">

            {/* Header + Framework badges */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-indigo-100 rounded-xl shrink-0">
                        <Calculator className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{t('methodology.engineTitle')}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{t('methodology.engineDesc')}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    {[
                        { label: 'PMI PMBOK 7ª Ed.', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
                        { label: 'PERT', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                        { label: 'WBS Paramétrico', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                        { label: 'COCOMO II', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                        { label: 'ISO 21500', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                    ].map(badge => (
                        <span key={badge.label} className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.color}`}>
                            {badge.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Quick stats from real data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: <Clock className="w-4 h-4 text-blue-500" />, label: t('methodology.plannedWeeks'), value: `${totalWeeks}` },
                    { icon: <Users className="w-4 h-4 text-purple-500" />, label: t('methodology.fteCapacity'), value: `${capacityPerWeek}h` },
                    { icon: <BookOpen className="w-4 h-4 text-emerald-500" />, label: t('methodology.breakdownTasks'), value: `${totalTasks} (${criticalTasks} ${t('methodology.critical')})` },
                    { icon: <TrendingUp className="w-4 h-4 text-amber-500" />, label: t('methodology.estimatedDuration'), value: `${durationMonths} ${t('financial.months')}` },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-[10px] text-slate-500 font-medium">{stat.label}</span></div>
                        <div className="font-bold text-slate-800 text-sm">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* SECTION 1 + 2: WBS & PERT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* WBS */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h4 className="font-bold text-blue-700 mb-1 flex items-center gap-2 text-sm">
                        {t('methodology.wbs.title')}
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                        {t('methodology.wbs.desc')}
                    </p>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 font-mono text-[11px] space-y-1 text-slate-600">
                        <div className="text-slate-400 mb-1">{t('methodology.wbs.phases')} {phases.length}</div>
                        {phases.slice(0, 4).map(p => (
                            <div key={p.id} className="flex justify-between items-center">
                                <span className="text-blue-600 truncate max-w-[180px]">• {p.name}</span>
                                <span className="text-slate-500 shrink-0 ml-2">{p.tasks?.length ?? 0} {t('methodology.wbs.tasks')}</span>
                            </div>
                        ))}
                        {phases.length > 4 && <div className="text-slate-400">... +{phases.length - 4}</div>}
                        <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-bold text-slate-700">
                            <span>{t('methodology.wbs.totalTasks')}</span>
                            <span>{totalTasks}</span>
                        </div>
                    </div>
                </div>

                {/* PERT */}
                <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-purple-500 p-5 shadow-sm">
                    <h4 className="font-bold text-purple-700 mb-1 flex items-center gap-2 text-sm">
                        {t('methodology.pert.title')}
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                        {t('methodology.pert.desc')}
                    </p>
                    <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100 space-y-2">
                        <div className="text-[10px] font-mono text-purple-800 bg-white p-1.5 rounded border border-purple-100 text-center font-bold">
                            {t('methodology.pert.formula')}
                        </div>
                        <div className="text-[10px] text-slate-500 mb-1">{t('methodology.pert.example')} <em>{exampleTaskName}</em></div>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                            <div className="text-slate-500">{t('methodology.pert.optimistic')}</div>
                            <div className="text-right font-mono text-emerald-700">{pertOptimistic}h</div>
                            <div className="text-slate-500">{t('methodology.pert.probable')}</div>
                            <div className="text-right font-mono text-amber-700">{pertProbable}h</div>
                            <div className="text-slate-500">{t('methodology.pert.pessimistic')}</div>
                            <div className="text-right font-mono text-red-700">{pertPessimistic}h</div>
                            <div className="col-span-2 border-t border-purple-200 pt-1 flex justify-between font-bold text-purple-700">
                                <span>{t('methodology.pert.result')}</span>
                                <span>{pertResult}h</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Duration + Cost formulas */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    {t('methodology.formulas.title')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h5 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-3">{t('methodology.formulas.duration')}</h5>
                        <ul className="space-y-3 text-xs">
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0 text-sm">Σ</div>
                                <div><span className="font-bold text-slate-700">{t('methodology.formulas.totalEffort')}</span> {t('methodology.formulas.totalEffortDesc')}</div>
                            </li>
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0 text-sm">÷</div>
                                <div><span className="font-bold text-slate-700">{t('methodology.formulas.teamCapacity')}</span> {teamSize} FTE × {HOURS_PER_WEEK_PER_FTE}h = <strong>{capacityPerWeek}h</strong></div>
                            </li>
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm">~</div>
                                <div><span className="font-bold text-slate-700">{t('methodology.formulas.brooksScaling')}</span> {t('methodology.formulas.brooksDesc')}</div>
                            </li>
                        </ul>
                        <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg text-emerald-800 font-mono text-center text-xs border border-emerald-100">
                            → {totalWeeks} {t('financial.weeks')} ÷ {WEEKS_PER_MONTH} = <strong>{durationMonths} {t('financial.months')}</strong>
                        </div>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-3">{t('methodology.formulas.financial')}</h5>
                        <ul className="space-y-3 text-xs">
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">1</div>
                                <div><span className="font-bold text-slate-700">{t('methodology.formulas.monthly')}</span> {t('methodology.formulas.monthlyFormula')} = <strong>${totalMonthly.toLocaleString()}{t('methodology.formulas.perMonth')}</strong></div>
                            </li>
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">2</div>
                                <div><span className="font-bold text-slate-700">{t('methodology.formulas.base')}</span> ${totalMonthly.toLocaleString()} × {durationMonths} = <strong>${Math.round(totalCost).toLocaleString()}</strong></div>
                            </li>
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">3</div>
                                <div><span className="font-bold text-slate-700">{t('methodology.formulas.reserves')}</span> +{(CONTINGENCY * 100).toFixed(0)}% + {(MGMT_RESERVE * 100).toFixed(0)}%</div>
                            </li>
                        </ul>
                        <div className="mt-3 p-2.5 bg-amber-50 rounded-lg text-amber-800 font-mono text-center text-xs border border-amber-100">
                            → ${Math.round(totalCost * (1 + CONTINGENCY + MGMT_RESERVE)).toLocaleString()} <span className="font-normal">{t('methodology.formulas.totalBudget')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 4: Risk methodology */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    {t('methodology.risks.title')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="text-xs text-slate-600 space-y-2">
                        <p>PMI Risk Management Standard:</p>
                        <div className="font-mono text-center bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-bold">
                            {t('risk.scoreRange')}
                        </div>
                        <p><strong>1 {t('methodology.risks.scale')}</strong></p>
                    </div>
                    <div className="space-y-1.5">
                        {([
                            { range: '7–9', key: 'critical' as const, color: 'bg-red-50 border-red-200 text-red-700' },
                            { range: '5–6', key: 'high' as const, color: 'bg-orange-50 border-orange-200 text-orange-700' },
                            { range: '3–4', key: 'medium' as const, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                            { range: '1–2', key: 'low' as const, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                        ]).map(item => (
                            <div key={item.range} className={`flex items-start gap-3 rounded-lg border p-2.5 ${item.color}`}>
                                <span className="font-mono font-bold text-sm shrink-0 w-8 text-center">{item.range}</span>
                                <div>
                                    <span className="font-bold text-xs">{t(`methodology.risks.${item.key}.label`)}:</span>
                                    <span className="text-xs ml-1">{t(`methodology.risks.${item.key}.action`)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION 5: Assumptions */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    {t('methodology.assumptions.title')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    {(t('methodology.assumptions.items', { returnObjects: true }) as string[]).map((assumption, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-slate-400 shrink-0 font-mono">•</span>
                            <span>{assumption}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
