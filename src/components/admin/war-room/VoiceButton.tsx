import React from 'react';
import { Mic, MicOff, Loader2, Square } from 'lucide-react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

/**
 * Voice Button Component
 * BATCH 5: Floating microphone button for War Room voice interaction
 * 
 * Visual States:
 * - Idle: Gray, subtle pulse
 * - Listening: Red, strong pulse (user speaking)
 * - Processing: Yellow, spinner (AI thinking)
 * - Speaking: Cyan, wave animation (AI speaking)
 */

interface VoiceButtonProps {
    state: VoiceState;
    isSupported: boolean;
    onToggle: () => void;
    disabled?: boolean;
    language: 'es' | 'en';
    transcript?: string; // ✅ FIX: Show live transcript while listening
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
    state,
    isSupported,
    onToggle,
    disabled = false,
    language,
    transcript = '' // ✅ FIX: Default to empty string
}) => {
    if (!isSupported) {
        return (
            <div className="relative group">
                <button
                    disabled
                    className="w-12 h-12 rounded-full bg-gray-700/50 border border-gray-600 flex items-center justify-center cursor-not-allowed opacity-50"
                >
                    <MicOff className="w-5 h-5 text-gray-400" />
                </button>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                        {language === 'es' ? 'Voz no soportada' : 'Voice not supported'}
                    </div>
                </div>
            </div>
        );
    }

    const getStateStyles = () => {
        switch (state) {
            case 'listening':
                return {
                    bg: 'bg-red-500/20 border-red-500',
                    icon: 'text-red-400',
                    animation: 'animate-pulse',
                    label: language === 'es' ? 'Escuchando...' : 'Listening...'
                };
            case 'processing':
                return {
                    bg: 'bg-yellow-500/20 border-yellow-500',
                    icon: 'text-yellow-400',
                    animation: '',
                    label: language === 'es' ? 'Procesando...' : 'Processing...'
                };
            case 'speaking':
                return {
                    bg: 'bg-cyan-500/20 border-cyan-500',
                    icon: 'text-cyan-400',
                    animation: 'animate-pulse',
                    label: language === 'es' ? 'IA hablando...' : 'AI speaking...'
                };
            default: // idle
                return {
                    bg: 'bg-gray-700/30 border-gray-600 hover:border-gray-500',
                    icon: 'text-gray-400 group-hover:text-gray-300',
                    animation: '',
                    label: language === 'es' ? 'Toca para hablar' : 'Tap to speak'
                };
        }
    };

    const styles = getStateStyles();
    const isActive = state !== 'idle';

    return (
        <div className="relative group">
            {/* Main Button */}
            <button
                onClick={onToggle}
                disabled={disabled || state === 'processing'}
                className={`
                    w-12 h-12 rounded-full border-2 transition-all duration-300
                    flex items-center justify-center
                    ${styles.bg} ${styles.animation}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                    shadow-lg
                `}
            >
                {state === 'processing' ? (
                    <Loader2 className={`w-5 h-5 ${styles.icon} animate-spin`} />
                ) : state === 'listening' ? (
                    <Square className={`w-4 h-4 ${styles.icon} fill-current`} />
                ) : (
                    <Mic className={`w-5 h-5 ${styles.icon} transition-colors`} />
                )}
            </button>

            {/* Pulsing Ring (when active) — pointer-events-none so clicks reach button! */}
            {isActive && (
                <div className={`
                    absolute inset-0 rounded-full border-2 pointer-events-none
                    ${state === 'listening' ? 'border-red-500' : state === 'speaking' ? 'border-cyan-500' : 'border-yellow-500'}
                    animate-ping opacity-20
                `} />
            )}

            {/* ✅ FIX: Live Transcript Display (when listening) */}
            {state === 'listening' && transcript && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 pointer-events-none z-50 w-64">
                    <div className="bg-red-500/95 text-white px-3 py-2 rounded-lg shadow-2xl">
                        <div className="text-[10px] font-medium mb-1 opacity-80">
                            {language === 'es' ? 'Escuchando:' : 'Listening:'}
                        </div>
                        <div className="text-xs italic line-clamp-2">
                            "{transcript}"
                        </div>
                    </div>
                </div>
            )}

            {/* Status Label */}
            <div className={`
                absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                transition-opacity duration-200
                ${isActive && !transcript ? 'opacity-100' : state === 'idle' ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}
                pointer-events-none
            `}>
                <div className={`
                    px-2 py-1 rounded-lg shadow-xl text-[10px] font-medium whitespace-nowrap
                    ${state === 'listening' ? 'bg-red-500/90 text-white' :
                        state === 'processing' ? 'bg-yellow-500/90 text-black' :
                            state === 'speaking' ? 'bg-cyan-500/90 text-white' :
                                'bg-gray-900 text-gray-300'}
                `}>
                    {styles.label}
                </div>
            </div>

            {/* Waveform Animation (when listening) */}
            {state === 'listening' && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-end gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-0.5 bg-red-400 rounded-full animate-pulse"
                            style={{
                                height: `${Math.random() * 12 + 6}px`,
                                animationDelay: `${i * 100}ms`,
                                animationDuration: '600ms'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Keyboard Shortcut Hint (idle only) */}
            {state === 'idle' && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-gray-400 text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap">
                        {language === 'es' ? 'Toca para hablar' : 'Tap to speak'}
                    </div>
                </div>
            )}
        </div>
    );
};
