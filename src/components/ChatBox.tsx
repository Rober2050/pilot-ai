import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService } from '../services/ai/aiService';
import { cn } from '../lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    patch?: Record<string, unknown>;
}

type PatchState = 'pending' | 'applied' | 'dismissed';

interface ChatBoxProps {
    roleId: string;
    modelName: string;
    systemPrompt: string;
    contextData: unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdateBlueprint: (data: any) => void;
    lang?: 'es' | 'en';
}

const ROLE_DISPLAY_NAMES: Record<string, { es: string; en: string }> = {
    'strategy-analyst':  { es: 'Analista de Estrategia', en: 'Strategy Analyst' },
    'product-manager':   { es: 'Gerente de Producto', en: 'Product Manager' },
    'business-analyst':  { es: 'Analista de Negocios', en: 'Business Analyst' },
    'project-manager':   { es: 'Gerente de Proyecto', en: 'Project Manager' },
    'marketing-manager': { es: 'Marketing Manager', en: 'Marketing Manager' },
    'architect':         { es: 'Arquitecto de Software', en: 'Software Architect' },
    'ux-designer':       { es: 'Diseñador UX/UI', en: 'UX/UI Designer' },
    'qa-engineer':       { es: 'Ingeniero QA', en: 'QA Engineer' },
    'devops-engineer':   { es: 'DevOps Engineer', en: 'DevOps Engineer' },
};

// Quick-action chips per role.
// RULE: every question must be answerable from ANY analysis content — ask to INTERPRET/SUMMARIZE,
// never to retrieve a specific section that might not exist in the output.
const ROLE_QUICK_ACTIONS: Record<string, { es: string[]; en: string[] }> = {
    'product-manager': {
        es: ['Resumí el análisis del producto', '¿Cuáles son los mayores riesgos del MVP?', '¿Qué modificarías primero?'],
        en: ['Summarize the product analysis', 'What are the biggest MVP risks?', 'What would you change first?'],
    },
    'strategy-analyst': {
        es: ['Resumí los puntos estratégicos clave', '¿Cuál es la mayor oportunidad del proyecto?', '¿Qué amenaza ignorarías y cuál no?'],
        en: ['Summarize the key strategic points', 'What is the biggest opportunity?', 'Which threat would you ignore vs. prioritize?'],
    },
    'business-analyst': {
        es: ['Resumí el análisis de negocio', '¿Cuál es el proceso más crítico identificado?', '¿Qué priorizarías implementar primero?'],
        en: ['Summarize the business analysis', 'What is the most critical process identified?', 'What would you prioritize implementing first?'],
    },
    'project-manager': {
        es: ['Resumí el plan del proyecto', '¿Qué es lo que más puede retrasar el lanzamiento?', '¿Cómo reducirías el riesgo principal?'],
        en: ['Summarize the project plan', 'What could most delay the launch?', 'How would you reduce the main risk?'],
    },
    'marketing-manager': {
        es: ['Resumí la estrategia de marketing', '¿A quién le hablarías primero y con qué mensaje?', '¿Qué acción de marketing tendrías más impacto?'],
        en: ['Summarize the marketing strategy', 'Who would you target first and with what message?', 'What marketing action would have the most impact?'],
    },
    'architect': {
        es: ['Resumí las decisiones técnicas principales', '¿Cuál es el componente de mayor riesgo técnico?', '¿Qué simplificarías en la arquitectura?'],
        en: ['Summarize the main technical decisions', 'Which component has the highest technical risk?', 'What would you simplify in the architecture?'],
    },
    'ux-designer': {
        es: ['Resumí el diseño propuesto', '¿Cuál es el flujo más crítico para el usuario?', '¿Dónde ves más fricción en la experiencia?'],
        en: ['Summarize the proposed design', 'What is the most critical user flow?', 'Where do you see the most friction in the experience?'],
    },
    'qa-engineer': {
        es: ['Resumí el plan de pruebas', '¿Qué escenario tiene mayor riesgo de fallar?', '¿Cómo priorizarías los tests del MVP?'],
        en: ['Summarize the test plan', 'Which scenario has the highest risk of failure?', 'How would you prioritize MVP tests?'],
    },
    'devops-engineer': {
        es: ['Resumí la estrategia de infraestructura', '¿Cuál es el mayor riesgo operativo?', '¿Qué optimizarías antes del lanzamiento?'],
        en: ['Summarize the infrastructure strategy', 'What is the biggest operational risk?', 'What would you optimize before launch?'],
    },
};

