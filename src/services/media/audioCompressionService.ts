import { loggingService } from '../firebase/loggingService';
import {
    AudioCompressionError,
    EncoderInitializationError,
    AudioTooLargeError,
    AudioDecodingError,
    CompressionNotAvailableError
} from './audioCompressionErrors';

// @ts-ignore
import * as lamejs from 'lamejs';

/**
 * Enterprise-Grade Audio Compression Service
 * 
 * Architecture:
 * - Layer 1: Validation & Health Checks
 * - Layer 2: Encoder Initialization & Management
 * - Layer 3: Adaptive Compression Strategy
 * 
 * Strategies:
 * 1. LAME MP3 Encoder (Primary - Best quality/size ratio)
 * 2. Web Audio API (Fallback - Native, reliable)
 * 3. Original File (Last resort - No compression)
 */

export type CompressionStrategy = 'lame' | 'webaudio' | 'none';

export interface CompressionResult {
    file: File;
    strategy: CompressionStrategy;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    processingTime: number;
}

class AudioCompressionService {
    private MAX_AUDIO_SIZE_MB = 50;
    private TARGET_SAMPLE_RATE = 16000; // 16kHz is ideal for ASR
    private TARGET_BITRATE = 64; // 64kbps mono is sufficient for speech

    private isInitialized = false;
    private encoderClass: any = null;
    private audioContext: AudioContext | null = null;
    private encoderReady = false;

    constructor() {
        this.initialize().catch(err => {
            console.debug('[AudioCompression] Lazy init failed (harmless)', err);
        });
    }

