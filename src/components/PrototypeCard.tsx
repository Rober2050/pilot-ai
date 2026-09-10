import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, X, ExternalLink, Monitor, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface PrototypeCardProps {
    html: string;
}

export const PrototypeCard: React.FC<PrototypeCardProps> = ({ html }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setVisible(true);
                    obs.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!visible) return;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [html, visible]);

    const openNewTab = () => {
        if (!html) return;

        // Attempt 1: Use data URL (more compatible than blob URL)
        try {
            const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
            const opened = window.open(dataUrl, '_blank');
            if (opened) return;
        } catch (e) {
            console.warn('Data URL approach failed:', e);
        }

        // Attempt 2: Fallback to blob URL if data URL fails
        if (blobUrl) {
            const opened = window.open(blobUrl, '_blank');
            if (opened) return;
        }

        // Attempt 3: If popup blocked, try creating a temporary form submit
        try {
            const form = document.createElement('form');
            form.method = 'post';
            form.action = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
            form.target = '_blank';
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        } catch (e) {
            console.error('All methods to open prototype failed:', e);
            alert('Could not open prototype in new tab. Your browser may have blocked it.');
        }
    };

    return (
        <>
            <div
                ref={cardRef}
                className="my-6 rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white"
            >
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-xs text-slate-400 font-medium ml-2 flex items-center gap-1.5">
                            <Monitor size={11} />
                            Interactive Prototype
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFullscreen(true)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
                        >
                            <Maximize2 size={11} />
                            Expand
                        </button>
                        <button
                            onClick={openNewTab}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <ExternalLink size={11} />
                            Open
                        </button>
                    </div>
                </div>

                {/* Mini preview */}
                <div className="relative w-full bg-slate-50" style={{ height: '420px' }}>
                    {!iframeLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-slate-400 font-medium">Loading prototype…</span>
                        </div>
                    )}
                    {blobUrl && (
                        <iframe
                            src={blobUrl}
                            className={cn(
                                'w-full h-full border-0 transition-opacity duration-300',
                                iframeLoaded ? 'opacity-100' : 'opacity-0'
                            )}
                            title="Prototype Preview"
                            sandbox="allow-scripts allow-same-origin"
                            onLoad={() => setIframeLoaded(true)}
                        />
                    )}
                </div>
            </div>

            {/* Fullscreen modal */}
            {fullscreen && blobUrl && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
                        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                            <Globe size={14} className="text-indigo-400" />
                            Interactive Prototype — Full Screen
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={openNewTab}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 transition-colors"
                            >
                                <ExternalLink size={11} />
                                New Tab
                            </button>
                            <button
                                onClick={() => setFullscreen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <iframe
                        src={blobUrl}
                        className="flex-1 border-0 w-full"
                        title="Prototype Fullscreen"
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            )}
        </>
    );
};
