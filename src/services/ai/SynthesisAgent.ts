import { aiService } from './aiService';
import { configService } from '../firebase/configService';
import type { SynthesisOutput } from '../../types/blueprint';
// Nine full role outputs exceed the proxy's per-message cap (413), so they are compacted.
import { buildPreviousRolesContext } from '../../utils/compactRoleContext';

const SYNTHESIS_PROTOCOL = `
You are a senior strategy synthesis AI. You receive the structured outputs of multiple specialized AI agents that analyzed a business idea. Read ALL agent outputs and produce a unified executive synthesis.

OUTPUT FORMAT (strict JSON, no markdown wrapping):
{
  "teamVerdict": "PROCEED" | "PIVOT" | "HALT",
  "verdictConfidence": <number 0-100>,
  "verdictRationale": "<2-3 sentence rationale for the verdict based on cross-role consensus>",
  "executiveSummary": "<3-5 sentences unified summary of the analysis>",
  "alignments": [
    { "roles": ["roleId1", "roleId2"], "topic": "<what they agree on>" }
  ],
  "tensions": [
    { "roleA": "roleId1", "roleB": "roleId2", "description": "<the conflict>", "severity": "low"|"medium"|"high" }
  ],
  "topRisks": [
    { "rank": 1, "description": "<risk>", "sourcedFrom": ["roleId1", "roleId2"] },
    { "rank": 2, "description": "<risk>", "sourcedFrom": ["roleId1"] },
    { "rank": 3, "description": "<risk>", "sourcedFrom": ["roleId1", "roleId2"] }
  ],
  "recommendation": "<1-2 sentences concrete next step>",
  "rolesAnalyzed": ["roleId1", "roleId2"],
  "generatedAt": "<ISO 8601 timestamp>",
  "numberReconciliation": {
    "customerAcquisitionCost": {
      "description": "Compare CAC across roles if mentioned",
      "values": [
        { "role": "Strategy Analyst", "value": "<extracted number or 'not provided'>", "basis": "<how they calculated it>" },
        { "role": "Marketing Manager", "value": "<extracted number or 'not provided'>", "basis": "<how they calculated it>" }
      ],
      "conflict": "<If values differ: 'CRITICAL — X% discrepancy' or 'No conflict'>",
      "resolution": "<How to resolve or clarify the difference>"
    },
    "mvpTimeline": {
      "description": "Compare timeline estimates across roles",
      "values": [
        { "role": "Project Manager", "value": "<weeks or hours>", "basis": "<methodology>" },
        { "role": "Architect", "value": "<weeks or hours>", "basis": "<methodology>" }
      ],
      "conflict": "<If values differ significantly>",
      "resolution": "<How to reconcile>"
    },
    "mvpScope": {
      "description": "Compare MVP scope definitions",
      "values": [
        { "role": "Product Manager", "value": "<feature count or description>", "basis": "<methodology>" },
        { "role": "Business Analyst", "value": "<feature count or description>", "basis": "<methodology>" }
      ],
      "conflict": "<If interpretations differ>",
      "resolution": "<Recommendation>"
    }
  }
}

RULES:
- teamVerdict MUST reflect cross-role consensus, not just the Strategy Analyst verdict alone
- Identify REAL tensions: contradictions between agent findings (e.g., SA says PROCEED but Architect flags a blocking technical risk)
- topRisks must be exactly 3 items sourced from actual agent outputs
- If fewer than 2 roles have output, return teamVerdict "PIVOT" explaining insufficient data
- CRITICAL: Extract and reconcile numbers (CAC, timeline, scope) across roles. If a role didn't mention a number, put "not provided" and explain why it matters
- CRITICAL: verdictRationale MUST be 100% coherent with teamVerdict. If teamVerdict="PIVOT", rationale must explain WHY pivoting is needed. If "PROCEED", rationale must explain WHY proceeding is justified. NEVER contradict yourself.
- VALIDATION: Before outputting, verify: teamVerdict, verdictConfidence, and verdictRationale all tell the same story. Example: if "PROCEED" verdict but high risks exist, explain in rationale why risks are manageable, NOT why to pivot.
- Output raw JSON only — never wrap in markdown code blocks
`;

export interface SynthesisInput {
    ideaOriginal: string;
    roleOutputs: Array<{
        roleId: string;
        displayName: string;
        content: unknown;
    }>;
    language: 'en' | 'es';
}

// Normalize teamVerdict — AI sometimes translates the enum to Spanish ("PROCEDER", "PIVOTAR")
// or returns lowercase. Force back to canonical English uppercase.
function normalizeTeamVerdict(raw: unknown): 'PROCEED' | 'PIVOT' | 'HALT' {
    if (typeof raw !== 'string') return 'PIVOT';
    const v = raw.trim().toUpperCase();
    // Spanish translations
    if (v === 'PROCEDER' || v === 'PROCEED' || v === 'AVANZAR' || v === 'CONTINUAR') return 'PROCEED';
    if (v === 'PIVOT' || v === 'PIVOTAR' || v === 'AJUSTAR' || v === 'GIRAR') return 'PIVOT';
    if (v === 'HALT' || v === 'DETENER' || v === 'PARAR' || v === 'ABANDONAR') return 'HALT';
    // Default to PIVOT if unknown
    console.warn('[SynthesisAgent] Unknown teamVerdict value, defaulting to PIVOT:', raw);
    return 'PIVOT';
}

export async function generateSynthesis(input: SynthesisInput): Promise<SynthesisOutput> {
    const langInstruction = input.language === 'es'
        ? `Respond in Spanish for all natural-language text fields (executiveSummary, verdictRationale, descriptions, recommendation, etc.).
CRITICAL: Enum/code fields MUST stay in English exactly as defined — never translate them:
- teamVerdict MUST be EXACTLY one of: "PROCEED", "PIVOT", or "HALT" (English uppercase).
- severity MUST be EXACTLY one of: "low", "medium", or "high" (English lowercase).
- roleId fields MUST stay as English IDs: "strategy-analyst", "product-manager", etc.
DO NOT translate "PROCEED" to "PROCEDER", "PIVOT" to "PIVOTAR", or any other enum to Spanish.`
        : `Respond in English for all text fields.
teamVerdict MUST be EXACTLY one of: "PROCEED", "PIVOT", or "HALT".
severity MUST be EXACTLY one of: "low", "medium", or "high".`;

    const userPrompt = `${langInstruction}

Original idea: "${input.ideaOriginal}"

Agent outputs to synthesize:
${buildPreviousRolesContext(input.roleOutputs.map(r => ({ role: `${r.displayName} (${r.roleId})`, output: r.content })))}

Generate the unified synthesis JSON now.`;

    // Load model from Firestore (configurable via Admin Console) — fallback to Claude Haiku 4.5
    const synthConfig = await configService.getSynthesisConfig();
    const modelToUse = synthConfig.model || 'claude-haiku-4-5-20251001';
    const protocolToUse = synthConfig.systemPrompt?.trim() || SYNTHESIS_PROTOCOL;

    const result = await aiService.generateJSON(
        modelToUse,
        protocolToUse,
        userPrompt,
        { tools: [] }
    ) as SynthesisOutput;

    // Always override — AI returns historical/incorrect dates
    result.generatedAt = new Date().toISOString();

    // Defensive normalization: AI may translate enum to Spanish despite instructions
    result.teamVerdict = normalizeTeamVerdict(result.teamVerdict);

    return result;
}
