/**
 * Prompt Composer Service
 * 
 * Implements the "Sandwich Method" for composing prompts:
 * - Base (80%): systemPrompt from Firestore role
 * - Modifiers (20%): Context-specific instructions (War Room, Intelligence)
 * 
 * This ensures consistency across all contexts while maintaining flexibility.
 */

import { RoleConfig } from '../../types/roles';
import { PromptContext } from '../../types/prompt-composer';
import { IndustryAnalyzer } from '../../utils/industryAnalyzer';
import { AuditUtils } from '../../utils/auditUtils';
import { SkillRegistry } from './skills/SkillRegistry';
import { MissionManifest } from './DiscoveryAgent'; // ✅ PHASE 2.5: Import for type checking

export class PromptComposer {

    /**
     * Composes final prompt from role base + context modifiers
     * 
     * @param role - Role configuration from Firestore
     * @param userPrompt - User's input/context
     * @param context - Context information (source, mode, phase, etc.)
     * @returns Final composed prompt ready for AI
     */
    static compose(
        role: RoleConfig,
        userPrompt: string,
        context: PromptContext
    ): string {

        // 1. Base (from Firestore) - 80%
        let finalPrompt = role.systemPrompt;

        // ✅ Language Enforcement Header (DOUBLE ENFORCEMENT: beginning + end)
        const lang = context.language || 'en';
        if (lang === 'es') {
            finalPrompt = `INSTRUCCIÓN CRÍTICA DE IDIOMA:\nDEBES responder EXCLUSIVAMENTE en ESPAÑOL (Español).\nNO uses inglés bajo NINGUNA circunstancia.\n\n---\n\n` + finalPrompt;
        } else {
            finalPrompt = `CRITICAL LANGUAGE INSTRUCTION:\nYou MUST respond EXCLUSIVELY in ENGLISH.\nDo NOT use Spanish or any other language under any circumstances.\n\n---\n\n` + finalPrompt;
        }

        // ✅ UI RENDERING ENFORCEMENT: Diagram rule overrides
        finalPrompt += `\n\n=== REGLA CRÍTICA DE RENDERING VISUAL ===\nSi el usuario pide un 'diagrama', 'flujo', 'mapa', 'componentes' o 'arquitectura', NUNCA trates de dibujarlo con texto, Markdown ASCII o explicaciones largas. ESTÁ ESTRICTAMENTE PROHIBIDO.\nDEBES usar la propiedad JSON 'visual_artifact' mandando 'type': 'react-flow' y llenando los nodos y las conexiones ('edges') para que el sistema lo renderice.\nMantén tu 'public_message' lo más CORTO posible (1-2 oraciones) indicando sólamente 'Aquí tienes el diagrama interactivo:'.\n==========================================\n\n`;

        // 2. Add industry context for Strategy Analyst (Phase 2 enhancement)
        if (role.roleId === 'strategy-analyst' || role.displayName === 'Strategy Analyst') {
            const lang = context.language || 'en';

            // 2a. Dynamic date context (prevents outdated data)
            const now = new Date();
            const monthNames = lang === 'es'
                ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const currentDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

            finalPrompt += lang === 'es'
                ? `\n\n--- CONTEXTO TEMPORAL ---\nFECHA ACTUAL: ${currentDate}. Prioriza datos de ${now.getFullYear() - 1}-${now.getFullYear()}. Datos anteriores a ${now.getFullYear() - 2} deben marcarse como obsoletos.\n`
                : `\n\n--- TEMPORAL CONTEXT ---\nCURRENT DATE: ${currentDate}. Prioritize data from ${now.getFullYear() - 1}-${now.getFullYear()}. Data older than ${now.getFullYear() - 2} should be flagged as outdated.\n`;

            // 2b. Anti-hallucination guard
            finalPrompt += lang === 'es'
                ? `\n--- PROTOCOLO ANTI-ALUCINACIÓN ---\nREGLA CRÍTICA: En esta ejecución NO tienes acceso a internet ni a búsquedas web:\n- Todo dato de mercado sale de tu conocimiento de entrenamiento → MÁRCALO como "(Estimación IA)" e indica el año de referencia\n- En "sources" cita solo publicaciones que conozcas; no inventes URLs y nunca digas que buscaste en la web\n- NUNCA presentes una estimación como un dato verificado\n- Para TAM/SAM/SOM: sé transparente: "Estimación basada en [metodología]"\n- Para LTV/CAC: Si no hay datos de la industria, usa los benchmarks del contexto de industria proporcionado y márcalos como referencia\n---\n\n`
                : `\n--- ANTI-HALLUCINATION PROTOCOL ---\nCRITICAL RULE: In this run you have NO internet or web search access:\n- Every market figure comes from your training knowledge → MARK it "(AI Estimated)" and state its reference year\n- In "sources" cite only publications you know; never invent URLs and never claim you searched the web\n- NEVER present an estimate as verified data\n- For TAM/SAM/SOM: be transparent: "Estimate based on [methodology]"\n- For LTV/CAC: If no industry data, use the provided industry benchmarks and mark as reference\n---\n\n`;

            const industryContext = IndustryAnalyzer.generateIndustryContext(
                userPrompt,
                lang
            );
            if (industryContext) {
                finalPrompt += industryContext;
            }

            // Add deep audit guidelines
            const auditContext = AuditUtils.generateAuditContext(lang);
            finalPrompt += auditContext;
        }

        // 2b. Add PM Command Center context for Product Manager
        if (role.roleId === 'product-manager') {
            const lang = context.language || 'en';
            const now = new Date();
            const monthNames = lang === 'es'
                ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const currentDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
            const currentQ = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;

            finalPrompt += lang === 'es'
                ? `\n\n--- PM COMMAND CENTER ---\nFECHA ACTUAL: ${currentDate} (${currentQ}). NUNCA uses fechas pasadas. Usa ${currentQ} o posteriores.\nAdemás de los campos estándar, DEBES incluir en tu JSON:\n- "positioningStatement": Declaración Geoffrey Moore ("Para [target] que [necesidad], [producto] es una [categoría] que [beneficio]...")\n- "jtbd": Array de Jobs-to-be-Done ("Cuando [situación], quiero [motivación] para poder [resultado]")\n- "riceFeatures": Array con scoring RICE (reach, impact, confidence, effort, riceScore, inMVP)\n- "mvpInScope": Features incluidas en MVP1\n- "mvpOutOfScope": Features excluidas del MVP CON razón ("Feature: Razón")\n- "northStarMetric": LA métrica clave de éxito\n- "okrs": Objectives & Key Results con timeline\n- "assumptions": Hipótesis críticas con nivel de riesgo (high/medium/low) y método de validación\n---\n\n`
                : `\n\n--- PM COMMAND CENTER ---\nCURRENT DATE: ${currentDate} (${currentQ}). NEVER use past dates. Use ${currentQ} or later.\nIn addition to standard fields, you MUST include in your JSON:\n- "positioningStatement": Geoffrey Moore format ("For [target] who [need], [product] is a [category] that [benefit]...")\n- "jtbd": Array of Jobs-to-be-Done ("When [situation], I want to [motivation] so I can [outcome]")\n- "riceFeatures": Array with RICE scoring (reach, impact, confidence, effort, riceScore, inMVP)\n- "mvpInScope": Features included in MVP1\n- "mvpOutOfScope": Features excluded from MVP WITH reason ("Feature: Reason")\n- "northStarMetric": The ONE key success metric\n- "okrs": Objectives & Key Results with timeline\n- "assumptions": Critical hypotheses with risk level (high/medium/low) and validation method\n---\n\n`;
        }

        // 2c. Add Business Analyst context modifiers
        if (role.roleId === 'business-analyst') {
            const lang = context.language || 'en';
            const now = new Date();
            const monthNames = lang === 'es'
                ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const currentDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

            finalPrompt += lang === 'es'
                ? `\n\n--- BA INTELLIGENCE CENTER ---\nFECHA ACTUAL: ${currentDate}. Todos los requerimientos deben ser contextualizados para esta fecha.\n\nREGLAS DE CALIDAD OBLIGATORIAS:\n1. FORMATO IEEE 830: Cada requerimiento funcional (FR-xxx) en el tab "requirements" DEBE usar el verbo "DEBERÁ". Ejemplo: "El sistema DEBERÁ permitir al usuario autenticarse mediante email y contraseña."\n2. FORMATO CONNEXTRA: Cada historia de usuario DEBE seguir: "Como [ROL], quiero [ACCIÓN] para poder [BENEFICIO MEDIBLE]."\n3. CRITERIOS GHERKIN: Cada historia DEBE tener al menos 2 criterios en formato: "DADO [contexto] CUANDO [acción] ENTONCES [resultado verificable]."\n4. PRIORIZACIÓN MoSCoW: Clasifica TODOS los requerimientos. 40% Must Have, 30% Should Have, 20% Could Have, 10% Won't Have.\n5. NFRs MEDIBLES: Cada NFR DEBE incluir una métrica concreta (ej: "Tiempo de respuesta < 2s en el percentil 95 bajo 100 usuarios concurrentes").\n6. SEPARACIÓN DE TABS: El tab "requirements" contiene SOLO FR-xxx y NFR-xxx. Las Reglas de Negocio (BR-xxx) van EXCLUSIVAMENTE en el tab "business-rules".\n7. REGLAS DE NEGOCIO: Formato DECLARATIVO (NO "El sistema DEBERÁ"). Cada BR tiene: "id", "rule" (la regla), "rationale" (por qué existe), "compliance" (Legal/Financial/Security/Operational/Regulatory), "priority".\n8. MÍNIMOS: 5 historias, 8 FR, 4 NFR, 3 BR.\n9. DIAGRAMA: Modelar el proceso principal con swimlanes (Usuario/Sistema), decisiones y almacenes de datos.\n---\n\n`
                : `\n\n--- BA INTELLIGENCE CENTER ---\nCURRENT DATE: ${currentDate}. All requirements must be contextualized to this date.\n\nMANDATORY QUALITY RULES:\n1. IEEE 830 FORMAT: Each functional requirement (FR-xxx) in the "requirements" tab MUST use "SHALL". Example: "The system SHALL allow the user to authenticate via email and password."\n2. CONNEXTRA FORMAT: Each user story MUST follow: "As a [ROLE], I want to [ACTION] so that I can [MEASURABLE BENEFIT]."\n3. GHERKIN CRITERIA: Each story MUST have at least 2 criteria: "GIVEN [context] WHEN [action] THEN [verifiable outcome]."\n4. MoSCoW PRIORITIZATION: Classify ALL requirements. 40% Must Have, 30% Should Have, 20% Could Have, 10% Won't Have.\n5. MEASURABLE NFRs: Each NFR MUST include a concrete metric (e.g., "Response time < 2s at P95 under 100 concurrent users").\n6. TAB SEPARATION: The "requirements" tab contains ONLY FR-xxx and NFR-xxx. Business Rules (BR-xxx) go EXCLUSIVELY in the "business-rules" tab.\n7. BUSINESS RULES: Use DECLARATIVE format (NOT "The system SHALL..."). Each BR needs: "id", "rule" (the policy), "rationale" (why it exists), "compliance" (Legal/Financial/Security/Operational/Regulatory), "priority".\n8. MINIMUMS: 5 stories, 8 FRs, 4 NFRs, 3 BRs.\n9. PROCESS DIAGRAM: Model the main business process with swimlanes (User/System), decision nodes, and data stores.\n---\n\n`;
        }

        // 2d. Add Marketing Manager context modifiers
        if (role.roleId === 'marketing-manager') {
            const lang = context.language || 'en';
            const now = new Date();
            const monthNames = lang === 'es'
                ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const currentDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

            finalPrompt += lang === 'es'
                ? `\n\n--- GTM ENGINE (MARKETING MANAGER) ---\nFECHA ACTUAL: ${currentDate}.\n\nINSTRUCCIONES OBLIGATORIAS:\n1. BENCHMARKS DE INDUSTRIA: Detecta el vertical del negocio y devuelve CPC promedio, tasa de conversión, CAC y LTV del sector. Usa benchmarks reconocidos (WordStream, HubSpot, Google Ads Benchmark Report). Campo: "industryBenchmarks".\n2. BUYER PERSONA: Incluir avatar, demographics, interests, behaviors, painPoint, goals y objections. NO solo demographics genéricos.\n3. ESCENARIOS ROAS: Generar 3 escenarios (conservative, base, aggressive) con ROAS, ventas mensuales, tasa de conversión y CPC específicos al vertical. Campo: "roasScenarios".\n4. MESSAGING FRAMEWORK: Value Proposition (formato Geoffrey Moore), Elevator Pitch (30s), Tagline, y Key Messages por audiencia. Campo: "messagingFramework".\n5. UNIT ECONOMICS: CAC, LTV, ratio LTV/CAC, payback en meses, churn mensual, ARPU. Deben ser consistentes con los escenarios ROAS. Campo: "unitEconomics".\n6. CANAL STRATEGY: Mínimo 5 canales con scoring ICE, porcentaje de presupuesto recomendado y justificación. Campo: "channelStrategy".\n7. GTM CALENDAR: 12 semanas con tareas específicas al negocio. Pre-Launch (1-4), Launch (5-8), Growth (9-12). Campo: "gtmCalendar".\n8. FUNNEL TÁCTICO: TOFU/MOFU/BOFU con métricas, acciones y tasas de conversión entre etapas. Campo: "tacticalFunnel".\n9. PSYCHO DATA: Mínimo 5 ejes para radar chart del perfil psicográfico del buyer. Campo: "psychoData".\n10. MAPA COMPETITIVO: 3-5 competidores reales con name, price(0-100), value(0-100), strength, weakness, differentiation. Primer item debe ser el producto propio con "isUs": true. Campo: "competitiveMap".\n---\n\n`
                : `\n\n--- GTM ENGINE (MARKETING MANAGER) ---\nCURRENT DATE: ${currentDate}.\n\nMANDATORY INSTRUCTIONS:\n1. INDUSTRY BENCHMARKS: Detect the business vertical and return average CPC, conversion rate, CAC and LTV for the sector. Use recognized benchmarks (WordStream, HubSpot, Google Ads Benchmark Report). Field: "industryBenchmarks".\n2. BUYER PERSONA: Include avatar, demographics, interests, behaviors, painPoint, goals and objections. NOT just generic demographics.\n3. ROAS SCENARIOS: Generate 3 scenarios (conservative, base, aggressive) with ROAS, monthly sales, conversion rate and CPC specific to the vertical. Field: "roasScenarios".\n4. MESSAGING FRAMEWORK: Value Proposition (Geoffrey Moore format), Elevator Pitch (30s), Tagline, and Key Messages per audience. Field: "messagingFramework".\n5. UNIT ECONOMICS: CAC, LTV, LTV/CAC ratio, payback in months, monthly churn, ARPU. Must be consistent with ROAS scenarios. Field: "unitEconomics".\n6. CHANNEL STRATEGY: Minimum 5 channels with ICE scoring, recommended budget percentage and rationale. Field: "channelStrategy".\n7. GTM CALENDAR: 12 weeks with business-specific tasks. Pre-Launch (1-4), Launch (5-8), Growth (9-12). Field: "gtmCalendar".\n8. TACTICAL FUNNEL: TOFU/MOFU/BOFU with metrics, actions and conversion rates between stages. Field: "tacticalFunnel".\n9. PSYCHO DATA: Minimum 5 axes for radar chart of buyer psychographic profile. Field: "psychoData".\n10. COMPETITIVE MAP: 3-5 real competitors with name, price(0-100), value(0-100), strength, weakness, differentiation. First entry must be our product with "isUs": true. Field: "competitiveMap".\n---\n\n`;
        }

        // 2e. Add Architect context modifiers
        if (role.roleId === 'architect') {
            const lang = context.language || 'en';
            const now = new Date();
            const monthNames = lang === 'es'
                ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const currentDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

            finalPrompt += lang === 'es'
                ? `\n\n--- SOLUTION ARCHITECT ENGINE ---\nFECHA ACTUAL: ${currentDate}.\n\nINSTRUCCIONES OBLIGATORIAS:\n1. C4 NIVEL 1 (c4-context): Muestra el sistema en contexto. Actores (person), el sistema siendo diseñado (software-system), y sistemas externos (external-system). NUNCA uses "start", "end", "condition".\n2. C4 NIVEL 2 (c4-container): Muestra los contenedores desplegables internos: web app, API, microservicios, bases de datos. Tipos: "container", "database", "external-system".\n3. ADRs: Mínimo 3 decisiones arquitectónicas reales con status (Accepted/Proposed), contexto, decisión, consecuencias positivas/negativas y alternativas rechazadas.\n4. ATRIBUTOS DE CALIDAD: Mínimo 5 con escenario medible, métrica concreta y al menos 2 tácticas de implementación.\n5. TECH RADAR: Mínimo 6 tecnologías en anillos (Adopt/Trial/Assess/Hold) y cuadrantes (Languages & Frameworks / Platforms / Techniques / Tools).\n6. NO generes tabs de "requirements" o "user-stories" — esos pertenecen al Business Analyst.\n---\n\n`
                : `\n\n--- SOLUTION ARCHITECT ENGINE ---\nCURRENT DATE: ${currentDate}.\n\nMANDATORY INSTRUCTIONS:\n1. C4 LEVEL 1 (c4-context): Show the system in context. Actors (person), the system being designed (software-system), external dependencies (external-system). NEVER use "start", "end", "condition".\n2. C4 LEVEL 2 (c4-container): Show internal deployable containers: web app, API, microservices, databases. Types: "container", "database", "external-system".\n3. ADRs: Minimum 3 real architectural decisions with status (Accepted/Proposed), context, decision, positive/negative consequences and rejected alternatives.\n4. QUALITY ATTRIBUTES: Minimum 5 with measurable scenario, concrete metric and at least 2 implementation tactics.\n5. TECH RADAR: Minimum 6 technologies across rings (Adopt/Trial/Assess/Hold) and quadrants (Languages & Frameworks / Platforms / Techniques / Tools).\n6. Do NOT generate "requirements" or "user-stories" tabs — those belong to the Business Analyst.\n---\n\n`;
        }

        // 2f. Add QA Engineer context modifiers
        if (role.roleId === 'qa-engineer') {
            const lang = context.language || 'en';
            const now = new Date();
            const monthNames = lang === 'es'
                ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const currentDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

            finalPrompt += lang === 'es'
                ? `\n\n--- QA ENGINE (QA ENGINEER) ---\nFECHA ACTUAL: ${currentDate}.\n\nCONTEXTO CRÍTICO: El usuario ha ingresado UNA IDEA DE NEGOCIO. Toda la estrategia QA debe estar orientada a ESA IDEA, no a PILOTAI como plataforma.\n\nINSTRUCCIONES OBLIGATORIAS:\n1. RESUMEN EJECUTIVO: Campo "summary" — 2-3 oraciones que expliquen el nivel de riesgo QA del producto propuesto, cuántos test cases se generaron y el mayor riesgo identificado.\n2. KPIs AI-DRIVEN: Campo "kpis" — array con {label, value} para: "Release Readiness" (%), "Critical Risks" (número), "Logic Coverage" (%), "Auto-Testable" (%). Calcúlalos basándote en la complejidad de la idea y los flujos identificados.\n3. ESCENARIOS CRÍTICOS: Campo "criticalScenarios" — mínimo 4 escenarios del negocio del usuario (Happy Path + Edge Cases + Error Cases) con: name, description, priority (Critical/High), coverage (0-100).\n4. TEST SUITES BDD: Campo "testSuites" — mínimo 2 suites con casos en formato Gherkin: {id, title, given, when, then, priority, automatable, estimatedTime, type}. El campo "then" es el resultado esperado verificable. Mínimo 3 casos por suite.\n5. PIRÁMIDE DE TESTING: Campo "testingPyramid" — {unit: {pct, label, rationale}, integration: {pct, label, rationale}, e2e: {pct, label, rationale}}. Los porcentajes deben sumar 100 y ser apropiados para el tipo de producto.\n6. JOURNEYS CRÍTICOS: Campo "criticalPaths" — top 3-5 flujos de usuario que deben pasar ANTES del launch con: journey, description, steps (array), priority, mustPassBeforeLaunch (bool), testTypes (array).\n7. RIESGOS: Campo "risks" — mínimo 3 riesgos con: name, mitigation, impact (Critical/High/Medium/Low), probability (High/Medium/Low), owner.\n8. CI/CD STACK: Campo "qaStack" — objeto con categorías relevantes para el stack del producto: {recommended, rationale, cost, setup}. Adaptado al proyecto, NO genérico.\n9. NO GENERES datos sobre PILOTAI como plataforma.\n---\n\n`
                : `\n\n--- QA ENGINE (QA ENGINEER) ---\nCURRENT DATE: ${currentDate}.\n\nCRITICAL CONTEXT: The user has provided A BUSINESS IDEA. All QA strategy must target THAT IDEA, not PILOTAI as a platform.\n\nMANDATORY INSTRUCTIONS:\n1. EXECUTIVE SUMMARY: Field "summary" — 2-3 sentences explaining the QA risk level of the proposed product, how many test cases were generated, and the top risk identified.\n2. AI-DRIVEN KPIs: Field "kpis" — array of {label, value} for: "Release Readiness" (%), "Critical Risks" (number), "Logic Coverage" (%), "Auto-Testable" (%). Calculate based on idea complexity and flows.\n3. CRITICAL SCENARIOS: Field "criticalScenarios" — minimum 4 scenarios for the user's product (Happy Path + Edge Cases + Error Cases) with: name, description, priority (Critical/High), coverage (0-100).\n4. BDD TEST SUITES: Field "testSuites" — minimum 2 suites with Gherkin cases: {id, title, given, when, then, priority, automatable, estimatedTime, type}. Minimum 3 cases per suite.\n5. TESTING PYRAMID: Field "testingPyramid" — {unit: {pct, label, rationale}, integration: {pct, label, rationale}, e2e: {pct, label, rationale}}. Percentages sum to 100.\n6. CRITICAL PATHS: Field "criticalPaths" — top 3-5 journeys that MUST pass before launch: journey, description, steps (array), priority, mustPassBeforeLaunch (bool), testTypes (array).\n7. RISKS: Field "risks" — minimum 3: name, mitigation, impact (Critical/High/Medium/Low), probability (High/Medium/Low), owner.\n8. CI/CD STACK: Field "qaStack" — relevant categories for product tech stack: {recommended, rationale, cost, setup}. Tailored to project.\n9. Do NOT generate data about PILOTAI as a platform.\n---\n\n`;
        }

        // 3. Apply context-specific modifiers - 20%
        if (context.source === 'war-room') {
            finalPrompt += this.getWarRoomModifiers(
                context.mode,
                context.phase,
                context.language || 'en',
                context.styleInstruction,
                role.roleId,
                context.discoveryContext // ✅ PHASE 2: Pass Discovery manifest
            );
        }

        if (context.source === 'intelligence') {
            finalPrompt += this.getIntelligenceModifiers(
                context.action,
                context.language || 'en'
            );
        }

        // 4. Add user prompt
        finalPrompt += `\n\nUser Input:\n${userPrompt}`;

        // 5. ✅ Language Enforcement Footer (appended to EVERY prompt)
        if (lang === 'es') {
            finalPrompt += `\n\n---\nINSTRUCCIÓN CRÍTICA DE IDIOMA:\nDEBES responder EXCLUSIVAMENTE en ESPAÑOL (Español).\nNO uses inglés bajo NINGUNA circunstancia.\nTodos los términos técnicos deben mantenerse o traducirse al español.`;
        } else {
            finalPrompt += `\n\n---\nCRITICAL LANGUAGE INSTRUCTION:\nYou MUST respond EXCLUSIVELY in ENGLISH.\nDo NOT use Spanish or any other language under any circumstances.`;
        }

        return finalPrompt;
    }

