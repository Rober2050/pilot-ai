import { BaseAIProvider } from "../base/AIProvider";
import {
    AIAuthenticationError,
    AIInvalidResponseError,
    AIRateLimitError,
    AITimeoutError,
    AITruncatedResponseError,
} from "../errors/AIErrors";
import { supabase, SUPABASE_URL } from "../../firebase/firebaseClient";
import { loggingService } from "../../firebase/loggingService";
import { GenerationOptions } from '../../../types/ai';
import { extractJSONFromText, isJsonTruncated, recoverParseableJSON, closeIncompleteJSON } from '../utils/jsonParser';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
/**
 * Aligned with GeminiProvider's maxOutputTokens (65536) — Product Manager,
 * Architect and other complex roles routinely produce 30K-50K tokens of
 * structured JSON dashboards. Haiku 4.5 supports up to 64K output tokens.
 *
 * If we ever truncate at this size, the prompt itself is over-spec'd —
 * not a token-budget problem.
 */
const MAX_TOKENS = 64000;

/** Maps non-Anthropic model IDs to our default Haiku model. */
function resolveModel(modelName: string): string {
    if (modelName?.startsWith('claude')) return modelName;
    return DEFAULT_MODEL;
}

interface AnthropicContentBlock {
    type: 'text' | 'tool_use';
    text?: string;
    name?: string;
    input?: any;
    /** Raw partial_json accumulated during streaming — used for diagnostics if input parse fails. */
    _rawJSON?: string;
}

interface AnthropicResponse {
    content?: AnthropicContentBlock[];
    stop_reason?: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
    usage?: { input_tokens: number; output_tokens: number };
    error?: { type: string; message: string };
}

interface CallProxyOptions {
    tools?: any[];
    tool_choice?: any;
    prefillJSON?: boolean;
}

/**
 * The "submit_role_analysis" tool — the ONLY mechanism that GUARANTEES Claude
 * returns valid JSON. Without this, Claude can decide to write markdown prose
 * (### headers, tables) instead of JSON when the prompt is rich in structure.
 *
 * With `tool_choice` set to `{ type: 'tool', name: ... }`, the Anthropic API
 * itself validates the model's output as JSON before responding. The model
 * is physically constrained — it cannot escape into prose.
 *
 * `additionalProperties: true` lets the prompt define the exact structure
 * without us having to encode every role's schema here.
 */
const SUBMIT_ANALYSIS_TOOL = {
    name: 'submit_role_analysis',
    description: 'Submit the complete structured analysis for the assigned role.',
    input_schema: {
        type: 'object',
        required: ['analysis'],
        properties: {
            analysis: {
                type: 'object',
                // The description is what the model reads to understand what to put here.
                // Explicit "ALL required fields" + "no empty arrays" is critical —
                // without this, the model submits {} because properties:{} gave no guidance.
                description: 'The complete, fully-populated JSON analysis object as defined in the system prompt. Must include ALL required fields with real, substantive data based on the project context — no empty arrays, no placeholder text, no truncation.',
                additionalProperties: true,
            },
        },
    },
};
const SUBMIT_ANALYSIS_TOOL_CHOICE = { type: 'tool', name: 'submit_role_analysis' };

/**
 * Routes all Anthropic API calls through a Supabase Edge Function.
 * The actual API key lives in Supabase secrets — never in the browser bundle.
 */
export class AnthropicProvider extends BaseAIProvider {
    name = 'Anthropic';
    providerId = 'anthropic';

    async isAvailable(): Promise<boolean> {
        // Available as long as the user has an active session (Edge Function handles auth)
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }

    async generateText(
        modelName: string,
        systemPrompt: string,
        userPrompt: string,
        _options?: GenerationOptions,
    ): Promise<string> {
        const model = resolveModel(modelName);
        return this.retryOperation(async () => {
            const response = await this.callProxy(model, systemPrompt, userPrompt, MAX_TOKENS);
            const text = response.content?.[0]?.text ?? '';
            this.recordSuccess();
            return text;
        });
    }

