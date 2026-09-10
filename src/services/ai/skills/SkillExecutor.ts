import { SkillRegistry } from './SkillRegistry';
import { SkillExecution, SkillResult } from '../../../types/skills';

/**
 * SkillExecutor - Ejecuta skills y maneja errores
 * 
 * Responsabilidades:
 * - Validar parámetros
 * - Ejecutar skills de forma segura
 * - Mantener historial de ejecuciones
 * - Manejar timeouts y errores
 */
export class SkillExecutor {
    private static executionHistory: SkillExecution[] = [];
    private static readonly MAX_HISTORY = 100; // Limitar historial
    private static readonly EXECUTION_TIMEOUT = 10000; // 10 segundos

    /**
     * Ejecuta una skill con los parámetros dados
     */
    static async execute(
        skillId: string,
        params: Record<string, any>,
        agentId: string
    ): Promise<SkillResult> {
        const skill = SkillRegistry.get(skillId);

        if (!skill) {
            return {
                success: false,
                error: `Skill not found: ${skillId}`,
                metadata: { executionTime: 0 }
            };
        }

        console.log(`[SkillExecutor] Executing ${skillId} for ${agentId}`, params);

        try {
            // Validar parámetros requeridos
            const missingParams = skill.parameters
                .filter(p => p.required && !(p.name in params))
                .map(p => p.name);

            if (missingParams.length > 0) {
                return {
                    success: false,
                    error: `Missing required parameters: ${missingParams.join(', ')}`,
                    metadata: { executionTime: 0 }
                };
            }

            // Ejecutar con timeout
            const result = await Promise.race([
                skill.execute(params),
                this.timeout(this.EXECUTION_TIMEOUT)
            ]);

            // Guardar en historial
            this.addToHistory({
                skillId,
                timestamp: Date.now(),
                agentId,
                params,
                result
            });

            console.log(`[SkillExecutor] ✓ ${skillId} completed in ${result.metadata?.executionTime}ms`);
            return result;

        } catch (error: any) {
            const errorResult: SkillResult = {
                success: false,
                error: error.message || 'Unknown error',
                metadata: { executionTime: 0 }
            };

            // Guardar error en historial
            this.addToHistory({
                skillId,
                timestamp: Date.now(),
                agentId,
                params,
                result: errorResult
            });

            return errorResult;
        }
    }

    /**
     * Timeout helper
     */
    private static timeout(ms: number): Promise<SkillResult> {
        return new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Skill execution timeout (${ms}ms)`)), ms)
        );
    }

    /**
     * Agrega ejecución al historial (con límite)
     */
    private static addToHistory(execution: SkillExecution): void {
        this.executionHistory.push(execution);

        // Mantener solo las últimas MAX_HISTORY ejecuciones
        if (this.executionHistory.length > this.MAX_HISTORY) {
            this.executionHistory = this.executionHistory.slice(-this.MAX_HISTORY);
        }
    }

    /**
     * Obtiene historial de ejecuciones
     */
    static getHistory(agentId?: string): SkillExecution[] {
        if (agentId) {
            return this.executionHistory.filter(e => e.agentId === agentId);
        }
        return this.executionHistory;
    }

    /**
     * Limpia historial
     */
    static clearHistory(): void {
        this.executionHistory = [];
        console.log('[SkillExecutor] History cleared');
    }

    /**
     * Obtiene estadísticas de ejecución
     */
    static getStats(): {
        totalExecutions: number;
        successRate: number;
        averageExecutionTime: number;
        bySkill: Record<string, number>;
    } {
        const total = this.executionHistory.length;
        const successful = this.executionHistory.filter(e => e.result.success).length;
        const avgTime = this.executionHistory.reduce((sum, e) =>
            sum + (e.result.metadata?.executionTime || 0), 0
        ) / total;

        const bySkill: Record<string, number> = {};
        this.executionHistory.forEach(e => {
            bySkill[e.skillId] = (bySkill[e.skillId] || 0) + 1;
        });

        return {
            totalExecutions: total,
            successRate: total > 0 ? (successful / total) * 100 : 0,
            averageExecutionTime: avgTime,
            bySkill
        };
    }
}
