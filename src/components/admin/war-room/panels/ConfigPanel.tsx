import { Volume2 } from 'lucide-react';

interface ConfigPanelProps {
    maxRounds: number;
    maxWords: number;
    ttsEnabled: boolean;
    onMaxRoundsChange: (rounds: number) => void;
    onMaxWordsChange: (words: number) => void;
    onToggleTts: (enabled: boolean) => void;
    language: 'es' | 'en';
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
    maxRounds,
    maxWords,
    ttsEnabled,
    onMaxRoundsChange,
    onMaxWordsChange,
    onToggleTts,
    language
}) => {
    const isSpanish = language === 'es';

    return (
        <div className="p-6 space-y-6">
            {/* Max Rounds */}
            <div>
                <label className="block text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
                    {isSpanish ? 'Rondas Máximas' : 'Max Rounds'}
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={maxRounds}
                        onChange={(e) => onMaxRoundsChange(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.6)] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="text-cyan-400 font-mono font-bold text-lg min-w-[3ch] text-right">
                        {maxRounds}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    {isSpanish
                        ? 'Número de rondas de conversación'
                        : 'Number of conversation rounds'}
                </p>
            </div>

            {/* Max Words */}
            <div>
                <label className="block text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
                    {isSpanish ? 'Límite de Palabras' : 'Word Limit'}
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="50"
                        max="300"
                        step="10"
                        value={maxWords}
                        onChange={(e) => onMaxWordsChange(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.6)] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="text-purple-400 font-mono font-bold text-lg min-w-[4ch] text-right">
                        {maxWords}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    {isSpanish
                        ? 'Máximo de palabras por mensaje'
                        : 'Maximum words per message'}
                </p>
            </div>

            {/* TTS Toggle */}
            <div>
                <label className="block text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
                    {isSpanish ? 'Síntesis de Voz' : 'Text-to-Speech'}
                </label>
                <button
                    onClick={() => onToggleTts(!ttsEnabled)}
                    className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
                        ${ttsEnabled
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5" />
                        <span className="font-medium text-sm">
                            {isSpanish ? 'Voz Activa' : 'Voice Active'}
                        </span>
                    </div>
                    <div className={`
                        w-12 h-6 rounded-full relative transition-all
                        ${ttsEnabled ? 'bg-emerald-500/50' : 'bg-slate-700'}
                    `}>
                        <div className={`
                            absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                            ${ttsEnabled ? 'left-7' : 'left-1'}
                        `} />
                    </div>
                </button>
                <p className="text-xs text-slate-500 mt-2">
                    {isSpanish
                        ? 'Activar síntesis de voz automática'
                        : 'Enable automatic text-to-speech'}
                </p>
            </div>
        </div>
    );
};
