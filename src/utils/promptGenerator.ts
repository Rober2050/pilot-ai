import { RoleConfig } from '../types/roles';

/**
 * Generates a standardized system prompt for an AI role based on its configuration.
 * This ensures all roles output data compatible with the Universal Dashboard ("Master Board").
 */
export const generateSystemPrompt = (baseDescription: string, docConfig: RoleConfig['docConfig']): string => {

    // 1. Base Instruction & Identity
    let prompt = `${baseDescription}\n\n`;
    prompt += `CRITICAL INSTRUCTION: You must return a SINGLE JSON object. Do not include markdown formatting (like \`\`\`json) outside the JSON.\n`;
    prompt += `DETECT LANGUAGE: Detect the language of the user's request (English or Spanish) and strictly use that language for all content.\n\n`;

    // 2. Master Dashboard Structure (Standard for ALL Roles)
    prompt += `OUTPUT SCHEMA: Your JSON response MUST follow this exact structure to populate the "Master Dashboard":\n`;
    prompt += `{\n`;
    prompt += `  "dashboard": {\n`;
    prompt += `    "summary": "Executive summary of your analysis (3-5 lines).",\n`;
    prompt += `    "kpis": [\n`;
    prompt += `      { "label": "Key Metric 1", "value": "Value", "icon": "Activity", "color": "blue", "trend": "up" }\n`;
    prompt += `    ],\n`;
    prompt += `    "tabs": [\n`;

    // 3. Dynamic Tab Injection based on docConfig

    // --- A. Charts & Dashboards ---
    if (docConfig.charts) {
        prompt += `      {\n`;
        prompt += `        "id": "analytics",\n`;
        prompt += `        "label": "Analytics",\n`;
        prompt += `        "type": "charts",\n`;
        prompt += `        "data": [\n`;
        prompt += `          { "title": "Metric Breakdown", "type": "pie", "data": [{ "name": "A", "value": 10 }] },\n`;
        prompt += `          { "title": "Trend Analysis", "type": "bar", "data": [{ "name": "Q1", "value": 100 }] }\n`;
        prompt += `        ]\n`;
        prompt += `      },\n`;
    }

    // --- B. Flow Diagrams / Architecture ---
    if (docConfig.flowDiagrams || docConfig.architecture) {
        prompt += `      {\n`;
        prompt += `        "id": "diagram",\n`;
        prompt += `        "label": "Diagram",\n`;
        prompt += `        "type": "diagram",\n`;
        prompt += `        "description": "Detailed explanation of the flow...",\n`;
        prompt += `        "data": { "nodes": [...], "edges": [...] } \n`;
        prompt += `      },\n`;
    }

    // --- C. C4 Diagrams (Specific View) ---
    if (docConfig.c4) {
        prompt += `      {\n`;
        prompt += `        "id": "c4-view",\n`;
        prompt += `        "label": "C4 Architecture",\n`;
        prompt += `        "type": "c4-diagram",\n`;
        prompt += `        "data": { "nodes": [...], "edges": [...] }\n`;
        prompt += `      },\n`;
    }

    // --- D. Matrix (SWOT/TOWS) ---
    if (docConfig.matrix) {
        prompt += `      {\n`;
        prompt += `        "id": "matrix",\n`;
        prompt += `        "label": "Strategic Matrix",\n`;
        prompt += `        "type": "matrix",\n`;
        prompt += `        "data": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] }\n`;
        prompt += `      },\n`;
    }

    // --- E. User Stories (Business Analyst) ---
    if (docConfig.userStories) {
        prompt += `      {\n`;
        prompt += `        "id": "stories",\n`;
        prompt += `        "label": "User Stories",\n`;
        prompt += `        "type": "user-stories",\n`;
        prompt += `        "data": [\n`;
        prompt += `          { "id": "US-01", "asA": "User", "iWant": "...", "soThat": "...", "acceptanceCriteria": ["..."] }\n`;
        prompt += `        ]\n`;
        prompt += `      },\n`;
    }

    // --- F. Interactive Discovery (Product Manager) ---
    if (docConfig.discovery) {
        prompt += `      {\n`;
        prompt += `        "id": "discovery",\n`;
        prompt += `        "label": "Discovery",\n`;
        prompt += `        "type": "interactive-questions",\n`;
        prompt += `        "data": [\n`;
        prompt += `          { "id": "q1", "question": "Critical question for the user?", "context": "Why this matters..." }\n`;
        prompt += `        ]\n`;
        prompt += `      },\n`;
    }

    // --- G. Standard Text/Markdown ---
    if (docConfig.text) {
        prompt += `      {\n`;
        prompt += `        "id": "details",\n`;
        prompt += `        "label": "Detailed Analysis",\n`;
        prompt += `        "type": "markdown",\n`;
        prompt += `        "data": "## Full Report\\n..."\n`;
        prompt += `      },\n`;
    }

    prompt += `    ]\n`; // End tabs
    prompt += `  }\n`; // End dashboard
    prompt += `}\n\n`;

    // 4. Specific Instructions per Feature
    if (docConfig.charts) {
        prompt += `INSTRUCTION FOR CHARTS: Generate realistic data for the charts. Use 'pie', 'bar', 'area', or 'line' types.\n`;
    }
    if (docConfig.flowDiagrams || docConfig.architecture) {
        prompt += `INSTRUCTION FOR DIAGRAMS: Use React Flow JSON format (nodes/edges). Nodes MUST have text labels (NO numbers). Description MUST be detailed.\n`;
    }
    if (docConfig.c4) {
        prompt += `INSTRUCTION FOR C4: Use React Flow JSON format. Create a C4 model (Context, Container). Use 'parentNode' to show nesting if applicable, or separate clusters.\n`;
    }
    if (docConfig.matrix) {
        prompt += `INSTRUCTION FOR MATRIX: Populate the matrix with SWOT items.\n`;
    }

    prompt += `GENERAL INSTRUCTION: Ensure the content is professional and aligned with the user's idea.`;

    return prompt;
};
