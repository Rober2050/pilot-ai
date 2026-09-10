import { SkillRegistry } from './SkillRegistry';
import { WebSearchSkill } from './definitions/WebSearchSkill';
import { CalculatorSkill } from './definitions/CalculatorSkill';

/**
 * Inicializa todas las skills del sistema
 * Debe llamarse al inicio de la aplicación (main.tsx o App.tsx)
 */
export function initializeSkills(): void {
    console.log('[Skills] Initializing skills system...');

    // Registrar skills básicas
    SkillRegistry.register(WebSearchSkill);
    SkillRegistry.register(CalculatorSkill);

    // TODO: Agregar más skills según se implementen
    // SkillRegistry.register(DomainLoaderSkill);
    // SkillRegistry.register(MarketAnalysisSkill);
    // SkillRegistry.register(TechStackAnalyzerSkill);

    const registeredSkills = SkillRegistry.getAll();
    console.log(`[Skills] ✓ Initialized ${registeredSkills.length} skills:`,
        registeredSkills.map(s => s.id).join(', ')
    );
}

// Re-export para facilitar imports
export { SkillRegistry } from './SkillRegistry';
export { SkillExecutor } from './SkillExecutor';
export * from './definitions/WebSearchSkill';
export * from './definitions/CalculatorSkill';
