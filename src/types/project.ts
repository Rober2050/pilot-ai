export interface Resource {
    id: number;
    role: string;
    seniority: string;
    count: number;
    rate: number;
}

export interface TechItem {
    name: string;
    reason: string;
    iconName: string;
    color: string;
}

export interface TechStack {
    architecture: TechItem;
    frontend: TechItem;
    backend: TechItem;
    database: TechItem;
    infrastructure: TechItem;
}

export interface Risk {
    prob: number;
    impact: number;
    desc: string;
}

export interface Task {
    name: string;
    role: string;
    days: number;
    critical: boolean;
    dependency?: string;
    risk: Risk;
}

export interface Phase {
    id: string;
    name: string;
    duration: number;
    startWeek: number;
    tasks: Task[];
}

// ── Agile / Scrum types (Fase 2 — AI-generated data) ──────────────────────────
export interface AgileUserStory {
    id: string;
    title: string;
    estimate: number; // hours
    priority: 'high' | 'medium' | 'low';
    acceptanceCriteria: string[];
}

export interface AgileSprint {
    number: number;
    weekStart: number;
    weekEnd: number;
    goal: string;
    userStories: AgileUserStory[];
}

export interface AgileData {
    teamVelocity: number; // hours per sprint
    sprints: AgileSprint[];
}