    async generateJSON<T>(
        modelName: string,
        systemPrompt: string,
        userPrompt: string,
        _options?: GenerationOptions,
    ): Promise<T> {
        const model = resolveModel(modelName);
        // JSON forcing strategy after exhaustive testing with Claude Haiku 4.5:
        //
        // Tool Use with generic schema → model calls tool with {} (15 tokens, no content).
        // Assistant prefill only → model ignores prefill when system prompt is markdown-heavy.
        //
        // Solution: JSON directive in USER message (higher attention than system prompt tail)
        // + prefill '{' (forces first generated byte to be JSON).
        // The user message is the last thing the model "hears" before responding,
        // so format instructions there override the markdown style of the long system prompt.
        const jsonEnforcedUserPrompt =
            `${userPrompt}\n\n` +
            `RESPONSE FORMAT — MANDATORY:\n` +
            `Return your complete analysis as a valid JSON object ONLY.\n` +
            `- Start your response with { and end with }.\n` +
            `- Do NOT use markdown, headings (### ...), or prose.\n` +
            `- Every field from your instructions must appear with real, substantive data.`;

        return this.retryOperation(async () => {
            const response = await this.callProxy(
                model, systemPrompt, jsonEnforcedUserPrompt, MAX_TOKENS, { prefillJSON: true },
            );
            const raw = response.content?.find(c => c.type === 'text')?.text ?? '';

            // Prefill injected '{' as the first assistant token. The SSE stream
            // starts AFTER the prefill, so we prepend it before parsing.
            const withBrace = raw.startsWith('{') ? raw : `{${raw}`;
            const jsonString = extractJSONFromText(withBrace);

            try {
                const parsed = JSON.parse(jsonString);
                this.recordSuccess();
                return parsed as T;
            } catch (parseError) {
                // Recovery tier 1: strip trailing comma
                const recovered = recoverParseableJSON<T>(jsonString);
                if (recovered !== null) {
                    this.recordSuccess();
                    return recovered;
                }

                // Recovery tier 2: close incomplete JSON structures (stream cut off mid-output).
                // This happens when the model generates large JSON (30K-60K chars) and the stream
                // is interrupted. We close dangling strings/arrays/objects so JSON.parse succeeds
                // on the partial response — partial data is always better than an error.
                const repaired = closeIncompleteJSON(jsonString);
                if (repaired !== jsonString) {
                    try {
                        const partial = JSON.parse(repaired) as T;
                        if (partial && typeof partial === 'object' && Object.keys(partial as any).length > 0) {
                            console.warn('[AnthropicProvider] Recovered partial JSON', {
                                model,
                                originalLength: jsonString.length,
                                repairedLength: repaired.length,
                                stopReason: response.stop_reason,
                                outputTokens: response.usage?.output_tokens,
                            });
                            this.recordSuccess();
                            return partial;
                        }
                    } catch {
                        // fall through to error handling
                    }
                }

                const outputTokens = response.usage?.output_tokens ?? 0;
                const stopReason = response.stop_reason;

                if (stopReason === 'max_tokens') {
                    console.error('[AnthropicProvider] max_tokens exceeded', { model, outputTokens });
                    this.recordFailure(parseError as Error);
                    throw new AIInvalidResponseError(
                        this.providerId,
                        `Response exceeded max_tokens (${MAX_TOKENS}).`,
                        parseError,
                    );
                }

                if (stopReason === 'end_turn' || stopReason === 'stop_sequence') {
                    console.error('[AnthropicProvider] end_turn but JSON invalid', {
                        model, stopReason, outputTokens,
                        rawStart: raw.slice(0, 400),
                        rawTail: raw.slice(-400),
                    });
                    loggingService.logError('AnthropicProvider', 'Invalid JSON at end_turn', {
                        model, stopReason, outputTokens, rawLength: raw.length,
                    }).catch(() => { /* best-effort */ });
                    this.recordFailure(parseError as Error);
                    throw new AIInvalidResponseError(
                        this.providerId,
                        `Model finished (${stopReason}) but returned invalid JSON (${raw.length} chars). Start: ${raw.slice(0, 120)}`,
                        parseError,
                    );
                }

                if (isJsonTruncated(jsonString)) {
                    throw new AITruncatedResponseError(this.providerId, parseError);
                }

                this.recordFailure(parseError as Error);
                throw new AIInvalidResponseError(
                    this.providerId,
                    `Failed to parse JSON. Raw preview: ${raw.slice(0, 120)}`,
                    parseError,
                );
            }
        });
    }

