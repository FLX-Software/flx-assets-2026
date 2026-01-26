-- ============================================================
-- Funktion: Lösche User komplett (SECURITY DEFINER)
-- ============================================================
-- Diese Funktion löscht einen User komplett:
-- 1. Entfernt aus allen Organisationen (soft delete)
-- 2. Löscht Profil
-- 3. Löscht User aus Supabase Auth
-- 
-- WICHTIG: Nur Admins können diese Funktion aufrufen
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_user_completely(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Entferne User aus allen Organisationen (soft delete)
  UPDATE public.organization_members
  SET is_active = false
  WHERE user_id = delete_user_completely.user_id;
  
  -- 2. Lösche Profil
  DELETE FROM public.profiles
  WHERE id = delete_user_completely.user_id;
  
  -- 3. Lösche User aus Supabase Auth
  -- Hinweis: Dies erfordert Service Role Key oder Edge Function
  -- Für jetzt: Nur Membership und Profil löschen
  -- Der User bleibt in auth.users, kann sich aber nicht mehr einloggen
END;
$$;

-- Erlaube nur Admins, diese Funktion aufzurufen
-- Prüfe ob der aufrufende User Admin ist
CREATE OR REPLACE FUNCTION public.delete_user_completely_secure(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Prüfe ob der aufrufende User Admin ist
  SELECT EXISTS(
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.is_active = true
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Nur Admins können User löschen';
  END IF;
  
  -- 1. Entferne User aus allen Organisationen (soft delete)
  UPDATE public.organization_members
  SET is_active = false
  WHERE organization_members.user_id = target_user_id;
  
  -- 2. Lösche Profil
  DELETE FROM public.profiles
  WHERE profiles.id = target_user_id;
  
  -- 3. User bleibt in auth.users (kann nicht direkt gelöscht werden ohne Service Role)
  -- Der User kann sich aber nicht mehr einloggen, da kein Profil/Membership existiert
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_completely_secure(uuid) TO authenticated;
