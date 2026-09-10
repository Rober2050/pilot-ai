import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { mediaProcessorService, ProcessedMedia } from '../../services/media/mediaProcessorService';

interface MicrophoneButtonProps {
    onTranscription: (text: string) => void;
    onError: (error: Error) => void;
    disabled?: boolean;
    variant?: 'dark' | 'light';
}

export function MicrophoneButton({
    onTranscription,
    onError,
    disabled = false,
    variant = 'dark'
}: MicrophoneButtonProps) {
    const { t } = useTranslation('translation');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());

                setIsProcessing(true);
                try {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    // Using .webm extension to ensure proper MIME detection
                    const file = new File([blob], "voice_note.webm", { type: 'audio/webm' });

                    // Process & Transcribe
                    const processed = await mediaProcessorService.processAudio(file);
                    const text = await mediaProcessorService.transcribeAudio(processed);

                    if (!text || text.trim().length === 0) {
                        throw new Error("No speech detected. Please try speaking closer to the microphone.");
                    }

                    onTranscription(text);
                } catch (err: any) {
                    console.error("Transcription error:", err);
                    onError(err);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

        } catch (err: any) {
            console.error("Mic permission error:", err);
            onError(new Error("Microphone access denied or not available."));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleClick = () => {
        if (disabled || isProcessing) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || isProcessing}
            className={`group relative p-3 rounded-full transition-all duration-200 border active:scale-95 ${isRecording
                ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                : variant === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-700'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isRecording ? 'Stop Recording' : t('input.voiceNote', 'Voice Note')}
        >
            {isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
            ) : isRecording ? (
                <Square size={20} fill="currentColor" />
            ) : (
                <Mic size={20} className="group-hover:scale-110 transition-transform" />
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {isProcessing ? 'Transcribing...' : isRecording ? 'Stop Recording' : t('input.voiceNote', 'Voice Note')}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
            </div>
        </button>
    );
}
