-- ============================================================
-- 009 — Explicit Data API grants for every table
-- ============================================================
-- From 2026-10-30 Supabase no longer grants the anon / authenticated /
-- service_role roles access to new tables in "public" automatically. Tables
-- that already exist keep their grants, so the production project is not
-- affected — but migrations 001 and 002 create every table WITHOUT a grant,
-- so a fresh install (a self-hosted copy of the repo, `supabase db reset`, a
-- preview branch) would answer "permission denied" on every request.
--
-- These grants are the access layer; Row Level Security still decides which
-- rows each caller can see or change. They are additive, so running this on a
-- project that already has the old automatic grants changes nothing.
--
-- RULE for future migrations: every CREATE TABLE in "public" ships with its
-- GRANT statements in the same migration.
-- ============================================================

-- Public configuration and share links: readable without signing in
-- (landing page, /pitch/:id). RLS limits writes to admins / owners.
GRANT SELECT ON
  public.ai_models,
  public.ai_roles,
  public.subscription_plans,
  public.system_config,
  public.war_room_styles,
  public.shared_blueprints
TO anon;

-- Signed-in users: full CRUD at the grant level; RLS policies decide per row.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.ai_models,
  public.ai_roles,
  public.subscription_plans,
  public.system_config,
  public.war_room_styles,
  public.shared_blueprints,
  public.users,
  public.projects,
  public.invitations,
  public.registration_requests,
  public.waitlist,
  public.audit_logs
TO authenticated;

-- Server side (Edge Functions with the service_role key): everything,
-- including the usage ledger, which the browser never touches.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.ai_models,
  public.ai_roles,
  public.subscription_plans,
  public.system_config,
  public.war_room_styles,
  public.shared_blueprints,
  public.users,
  public.projects,
  public.invitations,
  public.registration_requests,
  public.waitlist,
  public.audit_logs,
  public.proxy_usage
TO service_role;

-- proxy_usage.id is a bigserial: inserting needs the sequence too.
GRANT USAGE, SELECT ON SEQUENCE public.proxy_usage_id_seq TO service_role;