    private static getWarRoomModifiers(
        mode?: string,
        phase?: string,
        lang: 'es' | 'en' = 'en',
        styleInstruction?: string,
        roleId?: string,
        discoveryContext?: string | MissionManifest // ✅ PHASE 2.5: Accept manifest or legacy string
    ): string {

        let modifier = '\n\n--- WAR ROOM MODE ---\n';

        // ✅ PHASE 2.5: Inject Discovery Briefing (highest priority)
        if (discoveryContext) {
            // Check if it's a MissionManifest object or legacy string
            if (typeof discoveryContext === 'object' && 'objective' in discoveryContext) {
                const manifest = discoveryContext;
                modifier += lang === 'es'
                    ? `\n🎯 DISCOVERY BRIEFING (Contexto Estructurado):\n\n` +
                    `**Objetivo**: ${manifest.objective}\n` +
                    `**Dominio**: ${manifest.domain}\n` +
                    `**Alcance**: ${manifest.scope}\n` +
                    `**Restricciones**: ${manifest.constraints.join(', ')}\n` +
                    `**Riesgos Identificados**: ${manifest.risks.join(', ')}\n` +
                    `**Tech Stack Sugerido**: ${manifest.techStackSuggestion.join(', ')}\n` +
                    `**Readiness Score**: ${manifest.readiness}%\n\n` +
                    `USA ESTA INFORMACIÓN para fundamentar tus argumentos y decisiones desde tu perspectiva experta.\n\n`
                    : `\n🎯 DISCOVERY BRIEFING (Structured Context):\n\n` +
                    `**Objective**: ${manifest.objective}\n` +
                    `**Domain**: ${manifest.domain}\n` +
                    `**Scope**: ${manifest.scope}\n` +
                    `**Constraints**: ${manifest.constraints.join(', ')}\n` +
                    `**Identified Risks**: ${manifest.risks.join(', ')}\n` +
                    `**Suggested Tech Stack**: ${manifest.techStackSuggestion.join(', ')}\n` +
                    `**Readiness Score**: ${manifest.readiness}%\n\n` +
                    `USE THIS INFORMATION to support your arguments and decisions from your expert perspective.\n\n`;
            } else {
                // Legacy string format
                modifier += lang === 'es'
                    ? `\n📋 CONTEXTO DE DISCOVERY (información recopilada del usuario):\n${discoveryContext}\n\nUSA ESTA INFORMACIÓN para fundamentar tus argumentos y decisiones.\n\n`
                    : `\n📋 DISCOVERY CONTEXT (information gathered from user):\n${discoveryContext}\n\nUSE THIS INFORMATION to support your arguments and decisions.\n\n`;
            }
        }

        // 1. Dynamic Style Instruction (Priority)
        if (styleInstruction) {
            modifier += styleInstruction + '\n';
        }
        // 2. Hardcoded / Fallback Styles
        else if (mode === 'crisis') {
            modifier += lang === 'es'
                ? 'MODO CRISIS: Actúa bajo presión extrema. Céntrate SOLO en riesgos inmediatos y supervivencia. Ignora planificación a largo plazo.\n'
                : 'CRISIS MODE: Act under extreme pressure. Focus ONLY on immediate risks and survival. Ignore long-term planning.\n';
        } else if (mode === 'creative') {
            modifier += lang === 'es'
                ? 'MODO CREATIVO: Ignora restricciones presupuestarias temporalmente. Propón ideas laterales y disruptivas.\n'
                : 'CREATIVE MODE: Ignore budget constraints temporarily. Propose lateral and disruptive ideas.\n';
        } else if (mode === 'audit') {
            modifier += lang === 'es'
                ? 'MODO AUDITORÍA: Sé extremadamente crítico. Encuentra fallas fatales. Desafía cada suposición.\n'
                : 'AUDIT MODE: Be extremely critical. Find fatal flaws. Challenge every assumption.\n';
        }

        // Phase modifier
        if (phase === 'attack') {
            modifier += lang === 'es'
                ? 'FASE: DIVERGENCIA. Destruye la lógica de la idea. NO busques consenso.\n'
                : 'PHASE: DIVERGENCE. Destroy the idea logic. Do NOT seek consensus.\n';
        } else if (phase === 'negotiate') {
            modifier += lang === 'es'
                ? 'FASE: NEGOCIACIÓN. Ofrece trade-offs. Ejemplo: "Acepto X si cortamos Y".\n'
                : 'PHASE: NEGOTIATION. Offer trade-offs. Example: "I accept X if we cut Y".\n';
        } else if (phase === 'resolve') {
            modifier += lang === 'es'
                ? 'FASE: CIERRE. Resume la decisión, riesgos aceptados y próximos pasos. Tono ejecutivo.\n'
                : 'PHASE: CLOSURE. Summarize decision, accepted risks, and next steps. Executive tone.\n';
        }

        // ✅ PHASE 1: Skills Engine - Inject available skills
        if (roleId) {
            modifier += this.getSkillsInstruction(roleId, lang);
        }

        // ✅ VISUAL ARTIFACT INSTRUCTIONS
        modifier += lang === 'es'
            ? '\n\n⚠️ ARTEFACTOS VISUALES (CRÍTICO):\n- DIAGRAMAS/MAPAS: Si el usuario te pide un diagrama, mapa mental, arquitectura o flujo, DEBES rellenar el campo "visual_artifact". Usa "type": "react-flow" y en "data" proporciona los arrays "nodes" (id, position, data.label, data.details opcionally) y "edges" (id, source, target).\n- ESTADÍSTICAS/GRÁFICOS: Si el usuario pide estadísticas, datos duros o gráficos, usa "type": "recharts" y en "data" proporciona "chart_category" ("bar", "line", "pie") y "chart_series" (array de {name, value}). NUNCA digas que no tienes datos; inventa proyecciones realistas basadas en tu rol.\n¡Mantén tu "public_message" muy corto (ej. "Aquí tienes el diagrama/gráfico") cuando generes artefactos!\n'
            : '\n\n⚠️ VISUAL ARTIFACTS (CRITICAL):\n- DIAGRAMS/MAPS: If asked for a diagram, flow, or architecture, MUST fill "visual_artifact". Use "type": "react-flow" and in "data" provide "nodes" and "edges" arrays.\n- STATISTICS/CHARTS: If asked for stats, charts, or data, use "type": "recharts" and in "data" provide "chart_category" ("bar", "line", "pie") and "chart_series" (array of {name, value}). NEVER say you lack data; invent realistic projections.\nKeep your "public_message" very short when providing an artifact.\n'; +
                '- DO NOT generate tables, charts or complex structures\n' +
                '- DO NOT use other formats\n\n' +
                '✅ ONLY the structured text format shown above.\n' +
                '✅ If you try to use JSON, your response will be REJECTED.\n';

        return modifier;
    }

