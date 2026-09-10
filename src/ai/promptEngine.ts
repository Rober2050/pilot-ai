import { RoleConfig } from '../types/roles';
import { DIAGRAM_PROTOCOL, EXCEL_PROTOCOL, CHART_PROTOCOL, PPT_PROTOCOL, JSON_ENFORCEMENT_PROTOCOL, STRATEGY_ANALYST_PROTOCOL, UX_DESIGNER_PROTOCOL, PRODUCT_MANAGER_PROTOCOL, BUSINESS_ANALYST_PROTOCOL, MARKETING_PROTOCOL, ARCHITECT_PROTOCOL, QA_PROTOCOL, DEVOPS_ENGINEER_PROTOCOL, PROJECT_MANAGER_PROTOCOL } from './protocols';

export const PromptEngine = {
    /**
     * Builds the final system prompt by merging the User Persona (from DB)
     * with the Technical Protocols (from Code) based on the role's configuration.
     */
    buildSystemPrompt: (role: RoleConfig): string => {
        let systemPrompt = role.systemPrompt;
        const protocols: string[] = [];

        // 1. Inject Diagram Protocol — skip for architect and devops-engineer (their protocols handle infra diagrams)
        if (role.roleId !== 'architect' && role.roleId !== 'devops-engineer' &&
            (role.docConfig?.flowDiagrams || role.docConfig?.swimlanes || role.docConfig?.c4 || role.docConfig?.architecture)) {
            protocols.push(DIAGRAM_PROTOCOL);
        }

        // 2. Inject Excel Protocol
        if (role.docConfig?.excel) {
            protocols.push(EXCEL_PROTOCOL);
        }

        // 3. Inject Chart Protocol
        if (role.docConfig?.charts) {
            protocols.push(CHART_PROTOCOL);
        }

        if (role.docConfig?.ppt) {
            protocols.push(PPT_PROTOCOL);
        }

        // 5. Inject Special Role Protocols (Safety Net)
        if (role.roleId === 'strategy-analyst' || role.roleId === 'strategy-manager') {
            protocols.push(STRATEGY_ANALYST_PROTOCOL);
        }

        // 6. Inject UX Designer Prototype Protocol
        if (role.roleId === 'ux-designer') {
            protocols.push(UX_DESIGNER_PROTOCOL);
        }

        // 7. Inject Product Manager Command Center Protocol
        if (role.roleId === 'product-manager') {
            protocols.push(PRODUCT_MANAGER_PROTOCOL);
        }

        // 8. Inject Business Analyst Protocol
        if (role.roleId === 'business-analyst') {
            protocols.push(BUSINESS_ANALYST_PROTOCOL);
        }

        // 9. Inject Marketing Manager Protocol
        if (role.roleId === 'marketing-manager') {
            protocols.push(MARKETING_PROTOCOL);
        }

        // 10. Inject Architect Protocol
        if (role.roleId === 'architect') {
            protocols.push(ARCHITECT_PROTOCOL);
        }

        // 11. Inject QA Engineer Protocol
        if (role.roleId === 'qa-engineer') {
            protocols.push(QA_PROTOCOL);
        }

        // 12. Inject DevOps Engineer Protocol
        if (role.roleId === 'devops-engineer') {
            protocols.push(DEVOPS_ENGINEER_PROTOCOL);
        }

        // 13. Inject Project Manager Protocol
        if (role.roleId === 'project-manager') {
            protocols.push(PROJECT_MANAGER_PROTOCOL);
        }

        // 14. Construct the Final Prompt
        if (protocols.length > 0) {
            systemPrompt += `\n\n--- SYSTEM PROTOCOLS (DO NOT MODIFY) ---\n`;
            systemPrompt += `The following technical requirements are MANDATORY for the output format:\n\n`;
            systemPrompt += protocols.join('\n\n');
            systemPrompt += `\n\n${JSON_ENFORCEMENT_PROTOCOL}`;
        }

        return systemPrompt;
    }
};
