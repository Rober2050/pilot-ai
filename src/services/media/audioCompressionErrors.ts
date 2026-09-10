/**
 * Audio Compression Error Types
 * Enterprise-grade typed errors for audio compression failures
 */

export class AudioCompressionError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: Record<string, any>
    ) {
        super(message);
        this.name = 'AudioCompressionError';
    }
}

export class EncoderInitializationError extends AudioCompressionError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 'ENCODER_INIT_FAILED', details);
        this.name = 'EncoderInitializationError';
    }
}

export class AudioTooLargeError extends AudioCompressionError {
    constructor(size: number, maxSize: number) {
        super(
            `Audio file too large: ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${maxSize}MB`,
            'AUDIO_TOO_LARGE',
            { size, maxSize }
        );
        this.name = 'AudioTooLargeError';
    }
}

export class AudioDecodingError extends AudioCompressionError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 'AUDIO_DECODE_FAILED', details);
        this.name = 'AudioDecodingError';
    }
}

export class CompressionNotAvailableError extends AudioCompressionError {
    constructor(reason: string) {
        super(
            `Audio compression not available: ${reason}`,
            'COMPRESSION_UNAVAILABLE',
            { reason }
        );
        this.name = 'CompressionNotAvailableError';
    }
}
