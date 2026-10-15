import { useState, useCallback, useEffect, useRef } from 'react';
import { getVoiceProfile, selectVoiceForRole } from '../config/voiceProfiles';
import { audioOrchestrator } from '../services/AudioOrchestrator';

/**
 * Voice Interaction Hook - REFACTORED WITH AUDIO ORCHESTRATOR
 * BATCH 5: Real-time voice interaction using Web Speech API (ZERO COST)
 * 
 * ARCHITECTURE: Delegates all coordination to AudioOrchestrator (SSOT)
 * - Pure UI state hook
 * - No coordination logic (moved to orchestrator)
 * - User priority guaranteed by orchestrator
 */

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface UseVoiceInteractionProps {
    language: 'es' | 'en';
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
}

interface UseVoiceInteractionReturn {
    state: VoiceState;
    isListening: boolean;
    isSpeaking: boolean;
    transcript: string;
    error: string | null;
    startListening: () => Promise<void>;
    stopListening: () => void;
    speak: (text: string, roleId: string) => Promise<void>;
    interrupt: () => void;
    isSupported: boolean;
}

export const useVoiceInteraction = ({
    language,
    onTranscript,
    onError
}: UseVoiceInteractionProps): UseVoiceInteractionReturn => {
    const [state, setState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const isListeningRef = useRef(false);
    const finalTranscriptRef = useRef(''); // ✅ FIX: Ref so it can be reset between sessions

    // ✅ FIX: Stable refs for callbacks (prevents useEffect re-running every render)
    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    // Check if Web Speech API is supported
    const isSupported = typeof window !== 'undefined' && (
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    ) && 'speechSynthesis' in window;

    // ✅ Sync local state with AudioOrchestrator
    useEffect(() => {
        const unsubscribe = audioOrchestrator.onStateChange((orchestratorState) => {
            if (orchestratorState === 'USER_SPEAKING') {
                setState('listening');
            } else if (orchestratorState === 'AI_SPEAKING') {
                setState('speaking');
            } else {
                setState('idle');
            }
        });

        return unsubscribe;
    }, []);

    // ✅ ROBUST INITIALIZATION (uses refs for stable callbacks)
    useEffect(() => {
        if (!isSupported) {
            setError('Web Speech API not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // ✅ FIX: onstart clears accumulated transcript (Discovery pattern)
        recognition.onstart = () => {
            console.log('[VoiceInteraction] ▶️ Recognition started');
            finalTranscriptRef.current = '';
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscriptRef.current += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            const fullTranscript = (finalTranscriptRef.current + interimTranscript).trim();
            setTranscript(fullTranscript);

            // ✅ Use ref (always latest callback, never stale)
            onTranscriptRef.current(fullTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error('[VoiceInteraction] Recognition error:', event.error);
            if (event.error === 'no-speech' || event.error === 'aborted') return;

            const errorMsg = language === 'es'
                ? `Error de reconocimiento: ${event.error}`
                : `Recognition error: ${event.error}`;
            setError(errorMsg);
            onErrorRef.current?.(errorMsg);
        };

        recognition.onend = () => {
            console.log('[VoiceInteraction] Recognition ended');
            isListeningRef.current = false;
            audioOrchestrator.releaseMicrophone();
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch { /* already stopped */ }
            }
        };
    }, [language, isSupported]); // ✅ FIX: Only re-init on language or support change

    // ✅ START LISTENING - WITH ORCHESTRATOR PRIORITY
    const startListening = useCallback(async () => {
        if (!isSupported || !recognitionRef.current) {
            const msg = language === 'es'
                ? 'Reconocimiento de voz no soportado'
                : 'Speech recognition not supported';
            setError(msg);
            onError?.(msg);
            return;
        }

        // ✅ Prevent double-start
        if (isListeningRef.current) {
            console.log('[VoiceInteraction] Already listening, ignoring');
            return;
        }

        try {
            // ✅ CRITICAL: Request microphone from orchestrator
            // This will KILL all AI audio and grant exclusive access
            console.log('[VoiceInteraction] 🎤 Requesting microphone from orchestrator');
            await audioOrchestrator.requestMicrophone();

            // ✅ Start recognition
            console.log('[VoiceInteraction] ▶️ Starting speech recognition');
            finalTranscriptRef.current = ''; // ✅ FIX: Clear accumulated transcript BEFORE start
            recognitionRef.current.start();
            isListeningRef.current = true;
            setTranscript('');
            setError(null);

        } catch (err: any) {
            console.error('[VoiceInteraction] ❌ Failed to start recognition:', err);

            // ✅ Release microphone on failure
            audioOrchestrator.releaseMicrophone();
            isListeningRef.current = false;

            // ✅ Only show error if not "already started"
            if (!err.message?.includes('already started')) {
                const msg = language === 'es'
                    ? 'No se pudo iniciar el reconocimiento de voz'
                    : 'Could not start voice recognition';
                setError(msg);
                onError?.(msg);
            }
        }
    }, [isSupported, language, onError]);

    // ✅ STOP LISTENING
    const stopListening = useCallback(() => {
        if (!recognitionRef.current || !isListeningRef.current) {
            return;
        }

        try {
            console.log('[VoiceInteraction] ⏹️ Stopping speech recognition');
            recognitionRef.current.stop(); // Chrome will fire final onresult + onend async
            isListeningRef.current = false;
            setState('idle'); // Immediate UI feedback

            // ✅ DO NOT release microphone here!
            // Chrome still needs to deliver final results via onresult.
            // releaseMicrophone() is called in the onend handler (line ~125)
            // which fires AFTER Chrome delivers the final words.
        } catch (err) {
            console.error('[VoiceInteraction] Error stopping recognition:', err);
            audioOrchestrator.releaseMicrophone(); // Only on error
        }
    }, []);

    // ✅ Ref to track if we've been interrupted during speech
    const isInterruptedRef = useRef(false);

    // ✅ SPEAK (TTS) - Chunked for full text reading (Chrome truncation fix)
    const speak = useCallback(async (text: string, roleId: string): Promise<void> => {
        if (!isSupported) {
            console.warn('[VoiceInteraction] TTS not supported');
            return;
        }

        const granted = await audioOrchestrator.requestSpeech();
        if (!granted) {
            console.log('[VoiceInteraction] ❌ TTS blocked by orchestrator (user is speaking)');
            return;
        }

        // Reset interrupt flag at start of new speech
        isInterruptedRef.current = false;

        // 🔇 TRANSLATION & FILTERING (The TTS Silencer - Golden Mix)
        // We strip code blocks, asterisks, hashes, and URLs so the voice engine speaks clean prose.
        const textForTTS = text
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/<[^>]*>?/gm, '')      // Remove HTML tags
            .replace(/[*#]/g, '')           // Remove Markdown bold/italic/header markers
            .replace(/\]\([^)]+\)/g, ']')  // Remove Markdown URLs but keep the bracket text
            .replace(/https?:\/\/[^\s]+/g, ''); // Remove plain URLs

        if (!textForTTS.trim()) {
            console.log('[VoiceInteraction] 🔇 TTS Silenced (Text was purely code/empty after filtering).');
            return;
        }

        // ✅ Split text into chunks at sentence boundaries (~200 chars max)
        const splitIntoChunks = (t: string, maxLen = 200): string[] => {
            const chunks: string[] = [];
            let remaining = t.trim();
            while (remaining.length > 0) {
                if (remaining.length <= maxLen) {
                    chunks.push(remaining);
                    break;
                }
                // Find best split point: sentence end (. ! ?) or comma
                let splitAt = -1;
                for (let i = Math.min(remaining.length - 1, maxLen); i >= maxLen * 0.5; i--) {
                    if ('.!?'.includes(remaining[i])) { splitAt = i + 1; break; }
                }
                if (splitAt === -1) {
                    for (let i = Math.min(remaining.length - 1, maxLen); i >= maxLen * 0.5; i--) {
                        if (',;:'.includes(remaining[i])) { splitAt = i + 1; break; }
                    }
                }
                if (splitAt === -1) {
                    // Last resort: split at last space
                    splitAt = remaining.lastIndexOf(' ', maxLen);
                    if (splitAt <= 0) splitAt = maxLen;
                }
                chunks.push(remaining.substring(0, splitAt).trim());
                remaining = remaining.substring(splitAt).trim();
            }
            return chunks;
        };

        const chunks = splitIntoChunks(text);
        console.log(`[VoiceInteraction] 🔊 Speaking ${chunks.length} chunk(s) as ${roleId}`);

        // ✅ Cancel any ongoing speech
        if (utteranceRef.current) {
            window.speechSynthesis.cancel();
        }

        const profile = getVoiceProfile(roleId);
        const selectedVoice = selectVoiceForRole(roleId, language);

        // Speak chunks sequentially
        for (let i = 0; i < chunks.length; i++) {
            // ✅ CRITICAL BUG FIX: If we were interrupted during the previous chunk, STOP the loop
            if (isInterruptedRef.current) {
                console.log(`[VoiceInteraction] 🛑 Speech chunking loop aborted at chunk ${i + 1}/${chunks.length}`);
                audioOrchestrator.releaseSpeech();
                return;
            }

            await new Promise<void>((resolve, reject) => {
                try {
                    const utterance = new SpeechSynthesisUtterance(chunks[i]);
                    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
                    utterance.pitch = profile.pitch;
                    utterance.rate = profile.rate;
                    utterance.volume = 1.0;
                    if (selectedVoice) utterance.voice = selectedVoice;

                    utterance.onend = () => {
                        utteranceRef.current = null;
                        if (i === chunks.length - 1 && !isInterruptedRef.current) {
                            console.log(`[VoiceInteraction] ✅ Finished speaking as ${roleId}`);
                            audioOrchestrator.releaseSpeech();
                        }
                        resolve();
                    };

                    utterance.onerror = (event) => {
                        utteranceRef.current = null;

                        // Treat 'interrupted' as a valid termination, not an error
                        if (event.error === 'interrupted' || event.error === 'canceled') {
                            console.log(`[VoiceInteraction] 🛑 Utterance canceled/interrupted`);
                            isInterruptedRef.current = true;
                            audioOrchestrator.releaseSpeech();
                            resolve(); // Resolve to unblock the await, the loop check will catch the flag
                        } else {
                            console.error(`[VoiceInteraction] ❌ Utterance error: ${event.error}`);
                            audioOrchestrator.releaseSpeech();
                            reject(new Error(event.error));
                        }
                    };

                    utteranceRef.current = utterance;
                    window.speechSynthesis.speak(utterance);
                } catch (err) {
                    audioOrchestrator.releaseSpeech();
                    reject(err);
                }
            });
        }
    }, [isSupported, language]);

    // ✅ INTERRUPT (Barge-in)
    const interrupt = useCallback(() => {
        console.log('[VoiceInteraction] 🛑 User interrupt (barge-in)');

        // ✅ Set interrupt flag so the chunking loop doesn't proceed to the next chunk
        isInterruptedRef.current = true;

        // ✅ Use orchestrator kill switch
        audioOrchestrator.killAllAudio();

        // ✅ Clean up local state
        if (utteranceRef.current) {
            utteranceRef.current = null;
        }
    }, []);

    return {
        state,
        isListening: state === 'listening',
        isSpeaking: state === 'speaking',
        transcript,
        error,
        startListening,
        stopListening,
        speak,
        interrupt,
        isSupported
    };
};
