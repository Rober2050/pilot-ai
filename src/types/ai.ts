export interface GenerationOptions {
    tools?: any[];
    // Generic media attachments (images, audio, etc.)
    media?: {
        mimeType: string;
        data: string; // Base64
    }[];
}

export interface AIProvider {
    name: string;
    providerId: string;
    generateJSON<T>(model: string, systemPrompt: string, userPrompt: string, options?: GenerationOptions): Promise<T>;
    generateText(model: string, systemPrompt: string, userPrompt: string, options?: GenerationOptions): Promise<string>;
    isAvailable(): Promise<boolean>;
    getUsageStats(): ProviderStats;
}

export interface ProviderStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastError?: string;
    lastErrorTime?: string;
}

export interface ExecutionConfig {
    modelId: string;
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    fallbackEnabled?: boolean;
}

export type AIProviderType = 'google' | 'openai' | 'anthropic' | 'other';

export interface AIModelConfig {
    id: string;
    modelName: string;
    displayName: string;
    provider: AIProviderType;
    isActive: boolean;
    description?: string;
    contextWindow?: number;
    costPer1kTokens?: number;
}
