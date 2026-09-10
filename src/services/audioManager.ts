import { PlaybackState, AudioQueueItem, Language } from '../types/voice';
import { voiceService } from './voiceService';

/**
 * Audio Manager
 * Manages audio playback queue, synchronization, and controls
 */
class AudioManager {
    private audio: HTMLAudioElement | null = null;
    private queue: AudioQueueItem[] = [];
    private currentItem: AudioQueueItem | null = null;
    private isProcessing = false;

    private state: PlaybackState = {
        isPlaying: false,
        isPaused: false,
        currentRoleId: null,
        currentText: null,
        progress: 0,
        volume: 100,
        speed: 1.0,
        queueLength: 0
    };

    // Event listeners
    private listeners: {
        onStateChange: ((state: PlaybackState) => void)[];
        onSpeakStart: ((roleId: string) => void)[];
        onSpeakEnd: ((roleId: string) => void)[];
        onError: ((error: Error) => void)[];
    } = {
            onStateChange: [],
            onSpeakStart: [],
            onSpeakEnd: [],
            onError: []
        };

    constructor() {
        // No Audio element needed for Web Speech API
        this.updateState({ isPlaying: false });
    }

    /**
     * Speak text for a role
     */
    async speak(text: string, roleId: string, language: Language, priority: number = 0, gender?: 'male' | 'female'): Promise<void> {
        const item: AudioQueueItem = {
            id: `${roleId}_${Date.now()}`,
            roleId,
            text,
            language,
            priority,
            gender
        };

        console.log(`🎤 [AUDIO MANAGER] Adding to queue: ${roleId} (priority: ${priority})`);

        // Add to queue (sorted by priority)
        this.queue.push(item);
        this.queue.sort((a, b) => b.priority - a.priority);
        this.updateState({ queueLength: this.queue.length });

        // Process queue if not already processing
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    /**
     * Process audio queue using voiceService.speak()
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        this.updateState({ isPlaying: true });

        while (this.queue.length > 0) {
            const item = this.queue.shift()!;
            this.currentItem = item;
            this.updateState({ queueLength: this.queue.length });

            try {
                console.log(`▶️ [AUDIO MANAGER] Speaking: ${item.roleId}`);

                // Update state BEFORE speaking
                this.updateState({
                    currentRoleId: item.roleId,
                    currentText: item.text,
                    progress: 50 // Mock progress for UI
                });

                this.notifySpeakStart(item.roleId);

                // AWAIT the speech (VoiceService wraps ensureVoicesLoaded + speak)
                await voiceService.speak({
                    text: item.text,
                    roleId: item.roleId,
                    language: item.language,
                    roleConfig: item.gender ? { gender: item.gender } : undefined
                });

                // Finished speaking this item
                this.notifySpeakEnd(item.roleId);

            } catch (error) {
                console.error(`❌ [AUDIO MANAGER] Error processing ${item.roleId}:`, error);
                this.notifyError(error as Error);
            }
        }

        this.isProcessing = false;
        this.currentItem = null;
        this.updateState({
            isPlaying: false,
            isPaused: false,
            currentRoleId: null,
            currentText: null,
            progress: 0,
            queueLength: 0
        });
    }

    /**
     * Stop playback
     */
    stop() {
        voiceService.cancel();
        this.queue = [];
        this.currentItem = null;
        this.isProcessing = false;

        this.updateState({
            isPlaying: false,
            isPaused: false,
            currentRoleId: null,
            currentText: null,
            queueLength: 0
        });

        console.log('⏹️ [AUDIO MANAGER] Stopped (Web Speech)');
    }

    pause() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.pause();
            this.updateState({ isPaused: true });
        }
    }

    resume() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.resume();
            this.updateState({ isPaused: false });
        }
    }

    // Setters
    setVolume(volume: number) {
        this.updateState({ volume });
        // Note: Web Speech API often ignores dynamic volume changes mid-speech
    }

    setSpeed(speed: number) {
        this.updateState({ speed });
        // Would need to update utterance.rate in voiceService if supported dynamically
    }

    /**
     * Get current playback state
     */
    getState(): PlaybackState {
        return { ...this.state };
    }

    /**
     * Get queue length
     */
    getQueueLength(): number {
        return this.queue.length;
    }

    /**
     * Clear queue
     */
    clearQueue() {
        this.queue = [];
        this.updateState({ queueLength: 0 });
        console.log('🗑️ [AUDIO MANAGER] Queue cleared');
    }

    /**
     * Update state and notify listeners
     */
    private updateState(updates: Partial<PlaybackState>) {
        this.state = { ...this.state, ...updates };
        this.notifyStateChange();
    }

    /**
     * Convert base64 to Blob
     */
    private base64ToBlob(base64: string, mimeType: string): Blob {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    // Event listener management
    onStateChange(callback: (state: PlaybackState) => void) {
        this.listeners.onStateChange.push(callback);
        return () => {
            this.listeners.onStateChange = this.listeners.onStateChange.filter(cb => cb !== callback);
        };
    }

    onSpeakStart(callback: (roleId: string) => void) {
        this.listeners.onSpeakStart.push(callback);
        return () => {
            this.listeners.onSpeakStart = this.listeners.onSpeakStart.filter(cb => cb !== callback);
        };
    }

    onSpeakEnd(callback: (roleId: string) => void) {
        this.listeners.onSpeakEnd.push(callback);
        return () => {
            this.listeners.onSpeakEnd = this.listeners.onSpeakEnd.filter(cb => cb !== callback);
        };
    }

    onError(callback: (error: Error) => void) {
        this.listeners.onError.push(callback);
        return () => {
            this.listeners.onError = this.listeners.onError.filter(cb => cb !== callback);
        };
    }

    // Notify listeners
    private notifyStateChange() {
        this.listeners.onStateChange.forEach(cb => cb(this.state));
    }

    private notifySpeakStart(roleId: string) {
        this.listeners.onSpeakStart.forEach(cb => cb(roleId));
    }

    private notifySpeakEnd(roleId: string) {
        this.listeners.onSpeakEnd.forEach(cb => cb(roleId));
    }

    private notifyError(error: Error) {
        this.listeners.onError.forEach(cb => cb(error));
    }
}

// Export singleton instance
export const audioManager = new AudioManager();
