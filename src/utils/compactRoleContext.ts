/**
 * Builds the "Previous Analyses" block that each role receives.
 *
 * Every role used to get the FULL JSON of every earlier role. By the 6th role
 * (Architect) that exceeded the proxy's 400k-char input cap and the request
 * was rejected with HTTP 413 before reaching the model. Later roles only need
 * the gist of earlier analyses, so the outputs are compacted to fit a budget:
 * long strings are trimmed, long lists are cut, and embedded artifacts
 * (HTML prototypes, code, images) are omitted.
 */

export interface PreviousRoleOutput {
    role: string;
    output: unknown;
}

/** Leaves room for the system prompt and the rest of the user prompt under the proxy cap. */
export const PREVIOUS_CONTEXT_BUDGET_CHARS = 180_000;

interface CompactLimits {
    maxStringChars: number;
    maxArrayItems: number;
}

/** Progressively stricter passes; the first one that fits the budget wins. */
const PASSES: CompactLimits[] = [
    { maxStringChars: 2_000, maxArrayItems: 15 },
    { maxStringChars: 800, maxArrayItems: 8 },
    { maxStringChars: 300, maxArrayItems: 5 },
];

const ARTIFACT_KEY = /html|code|svg|base64|image|prototype|markup/i;
const ARTIFACT_MIN_CHARS = 1_000;

function compactValue(value: unknown, limits: CompactLimits, key = ''): unknown {
    if (typeof value === 'string') {
        if (ARTIFACT_KEY.test(key) && value.length > ARTIFACT_MIN_CHARS) {
            return '[artifact omitted]';
        }
        return value.length > limits.maxStringChars
            ? `${value.slice(0, limits.maxStringChars)}…`
            : value;
    }
    if (Array.isArray(value)) {
        const kept = value.slice(0, limits.maxArrayItems).map(item => compactValue(item, limits, key));
        if (value.length > limits.maxArrayItems) {
            kept.push(`[+${value.length - limits.maxArrayItems} more]`);
        }
        return kept;
    }
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = compactValue(v, limits, k);
        }
        return out;
    }
    return value;
}

export function buildPreviousRolesContext(
    entries: PreviousRoleOutput[],
    budgetChars: number = PREVIOUS_CONTEXT_BUDGET_CHARS,
): string {
    const full = JSON.stringify(entries);
    if (full.length <= budgetChars) return full;

    for (const limits of PASSES) {
        const compacted = JSON.stringify(entries.map(e => ({
            role: e.role,
            output: compactValue(e.output, limits),
        })));
        if (compacted.length <= budgetChars) return compacted;
    }

    // Last resort: an equal share of the budget per role.
    const share = Math.floor(budgetChars / Math.max(entries.length, 1)) - 100;
    const strictest = PASSES[PASSES.length - 1];
    return `[${entries.map(e => {
        const json = JSON.stringify({ role: e.role, output: compactValue(e.output, strictest) });
        return json.length > share ? JSON.stringify({ role: e.role, summary: `${json.slice(0, share)}…` }) : json;
    }).join(',')}]`;
}
