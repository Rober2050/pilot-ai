// SERVICIO DE COMUNICACIÓN CON GEMINI
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { SYSTEM_PROMPTS } from "./warRoomPrompts";
import { WarRoomPhase, SimulationResponse } from "../../types/war-room";
import { StreamingService } from "./StreamingService";
import { ModelRouter } from "./ModelRouter";
import { LogEvent } from "../../types/streaming";
import { RoleConfig } from "../../types/roles";
import { globalRequestQueue, RequestPriority } from "./RequestQueue";
import { suggestionsService } from "./suggestionsService";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// 🛡️ NATIVE STRUCTURED OUTPUTS: Golden Mix Architecture
// Defines a strict JSON schema that Gemini MUST follow, eliminating parsing errors.
const simulationResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        simulation_thought: { type: SchemaType.STRING },
        public_message: { type: SchemaType.STRING },
        chart_update: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER }
        },
        visual_artifact: { // PREPARACIÓN PARA FUTURO CANVAS
            type: SchemaType.OBJECT,
            description: "JSON for rendering rich UI components like diagrams or charts",
            properties: {
                type: { type: SchemaType.STRING, description: "'react-flow' or 'recharts'" },
                data: {
                    type: SchemaType.OBJECT,
                    description: "Native JSON object. Must contain 'nodes' and 'edges' arrays for react-flow.",
                    properties: {
                        nodes: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    id: { type: SchemaType.STRING },
                                    type: { type: SchemaType.STRING, description: "'input', 'output', or 'default'" },
                                    position: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            x: { type: SchemaType.NUMBER },
                                            y: { type: SchemaType.NUMBER }
                                        },
                                        required: ["x", "y"]
                                    },
                                    data: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            label: { type: SchemaType.STRING },
                                            details: { type: SchemaType.STRING, description: 'Optional extra information, sub-label or tech stack for the node.' }
                                        },
                                        required: ["label"]
                                    }
                                },
                                required: ["id", "type", "position", "data"]
                            }
                        },
                        edges: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    id: { type: SchemaType.STRING },
                                    source: { type: SchemaType.STRING },
                                    target: { type: SchemaType.STRING },
                                    label: { type: SchemaType.STRING },
                                    animated: { type: SchemaType.BOOLEAN }
                                },
                                required: ["id", "source", "target"]
                            }
                        },
                        chart_category: {
                            type: SchemaType.STRING,
                            description: "'bar', 'line', or 'pie'"
                        },
                        chart_series: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    name: { type: SchemaType.STRING },
                                    value: { type: SchemaType.NUMBER },
                                    fill: { type: SchemaType.STRING }
                                },
                                required: ["name", "value"]
                            }
                        }
                    }
                }
            },
            required: ["type", "data"]
        }
    },
    required: ["simulation_thought", "public_message", "chart_update"]
};