/** Extract first ```json ... ``` block from AI response */
function extractJsonPatch(text: string): Record<string, unknown> | null {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if (!match) return null;
    try {
        const parsed = JSON.parse(match[1].trim());
        return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
    } catch {
        return null;
    }
}

/** Strip ```json blocks from display text — shown separately as a patch card */
function stripJsonBlock(text: string): string {
    return text.replace(/```json[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Human-readable labels for every technical field name across all 9 roles */
const FIELD_LABELS: Record<string, { es: string; en: string }> = {
    // Product Manager
    mvpInScope:        { es: 'MVP1 (En alcance)',         en: 'MVP1 (In scope)' },
    mvpOutOfScope:     { es: 'Fuera de alcance futuro',   en: 'Future out of scope' },
    outOfScope:        { es: 'Fuera de alcance',          en: 'Out of scope' },
    inScope:           { es: 'En alcance',                en: 'In scope' },
    keyFeatures:       { es: 'Features clave',            en: 'Key features' },
    targetAudience:    { es: 'Audiencia objetivo',        en: 'Target audience' },
    riceFeatures:      { es: 'Features priorizadas',      en: 'Prioritized features' },
    successMetrics:    { es: 'Métricas de éxito',         en: 'Success metrics' },
    // Strategy Analyst
    strengths:         { es: 'Fortalezas',                en: 'Strengths' },
    weaknesses:        { es: 'Debilidades',               en: 'Weaknesses' },
    opportunities:     { es: 'Oportunidades',             en: 'Opportunities' },
    threats:           { es: 'Amenazas',                  en: 'Threats' },
    trends:            { es: 'Tendencias',                en: 'Trends' },
    competitors:       { es: 'Competidores',              en: 'Competitors' },
    // Business Analyst
    requirements:      { es: 'Requisitos',                en: 'Requirements' },
    functionalReqs:    { es: 'Requisitos funcionales',    en: 'Functional requirements' },
    nonFunctionalReqs: { es: 'Requisitos no funcionales', en: 'Non-functional requirements' },
    userStories:       { es: 'Historias de usuario',      en: 'User stories' },
    useCases:          { es: 'Casos de uso',              en: 'Use cases' },
    processes:         { es: 'Procesos',                  en: 'Processes' },
    stakeholders:      { es: 'Stakeholders',              en: 'Stakeholders' },
    // Project Manager
    milestones:        { es: 'Hitos',                     en: 'Milestones' },
    risks:             { es: 'Riesgos',                   en: 'Risks' },
    tasks:             { es: 'Tareas',                    en: 'Tasks' },
    dependencies:      { es: 'Dependencias',              en: 'Dependencies' },
    resources:         { es: 'Recursos',                  en: 'Resources' },
    // Marketing Manager
    goals:             { es: 'Objetivos',                 en: 'Goals' },
    objections:        { es: 'Objeciones',                en: 'Objections' },
    interests:         { es: 'Intereses',                 en: 'Interests' },
    behaviors:         { es: 'Comportamientos',           en: 'Behaviors' },
    keyMessages:       { es: 'Mensajes clave',            en: 'Key messages' },
    channelStrategy:   { es: 'Estrategia de canales',     en: 'Channel strategy' },
    // Architect
    components:        { es: 'Componentes',               en: 'Components' },
    techStack:         { es: 'Stack tecnológico',         en: 'Tech stack' },
    integrations:      { es: 'Integraciones',             en: 'Integrations' },
    technicalRisks:    { es: 'Riesgos técnicos',          en: 'Technical risks' },
    // QA Engineer
    testCases:         { es: 'Casos de prueba',           en: 'Test cases' },
    testScenarios:     { es: 'Escenarios de prueba',      en: 'Test scenarios' },
    acceptanceCriteria:{ es: 'Criterios de aceptación',   en: 'Acceptance criteria' },
    // DevOps
    pipelines:         { es: 'Pipelines',                 en: 'Pipelines' },
    environments:      { es: 'Ambientes',                 en: 'Environments' },
    monitoring:        { es: 'Monitoreo',                 en: 'Monitoring' },
};

function humanizeKey(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

function getFieldLabel(key: string, lang: 'es' | 'en'): string {
    return FIELD_LABELS[key]?.[lang] ?? humanizeKey(key);
}

/** Deep-search a field by key in a nested object */
function findFieldInContext(obj: unknown, key: string): unknown {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const rec = obj as Record<string, unknown>;
    if (key in rec) return rec[key];
    for (const v of Object.values(rec)) {
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            const found = findFieldInContext(v, key);
            if (found !== undefined) return found;
        }
    }
    return undefined;
}

function truncate(s: string, max = 55): string {
    return s.length > max ? s.slice(0, max) + '…' : s;
}

/**
 * Build a human confirmation question from a patch + current context.
 * Detects add / remove / move operations and describes them in plain language.
 */
function buildHumanConfirmation(
    patch: Record<string, unknown>,
    contextData: unknown,
    lang: 'es' | 'en'
): string {
    type Change = { field: string; label: string; removed: string[]; added: string[] };
    const changes: Change[] = [];

    for (const [key, newValue] of Object.entries(patch)) {
        const label = getFieldLabel(key, lang);
        if (!Array.isArray(newValue)) continue;
        const newArr = newValue.filter(i => typeof i === 'string') as string[];
        const current = findFieldInContext(contextData, key);
        const currentArr = Array.isArray(current)
            ? current.filter(i => typeof i === 'string') as string[]
            : [];
        const removed = currentArr.filter(i => !newArr.includes(i));
        const added   = newArr.filter(i => !currentArr.includes(i));
        changes.push({ field: key, label, removed, added });
    }

    if (changes.length === 0) {
        return lang === 'es' ? '¿Confirmás este cambio al informe?' : 'Confirm this change to the report?';
    }

    // Detect cross-field moves: item removed from A and added to B
    const parts: string[] = [];
    const accountedItems = new Set<string>();

    for (const src of changes) {
        for (const removedItem of src.removed) {
            if (accountedItems.has(`${src.field}:${removedItem}`)) continue;
            // Look if this same item is being added to another field
            const dest = changes.find(c => c.field !== src.field && c.added.includes(removedItem));
            if (dest) {
                parts.push(lang === 'es'
                    ? `quitar **"${truncate(removedItem)}"** de **${src.label}** y moverlo a **${dest.label}**`
                    : `remove **"${truncate(removedItem)}"** from **${src.label}** and move it to **${dest.label}**`);
                accountedItems.add(`${src.field}:${removedItem}`);
                accountedItems.add(`${dest.field}:${removedItem}`);
            }
        }
    }

    // Pure removals (not part of a move)
    for (const ch of changes) {
        for (const item of ch.removed) {
            if (!accountedItems.has(`${ch.field}:${item}`)) {
                parts.push(lang === 'es'
                    ? `eliminar **"${truncate(item)}"** de **${ch.label}**`
                    : `remove **"${truncate(item)}"** from **${ch.label}**`);
                accountedItems.add(`${ch.field}:${item}`);
            }
        }
    }

    // Pure additions (not part of a move)
    for (const ch of changes) {
        for (const item of ch.added) {
            if (!accountedItems.has(`${ch.field}:${item}`)) {
                parts.push(lang === 'es'
                    ? `agregar **"${truncate(item)}"** a **${ch.label}**`
                    : `add **"${truncate(item)}"** to **${ch.label}**`);
                accountedItems.add(`${ch.field}:${item}`);
            }
        }
    }

    // Non-array fields fallback
    const nonArrayKeys = Object.entries(patch)
        .filter(([, v]) => !Array.isArray(v))
        .map(([k]) => getFieldLabel(k, lang));
    if (nonArrayKeys.length > 0) {
        parts.push(lang === 'es'
            ? `actualizar ${nonArrayKeys.join(', ')}`
            : `update ${nonArrayKeys.join(', ')}`);
    }

    if (parts.length === 0) {
        return lang === 'es' ? '¿Confirmás este cambio al informe?' : 'Confirm this change to the report?';
    }

    const q = lang === 'es' ? '¿Querés ' : 'Do you want to ';
    const sep = lang === 'es' ? ' y también ' : ' and also ';
    return q + parts.join(sep) + '?';
}

function buildChatSystemPrompt(roleId: string, roleSystemPrompt: string, lang: 'es' | 'en'): string {
    const names = ROLE_DISPLAY_NAMES[roleId] || { es: roleId, en: roleId };
    const name = names[lang];

    if (lang === 'es') {
        return `Eres ${name}, el agente de IA especializado de PILOT AI que acaba de completar el análisis del proyecto.

MISIÓN EN ESTE CHAT:
Sos el experto de referencia para responder preguntas, aclarar decisiones y aplicar modificaciones concretas al informe que el usuario está viendo AHORA MISMO.

REGLAS ESTRICTAS:
1. Responde SIEMPRE en lenguaje natural claro con Markdown (listas, **negritas**, encabezados).
2. NUNCA devuelvas el JSON del análisis ni nombres técnicos de campos. Si citás datos, hacelo en texto humano legible.
3. Sé conciso: 3–6 puntos máximo salvo que el usuario pida detalle.
4. Si te piden modificar algo que NO está en el informe, decí: "No encontré ese dato en el informe". Si es pregunta conceptual, respondé desde tu expertise. NUNCA inventes datos.
5. SOLO modificás el informe del rol actual — jamás toques otros roles.

CUANDO EL USUARIO PIDE MODIFICAR ALGO:
1. **Busca en el JSON completo** que tienes arriba — está TODO ahí.
2. **Confirma ANTES de hacer el cambio:** Muestra en lenguaje humano exactamente QUÉ se va a cambiar.

   Ejemplo: Usuario pide "cambiar el riesgo de la segunda hipótesis a alto"
   PRIMERO CONFIRMA:
   "Encontré en Hipótesis a Validar: **[La pregunta exacta de la segunda hipótesis]**
   Riesgo actual: MEDIUM → Riesgo nuevo: HIGH

   ¿Querés hacer este cambio?"

3. **Solo después que confirme**, devuelve el patch JSON con la lista COMPLETA actualizada.

BÚSQUEDA:
- Busca en TODO el JSON por contenido, no por nombres técnicos.
- Si el usuario dice "segunda", es el 2do item del array más relevante.
- Si dice "Jira" o "pagos", busca esa palabra en el contenido.
- Si no encuentras nada, sé honesto: "No encontré eso en el informe. Tengo..."

CÓMO PROPONER MODIFICACIONES (LEÉ CON ATENCIÓN):
Cuando el usuario pida ELIMINAR un ítem de una lista:
→ Encontrá el ítem EXACTO en la lista del análisis (está listado arriba).
→ Devolvé la lista COMPLETA MENOS ese ítem. No solo el ítem a eliminar — toda la lista actualizada.
→ Si el ítem debe moverse a otra lista, actualizá AMBAS listas en el mismo bloque JSON.

Cuando el usuario pida AGREGAR un ítem:
→ Devolvé la lista COMPLETA MÁS el ítem nuevo al final.

Formato OBLIGATORIO para modificaciones:
\`\`\`json
{ "nombre_exacto_del_campo": ["todos los ítems que quedan", "otro ítem", ...] }
\`\`\`

REGLA CRÍTICA: La lista que devolvés REEMPLAZA la lista actual. Incluí TODOS los ítems que deben quedar, no solo el que cambió.

Ejemplo — mover "Facturación electrónica" de mvpInScope a mvpOutOfScope:
"Listo, moví Facturación electrónica fuera del MVP1. Aquí el cambio propuesto:
\`\`\`json
{ "mvpInScope": ["Sistema de autenticación", "Panel de clientes", "Pasarela de pagos básica"], "mvpOutOfScope": ["Facturación electrónica — renunció personal clave", "Reportes avanzados de BI"] }
\`\`\`"

El usuario verá un botón para CONFIRMAR o DESCARTAR el cambio. Si confirma, se guarda SOLO en este informe.

TU ESPECIALIDAD (referencia interna, no citar):
${roleSystemPrompt.slice(0, 400)}`;
    }

    return `You are ${name}, PILOT AI's specialized AI agent who just completed the project analysis.

MISSION IN THIS CHAT:
You are the go-to expert for answering questions, clarifying decisions, and applying concrete modifications to the report the user is viewing RIGHT NOW.

STRICT RULES:
1. ALWAYS respond in clear natural language with Markdown (lists, **bold**, headers).
2. NEVER return the analysis JSON or technical field names. If you cite data, do it in human-readable text.
3. Be concise: 3–6 points max unless the user requests detail.
4. If asked to modify something that does NOT exist in the report, say: "I didn't find that data in the report." If it's a conceptual question, answer from your expertise. NEVER invent report data.
5. You ONLY modify this role's report — never touch other roles.

WHEN USER ASKS TO MODIFY SOMETHING:
1. **Search the complete JSON above** — everything is there.
2. **Confirm BEFORE making the change:** Show in human language exactly WHAT will change.

   Example: User asks "change the risk of the second hypothesis to high"
   FIRST CONFIRM:
   "Found in Hypotheses to Validate: **[The exact question from second hypothesis]**
   Current risk: MEDIUM → New risk: HIGH

   Do you want to make this change?"

3. **Only after they confirm**, return the JSON patch with the COMPLETE updated list.

SEARCH:
- Search the entire JSON by content, not technical field names.
- If user says "second", it's the 2nd item in the most relevant array.
- If they say "Jira" or "payments", search for that word in the content.
- If you find nothing, be honest: "I didn't find that in the report. I have..."

HOW TO PROPOSE MODIFICATIONS (READ CAREFULLY):
When the user asks to REMOVE an item from a list:
→ Find the EXACT item in the list from the analysis (listed above).
→ Return the COMPLETE list WITHOUT that item. Not just the removed item — the full updated list.
→ If the item should move to another list, update BOTH lists in the same JSON block.

When the user asks to ADD an item:
→ Return the COMPLETE list WITH the new item appended.

MANDATORY format for modifications:
\`\`\`json
{ "exact_field_name": ["all items that stay", "another item", ...] }
\`\`\`

CRITICAL RULE: The list you return REPLACES the current list. Include ALL items that should remain, not just the changed one.

Example — moving "Electronic billing" from mvpInScope to mvpOutOfScope:
"Done, I moved Electronic billing out of MVP1. Here is the proposed change:
\`\`\`json
{ "mvpInScope": ["Auth system", "Customer portal", "Basic payment gateway"], "mvpOutOfScope": ["Electronic billing — key hire resigned", "Advanced BI reports"] }
\`\`\`"

The user will see a button to CONFIRM or DISCARD the change. If confirmed, it saves ONLY to this report.

YOUR SPECIALTY (internal reference, do not quote):
${roleSystemPrompt.slice(0, 400)}`;
}

