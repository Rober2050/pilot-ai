import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Globe, LogIn, Mail, GraduationCap,
    TrendingUp, Package, BarChart2, Briefcase,
    Palette, Server, Layout, Shield,
} from 'lucide-react';
import { PLGModal } from '../components/landing/PLGModal';
import { SmartIdeaInput } from '../components/landing/SmartIdeaInput';
import { WarRoomService } from '../services/ai/WarRoomService';
import { cn } from '../lib/utils';

// ─── Below-the-fold sections — code-split so they don't block initial paint ───
const FeaturesGrid = React.lazy(() =>
    import('../components/landing/FeaturesGrid').then(m => ({ default: m.FeaturesGrid }))
);
const PricingSection = React.lazy(() =>
    import('../components/landing/PricingSection').then(m => ({ default: m.PricingSection }))
);

// ─── Constants ────────────────────────────────────────────────────────────────

type Methodology = 'pmo' | 'agile' | 'hybrid';

// Planes restringen cantidad de roles, no tipos específicos
// Landing page: usuarios pueden elegir cualquier rol hasta máximo 2

interface RoleDef {
    id: string;
    icon: React.ReactNode;
    color: {
        border: string;
        bg: string;
        iconBg: string;
        iconColor: string;
        dot: string;
        tag: string;
        tagText: string;
    };
    deliverables: string;
}

