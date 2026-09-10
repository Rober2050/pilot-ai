// Voice System Types

export type Language = 'es' | 'en';

export type VoiceGender = 'MALE' | 'FEMALE' | 'NEUTRAL';

export interface VoiceConfig {
    name: string;
    languageCode: string;
    gender: VoiceGender;
    description?: string;
}

export interface RoleVoiceMapping {
    es: VoiceConfig;
    en: VoiceConfig;
}

export interface SpeechRequest {
    text: string;
    roleId: string;
    language: Language;
    roleConfig?: { gender?: 'male' | 'female' };
}

export interface SpeechResponse {
    audioContent: string; // base64 encoded audio
    cacheKey: string;
    fromCache: boolean;
}

export interface AudioCacheEntry {
    key: string;
    audioBlob: Blob;
    timestamp: number;
    language: Language;
    roleId: string;
    textHash: string;
}

export interface PlaybackState {
    isPlaying: boolean;
    isPaused: boolean;
    currentRoleId: string | null;
    currentText: string | null;
    progress: number; // 0-100
    volume: number; // 0-100
    speed: number; // 0.5-2.0
    queueLength: number;
}

export interface AudioQueueItem {
    id: string;
    roleId: string;
    text: string;
    language: Language;
    priority: number;
    gender?: 'male' | 'female';
}

export interface VoiceServiceConfig {
    apiKey: string;
    audioEncoding: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    sampleRateHertz: number;
    pitch: number;
    speakingRate: number;
}

export interface CacheConfig {
    maxSizeBytes: number;
    expirationDays: number;
    dbName: string;
    storeName: string;
}

// ✅ BATCH 5: Voice Profiles for parametric synthesis
export interface VoiceProfile {
    pitch: number;      // 0.0 - 2.0 (1.0 = normal)
    rate: number;       // 0.1 - 10.0 (1.0 = normal)
    volume: number;     // 0.0 - 1.0 (1.0 = max)
    voiceName?: string; // Preferred voice name (e.g., "Google US English")
}

// ✅ BATCH 5: Web Speech API type extensions
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

