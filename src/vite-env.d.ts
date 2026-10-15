/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_ENABLE_PUBLIC_SIGNUP?: string;
    readonly VITE_ENABLE_GOOGLE_AUTH?: string;
    readonly VITE_EMERGENCY_ADMINS?: string;
    // AI provider keys never go here: they are Supabase Edge Function secrets.
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
