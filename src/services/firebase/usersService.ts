/**
 * Users Service — migrado de Firestore a Supabase.
 *
 * Mantiene la interfaz pública existente (getAllUsers, getUserById, createUser,
 * updateUser, deleteUser, claimInvitation, ensureUserDocumentExists, etc.).
 *
 * Notas de migración:
 *  - `deduplicateUserDocuments` se vuelve no-op (PRIMARY KEY impide duplicados).
 *  - `cleanupAllDuplicates` también queda como no-op por el mismo motivo.
 *  - El trigger `handle_new_user()` en Supabase crea automáticamente la fila en
 *    `public.users` cuando un usuario se registra en `auth.users`.
 */

import { supabase } from './firebaseClient';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    rol: 'admin' | 'user';
    subscriptionPlan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'disabled';
    createdAt: string;
    photoURL?: string | null;
    lastLogin?: string;
    subscriptionStatus?: 'active' | 'expired' | 'cancelled';
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    planId?: string;
    trial_count?: number;
    trial_completed?: boolean;
    squad_roles?: string[];
}

const camelToSnake = (obj: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;
        // Preserve `uid`/`id` correctly
        if (k === 'uid') {
            out['id'] = v;
            continue;
        }
        const snakeKey = k.replace(/([A-Z])/g, '_$1').toLowerCase();
        out[snakeKey] = v;
    }
    return out;
};

const snakeToCamel = (obj: Record<string, any>): UserProfile => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        out[camelKey] = v;
    }
    if (out.id && !out.uid) out.uid = out.id;
    return out as UserProfile;
};

export const usersService = {
    getAllUsers: async (): Promise<UserProfile[]> => {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            console.error('Error getting users:', error);
            throw error;
        }
        return (data || []).map(snakeToCamel);
    },

    getUserById: async (uid: string): Promise<UserProfile | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .maybeSingle();
        if (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
        return data ? snakeToCamel(data) : null;
    },

    createUser: async (user: Omit<UserProfile, 'createdAt'>) => {
        const now = new Date().toISOString();
        const payload = camelToSnake({ ...user, createdAt: now });
        const { error } = await supabase.from('users').insert(payload);
        if (error) {
            console.error('Error creating user:', error);
            throw error;
        }
        return { ...user, createdAt: now };
    },

    updateUser: async (uid: string, data: Partial<UserProfile>) => {
        const payload = camelToSnake(data);
        const { error } = await supabase.from('users').update(payload).eq('id', uid);
        if (error) {
            console.error('Error updating user:', error);
            throw error;
        }
        return { uid, ...data };
    },

    getUserByEmail: async (email: string): Promise<UserProfile | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email)
            .maybeSingle();
        if (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
        return data ? snakeToCamel(data) : null;
    },

    deleteUser: async (uid: string) => {
        // Get email first for invitation cleanup
        const { data: userRow } = await supabase
            .from('users')
            .select('email')
            .eq('id', uid)
            .maybeSingle();

        // Delete user row (RLS allows admin via emergency admin or via service role)
        const { error } = await supabase.from('users').delete().eq('id', uid);
        if (error) {
            console.error('Error deleting user:', error);
            throw error;
        }

        // Also delete any pending invitation for that email
        if (userRow?.email) {
            await supabase.from('invitations').delete().ilike('email', userRow.email);
        }

        // Note: deleting from auth.users requires service_role key (admin SDK)
        // which is not available in the browser. Must be done from Supabase dashboard
        // or via an Edge Function with service_role.
        console.warn(`⚠️ Remember to delete ${userRow?.email} from Supabase Auth manually (or via Edge Function)!`);
    },

    createInvitation: async (
        email: string,
        role: string,
        displayName: string,
        planId?: string,
        expirationDate?: string | null,
    ) => {
        const payload = {
            email: email.toLowerCase(),
            display_name: displayName,
            plan_id: planId || 'free',
            role,
            status: 'pending',
            subscription_end_date: expirationDate || null,
        };
        const { error } = await supabase.from('invitations').upsert(payload, { onConflict: 'email' });
        if (error) {
            console.error('Error creating invitation:', error);
            throw error;
        }
        return true;
    },

    updateTrialData: async (
        uid: string,
        data: Partial<Pick<UserProfile, 'trial_count' | 'trial_completed' | 'squad_roles'>>,
    ) => {
        const { error } = await supabase.from('users').update(data).eq('id', uid);
        if (error) console.error('Error updating trial data:', error);
    },

    claimInvitation: async (email: string) => {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .ilike('email', email)
            .maybeSingle();

        if (error) {
            console.error('Error claiming invitation:', error);
            return null;
        }
        if (!data) return null;
        // Map snake_case → camelCase for compat with authService
        return {
            email: data.email,
            displayName: data.display_name,
            planId: data.plan_id,
            role: data.role,
            status: data.status,
            subscriptionEndDate: data.subscription_end_date,
        };
    },

    /**
     * No-op en Postgres: el PRIMARY KEY impide duplicados por UID.
     * Se mantiene la firma para compatibilidad.
     */
    deduplicateUserDocuments: async (
        uid: string,
        _email: string,
        _isAdmin: boolean = false,
    ): Promise<string> => uid,

    /**
     * Garantiza que existe una fila en public.users para el UID dado.
     * Si no existe (caso raro: trigger falló), la crea con valores por defecto.
     */
    ensureUserDocumentExists: async (
        uid: string,
        email: string,
        displayName?: string | null,
        photoURL?: string | null,
    ): Promise<void> => {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('id', uid)
            .maybeSingle();

        if (existing) return;

        const trialEndDate = (() => {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            return d.toISOString();
        })();

        const payload = {
            id: uid,
            email: email.toLowerCase(),
            display_name: displayName || email.split('@')[0],
            // Note: photoURL is NOT in our schema, but included as user_metadata in auth.users
            rol: 'user',
            subscription_plan: 'free',
            plan_id: 'free',
            subscription_status: 'active',
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: trialEndDate,
            status: 'active',
        };
        // photoURL handled in auth.users.user_metadata, not public.users
        void photoURL;

        const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
        if (error) console.error('[Ensure] Error ensuring user document:', error);
    },

    /**
     * No-op en Postgres por la misma razón que deduplicateUserDocuments.
     */
    cleanupAllDuplicates: async (): Promise<{ cleaned: number; total: number; details: string[] }> => {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        return {
            cleaned: 0,
            total: count || 0,
            details: ['Postgres PRIMARY KEY impide duplicados — no es necesario limpiar'],
        };
    },
};
