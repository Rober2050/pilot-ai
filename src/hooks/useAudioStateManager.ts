import { useState, useCallback, useRef, useEffect } from 'react';
import { audioManager as globalAudioManager } from '../services/audioManager'; // ✅ Import global service

/**
 * Audio State Manager - REFACTORED FOR USER PRIORITY & GLOBAL SYNC
 * ARCHITECTURAL PATTERN: User Intent Priority + Singleton Synchronization
 * 
 * PRINCIPLE: User actions ALWAYS take precedence over system auto-play
 * 
 * GUARANTEES:
 * - User click ALWAYS works (force-listen capability)
 * - Clears GLOBAL audio queue on interruption (fixes "never shuts up")
 * - Syncs with global audio service state
 * - TTS and STT are mutually exclusive
 */

export type AudioMode = 'idle' | 'speaking' | 'listening' | 'transitioning';

interface AudioStateManagerReturn {
    mode: AudioMode;
    canSpeak: boolean;    // Can start TTS
    canListen: boolean;   // Can start STT
    requestSpeak: () => Promise<boolean>;   // Request TTS (waits if STT active)
    requestListen: () => Promise<void>;     // Request STT (cancels TTS if active)
    forceListen: () => Promise<void>;       // FORCE listen (user priority)
    setMode: (mode: AudioMode) => void;     // Update mode (called by voice hooks)
    release: () => void;  // Release audio channel
}

export const useAudioStateManager = (): AudioStateManagerReturn => {
    const [mode, setModeState] = useState<AudioMode>('idle');
    const modeRef = useRef<AudioMode>('idle'); // ✅ Track current mode without stale closure
    const transitionLockRef = useRef<boolean>(false);

    // ✅ Computed properties based on current mode
    const canSpeak = mode === 'idle' || mode === 'listening';
    const canListen = mode === 'idle' || mode === 'speaking';

    // ✅ Safe mode setter with logging (NO dependencies on mode)
    const setMode = useCallback((newMode: AudioMode) => {
        const currentMode = modeRef.current;
        if (currentMode !== newMode) {
            console.log(`[AudioManager] Mode: ${currentMode} → ${newMode}`);
            modeRef.current = newMode; // ✅ Update ref immediately
            setModeState(newMode);
        }
    }, []); // ✅ No dependencies = no stale closure

    // ✅ SYNC WITH GLOBAL AUDIO MANAGER
    useEffect(() => {
        // Listen to global manager state changes
        const unsubscribe = globalAudioManager.onStateChange((state) => {
            if (state.isPlaying && modeRef.current === 'idle') {
                console.log('[AudioManager] 🔄 Sync: Global manager started speaking');
                setMode('speaking');
            } else if (!state.isPlaying && modeRef.current === 'speaking') {
                // Only go to idle if we were speaking (don't interrupt listening)
                console.log('[AudioManager] 🔄 Sync: Global manager stopped speaking');
                setMode('idle'); // Keep consistent
            }
        });

        // Listen to global manager speech start
        const unsubscribeStart = globalAudioManager.onSpeakStart(() => {
            if (modeRef.current !== 'listening') {
                setMode('speaking');
            }
        });

        return () => {
            unsubscribe();
            unsubscribeStart();
        };
    }, [setMode]);

    // ✅ Request permission to speak (TTS)
    const requestSpeak = useCallback(async (): Promise<boolean> => {
        const currentMode = modeRef.current; // ✅ Always get fresh mode

        // ✅ If user is listening (STT active), block TTS
        if (currentMode === 'listening') {
            console.log('[AudioManager] ❌ TTS blocked (user is speaking)');
            return false;
        }

        // ✅ If transitioning, wait briefly
        if (currentMode === 'transitioning') {
            console.log('[AudioManager] ⏳ Waiting for transition to complete...');
            await new Promise(resolve => setTimeout(resolve, 100));
            return requestSpeak(); // Retry
        }

        // ✅ If already speaking, allow (queue will handle)
        if (currentMode === 'speaking') {
            console.log('[AudioManager] ✅ TTS allowed (already speaking)');
            return true;
        }

        // ✅ If idle, allow
        console.log('[AudioManager] ✅ TTS allowed (idle)');
        setMode('speaking');
        return true;
    }, [setMode]);

    // ✅ Request permission to listen (STT) - NORMAL
    const requestListen = useCallback(async (): Promise<void> => {
        const currentMode = modeRef.current; // ✅ Always get fresh mode

        // ✅ Prevent double-click during transition
        if (transitionLockRef.current) {
            console.log('[AudioManager] ⏳ Transition locked, ignoring request');
            return;
        }

        transitionLockRef.current = true;
        setMode('transitioning');

        // ✅ If AI is speaking (Global or Local), cancel TTS (barge-in)
        if (currentMode === 'speaking' || window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            console.log('[AudioManager] 🔇 Canceling Global TTS (barge-in)...');
            globalAudioManager.stop(); // ✅ CRITICAL: Stop global queue
            window.speechSynthesis.cancel();

            // ✅ CRITICAL: Wait for audio channel to be free
            console.log('[AudioManager] ⏱️ Waiting 350ms for audio channel...');
            await new Promise(resolve => setTimeout(resolve, 350));
        } else {
            // ✅ Small safety delay even if not speaking
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // ✅ Ready to listen
        console.log('[AudioManager] ✅ STT allowed, transitioning to listening');
        setMode('listening');
        transitionLockRef.current = false;
    }, [setMode]);

    // ✅ FORCE LISTEN - USER PRIORITY (ALWAYS WORKS)
    const forceListen = useCallback(async (): Promise<void> => {
        console.log('[AudioManager] 🚨 FORCE LISTEN (User Priority)');

        // ✅ CRITICAL: Clear any locks immediately
        transitionLockRef.current = false;

        // ✅ Stop GLOBAL Audio Manager (clears queue)
        console.log('[AudioManager] 🛑 Stopping Global Audio Queue...');
        globalAudioManager.stop();

        // ✅ Cancel any ongoing TTS
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            console.log('[AudioManager] 🔇 Force canceling TTS...');
            window.speechSynthesis.cancel();
            await new Promise(resolve => setTimeout(resolve, 350));
        } else {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // ✅ Force to listening state
        console.log('[AudioManager] ✅ Force transitioning to listening');
        setMode('listening');
    }, [setMode]);

    // ✅ Release audio channel (return to idle)
    const release = useCallback(() => {
        console.log('[AudioManager] 🔓 Releasing audio channel');
        setMode('idle');
        transitionLockRef.current = false;
    }, [setMode]);

    return {
        mode,
        canSpeak,
        canListen,
        requestSpeak,
        requestListen,
        forceListen, // ✅ NEW: Force listen for user clicks
        setMode,
        release
    };
};
