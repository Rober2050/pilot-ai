/**
 * Config Service — migrado de Firestore a Supabase.
 *
 * Maneja:
 *  - Provider config (ProviderConfig) → tabla `system_config` con id `provider_<id>`
 *  - Synthesis Agent config → tabla `system_config` con id `synthesis_agent`
 *
 * IMPORTANTE: las API keys de proveedores NO viven en la BD ni en variables
 * VITE_* (ambas terminan visibles en el navegador). La única key, de Anthropic,
 * es un secreto de la Edge Function anthropic-proxy.
 */

import { supabase } from './firebaseClient';

export interface ProviderConfig {
    apiKey: string;
    isEnabled: boolean;
    organizationId?: string;
}

export interface SynthesisAgentConfig {
    model: string;
    temperature: number;
    systemPrompt: string;
}

const DEFAULT_SYNTHESIS_CONFIG: SynthesisAgentConfig = {
    model: 'claude-haiku-4-5-20251001',
    temperature: 0.4,
    systemPrompt: '',
};

const TABLE = 'system_config';

export const configService = {
    getProviderConfig: async (providerId: string): Promise<ProviderConfig | null> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', `provider_${providerId}`)
            .maybeSingle();
        if (error || !data) return null;

        const settings = data.settings || {};
        return {
            // Importante: api keys ya NO se guardan en BD por seguridad
            apiKey: '',
            isEnabled: Boolean(data.is_enabled),
            organizationId: settings.organizationId ?? undefined,
        };
    },

    setProviderConfig: async (providerId: string, config: ProviderConfig): Promise<void> => {
        // Solo guardamos isEnabled y organizationId. NUNCA apiKey en BD.
        const { error } = await supabase
            .from(TABLE)
            .upsert(
                {
                    id: `provider_${providerId}`,
                    is_enabled: config.isEnabled,
                    settings: {
                        organizationId: config.organizationId,
                        note: `API key managed via environment variable VITE_${providerId.toUpperCase()}_API_KEY`,
                    },
                },
                { onConflict: 'id' },
            );
        if (error) throw error;
    },

    getSynthesisConfig: async (): Promise<SynthesisAgentConfig> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', 'synthesis_agent')
            .maybeSingle();
        if (error || !data) return DEFAULT_SYNTHESIS_CONFIG;
        const settings = data.settings || {};
        return {
            model: settings.model ?? DEFAULT_SYNTHESIS_CONFIG.model,
            temperature:
                typeof settings.temperature === 'number'
                    ? settings.temperature
                    : DEFAULT_SYNTHESIS_CONFIG.temperature,
            systemPrompt: settings.systemPrompt ?? DEFAULT_SYNTHESIS_CONFIG.systemPrompt,
        };
    },

    setSynthesisConfig: async (config: SynthesisAgentConfig): Promise<void> => {
        const { error } = await supabase.from(TABLE).upsert(
            {
                id: 'synthesis_agent',
                is_enabled: true,
                settings: {
                    model: config.model,
                    temperature: config.temperature,
                    systemPrompt: config.systemPrompt,
                },
            },
            { onConflict: 'id' },
        );
        if (error) throw error;
    },
};
