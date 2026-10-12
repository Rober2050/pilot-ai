import { useTranslation } from 'react-i18next';
import { Play, Github, Users, FileDown, TerminalSquare } from 'lucide-react';
import { REPO_URL } from '../../constants/repo';

/**
 * Closing section of the landing page. Replaces the old PricingSection.
 *
 * PILOT AI is not sold: it is an internal tool that grew and is now open.
 * Pricing tiers, "coming soon" badges and the waitlist made the opposite
 * promise, so they were removed rather than left as dead ends. The hosted
 * demo is a recorded run, not a free trial, so the primary CTA plays the video.
 */

export function OpenSourceSection() {
    const { t } = useTranslation('landing');

    const facts = [
        { icon: Users, text: t('open.facts.roles') },
        { icon: FileDown, text: t('open.facts.exports') },
        { icon: TerminalSquare, text: t('open.facts.selfHost') },
    ];

    return (
        <section className="bg-slate-50 border-t border-slate-200 py-20 sm:py-24 px-4">
            <div className="max-w-3xl mx-auto text-center">
                <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-indigo-600 mb-4">
                    {t('open.eyebrow')}
                </span>

                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
                    {t('open.title')}
                </h2>

                <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                    {t('open.body')}
                </p>

                <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        type="button"
                        onClick={() => {
                            const demo = document.getElementById('demo');
                            demo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            demo?.querySelector('video')?.play().catch(() => { /* autoplay blocked: controls stay visible */ });
                        }}
                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors active:scale-95"
                    >
                        <Play className="w-4 h-4" aria-hidden="true" />
                        {t('open.ctaPrimary')}
                    </button>

                    <a
                        href={REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors active:scale-95"
                    >
                        <Github className="w-4 h-4" />
                        {t('open.ctaSecondary')}
                    </a>
                </div>

                <ul className="mt-12 grid sm:grid-cols-3 gap-5 sm:gap-8 text-left">
                    {facts.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-start gap-3">
                            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" aria-hidden="true" />
                            <span className="text-sm text-slate-600 leading-relaxed">{text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
