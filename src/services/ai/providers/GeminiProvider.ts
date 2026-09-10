import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseAIProvider } from "../base/AIProvider";
import { AIAuthenticationError, AIInvalidResponseError, AIRateLimitError, AITimeoutError, AITruncatedResponseError } from "../errors/AIErrors";
import { aiModelsService } from "../../firebase/aiModelsService";
import { loggingService } from "../../firebase/loggingService";
import { configService } from "../../firebase/configService";
import { GenerationOptions } from '../../../types/ai';

/**
 * Fallback model chain when the primary model returns 503 (overloaded).
 * Order matters: fastest/most-available first, most-capable last resort.
 */
const FALLBACK_MODEL_CHAIN = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
];

/**
 * Returns true if a JSON string was cut off mid-generation (not structurally invalid).
 * Truncation signatures: string ends without closing braces/brackets,
 * or the last token is an unfinished key/value.
 */
function isJsonTruncated(raw: string): boolean {
    const trimmed = raw.trimEnd();
    if (!trimmed) return false;

    // Count unmatched braces/brackets — truncated JSON will have more opens than closes
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

/** Returns true if the error is a Google 503 "high demand" overload */
function is503Overload(error: any): boolean {
    const msg = error?.message || '';
    return msg.includes('503') || msg.includes('high demand') || msg.includes('overloaded');
}

/** Waits for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Unescapes JSON string escape sequences from raw text that was extracted
 * directly from a JSON string value (bypassing JSON.parse).
 *
 * When Gemini returns {"prototype": "<!DOCTYPE html>\n<body>..."} and JSON.parse
 * fails (due to unescaped quotes inside the HTML), our fallback extracts the
 * raw text which still has literal \n, \t, \" sequences. Without this,
 * the HTML renders broken (\n shown as literal text, " missing, etc.)
 */
function unescapeJsonString(str: string): string {
    return str
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
}

/**
 * Extracts the prototype HTML from a JSON string without relying on JSON.parse.
 * Handles the common case where Gemini includes unescaped double-quotes inside
 * the HTML (e.g. class="container") that break standard JSON parsing.
 *
 * Strategy:
 * 1. Find the first occurrence of <!DOCTYPE or <html in the text
 * 2. Find the last occurrence of </html>
 * 3. Extract that substring and unescape JSON string sequences
 */
function extractPrototypeFromRawText(text: string): string | null {
    const htmlStart = text.indexOf('<!DOCTYPE');
    const htmlStartAlt = text.indexOf('<html');
    const htmlIdx = htmlStart !== -1 ? htmlStart : htmlStartAlt;

    if (htmlIdx === -1) return null;

    const htmlEnd = text.lastIndexOf('</html>');
    const raw = htmlEnd !== -1
        ? text.substring(htmlIdx, htmlEnd + 7)
        : text.substring(htmlIdx);

    if (raw.length < 200) return null;

    // Unescape JSON string escape sequences — critical for proper HTML rendering
    return unescapeJsonString(raw);
}

export class GeminiProvider extends BaseAIProvider {
    name = 'Google Gemini';
    providerId = 'google';
    private genAI: GoogleGenerativeAI | null = null;

    constructor() {
        super();
        this.initialize();
    }

    private async initialize() {
        const apiKey = await configService.getAPIKey(this.providerId);
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async isAvailable(): Promise<boolean> {
        if (!this.genAI) await this.initialize();
        return !!this.genAI;
    }

    private async resolveValidModel(requestedModel: string): Promise<string> {
        try {
            const activeModels = await aiModelsService.getActiveModels();

            // Filter for Google models only
            const googleModels = activeModels.filter(m => m.provider === 'google');

            if (googleModels.length === 0) {
                console.warn("No active Google models found! Using requested model as last resort.");
                return requestedModel;
            }

            // Find model by ID (preferred) or modelName
            const matchedModel = googleModels.find(m => m.id === requestedModel || m.modelName === requestedModel);

            if (matchedModel) {
                return matchedModel.modelName;
            }

            // Fallback to the first active Google model
            const fallbackModel = googleModels[0].modelName;
            console.warn(`Model '${requestedModel}' is not active. Falling back to '${fallbackModel}'.`);

            await loggingService.logError('GeminiProvider', 'Model Fallback Triggered', {
                requested: requestedModel,
                fallback: fallbackModel
            });

            return fallbackModel;
        } catch (error) {
            console.error("Error resolving model:", error);
            return requestedModel;
        }
    }

    /**
     * Executes a generation function against a specific model name.
     * Used by the 503-fallback cascade to try alternative models.
     */
    private async executeWithModel<T>(
        modelName: string,
        executeFn: (model: any) => Promise<T>,
        generationConfig: any,
        toolsOption?: any[]
    ): Promise<T> {
        if (!this.genAI) throw new Error("Gemini AI not initialized");
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig,
            tools: toolsOption,
        });
        return executeFn(model);
    }

    /**
     * 503 Model Fallback Cascade.
     *
     * When the primary model returns 503 (overloaded), automatically tries
     * each model in FALLBACK_MODEL_CHAIN with increasing wait times before
     * each attempt. This gives the primary model time to recover while
     * keeping the user unblocked via a less-loaded model.
     *
     * Strategy:
     *   Attempt 1: primary model
     *   Attempt 2: primary model again (5s wait — transient spikes resolve fast)
     *   Attempt 3: first fallback (gemini-2.0-flash) — reliably available
     *   Attempt 4: second fallback (gemini-1.5-flash)
     *   Attempt 5: third fallback (gemini-1.5-pro)
     */
    private async withModelFallback<T>(
        primaryModel: string,
        executeFn: (modelName: string) => Promise<T>
    ): Promise<T> {
        // Attempt 1: primary model, no wait
        try {
            return await executeFn(primaryModel);
        } catch (err: any) {
            if (!is503Overload(err)) throw err; // Not overload — propagate
            console.warn(`[GeminiProvider] 503 on primary model '${primaryModel}' — retrying after 5s`);
        }

        // Attempt 2: primary model again, 5s wait
        await sleep(5000);
        try {
            return await executeFn(primaryModel);
        } catch (err: any) {
            if (!is503Overload(err)) throw err;
            console.warn(`[GeminiProvider] 503 again on '${primaryModel}' — starting model fallback chain`);
        }

        // Attempts 3-5: fallback models, 3s between each
        for (const fallbackModel of FALLBACK_MODEL_CHAIN) {
            if (fallbackModel === primaryModel) continue; // Skip if same as primary
            await sleep(3000);
            try {
                console.warn(`[GeminiProvider] Trying fallback model '${fallbackModel}'`);
                const result = await executeFn(fallbackModel);
                // Log that a fallback was used (for monitoring)
                loggingService.logError('GeminiProvider', '503 Fallback Used', {
                    primaryModel,
                    fallbackUsed: fallbackModel,
                    note: 'Primary model overloaded — fallback succeeded'
                });
                return result;
            } catch (err: any) {
                if (!is503Overload(err)) throw err; // Hard error — propagate immediately
                console.warn(`[GeminiProvider] 503 on fallback '${fallbackModel}' — trying next`);
            }
        }

        // All models overloaded — throw a clear rate-limit error
        throw new AIRateLimitError(
            this.providerId,
            new Error(`All Gemini models (${primaryModel} + fallbacks) returned 503. Google API is under high load.`)
        );
    }

    async generateText(modelName: string, systemPrompt: string, userPrompt: string, options?: GenerationOptions): Promise<string> {
        return this.retryOperation(async () => {
            try {
                const validModel = await this.resolveValidModel(modelName);
                if (!this.genAI) throw new Error("Gemini AI not initialized");

                const fullPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`;
                let contentParts: any[] = [{ text: fullPrompt }];

                if (options?.media && options.media.length > 0) {
                    const mediaParts = options.media.map(m => ({
                        inlineData: { mimeType: m.mimeType, data: m.data }
                    }));
                    contentParts = [...contentParts, ...mediaParts];
                }

                return await this.withModelFallback(validModel, async (activeModel) => {
                    const model = this.genAI!.getGenerativeModel({
                        model: activeModel,
                        tools: options?.tools,
                    });
                    const result = await model.generateContent(contentParts);
                    const text = result.response.text();
                    this.recordSuccess();
                    return text;
                });
            } catch (error: any) {
                this.handleError(error, modelName);
                throw error;
            }
        });
    }

    async generateJSON<T>(modelName: string, systemPrompt: string, userPrompt: string, options?: GenerationOptions): Promise<T> {
        return this.retryOperation(async () => {
            try {
                const validModel = await this.resolveValidModel(modelName);
                if (!this.genAI) throw new Error("Gemini AI not initialized");

                // maxOutputTokens: UX Designer generates 15K-30K token HTML prototypes.
                // Without this, Gemini Flash defaults to ~8192 tokens → truncated JSON → parse error.
                const generationConfig: any = {
                    responseMimeType: "application/json",
                    maxOutputTokens: 65536,
                };

                // Gemini API 400 Error: "Tool use with a response mime type 'application/json' is unsupported"
                // If tools are present (e.g. Google Search), we must DISABLE strict JSON mode and rely on text parsing.
                if (options?.tools && options.tools.length > 0) {
                    delete generationConfig.responseMimeType;
                }

                const fullPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`;
                let contentParts: any[] = [{ text: fullPrompt }];

                if (options?.media && options.media.length > 0) {
                    const mediaParts = options.media.map(m => ({
                        inlineData: { mimeType: m.mimeType, data: m.data }
                    }));
                    contentParts = [...contentParts, ...mediaParts];
                }

                const { text, candidates } = await this.withModelFallback(validModel, async (activeModel) => {
                    const model = this.genAI!.getGenerativeModel({
                        model: activeModel,
                        generationConfig,
                        tools: options?.tools,
                    });
                    const result = await model.generateContent(contentParts);
                    return {
                        text: result.response.text(),
                        candidates: result.response.candidates,
                    };
                });

                // Robust JSON Extraction
                let jsonString = text;
                const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
                const match = text.match(markdownRegex);

                if (match) {
                    jsonString = match[1];
                } else {
                    const firstOpen = text.indexOf('{');
                    const lastClose = text.lastIndexOf('}');
                    if (firstOpen !== -1 && lastClose !== -1) {
                        jsonString = text.substring(firstOpen, lastClose + 1);
                    }
                }

                try {
                    // UX Designer fallback: if the model returned raw HTML instead of JSON-wrapped HTML,
                    // unescape JSON string sequences before returning so the iframe renders correctly.
                    if (jsonString.trim().startsWith('<!DOCTYPE') || jsonString.trim().startsWith('<html')) {
                        const html = unescapeJsonString(jsonString.trim());
                        this.recordSuccess();
                        return { prototype: html } as unknown as T;
                    }

                    const parsed = JSON.parse(jsonString);

                    // --- FORCE SOURCE INJECTION FROM GROUNDING METADATA (Provider Level) ---
                    if (candidates && candidates[0]?.groundingMetadata) {
                        const metadata = candidates[0].groundingMetadata;
                        if (metadata.groundingChunks) {
                            const injectedSources = metadata.groundingChunks
                                .filter((chunk: any) => chunk.web)
                                .map((chunk: any) => ({
                                    claim: "Source from Google Search",
                                    source: chunk.web.title || "Google Search",
                                    year: new Date().getFullYear(),
                                    url: chunk.web.uri,
                                    tier: 1
                                }));

                            if (injectedSources.length > 0) {
                                if ((parsed as any).dashboard) {
                                    if (!(parsed as any).sources) (parsed as any).sources = [];
                                    (parsed as any).sources = [...(parsed as any).sources, ...injectedSources];
                                } else if ((parsed as any).sources) {
                                    (parsed as any).sources = [...(parsed as any).sources, ...injectedSources];
                                } else {
                                    (parsed as any).sources = injectedSources;
                                }
                            }
                        }
                    }

                    this.recordSuccess();
                    return parsed;
                } catch (parseError) {
                    console.error("JSON Parse Error. Raw text:", text, "Extracted:", jsonString);

                    // Attempt recovery for trailing commas
                    if (jsonString.trim().endsWith(',')) {
                        try {
                            const healed = jsonString.trim().slice(0, -1) + '}';
                            const healedParsed = JSON.parse(healed);
                            this.recordSuccess();
                            return healedParsed;
                        } catch (e) {
                            // Ignore, continue to next fallback
                        }
                    }

                    // UX Designer emergency fallback: JSON.parse failed but HTML exists in raw text.
                    // extractPrototypeFromRawText handles unescape of \n, \", etc. — critical for iframe rendering.
                    const extractedHtml = extractPrototypeFromRawText(text);
                    if (extractedHtml) {
                        console.warn('[GeminiProvider] JSON parse failed — extracted and unescaped HTML from raw text');
                        this.recordSuccess();
                        return { prototype: extractedHtml } as unknown as T;
                    }

                    // Detect truncated response (cut off mid-generation) vs truly invalid JSON.
                    // Truncation is transient — Gemini stopped early due to load/timeout — and WILL succeed on retry.
                    // Structural parse errors are deterministic and should NOT be retried.
                    if (isJsonTruncated(jsonString)) {
                        console.warn('[GeminiProvider] Truncated JSON detected — flagging for automatic retry');
                        loggingService.logError('GeminiProvider', 'Truncated JSON response', {
                            model: modelName,
                            rawLength: text.length,
                            preview: jsonString.substring(jsonString.length - 200),
                        });
                        throw new AITruncatedResponseError(this.providerId, parseError);
                    }

                    throw new AIInvalidResponseError(
                        this.providerId,
                        `Failed to parse JSON response. Raw: ${jsonString.substring(0, 100)}...`,
                        parseError
                    );
                }
            } catch (error: any) {
                this.handleError(error, modelName);
                throw error;
            }
        });
    }

    private handleError(error: any, modelName: string) {
        this.recordFailure(error);

        const errorMessage = error.message || '';

        if (errorMessage.includes('503') || errorMessage.includes('high demand') || errorMessage.includes('overloaded')) {
            throw new AIRateLimitError(this.providerId, error);
        }
        if (errorMessage.includes('429') || errorMessage.includes('quota')) {
            throw new AIRateLimitError(this.providerId, error);
        }
        if (errorMessage.includes('401') || errorMessage.includes('API key')) {
            throw new AIAuthenticationError(this.providerId, error);
        }
        if (errorMessage.includes('timeout')) {
            throw new AITimeoutError(this.providerId, error);
        }

        loggingService.logError('GeminiProvider', `Generation failed with model ${modelName}`, {
            error: errorMessage,
            stack: error.stack
        });
    }
}
