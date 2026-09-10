import { RoleId } from '../types/war-room';
import { VoiceProfile } from '../types/voice';

/**
 * Voice Profiles Configuration
 * BATCH 7: Gender-aware voice synthesis with language support
 * 
 * Each role has unique pitch/rate AND gender classification
 * for distinguishable voices in debates
 */

// Gender classification for voice assignment
type VoiceGender = 'feminine' | 'masculine';

const ROLE_GENDER: Record<string, VoiceGender> = {
    // Feminine-voiced roles
    'creative-director': 'feminine',
    'ux-ui-designer': 'feminine',
    'marketing-strategist': 'feminine',
    'content-strategist': 'feminine',
    'product-manager': 'feminine',
    'business-analyst': 'feminine',
    'qa-engineer': 'feminine',
    'compliance-officer': 'feminine',
    // Masculine-voiced roles
    'legal-expert': 'masculine',
    'security-analyst': 'masculine',
    'financial-analyst': 'masculine',
    'risk-manager': 'masculine',
    'technical-architect': 'masculine',
    'backend-developer': 'masculine',
    'frontend-developer': 'masculine',
    'devops-engineer': 'masculine',
    'project-manager': 'masculine',
    'strategy-analyst': 'masculine',
};

export const VOICE_PROFILES: Record<string, VoiceProfile> = {
    // ===== FEMININE ROLES (Higher pitch) =====
    'creative-director': { pitch: 1.20, rate: 1.10, volume: 1.0, voiceName: 'Google US English Female' },
    'ux-ui-designer': { pitch: 1.15, rate: 1.05, volume: 1.0, voiceName: 'Google UK English Female' },
    'marketing-strategist': { pitch: 1.18, rate: 1.08, volume: 1.0, voiceName: 'Google US English Female' },
    'content-strategist': { pitch: 1.12, rate: 1.05, volume: 1.0, voiceName: 'Google US English Female' },
    'product-manager': { pitch: 1.10, rate: 1.05, volume: 1.0, voiceName: 'Google US English Female' },
    'business-analyst': { pitch: 1.08, rate: 1.00, volume: 1.0, voiceName: 'Google US English Female' },
    'qa-engineer': { pitch: 1.10, rate: 1.00, volume: 1.0, voiceName: 'Google UK English Female' },
    'compliance-officer': { pitch: 1.05, rate: 0.95, volume: 1.0, voiceName: 'Google UK English Female' },

    // ===== MASCULINE ROLES (Lower pitch) =====
    'legal-expert': { pitch: 0.80, rate: 0.90, volume: 1.0, voiceName: 'Google US English' },
    'security-analyst': { pitch: 0.85, rate: 0.90, volume: 1.0, voiceName: 'Google US English' },
    'financial-analyst': { pitch: 0.90, rate: 0.95, volume: 1.0, voiceName: 'Google UK English Male' },
    'risk-manager': { pitch: 0.82, rate: 0.90, volume: 1.0, voiceName: 'Google US English' },
    'technical-architect': { pitch: 0.88, rate: 0.95, volume: 1.0, voiceName: 'Google US English' },
    'backend-developer': { pitch: 0.85, rate: 0.95, volume: 1.0, voiceName: 'Google UK English Male' },
    'frontend-developer': { pitch: 0.92, rate: 1.00, volume: 1.0, voiceName: 'Google US English' },
    'devops-engineer': { pitch: 0.82, rate: 0.92, volume: 1.0, voiceName: 'Google US English' },
    'project-manager': { pitch: 0.90, rate: 1.00, volume: 1.0, voiceName: 'Google UK English Male' },
    'strategy-analyst': { pitch: 0.88, rate: 0.95, volume: 1.0, voiceName: 'Google US English' },

    // ===== DEFAULT =====
    'default': { pitch: 1.00, rate: 1.00, volume: 1.0, voiceName: 'Google US English' },
};

/**
 * Get voice profile for a specific role
 */
export const getVoiceProfile = (roleId: string): VoiceProfile => {
    return VOICE_PROFILES[roleId] || VOICE_PROFILES['default'];
};

/**
 * Get gender for a role (for voice selection)
 */
export const getRoleGender = (roleId: string): VoiceGender => {
    return ROLE_GENDER[roleId] || 'masculine';
};

/**
 * Get available voices from browser, filtered by language
 */
export const getAvailableVoices = (language: 'es' | 'en'): SpeechSynthesisVoice[] => {
    const voices = window.speechSynthesis.getVoices();
    const langCode = language === 'es' ? 'es' : 'en';

    // Prefer Google voices (higher quality)
    const googleVoices = voices.filter(v =>
        v.lang.startsWith(langCode) && v.name.includes('Google')
    );

    if (googleVoices.length > 0) return googleVoices;

    // Fallback to any voice in the language
    return voices.filter(v => v.lang.startsWith(langCode));
};

// Keywords that identify feminine/masculine voices across languages
const FEMININE_KEYWORDS = ['female', 'femenin', 'sabina', 'helena', 'elvira', 'paulina', 'mónica', 'monica', 'woman', 'mujer', 'samantha', 'victoria', 'karen', 'susan', 'allison', 'ava', 'zoe'];
const MASCULINE_KEYWORDS = ['male', 'masculin', 'jorge', 'diego', 'andrés', 'andres', 'pablo', 'man', 'hombre', 'alex', 'daniel', 'david', 'fred', 'thomas', 'oliver', 'nathan'];

/**
 * Select best voice for role, gender-aware and language-aware
 * 
 * Strategy:
 * 1. Get all voices for the target language
 * 2. Classify available voices by gender using name heuristics
 * 3. Pick the best match for the role's gender
 * 4. Fallback: use pitch variation if no gender-specific voice found
 */
export const selectVoiceForRole = (
    roleId: string,
    language: 'es' | 'en'
): SpeechSynthesisVoice | null => {
    const availableVoices = getAvailableVoices(language);

    if (availableVoices.length === 0) {
        console.warn('[VoiceProfiles] No voices available for language:', language);
        return null;
    }

    // If only 1 voice available, just use it (pitch will differentiate)
    if (availableVoices.length === 1) {
        return availableVoices[0];
    }

    const gender = getRoleGender(roleId);
    const nameLower = (v: SpeechSynthesisVoice) => v.name.toLowerCase();

    // Try to find gender-matched voice
    const genderKeywords = gender === 'feminine' ? FEMININE_KEYWORDS : MASCULINE_KEYWORDS;
    const oppositeKeywords = gender === 'feminine' ? MASCULINE_KEYWORDS : FEMININE_KEYWORDS;

    // 1. Best match: voice name contains gender keyword
    const genderMatch = availableVoices.find(v =>
        genderKeywords.some(kw => nameLower(v).includes(kw))
    );
    if (genderMatch) return genderMatch;

    // 2. Exclude opposite gender voices
    const nonOpposite = availableVoices.filter(v =>
        !oppositeKeywords.some(kw => nameLower(v).includes(kw))
    );

    // 3. Use role index to distribute voices across available options
    const roleIndex = Object.keys(VOICE_PROFILES).indexOf(roleId);
    const voicePool = nonOpposite.length > 0 ? nonOpposite : availableVoices;
    const selectedIndex = Math.abs(roleIndex) % voicePool.length;

    return voicePool[selectedIndex];
};
