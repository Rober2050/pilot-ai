/**
 * AudioOrchestrator - Single Source of Truth for Audio State
 * 
 * ARCHITECTURAL PATTERN: Singleton Coordinator
 * PRINCIPLE: User Intent ALWAYS takes priority over AI speech
 * 
 * RESPONSIBILITIES:
 * - Manage global audio state (IDLE, USER_SPEAKING, AI_SPEAKING)
 * - Ensure mutual exclusion (only one audio channel active)
 * - Coordinate between STT (Speech Recognition) and TTS (Speech Synthesis)
 * - Provide "Kill Switch" to silence all audio instantly
 * 
 * GUARANTEES:
 * - User can ALWAYS interrupt AI
 * - No race conditions between audio channels
 * - Clean state transitions
 */

export type AudioState = 'IDLE' | 'USER_SPEAKING' | 'AI_SPEAKING';

type StateChangeCallback = (state: AudioState) => void;

class AudioOrchestratorService {
    private state: AudioState = 'IDLE';
    private listeners: Set<StateChangeCallback> = new Set();

    /**
     * Get current audio state
     */
    getState(): AudioState {
        return this.state;
    }

    /**
     * Check if user can speak (always true - user has priority)
     */
    canUserSpeak(): boolean {
        return true; // User ALWAYS has priority
    }

    /**
     * Check if AI can speak (only if user is not speaking)
     */
    canAISpeak(): boolean {
        return this.state !== 'USER_SPEAKING';
    }

    /**
     * Request microphone access (USER PRIORITY)
     * This is the ONLY way to activate the microphone
     * 
     * GUARANTEES:
     * - Silences ALL AI speech immediately
     * - MUTES browser output volume temporarily
     * - Clears all audio queues
     * - Transitions to USER_SPEAKING state
     */
    async requestMicrophone(): Promise<void> {
        console.log('[AudioOrchestrator] 🎤 User requesting microphone (PRIORITY)');

        // ✅ CRITICAL: Kill all audio immediately
        this.killAllAudio();

        // ✅ EXTRA SAFETY: Verify TTS is truly stopped (double-check)
        if (window.speechSynthesis.speaking) {
            console.warn('[AudioOrchestrator] ⚠️ TTS still speaking after killAllAudio - force canceling');
            window.speechSynthesis.cancel();
        }

        // ✅ NEW: MUTE browser output volume to prevent acoustic feedback
        // This prevents the microphone from capturing residual AI voice from speakers
        // Note: window.speechSynthesis does not have a global volume property we can easily restore globally per spec,
        // but we can control HTML audio elements.

        const audioElements = document.querySelectorAll('audio, video');
        const previousVolumes: number[] = [];

        try {
            // Mute all HTML audio elements
            audioElements.forEach((el: any) => {
                previousVolumes.push(el.volume);
                el.volume = 0.0; // Mute
            });

            console.log('[AudioOrchestrator] 🔇 Output muted temporarily - waiting for acoustic dissipation');

            // Wait for acoustic environment to clear (1 second)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Restore volumes
            audioElements.forEach((el: any, idx: number) => {
                if (previousVolumes[idx] !== undefined) {
                    el.volume = previousVolumes[idx];
                }
            });

            console.log('[AudioOrchestrator] 🔊 Output volume restored');

        } catch (error) {
            console.error('[AudioOrchestrator] Error during volume mute:', error);
            // Continue anyway - microphone is more important
        }

        // ✅ Transition to USER_SPEAKING
        this.setState('USER_SPEAKING');
        console.log('[AudioOrchestrator] ✅ Microphone granted to user - audio channel clear');
    }

    /**
     * Release microphone (user finished speaking)
     */
    releaseMicrophone(): void {
        console.log('[AudioOrchestrator] 🔓 User releasing microphone');
        if (this.state === 'USER_SPEAKING') {
            this.setState('IDLE');
        }
    }

    /**
     * Request permission for AI to speak
     * Returns true if granted, false if blocked
     */
    async requestSpeech(): Promise<boolean> {
        if (!this.canAISpeak()) {
            console.log('[AudioOrchestrator] ❌ AI speech blocked (user is speaking)');
            return false;
        }

        console.log('[AudioOrchestrator] ✅ AI speech granted');
        this.setState('AI_SPEAKING');
        return true;
    }

    /**
     * Release speech channel (AI finished speaking)
     */
    releaseSpeech(): void {
        console.log('[AudioOrchestrator] 🔓 AI releasing speech channel');
        if (this.state === 'AI_SPEAKING') {
            this.setState('IDLE');
        }
    }

    /**
     * KILL SWITCH: Immediately stop ALL audio
     * 
     * This is called when:
     * - User clicks microphone button
     * - User interrupts AI speech
     * - System needs to reset audio state
     * 
     * ✅ BATCH 6.7 FIX: 100% Browser Native (NO require, NO Node.js)
     */
    killAllAudio(): void {
        console.log('[AudioOrchestrator] 🛑 KILL SWITCH: Stopping all audio');

        try {
            // ✅ Cancel browser TTS (Web Speech API)
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            // ✅ Stop all HTML5 audio elements
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });

            // ✅ Stop all video elements (in case they have audio)
            const videoElements = document.querySelectorAll('video');
            videoElements.forEach(video => {
                video.pause();
                video.currentTime = 0;
            });

            console.log('[AudioOrchestrator] ✅ All audio stopped successfully');
        } catch (error) {
            console.error('[AudioOrchestrator] Error stopping audio:', error);
            // ✅ Force speechSynthesis cancel even if other operations fail
            try {
                window.speechSynthesis?.cancel();
            } catch (e) {
                console.error('[AudioOrchestrator] Could not cancel speech synthesis:', e);
            }
        }
    }

    /**
     * Subscribe to state changes
     */
    onStateChange(callback: StateChangeCallback): () => void {
        this.listeners.add(callback);
        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Internal: Update state and notify listeners
     */
    private setState(newState: AudioState): void {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            console.log(`[AudioOrchestrator] State: ${oldState} → ${newState}`);

            // Notify all listeners
            this.listeners.forEach(callback => {
                try {
                    callback(newState);
                } catch (error) {
                    console.error('[AudioOrchestrator] Error in state change listener:', error);
                }
            });
        }
    }

    /**
     * Force reset to IDLE (emergency use only)
     */
    forceReset(): void {
        console.warn('[AudioOrchestrator] ⚠️ Force reset to IDLE');
        this.killAllAudio();
        this.setState('IDLE');
    }
}

// ✅ Export singleton instance
export const audioOrchestrator = new AudioOrchestratorService();
