/**
 * AI Models Service — migrado de Firestore a Supabase.
 * Mapea filas de `public.ai_models` a la interfaz AIModel.
 */

import { supabase } from './firebaseClient';

export interface AIModel {
    id: string;
    modelName: string;
    displayName: string;
    provider: 'google' | 'openai' | 'anthropic' | 'other';
    isActive: boolean;
    description?: string;
    maxTokens?: number;
    costPer1kTokens?: number;
    createdAt?: string;
    updatedAt?: string;
}

const TABLE = 'ai_models';

const rowToModel = (row: any): AIModel => ({
    id: row.id,
    modelName: row.model_name,
    displayName: row.display_name,
    provider: row.provider,
    isActive: Boolean(row.is_active),
    description: row.description ?? undefined,
    maxTokens: row.max_tokens ?? undefined,
    costPer1kTokens: row.cost_per_1k_tokens ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
});

const modelToRow = (model: Partial<AIModel>): Record<string, any> => {
    const row: Record<string, any> = {};
    if (model.id !== undefined) row.id = model.id;
    if (model.modelName !== undefined) row.model_name = model.modelName;
    if (model.displayName !== undefined) row.display_name = model.displayName;
    if (model.provider !== undefined) row.provider = model.provider;
    if (model.isActive !== undefined) row.is_active = model.isActive;
    if (model.description !== undefined) row.description = model.description;
    if (model.maxTokens !== undefined) row.max_tokens = model.maxTokens;
    if (model.costPer1kTokens !== undefined) row.cost_per_1k_tokens = model.costPer1kTokens;
    return row;
};

export const aiModelsService = {
    getAllModels: async (): Promise<AIModel[]> => {
        const { data, error } = await supabase.from(TABLE).select('*');
        if (error) {
            console.error('Error fetching AI models:', error);
            return [];
        }
        return (data || []).map(rowToModel);
    },

    getActiveModels: async (): Promise<AIModel[]> => {
        const { data, error } = await supabase.from(TABLE).select('*').eq('is_active', true);
        if (error) {
            console.error('Error fetching active AI models:', error);
            return [];
        }
        return (data || []).map(rowToModel);
    },

    getModelById: async (id: string): Promise<AIModel | null> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) return null;
        return data ? rowToModel(data) : null;
    },

    createModel: async (model: Omit<AIModel, 'createdAt' | 'updatedAt'>): Promise<void> => {
        const { error } = await supabase.from(TABLE).insert(modelToRow(model));
        if (error) throw error;
    },

    updateModel: async (id: string, updates: Partial<AIModel>): Promise<void> => {
        const { error } = await supabase
            .from(TABLE)
            .upsert({ id, ...modelToRow(updates) }, { onConflict: 'id' });
        if (error) throw error;
    },

    deleteModel: async (id: string): Promise<void> => {
        const { error } = await supabase.from(TABLE).delete().eq('id', id);
        if (error) throw error;
    },

    toggleModelStatus: async (id: string, isActive: boolean): Promise<void> => {
        await aiModelsService.updateModel(id, { isActive });
    },

    initializeDefaultModels: async (): Promise<void> => {
        // No-op: el seed SQL ya inserta los modelos por defecto.
    },
};
