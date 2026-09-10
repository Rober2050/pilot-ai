/**
 * Waitlist Service — migrado de Firestore a Supabase.
 * Tabla: `public.waitlist`.
 */

import { supabase } from './firebaseClient';
import { loggingService } from './loggingService';

export interface WaitlistEntry {
    id?: string;
    email: string;
    plan: string;
    createdAt: string;
    status: 'pending' | 'notified';
    source: string;
}

export class WaitlistDuplicateError extends Error {
    constructor() {
        super('duplicate');
        this.name = 'WaitlistDuplicateError';
    }
}

const TABLE = 'waitlist';

export const waitlistService = {
    addEntry: async (email: string, plan: string): Promise<void> => {
        const normalizedEmail = email.trim().toLowerCase();
        try {
            const { data: existing } = await supabase
                .from(TABLE)
                .select('id')
                .ilike('email', normalizedEmail)
                .limit(1);
            if (existing && existing.length > 0) throw new WaitlistDuplicateError();

            const { error } = await supabase.from(TABLE).insert({
                email: normalizedEmail,
                plan,
                status: 'pending',
                source: 'pricing_page',
            });
            if (error) throw error;
        } catch (error) {
            if (error instanceof WaitlistDuplicateError) throw error;
            await loggingService.logError(
                'waitlistService',
                'Failed to add waitlist entry',
                error,
            );
            throw error;
        }
    },

    getAllEntries: async (): Promise<WaitlistEntry[]> => {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map((row: any) => ({
                id: row.id,
                email: row.email,
                plan: row.plan,
                status: row.status,
                source: row.source ?? '',
                createdAt: row.created_at,
            }));
        } catch (error) {
            await loggingService.logError(
                'waitlistService',
                'Failed to fetch waitlist entries',
                error,
            );
            return [];
        }
    },
};
