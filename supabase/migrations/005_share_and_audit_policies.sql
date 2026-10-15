-- ============================================================
-- 005 — Share links and audit log policies
-- ============================================================
-- 1. shared_blueprints had RLS enabled with only a SELECT policy, so the
--    "Share" button could never insert a snapshot (0 rows in production).
--    Snapshots now record their creator, and only an authenticated user can
--    create one, as themselves. Reading stays public (that is the point of a
--    share link); only the creator may delete it.
-- 2. audit_logs accepted any row from any signed-in user, including rows
--    attributed to someone else. Inserts are now pinned to the caller; the
--    only anonymous rows allowed are system logs. Admins can read all logs
--    (the admin console's log viewer needs it); users keep reading their own.
-- ============================================================

-- Helper: is the caller an admin? SECURITY DEFINER so policies can consult
-- public.users without granting clients read access to other users' rows.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ------------------------------------------------------------
-- shared_blueprints
-- ------------------------------------------------------------
ALTER TABLE public.shared_blueprints
  ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid()
  REFERENCES auth.users (id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "shared_blueprints_insert_own" ON public.shared_blueprints;
CREATE POLICY "shared_blueprints_insert_own" ON public.shared_blueprints
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "shared_blueprints_delete_own" ON public.shared_blueprints;
CREATE POLICY "shared_blueprints_delete_own" ON public.shared_blueprints
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_insert_auth" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    OR (user_id IS NULL AND type = 'system_log')
  );

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());
