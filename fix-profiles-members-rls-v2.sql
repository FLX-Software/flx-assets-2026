-- ============================================================
-- FIX v2: RLS-Policies für profiles und organization_members
-- OHNE Rekursion!
-- ============================================================
-- Dieses Script behebt:
-- 1. Admins können Profile für andere User erstellen
-- 2. Alle Mitglieder einer Organisation werden angezeigt
-- 3. KEINE infinite recursion mehr!
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
-- WICHTIG: Keine Rekursion - verwendet SECURITY DEFINER Funktion
CREATE OR REPLACE FUNCTION public.check_same_organization(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = user1_id
      AND om2.user_id = user2_id
      AND om1.is_active = true
      AND om2.is_active = true
  );
END;
$$;

CREATE POLICY "users_read_org_profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR id = auth.uid() -- Eigenes Profil
    OR public.check_same_organization(auth.uid(), profiles.id) -- Gleiche Organisation
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
-- WICHTIG: Prüft nur ob der Admin Admin ist, nicht ob der Target-User bereits Mitglied ist
-- (da wir das Profil VOR der Membership erstellen)
CREATE POLICY "admins_insert_org_profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR id = auth.uid() -- Eigenes Profil
    OR EXISTS (
      -- Admin kann Profile erstellen, wenn er Admin in mindestens einer Organisation ist
      -- (Die Membership wird danach erstellt, daher keine Prüfung auf Target-User)
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.is_active = true
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
-- WICHTIG: Diese Policy muss zuerst kommen und einfach sein, um Rekursion zu vermeiden
CREATE POLICY "users_read_own_memberships"
  ON public.organization_members
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR user_id = auth.uid()
  );

-- User können alle Mitglieder ihrer Organisation sehen
-- WICHTIG: Verwendet self-join, aber nur auf derselben Tabelle, keine Rekursion
CREATE POLICY "users_read_org_members"
  ON public.organization_members
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR user_id = auth.uid() -- Eigene Membership (bereits durch users_read_own_memberships abgedeckt)
    OR EXISTS (
      -- Prüfe ob der aktuelle User Mitglied derselben Organisation ist
      SELECT 1
      FROM public.organization_members om_self
      WHERE om_self.organization_id = organization_members.organization_id
        AND om_self.user_id = auth.uid()
        AND om_self.is_active = true
    )
  );

-- Admins können neue Memberships in ihrer Organisation erstellen
CREATE POLICY "admins_insert_org_members"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR user_id = auth.uid() -- User kann sich selbst hinzufügen (für Sign-Up)
    OR EXISTS (
      -- Prüfe ob der aktuelle User Admin in der Organisation ist
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
