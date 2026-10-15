import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Browser origins allowed to call this function. Local dev is always allowed.
 * Add your production domain(s) with:
 *   supabase secrets set ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-domain.com
 */
const ALLOWED_ORIGINS = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(Deno.env.get('ALLOWED_ORIGINS') ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
]);

/** Models the client is allowed to request. Anything else is rejected. */
const ALLOWED_MODELS = new Set([
    'claude-haiku-4-5-20251001',
]);

/**
 * Hard ceiling per single request. Must stay >= the client's MAX_TOKENS
 * (src/services/ai/providers/AnthropicProvider.ts) or long roles get truncated
 * and the provider throws on stop_reason === 'max_tokens'.
 */
const MAX_TOKENS_CAP = 64_000;

/**
 * Hard ceilings per user per calendar day (UTC).
 * One full 9-role project run charges at most 9 x 64k = 576k tokens, so this
 * allows roughly 3 complete runs per user per day.
 */
const DAILY_REQUEST_LIMIT = 120;
const DAILY_TOKEN_LIMIT = 2_000_000;

/**
 * Per-plan MONTHLY token budget (UTC calendar month). This is the server-side
 * cost ceiling that backs the client-side freemium funnel: the UI still shows
 * its "2 analyses" paywall (that stays a UX/business decision), but THESE
 * numbers are what actually bound spend — so bypassing the UI and hitting the
 * proxy directly cannot run up the bill.
 *
 * Sized ABOVE the most a legit free user can reach through the UI (2 analyses +
 * 1 feedback bonus ≈ 3 role runs ≈ ~210k tokens worst case), so normal users
 * NEVER hit this — only abuse does. Admins bypass entirely. Tune freely.
 */
const PLAN_MONTHLY_TOKEN_BUDGET: Record<string, number> = {
    free: 500_000,          // ~7 max-size analyses; a legit free user uses ~3
    pro: 20_000_000,
    enterprise: 100_000_000,
};
/** Unknown/unmapped plan is treated as free (most restrictive). */
const DEFAULT_MONTHLY_TOKEN_BUDGET = PLAN_MONTHLY_TOKEN_BUDGET.free;

/**
 * Reject oversized prompts before they reach Anthropic.
 *
 * MAX_TOTAL_INPUT_CHARS is the important one: input tokens are billed too, so
 * per-message caps alone would let someone run up the bill from the input side
 * (20 messages x 200k chars is ~1M input tokens per request). The total is what
 * bounds cost; the per-field caps just fail fast with a clearer message.
 */
const MAX_SYSTEM_CHARS = 200_000;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 200_000;
const MAX_TOOLS_BYTES = 50_000;
const MAX_TOTAL_INPUT_CHARS = 400_000;

/** Rough chars-per-token ratio, used only to charge input against the quota. */
const CHARS_PER_TOKEN = 4;

/**
 * Attachments (images and PDFs) travel as base64 content blocks. They are
 * bounded separately from text because base64 length says little about tokens:
 * an image costs ~1.6k tokens whatever its size, a PDF ~2-3k per page.
 * We charge a conservative flat estimate so attachments cannot bypass the quota.
 */
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const ALLOWED_DOCUMENT_TYPES = new Set(['application/pdf']);
const MAX_MEDIA_BLOCKS = 5;
const MAX_MEDIA_BASE64_CHARS = 8_000_000; // ~6 MB of binary across all attachments
const IMAGE_CHARGE_TOKENS = 2_000;
/** PDFs: ~3k tokens per estimated page, assuming ~100 KB of binary per page. */
const PDF_CHARGE_TOKENS_PER_PAGE = 3_000;
const PDF_BYTES_PER_PAGE = 100_000;

// --- CORS -------------------------------------------------------------------

function corsHeaders(origin: string | null): Record<string, string> {
    // Echo the origin only when it is one of ours. An unknown origin gets no
    // ACAO header at all, so the browser blocks the response.
    const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : '';
    return {
        ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {}),
        'Vary': 'Origin',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '3600',
    };
}

