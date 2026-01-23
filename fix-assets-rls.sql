-- ============================================================
-- FIX: RLS-Policies für Assets (Multi-Tenant)
-- ============================================================

-- Alte Policies löschen
DROP POLICY IF EXISTS "members read org assets" ON public.assets;
DROP POLICY IF EXISTS "org admins manage assets" ON public.assets;
DROP POLICY IF EXISTS "service full access assets" ON public.assets;

-- NEUE Policies (einfach, ohne Rekursion)

-- 1. User können Assets ihrer Organisation sehen
CREATE POLICY "users_read_org_assets"
  ON public.assets
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = assets.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- 2. User können Assets ihrer Organisation erstellen/aktualisieren/löschen
-- (Alle Mitglieder, nicht nur Admins - kann später eingeschränkt werden)
CREATE POLICY "users_manage_org_assets"
  ON public.assets
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = assets.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = assets.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- 3. Service Role hat vollen Zugriff
CREATE POLICY "service_role_full_access_assets"
  ON public.assets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