/** Render any value as readable text lines — handles strings, numbers, string arrays, object arrays */
function renderValue(key: string, value: unknown, lines: string[], indent = 0): void {
    const pad = '  '.repeat(indent);
    if (value === null || value === undefined) return;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const str = String(value);
        if (str.length > 0 && str.length < 300) lines.push(`${pad}${key}: ${str}`);

    } else if (Array.isArray(value) && value.length > 0) {
        if (value.every(v => typeof v === 'string')) {
            // String array → numbered list
            lines.push(`${pad}▸ ${key}:`);
            (value as string[]).slice(0, 20).forEach((item, i) => lines.push(`${pad}  ${i + 1}. ${item}`));
        } else if (value.every(v => typeof v === 'object' && v !== null)) {
            // Object array — smart formatting. Auto-add H1/H2/H3... for hypothesis/assumptions
            lines.push(`${pad}▸ ${key}:`);
            const isHypothesis = key.toLowerCase().includes('assumption') ||
                                 key.toLowerCase().includes('hypothesis') ||
                                 key.toLowerCase().includes('question');

            (value as Record<string, unknown>[]).slice(0, 15).forEach((item, i) => {
                const obj = item as Record<string, unknown>;
                let line = '';

                // Priority: extract question/label field
                if (obj.question) {
                    line = String(obj.question);
                } else if (obj.label) {
                    line = String(obj.label);
                } else if (obj.description) {
                    line = String(obj.description);
                } else if (obj.title) {
                    line = String(obj.title);
                }

                // Add secondary properties (risk, riskLevel, priority, status, context, etc.)
                const extras = Object.entries(obj)
                    .filter(([k]) => !['id', 'question', 'label', 'description', 'title', 'context'].includes(k) &&
                            (typeof obj[k] === 'string' || typeof obj[k] === 'number'))
                    .slice(0, 2)
                    .map(([k, v]) => {
                        const strVal = String(v);
                        return strVal.length < 50 ? `${k}: ${strVal}` : null;
                    })
                    .filter(Boolean);

                if (!line) {
                    // Fallback: join first few string props
                    line = Object.entries(obj)
                        .filter(([, v]) => (typeof v === 'string' || typeof v === 'number') && String(v).length < 60)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(' | ');
                }

                if (line) {
                    // Truncate long lines but preserve key info
                    if (line.length > 100) line = line.slice(0, 100) + '...';

                    const fullLine = extras.length > 0 ? `${line} (${extras.join(', ')})` : line;

                    // Add H1/H2/H3 prefix for hypothesis/assumptions arrays
                    const prefix = isHypothesis ? `H${i + 1}: ` : `${i + 1}. `;
                    lines.push(`${pad}  ${prefix}${fullLine}`);
                }
            });
        }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        lines.push(`${pad}▸ ${key}:`);
        Object.entries(value as Record<string, unknown>).forEach(([k, v]) => renderValue(k, v, lines, indent + 1));
    }
}

