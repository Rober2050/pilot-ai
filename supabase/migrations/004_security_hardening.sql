-- ============================================================================
-- 004_security_hardening.sql — Close privilege-escalation paths on public.users
--
-- WHY: 001_schema.sql let an authenticated user UPDATE any column of their own
-- row (no WITH CHECK), and the signup trigger copied `rol` from the client-
-- supplied auth metadata. Either path let a free user grant themselves
-- rol = 'admin' or an enterprise plan straight from the browser console:
--     supabase.from('users').update({ rol: 'admin' }).eq('id', myId)
--
-- WHAT: role / plan / subscription columns become server-owned. The signup
-- trigger now writes them (including the 3-day trial window) instead of the
-- client. Users can still edit their own profile fields. Promotions are done
-- with promote_to_admin() from the SQL editor or with the service_role key.
--
-- Safe to re-run.
-- ============================================================================

-- 1. Signup trigger: server owns role, plan and the trial window --------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, display_name,
    rol, plan_id, subscription_plan, subscription_status,
    subscription_start_date, subscription_end_date, status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user',            -- never from client metadata
    'free',
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '3 days',   -- trial window, previously set by the client
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Helper: are the protected columns unchanged? ----------------------------
-- Compares the proposed row against the stored row. SECURITY DEFINER so it can
-- read the current row regardless of RLS.
CREATE OR REPLACE FUNCTION public.users_protected_columns_unchanged(
  p_id                     uuid,
  p_rol                    text,
  p_plan_id                text,
  p_subscription_plan      text,
  p_subscription_status    text,
  p_subscription_start     timestamptz,
  p_subscription_end       timestamptz
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = p_id
      AND u.rol                     IS NOT DISTINCT FROM p_rol
      AND u.plan_id                 IS NOT DISTINCT FROM p_plan_id
      AND u.subscription_plan       IS NOT DISTINCT FROM p_subscription_plan
      AND u.subscription_status     IS NOT DISTINCT FROM p_subscription_status
      AND u.subscription_start_date IS NOT DISTINCT FROM p_subscription_start
      AND u.subscription_end_date   IS NOT DISTINCT FROM p_subscription_end
  );
$$;

REVOKE ALL ON FUNCTION public.users_protected_columns_unchanged(uuid, text, text, text, text, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.users_protected_columns_unchanged(uuid, text, text, text, text, timestamptz, timestamptz) TO authenticated;

-- 3. UPDATE policy: own row only, and protected columns must not change ------
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.users_protected_columns_unchanged(
      id, rol, plan_id, subscription_plan, subscription_status,
      subscription_start_date, subscription_end_date
    )
  );

-- 4. INSERT policy: a client may only create a plain free user ---------------
-- Normal signups go through the trigger above; this covers the client-side
-- upsert fallback in authService.register.
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND COALESCE(rol, 'user') = 'user'
    AND COALESCE(plan_id, 'free') = 'free'
    AND COALESCE(subscription_plan, 'free') = 'free'
  );

-- 5. Admin helper: promote a user by email (SQL editor / service_role only) ---
--    SELECT public.promote_to_admin('you@example.com');
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.users SET rol = 'admin' WHERE email = p_email;
$$;
REVOKE ALL ON FUNCTION public.promote_to_admin(text) FROM PUBLIC;
-- No GRANT to `authenticated`: only service_role / the SQL editor may call it.

-- 6. Same for plan changes ---------------------------------------------------
--    SELECT public.set_user_plan('you@example.com', 'pro', NOW() + INTERVAL '1 year');
CREATE OR REPLACE FUNCTION public.set_user_plan(
  p_email text,
  p_plan  text,
  p_until timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.users
     SET plan_id               = p_plan,
         subscription_plan     = p_plan,
         subscription_status   = 'active',
         subscription_end_date = p_until
   WHERE email = p_email;
$$;
REVOKE ALL ON FUNCTION public.set_user_plan(text, text, timestamptz) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- NOTE FOR EXISTING DEPLOYMENTS
-- After this runs, authService.register()'s post-signup UPDATE (which sends
-- rol/plan/subscription columns) is rejected by the new policy. That is
-- expected and harmless: the trigger already wrote those values, and the
-- client logs a warning it already handles. Two behaviours do change:
--   * emergency-admin self-promotion at signup no longer works -> use
--     promote_to_admin()
--   * invitations that granted a paid plan now land on 'free' -> use
--     set_user_plan()
-- ---------------------------------------------------------------------------
