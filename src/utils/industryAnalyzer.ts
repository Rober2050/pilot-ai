/**
 * Industry Analyzer Utility
 * 
 * Provides industry-specific context, metrics, and benchmarks for business analysis.
 * Used by Strategy Analyst to apply sector-specific intelligence.
 */

export interface IndustryMetrics {
    industry: string;
    industryEs: string;
    avgCAC: number;
    avgLTV: number;
    avgChurnRate: number;
    avgGrowthRate: number;
    avgMargin: number;
    keyMetrics: string[];
    keyMetricsEs: string[];
    commonRisks: string[];
    commonRisksEs: string[];
}

/**
 * Industry benchmarks database
 * Sources: Industry reports, VC data, public company financials
 */
const INDUSTRY_BENCHMARKS: Record<string, IndustryMetrics> = {
    'saas': {
        industry: 'SaaS (Software as a Service)',
        industryEs: 'SaaS (Software como Servicio)',
        avgCAC: 200,
        avgLTV: 1200,
        avgChurnRate: 5,
        avgGrowthRate: 20,
        avgMargin: 75,
        keyMetrics: ['MRR', 'ARR', 'CAC', 'LTV', 'Churn Rate', 'NRR', 'Magic Number'],
        keyMetricsEs: ['MRR', 'ARR', 'CAC', 'LTV', 'Tasa de Abandono', 'NRR', 'Número Mágico'],
        commonRisks: ['High churn', 'Long sales cycles', 'Competition', 'Customer concentration'],
        commonRisksEs: ['Alta rotación', 'Ciclos de venta largos', 'Competencia', 'Concentración de clientes']
    },
    'ecommerce': {
        industry: 'E-commerce',
        industryEs: 'Comercio Electrónico',
        avgCAC: 50,
        avgLTV: 300,
        avgChurnRate: 15,
        avgGrowthRate: 15,
        avgMargin: 35,
        keyMetrics: ['AOV', 'CAC', 'LTV', 'Conversion Rate', 'Cart Abandonment', 'ROAS'],
        keyMetricsEs: ['Valor Promedio de Orden', 'CAC', 'LTV', 'Tasa de Conversión', 'Abandono de Carrito', 'ROAS'],
        commonRisks: ['Logistics issues', 'Inventory management', 'Returns', 'Seasonality'],
        commonRisksEs: ['Problemas logísticos', 'Gestión de inventario', 'Devoluciones', 'Estacionalidad']
    },
    'marketplace': {
        industry: 'Marketplace',
        industryEs: 'Marketplace',
        avgCAC: 100,
        avgLTV: 800,
        avgChurnRate: 10,
        avgGrowthRate: 25,
        avgMargin: 20,
        keyMetrics: ['GMV', 'Take Rate', 'Active Users', 'Liquidity', 'CAC', 'LTV'],
        keyMetricsEs: ['GMV', 'Tasa de Comisión', 'Usuarios Activos', 'Liquidez', 'CAC', 'LTV'],
        commonRisks: ['Chicken-egg problem', 'Disintermediation', 'Quality control', 'Fraud'],
        commonRisksEs: ['Problema del huevo y la gallina', 'Desintermediación', 'Control de calidad', 'Fraude']
    },
    'fintech': {
        industry: 'Fintech',
        industryEs: 'Fintech',
        avgCAC: 150,
        avgLTV: 1000,
        avgChurnRate: 8,
        avgGrowthRate: 30,
        avgMargin: 60,
        keyMetrics: ['AUM', 'Transaction Volume', 'CAC', 'LTV', 'Fraud Rate', 'Compliance Cost'],
        keyMetricsEs: ['Activos Bajo Gestión', 'Volumen de Transacciones', 'CAC', 'LTV', 'Tasa de Fraude', 'Costo de Cumplimiento'],
        commonRisks: ['Regulatory changes', 'Security breaches', 'Trust issues', 'Capital requirements'],
        commonRisksEs: ['Cambios regulatorios', 'Brechas de seguridad', 'Problemas de confianza', 'Requisitos de capital']
    },
    'healthtech': {
        industry: 'HealthTech',
        industryEs: 'HealthTech',
        avgCAC: 300,
        avgLTV: 2000,
        avgChurnRate: 6,
        avgGrowthRate: 18,
        avgMargin: 50,
        keyMetrics: ['Patient Acquisition Cost', 'LTV', 'Utilization Rate', 'NPS', 'Compliance Cost'],
        keyMetricsEs: ['Costo de Adquisición de Pacientes', 'LTV', 'Tasa de Utilización', 'NPS', 'Costo de Cumplimiento'],
        commonRisks: ['HIPAA compliance', 'Data privacy', 'Liability', 'Slow adoption'],
        commonRisksEs: ['Cumplimiento HIPAA', 'Privacidad de datos', 'Responsabilidad', 'Adopción lenta']
    },
    'edtech': {
        industry: 'EdTech',
        industryEs: 'EdTech',
        avgCAC: 80,
        avgLTV: 500,
        avgChurnRate: 12,
        avgGrowthRate: 22,
        avgMargin: 65,
        keyMetrics: ['Student Acquisition Cost', 'LTV', 'Completion Rate', 'Engagement', 'NPS'],
        keyMetricsEs: ['Costo de Adquisición de Estudiantes', 'LTV', 'Tasa de Finalización', 'Engagement', 'NPS'],
        commonRisks: ['Content quality', 'Accreditation', 'Competition', 'Seasonality'],
        commonRisksEs: ['Calidad del contenido', 'Acreditación', 'Competencia', 'Estacionalidad']
    },
    'general': {
        industry: 'General Business',
        industryEs: 'Negocio General',
        avgCAC: 100,
        avgLTV: 500,
        avgChurnRate: 10,
        avgGrowthRate: 15,
        avgMargin: 40,
        keyMetrics: ['Revenue', 'Profit Margin', 'CAC', 'LTV', 'Growth Rate'],
        keyMetricsEs: ['Ingresos', 'Margen de Beneficio', 'CAC', 'LTV', 'Tasa de Crecimiento'],
        commonRisks: ['Market competition', 'Cash flow', 'Scalability', 'Team execution'],
        commonRisksEs: ['Competencia de mercado', 'Flujo de caja', 'Escalabilidad', 'Ejecución del equipo']
    }
};

