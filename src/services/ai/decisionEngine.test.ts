import { describe, test, expect, vi } from 'vitest';
import { decisionEngine } from './decisionEngine';
import { RoleConfig } from '../../types/roles';

// Mock AI service
vi.mock('./aiService', () => ({
    aiService: {
        generateContent: vi.fn().mockResolvedValue(`
            \`\`\`json
            {
                "feasibility": 85,
                "desirability": 90,
                "viability": 80,
                "reasoning": "Strong project with low risk.",
                "riskAnalysis": "- Minor dependency risk"
            }
            \`\`\`
        `)
    }
}));

describe('Decision Engine', () => {
    const mockRoles: RoleConfig[] = [
        {
            roleId: 'pm', displayName: 'Product Manager', description: 'PM', model: 'claude-haiku-4-5-20251001', systemPrompt: '',
            temperature: 0.7, orderIndex: 1, isEnabled: true, docConfig: { text: true, charts: false, excel: false, flowDiagrams: false, swimlanes: false, c4: false, architecture: false, pdf: false, ppt: false, json: false, markdown: false, otherFormats: [] }
        },
        {
            roleId: 'dev', displayName: 'Developer', description: 'Dev', model: 'claude-haiku-4-5-20251001', systemPrompt: '',
            temperature: 0.7, orderIndex: 2, isEnabled: true, docConfig: { text: true, charts: false, excel: false, flowDiagrams: false, swimlanes: false, c4: false, architecture: false, pdf: false, ppt: false, json: false, markdown: false, otherFormats: [] }
        }
    ];

    const mockTranscript = [
        { roleName: 'Product Manager', content: 'We should build this feature.' },
        { roleName: 'Developer', content: 'It is technically feasible.' }
    ];

    test('analyzeSession returns valid DecisionResult', async () => {
        const result = await decisionEngine.analyzeSession('Test Topic', mockTranscript, mockRoles);

        expect(result).toBeDefined();
        expect(result.score.feasibility).toBe(85);
        expect(result.score.desirability).toBe(90);
        expect(result.score.viability).toBe(80);
        expect(result.finalScore).toBe(85); // (85+90+80)/3 = 85
        expect(result.verdict).toBe('GO');
    });

    test('analyzeSession handles low scores correctly (NO GO)', async () => {
        // Override mock for this test
        const { aiService } = require('./aiService');
        aiService.generateContent.mockResolvedValueOnce(`
            {
                "feasibility": 30,
                "desirability": 40,
                "viability": 50,
                "reasoning": "Technical blocker.",
                "riskAnalysis": "Impossible to build."
            }
        `);

        const result = await decisionEngine.analyzeSession('Bad Idea', mockTranscript, mockRoles);

        expect(result.verdict).toBe('NO GO');
        expect(result.score.feasibility).toBe(30);
    });
});
