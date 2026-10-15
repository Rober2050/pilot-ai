import { AIProviderFactory } from "./AIProviderFactory";

// Thin wrapper over the provider architecture; every call is served by Claude via the anthropic-proxy.
export const aiService = {
    generateText: async (modelName: string, systemPrompt: string, userPrompt: string, options?: any): Promise<string> => {
        const provider = await AIProviderFactory.getInstance().getProviderForModel(modelName);
        return provider.generateText(modelName, systemPrompt, userPrompt, options);
    },

    generateContent: async (modelName: string, systemPrompt: string, userPrompt: string): Promise<string> => {
        const provider = await AIProviderFactory.getInstance().getProviderForModel(modelName);
        return provider.generateText(modelName, systemPrompt, userPrompt);
    },

    generateJSON: async (modelName: string, systemPrompt: string, userPrompt: string, options?: any): Promise<any> => {
        const provider = await AIProviderFactory.getInstance().getProviderForModel(modelName);
        return provider.generateJSON(modelName, systemPrompt, userPrompt, options);
    },

    generateCodebaseStructure: async (stack: { frontend: string; backend: string; database: string }) => {
        const systemPrompt = `You are an expert software architect. Your goal is to generate a high-level project structure and API plan based on the user's chosen technology stack.
        
        Output format should be a clear, readable text report (Markdown) including:
        1. Directory Structure (tree format)
        2. Key Dependencies (package.json / requirements.txt highlights)
        3. API Endpoints (RESTful or GraphQL)
        4. Database Schema (High-level entities)
        
        Keep it concise but professional.`;

        const userPrompt = `Generate a project architecture for the following stack:
        - Frontend: ${stack.frontend}
        - Backend: ${stack.backend}
        - Database: ${stack.database}
        
        Include specific folder names and file conventions for these technologies.`;

        const provider = AIProviderFactory.getInstance().getProvider('anthropic');
        return provider.generateText('claude-haiku-4-5-20251001', systemPrompt, userPrompt);
    },

    generateAcademyStage: async (
        role: string,
        type: 'matrix-2x2' | 'bar-chart' | 'process-flow' | 'text-concept',
        language: 'es' | 'en' = 'es'
    ): Promise<any> => {
        const provider = await AIProviderFactory.getInstance().getProviderForModel('claude-haiku-4-5-20251001');
        const langInstruction = language === 'en' ? 'Reply in English.' : 'Responde en Español.';


        const systemPrompt = `You are an expert educational content creator for an enterprise AI platform.
        Your goal is to generate a specific "Stage" configuration for a guided tour.
        
        Output MUST be valid, minimized JSON only. No markdown formatting.
        
        SCHEMA DEFINITIONS:
        
        1. MATRIX (2x2):
        {
          "type": "matrix-2x2",
          "title": "Title related to role",
          "subtitle": "Brief explanation",
          "duration": 10,
          "axes": { "x": "Label X", "y": "Label Y" },
          "quadrants": [
            { "label": "Top-Right", "color": "#10b981" },
            { "label": "Top-Left", "color": "#06b6d4" },
            { "label": "Bottom-Left", "color": "#f59e0b" },
            { "label": "Bottom-Right", "color": "#ef4444" }
          ],
          "data": [
            { "id": 1, "label": "Item 1", "x": 80, "y": 80, "color": "emerald" },
            { "id": 2, "label": "Item 2", "x": 20, "y": 20, "color": "amber" }
          ]
        }
        
        2. CHART (Bar):
        {
          "type": "bar-chart",
          "title": "Title",
          "subtitle": "Subtitle",
          "duration": 10,
          "data": [
            { "label": "Metric A", "value": 80, "heightPercentage": 80, "color": "#6366f1" }
          ]
        }
        
        3. PROCESS FLOW (LOGICAL GRID):
        {
          "type": "process-flow",
          "title": "Process Title",
          "subtitle": "Description",
          "duration": 15,
          "nodes": [
            { "id": "1", "label": "Start", "type": "circle", "gridCol": 1, "gridRow": 1 },
            { "id": "2", "label": "Action", "type": "rect", "gridCol": 2, "gridRow": 1 },
            { "id": "3", "label": "Decision", "type": "diamond", "gridCol": 3, "gridRow": 1 },
            { "id": "4", "label": "Alternative", "type": "rect", "gridCol": 3, "gridRow": 2 },
            { "id": "5", "label": "End", "type": "circle", "gridCol": 4, "gridRow": 1 }
          ],
          "connections": [
            { "from": "1", "to": "2", "label": "Next" },
            { "from": "3", "to": "4", "label": "No" }
          ]
        }
        *CRITICAL RULES*:
        - Use 'gridCol' (1-5) and 'gridRow' (1-3) to define layout structure. NOT pixels.
        - Ensure a linear flow from left to right (increasing gridCol).
        - Generate 5-7 meaningful steps.

        4. TEXT CONCEPT:
        {
            "type": "text-concept",
            "title": "Concept Title",
            "subtitle": "Subtitle",
            "duration": 10,
            "content": "Main explanation text (max 60 words)...",
            "bullets": ["Point 1", "Point 2"],
            "highlight": "Key takeaway"
        }
        `;

        const userPrompt = `Generate a "${type}" stage for the role "${role}".
        Language: ${langInstruction}.
        For Process Flow: Create a complete, logical workflow with 5-7 steps.`;

        // We use generateJSON from the provider if available, or text and parse
        try {
            return await provider.generateJSON('claude-haiku-4-5-20251001', systemPrompt, userPrompt);
        } catch (e) {
            // Fallback if JSON generation fails or provider doesn't support it directly
            const text = await provider.generateText('claude-haiku-4-5-20251001', systemPrompt, userPrompt);
            try {
                // simple cleanup for potential markdown code blocks
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(jsonStr);
            } catch (parseError) {
                console.error("Failed to parse AI response", text);
                throw new Error("AI generated invalid JSON");
            }
        }
    }
};
