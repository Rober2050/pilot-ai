// SERVICIO DE IA DEL WAR ROOM
// Todas las llamadas pasan por el provider factory (proxy anthropic-proxy en Supabase).
// Nunca hay API keys de proveedores de IA en el navegador.
import { SYSTEM_PROMPTS } from "./warRoomPrompts";
import { WarRoomPhase, SimulationResponse } from "../../types/war-room";
import { LogEvent } from "../../types/streaming";
import { RoleConfig } from "../../types/roles";
import { suggestionsService } from "./suggestionsService";
import { AIProviderFactory } from "./AIProviderFactory";

/** Resolves the provider (Anthropic proxy) for a model and returns parsed JSON. */
const generateJSON = async <T = any>(model: string, systemPrompt: string, userPrompt: string): Promise<T> => {
    const provider = await AIProviderFactory.getInstance().getProviderForModel(model);
    return provider.generateJSON<T>(model, systemPrompt, userPrompt);
};

const VALIDATION_MODEL = 'claude-haiku-4-5-20251001';
const WAR_ROOM_MODEL = 'claude-haiku-4-5-20251001';
const AI_TIMEOUT_MS = 60000;

// Output contract for every debate turn.
const SIMULATION_JSON_FORMAT = `
OUTPUT FORMAT (MANDATORY): a single valid JSON object with this shape:
{
  "simulation_thought": "short internal reasoning",
  "public_message": "your spoken argument — REQUIRED, never empty",
  "chart_update": [n, n, n, n],
  "sources": [{ "claim": "...", "source": "...", "year": 2026, "url": "...", "tier": 1 }],
  "visual_artifact": {
    "type": "'react-flow' or 'recharts'",
    "data": {
      "nodes": [{ "id": "...", "type": "'input' | 'output' | 'default'", "position": { "x": 0, "y": 0 }, "data": { "label": "...", "details": "..." } }],
      "edges": [{ "id": "...", "source": "...", "target": "...", "label": "...", "animated": false }],
      "chart_category": "'bar' | 'line' | 'pie'",
      "chart_series": [{ "name": "...", "value": 0, "fill": "#hex" }]
    }
  }
}
"chart_update" is an array of 4 numbers (0-100). "sources" and "visual_artifact" are optional.`;

/** Runs a JSON generation through the provider factory with a hard timeout. */
async function generateWarRoomJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`AI Generation Timeout (${AI_TIMEOUT_MS / 1000}s)`)), AI_TIMEOUT_MS)
    );
    return Promise.race([
        generateJSON<T>(WAR_ROOM_MODEL, systemPrompt, userPrompt),
        timeout,
    ]);
}

/** Guarantees the fields the War Room UI relies on are present. */
function normalizeSimulationResponse(response: SimulationResponse, lang: 'es' | 'en'): SimulationResponse {
    if (!response.chart_update || !Array.isArray(response.chart_update)) {
        response.chart_update = [50, 50, 50, 50];
    }
    if (!response.public_message || response.public_message.trim() === "") {
        response.public_message = lang === 'es' ? "(Analizando datos...)" : "(Analyzing data...)";
    }
    return response;
}

