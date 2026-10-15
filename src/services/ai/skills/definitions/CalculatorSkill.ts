import { SkillDefinition, SkillResult } from '../../../../types/skills';

/**
 * CalculatorSkill - Cálculos financieros
 * 
 * Soporta:
 * - ROI (Return on Investment)
 * - Payback Period
 * - NPV (Net Present Value) - TODO
 * - IRR (Internal Rate of Return) - TODO
 */
export const CalculatorSkill: SkillDefinition = {
    id: 'calculator',
    name: 'Financial Calculator',
    description: 'Realiza cálculos financieros (ROI, payback, NPV, IRR)',
    category: 'calculation',
    parameters: [
        {
            name: 'operation',
            type: 'string',
            description: 'Tipo de cálculo: roi, payback, npv, irr',
            required: true
        },
        {
            name: 'values',
            type: 'array',
            description: 'Valores para el cálculo (depende de la operación)',
            required: true
        }
    ],
    execute: async (params): Promise<SkillResult> => {
        const startTime = Date.now();

        try {
            const { operation, values } = params;

            if (!Array.isArray(values)) {
                throw new Error('Values must be an array');
            }

            let result: any;
            let explanation: string;

            switch (operation.toLowerCase()) {
                case 'roi': {
                    // ROI = ((Profit - Investment) / Investment) * 100
                    const [investment, profit] = values;
                    if (!investment || !profit) {
                        throw new Error('ROI requires [investment, profit]');
                    }
                    result = ((profit - investment) / investment) * 100;
                    explanation = `ROI: ${result.toFixed(2)}% (Investment: $${investment}, Profit: $${profit})`;
                    break;
                }

                case 'payback': {
                    // Payback Period = Initial Investment / Monthly Revenue
                    const [initialInvestment, monthlyRevenue] = values;
                    if (!initialInvestment || !monthlyRevenue) {
                        throw new Error('Payback requires [initialInvestment, monthlyRevenue]');
                    }
                    result = initialInvestment / monthlyRevenue;
                    explanation = `Payback Period: ${result.toFixed(1)} months (Investment: $${initialInvestment}, Monthly Revenue: $${monthlyRevenue})`;
                    break;
                }

                case 'npv':
                    // TODO: Implement NPV calculation
                    throw new Error('NPV calculation not yet implemented');

                case 'irr':
                    // TODO: Implement IRR calculation
                    throw new Error('IRR calculation not yet implemented');

                default:
                    throw new Error(`Unknown operation: ${operation}. Supported: roi, payback, npv, irr`);
            }

            console.log(`[CalculatorSkill] ✓ ${operation}: ${result}`);

            return {
                success: true,
                data: {
                    operation,
                    result,
                    values,
                    explanation
                },
                metadata: {
                    executionTime: Date.now() - startTime
                }
            };
        } catch (error: any) {
            console.error('[CalculatorSkill] Error:', error);
            return {
                success: false,
                error: error.message,
                metadata: {
                    executionTime: Date.now() - startTime
                }
            };
        }
    }
};
