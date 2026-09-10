import React, { useState, useEffect } from 'react';
import { DiscoveryAgent, DiscoveryResponse, MissionManifest } from '../../../services/ai/DiscoveryAgent';
import { Mic, Send, CheckCircle, Brain } from 'lucide-react';
import { audioManager } from '../../../services/audioManager';

interface DiscoveryOverlayProps {
    initialInput: string;
    lang: 'es' | 'en';
    onComplete: (manifest: MissionManifest) => void;
    onSkip: () => void;
}

/**
 * DiscoveryOverlay - Recursive Reasoning Engine UI
 * 
 * Características:
 * - Motor de razonamiento recursivo (no encuesta lineal)
 * - Análisis de entropía en tiempo real
 * - Soporte para voz y texto
 * - Readiness score (0-100%)
 * - Hacker Console (dev mode)
 */
export const DiscoveryOverlay: React.FC<DiscoveryOverlayProps> = ({
    initialInput,
    lang,
    onComplete,
    onSkip
}) => {
    const [discoveryAgent] = useState(() => new DiscoveryAgent(import.meta.env.VITE_GEMINI_API_KEY));
    const [conversationHistory, setConversationHistory] = useState<string[]>([]);
    const [currentResponse, setCurrentResponse] = useState<DiscoveryResponse | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false); // ✅ BATCH 3: Success message state
    const recognitionRef = React.useRef<any>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null); // ✅ BATCH 3: Textarea ref for auto-expand

    // ✅ FIX: Prevent double execution in React Strict Mode
    const hasInitialized = React.useRef(false);

    // Inicializar discovery al montar
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            initializeDiscovery();
        }

        // ✅ BATCH 6.9 FIX: Cleanup audio on unmount (prevent bleed into War Room)
        return () => {
            console.log('[DiscoveryOverlay] Unmounting/Cleaning up...');
            audioManager.stop();
        };
    }, [initialInput]);

    const initializeDiscovery = async () => {
        try {
            setIsLoading(true);
            const response = await discoveryAgent.analyzeContext([], initialInput, undefined, lang);
            setCurrentResponse(response);
            setConversationHistory([`User: ${initialInput}`]);

            // Speak the agent's response
            if (response.userFeedback) {
                audioManager.stop();
                await audioManager.speak(response.userFeedback, 'discovery-agent', lang, 0, 'female');
            }
        } catch (error) {
            console.error("Discovery initialization failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!currentResponse || !currentAnswer.trim() || isLoading) return;

        // ✅ AUDIO SAFETY: Stop microphone before AI speaks
        if (isListening && recognitionRef.current) {
            console.log('[DiscoveryOverlay] Stopping microphone before AI response');
            recognitionRef.current.stop();
            setIsListening(false);
        }

        setIsLoading(true);

        // Update history
        const newHistory = [...conversationHistory, `Agent: ${currentResponse.userFeedback}`, `User: ${currentAnswer}`];
        setConversationHistory(newHistory);

        try {
            const response = await discoveryAgent.analyzeContext(newHistory, currentAnswer, undefined, lang);
            setCurrentResponse(response);
            setCurrentAnswer('');

            if (response.isComplete && response.manifest) {
                // ✅ BATCH 3: Show success message and delay transition
                setShowSuccessMessage(true);

                // Wait 2.5s before transitioning to War Room
                setTimeout(() => {
                    onComplete(response.manifest!);
                }, 2500);
            } else {
                // Continue conversation
                if (response.userFeedback) {
                    audioManager.stop();
                    await audioManager.speak(response.userFeedback, 'discovery-agent', lang, 0, 'female');
                }
            }
        } catch (error) {
            console.error("Discovery processing failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoiceInput = async () => {
        if (isListening) {
            // Stop recording if already listening
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert(lang === 'es'
                ? 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.'
                : 'Your browser does not support voice recognition. Use Chrome or Edge.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = lang === 'es' ? 'es-ES' : 'en-US';
        recognition.continuous = true;  // ✅ CONTINUOUS MODE: Keep listening until manually stopped
        recognition.interimResults = true;  // ✅ INTERIM RESULTS: Show real-time transcription

        let finalTranscript = '';

        recognition.onstart = () => {
            setIsListening(true);
            finalTranscript = '';
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update input with final + interim (for real-time feedback)
            setCurrentAnswer((finalTranscript + interimTranscript).trim());
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
            // Keep the final transcript in the input
        };

        try {
            recognition.start();
        } catch (e) {
            console.warn("Recognition already started", e);
        }
    };

    if (!currentResponse) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="text-white">Cargando...</div>
            </div>
        );
    }

    const progress = currentResponse.manifest?.readiness || 0;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {lang === 'es' ? 'Briefing de Misión' : 'Mission Briefing'}
                    </h2>
                    <p className="text-white/70">
                        {lang === 'es'
                            ? 'Responde algunas preguntas para optimizar tu War Room'
                            : 'Answer a few questions to optimize your War Room'}
                    </p>
                </div>

                {/* Progress Bar (Readiness Score) */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm text-white/70 mb-2">
                        <span>{Math.round(progress)}% {lang === 'es' ? 'Readiness' : 'Readiness'}</span>
                        <span>{currentResponse.isComplete ? '✅ Complete' : '🔄 In Progress'}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${progress >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                progress >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                    'bg-gradient-to-r from-red-400 to-pink-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Current Question */}
                {!currentResponse.isComplete && currentResponse.userFeedback && (
                    <div className="mb-6">
                        <div className="bg-white/5 rounded-xl p-6 mb-4">
                            <p className="text-xl text-white font-medium">
                                {currentResponse.userFeedback}
                            </p>
                        </div>

                        {/* Answer Input - ✅ BATCH 3: Textarea with auto-expand */}
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={textareaRef}
                                value={currentAnswer}
                                onChange={(e) => {
                                    setCurrentAnswer(e.target.value);
                                    // Auto-expand
                                    if (textareaRef.current) {
                                        textareaRef.current.style.height = 'auto';
                                        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
                                    }
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitAnswer();
                                    }
                                }}
                                placeholder={lang === 'es' ? 'Tu respuesta... (Shift+Enter para nueva línea)' : 'Your answer... (Shift+Enter for new line)'}
                                disabled={isLoading}
                                className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none overflow-y-auto"
                                style={{ minHeight: '60px', maxHeight: '200px' }}
                                rows={1}
                            />
                            <button
                                onClick={handleVoiceInput}
                                disabled={isListening || isLoading}
                                className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3 transition-colors disabled:opacity-50 flex-shrink-0"
                            >
                                <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse text-red-400' : ''}`} />
                            </button>
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={!currentAnswer.trim() || isLoading}
                                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-xl px-6 py-3 transition-colors flex items-center gap-2 flex-shrink-0"
                            >
                                {isLoading ? '...' : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Missing Info Display */}
                {currentResponse.missingInfo && currentResponse.missingInfo.length > 0 && (
                    <div className="mb-6 bg-white/5 rounded-xl p-4">
                        <p className="text-sm text-white/70 mb-2">
                            {lang === 'es' ? 'Información pendiente:' : 'Missing information:'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {currentResponse.missingInfo.map((info, idx) => (
                                <span key={idx} className="text-xs bg-white/10 text-white/80 px-3 py-1 rounded-full">
                                    {info}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hacker Console (Dev Mode) */}
                {import.meta.env.DEV && currentResponse.reasoning && (
                    <div className="mb-6 bg-black/80 text-green-400 p-4 rounded-xl font-mono text-xs">
                        <div className="flex items-center gap-2 font-bold mb-2">
                            <Brain className="w-4 h-4" />
                            Agent Reasoning:
                        </div>
                        <div className="text-green-300/80">{currentResponse.reasoning}</div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={onSkip}
                        className="text-white/50 hover:text-white/70 text-sm transition-colors"
                    >
                        {lang === 'es' ? 'Saltar (modo avanzado)' : 'Skip (advanced mode)'}
                    </button>

                    {currentResponse.isComplete && currentResponse.manifest && (
                        <button
                            onClick={() => onComplete(currentResponse.manifest!)}
                            className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-6 py-3 transition-colors flex items-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            {lang === 'es' ? 'Iniciar War Room' : 'Start War Room'}
                        </button>
                    )}
                </div>

                {/* ✅ BATCH 3: Success Message Overlay */}
                {showSuccessMessage && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/90 to-emerald-600/90 backdrop-blur-md flex items-center justify-center z-50 rounded-2xl animate-fade-in">
                        <div className="text-center text-white">
                            <div className="mb-4 flex justify-center">
                                <CheckCircle className="w-20 h-20 animate-bounce" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">
                                {lang === 'es' ? '✅ Discovery Completo!' : '✅ Discovery Complete!'}
                            </h2>
                            <p className="text-xl text-white/90">
                                {lang === 'es' ? 'Lanzando War Room...' : 'Launching War Room...'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
