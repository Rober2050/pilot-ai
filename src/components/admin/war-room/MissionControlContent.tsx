import { RoleConfig } from '../../../types/roles';
import { Play, Square, Trash2, BarChart3, Download, Target, Zap, Volume2 } from 'lucide-react';

interface MissionControlContentProps {
    roles: RoleConfig[];
    selectedRoleIds: string[];
    topic: string;
    isSimulating: boolean;
    isAnalyzing: boolean;
    ttsEnabled: boolean;
    roundCount: number;
    maxRounds: number;
    maxWords: number;
    totalTokens: number;
    estimatedCost: number;
    transcriptLength: number;
    decisionResult: any;
    onToggleRole: (roleId: string) => void;
    onTopicChange: (topic: string) => void;
    onStart: () => void;
    onStop: () => void;
    onClear: () => void;
    onAnalyze: () => void;
    onDownload: () => void;
    onToggleTts: (enabled: boolean) => void;
    onMaxRoundsChange: (rounds: number) => void;
    onMaxWordsChange: (words: number) => void;
}

/**
 * Mission Control Content (for sidebar)
 * Agent selection, mission config, and round counter
 */
export const MissionControlContent = ({
    roles,
    selectedRoleIds,
    topic,
    isSimulating,
    isAnalyzing,
    ttsEnabled,
    roundCount,
    maxRounds,
    maxWords,
    totalTokens,
    estimatedCost,
    transcriptLength,
    decisionResult,
    onToggleRole,
    onTopicChange,
    onStart,
    onStop,
    onClear,
    onAnalyze,
    onDownload,
    onToggleTts,
    onMaxRoundsChange,
    onMaxWordsChange
}: MissionControlContentProps) => {
    return (
        <div className="p-6 space-y-6">
            {/* Round Counter - PROMINENT */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Round Progress
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">
                        {roundCount}/{maxRounds}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${(roundCount / maxRounds) * 100}%` }}
                    />
                </div>

                {/* Round Config */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider">
                        Max Rounds
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="3"
                            max="20"
                            value={maxRounds}
                            onChange={(e) => onMaxRoundsChange(Number(e.target.value))}
                            disabled={isSimulating}
                            className="flex-1 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                        />
                        <span className="text-xs font-mono text-cyan-400 w-8 text-right">{maxRounds}</span>
                    </div>
                </div>
            </div>

            {/* Mission Topic */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider">
                    Mission Objective
                </label>
                <textarea
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                    placeholder="Enter mission objective..."
                    disabled={isSimulating}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
            </div>

            {/* Agent Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider">
                        Select Agents ({selectedRoleIds.length}/5)
                    </label>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {roles.map(role => (
                        <button
                            key={role.roleId}
                            onClick={() => onToggleRole(role.roleId)}
                            disabled={isSimulating}
                            className={`
                w-full px-3 py-2 rounded-lg text-left text-xs font-medium transition-all
                ${selectedRoleIds.includes(role.roleId)
                                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                    : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${selectedRoleIds.includes(role.roleId) ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                {role.displayName}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Control Buttons */}
            <div className="space-y-2">
                {!isSimulating ? (
                    <button
                        onClick={onStart}
                        disabled={!topic || selectedRoleIds.length < 2}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700"
                    >
                        <Play className="w-4 h-4" />
                        START MISSION
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg"
                    >
                        <Square className="w-4 h-4" />
                        STOP MISSION
                    </button>
                )}

                <button
                    onClick={onClear}
                    disabled={transcriptLength === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-lg font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    CLEAR
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Tokens</div>
                    <div className="text-lg font-bold text-white font-mono">{totalTokens}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cost</div>
                    <div className="text-lg font-bold text-white font-mono">${estimatedCost.toFixed(4)}</div>
                </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3 pt-3 border-t border-slate-700">
                <div className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider">
                    Advanced Settings
                </div>

                {/* Max Words */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Max Words
                        </label>
                        <span className="text-xs font-mono text-cyan-400">{maxWords}</span>
                    </div>
                    <input
                        type="range"
                        min="50"
                        max="300"
                        step="25"
                        value={maxWords}
                        onChange={(e) => onMaxWordsChange(Number(e.target.value))}
                        disabled={isSimulating}
                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500"
                    />
                </div>

                {/* TTS Toggle */}
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Volume2 className="w-3 h-3" />
                        Voice Enabled
                    </span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={ttsEnabled}
                            onChange={(e) => onToggleTts(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                    </div>
                </label>
            </div>

            {/* Analysis Section */}
            {transcriptLength > 2 && (
                <div className="space-y-2 pt-3 border-t border-slate-700">
                    <button
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        {isAnalyzing ? 'ANALYZING...' : 'ANALYZE SESSION'}
                    </button>

                    {decisionResult && (
                        <button
                            onClick={onDownload}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold text-xs transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            DOWNLOAD REPORT
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
