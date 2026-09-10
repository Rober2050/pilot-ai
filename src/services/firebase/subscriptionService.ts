/**
 * Subscription Service — migrado de Firestore a Supabase.
 * Mapea filas de `public.subscription_plans` a SubscriptionPlan.
 *
 * Nota: en Postgres, el campo `limits` es JSONB y `included_roles` es JSONB array.
 */

import { supabase } from './firebaseClient';

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
    isActive: boolean;
    billingCycle: 'daily' | 'monthly' | 'yearly' | 'lifetime';
    durationValue: number;
    includedRoles: string[];
    maxRoles: number;
    limits: {
        analysesPerMonth: number | 'unlimited';
        maxProjects: number | 'unlimited';
        allowedModels: string[];
    };
}

const TABLE = 'subscription_plans';

const rowToPlan = (row: any): SubscriptionPlan => {
    const limits = row.limits || {};
    const dbAnalyses = limits.analysesPerMonth;
    const dbMaxProjects = limits.maxProjects;
    return {
        id: row.id,
        name: row.name,
        price: Number(row.price ?? 0),
        currency: row.currency ?? 'USD',
        features: Array.isArray(row.features) ? row.features : [],
        isActive: Boolean(row.is_active),
        billingCycle: row.billing_cycle ?? 'monthly',
        durationValue: Number(row.duration_value ?? 1),
        includedRoles: Array.isArray(row.included_roles) ? row.included_roles : [],
        maxRoles: limits.maxRoles ?? 0,
        limits: {
            analysesPerMonth: dbAnalyses === -1 ? 'unlimited' : dbAnalyses ?? 0,
            maxProjects: dbMaxProjects === -1 ? 'unlimited' : dbMaxProjects ?? 0,
            allowedModels: Array.isArray(limits.allowedModels) ? limits.allowedModels : [],
        },
    };
};

const planToRow = (plan: Partial<SubscriptionPlan>): Record<string, any> => {
    const row: Record<string, any> = {};
    if (plan.id !== undefined) row.id = plan.id;
    if (plan.name !== undefined) row.name = plan.name;
    if (plan.price !== undefined) row.price = plan.price;
    if (plan.currency !== undefined) row.currency = plan.currency;
    if (plan.features !== undefined) row.features = plan.features;
    if (plan.isActive !== undefined) row.is_active = plan.isActive;
    if (plan.billingCycle !== undefined) row.billing_cycle = plan.billingCycle;
    if (plan.durationValue !== undefined) row.duration_value = plan.durationValue;
    if (plan.includedRoles !== undefined) row.included_roles = plan.includedRoles;
    if (plan.limits !== undefined || plan.maxRoles !== undefined) {
        row.limits = {
            maxRoles: plan.maxRoles ?? 0,
            analysesPerMonth:
                plan.limits?.analysesPerMonth === 'unlimited' ? -1 : plan.limits?.analysesPerMonth ?? 0,
            maxProjects:
                plan.limits?.maxProjects === 'unlimited' ? -1 : plan.limits?.maxProjects ?? 0,
            allowedModels: plan.limits?.allowedModels ?? [],
        };
    }
    return row;
};

export const subscriptionService = {
    getAllPlans: async (): Promise<SubscriptionPlan[]> => {
        const { data, error } = await supabase.from(TABLE).select('*');
        if (error) {
            console.error('Error getting subscription plans:', error);
            return [];
        }
        return (data || []).map(rowToPlan);
    },

    getPlanById: async (planId: string): Promise<SubscriptionPlan | null> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', planId)
            .maybeSingle();
        if (error) return null;
        return data ? rowToPlan(data) : null;
    },

    createPlan: async (planData: Omit<SubscriptionPlan, 'id'>) => {
        const id = (planData.name || 'plan').toLowerCase().replace(/\s+/g, '-');
        const row = planToRow({ ...planData, id });
        const { error } = await supabase.from(TABLE).insert(row);
        if (error) throw error;
        return { ...planData, id };
    },

    updatePlan: async (id: string, data: Partial<SubscriptionPlan>) => {
        const row = planToRow(data);
        const { error } = await supabase.from(TABLE).update(row).eq('id', id);
        if (error) throw error;
        return { id, ...data };
    },

    initializeDefaultPlans: async () => {
        // No-op: el seed SQL ya inserta los planes por defecto.
    },
};
