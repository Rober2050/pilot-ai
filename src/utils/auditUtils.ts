/**
 * Audit Utilities
 * 
 * Provides deep audit capabilities for Strategy Analyst:
 * - Source validation
 * - Temporal relevance checking
 * - Cross-validation
 * - Red flag detection
 */

export interface AuditGuidelines {
    sourceValidation: string;
    sourceValidationEs: string;
    temporalRelevance: string;
    temporalRelevanceEs: string;
    crossValidation: string;
    crossValidationEs: string;
    redFlags: string[];
    redFlagsEs: string[];
}

/**
 * Deep audit guidelines for Strategy Analyst
 */
const AUDIT_GUIDELINES: AuditGuidelines = {
    sourceValidation: `
**SOURCE CREDIBILITY HIERARCHY:**
1. **Tier 1 (Highest):** Industry reports (Gartner, McKinsey, BCG), Government data, Academic research
2. **Tier 2 (High):** Public company financials (10-K, earnings calls), Reputable news (WSJ, FT, Bloomberg)
3. **Tier 3 (Medium):** Industry blogs (TechCrunch, VentureBeat), Company press releases
4. **Tier 4 (Low):** Social media, Unverified blogs, Anonymous sources

**VALIDATION RULES:**
- Prioritize Tier 1-2 sources
- Flag if only Tier 3-4 sources available
- Cross-reference numbers from multiple sources
- Check author credentials and publication date`,

    sourceValidationEs: `
**JERARQUÍA DE CREDIBILIDAD DE FUENTES:**
1. **Nivel 1 (Máximo):** Reportes de industria (Gartner, McKinsey, BCG), Datos gubernamentales, Investigación académica
2. **Nivel 2 (Alto):** Finanzas de empresas públicas (10-K, earnings calls), Noticias reputadas (WSJ, FT, Bloomberg)
3. **Nivel 3 (Medio):** Blogs de industria (TechCrunch, VentureBeat), Comunicados de prensa
4. **Nivel 4 (Bajo):** Redes sociales, Blogs no verificados, Fuentes anónimas

**REGLAS DE VALIDACIÓN:**
- Priorizar fuentes Nivel 1-2
- Marcar si solo hay fuentes Nivel 3-4
- Cruzar números de múltiples fuentes
- Verificar credenciales del autor y fecha de publicación`,

    temporalRelevance: `
**TEMPORAL RELEVANCE RULES:**
- **Preferred:** Data < 2 years old
- **Acceptable:** Data 2-3 years old (with caveat)
- **Questionable:** Data > 3 years old (flag as outdated)
- **Exception:** Historical trends (explicitly state time range)

**INSTRUCTIONS:**
- Always mention data recency
- Flag outdated data explicitly
- Adjust for market volatility (e.g., post-COVID, AI boom)`,

    temporalRelevanceEs: `
**REGLAS DE RELEVANCIA TEMPORAL:**
- **Preferido:** Datos < 2 años
- **Aceptable:** Datos 2-3 años (con salvedad)
- **Cuestionable:** Datos > 3 años (marcar como desactualizados)
- **Excepción:** Tendencias históricas (indicar rango temporal explícitamente)

**INSTRUCCIONES:**
- Siempre mencionar antigüedad de los datos
- Marcar datos desactualizados explícitamente
- Ajustar por volatilidad del mercado (ej: post-COVID, boom de IA)`,

    crossValidation: `
**CROSS-VALIDATION PROTOCOL:**
1. **Minimum 2 sources** for any critical number (market size, growth rate, etc.)
2. **Flag discrepancies** if sources differ by >20%
3. **Triangulate** using multiple methodologies (top-down vs bottom-up)
4. **Explain variance** if sources conflict

**EXAMPLE:**
"Market size: Source A (Gartner) estimates $5B, Source B (Statista) estimates $6B. Using conservative $5B."`,

    crossValidationEs: `
**PROTOCOLO DE VALIDACIÓN CRUZADA:**
1. **Mínimo 2 fuentes** para cualquier número crítico (tamaño de mercado, tasa de crecimiento, etc.)
2. **Marcar discrepancias** si las fuentes difieren >20%
3. **Triangular** usando múltiples metodologías (top-down vs bottom-up)
4. **Explicar varianza** si las fuentes entran en conflicto

**EJEMPLO:**
"Tamaño de mercado: Fuente A (Gartner) estima $5B, Fuente B (Statista) estima $6B. Usando conservador $5B."`,

    redFlags: [
        "No sources cited for market size claims",
        "Unrealistic growth projections (>100% YoY without justification)",
        "LTV/CAC ratio < 3x",
        "Churn rate > 20% (for SaaS)",
        "No competitive analysis",
        "Vague target market definition",
        "Overly optimistic assumptions",
        "Missing unit economics",
        "No mention of customer acquisition strategy",
        "Ignoring regulatory/compliance risks"
    ],

    redFlagsEs: [
        "No se citan fuentes para afirmaciones de tamaño de mercado",
        "Proyecciones de crecimiento irreales (>100% YoY sin justificación)",
        "Ratio LTV/CAC < 3x",
        "Tasa de abandono > 20% (para SaaS)",
        "Sin análisis competitivo",
        "Definición vaga del mercado objetivo",
        "Supuestos excesivamente optimistas",
        "Faltan unit economics",
        "No se menciona estrategia de adquisición de clientes",
        "Ignora riesgos regulatorios/de cumplimiento"
    ]
};