export const WarRoomService = {

    // Simple in-memory cache to avoid repeated Firestore hits
    roleCache: new Map<string, any>(),

    async processTurnWithStreaming(
        roleOrId: string | RoleConfig, // ✅ FIX 1.1: Accept full RoleConfig or legacy string
        phase: WarRoomPhase,
        history: string[],
        userContext: string,
        lang: 'es' | 'en',
        mode: string = 'audit',
        onLog?: (log: LogEvent) => void,
        discoveryContext?: string | import('./DiscoveryAgent').MissionManifest // ✅ PHASE 2.5: Accept manifest or legacy string
    ): Promise<SimulationResponse> {
        let role: RoleConfig | null = null;
        let roleId: string = ''; // ✅ Declare outside try block for catch access

        try {
            // ✅ FIX 1.1: Type guard - Use RoleConfig directly if provided (synthetic roles)

            if (typeof roleOrId === 'string') {
                // Legacy flow: Fetch from cache/Firestore
                roleId = roleOrId;
                role = this.roleCache.get(roleId);

                if (!role) {
                    onLog?.({
                        timestamp: Date.now(),
                        agentId: roleId,
                        message: lang === 'es' ? 'Cargando configuración del rol...' : 'Loading role configuration...',
                        type: 'thinking'
                    });

                    try {
                        const { rolesService } = await import('../firebase/rolesService');
                        const firestoreTimeout = new Promise<null>((_, reject) =>
                            setTimeout(() => reject(new Error("Firestore Timeout (3s)")), 3000)
                        );

                        role = await Promise.race([
                            rolesService.getRoleById(roleId),
                            firestoreTimeout
                        ]) as RoleConfig | null; // ✅ Type cast to fix TypeScript error

                        if (role) {
                            this.roleCache.set(roleId, role);
                        }
                    } catch (error) {
                        console.warn(`[WarRoomService] Failed to fetch role ${roleId}:`, error);
                        throw new Error(`Role configuration not found for ${roleId}`);
                    }
                }

                if (!role) {
                    throw new Error(`Role configuration not found for ${roleId}`);
                }
            } else {
                // ✅ NEW FLOW: RoleConfig object provided directly (synthetic roles from JIT Factory)
                role = roleOrId;
                roleId = role.roleId;

                // Cache it for future use
                this.roleCache.set(roleId, role);

                console.log(`[WarRoomService] Using provided RoleConfig for ${roleId} (${role.displayName})`);

                onLog?.({
                    timestamp: Date.now(),
                    agentId: roleId,
                    message: lang === 'es'
                        ? `Usando rol sintético: ${role.displayName}`
                        : `Using synthetic role: ${role.displayName}`,
                    type: 'thinking'
                });
            }

            // 2. Log model
            onLog?.({
                timestamp: Date.now(),
                agentId: roleId,
                message: lang === 'es'
                    ? `Debate estándar - modelo ${WAR_ROOM_MODEL}`
                    : `Standard debate - model ${WAR_ROOM_MODEL}`,
                type: 'thinking'
            });

            // 3. Compose prompt
            const { PromptComposer } = await import('./PromptComposer');
            const recentHistory = history.slice(-6);
            const contextWithHistory = `${userContext}\n\nHISTORY: ${JSON.stringify(recentHistory)}`;

            const systemPrompt = PromptComposer.compose(
                role,
                contextWithHistory,
                {
                    source: 'war-room',
                    mode: mode,
                    phase: phase === 'DIVERGENCE' ? 'attack' : phase === 'NEGOTIATION' ? 'negotiate' : 'resolve',
                    language: lang,
                    discoveryContext // ✅ PHASE 2: Pass Discovery manifest
                }
            );

            onLog?.({
                timestamp: Date.now(),
                agentId: roleId,
                message: lang === 'es' ? 'Generando respuesta...' : 'Generating response...',
                type: 'action'
            });

            // 4. Generate response
            const response = normalizeSimulationResponse(
                await generateWarRoomJSON<SimulationResponse>(
                    systemPrompt,
                    `Respond with your turn in the debate.\n${SIMULATION_JSON_FORMAT}`
                ),
                lang
            );

            onLog?.({
                timestamp: Date.now(),
                agentId: roleId,
                message: lang === 'es' ? '✓ Respuesta generada' : '✓ Response generated',
                type: 'result'
            });

            return response;

        } catch (error: any) {
            console.error(`[WarRoomService] Streaming error:`, error);

            onLog?.({
                timestamp: Date.now(),
                agentId: roleId, // roleId is in scope from line 174, 190
                message: `Error: ${error.message}`,
                type: 'result'
            });

            throw error;
        }
    },

    async processTurn(
        roleId: string,  // Can be roleId or roleName for backward compatibility
        phase: WarRoomPhase,
        history: string[],
        userContext: string,
        lang: 'es' | 'en',
        mode: string = 'audit',
        tools?: any[]
    ): Promise<SimulationResponse> {

        try {
            console.log(`[WarRoomService] Processing turn for ${roleId} in mode ${mode} (Tools: ${!!tools})`);

            // 1. Try to get role from Cache or Firestore
            let role: any = WarRoomService.roleCache.get(roleId);

            if (role) {
                console.log(`[WarRoomService] Cache HIT for role ${roleId}`);
            } else {
                console.log(`[WarRoomService] Cache MISS for role ${roleId} - Fetching from Firestore...`);
                try {
                    const { rolesService } = await import('../firebase/rolesService');
                    // 3-second timeout for Firestore
                    const firestoreTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore Timeout (3s)")), 3000));

                    role = await Promise.race([
                        rolesService.getRoleById(roleId),
                        firestoreTimeout
                    ]);

                    if (role) {
                        WarRoomService.roleCache.set(roleId, role);
                    }
                } catch (firestoreError) {
                    console.warn(`[WarRoomService] Firestore fetch failed or timed out for ${roleId}:`, firestoreError);
                }
            }

            if (role) {
                // SUCCESS: Use Sandwich Method
                try {
                    const { PromptComposer } = await import('./PromptComposer');

                    // Determine dynamic style instruction
                    let styleInstruction: string | undefined;
                    if (!['audit', 'creative', 'crisis'].includes(mode)) {
                        // Try to fetch style, but don't block main thread if it fails
                        try {
                            // Can't easily use rolesService/stylesService here if import failed above, but we have imports.
                            // Assuming warRoomStylesService was imported successfully inside the try block above.
                            // To be safe, re-import or skip if undefined.
                            const { warRoomStylesService } = await import('../firebase/warRoomStylesService');
                            const style = await warRoomStylesService.getStyleById(mode);
                            if (style) {
                                styleInstruction = lang === 'es' ? style.modifier : style.modifierEn;
                            }
                        } catch (e) {
                            console.warn("Style fetch failed, continuing without custom style:", e);
                        }
                    }

                    const recentHistory = history.slice(-6);
                    const contextWithHistory = `${userContext}\n\nHISTORY: ${JSON.stringify(recentHistory)}`;

                    const finalPrompt = PromptComposer.compose(
                        role,
                        contextWithHistory,
                        {
                            source: 'war-room',
                            mode: mode,
                            phase: phase === 'DIVERGENCE' ? 'attack' : phase === 'NEGOTIATION' ? 'negotiate' : 'resolve',
                            language: lang,
                            styleInstruction: styleInstruction
                        }
                    );



                    const jsonResponse = await generateWarRoomJSON<SimulationResponse>(
                        finalPrompt,
                        `Respond with your turn in the debate.
${SIMULATION_JSON_FORMAT}`
                    );
                    console.log(`[WarRoomService] AI response received for ${roleId}`);

                    return normalizeSimulationResponse(jsonResponse, lang);

                } catch (aiError) {
                    console.error(`[WarRoomService] AI Generation failed for ${roleId} - Degadation Mode Active`, aiError);
                    // 🚨 GRACEFUL DEGRADATION: Do not burn tokens blindly. Fail gracefully.
                    return {
                        simulation_thought: "API Timeout / Fail",
                        public_message: lang === 'es'
                            ? "Mi conexión con la base de datos central falló (Timeout o Red). No puedo aportar información en este turno."
                            : "My connection to the central database failed (Timeout or Network). I cannot provide input this turn.",
                        chart_update: [50, 50, 50, 50]
                    };
                }

            } else {
                // FALLBACK: Role not found OR DB blocked.
                console.warn(`Role ${roleId} not found/blocked. Using legacy prompts. Preserving TOOLS.`);
                // We keep moving to legacy if DB fails but AI is fine.
                return this.processTurnLegacy(roleId, phase, history, userContext, lang, tools);
            }

        } catch (error) {
            console.error("WarRoomService Critical Error:", error);

            // 🚨 GRACEFUL DEGRADATION: If the whole outer block fails.
            return {
                simulation_thought: "SYSTEM FAILURE",
                public_message: lang === 'es'
                    ? "Error de sistema general. Reiniciando núcleo estratégico..."
                    : "General system error. Rebooting strategic core...",
                chart_update: [50, 50, 50, 50]
            };
        }
    },

    /**
     * Legacy fallback method using original hardcoded prompts
     * Used when Firestore role loading fails
     */
    async processTurnLegacy(
        roleName: string,  // This is actually roleId now
        phase: WarRoomPhase,
        history: string[],
        userContext: string,
        lang: 'es' | 'en',
        tools?: any[]
    ): Promise<SimulationResponse> {

        console.warn("Using legacy prompt system as fallback");

        // Map roleId back to displayName for legacy prompts
        const ROLE_DISPLAY_MAP: Record<string, string> = {
            'strategy-analyst': 'Strategy Analyst',
            'product-manager': 'Product Manager',
            'business-analyst': 'Business Analyst',
            'technical-architect': 'Technical Architect',
            'ux-designer': 'UX Designer',
            'marketing-strategist': 'Marketing Strategist'
        };

        const displayName = ROLE_DISPLAY_MAP[roleName] || roleName;
        console.log(`[Legacy Fallback] Using displayName: ${displayName} for roleId: ${roleName}`);

        // Build prompt using original SYSTEM_PROMPTS structure
        let phaseInstruction = SYSTEM_PROMPTS.PHASE_1_ATTACK;
        if (phase === 'NEGOTIATION') phaseInstruction = SYSTEM_PROMPTS.PHASE_2_NEGOTIATE;
        if (phase === 'RESOLUTION') phaseInstruction = SYSTEM_PROMPTS.PHASE_3_RESOLVE;

        const recentHistory = history.slice(-6);

        // UNIVERSAL FALLBACK: SYSTEM_PROMPTS.CORE works with ANY role name
        // It's a generic template that accepts roleName as parameter
        let corePrompt;
        try {
            corePrompt = SYSTEM_PROMPTS.CORE(displayName, '', lang);
        } catch (error) {
            // If CORE fails for any reason, use ultra-generic fallback
            console.warn(`SYSTEM_PROMPTS.CORE failed for ${displayName}, using ultra-generic fallback`);
            corePrompt = `
You are an expert ${displayName} in a corporate War Room.
YOUR GOAL: Analyze the business idea critically and provide strategic insights.
LANGUAGE: Respond strictly in ${lang === 'es' ? 'Spanish' : 'English'}.

CRITICAL INSTRUCTIONS:
1. YOU MUST PROVIDE A "public_message". IT CANNOT BE EMPTY.
2. IF YOU HAVE NO NEW DATA, SUMMARIZE THE DEBATE SO FAR.
3. BE CONCISE AND TEXT-BASED.

OUTPUT FORMAT: YOU MUST RESPOND IN VALID JSON ONLY.
JSON STRUCTURE:
{
    "simulation_thought": "Short internal thought",
    "public_message": "Your spoken argument. REQUIRED. MUST NOT BE EMPTY.",
    "chart_update": [50, 50, 50, 50],
    "sources": []
}`;
        }

        const finalPrompt = `
            ${corePrompt}
            
            ${phaseInstruction}
            
            CONTEXT: "${userContext}"
            HISTORY: ${JSON.stringify(recentHistory)}
            
            IMPORTANT: GENERATE A VALID JSON RESPONSE. "public_message" MUST CONTAIN A SENTENCE.
            IMPORTANT: GENERATE A VALID JSON RESPONSE. "public_message" MUST CONTAIN A SENTENCE.
        `;

        try {
            const jsonResponse = await generateWarRoomJSON<SimulationResponse>(finalPrompt, SIMULATION_JSON_FORMAT);
            return normalizeSimulationResponse(jsonResponse, lang);

        } catch (fallbackLayerError) {
            console.error(`[WarRoomService] Legacy AI Generation also failed`, fallbackLayerError);
            return {
                simulation_thought: "API Timeout / Fail",
                public_message: lang === 'es'
                    ? "Conexión interrumpida con el servidor de análisis. Datos no disponibles."
                    : "Connection to analysis server dropped. Data unavailable.",
                chart_update: [50, 50, 50, 50]
            }
        }
    },

    async generateManifesto(history: string[], lang: 'es' | 'en'): Promise<any> {
        // Filtramos historial para no enviar ruido innecesario al generar el resumen
        const prompt = `
            ROLE: Secretary of the War Room.
            TASK: Generate a Final Strategic Manifesto JSON based on the debate.
            LANGUAGE: ${lang === 'es' ? 'Spanish' : 'English'}.
            HISTORY: ${JSON.stringify(history.slice(-10))} 
            
            REQUIRED JSON STRUCTURE:
            {
                "decision": "GO" or "NO-GO" (or "GO WITH CONDITIONS"),
                "summary": "Executive summary of the verdict (max 50 words).",
                "tradeOffs": ["List of 3 key trade-offs accepted"],
                "risks": ["List of 3 critical risks accepted"],
                "roadmap": ["List of 3 immediate next steps"]
            }
        `;

        try {
            return await generateWarRoomJSON<any>(
                'You are the War Room secretary. Respond only with the requested JSON object.',
                prompt
            );
        } catch (e) {
            console.error("Manifesto Generator Error:", e);
            return { decision: "ERROR", summary: "API Error (Timeout)", tradeOffs: [], risks: [], roadmap: [] };
        }
    },

    async askDebrief(question: string, history: string[], lang: 'es' | 'en'): Promise<{ role: string; text: string }> {
        const prompt = `
            TASK: War Room Super-Intelligence Q&A.
            1. Analyze QUESTION and HISTORY.
            2. SELECT the most relevant ROLE to answer.
            3. ANSWER as that persona.
            
            QUESTION: "${question}"
            HISTORY: ${JSON.stringify(history.slice(-8))}
            LANGUAGE: Respond strictly in ${lang === 'es' ? 'Spanish' : 'English'}.

            OUTPUT JSON: { "role": "Name of the Role", "text": "The answer in first person." }
        `;

        try {
            return await generateWarRoomJSON<{ role: string; text: string }>(
                'You are the War Room Q&A engine. Respond only with the requested JSON object.',
                prompt
            );
        } catch (error) {
            const e = error as any;
            console.error("[WarRoomService] Error en askDebrief:", e);
            const errorMessage = e?.message || "Error desconocido";
            const baseText = lang === 'es' ? 'Sistema desconectado.' : 'System offline.';
            return {
                role: 'System',
                text: `${baseText} (${errorMessage})`
            };
        }
    },

    async validateTopic(topic: string, lang: 'es' | 'en', roleContext?: RoleConfig): Promise<{ valid: boolean; reason: string; incomplete?: boolean; suggestion?: string; addedModules?: string[] }> {
        const prompt = `
            ROLE: Security Gatekeeper for a Strategic War Room.
            TASK: Analyze the user input. Determine if it is a VALID, COHERENT business/strategy topic.
            Also identify if it's INCOMPLETE (valid but lacking sector/audience/problem details).

            INPUT: "${topic}"

            RULES:
            1. Reject nonsense, random characters (e.g., "asdf", "lkjlkj"), or spam.
            2. Reject inputs that are too short to be meaningful (e.g., "a", "test", "hola").
            3. Allow typo-ridden but clear intent (e.g., "marketting plan for new coffe shop").
            4. INCOMPLETE: Ideas that are logically valid but lack detail (e.g., "Create a dating app" is valid but incomplete - lacks target audience/age range).
            5. Language: Respond in ${lang === 'es' ? 'Spanish' : 'English'}.

            OUTPUT JSON:
            {
                "valid": boolean,
                "reason": "Short explanation to show to the user",
                "incomplete": boolean,
                "missingComponents": ["component1", "component2"] if incomplete
            }
        `;

        try {
            // Routed through the provider factory (Anthropic proxy).
            const validation = await generateJSON(
                VALIDATION_MODEL,
                'You are a strict input validator. Respond only with the requested JSON object.',
                prompt
            );

            // For any valid idea, always generate an expanded business model suggestion
            if (validation.valid) {
                try {
                    const suggestion = await suggestionsService.improveIdea(topic, lang, roleContext);
                    console.log(`[validateTopic] Suggestion generated using model: ${suggestion.modelUsed}`);
                    console.log(`[validateTopic] Added modules: ${suggestion.addedModules?.join(', ') || 'none'}`);
                    return {
                        ...validation,
                        suggestion: suggestion.improved,
                        addedModules: suggestion.addedModules || []
                    };
                } catch (suggestionError) {
                    console.warn('[validateTopic] Failed to generate suggestion:', suggestionError);
                    // Return validation without suggestion if it fails
                    return validation;
                }
            }

            return validation;
        } catch (e) {
            console.error("Gatekeeper Error:", e);
            // In case of API failure, allow to prevent blocking user
            return { valid: true, reason: "" };
        }
    }
};
