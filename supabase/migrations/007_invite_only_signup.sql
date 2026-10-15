-- ============================================================
-- 007 — Invitation-only sign-up, enforced by the database
-- ============================================================
-- Hiding the register button is not enough: anyone can call Supabase Auth's
-- sign-up endpoint directly. Turning off "Allow new users to sign up" in the
-- dashboard is not an option either, because invited users create their own
-- account through that same endpoint (authService.register → auth.signUp).
--
-- So the gate lives in Postgres: a BEFORE INSERT trigger on auth.users rejects
-- any new account whose email is not in public.invitations — but only while
-- the `invite_only_signup` flag in system_config is enabled. The flag ships
-- DISABLED so a fresh self-hosted install can create its first account; the
-- showcase at pilot-ai-app.com turns it on.
--
-- It also gives public.invitations the policies it never had: RLS was on with
-- zero policies, so the admin console could not create invitations at all.
-- ============================================================

-- ------------------------------------------------------------
-- Invitations: admins manage them; an invitee may read their own
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "invitations_admin_all" ON public.invitations;
CREATE POLICY "invitations_admin_all" ON public.invitations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "invitations_select_own" ON public.invitations;
CREATE POLICY "invitations_select_own" ON public.invitations
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- ------------------------------------------------------------
-- The switch (off by default for self-hosted installs)
-- ------------------------------------------------------------
INSERT INTO public.system_config (id, is_enabled, settings)
VALUES (
  'invite_only_signup',
  false,
  '{"note": "When enabled, only emails present in public.invitations can sign up (trigger on auth.users)."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- The gate
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_invite_only_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
       SELECT 1 FROM public.system_config
       WHERE id = 'invite_only_signup' AND is_enabled
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.invitations
       WHERE lower(email) = lower(coalesce(NEW.email, ''))
     )
  THEN
    RAISE EXCEPTION 'Sign-up is by invitation only'
      USING ERRCODE = 'P0001', HINT = 'Ask an administrator for an invitation.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_invite_only_signup() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_invite_only_signup ON auth.users;
CREATE TRIGGER enforce_invite_only_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_invite_only_signup();
