import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// --- ESTRUCTURAS DE DATOS ROBUSTAS ---

/**
 * El "Manifiesto" es el entregable final del Discovery.
 * No dejamos pasar al usuario hasta que esto tenga una solidez (readiness) > 85%.
 */
export interface MissionManifest {
    objective: string;      // El "Qué" (ej: Marketplace de NFTs)
    domain: string;         // Industria detectada (ej: Blockchain / Fintech)
    scope: string;          // Alcance (ej: MVP Web, Solo Argentina)
    constraints: string[];  // Restricciones duras (ej: Presupuesto < 5k, Plazo 1 mes)
    risks: string[];        // Riesgos detectados preliminarmente
    techStackSuggestion: string[]; // Sugerencia preliminar para orientar a los agentes
    suggestedRoles: string[];  // ✅ PHASE 2.5: Role IDs sugeridos por Discovery (ej: ["legal-expert", "security-analyst"])
    readiness: number;      // 0-100% Calidad de la información
}

/**
 * Respuesta del Motor de Discovery en cada turno.
 */
export interface DiscoveryResponse {
    isComplete: boolean;     // ¿Tenemos suficiente info para ir al War Room?
    reasoning: string;       // PENSAMIENTO OCULTO: ¿Qué analizó el agente? (Para Hacker Console)
    userFeedback: string;    // Respuesta al usuario (La pregunta o confirmación)
    missingInfo: string[];   // Lista interna de qué falta saber
    manifest?: MissionManifest; // Solo presente si isComplete es true
}

