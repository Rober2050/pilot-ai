-- ============================================================================
-- 002_proxy_usage.sql — Spend guardrail for the Anthropic proxy
--
-- WHY: `anthropic-proxy` previously authorized any authenticated user with no
-- quota. Since public signup is open, anyone could register and burn unlimited
-- Anthropic credit. This table gives the Edge Function a per-user daily ledger
-- so it can refuse requests once a hard ceiling is reached.
--
-- Accounting is WORST-CASE: we charge `max_tokens` at request time rather than
-- actual output. That over-counts, but it makes the daily spend ceiling
-- provable and it cannot be bypassed by aborting the stream mid-flight.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proxy_usage (
    id              bigserial PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at      timestamptz NOT NULL DEFAULT now(),
    model           text NOT NULL,
    charged_tokens  integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS proxy_usage_user_day_idx
    ON public.proxy_usage (user_id, created_at DESC);

-- RLS on with ZERO policies: no anon/authenticated role can read or write this
-- table. Only the Edge Function's service_role key bypasses RLS.
ALTER TABLE public.proxy_usage ENABLE ROW LEVEL SECURITY;

-- Returns today's usage for one user. SECURITY DEFINER so the function can read
-- the table; callable only by service_role (see REVOKE below).
CREATE OR REPLACE FUNCTION public.proxy_usage_today(p_user_id uuid)
RETURNS TABLE (request_count bigint, token_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(count(*), 0)::bigint,
           COALESCE(sum(charged_tokens), 0)::bigint
    FROM public.proxy_usage
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('day', now());
$$;

REVOKE ALL ON FUNCTION public.proxy_usage_today(uuid) FROM PUBLIC, anon, authenticated;