/** Build context — pass full JSON structure intact, no info loss */
function buildReadableContext(contextData: unknown, lang: 'es' | 'en'): string {
    if (!contextData) return '';
    if (typeof contextData === 'string') {
        return contextData.length > 60000 ? contextData.slice(0, 60000) + '\n...[truncado]' : contextData;
    }

    // Pass full JSON — reports are small enough for the model context
    const jsonStr = JSON.stringify(contextData, null, 2);
    const truncated = jsonStr.length > 60000 ? jsonStr.slice(0, 60000) + '\n...[truncado]' : jsonStr;

    const header = lang === 'es'
        ? `═══ CONTENIDO COMPLETO DEL INFORME (JSON) ═══
Tenés el JSON completo del análisis. Buscá por CONTENIDO, no por nombres de campos.

EQUIVALENCIAS CLAVE (el usuario usa lenguaje visual, vos buscás en el JSON):
- "Hipótesis a Validar" / "H1, H2, H3..." / "Supuestos" → buscá en campos: assumptions, hypotheses, supuestos, hipotesis
- "Preguntas de discovery" / "q1, q2..." → buscá en: discoveryQuestions, questions
- "MVP1" / "En alcance" → buscá en: mvpInScope, inScope
- "Fuera de alcance" → buscá en: mvpOutOfScope, outOfScope
- "Features priorizadas" / "RICE" → buscá en: riceFeatures, features
- "Competencia" → buscá en: competitors
- "Personas objetivo" / "Audiencia" → buscá en: targetAudience, buyerPersona
- Los items H1, H2, H3... del dashboard son el 1ro, 2do, 3ro del array assumptions (o equivalente)

Respondé solo con datos que aparezcan aquí. Si no existe, decilo honestamente. NUNCA inventes.\n\n`
        : `═══ COMPLETE REPORT CONTENT (JSON) ═══
You have the full analysis JSON. Search by CONTENT, not by field names.

KEY EQUIVALENTS (user uses visual language, you search in JSON):
- "Hypotheses to Validate" / "H1, H2, H3..." / "Assumptions" → search fields: assumptions, hypotheses
- "Discovery Questions" / "q1, q2..." → search: discoveryQuestions, questions
- "MVP1" / "In scope" → search: mvpInScope, inScope
- "Out of scope" → search: mvpOutOfScope, outOfScope
- "Prioritized features" / "RICE" → search: riceFeatures, features
- "Competition" → search: competitors
- "Target personas" / "Audience" → search: targetAudience, buyerPersona
- Items H1, H2, H3... from dashboard are the 1st, 2nd, 3rd of the assumptions array (or equivalent)

Only answer with data that appears here. If not found, say so honestly. NEVER invent.\n\n`;

    return header + truncated;
}

