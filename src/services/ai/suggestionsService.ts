import { aiService } from './aiService';
import { aiModelsService } from '../firebase/aiModelsService';
import { RoleConfig } from '../../types/roles';

interface SuggestionResult {
    improved: string;
    addedModules?: string[]; // List of tech modules added to the idea
    analysis: {
        sector?: string;
        audience?: string;
        problem?: string;
        additionalContext?: string;
        monetization?: string;
    };
    modelUsed?: string; // Track which model was actually used
}

/**
 * Service to intelligently complete and improve incomplete project ideas
 * Uses AI to analyze what's missing and suggest improvements
 * Model selection: reads from role config or AdminConsole default
 */
export const suggestionsService = {
    /**
     * Analyze a brief idea and suggest a more complete version
     * @param briefIdea - The incomplete idea (e.g., "Create a dating app")
     * @param lang - Language for response ('es' or 'en')
     * @param roleContext - Optional: RoleConfig to use role-specific AI model
     * @returns Improved idea with analysis of what was added + modelUsed for tracking
     */
    improveIdea: async (briefIdea: string, lang: 'es' | 'en' = 'es', roleContext?: RoleConfig): Promise<SuggestionResult> => {
        const isSpanish = lang === 'es';

        const systemPrompt = isSpanish ? `Eres un estratega de producto senior y arquitecto de modelos de negocio.
Tu MISIÓN: tomar la idea del usuario y EXPANDIRLA con módulos, integraciones y oportunidades que harán el proyecto 10x más valioso.

NO repitas simplemente la idea. AMPLÍA el modelo de negocio:
- Módulos tecnológicos clave (pagos electrónicos, CRM, notificaciones, geolocalización, IA, firmas digitales, dashboards, automatización)
- Integraciones del sector (MercadoPago, Stripe, plataformas logísticas, APIs de terceros)
- Canales de monetización adicionales (suscripciones, marketplace, white-label, API premium)
- Segmentos de mercado expandidos (B2B, B2C, gobierno, franquicias)
- Diferenciador competitivo (qué hace que esto sea único y difícil de copiar)

La "idea mejorada" debe sonar como un pitch de producto maduro — 3-4 oraciones concretas.

Devuelve SOLO un objeto JSON válido sin markdown:
{
  "improved": "Idea expandida como pitch profesional (3-4 oraciones)",
  "addedModules": ["Módulo de pagos electrónicos (Stripe/MercadoPago)", "CRM integrado", "Dashboard analytics", ...],
  "analysis": {
    "sector": "Industria identificada",
    "audience": "Audiencia expandida con nuevos segmentos",
    "problem": "Problema siendo resuelto",
    "monetization": "Modelo de monetización sugerido"
  }
}` : `You are a senior product strategist and business model architect.
Your MISSION: take the user's idea and EXPAND it with modules, integrations and opportunities that will make the project 10x more valuable.

Do NOT simply restate the idea. EXPAND the business model:
- Key technology modules (payments, CRM, notifications, geolocation, AI, digital signatures, dashboards, automation)
- Sector integrations (Stripe, payment gateways, logistics platforms, third-party APIs)
- Additional monetization channels (subscriptions, marketplace, white-label, premium API)
- Expanded market segments (B2B, B2C, government, franchises)
- Competitive differentiator (what makes this unique and hard to copy)

The "improved idea" must sound like a mature product pitch — 3-4 concrete sentences.

Return ONLY valid JSON without markdown:
{
  "improved": "Expanded idea as professional pitch (3-4 sentences)",
  "addedModules": ["Electronic payment module (Stripe/MercadoPago)", "Integrated CRM", "Analytics dashboard", ...],
  "analysis": {
    "sector": "Identified industry",
    "audience": "Expanded audience with new segments",
    "problem": "Problem being solved",
    "monetization": "Suggested monetization model"
  }
}`;

        const userPrompt = isSpanish ? `Toma esta idea y EXPÁNDELA con módulos tecnológicos, integraciones y oportunidades de negocio que la hacen 10x mejor:

Idea: "${briefIdea}"

Agrega módulos concretos (pagos, CRM, automatización, etc.), integraciones del sector, y nuevas formas de monetizar. Imagina cómo vería esta idea un architecture review: ¿qué le falta? ¿qué la haría más robusta?

Devuelve JSON con la idea expandida y lista de módulos añadidos.` : `Take this idea and EXPAND it with technology modules, integrations and business opportunities that make it 10x better:

Idea: "${briefIdea}"

Add concrete modules (payments, CRM, automation, etc.), sector integrations, and new monetization pathways. Imagine how an architecture review would see this: what's missing? What would make it more robust?

Return JSON with expanded idea and list of added modules.`;

        try {
            // STEP 1: Resolve which AI model to use
            let modelToUse: string = 'claude-haiku-4-5-20251001'; // default
            let modelSource: string = 'default';

            // If role context provided and has specific aiModel, use it
            if (roleContext?.aiModel) {
                modelToUse = roleContext.aiModel;
                modelSource = `role:${roleContext.roleId}`;
            } else {
                // Otherwise, try to get primary active model from AdminConsole
                try {
                    const activeModels = await aiModelsService.getActiveModels();
                    const primaryGoogleModel = activeModels.find(m => m.provider === 'google' && m.isActive);
                    if (primaryGoogleModel?.modelName) {
                        modelToUse = primaryGoogleModel.modelName;
                        modelSource = 'adminconsole:primary';
                    }
                } catch (adminError) {
                    console.warn('[suggestionsService] Could not fetch models from AdminConsole, using built-in default:', adminError);
                    modelSource = 'builtin:fallback';
                }
            }

            // STEP 2: Try primary model
            let lastError: any;
            try {
                const result = await aiService.generateJSON(
                    modelToUse,
                    systemPrompt,
                    userPrompt,
                    {
                        temperature: 0.7,
                        maxTokens: 500
                    }
                );

                // Validate result has required fields
                if (result.improved && result.analysis) {
                    return {
                        ...result,
                        modelUsed: modelToUse
                    } as SuggestionResult;
                }

                // Fallback if structure is different
                return {
                    improved: typeof result === 'string' ? result : (result.improved || briefIdea),
                    analysis: result.analysis || {},
                    modelUsed: modelToUse
                };
            } catch (primaryError) {
                lastError = primaryError;
                console.warn(`[suggestionsService] Primary model '${modelToUse}' failed (${modelSource}):`, primaryError);

                // STEP 3: Fallback chain - try alternative models
                const fallbackModels = ['claude-haiku-4-5-20251001'];

                for (const fallbackModel of fallbackModels) {
                    if (fallbackModel === modelToUse) continue; // Skip if same as primary

                    try {
                        console.warn(`[suggestionsService] Attempting fallback model: ${fallbackModel}`);
                        const result = await aiService.generateJSON(
                            fallbackModel,
                            systemPrompt,
                            userPrompt,
                            {
                                temperature: 0.7,
                                maxTokens: 500
                            }
                        );

                        if (result.improved && result.analysis) {
                            console.warn(`[suggestionsService] Fallback succeeded with ${fallbackModel}`);
                            return {
                                ...result,
                                modelUsed: fallbackModel
                            } as SuggestionResult;
                        }

                        return {
                            improved: typeof result === 'string' ? result : (result.improved || briefIdea),
                            analysis: result.analysis || {},
                            modelUsed: fallbackModel
                        };
                    } catch (fallbackError) {
                        console.warn(`[suggestionsService] Fallback model '${fallbackModel}' also failed:`, fallbackError);
                        lastError = fallbackError;
                        continue;
                    }
                }

                // All models failed - log comprehensive error and return fallback
                console.error('[suggestionsService] All AI models exhausted. Primary:', modelToUse, 'Error:', lastError);
                throw new Error(`All AI models failed. Last error: ${lastError?.message || 'Unknown'}`);
            }
        } catch (error: any) {
            console.error('[suggestionsService] Fatal error improving idea:', error);

            // Return graceful fallback with error tracking
            return {
                improved: briefIdea,
                analysis: {
                    additionalContext: `[⚠️ System unable to enhance idea - using original. Error: ${error?.message?.slice(0, 50) || 'Unknown error'}]`
                },
                modelUsed: 'error:fallback'
            };
        }
    },

    /**
     * Quick check if an idea is too brief (heuristic)
     * Uses simple word count + complexity analysis
     */
    isTooShort: (idea: string): boolean => {
        const wordCount = idea.trim().split(/\s+/).length;
        const hasSector = /sector|industry|app|platform|sistema|plataforma|servicio/i.test(idea);
        const hasAudience = /para|users?|personas?|clientes?|empresas?|gente|edad|años|profesionales?|jóvenes/i.test(idea);
        const hasProblem = /problema|solución|necesidad|ayuda|facilita|resuelve|simplifica|mejora/i.test(idea);

        // If < 8 words AND missing key components → too short
        if (wordCount < 8) {
            const componentsPresent = [hasSector, hasAudience, hasProblem].filter(Boolean).length;
            return componentsPresent < 2;
        }

        return false;
    }
};
