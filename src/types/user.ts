export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    rol: 'admin' | 'user';
    subscriptionPlan: string;
    status: 'active' | 'inactive';
    createdAt: string;
    photoURL?: string | null;
    // Trial / Beta system
    trial_count?: number;
    trial_completed?: boolean;
    squad_roles?: string[];
}
