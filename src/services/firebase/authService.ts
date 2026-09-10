/**
 * Auth Service — migrado de Firebase Auth a Supabase Auth.
 *
 * Mantiene la misma interfaz pública (register, login, loginWithGoogle, logout,
 * getUserProfile, etc.) para no romper componentes existentes.
 *
 * El trigger `handle_new_user()` en Supabase crea automáticamente la fila en
 * `public.users` cuando un usuario se registra. Aquí actualizamos campos
 * extra (rol, plan, trial) post-registro.
 */

import { supabase } from './firebaseClient';
import { usersService } from './usersService';

const camelToSnake = (obj: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        const snakeKey = k.replace(/([A-Z])/g, '_$1').toLowerCase();
        out[snakeKey] = v;
    }
    return out;
};

const snakeToCamel = (obj: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        out[camelKey] = v;
    }
    // Provide both `id` and `uid` for legacy compatibility
    if (out.id && !out.uid) out.uid = out.id;
    return out;
};

export const authService = {
    getEmergencyAdmins: (): string[] => {
        try {
            const admins = import.meta.env.VITE_EMERGENCY_ADMINS;
            if (!admins) return [];
            // Allow both JSON array format and comma-separated format
            if (admins.trim().startsWith('[')) return JSON.parse(admins);
            return admins.split(',').map((e: string) => e.trim()).filter(Boolean);
        } catch (e) {
            console.error('Failed to parse VITE_EMERGENCY_ADMINS', e);
            return [];
        }
    },

    isEmergencyAdmin: (email: string | null) => {
        if (!email) return false;
        const admins = authService.getEmergencyAdmins();
        return admins.map(a => a.toLowerCase()).includes(email.toLowerCase());
    },

    register: async (email: string, password: string, name: string) => {
        // 1. Sign up via Supabase Auth — el trigger handle_new_user() creará la fila en public.users
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: name },
            },
        });

        if (error) throw error;
        if (!data.user) throw new Error('Sign up failed: no user returned');

        // 2. Check for invitation
        const invitation = await usersService.claimInvitation(email);

        // 3. Determine role + plan
        let initialRole = invitation ? invitation.role : 'user';
        if (authService.isEmergencyAdmin(email)) {
            initialRole = 'admin';
            console.log(`[Auth] Emergency Admin Access granted for ${email}`);
        }
        const initialPlan = invitation?.planId || 'free';

        // 4. Subscription end date (trial 3 días por defecto)
        let subscriptionEndDate = invitation?.subscriptionEndDate;
        if (!subscriptionEndDate) {
            const trialDays = 3;
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + trialDays);
            subscriptionEndDate = endDate.toISOString();
        }

        // 5. Update user profile en public.users (el row ya fue creado por el trigger)
        const updateData = camelToSnake({
            displayName: name,
            rol: initialRole,
            subscriptionPlan: initialPlan,
            planId: initialPlan,
            subscriptionStatus: 'active',
            subscriptionStartDate: new Date().toISOString(),
            subscriptionEndDate,
            status: 'active',
        });

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', data.user.id);

        if (updateError) {
            console.warn('[Auth] User profile update failed (trigger may not have run yet):', updateError);
            // Fallback: insert directly
            await supabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                ...updateData,
            });
        }

        return {
            uid: data.user.id,
            id: data.user.id,
            email: data.user.email,
            displayName: name,
        };
    },

    login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Login failed: no user returned');
        return {
            uid: data.user.id,
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.user_metadata?.display_name || null,
        };
    },

    loginWithGoogle: async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/app/strategy-hub`,
            },
        });
        if (error) throw error;
        // OAuth redirige; el handler real se ejecuta en AuthContext via onAuthStateChange
        return data;
    },

    sendPasswordReset: async (email: string): Promise<void> => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
    },

    updateDisplayName: async (displayName: string): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        // 1. Update Supabase Auth metadata
        const { error: authError } = await supabase.auth.updateUser({
            data: { display_name: displayName },
        });
        if (authError) throw authError;

        // 2. Update public.users row
        const { error: dbError } = await supabase
            .from('users')
            .update({ display_name: displayName })
            .eq('id', user.id);
        if (dbError) throw dbError;
    },

    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    getUserProfile: async (uid: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .maybeSingle();

        if (error) {
            console.error('[authService.getUserProfile] error:', error);
            return null;
        }
        return data ? snakeToCamel(data) : null;
    },
};