export class AuditUtils {

    /**
     * Generate deep audit context for AI prompt
     */
    static generateAuditContext(lang: 'es' | 'en' = 'en'): string {
        const guidelines = AUDIT_GUIDELINES;

        if (lang === 'es') {
            return `
--- PROTOCOLO DE AUDITORÍA PROFUNDA ---

${guidelines.sourceValidationEs}

${guidelines.temporalRelevanceEs}

${guidelines.crossValidationEs}

**RED FLAGS A DETECTAR:**
${guidelines.redFlagsEs.map((flag, i) => `${i + 1}. ${flag}`).join('\n')}

**INSTRUCCIÓN CRÍTICA:**
No te limites a decir "datos encontrados" o "no encontrados". EVALÚA:
- ¿La fuente es confiable? (Nivel 1-4)
- ¿Los datos son recientes? (< 2 años)
- ¿Hay confirmación de múltiples fuentes?
- ¿Hay contradicciones o red flags?

Si encuentras problemas, EXPLICA qué significa para la viabilidad del negocio y CÓMO afecta al puntaje (score).
DEBES generar un campo "metrics_rationale" explicando el Veredicto.

**CITACIÓN DE FUENTES (OBLIGATORIO):**
Para cada afirmación factual (tamaño de mercado, tasa de crecimiento, etc.), 
DEBES citar la fuente en el array 'sources' con:
- claim: Lo que estás afirmando
- source: Nombre de la fuente (ej: "Gartner Report 2024")
- url: URL si está disponible
- tier: Nivel de credibilidad (1-4)
- year: Año de publicación

EJEMPLO:
{
  "market_size": "$5B",
  "sources": [
    {
      "claim": "Tamaño de mercado $5B en 2024",
      "source": "Gartner: Análisis de Mercado SaaS 2024",
      "url": "https://gartner.com/...",
      "tier": 1,
      "year": 2024
    }
  ]
}
`;
        } else {
            return `
--- DEEP AUDIT PROTOCOL ---

${guidelines.sourceValidation}

${guidelines.temporalRelevance}

${guidelines.crossValidation}

**RED FLAGS TO DETECT:**
${guidelines.redFlags.map((flag, i) => `${i + 1}. ${flag}`).join('\n')}

**CRITICAL INSTRUCTION:**
Don't just say "data found" or "not found". EVALUATE:
- Is the source reliable? (Tier 1-4)
- Is the data recent? (< 2 years)
- Is there confirmation from multiple sources?
- Are there contradictions or red flags?

If you find issues, EXPLAIN what it means for business viability.

**SOURCE CITATION (MANDATORY):**
For every factual claim (market size, growth rate, etc.), 
you MUST cite the source in the 'sources' array with:
- claim: What you're claiming
- source: Name of source (e.g., "Gartner Report 2024")
- url: URL if available
- tier: Credibility tier (1-4)
- year: Publication year

EXAMPLE:
{
  "market_size": "$5B",
  "sources": [
    {
      "claim": "Market size $5B in 2024",
      "source": "Gartner: SaaS Market Analysis 2024",
      "url": "https://gartner.com/...",
      "tier": 1,
      "year": 2024
    }
  ]
}
`;
        }
    }

    /**
     * Validate if a year is recent enough
     */
    static isDataRecent(year: number): { isRecent: boolean; warning?: string } {
        const currentYear = new Date().getFullYear();
        const age = currentYear - year;

        if (age <= 2) {
            return { isRecent: true };
        } else if (age <= 3) {
            return {
                isRecent: false,
                warning: `Data is ${age} years old (acceptable but not ideal)`
            };
        } else {
            return {
                isRecent: false,
                warning: `Data is ${age} years old (outdated, use with caution)`
            };
        }
    }

    /**
     * Check if two sources have significant discrepancy
     */
    static hasSignificantDiscrepancy(value1: number, value2: number): boolean {
        const diff = Math.abs(value1 - value2);
        const avg = (value1 + value2) / 2;
        const percentDiff = (diff / avg) * 100;

        return percentDiff > 20;
    }
}