    /**
     * LAYER 1: Initialization & Health Check
     * Attempts to initialize LAME encoder on service creation
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Dynamic import to avoid bundling issues
            let lamejsModule;
            try {
                // @ts-ignore
                lamejsModule = await import('lamejs');
            } catch (e) {
                // Silently fail if not available
                throw new Error('Module not found');
            }

            if (!lamejsModule || (!lamejsModule.Mp3Encoder && !lamejsModule.default?.Mp3Encoder)) {
                throw new EncoderInitializationError('Lamejs module structure invalid');
            }

            this.encoderClass = lamejsModule.Mp3Encoder || lamejsModule.default.Mp3Encoder;

            // Just instantiate a dummy encoder to verify it works
            try {
                new this.encoderClass(1, 16000, 64);
                this.encoderReady = true;
                this.isInitialized = true;
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

                loggingService.logInfo('audio-compression', 'encoder_initialized', {
                    version: '1.2.1',
                    method: 'lamejs-dynamic'
                });
            } catch (instantiationError: any) {
                this.encoderReady = false;
                throw new EncoderInitializationError(
                    'Failed to instantiate Mp3Encoder',
                    {
                        error: instantiationError.message,
                        lameVersion: (lamejsModule as any).version || 'unknown'
                    }
                );
            }

        } catch (error: any) {
            // Downgrade to DEBUG
            console.debug('[AudioCompression] MP3 Encoder not available (using robust fallbacks):', error.message);
            // Don't throw, just stay uninitialized
        }
    }

    /**
     * LAYER 2: Validation
     * Pre-flight checks before compression
     */
    private validateFile(file: File): void {
        const maxSizeBytes = this.MAX_AUDIO_SIZE_MB * 1024 * 1024;

        if (file.size > maxSizeBytes) {
            throw new AudioTooLargeError(file.size, this.MAX_AUDIO_SIZE_MB);
        }

        // Validate MIME type
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
        if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
            console.warn('[AudioCompression] Unusual audio MIME type:', file.type);
        }
    }

    /**
     * LAYER 3: Adaptive Compression Strategy
     * Main entry point - automatically selects best available strategy
     */
    async compressAudio(file: File): Promise<CompressionResult> {
        const startTime = performance.now();

        // Validation
        this.validateFile(file);

        const originalSize = file.size;
        let compressedFile: File;
        let strategy: CompressionStrategy;

        try {
            if (this.encoderReady) {
                // Strategy 1: LAME Compression (Primary)
                compressedFile = await this.compressWithLAME(file);
                strategy = 'lame';

                loggingService.logInfo('audio-compression', 'compression_success', {
                    strategy: 'lame',
                    originalSize,
                    compressedSize: compressedFile.size,
                    ratio: ((1 - compressedFile.size / originalSize) * 100).toFixed(2) + '%'
                });
            } else {
                // Strategy 2: Web Audio API Fallback
                console.warn('[AudioCompression] LAME not available, using Web Audio API fallback');
                compressedFile = await this.compressWithWebAudio(file);
                strategy = 'webaudio';

                loggingService.logInfo('audio-compression', 'compression_fallback', {
                    strategy: 'webaudio',
                    reason: 'lame_unavailable',
                    originalSize,
                    compressedSize: compressedFile.size
                });
            }
        } catch (error: any) {
            // Strategy 3: No Compression (Last Resort)
            console.error('[AudioCompression] All compression strategies failed, using original file', error);

            loggingService.logError('audio-compression', 'compression_failed_using_original', {
                error: error.message,
                originalSize
            });

            compressedFile = file;
            strategy = 'none';
        }

        // CRITICAL CHECK: Did we inflate the file?
        // If "compression" made it larger (e.g. MP3 -> WAV fallback), AND original was smaller, use original.
        if (compressedFile.size > originalSize) {
            console.warn(`[AudioCompression] Inflation detected! ${originalSize} -> ${compressedFile.size}. Reverting to original.`);

            loggingService.logInfo('audio-compression', 'inflation_prevented', {
                originalSize,
                inflatedSize: compressedFile.size,
                strategy_attempted: strategy
            });

            compressedFile = file;
            strategy = 'none';
        }

        const processingTime = Math.round(performance.now() - startTime);

        return {
            file: compressedFile,
            strategy,
            originalSize,
            compressedSize: compressedFile.size,
            compressionRatio: originalSize > 0 ? compressedFile.size / originalSize : 1,
            processingTime
        };
    }

    /**
     * Strategy 1: LAME MP3 Compression
     * High-quality compression with optimal settings for voice
     */
    private async compressWithLAME(file: File): Promise<File> {
        console.log(`[LAME Compression] Starting for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        try {
            // 1. Decode Audio
            const arrayBuffer = await file.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            let audioBuffer: AudioBuffer;
            try {
                audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            } catch (decodeError: any) {
                throw new AudioDecodingError('Failed to decode audio file', {
                    error: decodeError.message,
                    fileType: file.type
                });
            }

            // 2. Instantiate Encoder
            const mp3Encoder = new this.encoderClass(1, this.TARGET_SAMPLE_RATE, this.TARGET_BITRATE);
            const samples = audioBuffer.getChannelData(0); // Mono

            // 3. Resample to 16kHz (optimal for voice AI)
            const sampleRateRatio = audioBuffer.sampleRate / this.TARGET_SAMPLE_RATE;
            const newLength = Math.floor(samples.length / sampleRateRatio);
            const resampledSamples = new Int16Array(newLength);

            for (let i = 0; i < newLength; i++) {
                const originalIndex = Math.floor(i * sampleRateRatio);
                let s = samples[originalIndex];
                s = Math.max(-1, Math.min(1, s)); // Clamp
                resampledSamples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // 4. Encode to MP3
            const mp3Data: Uint8Array[] = [];
            const sampleBlockSize = 1152;

            for (let i = 0; i < resampledSamples.length; i += sampleBlockSize) {
                const chunk = resampledSamples.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3Encoder.encodeBuffer(chunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }

            const mp3buf = mp3Encoder.flush();
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }

            // 5. Create compressed file
            const blob = new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mp3' });
            const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + "_compressed.mp3",
                { type: 'audio/mp3' }
            );

            console.log(`[LAME Compression] Success. ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB`);

            return compressedFile;
        } catch (error: any) {
            loggingService.logError('audio-compression', 'lame_compression_failed', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Strategy 2: Web Audio API Compression
     * Fallback strategy using native browser APIs
     */
    private async compressWithWebAudio(file: File): Promise<File> {
        console.log(`[WebAudio Compression] Starting for ${file.name}`);

        try {
            // Use MediaRecorder API for compression
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Create offline context for processing
            const offlineContext = new OfflineAudioContext(
                1, // mono
                audioBuffer.duration * this.TARGET_SAMPLE_RATE,
                this.TARGET_SAMPLE_RATE
            );

            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start();

            const renderedBuffer = await offlineContext.startRendering();

            // Convert to WAV (simpler than MP3 encoding without LAME)
            const wavBlob = this.audioBufferToWav(renderedBuffer);
            const compressedFile = new File(
                [wavBlob],
                file.name.replace(/\.[^/.]+$/, "") + "_compressed.wav",
                { type: 'audio/wav' }
            );

            console.log(`[WebAudio Compression] Success. ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(wavBlob.size / 1024 / 1024).toFixed(2)}MB`);

            return compressedFile;
        } catch (error: any) {
            loggingService.logError('audio-compression', 'webaudio_compression_failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Helper: Convert AudioBuffer to WAV Blob
     */
    private audioBufferToWav(buffer: AudioBuffer): Blob {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels: Float32Array[] = [];
        let offset = 0;
        let pos = 0;

        // Write WAV header
        const setUint16 = (data: number) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data: number) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // RIFF identifier
        setUint32(0x46464952);
        // file length
        setUint32(length - 8);
        // RIFF type
        setUint32(0x45564157);
        // format chunk identifier
        setUint32(0x20746d66);
        // format chunk length
        setUint32(16);
        // sample format (raw)
        setUint16(1);
        // channel count
        setUint16(buffer.numberOfChannels);
        // sample rate
        setUint32(buffer.sampleRate);
        // byte rate
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
        // block align
        setUint16(buffer.numberOfChannels * 2);
        // bits per sample
        setUint16(16);
        // data chunk identifier
        setUint32(0x61746164);
        // data chunk length
        setUint32(length - pos - 4);

        // Write interleaved data
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * Public API: Check if compression is available
     */
    isCompressionAvailable(): boolean {
        return this.encoderReady;
    }

    /**
     * Public API: Get current compression strategy
     */
    getAvailableStrategy(): CompressionStrategy {
        if (this.encoderReady) return 'lame';
        return 'webaudio';
    }
}

// Singleton instance
export const audioCompressionService = new AudioCompressionService();
