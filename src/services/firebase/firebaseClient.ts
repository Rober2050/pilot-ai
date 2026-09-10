/**
 * Supabase Client
 *
 * NOTA: El nombre del archivo (`firebaseClient.ts`) se mantiene por compatibilidad
 * con los imports existentes. El contenido fue migrado de Firebase a Supabase.
 *
 * Exporta:
 *  - `supabase`: cliente principal (queries y auth)
 *  - `db`: alias de `supabase` para compatibilidad con código legacy
 *  - `auth`: wrapper liviano expone `auth.currentUser` (síncrono) basado en
 *            la sesión cacheada de Supabase. Migración progresiva.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Sanitiza una variable de entorno de URL.
 *
 * Por qué existe: si `VITE_SUPABASE_URL` se guarda en el panel de deploy con un
 * espacio, salto de línea o barra final (un copiar/pegar descuidado), la URL
 * resultante — p.ej. `https://xxx.supabase.co /functions/...` — se codifica como
 * `...supabase.co%20/...`, un dominio inexistente. El navegador falla con
 * `ERR_NAME_NOT_RESOLVED` y toda llamada al proxy se cuelga.
 *
 * `.trim()` elimina espacios/saltos invisibles; el replace quita barras finales.
 * Una URL correcta no cambia, así que esto no puede romper nada.
 */
function sanitizeUrl(raw: string | undefined): string {
    return (raw ?? '').trim().replace(/\/+$/, '');
}

/** URL base de Supabase, ya limpia. Única fuente para todo el proyecto. */
export const SUPABASE_URL = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

let supabase: SupabaseClient;

try {
    if (!SUPABASE_URL || !supabaseAnonKey) {
        throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
    }
    supabase = createClient(SUPABASE_URL, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
    console.log('Supabase initialized successfully');
} catch (error) {
    console.error('Supabase initialization failed:', error);
    supabase = {} as SupabaseClient;
}

/**
 * Wrapper de compatibilidad para código que usaba `auth.currentUser` (Firebase).
 *
 * En Firebase, `auth.currentUser` era síncrono. En Supabase, la sesión es
 * asíncrona vía `supabase.auth.getSession()`. Para minimizar cambios en
 * componentes legacy, exponemos un getter que lee la sesión cacheada que
 * Supabase mantiene en localStorage.
 */
export const auth = {
    get currentUser() {
        try {
            // Supabase JS SDK v2 guarda la sesión en localStorage bajo `sb-<project-ref>-auth-token`
            // Formato SDK v2: { user: {...}, access_token: "...", ... }
            const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
            if (keys.length === 0) return null;
            const raw = localStorage.getItem(keys[0]);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            const user = parsed?.user;
            return user ? mapSupabaseUser(user) : null;
        } catch {
            return null;
        }
    },
    signOut: () => supabase.auth.signOut(),
};

/**
 * Mapea un Supabase User a la forma esperada por código legacy de Firebase
 * (uid, email, displayName, photoURL).
 */
function mapSupabaseUser(user: any) {
    return {
        uid: user.id,
        email: user.email,
        displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
        photoURL: user.user_metadata?.avatar_url || user.user_metadata?.photoURL || null,
    };
}

export { supabase };
export const db = supabase; // alias legacy
export default supabase;
