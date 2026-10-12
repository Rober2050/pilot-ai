import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Globe, LogIn, Mail, GraduationCap,
    TrendingUp, Package, BarChart2, Briefcase,
    Palette, Server, Layout, Shield, Cloud,
    Play, Github,
} from 'lucide-react';
import { REPO_URL } from '../constants/repo';
import { cn } from '../lib/utils';

// ─── Below-the-fold sections — code-split so they don't block initial paint ───
const FeaturesGrid = React.lazy(() =>
    import('../components/landing/FeaturesGrid').then(m => ({ default: m.FeaturesGrid }))
);
const OpenSourceSection = React.lazy(() =>
    import('../components/landing/OpenSourceSection').then(m => ({ default: m.OpenSourceSection }))
);

// ─── Constants ────────────────────────────────────────────────────────────────

// The hosted demo is a showcase, not a free trial: visitors watch a real run
// (public/demo) instead of spending the owner's AI budget.
const DEMO_VIDEO_MP4 = '/demo/pilot-ai-demo.mp4';
const DEMO_VIDEO_POSTER = '/demo/pilot-ai-demo-poster.jpg';

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
    {
        id: 'devops-engineer',
        icon: <Cloud size={22} />,
        color: { border: 'border-sky-200', bg: 'bg-sky-50', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', dot: 'bg-sky-400', tag: 'bg-sky-100', tagText: 'text-sky-700' },
        deliverables: 'DOC / PPT',
    },
];

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

    const playDemo = () => {
        const demo = document.getElementById('demo');
        demo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        demo?.querySelector('video')?.play().catch(() => { /* autoplay blocked: controls stay visible */ });
    };

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
                            onClick={() => scrollToSection('open-source')}
                            className="hidden sm:block text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
                        >
                            {t('nav.openSource')}
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

                    {/* Demo video — a recorded real run instead of a live free trial */}
                    <div id="demo" className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xl shadow-slate-900/10 aspect-video">
                        <video
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                            preload="none"
                            poster={DEMO_VIDEO_POSTER}
                            aria-label={t('demo.caption')}
                        >
                            <source src={DEMO_VIDEO_MP4} type="video/mp4" />
                            {t('demo.videoUnsupported')}
                        </video>
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-bold text-slate-700 pointer-events-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                            {t('demo.label')}
                        </span>
                    </div>
                    <p className="mt-3 text-center text-sm text-slate-500">{t('demo.caption')}</p>

                    {/* CTAs */}
                    <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={playDemo}
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors active:scale-95"
                        >
                            <Play className="w-4 h-4" aria-hidden="true" />
                            {t('demo.ctaWatch')}
                        </button>
                        <a
                            href={REPO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors active:scale-95"
                        >
                            <Github className="w-4 h-4" aria-hidden="true" />
                            {t('demo.ctaCode')}
                        </a>
                    </div>

                    {/* The team — display only */}
                    <div className="mt-12">
                        <p className="text-center text-xs font-semibold tracking-[0.18em] uppercase text-slate-400 mb-4">
                            {t('demo.teamLabel')}
                        </p>
                        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {LANDING_ROLES.map((role) => (
                                <li
                                    key={role.id}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white"
                                >
                                    <span className={cn('w-9 h-9 shrink-0 rounded-lg flex items-center justify-center', role.color.iconBg, role.color.iconColor)}>
                                        {role.icon}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-xs font-bold text-slate-800 leading-tight">
                                            {t(`plg.roles.names.${role.id}`)}
                                        </span>
                                        <span className={cn('block text-[9px] font-bold uppercase tracking-wider mt-0.5', role.color.iconColor)}>
                                            {t(`plg.roles.subtitles.${role.id}`)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </section>

            {/* ── Features Section ── */}
            <div id="features">
                <React.Suspense fallback={<div className="bg-white py-24" />}>
                    <FeaturesGrid />
                </React.Suspense>
            </div>

            {/* ── Open Source Section ── */}
            <div id="open-source">
                <React.Suspense fallback={<div className="bg-slate-50 py-24" />}>
                    <OpenSourceSection />
                </React.Suspense>
            </div>

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
        </div>
    );
};

export default LandingPage;
