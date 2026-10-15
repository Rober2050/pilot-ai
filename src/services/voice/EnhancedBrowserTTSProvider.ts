import { Language } from '../../types/voice';
import { loggingService } from '../firebase/loggingService';

/**
 * Voice configuration for role-based speech synthesis
 */
interface VoiceConfig {
    pitch: number;
    rate: number;
    volume: number;
    gender?: 'male' | 'female';
}

/**
 * Voice quality assessment
 */
interface VoiceQuality {
    available: boolean;
    voiceName: string;
    quality: 'high' | 'medium' | 'low';
    provider: 'google' | 'microsoft' | 'native' | 'none';
}

/**
 * Enhanced Browser Text-to-Speech Provider
 * Provides high-quality, free voice synthesis using browser's Speech Synthesis API
 * Supports ES and EN only with intelligent voice selection
 */
class EnhancedBrowserTTSProvider {
    private readonly supportedLanguages: Language[] = ['es', 'en'];
    private voicesLoaded = false;

    constructor() {
        // Ensure voices are loaded
        this.initVoices();
    }

    /**
     * Initialize and load available voices
     */
    private async initVoices(): Promise<void> {
        return new Promise((resolve) => {
            const voices = window.speechSynthesis.getVoices();

            if (voices.length > 0) {
                this.voicesLoaded = true;
                resolve();
            } else {
                // Wait for voices to load
                window.speechSynthesis.onvoiceschanged = () => {
                    this.voicesLoaded = true;
                    resolve();
                };
            }
        });
    }

    /**
     * Get the best available voice for a language
     * Priority: Google > Microsoft > Local > Fallback
     */
    getBestVoice(language: Language, gender?: 'male' | 'female'): SpeechSynthesisVoice | null {
        if (!this.supportedLanguages.includes(language)) {
            loggingService.logInfo(
                'EnhancedBrowserTTS',
                `Language ${language} not supported. Use 'es' or 'en'.`,
                { language }
            );
            return null;
        }

        const voices = window.speechSynthesis.getVoices();
        const langCode = language === 'es' ? 'es' : 'en';

        // Filter by language
        const candidates = voices.filter(v => v.lang.startsWith(langCode));

        if (candidates.length === 0) {
            loggingService.logInfo(
                'EnhancedBrowserTTS',
                `No voices found for ${language}`,
                { language, availableVoices: voices.length }
            );
            return null;
        }

        // Priority 1: Google voices (best quality)
        let best = candidates.find(v => v.name.toLowerCase().includes('google'));
        if (best) {
            loggingService.logInfo(
                'EnhancedBrowserTTS',
                `Selected Google voice: ${best.name}`,
                { language, voiceName: best.name }
            );
            return best;
        }

        // Priority 2: Microsoft voices
        best = candidates.find(v => v.name.toLowerCase().includes('microsoft'));
        if (best) {
            loggingService.logInfo(
                'EnhancedBrowserTTS',
                `Selected Microsoft voice: ${best.name}`,
                { language, voiceName: best.name }
            );
            return best;
        }

        // Priority 3: Local voices (better than remote generic)
        const localVoices = candidates.filter(v => v.localService);
        if (localVoices.length > 0) {
            // Filter by gender if specified
            if (gender) {
                const genderMatch = localVoices.find(v =>
                    v.name.toLowerCase().includes(gender) ||
                    v.name.toLowerCase().includes(gender === 'male' ? 'man' : 'woman')
                );
                if (genderMatch) {
                    loggingService.logInfo(
                        'EnhancedBrowserTTS',
                        `Selected local voice with gender: ${genderMatch.name}`,
                        { language, gender, voiceName: genderMatch.name }
                    );
                    return genderMatch;
                }
            }

            loggingService.logInfo(
                'EnhancedBrowserTTS',
                `Selected local voice: ${localVoices[0].name}`,
                { language, voiceName: localVoices[0].name }
            );
            return localVoices[0];
        }

        // Fallback: first available voice
        loggingService.logInfo(
            'EnhancedBrowserTTS',
            `Selected fallback voice: ${candidates[0].name}`,
            { language, voiceName: candidates[0].name }
        );
        return candidates[0];
    }

    /**
     * Get voice configuration for a specific role
     */
    getRoleConfig(roleId: string): VoiceConfig {
        const configs: Record<string, VoiceConfig> = {
            'product-manager': { pitch: 1.1, rate: 1.0, volume: 1.0, gender: 'female' },
            'architect': { pitch: 0.9, rate: 0.95, volume: 1.0, gender: 'male' },
            'business-analyst': { pitch: 1.05, rate: 1.05, volume: 1.0, gender: 'female' },
            'ux-designer': { pitch: 1.15, rate: 1.0, volume: 1.0, gender: 'female' },
            'developer': { pitch: 0.95, rate: 1.0, volume: 1.0, gender: 'male' },
            'qa-engineer': { pitch: 1.0, rate: 1.0, volume: 1.0, gender: 'male' }
        };

        return configs[roleId] || { pitch: 1.0, rate: 1.0, volume: 1.0 };
    }

