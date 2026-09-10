export interface BlueprintMeta {
    projectId: string;
    projectName: string;
    language: 'en' | 'es';
    methodology?: 'agile' | 'pmo' | 'hybrid';
    createdAt: string;
    updatedAt: string;
    version: string;
}

export interface RoleOutput {
    status: 'pending' | 'processing' | 'completed' | 'error';
    content: unknown; // Flexible content structure per role // Flexible content structure per role
    feedback?: string; // User feedback/chat history
    lastUpdated: string;
    discoveryAnswers?: Record<string, string>;
    startedAt?: string; // ISO timestamp — set when processing begins, persisted to Firestore
                        // Allows AnalyzingPanel to show real elapsed time even after navigation
}

export interface StrategyAnalystOutput extends RoleOutput {
    content: {
        marketAnalysis: string;
        targetAudience: string[];
        valueProposition: string;
        swot: {
            strengths: string[];
            weaknesses: string[];
            opportunities: string[];
            threats: string[];
        };
        businessModel: {
            type: string;
            revenueStreams: string[];
            costStructure: string[];
        };
        competitors: Array<{ name: string; description: string; }>;
    };
}

export interface ProductManagerOutput extends RoleOutput {
    content: {
        vision: string;
        goals: string[];
        mvpFeatures: Array<{ name: string; priority: 'High' | 'Medium' | 'Low'; description: string; }>;
        successMetrics: string[];
    };
}

// ... Add other specific role interfaces as needed

export interface SynthesisAlignment {
    roles: string[];
    topic: string;
}

export interface SynthesisTension {
    roleA: string;
    roleB: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
}

export interface SynthesisRisk {
    rank: number;
    description: string;
    sourcedFrom: string[];
}

export interface SynthesisOutput {
    teamVerdict: 'PROCEED' | 'PIVOT' | 'HALT';
    verdictConfidence: number;
    verdictRationale: string;
    executiveSummary: string;
    alignments: SynthesisAlignment[];
    tensions: SynthesisTension[];
    topRisks: SynthesisRisk[];
    recommendation: string;
    rolesAnalyzed: string[];
    generatedAt: string;
    numberReconciliation?: {
        [key: string]: {
            description?: string;
            values: Array<{ role: string; value: string | number; basis: string }>;
            conflict?: string;
            resolution?: string;
        };
    };
    feedback?: string; // User chat/questions about synthesis
}

export interface Blueprint {
    meta: BlueprintMeta;
    ideaOriginal: string;
    roles: {
        [roleId: string]: RoleOutput;
    };
    documentationConfig: {
        [roleId: string]: {
            text: boolean;
            charts: boolean;
            excel: boolean;
            flowDiagrams: boolean;
            swimlanes: boolean;
            c4: boolean;
            architecture: boolean;
            otherFormats: string[];
        };
    };
    synthesis?: SynthesisOutput;
    synthesisStatus?: 'pending' | 'processing' | 'completed' | 'error';
}

export interface Project {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    ideaOriginal: string;
    language: 'en' | 'es';
    status: 'draft' | 'in_progress' | 'completed' | 'archived';
    blueprint: Blueprint;
}
