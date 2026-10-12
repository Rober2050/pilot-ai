import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/firebase/authService';
import { ArrowRight, Loader2, Mail, Lock, User, Sparkles, ArrowLeft } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { GOOGLE_AUTH_ENABLED, PUBLIC_SIGNUP_ENABLED } from '../constants/authFeatures';

function parseAuthError(err: unknown, t: (key: string) => string): string {
    const code = (err as any)?.code ?? '';
    const message = ((err as any)?.message ?? '').toLowerCase();

    // Supabase error messages
    if (message.includes('invalid login credentials')) return t('errors.invalidCredential');
    if (message.includes('email not confirmed')) return 'Tu email no está confirmado. Revisa tu bandeja de entrada.';
    if (message.includes('rate limit') || message.includes('too many')) return t('errors.tooManyRequests');
    if (message.includes('user not found')) return t('errors.invalidCredential');
    if (message.includes('network') || message.includes('fetch')) return t('errors.networkError');

    // Firebase legacy codes
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
        return t('errors.invalidCredential');
    }
    if (code.includes('email-already-in-use')) return t('errors.emailInUse');
    if (code.includes('user-disabled')) return t('errors.userDisabled');
    if (code.includes('too-many-requests')) return t('errors.tooManyRequests');
    if (code.includes('network-request-failed')) return t('errors.networkError');

    // Show actual error in dev — fallback to generic in prod
    return (err as any)?.message || t('errors.default');
}

function parseGoogleError(err: unknown, t: (key: string) => string): string {
    const code = (err as any)?.code ?? '';
    const message = ((err as any)?.message ?? '').toLowerCase();
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
    if (code === 'auth/popup-blocked') return t('errors.popupBlocked');
    if (code === 'auth/account-exists-with-different-credential') return t('errors.accountExistsDifferentProvider');
    if (code.includes('network-request-failed') || message.includes('network')) return t('errors.networkError');
    return t('errors.default');
}

export default function Login() {
    const { t } = useTranslation('auth');
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const inviteEmail = searchParams.get('email');
        if (inviteEmail) {
            setEmail(inviteEmail);
            setIsLogin(false);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await authService.login(email, password);
            } else {
                await authService.register(email, password, name);
            }
            navigate('/app/strategy-hub');
        } catch (err: unknown) {
            setError(parseAuthError(err, t));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await authService.loginWithGoogle();
            navigate('/app/strategy-hub');
        } catch (err: unknown) {
            setError(parseGoogleError(err, t));
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col font-sans">

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4">
                <Link
                    to="/"
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <ArrowLeft size={15} />
                    {t('backToHome')}
                </Link>
                <LanguageSwitcher />
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">

                    {/* Logo & Branding */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
                            <Sparkles size={26} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">PILOTAI</h1>
                        <p className="text-slate-400 text-xs font-medium mt-1">{t('subtitle')}</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

                        {/* Top accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

                        <div className="px-8 pt-7 pb-8">

                            {/* Card header */}
                            <div className="text-center mb-7">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {isLogin ? t('welcomeBack') : t('startJourney')}
                                </h2>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl text-sm mb-5 border border-red-100 flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {GOOGLE_AUTH_ENABLED && (
                                <>
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
                                </>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Name field (register only) */}
                                {!isLogin && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                            {t('fullName')}
                                        </label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email field */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                        {t('email')}
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                            placeholder="you@domain.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password field */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                        {t('password')}
                                    </label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 mt-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-500/25 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            {isLogin ? t('signIn') : t('createAccount')}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Toggle login/register — invitation links (?email=) open register mode on their own */}
                            <div className="mt-6 text-center">
                                {PUBLIC_SIGNUP_ENABLED ? (
                                    <button
                                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                                        className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
                                    >
                                        {isLogin ? t('noAccount') : t('hasAccount')}
                                    </button>
                                ) : isLogin ? (
                                    <p className="text-xs text-slate-400 leading-relaxed">{t('inviteOnly')}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Footer disclaimer */}
                    <p className="text-center text-xs text-slate-400 mt-5">
                        {t('disclaimer')}
                    </p>
                </div>
            </div>
        </div>
    );
}
