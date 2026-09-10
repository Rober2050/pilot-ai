/**
 * Analytics Service — migrado de Firestore a Supabase.
 *
 * En Firestore vivía en `analytics/trial_feedback/entries`. Aquí se mapea a
 * la tabla `audit_logs` con type='trial_feedback' (esquema flexible vía JSONB
 * en `details`).
 */

import { supabase } from './firebaseClient';

export interface TrialFeedback {
    user_id: string;
    project_id: string;
    sentiment: 'magia' | 'util' | 'basico';
    user_profile: 'technical' | 'business';
    selected_experts: string[];
    reward_role: string;
    timestamp?: any;
}

export interface TrialFeedbackRecord extends Omit<TrialFeedback, 'timestamp'> {
    id: string;
    timestamp?: string;
}

const TABLE = 'audit_logs';

export const analyticsService = {
    // Fire-and-forget: nunca se await en hot path UI
    saveTrialFeedback: (data: TrialFeedback): void => {
        supabase
            .from(TABLE)
            .insert({
                type: 'trial_feedback',
                level: 'info',
                user_id: data.user_id,
                source: 'analytics',
                details: {
                    project_id: data.project_id,
                    sentiment: data.sentiment,
                    user_profile: data.user_profile,
                    selected_experts: data.selected_experts,
                    reward_role: data.reward_role,
                },
            })
            .then(({ error }) => {
                if (error) console.error('analyticsService: save failed', error);
            });
    },

    getAllFeedback: async (): Promise<TrialFeedbackRecord[]> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('type', 'trial_feedback')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('analyticsService: get failed', error);
            return [];
        }
        return (data || []).map((row: any) => ({
            id: row.id,
            user_id: row.user_id ?? '',
            project_id: row.details?.project_id ?? '',
            sentiment: row.details?.sentiment,
            user_profile: row.details?.user_profile,
            selected_experts: row.details?.selected_experts || [],
            reward_role: row.details?.reward_role,
            timestamp: row.created_at,
        }));
    },
};
