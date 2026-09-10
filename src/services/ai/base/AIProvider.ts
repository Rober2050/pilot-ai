import { AIProvider, ProviderStats, GenerationOptions } from '../../../types/ai';
import { AIProviderError, AIErrorCategory } from '../errors/AIErrors';

export abstract class BaseAIProvider implements AIProvider {
    abstract name: string;
    abstract providerId: string;

    protected stats: ProviderStats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
    };

    abstract generateJSON<T>(model: string, systemPrompt: string, userPrompt: string, options?: GenerationOptions): Promise<T>;
    abstract generateText(model: string, systemPrompt: string, userPrompt: string, options?: GenerationOptions): Promise<string>;
    abstract isAvailable(): Promise<boolean>;

    getUsageStats(): ProviderStats {
        return { ...this.stats };
    }

    protected recordSuccess() {
        this.stats.totalRequests++;
        this.stats.successfulRequests++;
    }

    protected recordFailure(error: any) {
        this.stats.totalRequests++;
        this.stats.failedRequests++;
        this.stats.lastError = error.message || 'Unknown error';
        this.stats.lastErrorTime = new Date().toISOString();
    }

    protected async retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delayMs: number = 1000
    ): Promise<T> {
        let lastError: any;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;

                // Don't retry on auth errors or structurally invalid JSON (not truncation)
                if (error instanceof AIProviderError &&
                    (error.category === AIErrorCategory.AUTHENTICATION ||
                        error.category === AIErrorCategory.INVALID_RESPONSE)) {
                    throw error;
                }
                // TRUNCATED_RESPONSE is retryable — fall through to backoff + retry

                // Wait before retrying (exponential backoff)
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
                }
            }
        }

        throw lastError;
    }
}
