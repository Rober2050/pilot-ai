import { AnthropicProvider } from './providers/AnthropicProvider';
import { Node, Edge } from 'reactflow';
import { DiagramData } from '../../utils/diagramLayout';

// Intelligence actions (expand, checklist, risks, gaps, automation) route through the
// Anthropic proxy. Previously this used GeminiProvider with VITE_GEMINI_API_KEY directly
// in the browser, which broke after the Supabase migration removed that env var.
const ai = new AnthropicProvider();
const MODEL_NAME = 'claude-haiku-4-5-20251001';

export const intelligenceService = {
    async expandSubProcess(node: Node, contextNodes: Node[], contextEdges: Edge[], level: number = 1): Promise<DiagramData> {

        try {
            // Try to use Sandwich Method (load Process Architect role from Firestore)
            const { rolesService } = await import('../firebase/rolesService');
            const role = await rolesService.getRoleById('process-architect');

            if (role) {
                // SUCCESS: Use PromptComposer
                const { PromptComposer } = await import('./PromptComposer');

                const actorNames = [...new Set(
                    contextNodes
                        .filter(n => n.data?.group)
                        .map(n => n.data.group as string)
                )].slice(0, 4).join(', ') || 'Usuario, Sistema';

                const userPrompt = `Expande el paso del proceso: "${node.data.label}".
Esta es una expansión de Nivel ${level}.
Contexto del proceso padre: ${contextNodes.map(n => n.data.label).join(', ')}.
Actores del proceso padre: ${actorNames}.

Genera un diagrama de sub-proceso detallado con CARRILES (swimlanes) que muestre CÓMO se ejecuta este paso específico.

REGLAS OBLIGATORIAS:
1. CADA nodo DEBE tener la propiedad "group" asignando el actor que lo ejecuta (ej: "group": "Usuario").
2. Usar 2-3 actores relevantes para ESTE sub-proceso (pueden ser los mismos del padre u otros más específicos).
3. Nodos tipo "condition": EXACTAMENTE 2 edges salientes — uno "Sí" y uno "No". Nunca más.
4. Flujo topológico: los edges siempre avanzan, sin retrocesos excepto loops de reintento.
5. Mínimo 6 nodos, máximo 10.
6. Start y End también deben tener "group".`;

                const finalPrompt = PromptComposer.compose(
                    role,
                    userPrompt,
                    {
                        source: 'intelligence',
                        action: 'expand',
                        language: 'es'
                    }
                );

                const result = await ai.generateJSON<DiagramData>(role.model || MODEL_NAME, finalPrompt, '');

                // Add level info to nodes to track depth
                if (result && result.nodes) {
                    result.nodes = result.nodes.map(n => ({
                        ...n,
                        data: { ...n.data, expandLevel: level + 1 }
                    }));
                }

                return result;
            } else {
                // FALLBACK: Use legacy hardcoded prompts
                console.warn('Process Architect role not found, using legacy prompts');
                return this.expandSubProcessLegacy(node, contextNodes, contextEdges, level);
            }
        } catch (error) {
            console.error("Failed to expand sub-process with Sandwich Method:", error);
            // FALLBACK: Use legacy prompts
            return this.expandSubProcessLegacy(node, contextNodes, contextEdges, level);
        }
    },

    /**
     * Legacy fallback for expandSubProcess
     */
    async expandSubProcessLegacy(node: Node, contextNodes: Node[], contextEdges: Edge[], level: number = 1): Promise<DiagramData> {
        const systemPrompt = `Eres un Arquitecto de Procesos experto (BPMN). Tu objetivo es "explotar" (drill-down) un paso específico en un sub-proceso detallado con CARRILES (swimlanes) por actor.
Nivel de expansión: ${level}.

REGLAS DE SALIDA — TODAS OBLIGATORIAS:
1. Idioma: ESPAÑOL.
2. Formato: JSON válido con "nodes" y "edges".
3. CARRILES: Identifica 2-3 actores y asigna "group" a CADA nodo (ej: "group": "Usuario").
4. Estructura: 1 nodo start, 5-8 pasos intermedios (tipos: default, condition, database, cloud), 1 nodo end.
5. Decisiones (condition): EXACTAMENTE 2 edges — uno con label "Sí" y otro con label "No".
6. Flujo topológico: edges solo avanzan (no retrocesos excepto loops "Reintentar").
7. IDs únicos: "s1", "s2", ... "sN".

EJEMPLO CORRECTO:
{
  "nodes": [
    {"id":"s1","label":"Inicio","type":"start","group":"Usuario"},
    {"id":"s2","label":"Validar Datos","type":"default","group":"Sistema"},
    {"id":"s3","label":"¿Válido?","type":"condition","group":"Sistema"},
    {"id":"s4","label":"Procesar","type":"default","group":"Sistema"},
    {"id":"s5","label":"Almacenar","type":"database","group":"Base de Datos"},
    {"id":"s6","label":"Notificar Error","type":"default","group":"Usuario"},
    {"id":"s7","label":"Fin","type":"end","group":"Usuario"}
  ],
  "edges": [
    {"from":"s1","to":"s2"},
    {"from":"s2","to":"s3","label":"Enviar"},
    {"from":"s3","to":"s4","label":"Sí"},
    {"from":"s3","to":"s6","label":"No"},
    {"from":"s4","to":"s5","label":"Guardar"},
    {"from":"s5","to":"s7"},
    {"from":"s6","to":"s7"}
  ]
}`;

        const userPrompt = `Expande el paso del proceso: "${node.data.label}".
Genera un sub-proceso detallado de nivel ${level} con carriles (swimlanes) para cada actor.`;

        try {
            const result = await ai.generateJSON<DiagramData>(MODEL_NAME, systemPrompt, userPrompt);
            if (result && result.nodes) {
                result.nodes = result.nodes.map(n => ({
                    ...n,
                    data: { ...n.data, expandLevel: level + 1 }
                }));
            }
            return result;
        } catch (error) {
            console.error("Failed to expand sub-process:", error);
            throw error;
        }
    },

    async generateChecklist(node: Node): Promise<string> {
        try {
            const { rolesService } = await import('../firebase/rolesService');
            const role = await rolesService.getRoleById('process-architect');

            if (role) {
                const { PromptComposer } = await import('./PromptComposer');
                const userPrompt = `Crea un checklist para la tarea: "${node.data.label}".
Incluye secciones para:
- Prerrequisitos (Entradas)
- Pasos de Ejecución (Detallados)
- Criterios de Validación (Salidas)
- Herramientas necesarias`;

                const finalPrompt = PromptComposer.compose(role, userPrompt, {
                    source: 'intelligence',
                    action: 'checklist',
                    language: 'es'
                });

                return await ai.generateText(role.model || MODEL_NAME, finalPrompt, '');
            } else {
                return this.generateChecklistLegacy(node);
            }
        } catch (error) {
            return this.generateChecklistLegacy(node);
        }
    },

    async generateChecklistLegacy(node: Node): Promise<string> {
        const systemPrompt = `Eres un Gerente de Operaciones experto. Crea un checklist operativo detallado para el paso del proceso indicado.
        
        REGLAS:
        1.  **Idioma:** ESPAÑOL.
        2.  **Formato:** Markdown.
        3.  **Tono:** Profesional y directivo.`;

        const userPrompt = `Crea un checklist para la tarea: "${node.data.label}".
        Incluye secciones para:
        - Prerrequisitos (Entradas)
        - Pasos de Ejecución (Detallados)
        - Criterios de Validación (Salidas)
        - Herramientas necesarias`;

        try {
            return await ai.generateText(MODEL_NAME, systemPrompt, userPrompt);
        } catch (error) {
            console.error("Failed to generate checklist:", error);
            throw error;
        }
    },

    async analyzeRisks(node: Node): Promise<string> {
        try {
            const { rolesService } = await import('../firebase/rolesService');
            const role = await rolesService.getRoleById('process-architect');

            if (role) {
                const { PromptComposer } = await import('./PromptComposer');
                const userPrompt = `Analiza los riesgos para: "${node.data.label}".
Genera una tabla con las columnas:
| Riesgo | Impacto (Alto/Medio/Bajo) | Probabilidad (Alta/Media/Baja) | Medida de Mitigación / Control |`;

                const finalPrompt = PromptComposer.compose(role, userPrompt, {
                    source: 'intelligence',
                    action: 'risks',
                    language: 'es'
                });

                return await ai.generateText(role.model || MODEL_NAME, finalPrompt, '');
            } else {
                return this.analyzeRisksLegacy(node);
            }
        } catch (error) {
            return this.analyzeRisksLegacy(node);
        }
    },

    async analyzeRisksLegacy(node: Node): Promise<string> {
        const systemPrompt = `Eres un Analista de Riesgos Senior. Identifica riesgos potenciales y controles para el paso del proceso indicado.
        
        REGLAS:
        1.  **Idioma:** ESPAÑOL.
        2.  **Formato:** Tabla Markdown.`;

        const userPrompt = `Analiza los riesgos para: "${node.data.label}".
        Genera una tabla con las columnas:
        | Riesgo | Impacto (Alto/Medio/Bajo) | Probabilidad (Alta/Media/Baja) | Medida de Mitigación / Control |`;

        try {
            return await ai.generateText(MODEL_NAME, systemPrompt, userPrompt);
        } catch (error) {
            console.error("Failed to analyze risks:", error);
            throw error;
        }
    },

    // ── Feature: Gap Analysis ────────────────────────────────────────────────
    async analyzeGaps(nodes: Node[], edges: Edge[]): Promise<string> {
        const nodeList = nodes
            .filter(n => n.type !== 'group')
            .map(n => `- [${n.type || 'process'}] "${(n.data as any)?.label}" (Actor: ${(n.data as any)?.group || 'N/A'}, ID: ${n.id})`)
            .join('\n');

        const edgeList = edges
            .map(e => `- ${e.source} → ${e.target}${e.label ? ` (etiqueta: "${e.label}")` : ''}`)
            .join('\n');

        const systemPrompt = `Eres un Analista de Negocio Senior especialista en BPMN y optimización de procesos.

TAREA: Analiza el siguiente flujo de proceso e identifica brechas estructurales, caminos de excepción faltantes y oportunidades de mejora.

REGLAS DE RESPUESTA:
1. Idioma: ESPAÑOL.
2. Formato: Markdown estructurado.
3. Sé específico — referencia el nombre EXACTO del paso afectado.
4. Prioriza por impacto real. Máximo 10 hallazgos en total.
5. Usa emojis de severidad: 🔴 Alta | 🟡 Media | 🟢 Baja.

ESTRUCTURA OBLIGATORIA:
## Diagnóstico General
(2-3 oraciones: calidad del flujo, cobertura de excepciones, claridad de responsabilidades)

## Brechas Estructurales
(decisiones sin rama de error/timeout, nodos sin salida, ciclos sin condición de escape, nodos sin actor asignado)

## Caminos de Excepción Faltantes
(qué paso falla si X ocurre, sin ruta de error definida)

## Oportunidades de Mejora
(pasos redundantes, actores mal asignados, validaciones ausentes, flujos que podrían simplificarse)

## Plan de Acción
(lista numerada de las 3-5 mejoras más prioritarias con su impacto estimado)`;

        const userPrompt = `FLUJO A ANALIZAR:

Pasos del proceso (${nodes.filter(n => n.type !== 'group').length} nodos):
${nodeList}

Conexiones (${edges.length} flujos):
${edgeList}

Identifica todas las brechas, problemas estructurales y oportunidades de mejora.`;

        try {
            return await ai.generateText(MODEL_NAME, systemPrompt, userPrompt);
        } catch (error) {
            console.error('Failed to analyze gaps:', error);
            throw error;
        }
    },

    // ── Feature: Automation Potential Overlay ────────────────────────────────
    async analyzeAutomation(nodes: Node[], edges: Edge[]): Promise<Record<string, 'auto' | 'hybrid' | 'manual'>> {
        const contentNodes = nodes.filter(n => n.type !== 'group' && n.type !== 'start' && n.type !== 'end');

        const nodeList = contentNodes
            .map(n => `{"id":"${n.id}","label":"${((n.data as any)?.label || '').replace(/"/g, "'")}","type":"${n.type || 'process'}","actor":"${(n.data as any)?.group || ''}"}`)
            .join(',\n');

        const systemPrompt = `Eres un experto en automatización de procesos empresariales (RPA, APIs, AI, BPM).

TAREA: Para cada paso del proceso, determina su potencial de automatización.

CATEGORÍAS:
- "auto": Se puede automatizar al 100% (consulta a base de datos, cálculo, validación por regla fija, llamada API, envío automático de notificación, generación de documento)
- "hybrid": Automatización parcial — la ejecución es automática pero requiere una validación/aprobación humana en algún punto
- "manual": Requiere juicio humano indefectible (aprobación gerencial, negociación, diagnóstico experto, atención física)

REGLAS:
- Los nodos tipo "condition"/"decision" son casi siempre "hybrid" (los datos llegan de forma automática pero la decisión puede requerir contexto humano)
- Los nodos "database" y "cloud" son casi siempre "auto"
- Los pasos de "Notificar" suelen ser "auto" si son notificaciones de sistema
- Los pasos de "Aprobar", "Revisar", "Validar con criterio" suelen ser "hybrid" o "manual"

Responde SOLO con JSON válido (sin texto adicional, sin markdown, sin backticks):
{"automationMap":{"nodeId":"auto|hybrid|manual",...}}`;

        const userPrompt = `Clasifica el potencial de automatización de estos pasos:
[${nodeList}]

También considera las conexiones para entender el flujo:
${edges.slice(0, 20).map(e => `${e.source}→${e.target}`).join(', ')}`;

        try {
            const result = await ai.generateJSON<{ automationMap: Record<string, 'auto' | 'hybrid' | 'manual'> }>(
                MODEL_NAME, systemPrompt, userPrompt
            );
            return result?.automationMap ?? {};
        } catch (error) {
            console.error('Failed to analyze automation:', error);
            throw error;
        }
    }
};
