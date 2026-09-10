export interface SkillParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
    required: boolean;
    default?: any;
}

export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    category: 'search' | 'data' | 'calculation' | 'analysis';
    parameters: SkillParameter[];
    execute: (params: Record<string, any>) => Promise<SkillResult>;
}

export interface SkillResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        executionTime: number;
        tokensUsed?: number;
        source?: string;
    };
}

export interface SkillExecution {
    skillId: string;
    timestamp: number;
    agentId: string;
    params: Record<string, any>;
    result: SkillResult;
}
