import { AIProviderFactory } from "../ai/AIProviderFactory";

// Legacy service wrapper to maintain backward compatibility
// while using the new robust provider architecture
export const geminiService = {
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

        const provider = AIProviderFactory.getInstance().getProvider('google');
        return provider.generateText('gemini-2.5-flash', systemPrompt, userPrompt);
    },

    generateAcademyStage: async (
        role: string,
        type: 'matrix-2x2' | 'bar-chart' | 'process-flow' | 'text-concept',
        language: 'es' | 'en' = 'es'
    ): Promise<any> => {
        const provider = await AIProviderFactory.getInstance().getProviderForModel('gemini-2.5-flash');
        const langInstruction = language === 'en' ? 'Reply in English.' : 'Responde en Español.';

        // GROUNDING CHECK: If role is Strategy Analyst, enable Google Search
        const isStrategyAnalyst = role.toLowerCase().includes('strategy') && role.toLowerCase().includes('analyst');
        const options = isStrategyAnalyst ? { tools: [{ google_search: {} }] } : undefined;

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
            return await provider.generateJSON('gemini-2.5-flash', systemPrompt, userPrompt, options);
        } catch (e) {
            // Fallback if JSON generation fails or provider doesn't support it directly
            const text = await provider.generateText('gemini-2.5-flash', systemPrompt, userPrompt, options);
            try {
                // simple cleanup for potential markdown code blocks
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(jsonStr);
            } catch (parseError) {
                console.error("Failed to parse AI response", text);
                throw new Error("AI generated invalid JSON");
            }
        }
    },

    listModels: async () => {
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error("Error listing models:", error);
            return [];
        }
    },

    generateImage: async (prompt: string): Promise<string> => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        // Using Imagen 3 via Gemini API (REST)
        // Updated to use the potentially more widely available endpoint or 002
        // Primary model - confirmed available for this user
        let modelId = 'imagen-3.0-generate-001';
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${apiKey}`;

        // Fallback model suggests by Gemini
        const fallbackModelId = 'image-generation-006';

        const payload = {
            instances: [
                { prompt: prompt }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "16:9"
            }
        };

        const executeGen = async (currentUrl: string) => {
            const response = await fetch(currentUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Parse error text if it's JSON to get a cleaner message
                try {
                    const errorJson = JSON.parse(errorText);
                    const message = errorJson.error?.message || errorText;
                    throw new Error(`Imagen API Error (${response.status}): ${message}`);
                } catch {
                    throw new Error(`Imagen API Error (${response.status}): ${errorText}`);
                }
            }
            return response.json();
        };

        try {
            let data;
            try {
                data = await executeGen(url);
            } catch (primaryError: any) {
                console.warn(`Primary Imagen model (${modelId}) failed, trying fallback (${fallbackModelId})...`, primaryError);
                // Retry with fallback
                url = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModelId}:predict?key=${apiKey}`;
                data = await executeGen(url);
            }

            // Expected format: { predictions: [ { bytesBase64Encoded: "..." } ] }

            // Expected format: { predictions: [ { bytesBase64Encoded: "..." } ] }
            if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
                return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
            } else if (data.predictions && data.predictions[0] && data.predictions[0].mimeType && data.predictions[0].bytesBase64Encoded) {
                return `data:${data.predictions[0].mimeType};base64,${data.predictions[0].bytesBase64Encoded}`;
            } else {
                console.error("Unexpected Imagen Response:", data);
                throw new Error("Invalid response format from Imagen API (No Base64 data found)");
            }

        } catch (error: any) {
            console.error("Failed to generate image:", error);
            throw error; // Re-throw to be caught by UI
        }
    }
};