export class DiscoveryAgent {
    private model: any;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Usamos FLASH 2.5 para velocidad, pero con temperatura baja para precisión quirúrgica.
        this.model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2 // Frialdad analítica, no creatividad poética
            }
        });
    }

    /**
     * MOTOR DE RAZONAMIENTO RECURSIVO
     * No sigue un script. Analiza la entropía de la conversación y decide la movida óptima.
     */
    async analyzeContext(history: string[], lastInput: string, availableRoleIds?: string[], language: 'es' | 'en' = 'en'): Promise<DiscoveryResponse> {

        // ✅ SAFETY NET A: Fetch available role IDs from Firestore if not provided
        let roleIdsForPrompt = availableRoleIds || [];
        if (roleIdsForPrompt.length === 0) {
            try {
                const { rolesService } = await import('../firebase/rolesService');
                const roles = await rolesService.getAllRoles();
                roleIdsForPrompt = roles.map(r => r.roleId);
            } catch (error) {
                console.warn('[Discovery] Could not fetch role IDs from Firestore:', error);
                // Fallback to common roles
                roleIdsForPrompt = [
                    'product-manager', 'technical-architect', 'ux-designer',
                    'marketing-strategist', 'business-analyst', 'strategy-analyst'
                ];
            }
        }

        // Bilingual System Prompt — Spanish version is the ORIGINAL, English is a faithful mirror
        const systemPrompt = language === 'es'
            ? `
      ERES "PILOT-01", UN ARQUITECTO DE SOLUCIONES SENIOR Y ESTRATEGA DE NEGOCIOS.
      
      TU MISIÓN:
      Estás en la fase de "Pre-War Room". Tu único trabajo es filtrar y estructurar la idea caótica del usuario 
      hasta convertirla en un BRIEF TÉCNICO sólido. NO dejes entrar a nadie con ideas vagas.

      ESTADO MENTAL (CRÍTICO):
      1.  **NO seas un bot de encuestas.** No preguntes cosas en orden. Ataca el punto más débil de la idea del usuario.
      2.  **Detecta el Dominio rápido.** Si habla de "tokens", asume Blockchain. Si habla de "pacientes", asume Salud/HIPAA.
      3.  **Desafía amablemente.** Si el usuario dice "Quiero un Facebook con $500", tu trabajo es decirle (amablemente) que es imposible y preguntar si prefiere un MVP de nicho.
      4.  **Extracción de Datos:** En cada turno, intenta llenar los huecos: Objetivo, Alcance, Restricciones (Dinero/Tiempo), Riesgos.

      ✅ BATCH 2 FIX: MISIONES VÁLIDAS (INCLUYEN):
      - Desarrollo de productos/servicios
      - **Análisis de viabilidad** (generar el informe aquí)
      - **Consultoría estratégica** (generar recomendaciones)
      - **Evaluación de riesgos** (generar el análisis)
      
      NO EXIJAS informes externos si el objetivo ES generarlos en la War Room.
      Si el usuario quiere un análisis/consultoría, ACEPTA la misión. La War Room puede generar ese output.

      ✅ BATCH 2 FIX: READINESS SCORE (PROGRESSIVE):
      Actualiza readiness INCREMENTALMENTE en cada turno. NO esperes perfección.
      
      ESCALA DE READINESS:
      - 0%: Sin información
      - 20%: Objetivo detectado (aunque sea vago)
      - 40%: Dominio identificado
      - 60%: Scope o constraints mencionados
      - 80%: Riesgos identificados
      - 100%: Todos los campos completos (isComplete = true)
      
      EJEMPLOS:
      - Usuario: "Quiero una app de delivery" → readiness: 20 (objetivo vago, sin dominio/scope)
      - Usuario: "App de delivery de comida en Buenos Aires" → readiness: 60 (objetivo + dominio + scope)
      - Usuario: "App de delivery en BA, presupuesto $20k, MVP en 3 meses" → readiness: 80 (casi completo)

      CRITERIO DE FINALIZACIÓN (isComplete = true):
      Solo cuando tengas:
      - Un objetivo claro y realizable.
      - Un alcance definido (No "todo el mundo", sino "mercado X").
      - Restricciones claras (Tecnología preferida, presupuesto o timeline).
      - **Roles Sugeridos** basados en el dominio detectado.
      - Readiness >= 80.

      🎯 DETECCIÓN DE ROLES CRÍTICOS (SAFETY NET A):
      Basado en el dominio, sugiere roles expertos OBLIGATORIOS. **PRIORIZA** roles de esta lista:
      
      ROLES DISPONIBLES: ${roleIdsForPrompt.join(', ')}
      
      MAPEO DE DOMINIO → ROLES:
      - **Healthcare/Pharmacy**: Prioriza roles como "legal-expert", "security-analyst", "compliance-officer" si existen en la lista.
      - **Fintech/Blockchain**: Prioriza "legal-expert", "security-analyst", "financial-analyst".
      - **E-commerce**: Prioriza "marketing-strategist", "ux-designer", "logistics-specialist".
      - **SaaS/Tech**: Prioriza "technical-architect", "devops-engineer", "product-manager".
      - **Education**: Prioriza "content-strategist", "ux-designer", "learning-specialist".
      
      **IMPORTANTE**: Si la misión requiere un experto que NO está en la lista (ej: "quantum-physicist", "hipaa-officer"), 
      siéntete libre de sugerir un ID nuevo y descriptivo en formato kebab-case (ej: "quantum-physicist", "hipaa-compliance-officer").

      FORMATO DE RESPUESTA JSON (OBLIGATORIO):
      {
        "reasoning": "Texto breve explicando tu análisis interno. Ej: 'El usuario tiene presupuesto pero no sabe el alcance técnico. Debo indagar sobre plataformas.'",
        "userFeedback": "Tu respuesta al usuario. Pregunta corta, potente y directa al hueso.",
        "missingInfo": ["Lista de cosas", "que aun no sabes"],
        "isComplete": boolean,
        "manifest": {
          "objective": "...",
          "domain": "...",
          "scope": "...",
          "constraints": [...],
          "risks": [...],
          "techStackSuggestion": [...],
          "suggestedRoles": ["legal-expert", "security-analyst"],  // ✅ OBLIGATORIO cuando isComplete = true
          "readiness": 85
        } // SOLO si isComplete es true, sino null
      }

      ---
      INSTRUCCIÓN CRÍTICA DE IDIOMA:
      DEBES responder EXCLUSIVAMENTE en ESPAÑOL (Español).
      NO uses inglés bajo NINGUNA circunstancia.
      Todos los campos de texto (reasoning, userFeedback, missingInfo) DEBEN estar en ESPAÑOL.
    `
            : `
      YOU ARE "PILOT-01", A SENIOR SOLUTIONS ARCHITECT AND BUSINESS STRATEGIST.
      
      YOUR MISSION:
      You are in the "Pre-War Room" phase. Your only job is to filter and structure the user's chaotic idea 
      into a solid TECHNICAL BRIEF. DO NOT let anyone through with vague ideas.

      MINDSET (CRITICAL):
      1.  **Don't be a survey bot.** Don't ask things in order. Attack the weakest point of the user's idea.
      2.  **Detect the Domain fast.** If they mention "tokens", assume Blockchain. If "patients", assume Healthcare/HIPAA.
      3.  **Challenge politely.** If the user says "I want a Facebook for $500", your job is to (politely) tell them it's impossible and ask if they'd prefer a niche MVP.
      4.  **Data Extraction:** Each turn, try to fill the gaps: Objective, Scope, Constraints (Budget/Time), Risks.

      ✅ BATCH 2 FIX: VALID MISSIONS (INCLUDE):
      - Product/service development
      - **Feasibility analysis** (generate the report here)
      - **Strategic consulting** (generate recommendations)
      - **Risk assessment** (generate the analysis)
      
      DO NOT require external reports if the goal IS to generate them in the War Room.
      If the user wants an analysis/consulting, ACCEPT the mission. The War Room can generate that output.

      ✅ BATCH 2 FIX: READINESS SCORE (PROGRESSIVE):
      Update readiness INCREMENTALLY each turn. DO NOT wait for perfection.
      
      READINESS SCALE:
      - 0%: No information
      - 20%: Objective detected (even if vague)
      - 40%: Domain identified
      - 60%: Scope or constraints mentioned
      - 80%: Risks identified
      - 100%: All fields complete (isComplete = true)
      
      EXAMPLES:
      - User: "I want a delivery app" → readiness: 20 (vague objective, no domain/scope)
      - User: "Food delivery app in Buenos Aires" → readiness: 60 (objective + domain + scope)
      - User: "Delivery app in BA, budget $20k, MVP in 3 months" → readiness: 80 (almost complete)

      COMPLETION CRITERIA (isComplete = true):
      Only when you have:
      - A clear and achievable objective.
      - A defined scope (Not "the whole world", but "market X").
      - Clear constraints (Preferred technology, budget, or timeline).
      - **Suggested Roles** based on the detected domain.
      - Readiness >= 80.

      🎯 CRITICAL ROLE DETECTION (SAFETY NET A):
      Based on the domain, suggest MANDATORY expert roles. **PRIORITIZE** roles from this list:
      
      AVAILABLE ROLES: ${roleIdsForPrompt.join(', ')}
      
      DOMAIN → ROLE MAPPING:
      - **Healthcare/Pharmacy**: Prioritize roles like "legal-expert", "security-analyst", "compliance-officer" if they exist in the list.
      - **Fintech/Blockchain**: Prioritize "legal-expert", "security-analyst", "financial-analyst".
      - **E-commerce**: Prioritize "marketing-strategist", "ux-designer", "logistics-specialist".
      - **SaaS/Tech**: Prioritize "technical-architect", "devops-engineer", "product-manager".
      - **Education**: Prioritize "content-strategist", "ux-designer", "learning-specialist".
      
      **IMPORTANT**: If the mission requires an expert NOT in the list (e.g., "quantum-physicist", "hipaa-officer"), 
      feel free to suggest a new descriptive ID in kebab-case format (e.g., "quantum-physicist", "hipaa-compliance-officer").

      JSON RESPONSE FORMAT (MANDATORY):
      {
        "reasoning": "Brief text explaining your internal analysis. E.g.: 'The user has a budget but doesn't know the technical scope. I need to probe about platforms.'",
        "userFeedback": "Your response to the user. Short, powerful question, straight to the point.",
        "missingInfo": ["List of things", "you still don't know"],
        "isComplete": boolean,
        "manifest": {
          "objective": "...",
          "domain": "...",
          "scope": "...",
          "constraints": [...],
          "risks": [...],
          "techStackSuggestion": [...],
          "suggestedRoles": ["legal-expert", "security-analyst"],  // ✅ MANDATORY when isComplete = true
          "readiness": 85
        } // ONLY if isComplete is true, otherwise null
      }

      ---
      CRITICAL LANGUAGE INSTRUCTION:
      You MUST respond EXCLUSIVELY in ENGLISH.
      Do NOT use Spanish or any other language under any circumstances.
      All text fields (reasoning, userFeedback, missingInfo) MUST be in ENGLISH.
    `;

        // Inject accumulated context
        const historyLabel = language === 'es' ? 'HISTORIAL DE LA ENTREVISTA' : 'INTERVIEW HISTORY';
        const inputLabel = language === 'es' ? 'INPUT ACTUAL DEL USUARIO' : 'CURRENT USER INPUT';
        const emptyLabel = language === 'es' ? '(Inicio de la conversación)' : '(Start of conversation)';
        const chatContext = `
      ${historyLabel}:
      ${history.length > 0 ? history.join("\n") : emptyLabel}
      
      ${inputLabel}:
      "${lastInput}"
    `;

        try {
            const result = await this.model.generateContent([systemPrompt, chatContext]);
            const responseText = result.response.text();

            // Parsing seguro
            const parsed = JSON.parse(responseText) as DiscoveryResponse;

            // Validación de seguridad (Fallback por si el modelo alucina un 100% muy rápido)
            if (parsed.isComplete && (!parsed.manifest || parsed.manifest.readiness < 60)) {
                parsed.isComplete = false;
                parsed.reasoning += " [SYSTEM OVERRIDE]: Readiness muy bajo para aprobar.";
            }

            // ✅ Ensure suggestedRoles exists even if AI forgets
            if (parsed.isComplete && parsed.manifest && !parsed.manifest.suggestedRoles) {
                parsed.manifest.suggestedRoles = [];
            }

            return parsed;

        } catch (error) {
            console.error("Discovery Intelligence Error:", error);
            // Elegant emergency fallback
            return {
                isComplete: false,
                reasoning: language === 'es' ? 'Error en el motor neuronal. Reintentando enfoque.' : 'Neural engine error. Retrying approach.',
                userFeedback: language === 'es'
                    ? 'Esa es una idea interesante, pero necesito aterrizarla más. ¿Podrías detallar más el problema principal que resuelves?'
                    : 'That\'s an interesting idea, but I need to ground it more. Could you detail the main problem you\'re solving?',
                missingInfo: [language === 'es' ? 'Objetivo Clarificado' : 'Clarified Objective']
            };
        }
    }

    /**
     * ✅ EMERGENCY MANIFEST GENERATION (Skip Button Fix)
     * 
     * When user presses "Skip", we need to generate a manifest from partial history
     * to preserve auto-summon intelligence.
     */
    async forceFinalAnalysis(
        conversationHistory: string[],
        language: 'es' | 'en' = 'es'
    ): Promise<MissionManifest> {
        const prompt = language === 'es'
            ? `Eres un analista experto. El usuario ha decidido saltar el proceso de Discovery completo.

HISTORIAL DE CONVERSACIÓN:
${conversationHistory.join('\n')}

TAREA URGENTE:
Basándote en este historial parcial, infiere lo siguiente:

1. **Dominio del Proyecto**: ¿De qué trata? (ej: "Healthcare", "E-commerce", "Education")
2. **Objetivo Principal**: Resume en 1 frase qué quiere lograr el usuario
3. **Alcance**: ¿Qué incluye y qué no?
4. **Roles Sugeridos**: Basándote en el dominio, sugiere 3-5 roles expertos relevantes (usa IDs en kebab-case como "legal-expert", "security-analyst", "financial-analyst", "data-scientist", "marketing-strategist", "ux-designer", "devops-engineer")
5. **Restricciones**: Limitaciones técnicas, presupuestarias o de tiempo mencionadas
6. **Riesgos**: Posibles problemas o desafíos

IMPORTANTE: Si el historial es muy corto, haz tu mejor esfuerzo (Best Effort). No dejes campos vacíos.

Responde SOLO con JSON válido (sin markdown):
{
  "domain": "string",
  "objective": "string",
  "scope": "string",
  "recommended_roles": ["role-id-1", "role-id-2", ...],
  "constraints": ["constraint1", "constraint2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "techStackSuggestion": ["tech1", "tech2"],
  "readiness": 70
}`
            : `You are an expert analyst. The user has decided to skip the full Discovery process.

CONVERSATION HISTORY:
${conversationHistory.join('\n')}

URGENT TASK:
Based on this partial history, infer the following:

1. **Project Domain**: What is it about? (e.g., "Healthcare", "E-commerce", "Education")
2. **Main Objective**: Summarize in 1 sentence what the user wants to achieve
3. **Scope**: What's included and what's not?
4. **Suggested Roles**: Based on the domain, suggest 3-5 relevant expert roles (use kebab-case IDs like "legal-expert", "security-analyst", "financial-analyst", "data-scientist", "marketing-strategist", "ux-designer", "devops-engineer")
5. **Constraints**: Technical, budgetary, or time limitations mentioned
6. **Risks**: Possible problems or challenges

IMPORTANT: If the history is very short, do your best effort. Don't leave fields empty.

Respond ONLY with valid JSON (no markdown):
{
  "domain": "string",
  "objective": "string",
  "scope": "string",
  "recommended_roles": ["role-id-1", "role-id-2", ...],
  "constraints": ["constraint1", "constraint2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "techStackSuggestion": ["tech1", "tech2"],
  "readiness": 70
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();

            // Clean JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                domain: parsed.domain || 'General',
                objective: parsed.objective || 'Project analysis',
                scope: parsed.scope || 'To be defined',
                suggestedRoles: parsed.recommended_roles || [], // Map recommended_roles to suggestedRoles
                constraints: parsed.constraints || [],
                risks: parsed.risks || [],
                techStackSuggestion: parsed.techStackSuggestion || [],
                readiness: parsed.readiness || 70
            };
        } catch (error) {
            console.error('[DiscoveryAgent] Emergency analysis failed:', error);

            // Fallback manifest
            return {
                domain: 'General',
                objective: 'Project analysis and strategic planning',
                scope: 'Comprehensive analysis based on available information',
                suggestedRoles: ['business-analyst', 'technical-architect', 'project-manager'],
                constraints: ['Limited initial information'],
                risks: ['Incomplete requirements'],
                techStackSuggestion: [],
                readiness: 60
            };
        }
    }
}
