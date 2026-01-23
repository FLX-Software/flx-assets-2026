-- ============================================================
-- FIX: RLS-Policies für organization_members (Endlosschleife beheben)
-- ============================================================

-- Alte Policies löschen
DROP POLICY IF EXISTS "select own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "org admins manage members" ON public.organization_members;
DROP POLICY IF EXISTS "service full access members" ON public.organization_members;

-- NEUE Policies (ohne Endlosschleife)

-- 1. User kann seine eigenen Memberships sehen
CREATE POLICY "select own memberships"
  ON public.organization_members
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR user_id = auth.uid()
  );

-- 2. Admins können Memberships ihrer Organisation sehen/verwalten
-- WICHTIG: Direkte Prüfung ohne is_member_of_org() um Endlosschleife zu vermeiden
CREATE POLICY "org admins manage members"
  ON public.organization_members
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (
      -- Prüfe direkt ob User Admin in dieser Organisation ist (ohne rekursive Funktion)
      EXISTS (
        SELECT 1
        FROM public.organization_members om_check
        WHERE om_check.organization_id = organization_members.organization_id
          AND om_check.user_id = auth.uid()
          AND om_check.role = 'admin'
          AND om_check.is_active = true
      )
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      EXISTS (
        SELECT 1
        FROM public.organization_members om_check
        WHERE om_check.organization_id = organization_members.organization_id
          AND om_check.user_id = auth.uid()
          AND om_check.role = 'admin'
          AND om_check.is_active = true
      )
    )
  );

-- 3. Service Role hat vollen Zugriff
CREATE POLICY "service full access members"
  ON public.organization_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
