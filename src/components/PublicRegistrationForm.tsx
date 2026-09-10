import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/firebase/authService';
import { usersService } from '../services/firebase/usersService';
import { Bot, Mail, User, Lock, ArrowRight, Eye, EyeOff, Sparkles, Check, AlertTriangle } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function PublicRegistrationForm() {
    const { t } = useTranslation('auth');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // 'none' = no conflict, 'orphan' = Auth exists but Firestore doc deleted, 'normal' = active account
    const [emailInUseType, setEmailInUseType] = useState<'none' | 'orphan' | 'normal'>('none');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();

    const getFirebaseError = (code: string): string => {
        switch (code) {
            case 'auth/email-already-in-use': return t('emailInUse');
            case 'auth/weak-password':        return t('weakPassword');
            default:                          return t('registrationFailed');
        }
    };

    const parseGoogleError = (err: unknown): string => {
        const code = (err as any)?.code ?? '';
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
        if (code === 'auth/popup-blocked') return t('errors.popupBlocked');
        if (code === 'auth/account-exists-with-different-credential') return t('errors.accountExistsDifferentProvider');
        if (code.includes('network-request-failed')) return t('errors.networkError');
        return t('errors.default');
    };

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await authService.loginWithGoogle();
            navigate('/app/strategy-hub', { replace: true });
        } catch (err: unknown) {
            setError(parseGoogleError(err));
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        // Reset conflict state when user modifies the email
        if (emailInUseType !== 'none') {
            setEmailInUseType('none');
            setError('');
            setResetSent(false);
        }
    };

    const handleRecoverAccess = async () => {
        setResetLoading(true);
        try {
            await authService.sendPasswordReset(email.trim().toLowerCase());
            setResetSent(true);
        } catch {
            // Even if it fails (e.g., Google-only account has no password), show success
            // to avoid leaking account existence information.
            setResetSent(true);
        } finally {
            setResetLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setEmailInUseType('none');

        if (password !== confirmPassword) {
            setError(t('passwordMismatch'));
            return;
        }
        if (password.length < 6) {
            setError(t('weakPassword'));
            return;
        }

        setLoading(true);
        try {
            // Creates Firebase Auth account + Firestore user profile + 3-day trial
            // Firebase auto-signs the user in after createUserWithEmailAndPassword
            await authService.register(email.trim().toLowerCase(), password, name.trim());

            // Navigate to the app — if there's a pending idea in sessionStorage,
            // the Zero-Click Auto-Start in StrategyHub will fire automatically.
            navigate('/app/strategy-hub', { replace: true });
        } catch (err: any) {
            if (err?.code === 'auth/email-already-in-use') {
                // Differentiate: is this an active account or an orphan Auth account?
                // (Orphan = Firebase Auth account still exists but Firestore doc was deleted)
                try {
                    const existingDoc = await usersService.getUserByEmail(email.trim().toLowerCase());
                    if (existingDoc) {
                        // Normal case: account fully exists and is active
                        setEmailInUseType('normal');
                        setError(t('emailInUse'));
                    } else {
                        // Orphan case: Firebase Auth account still active but platform data was deleted
                        setEmailInUseType('orphan');
                        setError('');
                    }
                } catch {
                    // Fallback if Firestore check fails
                    setEmailInUseType('normal');
                    setError(t('emailInUse'));
                }
            } else {
                setError(getFirebaseError(err?.code ?? ''));
            }
        } finally {
            setLoading(false);
        }
    };

    const perks = [
        t('trialInfo').split(' · ')[0],
        t('trialInfo').split(' · ')[1],
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">

            {/* Language switcher */}
            <div className="absolute top-4 right-4 z-10">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-md">

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-500/30">
                            <Bot className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-1">
                            {t('startJourney')}
                        </h1>
                        <p className="text-slate-500 text-sm">{t('subtitle')}</p>

                        {/* Perks */}
                        <div className="flex items-center justify-center gap-4 mt-3">
                            {perks.map((perk, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <Check size={11} className="shrink-0" aria-hidden="true" />
                                    {perk}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-6">

                        {/* Google Sign-In Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-slate-300 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-5"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            {googleLoading ? t('common:loading') : t('continueWithGoogle')}
                        </button>

                        {/* Separator */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-slate-200" />
                            <span className="text-xs text-slate-400 font-medium">o</span>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        {/* Standard error */}
                        {error && (
                            <div role="alert" className="flex items-start gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm mb-5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" aria-hidden="true" />
                                {error}
                            </div>
                        )}

                        {/* Orphan account recovery panel */}
                        {emailInUseType === 'orphan' && (
                            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-amber-900">{t('orphanAccount.title')}</p>
                                        <p className="text-xs text-amber-700 mt-0.5 leading-snug">{t('orphanAccount.subtitle')}</p>
                                        {!resetSent ? (
                                            <div className="flex gap-2 mt-3">
                                                <Link
                                                    to="/login"
                                                    className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                                >
                                                    {t('orphanAccount.signIn')}
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={handleRecoverAccess}
                                                    disabled={resetLoading}
                                                    className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                                >
                                                    {resetLoading ? '...' : t('orphanAccount.forgot')}
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-green-700 mt-2 font-medium flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                {t('orphanAccount.resetSent')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    {t('fullName')}
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t('namePlaceholder')}
                                        required
                                        autoComplete="name"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    {t('email')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        placeholder="tu@ejemplo.com"
                                        required
                                        autoComplete="email"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    {t('password')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        autoComplete="new-password"
                                        className="w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    {t('confirmPassword')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repite tu contraseña"
                                        required
                                        autoComplete="new-password"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !name.trim() || !email.trim() || !password || !confirmPassword}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-sm mt-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" aria-hidden="true" />
                                        {t('registering')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={15} aria-hidden="true" />
                                        {t('register')}
                                        <ArrowRight size={15} aria-hidden="true" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Login link */}
                        <p className="mt-5 text-center text-sm text-slate-500">
                            {t('hasAccount')}{' '}
                            <Link
                                to="/login"
                                className="text-indigo-600 font-semibold hover:text-indigo-700 focus-visible:outline-none focus-visible:underline"
                            >
                                {t('signIn')}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to landing */}
                <p className="text-center mt-4">
                    <Link
                        to="/"
                        className="text-sm text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                        ← {t('backToHome')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
