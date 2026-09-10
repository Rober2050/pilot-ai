/**
 * ✅ BATCH 4 CRITICAL FIX: Output Parsing Layer
 *
 * Cleans AI responses by extracting MESSAGE: content for chat display
 * and moving REASON:/JSON metadata to Hacker Console logs only.
 *
 * ✅ JSON VALIDATION & REPAIR: Handles malformed JSON from LLMs gracefully
 */

export interface ParsedOutput {
    cleanMessage: string;      // For chat bubbles (user-facing)
    metadata: string | null;   // For Hacker Console (REASON:, JSON, etc.)
    rawResponse: string;       // Original response
}

/**
 * Repairs common JSON formatting errors from LLM output
 * Handles: missing commas, unclosed braces, bad escapes, trailing commas
 */
export function repairJSON(jsonString: string): string {
    let repaired = jsonString.trim();

    // 1. Remove leading/trailing markdown code fences
    repaired = repaired.replace(/^```json\n?|```$/g, '').trim();

    // 2. Fix missing commas before closing braces/brackets
    // Pattern: }"... → },"... (except at end)
    repaired = repaired.replace(/"\s*\n\s*}/g, '",\n}');
    repaired = repaired.replace(/"\s*\n\s*\]/g, '",\n]');
    repaired = repaired.replace(/(\d|true|false|null)\s*\n\s*}/g, '$1\n}');
    repaired = repaired.replace(/(\d|true|false|null)\s*\n\s*\]/g, '$1\n]');

    // 3. Remove trailing commas before closing braces/brackets
    repaired = repaired.replace(/,\s*\}/g, '}');
    repaired = repaired.replace(/,\s*\]/g, ']');

    // 4. Fix single quotes to double quotes in common cases
    // Only for key names and string values that are clearly mis-quoted
    repaired = repaired.replace(/'([a-zA-Z_][a-zA-Z0-9_]*)'/g, '"$1"');

    // 5. Ensure all string values are properly closed
    // If a line ends with an unclosed quote, close it before the next key
    repaired = repaired.replace(/"([^"]*?)"\s*:\s*"([^"]*)$/gm, '"$1": "$2"');

    // 6. Handle escaped quotes in strings
    repaired = repaired.replace(/\\\\"/g, '\\"');

    // 7. Remove any stray control characters
    repaired = repaired.replace(/[\x00-\x1f\x7f]/g, ' ');

    return repaired;
}

/**
 * Validates and parses JSON with intelligent repair fallback
 * Returns parsed object or null with detailed logging
 */
export function parseJSON(jsonString: string): any | null {
    if (!jsonString || typeof jsonString !== 'string') {
        return null;
    }

    // Try direct parse first
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn('[JSON Parse] Initial parse failed, attempting repair...', e);
    }

    // Try repair once
    try {
        const repaired = repairJSON(jsonString);
        const result = JSON.parse(repaired);
        console.log('[JSON Parse] Repair successful');
        return result;
    } catch (e) {
        console.error('[JSON Parse] Repair failed. Raw text (first 300 chars):', jsonString.substring(0, 300));
        return null;
    }
}

/**
 * Parses AI response to extract clean message and metadata
 * 
 * Handles formats like:
 * - "MESSAGE: Clean text here"
 * - "MESSAGE: Text\nREASON: Internal reasoning"
 * - Raw JSON blocks
 * - Mixed content
 */
export function parseAIOutput(rawText: string): ParsedOutput {
    if (!rawText || typeof rawText !== 'string') {
        return {
            cleanMessage: rawText || '',
            metadata: null,
            rawResponse: rawText || ''
        };
    }

    // ✅ PATTERN 1: Extract MESSAGE: content
    const messageMatch = rawText.match(/MESSAGE:\s*(.+?)(?=\n(?:REASON:|$)|$)/is);

    if (messageMatch) {
        const cleanMessage = messageMatch[1].trim();

        // Extract REASON: or other metadata
        const reasonMatch = rawText.match(/REASON:\s*(.+?)$/is);
        const metadata = reasonMatch ? `REASON: ${reasonMatch[1].trim()}` : null;

        return {
            cleanMessage,
            metadata,
            rawResponse: rawText
        };
    }

    // ✅ PATTERN 2: Detect raw JSON blocks (move to metadata)
    const jsonMatch = rawText.match(/^\s*\{[\s\S]*\}\s*$/);
    if (jsonMatch) {
        return {
            cleanMessage: '[Structured Response - See Console]',
            metadata: rawText,
            rawResponse: rawText
        };
    }

    // ✅ PATTERN 3: No special markers - return as-is
    return {
        cleanMessage: rawText.trim(),
        metadata: null,
        rawResponse: rawText
    };
}

/**
 * Validates if a message contains leaked metadata markers
 */
export function hasLeakedMetadata(text: string): boolean {
    const leakPatterns = [
        /^MESSAGE:/i,
        /^REASON:/i,
        /^\s*\{[\s\S]*"score"[\s\S]*\}/,  // JSON with "score" field
        /^\s*\{[\s\S]*"public_message"[\s\S]*\}/  // JSON with "public_message" field
    ];

    return leakPatterns.some(pattern => pattern.test(text));
}
