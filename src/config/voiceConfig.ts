import { RoleVoiceMapping, CacheConfig } from '../types/voice';

// Voice mappings per role and language
// Voice mappings per role and language (Web Speech API)
// Priority: Microsoft Neural -> Google -> System Native
export const ROLE_VOICES: Record<string, RoleVoiceMapping> = {
    'product-manager': {
        es: {
            name: 'Microsoft Sabina Desktop', // High quality Spanish (Mexico)
            languageCode: 'es-MX',
            gender: 'FEMALE',
            description: 'Profesional, clara'
        },
        en: {
            name: 'Google US English',
            languageCode: 'en-US',
            gender: 'MALE',
            description: 'Professional'
        }
    },
    'architect': {
        es: {
            name: 'Microsoft Raul Desktop', // If available, or Google
            languageCode: 'es-ES',
            gender: 'MALE',
            description: 'Técnica, firme'
        },
        en: {
            name: 'Microsoft David Desktop',
            languageCode: 'en-US',
            gender: 'MALE',
            description: 'Technical'
        }
    },
    'ux-designer': {
        es: {
            name: 'Google español',
            languageCode: 'es-ES',
            gender: 'FEMALE',
            description: 'Creativa'
        },
        en: {
            name: 'Microsoft Zira Desktop',
            languageCode: 'en-US',
            gender: 'FEMALE',
            description: 'Creative'
        }
    },
    // ... mappings tailored to standard OS voices
    'business-analyst': {
        es: { name: 'Microsoft Sabina Desktop', languageCode: 'es-MX', gender: 'FEMALE' },
        en: { name: 'Google US English', languageCode: 'en-US', gender: 'MALE' }
    },
    'project-manager': {
        es: { name: 'Microsoft Pablo', languageCode: 'es-ES', gender: 'MALE' },
        en: { name: 'Microsoft Mark', languageCode: 'en-US', gender: 'MALE' }
    },
    'strategy-analyst': {
        es: { name: 'Microsoft Raul', languageCode: 'es-ES', gender: 'MALE' },
        en: { name: 'Google US English', languageCode: 'en-US', gender: 'MALE' }
    },
    'frontend-dev': {
        es: { name: 'Google español', languageCode: 'es', gender: 'FEMALE' },
        en: { name: 'Google US English', languageCode: 'en', gender: 'MALE' }
    },
    'backend-dev': {
        es: { name: 'Microsoft Raul', languageCode: 'es', gender: 'MALE' },
        en: { name: 'Microsoft David', languageCode: 'en', gender: 'MALE' }
    },
    'qa-engineer': {
        es: { name: 'Microsoft Sabina', languageCode: 'es', gender: 'FEMALE' },
        en: { name: 'Microsoft Zira', languageCode: 'en', gender: 'FEMALE' }
    },
    'marketing-manager': {
        es: { name: 'Google español', languageCode: 'es', gender: 'FEMALE' },
        en: { name: 'Google US English', languageCode: 'en', gender: 'MALE' }
    },
    'devops': {
        es: { name: 'Microsoft Raul', languageCode: 'es', gender: 'MALE' },
        en: { name: 'Microsoft David', languageCode: 'en', gender: 'MALE' }
    },
    'moderator': {
        es: { name: 'Google español', languageCode: 'es', gender: 'FEMALE' },
        en: { name: 'Google US English', languageCode: 'en', gender: 'MALE' }
    }
};

// Default fallback
export const DEFAULT_VOICE: RoleVoiceMapping = {
    es: {
        name: 'Google español',
        languageCode: 'es-ES',
        gender: 'FEMALE',
        description: 'Voz por defecto'
    },
    en: {
        name: 'Google US English',
        languageCode: 'en-US',
        gender: 'MALE',
        description: 'Default voice'
    }
};

// Audio Cache Configuration
export const CACHE_CONFIG: CacheConfig = {
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    expirationDays: 30,
    dbName: 'pilotai-audio-cache',
    storeName: 'audio-files'
};

// Helper function to get voice for a role
export const getVoiceForRole = (roleId: string, language: 'es' | 'en', roleConfig?: any) => {
    // 1. Try direct role matching
    const roleVoice = ROLE_VOICES[roleId];
    if (roleVoice) return roleVoice[language];

    // 2. Fallback to gender matching if config available
    if (roleConfig?.gender) {
        const gender = String(roleConfig.gender).toLowerCase();
        const isMale = gender === 'male' || gender === 'male';

        if (language === 'es') {
            return {
                name: isMale ? 'es-US-Neural2-B' : 'es-US-Neural2-A',
                languageCode: 'es-US',
                gender: isMale ? 'MALE' : 'FEMALE',
                description: `Dynamic ${gender} voice`
            };
        } else {
            return {
                name: isMale ? 'en-US-Neural2-D' : 'en-US-Neural2-E',
                languageCode: 'en-US',
                gender: isMale ? 'MALE' : 'FEMALE',
                description: `Dynamic ${gender} voice`
            };
        }
    }

    // 3. Absolute default
    console.warn(`No voice or gender configured for role: ${roleId}, using default`);
    return DEFAULT_VOICE[language];
};
