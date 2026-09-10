import OpenAI from 'openai';
import { BaseAIProvider } from "../base/AIProvider";
import { AIAuthenticationError, AIInvalidResponseError, AIRateLimitError, AITimeoutError } from "../errors/AIErrors";
import { loggingService } from "../../firebase/loggingService";
import { configService } from "../../firebase/configService";
import { GenerationOptions } from '../../../types/ai';

export class OpenAIProvider extends BaseAIProvider {
    name = 'OpenAI';
    providerId = 'openai';
    private openai: OpenAI | null = null;

    constructor() {
        super();
        this.initialize();
    }

    private async initialize() {
        const apiKey = await configService.getAPIKey(this.providerId);
        if (apiKey) {
            this.openai = new OpenAI({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true // Client-side usage
            });
        }
    }

    async isAvailable(): Promise<boolean> {
        return !!this.openai;
    }

    async generateText(modelName: string, systemPrompt: string, userPrompt: string, options?: GenerationOptions): Promise<string> {
        if (!this.openai) throw new AIAuthenticationError(this.providerId, 'OpenAI API key not configured');

        return this.retryOperation(async () => {
            try {
                const completion = await this.openai!.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    model: modelName,
                });

                const text = completion.choices[0]?.message?.content || '';
                this.recordSuccess();
                return text;
            } catch (error: any) {
                this.handleError(error, modelName);
                throw error;
            }
        });
    }

    async generateJSON<T>(modelName: string, systemPrompt: string, userPrompt: string, options?: GenerationOptions): Promise<T> {
        if (!this.openai) throw new AIAuthenticationError(this.providerId, 'OpenAI API key not configured');

        // OpenAI REQUIRES the word "JSON" in the prompt when using response_format: { type: "json_object" }
        const safeSystemPrompt = systemPrompt.toLowerCase().includes('json')
            ? systemPrompt
            : `${systemPrompt}\n\nIMPORTANT: Please respond in valid JSON format.`;

        return this.retryOperation(async () => {
            try {
                const completion = await this.openai!.chat.completions.create({
                    messages: [
                        { role: "system", content: safeSystemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    model: modelName,
                    response_format: { type: "json_object" }
                });

                const text = completion.choices[0]?.message?.content || '{}';

                try {
                    const parsed = JSON.parse(text);
                    this.recordSuccess();
                    return parsed;
                } catch (parseError) {
                    throw new AIInvalidResponseError(this.providerId, 'Failed to parse JSON response', parseError);
                }
            } catch (error: any) {
                // Auto-fix for invalid model ID (400)
                if (error?.status === 400 && (error?.error?.code === 'model_not_found' || error?.message?.includes('model'))) {
                    console.warn(`Invalid model '${modelName}' detected. Retrying with fallback model 'gpt-3.5-turbo'...`);

                    // Retry with a safe fallback model
                    const fallbackCompletion = await this.openai!.chat.completions.create({
                        messages: [
                            { role: "system", content: safeSystemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        model: 'gpt-3.5-turbo', // Safe fallback
                        response_format: { type: "json_object" }
                    });

                    const content = fallbackCompletion.choices[0].message.content || '{}';
                    return JSON.parse(content) as T;
                }

                this.handleError(error, modelName);
                throw error;
            }
        });
    }

    private handleError(error: any, modelName: string) {
        this.recordFailure(error);

        // Map OpenAI errors
        if (error instanceof OpenAI.APIError) {
            if (error.status === 429) {
                throw new AIRateLimitError(this.providerId, error);
            }
            if (error.status === 401) {
                throw new AIAuthenticationError(this.providerId, error);
            }
            if (error.status === 408) {
                throw new AITimeoutError(this.providerId, error);
            }
        }

        // Log to Firebase
        loggingService.logError('OpenAIProvider', `Generation failed with model ${modelName}`, {
            error: error.message,
            stack: error.stack
        });
    }
}
