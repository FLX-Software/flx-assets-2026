-- ============================================================
-- KOMPLETTE RLS-POLICY-FIXES für Multi-Tenant
-- ============================================================

-- ============================================================
-- 1. ASSETS
-- ============================================================

DROP POLICY IF EXISTS "members read org assets" ON public.assets;
DROP POLICY IF EXISTS "org admins manage assets" ON public.assets;
DROP POLICY IF EXISTS "service full access assets" ON public.assets;
DROP POLICY IF EXISTS "users_read_org_assets" ON public.assets;
DROP POLICY IF EXISTS "users_manage_org_assets" ON public.assets;
DROP POLICY IF EXISTS "service_role_full_access_assets" ON public.assets;

-- User können Assets ihrer Organisation sehen
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

-- User können Assets ihrer Organisation erstellen/aktualisieren/löschen
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

-- Service Role hat vollen Zugriff
CREATE POLICY "service_role_full_access_assets"
  ON public.assets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 2. LOANS
-- ============================================================

DROP POLICY IF EXISTS "members read org loans" ON public.loans;
DROP POLICY IF EXISTS "members insert org loans" ON public.loans;
DROP POLICY IF EXISTS "org admins update loans" ON public.loans;
DROP POLICY IF EXISTS "org admins delete loans" ON public.loans;
DROP POLICY IF EXISTS "service full access loans" ON public.loans;

-- User können Loans ihrer Organisation sehen
CREATE POLICY "users_read_org_loans"
  ON public.loans
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = loans.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- User können Loans ihrer Organisation erstellen
CREATE POLICY "users_insert_org_loans"
  ON public.loans
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = loans.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- User können Loans ihrer Organisation aktualisieren
CREATE POLICY "users_update_org_loans"
  ON public.loans
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = loans.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- User können Loans ihrer Organisation löschen
CREATE POLICY "users_delete_org_loans"
  ON public.loans
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = loans.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- Service Role hat vollen Zugriff
CREATE POLICY "service_role_full_access_loans"
  ON public.loans
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 3. MAINTENANCE_EVENTS
-- ============================================================

DROP POLICY IF EXISTS "members read org maintenance" ON public.maintenance_events;
DROP POLICY IF EXISTS "org admins manage maintenance" ON public.maintenance_events;
DROP POLICY IF EXISTS "service full access maintenance" ON public.maintenance_events;

-- User können Maintenance-Events ihrer Organisation sehen
CREATE POLICY "users_read_org_maintenance"
  ON public.maintenance_events
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = maintenance_events.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- User können Maintenance-Events ihrer Organisation erstellen/aktualisieren/löschen
CREATE POLICY "users_manage_org_maintenance"
  ON public.maintenance_events
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = maintenance_events.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = maintenance_events.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- Service Role hat vollen Zugriff
CREATE POLICY "service_role_full_access_maintenance"
  ON public.maintenance_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
