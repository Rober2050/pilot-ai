-- ============================================================
-- 008 — Remove legacy provider data and align the free plan limit
-- ============================================================
-- Every role and the team synthesis run on Claude Haiku 4.5 through the
-- anthropic-proxy, which only allows that model. The Gemini, GPT-4o and
-- Claude 3.5 rows were already inactive and nothing references them
-- (no ai_roles row uses them), so they are removed instead of left as noise.
-- The provider_google / provider_openai switches in system_config are gone
-- for the same reason: there is no such provider in the code anymore.
--
-- Free plan: migration 003 seeded analysesPerMonth = 3 while its label (and
-- production) say 1 analysis per month. A fresh install now matches.
-- ============================================================

DELETE FROM public.ai_models
WHERE id <> 'claude-haiku-4-5-20251001'
  AND NOT EXISTS (SELECT 1 FROM public.ai_roles r WHERE r.model_id = ai_models.id);

DELETE FROM public.system_config
WHERE id IN ('provider_google', 'provider_openai');

UPDATE public.system_config
SET settings = '{"note": "API key is a Supabase Edge Function secret (ANTHROPIC_API_KEY) used by anthropic-proxy; it never goes in VITE_* variables."}'::jsonb
WHERE id = 'provider_anthropic';

UPDATE public.subscription_plans
SET limits = jsonb_set(limits, '{analysesPerMonth}', '1'::jsonb)
WHERE id = 'free';