    /**
     * Get Skills instruction for War Room agents
     * Injects available skills based on role
     */
    private static getSkillsInstruction(roleId: string, lang: 'es' | 'en'): string {
        const skills = SkillRegistry.getForRole(roleId);

        if (skills.length === 0) return '';

        const skillList = skills.map(s =>
            `  - ${s.name}: ${s.description}`
        ).join('\n');

        return lang === 'es'
            ? `\n\n--- SKILLS DISPONIBLES ---\nPuedes ejecutar estas acciones reales:\n${skillList}\n\nPara usar una skill, menciona en tu REASONING: "EJECUTAR: [skill-name]"\nEjemplo: "EJECUTAR: Web Search para investigar el mercado"\n`
            : `\n\n--- AVAILABLE SKILLS ---\nYou can execute these real actions:\n${skillList}\n\nTo use a skill, mention in your REASONING: "EXECUTE: [skill-name]"\nExample: "EXECUTE: Web Search to research the market"\n`;
    }

    /**
     * Get Intelligence Service modifiers
     * 
     * @param action - Intelligence action (expand, checklist, risks)
     * @param lang - Language (es or en)
     * @returns Modifier text to append to base prompt
     */
    private static getIntelligenceModifiers(
        action?: string,
        lang: 'es' | 'en' = 'en'
    ): string {

        let modifier = '\n\n--- PROCESS INTELLIGENCE ---\n';

        if (action === 'expand') {
            modifier += lang === 'es'
                ? 'TAREA: Expande este paso del proceso en un sub-proceso detallado (estilo BPMN).\nSALIDA: JSON con nodes (start, 3-6 pasos, end) y edges.\n'
                : 'TASK: Drill-down this process step into a detailed sub-process (BPMN style).\nOUTPUT: JSON with nodes (start, 3-6 steps, end) and edges.\n';
        } else if (action === 'checklist') {
            modifier += lang === 'es'
                ? 'TAREA: Crea un checklist operativo para este paso.\nSALIDA: Markdown con Prerrequisitos, Pasos de Ejecución, Criterios de Validación, Herramientas.\n'
                : 'TASK: Create an operational checklist for this step.\nOUTPUT: Markdown with Prerequisites, Execution Steps, Validation Criteria, Tools.\n';
        } else if (action === 'risks') {
            modifier += lang === 'es'
                ? 'TAREA: Identifica riesgos y controles para este paso.\nSALIDA: Tabla Markdown con Riesgo, Impacto, Probabilidad, Mitigación.\n'
                : 'TASK: Identify risks and controls for this step.\nOUTPUT: Markdown table with Risk, Impact, Probability, Mitigation.\n';
        }

        return modifier;
    }
}
