import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Briefcase, CheckCircle } from 'lucide-react';
import { RoleConfig } from '../types/roles';
import { analyticsService } from '../services/firebase/analyticsService';
import { cn } from '../lib/utils';

interface RewardGateModalProps {
    isOpen: boolean;
    squadRoles: string[];           // los 2 roleIds ya seleccionados
    availableRoles: RoleConfig[];   // todos los roles del sistema
    userId: string;
    projectId: string;
    onComplete: (rewardRoleId: string) => void;
}

type Step = 'sentiment' | 'profile' | 'reward';
type Sentiment = 'magia' | 'util' | 'basico';
type Profile = 'technical' | 'business';

const SENTIMENTS: { key: Sentiment; emoji: string; labelKey: string }[] = [
    { key: 'magia', emoji: '🤩', labelKey: 'magia' },
    { key: 'util',  emoji: '🙂', labelKey: 'util'  },
    { key: 'basico',emoji: '😐', labelKey: 'basico' },
];

const ROLE_COLORS_DARK = [
    { border: 'border-amber-500',  bg: 'bg-amber-500/10',  icon: 'text-amber-400'  },
    { border: 'border-purple-500', bg: 'bg-purple-500/10', icon: 'text-purple-400' },
    { border: 'border-cyan-500',   bg: 'bg-cyan-500/10',   icon: 'text-cyan-400'   },
    { border: 'border-teal-500',   bg: 'bg-teal-500/10',   icon: 'text-teal-400'   },
    { border: 'border-rose-500',   bg: 'bg-rose-500/10',   icon: 'text-rose-400'   },
    { border: 'border-indigo-500', bg: 'bg-indigo-500/10', icon: 'text-indigo-400' },
    { border: 'border-emerald-500',bg: 'bg-emerald-500/10',icon: 'text-emerald-400'},
    { border: 'border-sky-500',    bg: 'bg-sky-500/10',    icon: 'text-sky-400'    },
];

export function RewardGateModal({
    isOpen,
    squadRoles,
    availableRoles,
    userId,
    projectId,
    onComplete,
}: RewardGateModalProps) {
    const { t } = useTranslation('dashboard');
    const [step, setStep]           = useState<Step>('sentiment');
    const [sentiment, setSentiment] = useState<Sentiment | null>(null);
    const [profile, setProfile]     = useState<Profile | null>(null);
    const [rewardRole, setRewardRole] = useState<string | null>(null);

    if (!isOpen) return null;

    // Roles available as reward (exclude already selected squad roles)
    const rewardRoles = availableRoles.filter(r => !squadRoles.includes(r.roleId));

    const handleSentiment = (s: Sentiment) => {
        setSentiment(s);
        setStep('profile');
    };

    const handleProfile = (p: Profile) => {
        setProfile(p);
        // Fire-and-forget: save partial data now (reward_role will be empty string placeholder)
        // We'll save complete record when reward is chosen
        setStep('reward');
    };

    const handleUnlock = () => {
        if (!rewardRole || !sentiment || !profile) return;
        // Save full feedback async (non-blocking)
        analyticsService.saveTrialFeedback({
            user_id: userId,
            project_id: projectId,
            sentiment,
            user_profile: profile,
            selected_experts: squadRoles,
            reward_role: rewardRole,
        });
        onComplete(rewardRole);
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden">

                {/* Step 1 — Sentiment */}
                {step === 'sentiment' && (
                    <div className="p-6 flex flex-col items-center gap-5">
                        {/* Beta badge */}
                        <span className="text-[11px] font-bold tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                            {t('rewardGate.badge')}
                        </span>

                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white mb-1.5">
                                {t('rewardGate.step1Title')}
                            </h2>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {t('rewardGate.step1Subtitle').split('3er experto')[0]}
                                <span className="text-emerald-400 font-semibold">3er experto</span>
                                {t('rewardGate.step1Subtitle').split('3er experto')[1]}
                            </p>
                        </div>

                        {/* Emoji cards */}
                        <div className="grid grid-cols-3 gap-3 w-full">
                            {SENTIMENTS.map(({ key, emoji, labelKey }) => (
                                <button
                                    key={key}
                                    onClick={() => handleSentiment(key)}
                                    className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-white/20 transition-all duration-150 group"
                                >
                                    <span className="text-4xl group-hover:scale-110 transition-transform duration-150">
                                        {emoji}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-300 text-center leading-tight">
                                        {t(`rewardGate.${labelKey}`)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2 — Profile */}
                {step === 'profile' && (
                    <div className="p-6 flex flex-col gap-4">
                        <div className="text-center mb-1">
                            <p className="text-sm font-medium text-slate-300">
                                {t('rewardGate.step2Question')}
                            </p>
                        </div>

                        {/* Technical */}
                        <button
                            onClick={() => handleProfile('technical')}
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-purple-500/50 border-l-4 border-l-purple-500 transition-all duration-150 text-left group"
                        >
                            <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                                <Layers size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white tracking-wide">
                                    {t('rewardGate.technical')}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {t('rewardGate.technicalSub')}
                                </p>
                            </div>
                        </button>

                        {/* Business */}
                        <button
                            onClick={() => handleProfile('business')}
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-indigo-500/50 border-l-4 border-l-indigo-500 transition-all duration-150 text-left group"
                        >
                            <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white tracking-wide">
                                    {t('rewardGate.business')}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {t('rewardGate.businessSub')}
                                </p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Step 3 — Reward Role Picker */}
                {step === 'reward' && (
                    <div className="p-6 flex flex-col gap-4">
                        <div className="text-center">
                            <span className="text-[11px] font-bold tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                                {t('rewardGate.badge')}
                            </span>
                            <h2 className="text-lg font-bold text-white mt-3 mb-1">
                                {t('rewardGate.step3Title')}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {t('rewardGate.step3Subtitle')}
                            </p>
                        </div>

                        {/* Role grid */}
                        <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                            {rewardRoles.map((role, idx) => {
                                const c = ROLE_COLORS_DARK[idx % ROLE_COLORS_DARK.length];
                                const isSelected = rewardRole === role.roleId;
                                return (
                                    <button
                                        key={role.roleId}
                                        onClick={() => setRewardRole(role.roleId)}
                                        className={cn(
                                            'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 text-center',
                                            isSelected
                                                ? `${c.border} ${c.bg} shadow-md`
                                                : 'border-white/10 bg-slate-800 hover:border-white/20 hover:bg-slate-700'
                                        )}
                                    >
                                        {isSelected && (
                                            <CheckCircle size={12} className="text-emerald-400 self-end" />
                                        )}
                                        <span className={cn('text-xs font-bold leading-tight', isSelected ? c.icon : 'text-slate-300')}>
                                            {role.displayName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Unlock button */}
                        <button
                            onClick={handleUnlock}
                            disabled={!rewardRole}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-md"
                        >
                            {t('rewardGate.unlock')} 🚀
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
