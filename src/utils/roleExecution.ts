/**
 * Role execution helpers shared by Strategy Hub: per-role timeouts and the deep
 * patch used when the AI refines a single field of a role's output.
 */

// Per-role analysis timeout (ms). Heavy roles may need a stream continuation after the
// proxy's 150s Edge Function cut (see AnthropicProvider), so they get extra room.
export const ROLE_TIMEOUTS_MS: Record<string, number> = {
    'ux-designer': 10 * 60 * 1000,  // 10 min — full HTML prototype
    'architect': 8 * 60 * 1000,     // 8 min — largest JSON output
};
export const DEFAULT_TIMEOUT_MS = 6 * 60 * 1000; // 6 min for all other roles

// Deep patch: finds each key anywhere in the content tree (not just top level) and updates it.
// Falls back to adding the key at top level if not found. Enables AI patches like { "mvpInScope": [...] }
// to reach deeply nested fields like content.dashboard.productDetails.mvpInScope.
function hasFieldDeep(obj: unknown, key: string): boolean {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
    if (key in (obj as Record<string, unknown>)) return true;
    return Object.values(obj as Record<string, unknown>).some(v => hasFieldDeep(v, key));
}

function setFieldDeep(obj: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
    if (key in obj) return { ...obj, [key]: value };
    for (const k of Object.keys(obj)) {
        const child = obj[k];
        if (typeof child === 'object' && child !== null && !Array.isArray(child) &&
            hasFieldDeep(child, key)) {
            return { ...obj, [k]: setFieldDeep(child as Record<string, unknown>, key, value) };
        }
    }
    return { ...obj, [key]: value }; // not found anywhere — add at top level
}

export function applyDeepPatch(content: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
    let result = { ...content };
    for (const [key, value] of Object.entries(patch)) {
        result = setFieldDeep(result, key, value);
    }
    return result;
}
