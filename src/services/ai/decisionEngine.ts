import { RoleConfig } from '../../types/roles';
import { aiService } from './aiService';

export interface DecisionScore {
    feasibility: number; // Technical Viability (0-100)
    desirability: number; // Market/User Need (0-100)
    viability: number;   // Business/Financial (0-100)
}

export interface DecisionResult {
    score: DecisionScore;
    finalScore: number; // Weighted Average
    verdict: 'GO' | 'NO GO' | 'CONDITIONAL';
    reasoning: string;
    riskAnalysis: string;
}

export const decisionEngine = {
    /**
     * Analyzes the full transcript to generate a decision matrix.
     */
    analyzeSession: async (
        topic: string,
        transcript: { roleName: string; content: string }[],
        roles: RoleConfig[],
        language: 'es' | 'en' = 'es' // Added language parameter
    ): Promise<DecisionResult> => {

        const isSpanish = language === 'es';

        // 1. Construct the Analysis Prompt
        const prompt = `
        You are the Chief Strategy Officer (CSO) of a tech company.
        Your goal is to evaluate a debate transcript and issue a FINAL BINDING VERDICT on a project proposal.
        
        IMPORTANT: Respond ONLY in ${isSpanish ? 'SPANISH (Español)' : 'ENGLISH'}.

        TOPIC: "${topic}"

        PARTICIPANTS:
        ${roles.map(r => `- ${r.displayName}: ${r.description}`).join('\n')}

        TRANSCRIPT:
        ${transcript.map(t => `[${t.roleName}]: ${t.content}`).join('\n')}

        ---
        
        TASK:
        Analyze the discussion based on the "Weighted Triangle" framework:
        1. FEASIBILITY (Technical): Is it technically possible? Are there major architectural risks?
        2. DESIRABILITY (Market/User): Does the user want this? Is there a market fit?
        3. VIABILITY (Business): Is it profitable? Is the ROI positive? Can we afford it?

        SCORING RULES:
        - Assign a score from 0-100 for each dimension.
        - < 50: Critical Failure / High Risk.
        - 50-70: Major Concerns / Conditional.
        - > 70: Strong / Safe.

        VERDICT LOGIC:
        - IF any score < 40 -> NO GO (Veto).
        - IF Average > 75 AND Min Score > 50 -> GO.
        - ELSE -> CONDITIONAL.

        OUTPUT FORMAT:
        Return ONLY a JSON object with this structure:
        {
            "feasibility": number,
            "desirability": number,
            "viability": number,
            "reasoning": "${isSpanish ? 'Un resumen ejecutivo conciso de POR QUÉ se tomó esta decisión (max 3 oraciones).' : 'A concise executive summary of WHY this decision was made (max 3 sentences).'}",
            "riskAnalysis": "${isSpanish ? 'Puntos clave de los 3 mayores riesgos identificados.' : 'Bullet points of the top 3 risks identified.'}"
        }
        `;

        try {
            const response = await aiService.generateContent('claude-haiku-4-5-20251001', prompt, "Generate Decision JSON");

            // Clean and parse JSON
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            // Calculate Weighted Average (Equal weights for now, can be customized later)
            const finalScore = Math.round((data.feasibility + data.desirability + data.viability) / 3);

            // Determine Verdict (Double check logic)
            let verdict: 'GO' | 'NO GO' | 'CONDITIONAL' = 'CONDITIONAL';
            if (data.feasibility < 40 || data.desirability < 40 || data.viability < 40) {
                verdict = 'NO GO';
            } else if (finalScore > 75) {
                verdict = 'GO';
            }

            return {
                score: {
                    feasibility: data.feasibility,
                    desirability: data.desirability,
                    viability: data.viability
                },
                finalScore,
                verdict,
                reasoning: data.reasoning,
                riskAnalysis: data.riskAnalysis
            };

        } catch (error) {
            console.error("Decision Engine Failed:", error);
            // Fallback result
            return {
                score: { feasibility: 0, desirability: 0, viability: 0 },
                finalScore: 0,
                verdict: 'NO GO',
                reasoning: "Analysis failed due to technical error.",
                riskAnalysis: "N/A"
            };
        }
    }
};