serve(async (req: Request) => {
    const origin = req.headers.get('Origin');
    const CORS = corsHeaders(origin);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS });
    }

    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405, CORS);
    }

    try {
        // --- 1. Authenticate the caller -------------------------------------
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return json({ error: 'Missing authorization header' }, 401, CORS);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabase = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } },
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return json({ error: 'Unauthorized' }, 401, CORS);
        }

        // An unconfirmed mailbox is trivially disposable — don't grant credit to it.
        if (!user.email_confirmed_at) {
            return json({ error: 'Email not confirmed' }, 403, CORS);
        }

        // --- 2. Validate and REBUILD the request body -----------------------
        // We never forward the client's object. Everything sent upstream is
        // constructed here from fields we explicitly accept.
        let body: any;
        try {
            body = await req.json();
        } catch {
            return json({ error: 'Invalid JSON body' }, 400, CORS);
        }

        // Health check: proves the caller is authenticated and the function is up,
        // without reaching Anthropic — so it never costs tokens.
        if (body?.healthcheck === true) {
            return json({
                ok: true,
                models: [...ALLOWED_MODELS],
                anthropicKeyConfigured: Boolean(Deno.env.get('ANTHROPIC_API_KEY')),
            }, 200, CORS);
        }

        const model = String(body?.model ?? '');
        if (!ALLOWED_MODELS.has(model)) {
            return json({ error: `Model not allowed: ${model || '(none)'}` }, 400, CORS);
        }

        const requestedTokens = Number(body?.max_tokens);
        if (!Number.isFinite(requestedTokens) || requestedTokens <= 0) {
            return json({ error: 'max_tokens must be a positive number' }, 400, CORS);
        }
        const maxTokens = Math.min(Math.floor(requestedTokens), MAX_TOKENS_CAP);

        const system = typeof body?.system === 'string' ? body.system : '';
        if (system.length > MAX_SYSTEM_CHARS) {
            return json({ error: 'System prompt too large' }, 413, CORS);
        }

        if (!Array.isArray(body?.messages) || body.messages.length === 0) {
            return json({ error: 'messages must be a non-empty array' }, 400, CORS);
        }
        if (body.messages.length > MAX_MESSAGES) {
            return json({ error: 'Too many messages' }, 413, CORS);
        }

        // Content is either a string, or (user turns only) an array of text /
        // image / document blocks. Every block is rebuilt from validated fields.
        const messages: Array<{ role: string; content: string | Record<string, unknown>[] }> = [];
        let textChars = 0;
        let mediaBlocks = 0;
        let mediaBase64Chars = 0;
        let mediaChargeTokens = 0;
        for (const m of body.messages) {
            const role = m?.role;
            const content = m?.content;
            if (role !== 'user' && role !== 'assistant') {
                return json({ error: `Invalid message role: ${role}` }, 400, CORS);
            }
            if (typeof content === 'string') {
                if (content.length > MAX_MESSAGE_CHARS) {
                    return json({ error: 'Message too large' }, 413, CORS);
                }
                textChars += content.length;
                messages.push({ role, content });
                continue;
            }
            if (role !== 'user' || !Array.isArray(content) || content.length === 0) {
                return json({ error: 'Message content must be a string (or blocks on a user turn)' }, 400, CORS);
            }
            const blocks: Record<string, unknown>[] = [];
            for (const b of content) {
                if (b?.type === 'text' && typeof b.text === 'string') {
                    if (b.text.length > MAX_MESSAGE_CHARS) {
                        return json({ error: 'Message too large' }, 413, CORS);
                    }
                    textChars += b.text.length;
                    blocks.push({ type: 'text', text: b.text });
                } else if ((b?.type === 'image' || b?.type === 'document') && b?.source?.type === 'base64') {
                    const mediaType = String(b.source.media_type ?? '');
                    const data = b.source.data;
                    const allowed = b.type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
                    if (!allowed.has(mediaType) || typeof data !== 'string' || data.length === 0) {
                        return json({ error: `Unsupported attachment: ${b.type} ${mediaType || '(none)'}` }, 400, CORS);
                    }
                    mediaBlocks++;
                    mediaBase64Chars += data.length;
                    if (mediaBlocks > MAX_MEDIA_BLOCKS || mediaBase64Chars > MAX_MEDIA_BASE64_CHARS) {
                        return json({ error: 'Attachments too large' }, 413, CORS);
                    }
                    if (b.type === 'image') {
                        mediaChargeTokens += IMAGE_CHARGE_TOKENS;
                    } else {
                        const pages = Math.max(1, Math.ceil((data.length * 0.75) / PDF_BYTES_PER_PAGE));
                        mediaChargeTokens += pages * PDF_CHARGE_TOKENS_PER_PAGE;
                    }
                    blocks.push({ type: b.type, source: { type: 'base64', media_type: mediaType, data } });
                } else {
                    return json({ error: `Invalid content block: ${b?.type ?? '(none)'}` }, 400, CORS);
                }
            }
            messages.push({ role, content: blocks });
        }

        const useStream = body?.stream === true;

        const upstreamBody: Record<string, unknown> = {
            model,
            max_tokens: maxTokens,
            messages,
            ...(system ? { system } : {}),
            ...(useStream ? { stream: true } : {}),
        };

        // Tools are passed through but size-bounded — they are part of the prompt.
        if (body?.tools !== undefined) {
            if (!Array.isArray(body.tools)) {
                return json({ error: 'tools must be an array' }, 400, CORS);
            }
            if (JSON.stringify(body.tools).length > MAX_TOOLS_BYTES) {
                return json({ error: 'tools payload too large' }, 413, CORS);
            }
            upstreamBody.tools = body.tools;
            if (body?.tool_choice !== undefined) {
                upstreamBody.tool_choice = body.tool_choice;
            }
        }

        // Total input size decides what we charge for the prompt side.
        const totalInputChars =
            system.length +
            textChars +
            (upstreamBody.tools ? JSON.stringify(upstreamBody.tools).length : 0);

        if (totalInputChars > MAX_TOTAL_INPUT_CHARS) {
            return json({ error: 'Request payload too large' }, 413, CORS);
        }

        const estimatedInputTokens = Math.ceil(totalInputChars / CHARS_PER_TOKEN);
        const chargedTokens = maxTokens + estimatedInputTokens + mediaChargeTokens;

        // --- 3. Enforce quotas (daily safety cap + monthly plan budget) -----
        // Uses the service_role key so the ledger stays unreadable and
        // unwritable from the client under RLS.
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!serviceKey) {
            // Fail CLOSED. A missing key must never silently disable the quota.
            console.error('[anthropic-proxy] SUPABASE_SERVICE_ROLE_KEY missing — refusing request');
            return json({ error: 'Server misconfigured' }, 500, CORS);
        }

        const admin = createClient(supabaseUrl, serviceKey);

        // Caller's role + plan. Admins (platform owners) bypass every cap so
        // they can test freely; everyone else is metered. maybeSingle() so a
        // missing profile row degrades to the most restrictive plan, not a 500.
        const { data: profile, error: profileError } = await admin
            .from('users')
            .select('rol, plan_id, subscription_plan')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) {
            console.error('[anthropic-proxy] plan lookup failed:', profileError.message);
            return json({ error: 'Server misconfigured' }, 500, CORS);
        }

        const isAdmin = profile?.rol === 'admin';

        if (!isAdmin) {
            // 3a. Daily safety cap (per user, all plans) — bounds a single day.
            const { data: usage, error: usageError } = await admin
                .rpc('proxy_usage_today', { p_user_id: user.id })
                .single();

            if (usageError) {
                console.error('[anthropic-proxy] daily quota lookup failed:', usageError.message);
                return json({ error: 'Server misconfigured' }, 500, CORS);
            }

            const usedRequests = Number((usage as any)?.request_count ?? 0);
            const usedTokens = Number((usage as any)?.token_count ?? 0);

            if (usedRequests >= DAILY_REQUEST_LIMIT || usedTokens + chargedTokens > DAILY_TOKEN_LIMIT) {
                console.warn(`[anthropic-proxy] daily cap hit user=${user.id} reqs=${usedRequests} tokens=${usedTokens}`);
                return json({ error: 'Daily usage limit reached. Try again tomorrow.' }, 429, CORS);
            }

            // 3b. Monthly plan budget — the un-bypassable cost ceiling behind the
            // freemium funnel. Normal users hit the UI paywall long before this;
            // only someone calling the proxy directly ever reaches it.
            const plan = String(profile?.plan_id ?? profile?.subscription_plan ?? 'free');
            const monthlyBudget = PLAN_MONTHLY_TOKEN_BUDGET[plan] ?? DEFAULT_MONTHLY_TOKEN_BUDGET;

            const now = new Date();
            const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
            const { data: monthRows, error: monthError } = await admin
                .from('proxy_usage')
                .select('charged_tokens')
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth);

            if (monthError) {
                console.error('[anthropic-proxy] monthly usage lookup failed:', monthError.message);
                return json({ error: 'Server misconfigured' }, 500, CORS);
            }

            const monthUsed = (monthRows ?? []).reduce(
                (sum: number, r: any) => sum + Number(r.charged_tokens ?? 0), 0);

            if (monthUsed + chargedTokens > monthlyBudget) {
                console.warn(`[anthropic-proxy] monthly budget hit user=${user.id} plan=${plan} used=${monthUsed} budget=${monthlyBudget}`);
                return json({ error: 'Monthly usage limit reached for your plan.' }, 429, CORS);
            }
        }

        // Charge worst-case BEFORE forwarding. Aborting the stream must not
        // refund the budget, otherwise the ceiling is bypassable. Admins are
        // ledgered too (for visibility) but were never checked above.
        const { error: ledgerError } = await admin
            .from('proxy_usage')
            .insert({ user_id: user.id, model, charged_tokens: chargedTokens });

        if (ledgerError) {
            console.error('[anthropic-proxy] ledger write failed:', ledgerError.message);
            return json({ error: 'Server misconfigured' }, 500, CORS);
        }

        // --- 4. Forward to Anthropic ----------------------------------------
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
        if (!anthropicKey) {
            return json({ error: 'Anthropic API key not configured on server' }, 500, CORS);
        }

        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(upstreamBody),
        });

        // 4a. STREAMING MODE — pipe SSE directly to client.
        if (useStream && upstream.body) {
            return new Response(upstream.body, {
                status: upstream.status,
                headers: {
                    ...CORS,
                    'content-type': 'text/event-stream',
                    'cache-control': 'no-cache',
                    'connection': 'keep-alive',
                    'x-accel-buffering': 'no',
                },
            });
        }

        // 4b. BUFFERED MODE — legacy path for short prompts.
        const data = await upstream.json();
        return json(data, upstream.status, CORS);

    } catch (err: any) {
        // Never leak internals to the client; the detail goes to the logs.
        console.error('[anthropic-proxy] error:', err);
        return json({ error: 'Internal server error' }, 500, CORS);
    }
});

function json(data: unknown, status = 200, cors: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...cors, 'content-type': 'application/json' },
    });
}
