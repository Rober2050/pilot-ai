/**
 * ModelRouter - Optimización de costos y latencia
 * 
 * Decisión inteligente entre Flash (rápido/barato) y Pro (profundo/caro)
 */

export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type TaskType = 'discovery' | 'debate' | 'synthesis' | 'skill_execution';

export interface ModelRoutingDecision {
    model: string;
    reasoning: string;
    estimatedLatency: number; // ms
    estimatedCost: number; // USD per 1M tokens
}

export class ModelRouter {
    /**
     * Selecciona el modelo óptimo basado en el tipo de tarea
     * 
     * REGLAS:
     * - Discovery/UI: SIEMPRE Flash (latencia <200ms)
     * - Debate simple: Flash
     * - Síntesis/Reasoning profundo: Pro
     * - Skills que requieren precisión: Pro
     */
    static selectModel(
        taskType: TaskType,
        complexity: TaskComplexity = 'medium'
    ): ModelRoutingDecision {

        // NOTA: Usar versiones 2.5 estables (según configuración del usuario)
        // Los modelos -exp no existen en la API, usar versiones estables
        const FLASH_MODEL = 'gemini-2.5-flash';
        const PRO_MODEL = 'gemini-2.5-pro';

        switch (taskType) {
            case 'discovery':
                return {
                    model: FLASH_MODEL,
                    reasoning: 'Discovery requiere latencia mínima para UX fluida',
                    estimatedLatency: 150,
                    estimatedCost: 0.00005
                };

            case 'debate':
                if (complexity === 'simple') {
                    return {
                        model: FLASH_MODEL,
                        reasoning: 'Debate estándar - modelo rápido (Flash)',
                        estimatedLatency: 200,
                        estimatedCost: 0.00005
                    };
                } else {
                    return {
                        model: PRO_MODEL,
                        reasoning: 'Debate complejo - análisis profundo (Pro)',
                        estimatedLatency: 800,
                        estimatedCost: 0.0002
                    };
                }

            case 'synthesis':
                return {
                    model: PRO_MODEL,
                    reasoning: 'Síntesis requiere coherencia y profundidad',
                    estimatedLatency: 1000,
                    estimatedCost: 0.0003
                };

            case 'skill_execution':
                if (complexity === 'complex') {
                    return {
                        model: PRO_MODEL,
                        reasoning: 'Skill compleja requiere precisión máxima',
                        estimatedLatency: 900,
                        estimatedCost: 0.00025
                    };
                } else {
                    return {
                        model: FLASH_MODEL,
                        reasoning: 'Skill simple puede usar modelo rápido',
                        estimatedLatency: 250,
                        estimatedCost: 0.00006
                    };
                }

            default:
                return {
                    model: FLASH_MODEL,
                    reasoning: 'Fallback a modelo rápido',
                    estimatedLatency: 200,
                    estimatedCost: 0.00005
                };
        }
    }

    /**
     * Estima el costo total de una sesión de War Room
     * Útil para mostrar al usuario antes de empezar
     */
    static estimateSessionCost(
        numRoles: number,
        numTopics: number,
        avgTokensPerTurn: number = 500
    ): number {
        // Estimación conservadora
        const turnsPerTopic = 6; // 2 rounds * 3 intervenciones
        const totalTurns = numRoles * numTopics * turnsPerTopic;
        const totalTokens = totalTurns * avgTokensPerTurn;

        // Asumiendo 70% Flash, 30% Pro
        const flashTokens = totalTokens * 0.7;
        const proTokens = totalTokens * 0.3;

        const flashCost = (flashTokens / 1_000_000) * 0.05; // $0.05 per 1M tokens
        const proCost = (proTokens / 1_000_000) * 0.20; // $0.20 per 1M tokens

        return flashCost + proCost;
    }
}

/**
 * EJEMPLO DE USO:
 * 
 * // En WarRoomService
 * const decision = ModelRouter.selectModel('debate', 'complex');
 * console.log(`Using ${decision.model} - ${decision.reasoning}`);
 * 
 * const model = genAI.getGenerativeModel({ model: decision.model });
 * 
 * // Antes de iniciar sesión
 * const estimatedCost = ModelRouter.estimateSessionCost(4, 3);
 * console.log(`Estimated session cost: $${estimatedCost.toFixed(4)}`);
 */
