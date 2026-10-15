import { Topic, LongTermMemory, TopicClosureDecision } from '../../types/memory';
import { ChatMessage } from '../../types/war-room';

/**
 * MemoryManager - Gestiona memoria de largo plazo y cierre de temas
 * 
 * Responsabilidades:
 * - Detectar cuándo un tema debe cerrarse
 * - Generar resúmenes de temas cerrados
 * - Mantener memoria de largo plazo
 * - Optimizar uso de tokens
 */
export class MemoryManager {
    private static readonly MAX_TOKENS_PER_TOPIC = 500;
    private static readonly MAX_TOPICS_IN_MEMORY = 10;
    private static readonly TURNS_BEFORE_FORCED_CLOSURE = 8; // Forzar cierre después de 8 turnos

    /**
     * Decide si un tema debe cerrarse basándose en el historial
     */
    static shouldCloseTopic(
        history: ChatMessage[],
        turnCount: number
    ): TopicClosureDecision {
        // Criterio 1: Forzar cierre después de N turnos
        if (turnCount >= this.TURNS_BEFORE_FORCED_CLOSURE) {
            return {
                shouldClose: true,
                reason: `Límite de turnos alcanzado (${turnCount}/${this.TURNS_BEFORE_FORCED_CLOSURE})`,
                confidence: 100
            };
        }

        // Criterio 2: Detectar consenso en los últimos 2 mensajes
        if (history.length >= 4) {
            const lastMessages = history.slice(-2);
            const hasConsensus = lastMessages.every(msg =>
                msg.text.toLowerCase().includes('acepto') ||
                msg.text.toLowerCase().includes('de acuerdo') ||
                msg.text.toLowerCase().includes('i accept') ||
                msg.text.toLowerCase().includes('agreed')
            );

            if (hasConsensus) {
                return {
                    shouldClose: true,
                    reason: 'Consenso detectado entre agentes',
                    confidence: 85
                };
            }
        }

        // Criterio 3: Detectar decisión final en el último mensaje
        if (history.length > 0) {
            const lastMessage = history[history.length - 1];
            const hasFinalDecision =
                lastMessage.text.toLowerCase().includes('decisión final') ||
                lastMessage.text.toLowerCase().includes('final decision') ||
                lastMessage.text.toLowerCase().includes('conclusión') ||
                lastMessage.text.toLowerCase().includes('conclusion');

            if (hasFinalDecision) {
                return {
                    shouldClose: true,
                    reason: 'Decisión final detectada',
                    confidence: 90
                };
            }
        }

        // No cerrar todavía
        return {
            shouldClose: false,
            reason: `Debate en curso (${turnCount}/${this.TURNS_BEFORE_FORCED_CLOSURE} turnos)`,
            confidence: 0
        };
    }

    /**
     * Cierra un tema y genera su resumen
     * TODO: Usar el modelo de IA para generar resumen inteligente
     */
    static async closeTopic(
        history: ChatMessage[],
        topicTitle?: string
    ): Promise<Topic> {
        const timestamp = Date.now();

        // Generar título automático si no se proporciona
        const title = topicTitle || this.generateTopicTitle(history);

        // Generar resumen (por ahora, simple concatenación)
        // TODO: Usar el modelo de IA para generar resumen inteligente
        const summary = this.generateSummary(history);
        const conclusion = this.extractConclusion(history);

        // Estimar tokens (aproximado: 1 token ≈ 4 caracteres)
        const tokenCount = Math.ceil(summary.length / 4);

        // Extraer participantes únicos
        const participants = [...new Set(history.map(msg => msg.roleName))];

        return {
            id: `topic-${timestamp}`,
            title,
            summary,
            conclusion,
            timestamp,
            tokenCount,
            participants,
            turnCount: history.length
        };
    }

    /**
     * Agrega un tema cerrado a la memoria de largo plazo
     */
    static addTopicToMemory(
        memory: LongTermMemory,
        topic: Topic
    ): LongTermMemory {
        const updatedTopics = [...memory.topics, topic];

        // Limitar número de temas en memoria
        const limitedTopics = updatedTopics.slice(-this.MAX_TOPICS_IN_MEMORY);

        return {
            topics: limitedTopics,
            totalTokens: limitedTopics.reduce((sum, t) => sum + t.tokenCount, 0),
            currentTopicId: undefined // Reset current topic
        };
    }

    /**
     * Genera contexto de memoria para inyectar en prompts
     */
    static generateMemoryContext(memory: LongTermMemory, lang: 'es' | 'en'): string {
        if (memory.topics.length === 0) return '';

        const topicList = memory.topics.map((t, i) =>
            `${i + 1}. ${t.title}: ${t.conclusion}`
        ).join('\n');

        return lang === 'es'
            ? `\n\n--- MEMORIA DE LARGO PLAZO ---\nTemas previamente resueltos:\n${topicList}\n\nUsa esta información para mantener coherencia con decisiones pasadas.\n`
            : `\n\n--- LONG-TERM MEMORY ---\nPreviously resolved topics:\n${topicList}\n\nUse this information to maintain consistency with past decisions.\n`;
    }

    /**
     * Genera título automático del tema
     */
    private static generateTopicTitle(history: ChatMessage[]): string {
        if (history.length === 0) return 'Tema sin título';

        // Usar el primer mensaje como base para el título
        const firstMessage = history[0].text;
        const words = firstMessage.split(' ').slice(0, 6).join(' ');
        return words.length > 50 ? words.substring(0, 50) + '...' : words;
    }

    /**
     * Genera resumen del debate
     */
    private static generateSummary(history: ChatMessage[]): string {
        // Por ahora, concatenar los últimos 3 mensajes
        // TODO: Usar el modelo de IA para generar resumen inteligente
        const lastMessages = history.slice(-3);
        return lastMessages.map(msg =>
            `${msg.roleName}: ${msg.text.substring(0, 200)}`
        ).join('\n\n');
    }

    /**
     * Extrae conclusión del debate
     */
    private static extractConclusion(history: ChatMessage[]): string {
        if (history.length === 0) return 'Sin conclusión';

        // Usar el último mensaje como conclusión
        const lastMessage = history[history.length - 1];
        return lastMessage.text.substring(0, 300);
    }

    /**
     * Resetea memoria de corto plazo
     */
    static resetShortTermMemory(): ChatMessage[] {
        console.log('[MemoryManager] Short-term memory reset');
        return [];
    }
}
