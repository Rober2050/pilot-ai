import { X, ShieldCheck, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProviderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Explains where AI credentials live. There is nothing to configure here on
 * purpose: provider keys never reach the browser or the database. The only key
 * is ANTHROPIC_API_KEY, a Supabase Edge Function secret used by anthropic-proxy.
 * (After the 2026 key-theft incident, no key may live in a VITE_* variable.)
 */
export default function ProviderSettingsModal({ isOpen, onClose }: ProviderSettingsModalProps) {
    const { t } = useTranslation('admin');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="provider-settings-title">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 id="provider-settings-title" className="text-xl font-bold text-slate-900">{t('providerSettings.title')}</h3>
                        <p className="text-sm text-slate-500">{t('providerSettings.subtitle')}</p>
                    </div>
                    <button onClick={onClose} aria-label={t('providerSettings.close')} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4 text-sm text-slate-700">
                    <div className="flex gap-3 p-4 rounded-xl border border-slate-200">
                        <Server className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-slate-900">{t('providerSettings.proxyTitle')}</p>
                            <p className="mt-1">{t('providerSettings.proxyBody')}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 p-4 rounded-xl border border-slate-200">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-slate-900">{t('providerSettings.keyTitle')}</p>
                            <p className="mt-1">{t('providerSettings.keyBody')}</p>
                            <code className="mt-2 block rounded-lg bg-slate-900 text-slate-100 px-3 py-2 text-xs">
                                npx supabase secrets set ANTHROPIC_API_KEY=...
                            </code>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="btn-secondary">
                        {t('providerSettings.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
