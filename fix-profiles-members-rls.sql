-- ============================================================
-- FIX: RLS-Policies für profiles und organization_members
-- ============================================================
-- Dieses Script behebt:
-- 1. Admins können Profile für andere User erstellen
-- 2. Alle Mitglieder einer Organisation werden angezeigt
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- ============================================================

DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_read_org_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_insert_org_profiles" ON public.profiles;
DROP POLICY IF EXISTS "service_role_full_access_profiles" ON public.profiles;

-- User können ihr eigenes Profil sehen
CREATE POLICY "users_read_own_profile"
  ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR id = auth.uid()
  );

-- User können Profile aller Mitglieder ihrer Organisation sehen
CREATE POLICY "users_read_org_profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = profiles.id
        AND om1.is_active = true
        AND om2.is_active = true
    )
  );

-- User können ihr eigenes Profil erstellen
CREATE POLICY "users_insert_own_profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR id = auth.uid()
  );

-- Admins können Profile für User in ihrer Organisation erstellen
CREATE POLICY "admins_insert_org_profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.is_active = true
        AND EXISTS (
          SELECT 1
          FROM public.organization_members om2
          WHERE om2.organization_id = om.organization_id
            AND om2.user_id = profiles.id
        )
    )
  );

-- Service Role hat vollen Zugriff
CREATE POLICY "service_role_full_access_profiles"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 2. ORGANIZATION_MEMBERS
-- ============================================================

DROP POLICY IF EXISTS "users_read_own_memberships" ON public.organization_members;
DROP POLICY IF EXISTS "users_read_org_members" ON public.organization_members;
DROP POLICY IF EXISTS "admins_insert_org_members" ON public.organization_members;
DROP POLICY IF EXISTS "admins_update_org_members" ON public.organization_members;
DROP POLICY IF EXISTS "admins_delete_org_members" ON public.organization_members;
DROP POLICY IF EXISTS "service_role_full_access_members" ON public.organization_members;

-- User können ihre eigenen Memberships sehen (für Login)
CREATE POLICY "users_read_own_memberships"
  ON public.organization_members
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR user_id = auth.uid()
  );

-- User können alle Mitglieder ihrer Organisation sehen
CREATE POLICY "users_read_org_members"
  ON public.organization_members
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- Admins können neue Memberships in ihrer Organisation erstellen
CREATE POLICY "admins_insert_org_members"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.is_active = true
    )
  );

-- Admins können Memberships in ihrer Organisation aktualisieren
CREATE POLICY "admins_update_org_members"
  ON public.organization_members
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.is_active = true
    )
  );

-- Admins können Memberships in ihrer Organisation löschen (soft delete)
CREATE POLICY "admins_delete_org_members"
  ON public.organization_members
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.is_active = true
    )
  );

-- Service Role hat vollen Zugriff
CREATE POLICY "service_role_full_access_members"
  ON public.organization_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
