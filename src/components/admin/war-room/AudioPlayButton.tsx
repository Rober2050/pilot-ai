import React, { useState } from 'react';
import { Play, Volume2, Pause, AlertCircle } from 'lucide-react';
import { Language } from '../../../types/voice';
import { enhancedBrowserTTS } from '../../../services/voice/EnhancedBrowserTTSProvider';
import { loggingService } from '../../../services/firebase/loggingService';

interface AudioPlayButtonProps {
    text: string;
    roleId: string;
    language: Language;
    className?: string;
}

type PlayState = 'idle' | 'playing' | 'paused' | 'error';

/**
 * Audio Play Button Component
 * Provides on-demand audio playback using Enhanced Browser TTS
 * Shows play icon (▶️) that users can click to hear the message
 */
export const AudioPlayButton: React.FC<AudioPlayButtonProps> = ({
    text,
    roleId,
    language,
    className = ''
}) => {
    const [playState, setPlayState] = useState<PlayState>('idle');

    const handlePlay = async () => {
        try {
            setPlayState('playing');

            loggingService.logInfo(
                'AudioPlayButton',
                'User requested audio playback',
                { roleId, language, textLength: text.length }
            );

            await enhancedBrowserTTS.speak(text, roleId, language);

            setPlayState('idle');

        } catch (error) {
            loggingService.logError(
                'AudioPlayButton',
                'Audio playback failed',
                { roleId, language, error }
            );

            setPlayState('error');

            // Reset to idle after 3 seconds
            setTimeout(() => setPlayState('idle'), 3000);
        }
    };

    const handlePause = () => {
        enhancedBrowserTTS.pause();
        setPlayState('paused');

        loggingService.logInfo(
            'AudioPlayButton',
            'Audio playback paused',
            { roleId }
        );
    };

    const handleResume = () => {
        enhancedBrowserTTS.resume();
        setPlayState('playing');

        loggingService.logInfo(
            'AudioPlayButton',
            'Audio playback resumed',
            { roleId }
        );
    };

    const handleStop = () => {
        enhancedBrowserTTS.stop();
        setPlayState('idle');

        loggingService.logInfo(
            'AudioPlayButton',
            'Audio playback stopped',
            { roleId }
        );
    };

    // Tooltips in both languages
    const tooltips = {
        idle: {
            es: 'Escuchar mensaje',
            en: 'Listen to message'
        },
        playing: {
            es: 'Pausar audio',
            en: 'Pause audio'
        },
        paused: {
            es: 'Reanudar audio',
            en: 'Resume audio'
        },
        error: {
            es: 'Error al reproducir',
            en: 'Playback error'
        }
    };

    const getTooltip = () => tooltips[playState][language];

    const getIcon = () => {
        switch (playState) {
            case 'playing':
                return <Volume2 className="w-4 h-4 animate-pulse" />;
            case 'paused':
                return <Pause className="w-4 h-4" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-400" />;
            default:
                return <Play className="w-4 h-4" />;
        }
    };

    const handleClick = () => {
        if (playState === 'idle' || playState === 'error') {
            handlePlay();
        } else if (playState === 'playing') {
            handlePause();
        } else if (playState === 'paused') {
            handleResume();
        }
    };

    return (
        <button
            onClick={handleClick}
            onDoubleClick={handleStop}
            className={`
        relative group
        w-8 h-8 rounded-lg
        flex items-center justify-center
        transition-all duration-200
        ${playState === 'idle' ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10' : ''}
        ${playState === 'playing' ? 'text-cyan-400 bg-cyan-500/20' : ''}
        ${playState === 'paused' ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' : ''}
        ${playState === 'error' ? 'text-red-400 hover:text-red-300' : ''}
        ${className}
      `}
            title={getTooltip()}
            aria-label={getTooltip()}
        >
            {getIcon()}

            {/* Tooltip */}
            <div className="
        absolute -top-8 left-1/2 -translate-x-1/2
        px-2 py-1 rounded
        bg-black/90 text-white text-xs whitespace-nowrap
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
        z-50
      ">
                {getTooltip()}
            </div>

            {/* Playing indicator ring */}
            {playState === 'playing' && (
                <div className="absolute inset-0 rounded-lg border-2 border-cyan-400 animate-ping opacity-75" />
            )}
        </button>
    );
};
