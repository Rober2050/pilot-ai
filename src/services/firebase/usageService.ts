/**
 * Usage Service — migrado de Firestore (`usage_logs`) a Supabase (`audit_logs`).
 *
 * Trackea analysis_run / project_create por usuario y mes.
 * Mapeo: tabla audit_logs con type='analysis_run' o 'project_create',
 *       user_id = uid del usuario, details = JSONB con metadata.
 */

import { supabase } from './firebaseClient';
import { subscriptionService } from './subscriptionService';
import { loggingService } from './loggingService';

const TABLE = 'audit_logs';

export const usageService = {
    /**
     * Verifica si el usuario alcanzó su límite mensual de análisis.
     */
    checkAnalysisLimit: async (
        userId: string,
        planId: string,
    ): Promise<{ allowed: boolean; currentUsage: number; limit: number | 'unlimited'; checkFailed?: boolean }> => {
        try {
            const plan = await subscriptionService.getPlanById(planId);
            const limit = plan?.limits?.analysesPerMonth;

            if (!limit || limit === 'unlimited') {
                return { allowed: true, currentUsage: 0, limit: 'unlimited' };
            }

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { count, error } = await supabase
                .from(TABLE)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('type', 'analysis_run')
                .gte('created_at', startOfMonth);

            if (error) {
                // Fail CLOSED: an unverifiable quota must not grant free usage.
                console.error('[usageService] Usage check failed — blocking until it can be verified:', error);
                return { allowed: false, currentUsage: 0, limit: 0, checkFailed: true };
            }

            const currentUsage = count || 0;
            return { allowed: currentUsage < limit, currentUsage, limit };
        } catch (error) {
            console.error('[usageService] Usage check failed — blocking until it can be verified:', error);
            return { allowed: false, currentUsage: 0, limit: 0, checkFailed: true };
        }
    },

    trackUsage: async (
        userId: string,
        type: 'analysis_run' | 'project_create',
        details?: any,
    ) => {
        try {
            const { error } = await supabase.from(TABLE).insert({
                type,
                level: 'info',
                user_id: userId,
                details: details ? JSON.parse(JSON.stringify(details)) : null,
                source: 'usage_service',
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error tracking usage:', error);
            await loggingService.logError('usage_service', 'failed_to_track', { userId, type, error });
        }
    },
};