    /**
     * Calls Anthropic via the Supabase Edge Function proxy using STREAMING SSE.
     *
     * Why streaming: complex roles produce 30K-60K tokens which take 60-90s to
     * generate. Without streaming the Supabase gateway times out at 30s (FREE)
     * or 150s (Pro). With streaming, bytes start flowing within ~1s and the
     * connection stays healthy regardless of total duration — same pattern that
     * Claude.ai and ChatGPT use.
     *
     * We accumulate SSE `content_block_delta` events into the final text, then
     * synthesize an AnthropicResponse-shaped object so the rest of the provider
     * (JSON parsing, truncation detection, error mapping) stays unchanged.
     */
    private async callProxy(
        model: string,
        systemPrompt: string,
        userPrompt: string,
        maxTokens: number,
        options?: CallProxyOptions,
    ): Promise<AnthropicResponse> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new AIAuthenticationError(this.providerId, 'No active session — please log in');
        }

        // SUPABASE_URL ya viene saneada (sin espacios ni barra final) desde
        // firebaseClient — evita el bug de URL malformada que colgaba el proxy.
        const proxyUrl = `${SUPABASE_URL}/functions/v1/anthropic-proxy`;

        // Build messages. If prefillJSON is set, inject an assistant turn starting
        // with '{' so the model's first generated token must continue valid JSON.
        const messages: Array<{ role: string; content: string }> = [
            { role: 'user', content: userPrompt },
        ];
        if (options?.prefillJSON) {
            messages.push({ role: 'assistant', content: '{' });
        }

        const requestBody: Record<string, any> = {
            model,
            max_tokens: maxTokens,
            stream: true,
            system: systemPrompt,
            messages,
        };
        if (options?.tools) requestBody.tools = options.tools;
        if (options?.tool_choice) requestBody.tool_choice = options.tool_choice;

        let res: Response;
        try {
            res = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(requestBody),
            });
        } catch (networkError: any) {
            this.recordFailure(networkError);
            throw networkError;
        }

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            this.handleHTTPError(res.status, body);
        }

        if (!res.body) {
            throw new Error('[AnthropicProvider] Empty response body from proxy');
        }

        return this.consumeSSEStream(res.body);
    }

    /**
     * Reads an Anthropic SSE stream and reconstructs the equivalent of a buffered
     * Messages API response. Event types we care about:
     *   - content_block_delta: { delta: { type: 'text_delta', text: '...' } }
     *   - message_delta:        { delta: { stop_reason: '...' }, usage: { output_tokens } }
     *   - message_start:        { message: { usage: { input_tokens } } }
     *   - error:                { error: { type, message } }
     */
    private async consumeSSEStream(body: ReadableStream<Uint8Array>): Promise<AnthropicResponse> {
        const reader = body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        // Anthropic streams content as an ordered sequence of "content blocks". Each
        // block has an index and a type — 'text' or 'tool_use'. Deltas reference the
        // currently-open block. We track blocks by index so multi-block responses work.
        const blocks: Record<number, { type: 'text' | 'tool_use'; text: string; toolName?: string; toolJSON: string }> = {};
        let stopReason: AnthropicResponse['stop_reason'] = 'end_turn';
        let inputTokens = 0;
        let outputTokens = 0;
        let streamError: { type: string; message: string } | null = null;

        const ensureBlock = (idx: number, type: 'text' | 'tool_use', toolName?: string) => {
            if (!blocks[idx]) {
                blocks[idx] = { type, text: '', toolJSON: '', toolName };
            }
            return blocks[idx];
        };

        const processSSEChunk = (chunk: string) => {
            const events = chunk.split('\n\n');
            for (const rawEvent of events) {
                const dataLine = rawEvent.split('\n').find(l => l.startsWith('data: '));
                if (!dataLine) continue;

                const payload = dataLine.slice(6).trim();
                if (!payload || payload === '[DONE]') continue;

                try {
                    const evt = JSON.parse(payload);

                    if (evt.type === 'content_block_start') {
                        const idx = evt.index ?? 0;
                        const blockType = evt.content_block?.type === 'tool_use' ? 'tool_use' : 'text';
                        ensureBlock(idx, blockType, evt.content_block?.name);
                    } else if (evt.type === 'content_block_delta') {
                        const idx = evt.index ?? 0;
                        if (evt.delta?.type === 'text_delta') {
                            const block = ensureBlock(idx, 'text');
                            block.text += evt.delta.text ?? '';
                        } else if (evt.delta?.type === 'input_json_delta') {
                            const block = ensureBlock(idx, 'tool_use');
                            block.toolJSON += evt.delta.partial_json ?? '';
                        }
                    } else if (evt.type === 'message_start') {
                        inputTokens = evt.message?.usage?.input_tokens ?? inputTokens;
                        if (evt.message?.usage?.output_tokens) {
                            outputTokens = evt.message.usage.output_tokens;
                        }
                    } else if (evt.type === 'message_delta') {
                        if (evt.delta?.stop_reason) stopReason = evt.delta.stop_reason;
                        if (typeof evt.usage?.output_tokens === 'number') {
                            outputTokens = evt.usage.output_tokens;
                        }
                        if (typeof evt.usage?.input_tokens === 'number') {
                            inputTokens = evt.usage.input_tokens;
                        }
                    } else if (evt.type === 'error') {
                        streamError = evt.error;
                    }
                    // content_block_stop / message_stop: nothing to do
                } catch {
                    // Malformed event — skip. Anthropic occasionally sends keep-alive comments.
                }
            }
        };

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // SSE events are delimited by double newlines.
                const events = buffer.split('\n\n');
                buffer = events.pop() ?? ''; // last (possibly incomplete) chunk

                processSSEChunk(events.join('\n\n'));
            }

            // Flush any remaining data in the buffer after the stream closes.
            // The `message_delta` event (with real stop_reason + output_tokens) often
            // arrives in the final chunk and stays in `buffer` when `done = true` breaks
            // the loop before the buffer is processed. Without this flush, stopReason
            // defaults to 'end_turn' and outputTokens stays at 4 (from message_start).
            if (buffer.trim()) {
                processSSEChunk(buffer);
                buffer = '';
            }
        } finally {
            reader.releaseLock();
        }

        if (streamError !== null) {
            const err = streamError as { type: string; message: string };
            this.recordFailure(new Error(err.message));
            throw new Error(`[Anthropic API] ${err.type}: ${err.message}`);
        }

        // Materialize blocks in index order
        const content: AnthropicContentBlock[] = Object.keys(blocks)
            .map(k => parseInt(k, 10))
            .sort((a, b) => a - b)
            .map(idx => {
                const b = blocks[idx];
                if (b.type === 'tool_use') {
                    let parsedInput: any = null;
                    try {
                        parsedInput = b.toolJSON ? JSON.parse(b.toolJSON) : {};
                    } catch {
                        parsedInput = null; // caller handles diagnostics via _rawJSON
                    }
                    return { type: 'tool_use', name: b.toolName, input: parsedInput, _rawJSON: b.toolJSON };
                }
                return { type: 'text', text: b.text };
            });

        return {
            content,
            stop_reason: stopReason,
            usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        };
    }

    private handleHTTPError(status: number, body: any): never {
        const msg = body?.error?.message ?? body?.error ?? body?.message ?? `HTTP ${status}`;
        this.recordFailure(new Error(String(msg)));

        if (status === 401) throw new AIAuthenticationError(this.providerId, String(msg));
        if (status === 429) throw new AIRateLimitError(this.providerId, String(msg));
        if (status === 408) throw new AITimeoutError(this.providerId, String(msg));

        // 504/546 = Supabase Edge Function wall-clock limit exceeded.
        // Deterministic for this prompt size — retrying burns another 30s and triggers 429.
        // Surface as non-retryable so the caller fails fast.
        if (status === 504 || status === 546) {
            throw new AIInvalidResponseError(
                this.providerId,
                `Edge Function timeout (${status}): the role prompt generates too much output for the current plan limits. ` +
                `Supabase FREE plan has a 30s wall-clock limit. Upgrade to Pro (150s) or reduce role prompt size.`,
            );
        }

        throw new Error(`[AnthropicProvider] ${status}: ${msg}`);
    }
}
