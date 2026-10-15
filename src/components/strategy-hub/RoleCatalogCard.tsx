import React from 'react';
import { Loader2, Play, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import type { RoleColor } from './roleCatalog';

export type RoleCardStatus = 'disabled' | 'completed' | 'processing' | 'error' | 'active' | 'pending';

interface RoleCatalogCardProps {
    title: string;
    subtitle: string;
    deliverable: string;
    icon: React.ReactElement;
    color: RoleColor;
    status: RoleCardStatus;
    /** The role is part of the selected team. */
    isActive: boolean;
    /** A project is loaded, so the role can run. */
    canRun: boolean;
    /** Auto Flow runs roles by itself; the manual Run button hides. */
    autoFlow: boolean;
    onSelect: () => void;
    onRun: () => void;
}

/** One card of the "build your team" catalog in Strategy Hub. */
export function RoleCatalogCard({
    title, subtitle, deliverable, icon, color, status, isActive, canRun, autoFlow, onSelect, onRun,
}: RoleCatalogCardProps) {
    const { t } = useTranslation('translation');
    const isProcessing = status === 'processing';
    const isCompleted = status === 'completed';
    const isError = status === 'error';

    return (
        <div
            onClick={onSelect}
            className={cn(
                "group relative flex flex-col items-center text-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 select-none cursor-pointer",
                isActive
                    ? `${color.border} ${color.bg} shadow-md`
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
            )}
        >
            {/* Active dot */}
            {isActive && (
                <span className={cn("absolute top-2.5 right-2.5 w-2 h-2 rounded-full", color.dot)} />
            )}

            {/* Processing spinner */}
            {isProcessing && (
                <span className="absolute top-2.5 left-2.5">
                    <Loader2 size={11} className="text-blue-500 animate-spin" />
                </span>
            )}

            {/* Completed check + re-run on hover */}
            {isCompleted && (
                <>
                    <span className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </span>
                    {canRun && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRun(); }}
                            title={t('strategyHub.card.rerun')}
                            aria-label={t('strategyHub.card.rerun')}
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-150 w-5 h-5 rounded-full bg-slate-700 hover:bg-indigo-600 flex items-center justify-center shadow-md"
                        >
                            <RotateCcw size={9} className="text-white" />
                        </button>
                    )}
                </>
            )}

            {/* Error indicator */}
            {isError && (
                <span className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
            )}

            {/* Icon */}
            <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                isActive ? `${color.bg} ${color.icon}` : 'bg-slate-100 text-slate-400'
            )}>
                {React.cloneElement(icon, { size: 22 })}
            </div>

            {/* Name + subtitle */}
            <div>
                <p className={cn("text-[12px] font-bold leading-tight", isActive ? 'text-slate-800' : 'text-slate-500')}>
                    {title}
                </p>
                <p className={cn("text-[9px] font-semibold uppercase tracking-wider mt-0.5", isActive ? color.icon : 'text-slate-300')}>
                    {subtitle}
                </p>
            </div>

            {/* Deliverable */}
            <p className="text-[9px] text-slate-400 leading-tight">
                {t('strategyHub.card.deliverable', { deliverable })}
            </p>

            {/* Run button — manual mode, active, project loaded */}
            {!autoFlow && isActive && canRun && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isProcessing) onRun();
                    }}
                    disabled={isProcessing}
                    title={isProcessing ? t('strategyHub.card.alreadyRunning', { role: title }) : undefined}
                    className={cn(
                        "w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-semibold transition-all",
                        isProcessing
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                            : 'bg-white/60 hover:bg-white text-slate-600 border border-slate-200'
                    )}
                >
                    {isProcessing
                        ? <><Loader2 size={9} className="animate-spin" /> {t('strategyHub.card.running')}</>
                        : <><Play size={9} fill="currentColor" /> {t('strategyHub.card.run')}</>
                    }
                </button>
            )}
        </div>
    );
}
