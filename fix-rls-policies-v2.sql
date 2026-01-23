-- ============================================================
-- FIX v2: RLS-Policies komplett neu schreiben (KEINE Rekursion!)
-- ============================================================

-- ALLE alten Policies löschen
DROP POLICY IF EXISTS "select own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "org admins manage members" ON public.organization_members;
DROP POLICY IF EXISTS "service full access members" ON public.organization_members;

-- NEUE, EINFACHE Policies (ohne Rekursion)

-- 1. User kann seine eigenen Memberships sehen (für Login)
CREATE POLICY "users_see_own_memberships"
  ON public.organization_members
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR user_id = auth.uid()
  );

-- 2. Service Role hat vollen Zugriff
CREATE POLICY "service_role_full_access"
  ON public.organization_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- HINWEIS: Admin-Funktionen (andere Members verwalten) werden später über
-- eine separate Policy oder über Service Role (Backend) gehandhabt.
-- Für jetzt reicht es, dass User ihre eigenen Memberships sehen können.
