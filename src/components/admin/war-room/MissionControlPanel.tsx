import React from 'react';
import { Settings, Play, Square, Gavel, Trash2, Download, Volume2, MicOff, Edit3, X, Zap, Globe, Sliders } from 'lucide-react';
import { RoleConfig } from '../../../types/roles';
import { DecisionResult } from '../../../services/ai/decisionEngine';

interface MissionControlPanelProps {
    roles: RoleConfig[];
    selectedRoleIds: string[];
    roleInstructions: Record<string, string>;
    topic: string;
    isSimulating: boolean;
    isAnalyzing: boolean;
    ttsEnabled: boolean;
    decisionResult?: DecisionResult | null;
    transcriptLength: number;
    maxWords: number;
    language: 'en' | 'es';

    onToggleRole: (id: string) => void;
    onInstructionChange: (id: string, text: string) => void;
    onRemoveRole: (id: string) => void;
    onTopicChange: (text: string) => void;
    onStart: () => void;
    onStop: () => void;
    onClear: () => void;
    onAnalyze: () => void;
    onDownload: () => void;
    onToggleTts: (enabled: boolean) => void;
    onMaxWordsChange: (val: number) => void;
    onLanguageChange: (lang: 'en' | 'es') => void;
}

export const MissionControlPanel: React.FC<MissionControlPanelProps> = ({
    roles,
    selectedRoleIds,
    roleInstructions,
    topic,
    isSimulating,
    isAnalyzing,
    ttsEnabled,
    decisionResult,
    transcriptLength,
    maxWords,
    language,
    onToggleRole,
    onInstructionChange,
    onRemoveRole,
    onTopicChange,
    onStart,
    onStop,
    onClear,
    onAnalyze,
    onDownload,
    onToggleTts,
    onMaxWordsChange,
    onLanguageChange
}) => {

    const t = (key: string) => {
        const dict: any = {
            'en': {
                'ops_center': 'OPS CENTER',
                'active_agents': 'ACTIVE AGENTS',
                'prime_directive': 'PRIME DIRECTIVE',
                'resume': 'RESUME OP',
                'initiate': 'INITIATE',
                'pause': 'PAUSE STREAM',
                'verdict': 'VERDICT',
                'purge': 'PURGE',
                'export': 'EXPORT INTEL',
                'voice_on': 'VOICE ON',
                'muted': 'MUTED',
                'word_limit': 'WORD LIMIT',
                'language': 'LANGUAGE'
            },
            'es': {
                'ops_center': 'CENTRO DE OPERACIONES',
                'active_agents': 'AGENTES ACTIVOS',
                'prime_directive': 'DIRECTIVA PRINCIPAL',
                'resume': 'REANUDAR',
                'initiate': 'INICIAR',
                'pause': 'PAUSAR',
                'verdict': 'VEREDICTO',
                'purge': 'PURGAR',
                'export': 'EXPORTAR',
                'voice_on': 'VOZ ACTIVA',
                'muted': 'SILENCIO',
                'word_limit': 'LIMITE PALABRAS',
                'language': 'IDIOMA'
            }
        };
        return dict[language][key] || key;
    };

    return (
        <div className="flex flex-col h-full text-slate-100">
            {/* Toolbar Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] shadow-cyan-500/50">
                    <Settings className="w-3.5 h-3.5" /> {t('ops_center')}
                </div>

                {/* Language & Audio Controls */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${language === 'es' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-white/5 text-slate-400 border-white/10'}`}
                    >
                        <Globe className="w-3 h-3" />
                        {language.toUpperCase()}
                    </button>
                    <button
                        onClick={() => onToggleTts(!ttsEnabled)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${ttsEnabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-white/5 text-slate-400 border-white/10'}`}
                    >
                        {ttsEnabled ? <Volume2 className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                        {ttsEnabled ? t('voice_on') : t('muted')}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">

                {/* 1. Global Actions */}
                <div className="grid grid-cols-2 gap-2">
                    {!isSimulating ? (
                        <button
                            onClick={onStart}
                            className="col-span-2 group relative flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-3 py-2.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 border border-white/10 text-xs tracking-wider"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            {transcriptLength > 0 ? t('resume') : t('initiate')}
                        </button>
                    ) : (
                        <button
                            onClick={onStop}
                            className="col-span-2 flex items-center justify-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 px-3 py-2.5 rounded-lg font-bold transition-all animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)] text-xs tracking-wider"
                        >
                            <Square className="w-3.5 h-3.5 fill-current" /> {t('pause')}
                        </button>
                    )}

                    <button
                        onClick={onAnalyze}
                        disabled={isAnalyzing || transcriptLength < 3}
                        className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 py-2 rounded text-[9px] font-bold disabled:opacity-30 transition-all uppercase tracking-wider"
                    >
                        <Gavel className="w-3 h-3" /> {t('verdict')}
                    </button>
                    <button
                        onClick={onClear}
                        className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 py-2 rounded text-[9px] font-bold transition-all uppercase tracking-wider"
                    >
                        <Trash2 className="w-3 h-3" /> {t('purge')}
                    </button>
                    {decisionResult && (
                        <button
                            onClick={onDownload}
                            className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded font-bold transition-all shadow-md uppercase text-[10px]"
                        >
                            <Download className="w-3.5 h-3.5" /> {t('export')}
                        </button>
                    )}
                </div>

                {/* 2. Config Bars (Word Limit) */}
                <div className="bg-black/20 p-2 rounded border border-white/5">
                    <div className="flex justify-between text-[9px] uppercase font-bold text-slate-500 mb-1">
                        <span className="flex items-center gap-1"><Sliders className="w-3 h-3" /> {t('word_limit')}</span>
                        <span className="text-cyan-400">{maxWords}</span>
                    </div>
                    <input
                        type="range"
                        min="50"
                        max="300"
                        step="10"
                        value={maxWords}
                        onChange={(e) => onMaxWordsChange(Number(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                    />
                </div>

                {/* 3. Squad Builder */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            {t('active_agents')} ({selectedRoleIds.length}/4)
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                        {roles.map(role => {
                            const isSelected = selectedRoleIds.includes(role.roleId);
                            return (
                                <div
                                    key={role.roleId}
                                    onClick={() => onToggleRole(role.roleId)}
                                    className={`
                                        relative group rounded border px-2 py-2 transition-all duration-200 cursor-pointer
                                        ${isSelected
                                            ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 opacity-60 hover:opacity-100'
                                        }
                                    `}
                                >
                                    {/* Header Row */}
                                    <div className="flex items-center gap-2">
                                        <div className={`
                                            w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all
                                            ${isSelected
                                                ? 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]'
                                                : 'bg-slate-600'}
                                        `}></div>

                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                                {role.displayName}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemoveRole(role.roleId); }}
                                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="mt-1.5 pt-1.5 border-t border-white/5 animate-in slide-in-from-top-1">
                                            <div className="relative group/input">
                                                <Zap className="w-2.5 h-2.5 absolute top-1.5 left-1.5 text-indigo-400 opacity-50" />
                                                <input
                                                    type="text"
                                                    placeholder={language === 'es' ? "Personalidad..." : "Behavior..."}
                                                    value={roleInstructions[role.roleId] || ''}
                                                    onChange={(e) => onInstructionChange(role.roleId, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full pl-6 pr-2 py-1 text-[10px] bg-black/20 border border-white/5 rounded text-indigo-300 placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-black/40 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 4. Mission Input */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('prime_directive')}</h4>
                    <textarea
                        value={topic}
                        onChange={(e) => onTopicChange(e.target.value)}
                        placeholder="Define mission parameters..."
                        className="w-full h-full min-h-[60px] p-2 rounded border border-white/10 bg-black/20 text-slate-300 text-[11px] focus:bg-black/40 focus:border-cyan-500/50 outline-none resize-none transition-all placeholder:text-slate-600 font-mono"
                    />
                </div>

            </div>
        </div>
    );
};
