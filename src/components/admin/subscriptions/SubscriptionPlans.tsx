import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check } from 'lucide-react';
import { SubscriptionPlan } from '../../../services/firebase/subscriptionService';

interface SubscriptionPlansProps {
    plans: SubscriptionPlan[];
    onReset: () => void;
    onEdit: (plan: SubscriptionPlan) => void;
    onCreate: () => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ plans, onReset, onEdit, onCreate }) => {
    const { t } = useTranslation('translation');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{t('admin.subscriptionPlans')}</h2>
                <div className="flex gap-2">
                    <button className="btn-secondary" onClick={onReset}>
                        Reset Defaults
                    </button>
                    <button
                        className="btn-primary"
                        onClick={onCreate}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Plan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="card relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                <div className="text-2xl font-bold text-primary-600 mt-1">
                                    ${plan.price}<span className="text-sm text-slate-500 font-normal">/mo</span>
                                </div>
                            </div>
                            {plan.isActive ? (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                            ) : (
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-medium">Inactive</span>
                            )}
                        </div>

                        <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => onEdit(plan)}
                            className="w-full py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:border-primary-500 hover:text-primary-600 transition-colors"
                        >
                            Edit Plan
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
