import { SkillDefinition } from '../../../types/skills';

/**
 * SkillRegistry - Registro central de todas las skills disponibles
 * 
 * Permite:
 * - Registrar nuevas skills
 * - Obtener skills por ID, categoría o rol
 * - Listar todas las skills disponibles
 */
export class SkillRegistry {
    private static skills = new Map<string, SkillDefinition>();

    /**
     * Registra una nueva skill en el sistema
     */
    static register(skill: SkillDefinition): void {
        this.skills.set(skill.id, skill);
        console.log(`[SkillRegistry] ✓ Registered skill: ${skill.id}`);
    }

    /**
     * Obtiene una skill por su ID
     */
    static get(skillId: string): SkillDefinition | undefined {
        return this.skills.get(skillId);
    }

    /**
     * Obtiene todas las skills registradas
     */
    static getAll(): SkillDefinition[] {
        return Array.from(this.skills.values());
    }

    /**
     * Obtiene skills por categoría
     */
    static getByCategory(category: string): SkillDefinition[] {
        return this.getAll().filter(s => s.category === category);
    }

    /**
     * Obtiene skills disponibles para un rol específico
     */
    static getForRole(roleId: string): SkillDefinition[] {
        // Mapeo de roles a skills
        const roleSkillMap: Record<string, string[]> = {
            'strategy-analyst': ['web-search', 'domain-loader', 'market-analysis'],
            'product-manager': ['calculator', 'cost-estimator', 'roadmap-generator'],
            'cto': ['web-search', 'tech-stack-analyzer', 'architecture-validator'],
            'financial-analyst': ['calculator', 'financial-projections', 'risk-calculator']
        };

        const skillIds = roleSkillMap[roleId] || [];
        return skillIds.map(id => this.get(id)).filter(Boolean) as SkillDefinition[];
    }

    /**
     * Limpia todas las skills (útil para testing)
     */
    static clear(): void {
        this.skills.clear();
        console.log('[SkillRegistry] Cleared all skills');
    }
}
