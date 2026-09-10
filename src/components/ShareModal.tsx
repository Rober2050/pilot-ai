import React, { useState } from 'react';
import { X, Check, Copy, Share2, Loader2, Globe } from 'lucide-react';
import { projectsService } from '../services/firebase/projectsService';
import { useTranslation } from 'react-i18next';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
}

export default function ShareModal({ isOpen, onClose, projectId }: ShareModalProps) {
    const { t } = useTranslation('common');
    const [isLoading, setIsLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerateLink = async () => {
        if (!projectId) return;
        setIsLoading(true);
        setError(null);
        try {
            const project = await projectsService.getProjectById(projectId);
            if (!project) throw new Error('Project not found');

            const snapshotId = await projectsService.createPublicSnapshot(projectId, project.blueprint);
            const url = `${window.location.origin}/pitch/${snapshotId}`;
            setShareUrl(url);
        } catch (err) {
            console.error('Share error:', err);
            setError(t('shareModal.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Share2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">{t('shareModal.title')}</h3>
                            <p className="text-xs text-slate-500">{t('shareModal.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {!shareUrl ? (
                        <div className="text-center py-4">
                            <Globe size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-sm text-slate-600 mb-6">
                                {t('shareModal.description')}
                            </p>
                            <button
                                onClick={handleGenerateLink}
                                disabled={isLoading || !projectId}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                                {isLoading ? t('shareModal.buttonGenerating') : t('shareModal.buttonCreate')}
                            </button>
                            {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-sm font-semibold text-slate-700 mb-2">{t('shareModal.readyStatus')}</p>
                            <div className="flex items-center gap-2 p-1 pl-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-xs text-slate-600 truncate flex-1 font-mono">{shareUrl}</span>
                                <button
                                    onClick={handleCopy}
                                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors ${copied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-800 hover:bg-slate-900'}`}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? t('shareModal.buttonCopied') : t('shareModal.buttonCopy')}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-4 text-center">
                                {t('shareModal.footerNote')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
