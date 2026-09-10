import { PlaybackState } from '../../../types/voice';
import { Play, Pause, Square, Volume2, Zap } from 'lucide-react';

interface VoiceControlContentProps {
    state: PlaybackState;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onVolumeChange: (volume: number) => void;
    onSpeedChange: (speed: number) => void;
    queueLength: number;
}

/**
 * Voice Control Content (for sidebar)
 * Simplified version without language selector (moved to sidebar)
 */
export const VoiceControlContent = ({
    state,
    onPause,
    onResume,
    onStop,
    onVolumeChange,
    onSpeedChange,
    queueLength
}: VoiceControlContentProps) => {
    return (
        <div className="p-6 space-y-4">
            {/* Playback Controls */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider">Playback</h3>

                <div className="flex gap-2">
                    {state.isPlaying && !state.isPaused ? (
                        <button
                            onClick={onPause}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/30 transition-all"
                        >
                            <Pause className="w-4 h-4" />
                            PAUSE
                        </button>
                    ) : state.isPaused ? (
                        <button
                            onClick={onResume}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30 transition-all"
                        >
                            <Play className="w-4 h-4" />
                            RESUME
                        </button>
                    ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-500 rounded-lg text-xs font-bold border border-slate-600/30">
                            <Play className="w-4 h-4" />
                            READY
                        </div>
                    )}

                    <button
                        onClick={onStop}
                        disabled={!state.isPlaying && !state.isPaused}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold border border-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Square className="w-4 h-4" />
                        STOP
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {(state.isPlaying || state.isPaused) && (
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-cyan-400/60 font-mono">
                        <span>PROGRESS</span>
                        <span>{Math.round(state.progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${state.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Volume Control */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider">
                        <Volume2 className="w-3.5 h-3.5" />
                        Volume
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">{state.volume}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.6)] [&::-webkit-slider-thumb]:cursor-pointer"
                />
            </div>

            {/* Speed Control */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5" />
                        Speed
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">{state.speed}x</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={state.speed}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(99,102,241,0.6)] [&::-webkit-slider-thumb]:cursor-pointer"
                />
            </div>

            {/* Currently Speaking */}
            {state.currentRoleId && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                        Speaking Now
                    </div>
                    <div className="text-xs text-white font-medium">
                        {state.currentRoleId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </div>
                </div>
            )}

            {/* Queue Info */}
            {queueLength > 0 && (
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                        <span className="text-[10px] text-indigo-400 font-mono font-bold">
                            {queueLength} in queue
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
