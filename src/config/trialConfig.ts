/**
 * Trial Configuration for New Users
 * 
 * Strategy: 3-day Pro trial, then downgrade to Free
 * - Trial: 6 roles (Pro tier) for 3 days
 * - After trial: 2 roles (Free tier)
 */
export const trialConfig = {
    defaultTrialDays: 3,
    defaultPlan: 'pro', // Pro trial for 3 days
    defaultRole: 'user',

    // After trial ends, user downgrades to Free plan
    postTrialPlan: 'free',

    // Default roles for Free tier (after trial or no trial)
    defaultEnabledRoles: ['strategy-analyst', 'product-manager'],
};
