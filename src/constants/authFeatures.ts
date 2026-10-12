/**
 * Optional auth providers.
 *
 * Google sign-in is rendered ONLY when the Supabase project actually has the
 * Google provider turned on (Dashboard -> Authentication -> Providers -> Google).
 * If the button is shown without that, Supabase answers
 *   {"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
 * and the visitor lands on a raw JSON page.
 *
 * Defaults to OFF so a fresh install never renders a dead button. Turn it on by
 * adding this to .env.local (and to the host's env vars) once the provider is
 * configured:
 *
 *   VITE_ENABLE_GOOGLE_AUTH=true
 */
export const GOOGLE_AUTH_ENABLED =
    import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';

/**
 * Public self sign-up.
 *
 * OFF by default: the hosted demo runs on the owner's AI budget, so new
 * accounts come only through invitation links (/login?email=...). Self-hosted
 * installs pay their own AI bill and can open it with:
 *
 *   VITE_ENABLE_PUBLIC_SIGNUP=true
 *
 * This only hides the UI. To fully block sign-ups also turn off
 * "Allow new users to sign up" in Supabase (Authentication -> Sign In / Providers).
 */
export const PUBLIC_SIGNUP_ENABLED =
    import.meta.env.VITE_ENABLE_PUBLIC_SIGNUP === 'true';
