import { auth } from '../services/firebase/firebaseClient';

/**
 * Get the display name for the current user
 * 
 * Priority:
 * 1. Firebase Auth displayName (if available)
 * 2. "Tú" (Spanish) or "You" (English) as fallback
 * 
 * @param lang - Current language ('es' | 'en')
 * @returns Display name for the user
 */
export const getUserDisplayName = (lang: 'es' | 'en' = 'es'): string => {
    const user = auth.currentUser;

    // Try to get displayName from Firebase Auth
    if (user?.displayName) {
        return user.displayName;
    }

    // Fallback to localized "You"
    return lang === 'es' ? 'Tú' : 'You';
};

/**
 * Get the user ID for the current user
 * Returns 'user' as default if not authenticated
 */
export const getUserId = (): string => {
    const user = auth.currentUser;
    return user?.uid || 'user';
};