export class IndustryAnalyzer {

    /**
     * Detect industry from business idea description
     */
    static detectIndustry(idea: string): string {
        const lower = idea.toLowerCase();

        // SaaS
        if (lower.match(/\b(saas|software|plataforma|platform|cloud|api|subscription)\b/)) {
            return 'saas';
        }

        // E-commerce
        if (lower.match(/\b(ecommerce|e-commerce|tienda|store|shop|retail|venta online)\b/)) {
            return 'ecommerce';
        }

        // Marketplace
        if (lower.match(/\b(marketplace|market|conecta|connect|intermediar|platform que une)\b/)) {
            return 'marketplace';
        }

        // Fintech
        if (lower.match(/\b(fintech|financ|banco|bank|pago|payment|crypto|wallet|inversión|investment)\b/)) {
            return 'fintech';
        }

        // HealthTech
        if (lower.match(/\b(health|salud|médic|medical|paciente|patient|telemedicina|telemedicine)\b/)) {
            return 'healthtech';
        }

        // EdTech
        if (lower.match(/\b(edtech|educación|education|curso|course|learning|aprendizaje|estudiante|student)\b/)) {
            return 'edtech';
        }

        return 'general';
    }

    /**
     * Get metrics for a specific industry
     */
    static getMetrics(industry: string): IndustryMetrics | null {
        return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['general'];
    }

    /**
     * Generate industry context for AI prompt (English)
     */
    static generateIndustryContext(idea: string, lang: 'es' | 'en' = 'en'): string {
        const industry = this.detectIndustry(idea);
        const metrics = this.getMetrics(industry);

        if (!metrics) return '';

        if (lang === 'es') {
            return `
--- CONTEXTO DE INDUSTRIA ---
SECTOR IDENTIFICADO: ${metrics.industryEs}

BENCHMARKS DE LA INDUSTRIA:
- CAC Promedio: $${metrics.avgCAC}
- LTV Promedio: $${metrics.avgLTV}
- Tasa de Abandono Promedio: ${metrics.avgChurnRate}%
- Tasa de Crecimiento Promedio: ${metrics.avgGrowthRate}%
- Margen Promedio: ${metrics.avgMargin}%

MÉTRICAS CLAVE A RASTREAR:
${metrics.keyMetricsEs.map(m => `- ${m}`).join('\n')}

RIESGOS COMUNES DEL SECTOR:
${metrics.commonRisksEs.map(r => `- ${r}`).join('\n')}

INSTRUCCIÓN: Compara la idea de negocio contra estos benchmarks de la industria. Identifica si los números propuestos son realistas o optimistas. Menciona riesgos específicos del sector.
`;
        } else {
            return `
--- INDUSTRY CONTEXT ---
IDENTIFIED SECTOR: ${metrics.industry}

INDUSTRY BENCHMARKS:
- Average CAC: $${metrics.avgCAC}
- Average LTV: $${metrics.avgLTV}
- Average Churn Rate: ${metrics.avgChurnRate}%
- Average Growth Rate: ${metrics.avgGrowthRate}%
- Average Margin: ${metrics.avgMargin}%

KEY METRICS TO TRACK:
${metrics.keyMetrics.map(m => `- ${m}`).join('\n')}

COMMON SECTOR RISKS:
${metrics.commonRisks.map(r => `- ${r}`).join('\n')}

INSTRUCTION: Compare the business idea against these industry benchmarks. Identify if proposed numbers are realistic or optimistic. Mention sector-specific risks.
`;
        }
    }

    /**
     * Validate if proposed metrics are realistic
     */
    static validateMetrics(
        industry: string,
        proposedCAC?: number,
        proposedLTV?: number,
        proposedChurn?: number,
        proposedGrowth?: number
    ): { isRealistic: boolean; warnings: string[] } {
        const benchmarks = this.getMetrics(industry);
        if (!benchmarks) return { isRealistic: true, warnings: [] };

        const warnings: string[] = [];

        // CAC validation (±50% tolerance)
        if (proposedCAC && proposedCAC < benchmarks.avgCAC * 0.5) {
            warnings.push(`CAC too low ($${proposedCAC} vs industry avg $${benchmarks.avgCAC})`);
        }

        // LTV validation
        if (proposedLTV && proposedCAC && proposedLTV / proposedCAC < 3) {
            warnings.push(`LTV/CAC ratio too low (${(proposedLTV / proposedCAC).toFixed(1)}x, should be >3x)`);
        }

        // Churn validation
        if (proposedChurn && proposedChurn > benchmarks.avgChurnRate * 2) {
            warnings.push(`Churn rate very high (${proposedChurn}% vs industry avg ${benchmarks.avgChurnRate}%)`);
        }

        // Growth validation
        if (proposedGrowth && proposedGrowth > benchmarks.avgGrowthRate * 3) {
            warnings.push(`Growth rate very optimistic (${proposedGrowth}% vs industry avg ${benchmarks.avgGrowthRate}%)`);
        }

        return {
            isRealistic: warnings.length === 0,
            warnings
        };
    }
}
