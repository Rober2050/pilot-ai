/**
 * Logging Service — migrado de Firestore (`system_logs`) a Supabase (`audit_logs`).
 *
 * Mantiene la interfaz pública (logError, logInfo, getLogs, clearLogs) intacta.
 * Mapea LogEntry a la columna `audit_logs.type='system_log'` con detalles en JSONB.
 */

import { supabase } from './firebaseClient';

export interface LogEntry {
    id?: string;
    timestamp: string; // ISO string (audit_logs.created_at); no longer a Firestore Timestamp
    level: 'info' | 'warning' | 'error';
    source: string;
    message: string;
    details?: any;
    userId?: string;
}

const TABLE = 'audit_logs';

const safeSerialize = (details: any): any => {
    if (details === undefined || details === null) return null;
    try {
        return JSON.parse(JSON.stringify(details));
    } catch {
        return { error: 'serialization_failed', raw: String(details) };
    }
};

const insertLog = async (
    level: 'info' | 'warning' | 'error',
    source: string,
    message: string,
    details?: any,
    userId?: string,
) => {
    try {
        const { error } = await supabase.from(TABLE).insert({
            type: 'system_log',
            level,
            message,
            source,
            user_id: userId || null,
            details: safeSerialize(details),
        });
        if (error && !error.message?.toLowerCase().includes('permission')) {
            console.error('Failed to write to audit_logs:', error);
        }
    } catch (e: any) {
        if (!e?.message?.includes('permission')) {
            console.error('Failed to write to audit_logs:', e);
        }
    }
};

const rowToLog = (row: any): LogEntry => ({
    id: row.id,
    timestamp: row.created_at,
    level: row.level,
    source: row.source ?? 'unknown',
    message: row.message ?? '',
    details: row.details ?? null,
    userId: row.user_id ?? undefined,
});

export const loggingService = {
    logError: async (source: string, message: string, details?: any, userId?: string) => {
        await insertLog('error', source, message, details, userId);
        console.error(`[${source}] ${message}`, details);
    },

    logInfo: async (source: string, message: string, details?: any, userId?: string) => {
        await insertLog('info', source, message, details, userId);
        console.log(`[${source}] ${message}`, details);
    },

    getLogs: async (maxLogs: number = 50): Promise<LogEntry[]> => {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('type', 'system_log')
            .order('created_at', { ascending: false })
            .limit(maxLogs);
        if (error) {
            if (!error.message?.toLowerCase().includes('permission')) {
                console.error('Failed to fetch logs:', error);
            }
            return [];
        }
        return (data || []).map(rowToLog);
    },

    clearLogs: async () => {
        const { error } = await supabase.from(TABLE).delete().eq('type', 'system_log');
        if (error) console.error('Failed to clear logs:', error);
    },
};
