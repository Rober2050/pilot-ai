/**
 * War Room Styles Service — migrado de Firestore a Supabase.
 * Mapea filas de `public.war_room_styles` a WarRoomStyle.
 */

import { supabase } from './firebaseClient';
import { WarRoomStyle } from '../../types/prompt-composer';

const TABLE = 'war_room_styles';

const rowToStyle = (row: any): WarRoomStyle => ({
    id: row.id,
    mode: row.mode,
    name: row.name,
    nameEn: row.name_en,
    modifier: row.modifier,
    modifierEn: row.modifier_en,
    icon: row.icon ?? '',
    isEnabled: Boolean(row.is_enabled),
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
});

const styleToRow = (style: Partial<WarRoomStyle>): Record<string, any> => {
    const row: Record<string, any> = {};
    if (style.id !== undefined) row.id = style.id;
    if (style.mode !== undefined) row.mode = style.mode;
    if (style.name !== undefined) row.name = style.name;
    if (style.nameEn !== undefined) row.name_en = style.nameEn;
    if (style.modifier !== undefined) row.modifier = style.modifier;
    if (style.modifierEn !== undefined) row.modifier_en = style.modifierEn;
    if (style.icon !== undefined) row.icon = style.icon;
    if (style.isEnabled !== undefined) row.is_enabled = style.isEnabled;
    return row;
};

export const warRoomStylesService = {
    async getAllStyles(): Promise<WarRoomStyle[]> {
        const { data, error } = await supabase.from(TABLE).select('*');
        if (error) {
            console.error('Error fetching War Room styles:', error);
            return [];
        }
        return (data || []).map(rowToStyle);
    },

    async getStyleById(id: string): Promise<WarRoomStyle | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) return null;
        return data ? rowToStyle(data) : null;
    },

    async getEnabledStyles(): Promise<WarRoomStyle[]> {
        const { data, error } = await supabase.from(TABLE).select('*').eq('is_enabled', true);
        if (error) return [];
        return (data || []).map(rowToStyle);
    },

    async createStyle(
        style: Omit<WarRoomStyle, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<void> {
        const id = style.mode;
        const row = { id, ...styleToRow(style) };
        const { error } = await supabase.from(TABLE).insert(row);
        if (error) throw error;
    },

    async updateStyle(id: string, updates: Partial<WarRoomStyle>): Promise<void> {
        const row = styleToRow(updates);
        const { error } = await supabase.from(TABLE).update(row).eq('id', id);
        if (error) throw error;
    },

    async deleteStyle(id: string): Promise<void> {
        const { error } = await supabase.from(TABLE).delete().eq('id', id);
        if (error) throw error;
    },

    async seedInitialStyles(): Promise<void> {
        // No-op: el seed SQL ya inserta los estilos por defecto.
    },
};
