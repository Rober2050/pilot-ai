import React, { useRef, useState } from 'react';
import { Music, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { mediaProcessorService, ProcessedMedia } from '../../services/media/mediaProcessorService';
import type { ProcessedAudioContent } from '../../types/audio';

interface AudioUploadButtonProps {
    onAudioProcessed?: (text: string) => void; // Deprecated, use onAudioTranscribed
    onAudioTranscribed?: (content: ProcessedAudioContent) => void; // New callback with full metadata
    onAudioSelected?: (media: ProcessedMedia) => void; // Callback for immediate "Chip" feedback
    onError: (error: Error) => void;
    disabled?: boolean;
    variant?: 'dark' | 'light';
}

export function AudioUploadButton({
    onAudioProcessed,
    onAudioTranscribed,
    onAudioSelected,
    onError,
    disabled = false,
    variant = 'dark'
}: AudioUploadButtonProps) {
    const { t } = useTranslation('translation');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const getAudioDuration = (file: File): Promise<number> => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'metadata';

            audio.onloadedmetadata = () => {
                window.URL.revokeObjectURL(audio.src);
                resolve(audio.duration);
            };

            audio.onerror = () => {
                window.URL.revokeObjectURL(audio.src);
                reject(new Error('Failed to load audio metadata'));
            };

            audio.src = URL.createObjectURL(file);
        });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const startTime = performance.now();
        setIsProcessing(true);

        try {
            // 1. Process Media (compression service handles size validation)
            const processed = await mediaProcessorService.processAudio(file);

            // 2. IMMEDIATE FEEDBACK: Show the chip
            if (onAudioSelected) {
                onAudioSelected(processed);
            }

            // 3. Get audio duration
            let duration: number | undefined;
            try {
                duration = await getAudioDuration(file);
            } catch (durationError) {
                console.warn('Could not get audio duration:', durationError);
                // Continue without duration
            }

            // 4. Transcribe immediately
            const transcription = await mediaProcessorService.transcribeAudio(processed);

            // 5. Generate Smart Summary (UX Improvement)
            // User requested summary visualization instead of raw text
            const summary = await mediaProcessorService.generateSmartSummary(transcription, t('language', 'es') as any);

            const displayText = `📝 **RESUMEN DE AUDIO**\n\n${summary}`;

            const processingTime = Math.round(performance.now() - startTime);

            // 6. Extract format from filename or mime type
            const format = file.name.split('.').pop()?.toLowerCase() ||
                processed.mimeType.split('/')[1] || 'mp3';

            // 7. Create complete audio content object
            // We use the SUMMARY as the main text for the block to keep UI clean
            const audioContent: ProcessedAudioContent = {
                transcription: displayText, // Show summary in UI
                metadata: {
                    fileName: file.name,
                    sizeBytes: file.size,
                    duration,
                    format
                },
                processingTime
            };

            // 7. Return via new callback (preferred) or old callback (backward compatibility)
            if (onAudioTranscribed) {
                onAudioTranscribed(audioContent);
            } else if (onAudioProcessed) {
                // Backward compatibility: just return text
                onAudioProcessed(transcription);
            }

        } catch (error: any) {
            console.error('Audio processing error:', error);

            // Enrich error with user-friendly message for parent component
            // Parent component (StrategyHub) will show the alert
            if (error.code === 'AUDIO_TOO_LARGE') {
                error.userMessage = `El archivo es demasiado grande (máximo ${error.details?.maxSize || 50}MB).`;
            } else if (error.code === 'ENCODER_INIT_FAILED') {
                error.userMessage = 'El sistema de compresión no está disponible. Intenta con un archivo más pequeño (< 20MB).';
            } else if (error.code === 'AUDIO_DECODE_FAILED') {
                error.userMessage = 'No se pudo decodificar el audio. Verifica que el formato sea válido (MP3, WAV, M4A, OGG).';
            } else if (error.message?.includes('too large')) {
                error.userMessage = 'El archivo es demasiado grande. Usa un archivo menor a 20MB.';
            } else if (error.message?.includes('transcribe') || error.message?.includes('API')) {
                error.userMessage = 'No se pudo transcribir el audio. Verifica tu conexión e intenta nuevamente.';
            } else if (error.message?.includes('decode') || error.message?.includes('format') || error.message?.includes('Invalid file type')) {
                error.userMessage = 'Formato de audio no compatible. Usa MP3, WAV, M4A u OGG.';
            } else {
                error.userMessage = 'Intenta con otro archivo o verifica el formato.';
            }

            // Call onError callback (parent will show alert)
            onError(error);
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClick = () => {
        if (!disabled && !isProcessing) {
            fileInputRef.current?.click();
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg, audio/mp3, audio/wav, audio/m4a"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isProcessing}
            />

            <button
                onClick={handleClick}
                disabled={disabled || isProcessing}
                className={`group relative p-3 rounded-full border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${variant === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-700' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}
                title={t('input.uploadAudio', 'Upload Audio')}
            >
                {isProcessing ? (
                    <Loader2 size={20} className={variant === 'light' ? 'text-slate-500 animate-spin' : 'text-white animate-spin'} />
                ) : (
                    <Music size={20} className={`group-hover:scale-110 transition-transform ${variant === 'light' ? '' : 'text-white'}`} />
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {isProcessing ? t('input.transcribing', 'Transcribing...') : t('input.uploadAudio', 'Upload Audio')}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
            </button>
        </>
    );
}
