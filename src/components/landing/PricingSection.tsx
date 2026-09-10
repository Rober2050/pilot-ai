import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Shield, Rocket, X, Mail, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { subscriptionService, SubscriptionPlan } from '../../services/firebase/subscriptionService';
import { waitlistService, WaitlistDuplicateError } from '../../services/firebase/waitlistService';
import { loggingService } from '../../services/firebase/loggingService';

export const PricingSection = () => {
    const { t } = useTranslation('translation');
    const { t: tSub } = useTranslation('subscription');
    const navigate = useNavigate();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Waitlist modal state
    const [waitlistOpen, setWaitlistOpen] = useState(false);
    const [waitlistStep, setWaitlistStep] = useState<1 | 2>(1);
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistPlanId, setWaitlistPlanId] = useState('');
    const [waitlistPlanName, setWaitlistPlanName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    useEffect(() => {
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
                await loggingService.logError('PricingSection', 'Failed to fetch subscription plans', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const getIcon = (planId: string) => {
        if (planId.toLowerCase().includes('enterprise')) return Shield;
        if (planId.toLowerCase().includes('pro')) return Zap;
        return Star;
    };

    const getColors = (planId: string) => {
        if (planId.toLowerCase().includes('enterprise')) return {
            color: 'text-cyan-600',
            borderColor: 'border-cyan-200',
            bg: 'bg-cyan-50',
            iconBg: 'bg-cyan-100',
            ctaBg: 'bg-cyan-600 hover:bg-cyan-700',
            popular: false,
        };
        if (planId.toLowerCase().includes('pro')) return {
            color: 'text-indigo-600',
            borderColor: 'border-indigo-200',
            bg: 'bg-indigo-50',
            iconBg: 'bg-indigo-100',
            ctaBg: 'bg-indigo-600 hover:bg-indigo-700',
            popular: true,
        };
        return {
            color: 'text-slate-500',
            borderColor: 'border-slate-200',
            bg: 'bg-white',
            iconBg: 'bg-slate-100',
            ctaBg: 'bg-slate-800 hover:bg-slate-700',
            popular: false,
        };
    };

    const handlePlanClick = (planId: string, planName: string) => {
        if (planId === 'free') {
            navigate('/login');
        } else {
            setWaitlistPlanId(planId);
            setWaitlistPlanName(planName);
            setWaitlistStep(1);
            setWaitlistEmail('');
            setEmailError(null);
            setWaitlistOpen(true);
        }
    };

    const handleWaitlistSubmit = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!waitlistEmail || !emailRegex.test(waitlistEmail)) {
            setEmailError(tSub('waitlistEmailError'));
            return;
        }
        setIsSubmitting(true);
        setEmailError(null);
        try {
            await waitlistService.addEntry(waitlistEmail, waitlistPlanId);
            setWaitlistStep(2);
        } catch (err: any) {
            if (err instanceof WaitlistDuplicateError) {
                // Friendly message — not an error, just already registered
                setEmailError(tSub('waitlistDuplicate'));
            } else if (err?.code === 'permission-denied') {
                setEmailError(tSub('waitlistErrorPermission'));
            } else if (err?.code === 'unavailable' || err?.code === 'network-request-failed') {
                setEmailError(tSub('waitlistErrorNetwork'));
            } else {
                // Unknown backend error — advance to success anyway, don't lose the lead
                setWaitlistStep(2);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeWaitlist = () => {
        setWaitlistOpen(false);
        setWaitlistStep(1);
        setWaitlistEmail('');
        setEmailError(null);
    };

    if (isLoading) {
        return (
            <div className="bg-slate-50/50 py-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <>
            <div id="pricing" className="bg-slate-50/50 py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold text-slate-900 mb-4"
                        >
                            {t('landing.pricing.title')}
                        </motion.h2>
                        {t('landing.pricing.subtitle') && (
                            <p className="text-slate-500 text-lg">
                                {t('landing.pricing.subtitle')}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => {
                            const style = getColors(plan.id);
                            const Icon = getIcon(plan.id);
                            const isFree = plan.id === 'free';
                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative p-8 rounded-2xl border ${style.borderColor} ${style.bg} shadow-sm flex flex-col`}
                                >
                                    {style.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/25">
                                            {tSub('mostPopular')}
                                        </div>
                                    )}
                                    {!isFree && (
                                        <div className="absolute -top-4 right-6 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider shadow-sm">
                                            {tSub('comingSoonBadge')}
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center mb-6 ${style.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                                        {plan.billingCycle !== 'lifetime' && (
                                            <span className="text-slate-400">/{plan.billingCycle === 'monthly' ? 'mo' : plan.billingCycle}</span>
                                        )}
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-grow">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-600 text-sm text-left">
                                                <Check className={`w-4 h-4 shrink-0 mt-0.5 ${style.popular ? 'text-indigo-500' : 'text-slate-400'}`} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handlePlanClick(plan.id, plan.name)}
                                        className={`w-full py-3 rounded-xl font-bold text-white transition-all ${style.ctaBg}`}
                                    >
                                        {isFree ? t('landing.nav.login') : tSub('joinWaitlistCTA')}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Waitlist Modal */}
            {waitlistOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) closeWaitlist(); }}
                >
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
                        <button
                            onClick={closeWaitlist}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="px-8 py-10 text-center">
                            {waitlistStep === 1 ? (
                                <>
                                    {/* Step 1: Email capture */}
                                    {/* Launch badge */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
                                        🎉 {tSub('waitlistLaunchBadge')}
                                    </div>

                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-indigo-500/30">
                                        <Rocket className="w-7 h-7 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-1">
                                        {tSub('waitlistTitle')}
                                    </h2>

                                    {/* 30% discount highlight */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4">
                                        <p className="text-indigo-700 font-bold text-base">
                                            {tSub('waitlistDiscount')}
                                        </p>
                                        {tSub('waitlistDiscountSub') && (
                                            <p className="text-slate-500 text-xs mt-0.5">
                                                {tSub('waitlistDiscountSub')}
                                            </p>
                                        )}
                                    </div>

                                    <p className="text-slate-500 text-sm mb-5">
                                        {tSub('waitlistSubtitle').replace('{{plan}}', waitlistPlanName)}
                                    </p>

                                    <div className="mb-4">
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="email"
                                                value={waitlistEmail}
                                                onChange={(e) => { setWaitlistEmail(e.target.value); setEmailError(null); }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleWaitlistSubmit(); }}
                                                placeholder={tSub('waitlistEmailPlaceholder')}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm"
                                                autoFocus
                                            />
                                        </div>
                                        {emailError && (
                                            <p className="text-red-500 text-xs mt-2 text-left">{emailError}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleWaitlistSubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            tSub('waitlistCTA')
                                        )}
                                    </button>
                                    <p className="text-slate-400 text-xs mt-3">
                                        {tSub('waitlistDisclaimer')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    {/* Step 2: Success */}
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5 mx-auto">
                                        <Check className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                                        {tSub('waitlistSuccessTitle')}
                                    </h2>
                                    <p className="text-slate-500 text-sm mb-8">
                                        {tSub('waitlistSuccessMessage')
                                            .replace('{{email}}', waitlistEmail)
                                            .replace('{{plan}}', waitlistPlanName)}
                                    </p>
                                    <button
                                        onClick={closeWaitlist}
                                        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-bold text-sm transition-all"
                                    >
                                        {tSub('waitlistSuccessClose')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
