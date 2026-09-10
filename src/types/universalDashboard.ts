export interface DashboardKPI {
    id?: string;
    label: string;
    value: string | number;
    icon?: string; // Lucide icon name
    color?: 'slate' | 'blue' | 'emerald' | 'indigo' | 'purple' | 'amber' | 'rose' | 'sky';
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

export interface DashboardTab {
    id: string;
    label: string;
    type: 'tech-stack' | 'schema-visualizer' | 'key-value-grid' | 'markdown' | 'diagram' | 'custom' | 'table' | 'charts' | 'interactive-questions' | 'user-stories' | 'requirements' | 'business-rules' | 'matrix' | 'c4-diagram' | 'business-model-canvas' | 'market-analysis' | 'adrs' | 'quality-attributes' | 'tech-radar' | 'hidden';
    data: any;
    icon?: string;
    description?: string;
}

export interface UniversalDashboardSchema {
    summary: string;
    kpis: DashboardKPI[];
    tabs: DashboardTab[];
    meta?: {
        version: string;
        generatedAt: string;
    };
}
