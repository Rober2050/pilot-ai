import { SpeechRequest, Language } from '../types/voice';
import { ROLE_VOICES, DEFAULT_VOICE, getVoiceForRole } from '../config/voiceConfig';

/**
 * Web Speech API Service (FREE & OPTIMIZED)
 * Uses browser's native synthesis. No external API calls.
 */
class VoiceService {
    private voices: SpeechSynthesisVoice[] = [];
    private voicesLoaded: boolean = false;

    constructor() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    private loadVoices() {
        this.voices = window.speechSynthesis.getVoices();
        if (this.voices.length > 0) {
            this.voicesLoaded = true;
            console.log(`🎤 [VOICE SERVICE] Loaded ${this.voices.length} system voices.`);
        }
    }

    private async ensureVoicesLoaded(): Promise<void> {
        if (this.voicesLoaded) return;

        return new Promise((resolve) => {
            // Try enabling it immediately
            this.voices = window.speechSynthesis.getVoices();
            if (this.voices.length > 0) {
                this.voicesLoaded = true;
                resolve();
                return;
            }

            // Wait for event
            const onVoicesChanged = () => {
                this.voices = window.speechSynthesis.getVoices();
                this.voicesLoaded = true;
                window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                resolve();
            };
            window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

            // Timeout fallback (some browsers don't fire event if already loaded)
            setTimeout(() => {
                this.voices = window.speechSynthesis.getVoices();
                this.voicesLoaded = true;
                resolve();
            }, 1000);
        });
    }

    /**
     * Speak text using Native Browser API
     * Returns a promise that resolves when speech ENDS.
     */
    async speak(request: SpeechRequest): Promise<void> {
        await this.ensureVoicesLoaded();
        const { text, roleId, language, roleConfig } = request;

        console.log(`🎤 [VOICE SERVICE] Speaking for ${roleId} (${language})`);

        // 1. Get Preferred Config
        const voiceConfig = getVoiceForRole(roleId, language, roleConfig);

        // 2. Find Best Matching System Voice
        const selectedVoice = this.findBestVoice(voiceConfig.name, language);

        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                // console.log(`✅ [VOICE MATCH] Using: ${selectedVoice.name}`);
            } else {
                console.warn(`⚠️ [VOICE WARN] No match for ${voiceConfig.name}, using default for ${language}`);
            }

            // Tuning
            utterance.rate = 1.0; // Normal speed
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            utterance.lang = language === 'es' ? 'es-ES' : 'en-US';

            // Events
            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (e) => {
                console.error("TTS Error", e);
                // Don't reject, just resolve to not block the flow
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    }

    /**
     * Smart Voice Finder
     */
    private findBestVoice(preferredName: string, lang: Language): SpeechSynthesisVoice | null {
        // 1. Exact Name match
        const exact = this.voices.find(v => v.name === preferredName);
        if (exact) return exact;

        // 2. Partial Name match (e.g. "Microsoft Sabina" matching "Microsoft Sabina Desktop")
        const partial = this.voices.find(v => v.name.includes(preferredName));
        if (partial) return partial;

        // 3. Any voice for that specific locale (e.g. es-MX)
        // (Not implemented strictly here to avoid over-engineering, jumping to 4)

        // 4. Any voice for the language generic (es)
        const langPrefix = lang === 'es' ? 'es' : 'en';
        const fallback = this.voices.find(v => v.lang.startsWith(langPrefix));

        return fallback || this.voices[0] || null;
    }

    /**
     * Cancel all speech
     */
    cancel() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    /**
     * Test connection to service
     */
    async testConnection(): Promise<boolean> {
        return true;
    }

    /**
     * Synthesize audio (Placeholder for Google TTS)
     */
    async synthesize(request: any): Promise<{ audioContent: string }> {
        console.warn("synthesize() not implemented in local VoiceService (placeholder).");
        throw new Error("Google Cloud TTS not implemented in this build.");
    }
}

export const voiceService = new VoiceService();
