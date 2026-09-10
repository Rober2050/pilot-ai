import { AIProvider } from "../../types/ai";
import { GeminiProvider } from "./providers/GeminiProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { aiModelsService } from "../firebase/aiModelsService";

export class AIProviderFactory {
    private static instance: AIProviderFactory;
    private providers: Map<string, AIProvider>;

    private constructor() {
        this.providers = new Map();
        this.registerProvider(new GeminiProvider());
        this.registerProvider(new OpenAIProvider());
        this.registerProvider(new AnthropicProvider());
    }

    public static getInstance(): AIProviderFactory {
        if (!AIProviderFactory.instance) {
            AIProviderFactory.instance = new AIProviderFactory();
        }
        return AIProviderFactory.instance;
    }

    private registerProvider(provider: AIProvider) {
        this.providers.set(provider.providerId, provider);
    }

    public getProvider(providerId: string): AIProvider {
        const provider = this.providers.get(providerId);
        if (!provider) {
            return this.providers.get('anthropic') ?? this.providers.get('google')!;
        }
        return provider;
    }

    public async getProviderForModel(modelName: string): Promise<AIProvider> {
        try {
            // 1. Try to find model in active configuration
            const activeModels = await aiModelsService.getActiveModels();
            const modelConfig = activeModels.find(m => m.modelName === modelName);

            if (modelConfig) {
                const p = this.getProvider(modelConfig.provider);
                if (await p.isAvailable()) return p;
            }

            // 2. Heuristic based on model name prefix
            let candidate: AIProvider;
            if (modelName.startsWith('gpt')) candidate = this.getProvider('openai');
            else if (modelName.startsWith('claude')) candidate = this.getProvider('anthropic');
            else candidate = this.getProvider('google'); // gemini-*

            if (await candidate.isAvailable()) return candidate;

            // 3. Availability waterfall: Anthropic → Google → OpenAI
            const anthropic = this.getProvider('anthropic');
            if (await anthropic.isAvailable()) return anthropic;

            return candidate;
        } catch (error) {
            console.error("Error resolving provider for model:", error);
            return this.getProvider('anthropic') ?? this.getProvider('google');
        }
    }

    public getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }
}
