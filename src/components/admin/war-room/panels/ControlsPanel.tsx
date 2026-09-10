import { Play, Square, Sparkles, Trash2 } from 'lucide-react';

interface ControlsPanelProps {
    topic: string;
    isSimulating: boolean;
    isAnalyzing: boolean;
    transcriptLength: number;
    onTopicChange: (topic: string) => void;
    onStart: () => void;
    onStop: () => void;
    onAnalyze: () => void;
    onClear: () => void;
    language: 'es' | 'en';
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
    topic,
    isSimulating,
    isAnalyzing,
    transcriptLength,
    onTopicChange,
    onStart,
    onStop,
    onAnalyze,
    onClear,
    language
}) => {
    const isSpanish = language === 'es';

    return (
        <div className="p-6 space-y-6">
            {/* Topic Input */}
            <div>
                <label className="block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    {isSpanish ? 'Tema de Discusión' : 'Discussion Topic'}
                </label>
                <textarea
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                    placeholder={isSpanish
                        ? 'Describe el tema a discutir...'
                        : 'Describe the topic to discuss...'}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                    rows={4}
                    disabled={isSimulating}
                />
            </div>

            {/* Main Controls */}
            <div className="grid grid-cols-2 gap-3">
                {!isSimulating ? (
                    <button
                        onClick={onStart}
                        disabled={!topic.trim()}
                        className="col-span-2 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/30 transition-all font-bold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                    >
                        <Play className="w-5 h-5" />
                        {isSpanish ? 'Iniciar Reunión' : 'Start Meeting'}
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="col-span-2 flex items-center justify-center gap-2 px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl border border-red-500/30 transition-all font-bold text-sm uppercase tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                    >
                        <Square className="w-5 h-5" />
                        {isSpanish ? 'Detener' : 'Stop'}
                    </button>
                )}

                <button
                    onClick={onAnalyze}
                    disabled={transcriptLength === 0 || isAnalyzing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl border border-purple-500/30 transition-all font-bold text-xs uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles className="w-4 h-4" />
                    {isSpanish ? 'Veredicto' : 'Verdict'}
                </button>

                <button
                    onClick={onClear}
                    disabled={transcriptLength === 0}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-xl border border-orange-500/30 transition-all font-bold text-xs uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-4 h-4" />
                    {isSpanish ? 'Limpiar' : 'Clear'}
                </button>
            </div>

            {/* Status */}
            {transcriptLength > 0 && (
                <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-400">
                        {isSpanish ? 'Mensajes' : 'Messages'}: <span className="text-cyan-400 font-mono">{transcriptLength}</span>
                    </p>
                </div>
            )}
        </div>
    );
};
