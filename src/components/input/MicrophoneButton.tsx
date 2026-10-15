import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MicrophoneButtonProps {
    onTranscription: (text: string) => void;
    onError: (error: Error) => void;
    disabled?: boolean;
    variant?: 'dark' | 'light';
}

/**
 * Voice dictation with the browser's own speech recognition (Web Speech API).
 *
 * Why not the AI: Claude does not accept audio input. Sending a recording and
 * asking it to "transcribe" makes it invent text, so dictation stays in the
 * browser (Chrome, Edge, Safari). Where the API is missing, the button hides.
 */
type SpeechRecognitionLike = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

const getSpeechRecognition = (): (new () => SpeechRecognitionLike) | null => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export function MicrophoneButton({
    onTranscription,
    onError,
    disabled = false,
    variant = 'dark'
}: MicrophoneButtonProps) {
    const { t, i18n } = useTranslation('translation');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const transcriptRef = useRef('');

    const Recognition = getSpeechRecognition();

    useEffect(() => () => recognitionRef.current?.stop(), []);

    if (!Recognition) return null;

    const startRecording = () => {
        try {
            const recognition = new Recognition();
            recognition.lang = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR';
            recognition.continuous = true;
            recognition.interimResults = false;
            transcriptRef.current = '';

            recognition.onresult = (event: any) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcriptRef.current += `${event.results[i][0].transcript} `;
                    }
                }
            };
            recognition.onerror = (event: any) => {
                console.error('[MicrophoneButton] Speech recognition error:', event?.error);
                if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
                    onError(new Error(t('input.micUnavailable', 'Microphone access denied or not available.')));
                }
            };
            recognition.onend = () => {
                setIsRecording(false);
                recognitionRef.current = null;
                const text = transcriptRef.current.trim();
                if (text) {
                    onTranscription(text);
                } else {
                    onError(new Error(t('input.noSpeech', 'No speech detected. Please try speaking closer to the microphone.')));
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error('[MicrophoneButton] Could not start dictation:', err);
            onError(new Error(t('input.micUnavailable', 'Microphone access denied or not available.')));
        }
    };

    const stopRecording = () => {
        recognitionRef.current?.stop();
    };

    const handleClick = () => {
        if (disabled) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const label = isRecording ? t('input.stopRecording', 'Stop recording') : t('input.voiceNote', 'Voice Note');

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            aria-label={label}
            className={`group relative p-3 rounded-full transition-all duration-200 border active:scale-95 ${isRecording
                ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                : variant === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-700'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={label}
        >
            {isRecording ? (
                <Square size={20} fill="currentColor" />
            ) : (
                <Mic size={20} className="group-hover:scale-110 transition-transform" />
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
            </div>
        </button>
    );
}
