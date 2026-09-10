export interface ProcessedAudioContent {
    transcription: string;
    metadata: {
        fileName: string;
        sizeBytes: number;
        duration?: number; // in seconds
        format: string; // 'mp3', 'wav', etc.
    };
    processingTime: number; // in ms
}