export const WarRoomService = {

    // Simple in-memory cache to avoid repeated Firestore hits
    roleCache: new Map<string, any>(),

    // Streaming service instance
    streamingService: new StreamingService(API_KEY),

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

            // 2. Determine model complexity
            const taskComplexity = mode === 'crisis' || phase === 'RESOLUTION' ? 'complex' : 'simple';
            const decision = ModelRouter.selectModel('debate', taskComplexity);

            onLog?.({
                timestamp: Date.now(),
                agentId: roleId,
                message: lang === 'es'
                    ? `Debate estándar - modelo ${taskComplexity === 'simple' ? 'rápido' : 'avanzado'} (Flash) (${decision.model})`
                    : `Standard debate - ${taskComplexity === 'simple' ? 'fast' : 'advanced'} model (Flash) (${decision.model})`,
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

            // 4. Generate response with streaming
            const response = await this.streamingService.generateWithStreaming<SimulationResponse>({
                model: decision.model,
                systemPrompt: systemPrompt,
                userPrompt: '',
                expectJSON: true,
                responseSchema: simulationResponseSchema,
                onLog: onLog
            });

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
                let finalTools: any[] | undefined;
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



                    // FORCE GOOGLE SEARCH FOR STRATEGY ANALYST + UX DESIGNER
                    const isStrategyAnalyst = roleId === 'strategy-analyst' || roleId === 'strategy-manager';
                    const isUXDesigner = roleId === 'ux-designer';
                    finalTools = tools || (role.grounding || isStrategyAnalyst || isUXDesigner ? [{ google_search: {} }] : undefined);

                    // FIX: Strict Native Structured Outputs Config
                    const generationConfig: any = {
                        responseMimeType: "application/json",
                        responseSchema: simulationResponseSchema
                    };

                    if (finalTools && finalTools.length > 0) {
                        // Gemini doesn't currently support responseSchema perfectly with Tools in all SDK versions,
                        // but setting the mimeType helps. If tools are used, it will return a functionCall.
                        // For War Room, tools are injected sources, we keep json schema to enforce output.
                        // (We leave it tight to enforce the format if it decides to answer instead of tool-call)
                    }

                    const model = genAI.getGenerativeModel({
                        model: role.model || "gemini-2.5-flash",
                        generationConfig: generationConfig,
                        tools: finalTools
                    });

                    // 15-second timeout for AI Generation
                    const aiTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("AI Generation Timeout (15s)")), 15000));

                    const result: any = await Promise.race([
                        model.generateContent(finalPrompt),
                        aiTimeout
                    ]);

                    const text = result.response.text();
                    console.log(`[WarRoomService] Raw AI Response for ${roleId}:`, text);

                    // 100% Guaranteed JSON due to responseSchema
                    let jsonResponse: SimulationResponse;
                    try {
                        jsonResponse = JSON.parse(text) as SimulationResponse;
                    } catch (parseError) {
                        console.error("[WarRoomService] Critical: Gemini ignored responseSchema", parseError);
                        jsonResponse = {
                            simulation_thought: "Error de formato de IA.",
                            public_message: lang === 'es' ? "He encontrado un error analizando los datos, denme un momento." : "I encountered a processing error, give me a moment.",
                            chart_update: [50, 50, 50, 50]
                        };
                    }

                    // --- FORCE SOURCE INJECTION FROM GROUNDING METADATA ---
                    if (result.response.candidates && result.response.candidates[0]?.groundingMetadata) {
                        const metadata = result.response.candidates[0].groundingMetadata;
                        console.log(`[WarRoomService] Found Grounding Metadata!`, metadata);

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
                                if (!(jsonResponse as any).sources) (jsonResponse as any).sources = [];
                                (jsonResponse as any).sources = [...(jsonResponse as any).sources, ...injectedSources];
                            }
                        }
                    }
                    // ------------------------------------------------------

                    // Validation checks (just to be safe, though Schema enforces it)
                    if (!jsonResponse.chart_update || !Array.isArray(jsonResponse.chart_update)) {
                        jsonResponse.chart_update = [50, 50, 50, 50];
                    }
                    if (!jsonResponse.public_message || jsonResponse.public_message.trim() === "") {
                        jsonResponse.public_message = lang === 'es' ? "(Analizando datos...)" : "(Analyzing data...)";
                    }

                    return jsonResponse;

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

        // FIX: API Error "Tool use with a response mime type: 'application/json' is unsupported"
        const generationConfig: any = {
            responseMimeType: "application/json",
            responseSchema: simulationResponseSchema
        };

        const modelConfig = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: generationConfig,
            tools: tools
        });

        try {
            const result = await modelConfig.generateContent(finalPrompt);
            const text = result.response.text();

            let jsonResponse: SimulationResponse;
            try {
                jsonResponse = JSON.parse(text) as SimulationResponse;
            } catch (e) {
                jsonResponse = {
                    simulation_thought: "Error de formato de IA.",
                    public_message: lang === 'es' ? "He encontrado un error estructurando los datos." : "I encountered a formatting error.",
                    chart_update: [50, 50, 50, 50]
                };
            }

            if (!jsonResponse.chart_update || !Array.isArray(jsonResponse.chart_update)) {
                jsonResponse.chart_update = [50, 50, 50, 50];
            }
            if (!jsonResponse.public_message) {
                jsonResponse.public_message = lang === 'es' ? "(Analizando...)" : "(Analyzing...)";
            }

            return jsonResponse;

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

        const manifestoSchema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                decision: { type: SchemaType.STRING },
                summary: { type: SchemaType.STRING },
                tradeOffs: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                risks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                roadmap: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["decision", "summary"]
        };

        const modelConfig = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json", responseSchema: manifestoSchema }
        });

        try {
            const result = await modelConfig.generateContent(prompt);
            return JSON.parse(result.response.text());
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

        const debriefSchema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                role: { type: SchemaType.STRING },
                text: { type: SchemaType.STRING }
            },
            required: ["role", "text"]
        };

        const modelConfig = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json", responseSchema: debriefSchema }
        });

        try {
            const result = await modelConfig.generateContent(prompt);
            return JSON.parse(result.response.text());
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

        const validationSchema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                valid: { type: SchemaType.BOOLEAN },
                reason: { type: SchemaType.STRING },
                incomplete: { type: SchemaType.BOOLEAN },
                missingComponents: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                }
            },
            required: ["valid", "reason", "incomplete"]
        };

        const modelConfig = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json", responseSchema: validationSchema }
        });

        try {
            const result = await modelConfig.generateContent(prompt);
            const validation = JSON.parse(result.response.text());

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
