import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Save, Trash2, Plus, ChevronDown, AlertTriangle, TrendingUp } from 'lucide-react';

interface Resource {
    id: number;
    role: string;
    seniority: string;
    count: number;
    rate: number;
}

interface FinancialViewProps {
    resources: Resource[];
    totalWeeks: number;
    isEditingResources: boolean;
    onStartEditing: () => void;
    onSaveEditing: () => void;
    onCancelEditing: () => void;
    onUpdateResource?: (id: number, field: keyof Resource, value: any) => void;
    onAddResource?: () => void;
    onRemoveResource?: (id: number) => void;
}

const CONTINGENCY_RATE = 0.10;
const MANAGEMENT_RESERVE_RATE = 0.05;
const HOURS_PER_MONTH = 160;
const WEEKS_PER_MONTH = 4.33;

export const FinancialView: React.FC<FinancialViewProps> = ({
    resources,
    totalWeeks,
    isEditingResources,
    onStartEditing,
    onSaveEditing,
    onCancelEditing,
    onUpdateResource,
    onAddResource,
    onRemoveResource
}) => {
    const { t } = useTranslation(['planning', 'common']);
    const durationMonths = totalWeeks / WEEKS_PER_MONTH;
    const totalMonthly = resources.reduce((acc, res) => acc + (res.rate * HOURS_PER_MONTH * res.count), 0);
    const baseCost = totalMonthly * durationMonths;
    const contingencyReserve = baseCost * CONTINGENCY_RATE;
    const managementReserve = baseCost * MANAGEMENT_RESERVE_RATE;
    const totalWithReserves = baseCost + contingencyReserve + managementReserve;

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
            {/* Header actions */}
            <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>{t('financial.duration')} <strong className="text-slate-700">{totalWeeks} {t('financial.weeks')}</strong> ({durationMonths.toFixed(1)} {t('financial.months')})</span>
                    <span>{t('financial.capacity')} <strong className="text-slate-700">{HOURS_PER_MONTH}{t('financial.hoursPerMonth')}</strong> {t('financial.perFTE')}</span>
                </div>
                <div className="flex gap-2">
                    {isEditingResources ? (
                        <>
                            <button
                                onClick={onCancelEditing}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 transition-all"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={onSaveEditing}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                            >
                                <Save className="w-3 h-3" /> {t('save')}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onStartEditing}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            <Edit2 className="w-3 h-3" /> {t('financial.editResources')}
                        </button>
                    )}
                </div>
            </div>

            {isEditingResources && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong className="text-amber-900">{t('financial.editingMode')}</strong> {t('financial.editingDesc')}
                </div>
            )}

            {/* Resource table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-white uppercase bg-slate-700">
                        <tr>
                            <th className="px-5 py-3 text-left text-white">{t('financial.role')}</th>
                            <th className="px-5 py-3 text-left text-white">{t('financial.seniority')}</th>
                            <th className="px-5 py-3 text-center text-white">
                                <span
                                    title={t('financial.fteTooltip')}
                                    className="cursor-help border-b border-dashed border-slate-400"
                                >
                                    {t('financial.fte')}
                                </span>
                            </th>
                            <th className="px-5 py-3 text-right text-white">{t('financial.rate')}</th>
                            <th className="px-5 py-3 text-right text-white">{t('financial.monthly')}</th>
                            <th className="px-5 py-3 text-right text-white">{t('financial.total')}</th>
                            {isEditingResources && <th className="px-5 py-3 w-10"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map((res) => {
                            const monthlyRes = res.rate * HOURS_PER_MONTH * res.count;
                            const totalRes = monthlyRes * durationMonths;
                            return (
                                <tr key={res.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-4 font-medium text-slate-900">
                                        {isEditingResources ? (
                                            <input
                                                type="text"
                                                value={res.role}
                                                onChange={(e) => onUpdateResource?.(res.id, 'role', e.target.value)}
                                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        ) : res.role}
                                    </td>
                                    <td className="px-5 py-4">
                                        {isEditingResources ? (
                                            <div className="relative">
                                                <select
                                                    value={res.seniority}
                                                    onChange={(e) => onUpdateResource?.(res.id, 'seniority', e.target.value)}
                                                    className="w-full appearance-none border border-slate-200 rounded px-2 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white pr-8"
                                                >
                                                    <option value="Junior">Junior</option>
                                                    <option value="Mid-Level">Mid-Level</option>
                                                    <option value="Senior">Senior</option>
                                                    <option value="Lead">Lead</option>
                                                </select>
                                                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                                ${res.seniority === 'Senior' || res.seniority === 'Lead' ? 'bg-purple-100 text-purple-700' :
                                                    res.seniority === 'Mid-Level' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {res.seniority}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center font-bold">
                                        {isEditingResources ? (
                                            <input
                                                type="number"
                                                min="0.1"
                                                step="0.1"
                                                value={res.count}
                                                onChange={(e) => onUpdateResource?.(res.id, 'count', parseFloat(e.target.value))}
                                                className="w-16 text-center border border-slate-200 rounded px-1 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        ) : res.count}
                                    </td>
                                    <td className="px-5 py-4 text-right font-mono text-slate-500">
                                        {isEditingResources ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <span>$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={res.rate}
                                                    onChange={(e) => onUpdateResource?.(res.id, 'rate', parseFloat(e.target.value))}
                                                    className="w-16 text-right border border-slate-200 rounded px-1 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        ) : `$${res.rate}`}
                                    </td>
                                    <td className="px-5 py-4 text-right font-semibold text-slate-700">
                                        ${monthlyRes.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
                                        ${Math.round(totalRes).toLocaleString()}
                                    </td>
                                    {isEditingResources && (
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => onRemoveResource?.(res.id)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-50 text-slate-900 border-t-2 border-slate-200">
                        <tr>
                            <td colSpan={4} className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                {t('financial.totalMonthly')}
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-base text-slate-800">
                                ${totalMonthly.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-base text-emerald-700">
                                ${Math.round(baseCost).toLocaleString()}
                            </td>
                            {isEditingResources && <td></td>}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {isEditingResources && (
                <button
                    onClick={onAddResource}
                    className="w-full border-2 border-dashed border-slate-200 rounded-lg p-3 flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-sm font-bold"
                >
                    <Plus className="w-4 h-4" /> {t('financial.addResource')}
                </button>
            )}

            {/* Cost breakdown with reserves */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('financial.baseCost')}</div>
                    <div className="text-2xl font-bold text-slate-800">${Math.round(baseCost).toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">{totalWeeks} {t('financial.weeks')} × ${totalMonthly.toLocaleString()}/mo</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                        <AlertTriangle className="w-3 h-3" /> {t('financial.contingency')}
                    </div>
                    <div className="text-2xl font-bold text-amber-700">${Math.round(contingencyReserve).toLocaleString()}</div>
                    <div className="text-xs text-amber-600 mt-1">{t('financial.contingencyNote')}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                        <TrendingUp className="w-3 h-3" /> {t('financial.management')}
                    </div>
                    <div className="text-2xl font-bold text-blue-700">${Math.round(managementReserve).toLocaleString()}</div>
                    <div className="text-xs text-blue-600 mt-1">{t('financial.managementNote')}</div>
                </div>
            </div>

            {/* Total final */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 flex items-center justify-between text-white shadow-lg">
                <div>
                    <div className="text-sm font-semibold text-slate-300">{t('financial.recommendedBudget')}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                        {t('financial.budgetFormula')}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold">${Math.round(totalWithReserves).toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t('financial.usdTotal')}</div>
                </div>
            </div>
        </div>
    );
};
