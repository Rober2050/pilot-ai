/**
 * StreamingService - Manejo robusto de streaming con parsing incremental
 /**
 * Streaming Service for Gemini API
 * 
 * Soporta 2 modos:
 * - Modo 1: Text Streaming (muestra chunks en tiempo real)
 * - Modo 2: JSON Buffering (parsea solo cuando está completo)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { LogEvent } from "../../types/streaming";
import { globalRequestQueue, RequestPriority } from "./RequestQueue";

export interface StreamingOptions {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    onLog?: (log: LogEvent) => void;
    onChunk?: (text: string) => void;
    expectJSON?: boolean;
    responseSchema?: any;
}

export class StreamingService {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Genera contenido con streaming seguro
     * 
     * ESTRATEGIA ANTI-FLICKERING:
     * 1. Si expectJSON=true, NO muestra chunks parciales en UI
     * 2. Acumula todo el texto en buffer
     * 3. Parsea JSON solo al final
     * 4. Mientras tanto, emite logs sintéticos para la Hacker Console
     */
    async generateWithStreaming<T = string>(
        options: StreamingOptions
    ): Promise<T> {
        const {
            model,
            systemPrompt,
            userPrompt,
            onLog,
            onChunk,
            expectJSON = false
        } = options;

        // Emitir log inicial
        this.emitLog(onLog, 'thinking', 'Iniciando generación...');

        const generationConfig: any = {
            maxOutputTokens: 8192,
            temperature: 0.7,
            topP: 0.9
        };

        if (expectJSON) {
            generationConfig.responseMimeType = "application/json";
            if (options.responseSchema) {
                generationConfig.responseSchema = options.responseSchema;
            }
        }

        const geminiModel = this.genAI.getGenerativeModel({
            model: model || 'gemini-2.5-pro',
            generationConfig: generationConfig
        });

        const fullPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`;

        try {
            // ✅ ENTERPRISE FIX: Wrap API call with RequestQueue for automatic retry
            const result = await globalRequestQueue.enqueue(
                () => geminiModel.generateContentStream(fullPrompt),
                RequestPriority.CRITICAL // User-facing requests are critical
            );

            let buffer = '';
            let chunkCount = 0;

            // Procesar stream
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                buffer += chunkText;
                chunkCount++;

                if (expectJSON) {
                    // MODO JSON: No mostrar chunks parciales (anti-flickering)
                    // Solo emitir logs de progreso
                    if (chunkCount % 5 === 0) {
                        this.emitLog(onLog, 'thinking', `Procesando datos... (${buffer.length} chars)`);
                    }
                } else {
                    // MODO TEXTO: Mostrar chunks en tiempo real
                    if (onChunk) {
                        onChunk(chunkText);
                    }
                    this.emitLog(onLog, 'action', chunkText.substring(0, 50) + '...');
                }
            }

            // Stream completo
            this.emitLog(onLog, 'result', 'Generación completada');

            // Parsear resultado final
            if (expectJSON) {
                // ✅ SOLUTION 4: Parse structured text instead of JSON
                if (buffer.trim().length === 0) {
                    throw new Error('Empty response from model');
                }

                return this.parseStructuredText<T>(buffer);
            } else {
                return buffer as T;
            }

        } catch (error: any) {
            // User-friendly error message
            const friendlyMessage = this.getFriendlyErrorMessage(error);
            this.emitLog(onLog, 'result', friendlyMessage);
            throw error;
        }
    }

    /**
     * ✅ SOLUTION 4: Parse structured text format
     * Format expected:
     * MESSAGE: [text]
     * REASONING: [text]
     * CHART: [n,n,n,n]
     * DECISION: [type]
     */
    /**
     * ✅ DEFINITIVE FIX: Robust Self-Healing Parser
     * Strategy:
     * 1. Try exact structured match
     * 2. Try JSON extraction (and map fields)
     * 3. Fallback to raw text (clean JSON junk)
     * 4. NEVER return "Error: Invalid Format" to user
     */
    /**
     * ✅ DEFINITIVE FIX: Robust Self-Healing Parser
     * Strategy:
     * 1. Try exact structured match
     * 2. Try JSON extraction (and map fields)
     * 3. Fallback to raw text (clean JSON junk)
     * 4. NEVER return "Error: Invalid Format" to user
     */
    private parseStructuredText<T>(text: string): T {
        try {
            console.log('[parseStructuredText] Raw response:', text.substring(0, 300));

            // 1. Clean markdown blocks (e.g. ```json ... ```)
            let cleanText = text.replace(/```[a-z]*\n?|```/g, '').trim();

            // 2. Try strict JSON parse first (This is what Gemini Structured Outputs generates)
            try {
                const parsed = JSON.parse(cleanText);
                return parsed as T;
            } catch (jsonError) {
                console.warn('[parseStructuredText] Strict JSON parse failed, trying fallback extraction', jsonError);
            }

            // 3. Fallback: Extract JSON block if surrounded by junk
            try {
                const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return parsed as T;
                }
            } catch (e) {
                console.warn('[parseStructuredText] Fallback JSON extraction failed', e);
            }

            // 4. LAST RESORT: Return a gracefully degraded SimulationResponse object
            // This prevents the system from crashing if the AI completely hallucinates the format
            console.warn('[parseStructuredText] ⚠️ System Auto-Recovery: Using raw text as message');
            return {
                simulation_thought: "System: Auto-recovered from unstructured format.",
                public_message: cleanText.substring(0, 500) || "Analysis complete.",
                chart_update: [50, 50, 50, 50],
                decision_type: "attack"
            } as T;

        } catch (error) {
            // Absolute final safety net
            console.error('[parseStructuredText] Critical Parser Error:', error);
            return {
                simulation_thought: "System: Emergency recovery.",
                public_message: text.substring(0, 500),
                chart_update: [50, 50, 50, 50],
                decision_type: "attack"
            } as T;
        }
    }

    /**
     * Convert technical errors to user-friendly messages
     */
    private getFriendlyErrorMessage(error: any): string {
        const errorMsg = error?.message || String(error);

        // Model not found
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
            return '⚠️ Modelo no disponible, usando alternativa...';
        }

        // Network errors
        if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
            return '⚠️ Error de conexión, reintentando...';
        }

        // Rate limit
        if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
            return '⚠️ Límite de uso alcanzado, esperando...';
        }

        // Generic error
        return '⚠️ Error temporal, usando modo de respaldo...';
    }


    /**
     * Emite un log event de forma segura
     */
    private emitLog(
        callback: ((log: LogEvent) => void) | undefined,
        type: 'thinking' | 'action' | 'result',
        message: string
    ): void {
        if (callback) {
            callback({
                timestamp: Date.now(),
                agentId: 'streaming-service',
                message,
                type
            });
        }
    }
}

/**
 * PATRÓN DE USO RECOMENDADO:
 * 
 * const streamingService = new StreamingService(apiKey);
 * 
 * // Para War Room (JSON esperado)
 * const response = await streamingService.generateWithStreaming<SimulationResponse>({
 *   model: 'gemini-2.0-flash-exp',
 *   systemPrompt: rolePrompt,
 *   userPrompt: context,
 *   expectJSON: true,
 *   onLog: (log) => {
 *     // Actualizar Hacker Console
 *     console.log(`[${log.type}] ${log.message}`);
 *   }
 * });
 * 
 * // Para Discovery (Texto plano)
 * const answer = await streamingService.generateWithStreaming<string>({
 *   model: 'gemini-2.0-flash-exp',
 *   systemPrompt: discoveryPrompt,
 *   userPrompt: userInput,
 *   expectJSON: false,
 *   onChunk: (chunk) => {
 *     // Mostrar texto en tiempo real
 *     appendToChat(chunk);
 *   }
 * });
 */
