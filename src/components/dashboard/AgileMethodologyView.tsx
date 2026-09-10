import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, TrendingUp, BookOpen, Clock, Users, BarChart2, DollarSign } from 'lucide-react';
import { Phase, Resource } from '../../types/project';

interface Sprint {
    number: number;
    weekStart: number;
    weekEnd: number;
    goal: string;
    capacityHours: number;
    plannedHours: number;
}

interface AgileMethodologyViewProps {
    phases: Phase[];
    resources: Resource[];
    totalWeeks: number;
    totalCost: number;
    teamSize: number;
    sprints: Sprint[];
}

const SPRINT_WEEKS = 2;
const EFFICIENCY = 0.70;
const HOURS_PER_WEEK = 40;
const HOURS_PER_MONTH = 160;
const WEEKS_PER_MONTH = 4.33;
const CONTINGENCY = 0.10;
const MGMT_RESERVE = 0.05;

export const AgileMethodologyView: React.FC<AgileMethodologyViewProps> = ({
    phases,
    resources,
    totalWeeks,
    totalCost,
    teamSize,
    sprints,
}) => {
    const { t } = useTranslation('planning');

    const totalTasks = phases.reduce((acc, p) => acc + (p.tasks?.length ?? 0), 0);
    const criticalTasks = phases.flatMap(p => p.tasks ?? []).filter(t => t.critical).length;
    const totalSprints = sprints.length;
    const sprintCapacity = Math.round(teamSize * SPRINT_WEEKS * HOURS_PER_WEEK * EFFICIENCY);
    const durationMonths = (totalWeeks / WEEKS_PER_MONTH).toFixed(1);
    const monthlyCost = resources.reduce((acc, r) => acc + r.rate * HOURS_PER_MONTH * r.count, 0);

    // Average utilization across sprints
    const avgUtilization = totalSprints > 0
        ? Math.round(sprints.reduce((acc, s) => acc + (s.capacityHours > 0 ? Math.min((s.plannedHours / s.capacityHours) * 100, 100) : 0), 0) / totalSprints)
        : 0;

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">

            {/* Header + Framework badges */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-indigo-100 rounded-xl shrink-0">
                        <Zap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{t('agileMethodology.engineTitle')}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{t('agileMethodology.engineDesc')}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    {[
                        { label: 'Scrum Guide 2020', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
                        { label: 'COCOMO II', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                        { label: 'Story Points', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                        { label: 'Velocity Planning', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                        { label: 'PMI-ACP', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                    ].map(badge => (
                        <span key={badge.label} className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.color}`}>
                            {badge.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: <Users className="w-4 h-4 text-purple-500" />, label: t('agileMethodology.teamSize'), value: `${teamSize} FTE` },
                    { icon: <Clock className="w-4 h-4 text-blue-500" />, label: t('agileMethodology.totalSprints'), value: `${totalSprints} sprints` },
                    { icon: <Zap className="w-4 h-4 text-indigo-500" />, label: t('agileMethodology.sprintCapacity'), value: `${sprintCapacity}h` },
                    { icon: <BarChart2 className="w-4 h-4 text-amber-500" />, label: t('agileMethodology.avgUtilization'), value: `${avgUtilization}%` },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-[10px] text-slate-500 font-medium">{stat.label}</span></div>
                        <div className="font-bold text-slate-800 text-sm">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* SECTION 1 + 2: Sprint Sizing + Velocity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Sprint Sizing */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h4 className="font-bold text-blue-700 mb-1 text-sm">{t('agileMethodology.sprintSizing.title')}</h4>
                    <p className="text-xs text-slate-500 mb-3">{t('agileMethodology.sprintSizing.desc')}</p>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 font-mono text-[11px] space-y-1.5 text-slate-600">
                        <div className="text-slate-400 mb-1">{t('agileMethodology.sprintSizing.phases')}: {phases.length}</div>
                        {phases.slice(0, 4).map(p => (
                            <div key={p.id} className="flex justify-between items-center">
                                <span className="text-blue-600 truncate max-w-[180px]">• {p.name}</span>
                                <span className="text-slate-500 shrink-0 ml-2">{p.tasks?.length ?? 0} {t('agileMethodology.sprintSizing.tasks')}</span>
                            </div>
                        ))}
                        {phases.length > 4 && <div className="text-slate-400">... +{phases.length - 4}</div>}
                        <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-bold text-slate-700">
                            <span>{t('agileMethodology.sprintSizing.totalTasks')}</span>
                            <span>{totalTasks} ({criticalTasks} {t('agileMethodology.critical')})</span>
                        </div>
                        <div className="border-t border-slate-200 pt-1 flex justify-between text-indigo-700 font-bold">
                            <span>{t('agileMethodology.sprintSizing.sprintWindow')}</span>
                            <span>{SPRINT_WEEKS} {t('agileMethodology.sprintSizing.weeks')} → {totalSprints} sprints</span>
                        </div>
                    </div>
                </div>

                {/* Velocity Calculation */}
                <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 p-5 shadow-sm">
                    <h4 className="font-bold text-indigo-700 mb-1 text-sm">{t('agileMethodology.velocity.title')}</h4>
                    <p className="text-xs text-slate-500 mb-3">{t('agileMethodology.velocity.desc')}</p>
                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 space-y-2">
                        <div className="text-[10px] font-mono text-indigo-800 bg-white p-1.5 rounded border border-indigo-100 text-center font-bold">
                            {t('agileMethodology.velocity.formula')}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] mt-2">
                            <div className="text-slate-500">{t('agileMethodology.velocity.team')}</div>
                            <div className="text-right font-mono text-slate-700">{teamSize} FTE</div>
                            <div className="text-slate-500">{t('agileMethodology.velocity.sprintWeeks')}</div>
                            <div className="text-right font-mono text-slate-700">{SPRINT_WEEKS} {t('agileMethodology.sprintSizing.weeks')}</div>
                            <div className="text-slate-500">{t('agileMethodology.velocity.hoursPerWeek')}</div>
                            <div className="text-right font-mono text-slate-700">{HOURS_PER_WEEK}h</div>
                            <div className="text-slate-500">{t('agileMethodology.velocity.efficiency')}</div>
                            <div className="text-right font-mono text-amber-700">{(EFFICIENCY * 100).toFixed(0)}%</div>
                            <div className="col-span-2 border-t border-indigo-200 pt-1 flex justify-between font-bold text-indigo-700">
                                <span>{t('agileMethodology.velocity.result')}</span>
                                <span>{sprintCapacity}h / sprint</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Cost Projection */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    {t('agileMethodology.cost.title')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h5 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-3">{t('agileMethodology.cost.duration')}</h5>
                        <ul className="space-y-3 text-xs">
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">S</div>
                                <div><span className="font-bold text-slate-700">{t('agileMethodology.cost.totalSprints')}:</span> {totalSprints} sprints × {SPRINT_WEEKS} {t('agileMethodology.sprintSizing.weeks')} = <strong>{totalWeeks} {t('agileMethodology.cost.weeks')}</strong></div>
                            </li>
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">÷</div>
                                <div><span className="font-bold text-slate-700">{t('agileMethodology.cost.months')}:</span> {totalWeeks} ÷ {WEEKS_PER_MONTH} = <strong>{durationMonths} {t('agileMethodology.cost.monthsUnit')}</strong></div>
                            </li>
                        </ul>
                        <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg text-emerald-800 font-mono text-center text-xs border border-emerald-100">
                            → {totalWeeks} {t('agileMethodology.cost.weeks')} = <strong>{durationMonths} {t('agileMethodology.cost.monthsUnit')}</strong>
                        </div>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-3">{t('agileMethodology.cost.financial')}</h5>
                        <ul className="space-y-3 text-xs">
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">1</div>
                                <div><span className="font-bold text-slate-700">{t('agileMethodology.cost.burnRate')}:</span> {t('agileMethodology.cost.burnRateFormula')} = <strong>${monthlyCost.toLocaleString()}/mes</strong></div>
                            </li>
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">2</div>
                                <div><span className="font-bold text-slate-700">{t('agileMethodology.cost.base')}:</span> ${monthlyCost.toLocaleString()} × {durationMonths} = <strong>${Math.round(totalCost).toLocaleString()}</strong></div>
                            </li>
                            <li className="flex gap-2.5">
                                <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">3</div>
                                <div><span className="font-bold text-slate-700">{t('agileMethodology.cost.reserves')}:</span> +{(CONTINGENCY * 100).toFixed(0)}% + {(MGMT_RESERVE * 100).toFixed(0)}%</div>
                            </li>
                        </ul>
                        <div className="mt-3 p-2.5 bg-amber-50 rounded-lg text-amber-800 font-mono text-center text-xs border border-amber-100">
                            → ${Math.round(totalCost * (1 + CONTINGENCY + MGMT_RESERVE)).toLocaleString()} <span className="font-normal">{t('agileMethodology.cost.totalBudget')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 4: Agile-specific assumptions */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    {t('agileMethodology.assumptions.title')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    {(t('agileMethodology.assumptions.items', { returnObjects: true }) as string[]).map((item, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-indigo-400 shrink-0 font-mono">•</span>
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Anti-hallucination footer */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700">{t('agileMethodology.antiHallucination')}</p>
            </div>
        </div>
    );
};
