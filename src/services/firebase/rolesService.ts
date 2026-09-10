/**
 * Roles Service — migrado de Firestore a Supabase.
 *
 * Mapea filas de `public.ai_roles` (snake_case) a RoleConfig (camelCase).
 */

import { supabase } from './firebaseClient';
import { RoleConfig } from '../../types/roles';

const TABLE = 'ai_roles';

const rowToRole = (row: any): RoleConfig => ({
    roleId: row.id,
    displayName: row.display_name,
    description: row.description ?? '',
    systemPrompt: row.system_prompt ?? '',
    model: row.model_id ?? 'claude-haiku-4-5-20251001',
    aiModel: row.model_id ?? undefined,
    temperature: Number(row.temperature ?? 0.7),
    orderIndex: Number(row.order_index ?? 999),
    isEnabled: Boolean(row.is_enabled),
    grounding: Boolean(row.grounding ?? false),
    gender: row.gender ?? undefined,
    imageUrl: row.image_url ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    version: row.version ?? 1,
    changelog: row.changelog ?? undefined,
    docConfig: row.doc_config || {
        text: true,
        charts: false,
        excel: false,
        flowDiagrams: false,
        swimlanes: false,
        c4: false,
        architecture: false,
        pdf: false,
        ppt: false,
        json: false,
        markdown: false,
        otherFormats: [],
    },
});

const roleToRow = (role: Partial<RoleConfig>): Record<string, any> => {
    const row: Record<string, any> = {};
    if (role.roleId !== undefined) row.id = role.roleId;
    if (role.displayName !== undefined) row.display_name = role.displayName;
    if (role.description !== undefined) row.description = role.description;
    if (role.systemPrompt !== undefined) row.system_prompt = role.systemPrompt;
    if (role.model !== undefined) row.model_id = role.model;
    if (role.aiModel !== undefined) row.model_id = role.aiModel;
    if (role.temperature !== undefined) row.temperature = role.temperature;
    if (role.orderIndex !== undefined) row.order_index = role.orderIndex;
    if (role.isEnabled !== undefined) row.is_enabled = role.isEnabled;
    if (role.grounding !== undefined) row.grounding = role.grounding;
    if (role.gender !== undefined) row.gender = role.gender;
    if (role.imageUrl !== undefined) row.image_url = role.imageUrl;
    if (role.updatedAt !== undefined) row.updated_at = role.updatedAt;
    if (role.updatedBy !== undefined) row.updated_by = role.updatedBy;
    if (role.version !== undefined) row.version = role.version;
    if (role.changelog !== undefined) row.changelog = role.changelog;
    if (role.docConfig !== undefined) row.doc_config = role.docConfig;
    return row;
};

export const rolesService = {
    getActiveRoles: async (): Promise<RoleConfig[]> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('is_enabled', true)
            .order('order_index', { ascending: true });
        if (error) {
            console.error('Error fetching active roles:', error);
            return [];
        }
        return (data || []).map(rowToRole);
    },

    getAllRoles: async (): Promise<RoleConfig[]> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .order('order_index', { ascending: true });
        if (error) {
            console.error('Error fetching all roles:', error);
            return [];
        }
        return (data || []).map(rowToRole);
    },

    getRoleById: async (roleId: string): Promise<RoleConfig | null> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', roleId)
            .maybeSingle();
        if (error) {
            console.error(`Error fetching role ${roleId}:`, error);
            return null;
        }
        return data ? rowToRole(data) : null;
    },

    updateRoleConfig: async (roleId: string, partialUpdate: Partial<RoleConfig>) => {
        // Get current role to increment version
        const { data: current, error: selectError } = await supabase
            .from(TABLE)
            .select('version')
            .eq('id', roleId)
            .maybeSingle();

        if (selectError) {
            console.error('[rolesService] Error fetching current version:', selectError);
            throw selectError;
        }

        const currentVersion = current?.version ?? 0;

        const row = roleToRow({
            ...partialUpdate,
            updatedAt: new Date().toISOString(),
            version: currentVersion + 1,
        });

        console.log('[rolesService] Upserting role:', { id: roleId, ...row });

        // Upsert in case role doesn't exist yet
        const { error } = await supabase
            .from(TABLE)
            .upsert({ id: roleId, ...row }, { onConflict: 'id' });

        if (error) {
            console.error('[rolesService] Upsert error:', error);
            throw new Error(`Failed to update role: ${error.message}`);
        }
    },

    deleteRole: async (roleId: string) => {
        const { error } = await supabase.from(TABLE).delete().eq('id', roleId);
        if (error) throw error;
    },

    clearAllRoles: async () => {
        const { error } = await supabase.from(TABLE).delete().neq('id', '__never_match__');
        if (error) throw error;
    },

    exportRolesToJSON: async (): Promise<string> => {
        const roles = await rolesService.getAllRoles();
        return JSON.stringify(roles, null, 2);
    },

    importRolesFromJSON: async (
        jsonString: string,
    ): Promise<{ imported: number; errors: string[] }> => {
        const errors: string[] = [];
        let imported = 0;
        try {
            const roles = JSON.parse(jsonString) as RoleConfig[];
            for (const role of roles) {
                try {
                    await rolesService.updateRoleConfig(role.roleId, role);
                    imported++;
                } catch (error: any) {
                    errors.push(`Error importing ${role.roleId}: ${error.message}`);
                }
            }
        } catch (error: any) {
            errors.push(`JSON Parse Error: ${error.message}`);
        }
        return { imported, errors };
    },
};
