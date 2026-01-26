-- ============================================================
-- Super-Admin RLS-Policies und Funktionen
-- ============================================================
-- Diese Policies ermöglichen es Super-Admins:
-- 1. Alle Organisationen zu sehen und zu verwalten
-- 2. In jeder Organisation Admin-Rechte zu haben
-- 3. Neue Organisationen zu erstellen
-- ============================================================

-- Funktion: Prüft ob User Super-Admin ist
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = is_super_admin.user_id
      AND om.role = 'super_admin'
      AND om.is_active = true
  );
END;
$$;

-- Funktion: Prüft ob aktueller User Super-Admin ist
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN public.is_super_admin(auth.uid());
END;
$$;

-- ============================================================
-- ORGANIZATIONS Policies
-- ============================================================

-- Super-Admin kann alle Organisationen sehen
CREATE POLICY "super_admin_read_all_organizations"
  ON public.organizations
  FOR SELECT
  USING (public.is_current_user_super_admin());

-- Super-Admin kann Organisationen erstellen
CREATE POLICY "super_admin_create_organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (public.is_current_user_super_admin());

-- Super-Admin kann Organisationen bearbeiten
CREATE POLICY "super_admin_update_organizations"
  ON public.organizations
  FOR UPDATE
  USING (public.is_current_user_super_admin())
  WITH CHECK (public.is_current_user_super_admin());

-- Super-Admin kann Organisationen deaktivieren (soft delete)
CREATE POLICY "super_admin_delete_organizations"
  ON public.organizations
  FOR UPDATE
  USING (public.is_current_user_super_admin())
  WITH CHECK (public.is_current_user_super_admin());

-- ============================================================
-- ORGANIZATION_MEMBERS Policies (erweitert)
-- ============================================================

-- Super-Admin kann alle Memberships sehen
CREATE POLICY "super_admin_read_all_memberships"
  ON public.organization_members
  FOR SELECT
  USING (public.is_current_user_super_admin());

-- Super-Admin kann Memberships in jeder Organisation erstellen
CREATE POLICY "super_admin_create_memberships"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (public.is_current_user_super_admin());

-- Super-Admin kann Memberships in jeder Organisation aktualisieren
CREATE POLICY "super_admin_update_memberships"
  ON public.organization_members
  FOR UPDATE
  USING (public.is_current_user_super_admin())
  WITH CHECK (public.is_current_user_super_admin());

-- ============================================================
-- ASSETS Policies (erweitert)
-- ============================================================

-- Super-Admin kann Assets in jeder Organisation sehen
-- WICHTIG: Diese Policy wird zusätzlich zu bestehenden Policies angewendet (OR-Logik)
CREATE POLICY "super_admin_read_all_assets"
  ON public.assets
  FOR SELECT
  USING (public.is_current_user_super_admin());

-- Super-Admin kann Assets in jeder Organisation erstellen
CREATE POLICY "super_admin_create_assets"
  ON public.assets
  FOR INSERT
  WITH CHECK (public.is_current_user_super_admin());

-- Super-Admin kann Assets in jeder Organisation aktualisieren
CREATE POLICY "super_admin_update_assets"
  ON public.assets
  FOR UPDATE
  USING (public.is_current_user_super_admin())
  WITH CHECK (public.is_current_user_super_admin());

-- Super-Admin kann Assets in jeder Organisation löschen
CREATE POLICY "super_admin_delete_assets"
  ON public.assets
  FOR DELETE
  USING (public.is_current_user_super_admin());

-- ============================================================
-- LOANS Policies (erweitert)
-- ============================================================

-- Super-Admin kann Loans in jeder Organisation sehen
CREATE POLICY "super_admin_read_all_loans"
  ON public.loans
  FOR SELECT
  USING (public.is_current_user_super_admin());

-- Super-Admin kann Loans in jeder Organisation erstellen
CREATE POLICY "super_admin_create_loans"
  ON public.loans
  FOR INSERT
  WITH CHECK (public.is_current_user_super_admin());

-- ============================================================
-- MAINTENANCE_EVENTS Policies (erweitert)
-- ============================================================

-- Super-Admin kann Maintenance-Events in jeder Organisation sehen
CREATE POLICY "super_admin_read_all_maintenance"
  ON public.maintenance_events
  FOR SELECT
  USING (public.is_current_user_super_admin());

-- Super-Admin kann Maintenance-Events in jeder Organisation erstellen
CREATE POLICY "super_admin_create_maintenance"
  ON public.maintenance_events
  FOR INSERT
  WITH CHECK (public.is_current_user_super_admin());

-- ============================================================
-- GRANTS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_super_admin() TO authenticated;
