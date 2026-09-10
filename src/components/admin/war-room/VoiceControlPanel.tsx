import { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2, Zap, Languages } from 'lucide-react';
import { audioManager } from '../../../services/audioManager';
import { PlaybackState, Language } from '../../../types/voice';

interface VoiceControlPanelProps {
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

/**
 * Voice Control Panel for War Room
 * Provides playback controls and language selection
 */
export const VoiceControlPanel = ({ language, onLanguageChange }: VoiceControlPanelProps) => {
    const [state, setState] = useState<PlaybackState>(audioManager.getState());

    useEffect(() => {
        const unsubscribe = audioManager.onStateChange(setState);
        return unsubscribe;
    }, []);

    const handlePause = () => audioManager.pause();
    const handleResume = () => audioManager.resume();
    const handleStop = () => audioManager.stop();

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        audioManager.setVolume(Number(e.target.value));
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        audioManager.setSpeed(Number(e.target.value));
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    Voice Control
                </h3>

                {/* Language Selector */}
                <div className="flex gap-1 bg-black/40 rounded-md p-0.5">
                    <button
                        onClick={() => onLanguageChange('es')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${language === 'es'
                                ? 'bg-cyan-500 text-black'
                                : 'text-cyan-400 hover:bg-white/10'
                            }`}
                    >
                        ES
                    </button>
                    <button
                        onClick={() => onLanguageChange('en')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${language === 'en'
                                ? 'bg-cyan-500 text-black'
                                : 'text-cyan-400 hover:bg-white/10'
                            }`}
                    >
                        EN
                    </button>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="flex gap-2">
                {state.isPlaying && !state.isPaused ? (
                    <button
                        onClick={handlePause}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md text-[10px] font-bold border border-amber-500/30 transition-all"
                    >
                        <Pause className="w-3 h-3" />
                        PAUSE
                    </button>
                ) : state.isPaused ? (
                    <button
                        onClick={handleResume}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-md text-[10px] font-bold border border-emerald-500/30 transition-all"
                    >
                        <Play className="w-3 h-3" />
                        RESUME
                    </button>
                ) : (
                    <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-500 rounded-md text-[10px] font-bold border border-slate-600/30">
                        <Play className="w-3 h-3" />
                        READY
                    </div>
                )}

                <button
                    onClick={handleStop}
                    disabled={!state.isPlaying && !state.isPaused}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md text-[10px] font-bold border border-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Square className="w-3 h-3" />
                    STOP
                </button>
            </div>

            {/* Progress Bar */}
            {(state.isPlaying || state.isPaused) && (
                <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-cyan-400/60 font-mono">
                        <span>PROGRESS</span>
                        <span>{Math.round(state.progress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${state.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Volume Control */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-cyan-400/80 uppercase tracking-wider">
                        <Volume2 className="w-3 h-3" />
                        Volume
                    </label>
                    <span className="text-[9px] text-cyan-400 font-mono">{state.volume}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                />
            </div>

            {/* Speed Control */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-cyan-400/80 uppercase tracking-wider">
                        <Zap className="w-3 h-3" />
                        Speed
                    </label>
                    <span className="text-[9px] text-cyan-400 font-mono">{state.speed}x</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={state.speed}
                    onChange={handleSpeedChange}
                    className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                />
            </div>

            {/* Currently Speaking */}
            {state.currentRoleId && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-md p-2">
                    <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
                        Speaking Now
                    </div>
                    <div className="text-[10px] text-white font-medium">
                        {state.currentRoleId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </div>
                </div>
            )}

            {/* Queue Info */}
            {audioManager.getQueueLength() > 0 && (
                <div className="text-[9px] text-cyan-400/60 font-mono text-center">
                    {audioManager.getQueueLength()} in queue
                </div>
            )}
        </div>
    );
};
