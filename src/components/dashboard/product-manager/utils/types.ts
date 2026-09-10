export interface KPI {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
}

export interface DiscoveryQuestion {
    id: string;
    question: string;
    context: string;
}

// --- Option C: PM Command Center Types ---

export interface RICEFeature {
    name: string;
    description?: string;
    reach: number;       // 1-10
    impact: number;      // 1-10
    confidence: number;  // 1-10
    effort: number;      // 1-10
    riceScore: number;   // Calculated: (reach * impact * confidence) / effort
    inMVP: boolean;      // In or Out of scope
}

export interface OKR {
    objective: string;
    keyResults: string[];
    timeline?: string;   // e.g. "Q1 2025"
}

export interface Assumption {
    hypothesis: string;
    risk: 'high' | 'medium' | 'low';
    validation: string;  // How to validate it
}

export interface ProductData {
    summary: any;
    kpis: KPI[];
    vision: string;
    targetAudience: any;
    keyFeatures: any[];
    discoveryQuestions: DiscoveryQuestion[];
    successMetrics: any[];
    charts: any[];
    roadmap: any[];
    prioritization: any[];
    competitors: any[];
    // --- New Option C fields ---
    positioningStatement: string;
    jtbd: string[];                // Jobs-to-be-Done
    riceFeatures: RICEFeature[];   // Features with RICE scoring
    mvpInScope: string[];          // What IS in the MVP
    mvpOutOfScope: string[];       // What is NOT in the MVP (and why)
    northStarMetric: string;
    okrs: OKR[];
    assumptions: Assumption[];
}

export interface ProductManagerDashboardProps {
    data: any;
    projectId?: string;
    roleId?: string;
    savedAnswers?: Record<string, string>;
    onConvertToMaster?: (node: any, subDiagram?: any) => void;
}
