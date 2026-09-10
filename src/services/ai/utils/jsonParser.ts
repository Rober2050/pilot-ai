/**
 * Robust JSON parsing utilities shared across AI providers.
 *
 * LLMs often wrap JSON in markdown fences, prepend explanatory text,
 * or get truncated mid-generation. These helpers extract and validate
 * JSON from raw model output.
 */

/**
 * Returns true if a JSON string was cut off mid-generation (not structurally invalid).
 * Truncation signatures: unbalanced braces/brackets — more opens than closes.
 *
 * Truncation is transient (retryable). Structural errors are deterministic
 * (not retryable). The caller uses this distinction to decide retry strategy.
 */
export function isJsonTruncated(raw: string): boolean {
    const trimmed = raw.trimEnd();
    if (!trimmed) return false;

    let braces = 0;
    let brackets = 0;
    let inString = false;
    let escaped = false;

    for (const ch of trimmed) {
        if (escaped) { escaped = false; continue; }
        if (ch === '\\' && inString) { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') braces++;
        else if (ch === '}') braces--;
        else if (ch === '[') brackets++;
        else if (ch === ']') brackets--;
    }

    return braces > 0 || brackets > 0;
}

/**
 * Extracts a JSON substring from raw LLM output.
 * Handles three common formats:
 *   1. Markdown fenced: ```json {...} ```
 *   2. Plain text with leading/trailing prose: "Here is the result: {...} hope this helps"
 *   3. Pure JSON
 *
 * Returns the most likely JSON substring (caller must still JSON.parse).
 */
export function extractJSONFromText(text: string): string {
    // Strategy 1: Markdown code fence
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = text.match(markdownRegex);
    if (match) return match[1];

    // Strategy 2: First { to last }
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        return text.substring(firstOpen, lastClose + 1);
    }

    // Strategy 3: Return as-is
    return text;
}

/**
 * Unescapes JSON string escape sequences from raw text.
 * Used when JSON.parse fails but we need to recover string content
 * (e.g. HTML prototype with unescaped quotes inside JSON values).
 */
export function unescapeJsonString(str: string): string {
    return str
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
}

/**
 * Extracts HTML prototype from raw text when standard JSON parsing fails.
 * Handles cases where the model returned JSON with unescaped HTML quotes.
 *
 * Returns null if no HTML found.
 */
export function extractPrototypeFromRawText(text: string): string | null {
    const htmlStart = text.indexOf('<!DOCTYPE');
    const htmlStartAlt = text.indexOf('<html');
    const htmlIdx = htmlStart !== -1 ? htmlStart : htmlStartAlt;
    if (htmlIdx === -1) return null;

    const htmlEnd = text.lastIndexOf('</html>');
    const raw = htmlEnd !== -1
        ? text.substring(htmlIdx, htmlEnd + 7)
        : text.substring(htmlIdx);

    if (raw.length < 200) return null;
    return unescapeJsonString(raw);
}

/**
 * Attempts to recover from common JSON parse failures.
 * Returns the parsed object on success, or null if all recovery strategies fail.
 *
 * Recovery strategies:
 *   1. Trailing comma — strip and close
 *   2. Trailing comma + missing brace — strip and add closing brace
 */
export function recoverParseableJSON<T = any>(jsonString: string): T | null {
    const trimmed = jsonString.trim();

    // Trailing comma + close
    if (trimmed.endsWith(',')) {
        try {
            return JSON.parse(trimmed.slice(0, -1) + '}') as T;
        } catch {
            // try next strategy
        }
    }

    return null;
}

/**
 * Closes an incomplete JSON string by appending the minimum characters needed
 * to make it syntactically valid. Useful when an LLM stream is cut off mid-output.
 *
 * Tracks open strings, objects, and arrays using a character-by-character scan.
 * The resulting JSON will parse successfully, though trailing content may be
 * empty strings / empty arrays / empty objects where the model was cut off.
 *
 * Returns the original string unchanged if it is already balanced.
 */
export function closeIncompleteJSON(str: string): string {
    const stack: string[] = [];
    let inString = false;
    let escaped = false;

    for (const ch of str) {
        if (escaped) { escaped = false; continue; }
        if (ch === '\\' && inString) { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') stack.push('}');
        else if (ch === '[') stack.push(']');
        else if (ch === '}' || ch === ']') { if (stack.length > 0) stack.pop(); }
    }

    let result = str;
    // Trim a trailing comma before closing — produces valid JSON for cut-off arrays/objects
    const trimmed = result.trimEnd();
    if (trimmed.endsWith(',')) result = trimmed.slice(0, -1);
    if (inString) result += '"';
    return result + stack.slice().reverse().join('');
}
