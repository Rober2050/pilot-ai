import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Star, Zap, Shield, Rocket, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { subscriptionService, SubscriptionPlan } from '../services/firebase/subscriptionService';
import { loggingService } from '../services/firebase/loggingService';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiredPlan?: 'pro' | 'enterprise';
    currentPlan: string;
    onUpgrade?: (planId: string) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
    isOpen,
    onClose,
    requiredPlan = 'pro',
    currentPlan,
    onUpgrade
}) => {
    const { t } = useTranslation('subscription');
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [comingSoonPlan, setComingSoonPlan] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchPlans = async () => {
                try {
                    const livePlans = await subscriptionService.getAllPlans();
                    const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
                    setPlans(
                        livePlans
                            .filter(p => p.isActive)
                            .sort((a, b) => (PLAN_ORDER[a.id] ?? 99) - (PLAN_ORDER[b.id] ?? 99))
                    );
                } catch (error) {
                    await loggingService.logError('UpgradeModal', 'Failed to fetch subscription plans', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPlans();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) setComingSoonPlan(null);
    }, [isOpen]);

    if (!isOpen) return null;

    const getIcon = (planId: string) => {
        if (planId.toLowerCase().includes('enterprise')) return <Shield className="w-5 h-5" />;
        if (planId.toLowerCase().includes('pro')) return <Zap className="w-5 h-5" />;
        return <Star className="w-5 h-5" />;
    };

    const getColor = (planId: string) => {
        if (planId.toLowerCase().includes('enterprise')) return 'bg-emerald-600';
        if (planId.toLowerCase().includes('pro')) return 'bg-indigo-600';
        return 'bg-slate-700';
    };

    const isPopular = (planId: string) => {
        return planId.toLowerCase().includes('pro');
    };

    const handleUpgrade = (planId: string) => {
        setComingSoonPlan(planId);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

                {/* Top accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-transparent hover:bg-slate-100 rounded-full transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                    <X size={18} />
                </button>

                {/* Coming Soon Panel */}
                {comingSoonPlan ? (
                    <div className="flex flex-col items-center justify-center px-8 py-12 text-center min-h-[340px]">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                            <Rocket className="w-9 h-9 text-white" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
                            {t('comingSoonTitle')}
                        </h2>
                        <p className="text-lg font-semibold text-indigo-600 mb-3">
                            {t('comingSoonMessage')}
                        </p>
                        <p className="text-slate-400 text-sm max-w-sm mb-10">
                            {t('comingSoonSubtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                            <button
                                onClick={() => setComingSoonPlan(null)}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t('comingSoonBack')}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                                {t('comingSoonClose')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="text-center pt-8 pb-6 px-4">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                                {t('upgradeTitle')}
                            </h2>
                            <p className="text-slate-500 max-w-lg mx-auto text-sm">
                                {t('upgradeSubtitle')}
                            </p>
                        </div>

                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-500" />
                            </div>
                        ) : (
                            /* Plans Grid */
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
                                {plans.map((plan) => {
                                    const isCurrent = currentPlan === plan.id;
                                    const isTarget = requiredPlan === plan.id;
                                    const popular = isPopular(plan.id);

                                    return (
                                        <div
                                            key={plan.id}
                                            className={cn(
                                                "relative flex flex-col p-6 rounded-xl border transition-all duration-300",
                                                isTarget
                                                    ? "border-indigo-300 bg-indigo-50 shadow-md shadow-indigo-100 scale-[1.03] z-10"
                                                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                                                popular && !isTarget ? "border-indigo-200" : ""
                                            )}
                                        >
                                            {popular && (
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                                    MOST POPULAR
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={cn("p-2 rounded-lg text-white", getColor(plan.id))}>
                                                    {getIcon(plan.id)}
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                            </div>

                                            <div className="flex items-baseline gap-1 mb-6">
                                                <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                                                {plan.billingCycle !== 'lifetime' && (
                                                    <span className="text-slate-400 text-sm">
                                                        /{plan.billingCycle === 'monthly' ? 'mo' : plan.billingCycle}
                                                    </span>
                                                )}
                                            </div>

                                            <ul className="flex-1 space-y-3 mb-8">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                onClick={() => handleUpgrade(plan.id)}
                                                disabled={isCurrent}
                                                className={cn(
                                                    "w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                                                    isCurrent
                                                        ? "bg-slate-100 text-slate-400 cursor-default"
                                                        : isTarget
                                                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 active:scale-95 focus-visible:ring-indigo-400"
                                                            : "bg-slate-900 hover:bg-slate-700 text-white active:scale-95 focus-visible:ring-slate-400"
                                                )}
                                            >
                                                {isCurrent ? t('currentPlan') : t('upgradeCTAButton')}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UpgradeModal;