export default function ChatBox({ roleId, modelName, systemPrompt, contextData, onUpdateBlueprint, lang = 'es' }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [patchStates, setPatchStates] = useState<Record<number, PatchState>>({});
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    // Keep a ref to latest contextData so handleSend always uses fresh context after patches applied
    const contextDataRef = useRef(contextData);
    useEffect(() => { contextDataRef.current = contextData; }, [contextData]);

    const chatSystemPrompt = buildChatSystemPrompt(roleId, systemPrompt, lang);
    const names = ROLE_DISPLAY_NAMES[roleId] || { es: roleId, en: roleId };
    const displayName = names[lang];
    const quickActions = ROLE_QUICK_ACTIONS[roleId]?.[lang] ?? [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleApplyPatch = (idx: number, patch: Record<string, unknown>) => {
        onUpdateBlueprint(patch);
        setPatchStates(prev => ({ ...prev, [idx]: 'applied' }));
    };

    const handleDismissPatch = (idx: number) => {
        setPatchStates(prev => ({ ...prev, [idx]: 'dismissed' }));
    };

    const handleClearChat = () => {
        setMessages([]);
        setPatchStates({});
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSend = async (text?: string) => {
        const trimmed = (text ?? input).trim();
        if (!trimmed || loading) return;

        const userMessage: Message = { role: 'user', content: trimmed, timestamp: new Date() };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            // Always use the latest context (might have changed after patch applied)
            const freshContext = buildReadableContext(contextDataRef.current, lang);

            const historyText = messages
                .filter(m => !(m.role === 'assistant' && m.patch)) // exclude patch proposals from history to save tokens
                .map(m =>
                    `${m.role === 'user' ? (lang === 'es' ? 'Usuario' : 'User') : (lang === 'es' ? 'Asistente' : 'Assistant')}: ${stripJsonBlock(m.content)}`
                ).join('\n\n');

            const contextBlock = freshContext
                ? `\n\n## ${lang === 'es' ? 'INFORME ACTUAL' : 'CURRENT REPORT'}:\n${freshContext}`
                : '';

            const userPrompt = historyText
                ? `${contextBlock}\n\n## ${lang === 'es' ? 'CONVERSACIÓN PREVIA' : 'PREVIOUS CONVERSATION'}:\n${historyText}\n\n${lang === 'es' ? 'Usuario' : 'User'}: ${trimmed}`
                : `${contextBlock}\n\n${lang === 'es' ? 'Usuario' : 'User'}: ${trimmed}`;

            const response = await aiService.generateContent(modelName || 'claude-haiku-4-5-20251001', chatSystemPrompt, userPrompt);

            const patch = extractJsonPatch(response);
            const aiMessage: Message = { role: 'assistant', content: response, timestamp: new Date(), patch: patch ?? undefined };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('[ChatBox] Error:', error);
            const errorText = lang === 'es'
                ? 'Ocurrió un error al procesar tu consulta. Intenta nuevamente.'
                : 'An error occurred processing your query. Please try again.';
            setMessages(prev => [...prev, { role: 'assistant', content: errorText, timestamp: new Date() }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const showWelcome = messages.length === 0;
    const welcomeText = lang === 'es'
        ? `Soy ${displayName}. Hacé preguntas sobre el análisis, pedí aclaraciones o decime qué querés modificar del informe.`
        : `I'm ${displayName}. Ask questions about the analysis, request clarifications, or tell me what you'd like to change in the report.`;

    return (
        <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: '520px' }}>

            {/* Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-2.5 shrink-0">
                <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-400 leading-none">
                        {lang === 'es' ? 'Informe activo · Solo modifica este rol' : 'Active report · Modifies this role only'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                    </span>
                    {messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            title={lang === 'es' ? 'Limpiar conversación' : 'Clear conversation'}
                            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">

                {/* Welcome + quick actions */}
                {showWelcome && (
                    <div className="space-y-3">
                        <div className="flex gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[88%]">
                                <p className="text-sm text-slate-600 leading-relaxed">{welcomeText}</p>
                            </div>
                        </div>
                        {/* Quick action chips */}
                        {quickActions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pl-9">
                                {quickActions.map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => handleSend(action)}
                                        disabled={loading}
                                        className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-40"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn("flex gap-2.5", msg.role === 'user' ? "flex-row-reverse" : "")}
                    >
                        {/* Avatar */}
                        <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                            msg.role === 'user' ? "bg-indigo-600" : "bg-slate-100"
                        )}>
                            {msg.role === 'user'
                                ? <UserIcon className="h-3.5 w-3.5 text-white" />
                                : <Bot className="h-3.5 w-3.5 text-slate-500" />
                            }
                        </div>

                        {/* Bubble */}
                        <div className={cn(
                            "max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                            msg.role === 'user'
                                ? "bg-indigo-600 text-white rounded-tr-sm"
                                : "bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm"
                        )}>
                            {msg.role === 'assistant' ? (
                                <>
                                    {/* Render text without the raw JSON block */}
                                    <div className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {stripJsonBlock(msg.content)}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Patch confirmation card — human language, no technical field names */}
                                    {msg.patch && (() => {
                                        const state = patchStates[idx] ?? 'pending';
                                        const humanText = buildHumanConfirmation(msg.patch, contextDataRef.current, lang);
                                        return (
                                            <div className={cn(
                                                "mt-3 rounded-xl border text-[12px] overflow-hidden",
                                                state === 'applied'   ? "border-emerald-200 bg-emerald-50" :
                                                state === 'dismissed' ? "border-slate-200 bg-slate-50 opacity-60" :
                                                "border-amber-200 bg-amber-50"
                                            )}>
                                                {/* Human-readable confirmation question */}
                                                <div className="px-3.5 py-3">
                                                    {state === 'pending' && (
                                                        <p className="text-slate-700 leading-snug font-medium mb-3">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <span>{children}</span> }}>
                                                                {humanText}
                                                            </ReactMarkdown>
                                                        </p>
                                                    )}
                                                    {state === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleApplyPatch(idx, msg.patch!)}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-sm"
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                                {lang === 'es' ? 'Aplicar' : 'Apply'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDismissPatch(idx)}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-medium transition-colors"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                                                {lang === 'es' ? 'Dejar como está' : 'Keep as is'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {state === 'applied' && (
                                                        <p className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            {lang === 'es' ? '✓ Cambio aplicado al informe' : '✓ Change applied to report'}
                                                        </p>
                                                    )}
                                                    {state === 'dismissed' && (
                                                        <p className="flex items-center gap-1.5 text-slate-500">
                                                            <XCircle className="h-4 w-4" />
                                                            {lang === 'es' ? 'Descartado — informe sin cambios' : 'Discarded — report unchanged'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                            <span className="text-[10px] opacity-40 block mt-1.5 text-right">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <Bot className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex gap-1 items-center">
                                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-3 py-2.5 border-t border-slate-100 bg-white shrink-0">
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={lang === 'es'
                            ? 'Preguntá o pedí un cambio al informe… (Enter para enviar)'
                            : 'Ask a question or request a change… (Enter to send)'}
                        disabled={loading}
                        rows={1}
                        className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all disabled:opacity-50 max-h-[100px] overflow-y-auto scrollbar-thin"
                        style={{ minHeight: '40px' }}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 shadow-sm"
                    >
                        {loading
                            ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                            : <Send className="h-4 w-4 text-white" />
                        }
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 px-1">
                    {lang === 'es' ? 'Shift+Enter para nueva línea' : 'Shift+Enter for new line'}
                </p>
            </div>
        </div>
    );
}