const LANDING_ROLES: RoleDef[] = [
    {
        id: 'strategy-analyst',
        icon: <TrendingUp size={22} />,
        color: { border: 'border-orange-200', bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', dot: 'bg-orange-400', tag: 'bg-orange-100', tagText: 'text-orange-700' },
        deliverables: 'DOC / PPT',
    },
    {
        id: 'product-manager',
        icon: <Package size={22} />,
        color: { border: 'border-purple-200', bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', dot: 'bg-purple-400', tag: 'bg-purple-100', tagText: 'text-purple-700' },
        deliverables: 'DOC / Excel',
    },
    {
        id: 'business-analyst',
        icon: <BarChart2 size={22} />,
        color: { border: 'border-teal-200', bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', dot: 'bg-teal-400', tag: 'bg-teal-100', tagText: 'text-teal-700' },
        deliverables: 'DOC / Excel',
    },
    {
        id: 'project-manager',
        icon: <Briefcase size={22} />,
        color: { border: 'border-green-200', bg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', dot: 'bg-green-400', tag: 'bg-green-100', tagText: 'text-green-700' },
        deliverables: 'DOC / PPT',
    },
    {
        id: 'marketing-manager',
        icon: <Palette size={22} />,
        color: { border: 'border-rose-200', bg: 'bg-rose-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', dot: 'bg-rose-400', tag: 'bg-rose-100', tagText: 'text-rose-700' },
        deliverables: 'DOC / PPT',
    },
    {
        id: 'architect',
        icon: <Server size={22} />,
        color: { border: 'border-blue-200', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-400', tag: 'bg-blue-100', tagText: 'text-blue-700' },
        deliverables: 'DOC / PPT',
    },
    {
        id: 'ux-designer',
        icon: <Layout size={22} />,
        color: { border: 'border-indigo-200', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', dot: 'bg-indigo-400', tag: 'bg-indigo-100', tagText: 'text-indigo-700' },
        deliverables: 'DOC / Excel',
    },
    {
        id: 'qa-engineer',
        icon: <Shield size={22} />,
        color: { border: 'border-emerald-200', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', dot: 'bg-emerald-400', tag: 'bg-emerald-100', tagText: 'text-emerald-700' },
        deliverables: 'DOC / PPT',
    },
];

// ─── Validation ───────────────────────────────────────────────────────────────
// Four-level check: length → gibberish → vague phrases → domain specificity

/**
 * MINIMAL validation — only catch obvious spam/gibberish
 * Delegate real validation to WarRoomService.validateTopic() (AI-powered)
 * This prevents resource waste on spam while allowing legitimate ideas through
 */
function validateIdea(text: string): 'ok' | 'tooShort' {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();
    const words = trimmed.split(/\s+/).filter(Boolean);

    // ── 1. Absolute minimum — at least 2 words, 10 chars ──────────────────────
    if (words.length < 2 || trimmed.length < 10) return 'tooShort';

    // ── 2. Obvious gibberish detection — pure spam prevention ──────────────────
    const stripped = lower.replace(/\s/g, '');

    // 'aaaaaa' or only 3 unique letters = gibberish
    if (new Set(stripped).size < 4) return 'tooShort';

    // 'aaaa' repeated = gibberish (5+ same char in a row)
    if (/(.)\1{4,}/.test(stripped)) return 'tooShort';

    // 'qwertyqwerty' = keyboard mashing
    if (/^[qwerty]{5,}$/i.test(stripped)) return 'tooShort';

    // Pass all else to WarRoomService — it handles real intelligence
    return 'ok';
}

// ─── Component ────────────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
    const { t, i18n } = useTranslation('landing');
    const navigate = useNavigate();

    // Nav scroll state
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // PLG form state
    const [idea, setIdea] = useState('');
    const [methodology, setMethodology] = useState<Methodology>('pmo');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [suggestedIdea, setSuggestedIdea] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const toggleLandingRole = (roleId: string) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleId)) return prev.filter(id => id !== roleId);
            if (prev.length >= 2) return prev; // max 2 — ignore extra clicks
            return [...prev, roleId];
        });
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => { timeoutsRef.current.forEach(clearTimeout); };
    }, []);

    const handleAnalyze = useCallback(async () => {
        // Validate idea text (local check only — no roles required yet)
        const result = validateIdea(idea);
        if (result !== 'ok') {
            setValidationError(t(`plg.validation.${result}`));
            textareaRef.current?.focus();
            return;
        }

        setValidationError(null);
        setSuggestedIdea(null);

        // Enhanced validation: Check if idea is complete and generate smart suggestions
        try {
            console.log('[SMART] Validando idea con WarRoomService:', idea);
            const validation = await WarRoomService.validateTopic(idea, i18n.language as 'es' | 'en');
            console.log('[SMART] Resultado validación:', validation);
            console.log('[SMART] validation.incomplete:', validation.incomplete, 'validation.suggestion:', validation.suggestion);

            // If idea is incomplete, show suggestion (if available)
            if (validation.incomplete) {
                console.log('[SMART] Idea incompleta, mostrando sugerencia card');
                // Show suggestion card instead of proceeding
                setValidationError(validation.reason || (i18n.language === 'es' ? 'La idea es válida pero necesita más detalles' : 'Your idea is valid but needs more details'));
                if (validation.suggestion) {
                    console.log('[SMART] Sugerencia disponible:', validation.suggestion);
                    setSuggestedIdea(validation.suggestion);
                } else {
                    console.warn('[SMART] Idea incompleta pero sin sugerencia generada');
                    setSuggestedIdea(null);
                }
                textareaRef.current?.focus();
                return;
            }
            console.log('[SMART] Idea válida/completa, continuando con análisis...');
        } catch (e) {
            console.error('[SMART] Error en validación mejorada:', e);
            // Continue even if enhanced validation fails
        }

        // Solo aquí validar roles — después de que IA valide la idea
        if (selectedRoles.length < 2) {
            setValidationError(i18n.language === 'es' ? 'Selecciona 2 roles para continuar con el análisis' : 'Select 2 roles to continue with the analysis');
            return;
        }

        // Save to storage (with fallback for restricted browsers)
        try {
            sessionStorage.setItem('pilotai_pending_idea', JSON.stringify({ idea, methodology, selectedRoles }));
        } catch (_) {
            try { localStorage.setItem('pilotai_pending_idea', JSON.stringify({ idea, methodology, selectedRoles })); } catch (_) { /* silently ignore */ }
        }

        // Start loading simulation
        setIsAnalyzing(true);
        setLoadingStep(0);

        const t1 = setTimeout(() => setLoadingStep(1), 600);
        const t2 = setTimeout(() => setLoadingStep(2), 1400);
        const t3 = setTimeout(() => {
            setIsAnalyzing(false);
            setShowModal(true);
        }, 1900);

        timeoutsRef.current = [t1, t2, t3];
    }, [idea, methodology, selectedRoles, t, i18n.language]);

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');
    };

    return (
        <div className="bg-white min-h-screen font-sans antialiased overflow-x-hidden">

            {/* ── Navigation ── */}
            <nav className={cn(
                'fixed top-0 w-full z-50 transition-all duration-300',
                scrolled
                    ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm py-3'
                    : 'bg-transparent py-5'
            )}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">

                    {/* Logo */}
                    <div
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-500/30">
                            P
                        </div>
                        <span className="text-lg font-black text-slate-900 tracking-tight">PILOT AI</span>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleLanguage}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors"
                        >
                            <Globe size={13} />
                            {i18n.language.toUpperCase()}
                        </button>

                        <button
                            onClick={() => scrollToSection('pricing')}
                            className="hidden sm:block text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
                        >
                            {t('nav.pricing')}
                        </button>

                        <button
                            onClick={() => navigate('/academy')}
                            className="hidden sm:flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-semibold"
                        >
                            <GraduationCap size={15} />
                            Academy
                        </button>

                        <a
                            href="mailto:abadiarober@gmail.com"
                            className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
                        >
                            <Mail size={14} />
                            {t('nav.contact')}
                        </a>

                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
                        >
                            <LogIn size={14} />
                            {t('nav.login')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Hero + PLG Section ── */}
            <section className="min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 bg-gradient-to-b from-slate-50 to-white">
                <div className="w-full max-w-[960px] mx-auto">

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            {t('plg.title')}{' '}
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {t('plg.titleGradient')}
                            </span>
                        </h1>
                        <p className="mt-3 text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                            {t('plg.subtitle')}
                        </p>
                    </div>

                    {/* Input Card */}
                    <SmartIdeaInput
                        idea={idea}
                        setIdea={setIdea}
                        methodology={methodology}
                        setMethodology={setMethodology}
                        isAnalyzing={isAnalyzing}
                        loadingStep={loadingStep}
                        onAnalyze={handleAnalyze}
                        validationError={validationError}
                        setValidationError={setValidationError}
                        suggestedIdea={suggestedIdea}
                        setSuggestedIdea={setSuggestedIdea}
                        textareaRef={textareaRef}
                    />

                    {/* Role Cards Grid */}
                    <div className="mt-6">
                        {/* Instruction header */}
                        <div className="flex items-center justify-between px-1 mb-3">
                            <span className={cn(
                                'text-sm font-bold transition-colors',
                                selectedRoles.length === 2
                                    ? 'text-indigo-600'
                                    : 'text-slate-700'
                            )}>
                                {t('plg.roles.selectInstruction', 'Selecciona 2 roles y recibí análisis de expertos')}
                            </span>
                            <span className={cn(
                                'text-xs font-black px-2.5 py-1 rounded-full transition-all',
                                selectedRoles.length === 2
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-slate-100 text-slate-500'
                            )}>
                                {selectedRoles.length}/2
                            </span>
                        </div>

                        {selectedRoles.length === 2 && (
                            <p className="text-xs text-amber-600 font-medium mb-3">
                                {t('plg.maxRolesReached')}
                            </p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                            {LANDING_ROLES.map((role) => {
                                const isSelected = selectedRoles.includes(role.id);
                                const isMaxReached = selectedRoles.length >= 2 && !isSelected;
                                const c = role.color;

                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => toggleLandingRole(role.id)}
                                        disabled={isMaxReached}
                                        className={cn(
                                            'relative flex flex-col items-center text-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 select-none text-left w-full',
                                            isSelected
                                                ? `${c.border} ${c.bg} shadow-sm scale-[1.02]`
                                                : isMaxReached
                                                    ? 'border-slate-100 bg-slate-50/40 opacity-40 cursor-not-allowed'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                                        )}
                                    >
                                        {/* Selection indicator */}
                                        {isSelected ? (
                                            <span className={cn('absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm', c.dot.replace('bg-', 'bg-'))}>
                                                ✓
                                            </span>
                                        ) : (
                                            <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full border-2 border-slate-300" />
                                        )}

                                        {/* Icon */}
                                        <div className={cn(
                                            'w-11 h-11 rounded-xl flex items-center justify-center mt-1 transition-colors',
                                            isSelected ? `${c.iconBg} ${c.iconColor}` : 'bg-slate-100 text-slate-500'
                                        )}>
                                            {role.icon}
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 leading-tight">
                                                {t(`plg.roles.names.${role.id}`)}
                                            </p>
                                            <p className={cn(
                                                'text-[9px] font-bold uppercase tracking-wider mt-0.5',
                                                isSelected ? c.iconColor : 'text-slate-400'
                                            )}>
                                                {t(`plg.roles.subtitles.${role.id}`)}
                                            </p>
                                        </div>

                                        {/* Deliverable */}
                                        <p className="text-[10px] text-slate-400 mt-auto">
                                            {t('plg.roles.deliverable')}: {role.deliverables}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </section>

            {/* ── Features Section ── */}
            <div id="features">
                <React.Suspense fallback={<div className="bg-white py-24" />}>
                    <FeaturesGrid />
                </React.Suspense>
            </div>

            {/* ── Pricing Section ── */}
            <React.Suspense fallback={<div className="bg-slate-50/50 py-24" />}>
                <PricingSection />
            </React.Suspense>

            {/* ── Footer ── */}
            <footer className="bg-white py-16 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
                        {/* Logo + About */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                    <span className="font-black text-indigo-600 text-sm">P</span>
                                </div>
                                <span className="font-bold text-slate-900">PILOT AI</span>
                            </div>
                            <p className="text-sm text-slate-600 max-w-xs">
                                {t('footer.about')}
                            </p>
                        </div>

                        {/* Contact Links */}
                        <div className="flex flex-col gap-2">
                            <a href="mailto:abadiarober@gmail.com" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                                <Mail size={14} />
                                {t('footer.contact')}
                            </a>
                            <a href={t('footer.privacyLink')} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                                {t('footer.privacy')}
                            </a>
                            <a href={t('footer.termsLink')} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                                {t('footer.terms')}
                            </a>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="pt-8 border-t border-slate-100">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em] text-center">
                            © {new Date().getFullYear()} PILOT AI. {t('footer.rights')}
                        </p>
                    </div>
                </div>
            </footer>

            {/* ── PLG Paywall Modal ── */}
            <PLGModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
};

export default LandingPage;