    /**
     * Enhance text for more natural speech
     * - Remove markdown formatting
     * - Add natural pauses
     * - Clean up spacing
     */
    enhanceText(text: string): string {
        return text
            // Remove markdown
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            // Natural pauses
            .replace(/\./g, '. ')
            .replace(/,/g, ', ')
            .replace(/:/g, ': ')
            .replace(/;/g, '; ')
            // Numbers more natural
            .replace(/(\d+)/g, ' $1 ')
            // Clean multiple spaces
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Synthesize speech with enhanced browser TTS
     */
    async speak(
        text: string,
        roleId: string,
        language: Language
    ): Promise<void> {
        // The executor body is wrapped in try/catch and every failure path calls reject.
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                // Validate language
                if (!this.supportedLanguages.includes(language)) {
                    const error = new Error(`Language ${language} not supported. Use 'es' or 'en'.`);
                    loggingService.logError(
                        'EnhancedBrowserTTS',
                        'Unsupported language',
                        { language, roleId, error }
                    );
                    reject(error);
                    return;
                }

                // Ensure voices are loaded
                if (!this.voicesLoaded) {
                    await this.initVoices();
                }

                // Get best voice
                const config = this.getRoleConfig(roleId);
                const voice = this.getBestVoice(language, config.gender);

                if (!voice) {
                    const error = new Error(`No voice available for ${language}`);
                    loggingService.logError(
                        'EnhancedBrowserTTS',
                        'No voice available',
                        { language, roleId, error }
                    );
                    reject(error);
                    return;
                }

                // Enhance text
                const enhancedText = this.enhanceText(text);

                // Create utterance
                const utterance = new SpeechSynthesisUtterance(enhancedText);
                utterance.voice = voice;
                utterance.pitch = config.pitch;
                utterance.rate = config.rate;
                utterance.volume = config.volume;
                utterance.lang = voice.lang;

                // Event handlers
                utterance.onend = () => {
                    loggingService.logInfo(
                        'EnhancedBrowserTTS',
                        'Speech synthesis completed',
                        { roleId, language, textLength: text.length }
                    );
                    resolve();
                };

                utterance.onerror = (event) => {
                    loggingService.logError(
                        'EnhancedBrowserTTS',
                        'Speech synthesis error',
                        { roleId, language, error: event.error, event }
                    );
                    reject(new Error(`Speech synthesis failed: ${event.error}`));
                };

                // Speak
                loggingService.logInfo(
                    'EnhancedBrowserTTS',
                    'Starting speech synthesis',
                    {
                        roleId,
                        language,
                        voiceName: voice.name,
                        textLength: text.length,
                        config
                    }
                );

                window.speechSynthesis.speak(utterance);

            } catch (error) {
                loggingService.logError(
                    'EnhancedBrowserTTS',
                    'Unexpected error in speak method',
                    { roleId, language, error }
                );
                reject(error);
            }
        });
    }

    /**
     * Stop current speech
     */
    stop(): void {
        window.speechSynthesis.cancel();
        loggingService.logInfo(
            'EnhancedBrowserTTS',
            'Speech synthesis stopped',
            {}
        );
    }

    /**
     * Pause current speech
     */
    pause(): void {
        window.speechSynthesis.pause();
        loggingService.logInfo(
            'EnhancedBrowserTTS',
            'Speech synthesis paused',
            {}
        );
    }

    /**
     * Resume paused speech
     */
    resume(): void {
        window.speechSynthesis.resume();
        loggingService.logInfo(
            'EnhancedBrowserTTS',
            'Speech synthesis resumed',
            {}
        );
    }

    /**
     * Test voice quality and availability
     */
    async testVoice(language: Language): Promise<VoiceQuality> {
        try {
            if (!this.voicesLoaded) {
                await this.initVoices();
            }

            const voice = this.getBestVoice(language);

            if (!voice) {
                return {
                    available: false,
                    voiceName: 'none',
                    quality: 'low',
                    provider: 'none'
                };
            }

            // Determine quality and provider
            let quality: 'high' | 'medium' | 'low' = 'low';
            let provider: 'google' | 'microsoft' | 'native' | 'none' = 'native';

            if (voice.name.toLowerCase().includes('google')) {
                quality = 'high';
                provider = 'google';
            } else if (voice.name.toLowerCase().includes('microsoft')) {
                quality = 'medium';
                provider = 'microsoft';
            } else if (voice.localService) {
                quality = 'medium';
                provider = 'native';
            }

            loggingService.logInfo(
                'EnhancedBrowserTTS',
                'Voice quality test completed',
                { language, voiceName: voice.name, quality, provider }
            );

            return {
                available: true,
                voiceName: voice.name,
                quality,
                provider
            };

        } catch (error) {
            loggingService.logError(
                'EnhancedBrowserTTS',
                'Voice quality test failed',
                { language, error }
            );

            return {
                available: false,
                voiceName: 'error',
                quality: 'low',
                provider: 'none'
            };
        }
    }

    /**
     * Get all available voices for a language
     */
    getAvailableVoices(language: Language): SpeechSynthesisVoice[] {
        const langCode = language === 'es' ? 'es' : 'en';
        const voices = window.speechSynthesis.getVoices();
        return voices.filter(v => v.lang.startsWith(langCode));
    }
}

// Export singleton instance
export const enhancedBrowserTTS = new EnhancedBrowserTTSProvider();
export type { VoiceConfig, VoiceQuality };
