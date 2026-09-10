import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, BarChart3, FolderOpen } from 'lucide-react';
import { SubscriptionPlan } from '../../../services/firebase/subscriptionService';

interface EditPlanModalProps {
    plan: SubscriptionPlan;
    onClose: () => void;
    onSave: (plan: SubscriptionPlan) => void;
    onChange: (plan: SubscriptionPlan) => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan, onClose, onSave, onChange }) => {
    const { t } = useTranslation('translation');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-bold text-slate-900">
                        {plan.id.startsWith('new-plan-') ? 'Create New Plan' : `Edit: ${plan.name}`}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body — scrollable, 2-column grid */}
                <div className="overflow-y-auto flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* ── LEFT COLUMN: Plan Info ── */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Details</h4>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                                <input
                                    type="text"
                                    value={plan.name}
                                    onChange={(e) => onChange({ ...plan, name: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (USD)</label>
                                    <input
                                        type="number"
                                        value={plan.price}
                                        onChange={(e) => onChange({ ...plan, price: Number(e.target.value) })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle</label>
                                    <select
                                        value={plan.billingCycle || 'monthly'}
                                        onChange={(e) => onChange({ ...plan, billingCycle: e.target.value as any })}
                                        className="input-field"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="lifetime">Lifetime</option>
                                    </select>
                                </div>
                            </div>

                            {plan.billingCycle !== 'lifetime' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Duration ({plan.billingCycle === 'daily' ? 'Days' : plan.billingCycle === 'monthly' ? 'Months' : 'Years'})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={plan.durationValue || 1}
                                        onChange={(e) => onChange({ ...plan, durationValue: parseInt(e.target.value) || 1 })}
                                        className="input-field"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Features (one per line)</label>
                                <textarea
                                    value={plan.features.join('\n')}
                                    onChange={(e) => onChange({ ...plan, features: e.target.value.split('\n').filter(f => f.trim()) })}
                                    className="input-field min-h-[100px]"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="planActive"
                                    checked={plan.isActive}
                                    onChange={(e) => onChange({ ...plan, isActive: e.target.checked })}
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="planActive" className="text-sm font-medium text-slate-700">Plan Active</label>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN: Limits ── */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Limits</h4>

                            {/* Max Roles — the key field */}
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={16} className="text-indigo-600" />
                                    <label className="text-sm font-semibold text-indigo-900">Max Roles</label>
                                </div>
                                <p className="text-xs text-indigo-600/70 mb-3">
                                    How many roles the user can select per analysis. The user chooses which ones.
                                </p>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={plan.maxRoles ?? plan.includedRoles?.length ?? 2}
                                    onChange={(e) => onChange({ ...plan, maxRoles: parseInt(e.target.value) || 2 })}
                                    className="input-field text-lg font-bold text-center w-24"
                                />
                            </div>

                            {/* Analyses per month */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 size={16} className="text-slate-600" />
                                    <label className="text-sm font-semibold text-slate-700">Analyses / month</label>
                                </div>
                                {plan.limits?.analysesPerMonth === 'unlimited' ? (
                                    <div className="text-sm font-bold text-indigo-600 mb-1">Unlimited</div>
                                ) : (
                                    <input
                                        type="number"
                                        min="1"
                                        value={typeof plan.limits?.analysesPerMonth === 'number' ? plan.limits.analysesPerMonth : 2}
                                        onChange={(e) => onChange({
                                            ...plan,
                                            limits: { ...(plan.limits || {}), analysesPerMonth: parseInt(e.target.value) || 2 }
                                        } as SubscriptionPlan)}
                                        className="input-field text-sm w-24"
                                    />
                                )}
                                <label className="flex items-center gap-1.5 text-xs mt-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={plan.limits?.analysesPerMonth === 'unlimited'}
                                        onChange={(e) => onChange({
                                            ...plan,
                                            limits: { ...(plan.limits || {}), analysesPerMonth: e.target.checked ? 'unlimited' : 2 }
                                        } as SubscriptionPlan)}
                                        className="rounded border-slate-300"
                                    />
                                    <span className="text-slate-500">Unlimited</span>
                                </label>
                            </div>

                            {/* Max projects */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FolderOpen size={16} className="text-slate-600" />
                                    <label className="text-sm font-semibold text-slate-700">Max projects</label>
                                </div>
                                {plan.limits?.maxProjects === 'unlimited' ? (
                                    <div className="text-sm font-bold text-indigo-600 mb-1">Unlimited</div>
                                ) : (
                                    <input
                                        type="number"
                                        min="1"
                                        value={typeof plan.limits?.maxProjects === 'number' ? plan.limits.maxProjects : 1}
                                        onChange={(e) => onChange({
                                            ...plan,
                                            limits: { ...(plan.limits || {}), maxProjects: parseInt(e.target.value) || 1 }
                                        } as SubscriptionPlan)}
                                        className="input-field text-sm w-24"
                                    />
                                )}
                                <label className="flex items-center gap-1.5 text-xs mt-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={plan.limits?.maxProjects === 'unlimited'}
                                        onChange={(e) => onChange({
                                            ...plan,
                                            limits: { ...(plan.limits || {}), maxProjects: e.target.checked ? 'unlimited' : 1 }
                                        } as SubscriptionPlan)}
                                        className="rounded border-slate-300"
                                    />
                                    <span className="text-slate-500">Unlimited</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
                    <button onClick={() => onSave(plan)} className="btn-primary">{t('common.saveChanges')}</button>
                </div>
            </div>
        </div>
    );
};
