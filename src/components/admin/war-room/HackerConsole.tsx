/**
 * HackerConsole - Terminal-style UI para mostrar logs de streaming
 * 
 * UX: Transparencia total del pensamiento de los agentes
 */

import React, { useEffect, useRef } from 'react';
import { LogEvent } from '../../../types/streaming';
import { useTranslation } from 'react-i18next';

interface HackerConsoleProps {
    logs: LogEvent[];
    isVisible: boolean;
    onToggle: () => void;
    onClear?: () => void; // ✅ NEW: Clear logs callback
}

export const HackerConsole: React.FC<HackerConsoleProps> = ({
    logs,
    isVisible,
    onToggle,
    onClear // ✅ NEW
}) => {
    const consoleRef = useRef<HTMLDivElement>(null);
    const { i18n } = useTranslation('translation');
    const isSpanish = i18n.language?.startsWith('es');

    // Auto-scroll al último log
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [logs]);

    const getLogColor = (type: LogEvent['type']) => {
        switch (type) {
            case 'thinking': return 'text-cyan-400';
            case 'action': return 'text-green-400';
            case 'result': return 'text-yellow-400';
            default: return 'text-slate-400';
        }
    };

    const getLogIcon = (type: LogEvent['type']) => {
        switch (type) {
            case 'thinking': return '🧠';
            case 'action': return '⚡';
            case 'result': return '✓';
            default: return '•';
        }
    };

    if (!isVisible) {
        return (
            <button
                onClick={onToggle}
                className="fixed bottom-4 right-4 bg-slate-900 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors z-50"
            >
                <span className="font-mono text-sm">{'> '} {isSpanish ? 'Mostrar Consola' : 'Show Console'}</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-0 right-0 w-full md:w-2/3 lg:w-1/2 h-64 bg-slate-950 border-t border-l border-cyan-500/30 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-cyan-500/30">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-mono text-xs text-cyan-400">
                        {isSpanish ? 'Consola PILOT AI' : 'PILOT AI Console'}
                    </span>
                </div>
                <button
                    onClick={onToggle}
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Console Body */}
            <div
                ref={consoleRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1"
            >
                {logs.length === 0 ? (
                    <div className="text-slate-600 italic">
                        {isSpanish ? 'Esperando actividad...' : 'Waiting for activity...'}
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <span className="text-slate-600 select-none">
                                {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </span>
                            <span className="select-none">{getLogIcon(log.type)}</span>
                            <span className={`${getLogColor(log.type)} flex-1`}>
                                [{log.agentId}] {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-900 border-t border-cyan-500/30 flex items-center justify-between">
                <span className="font-mono text-xs text-slate-600">
                    {logs.length} {isSpanish ? 'eventos' : 'events'}
                </span>
                <button
                    onClick={() => onClear?.()}
                    className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                >
                    {isSpanish ? 'Limpiar' : 'Clear'}
                </button>
            </div>
        </div>
    );
};
