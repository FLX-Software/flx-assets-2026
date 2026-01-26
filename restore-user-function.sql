-- ============================================================
-- Funktion: Stelle User wieder her (falls in auth.users vorhanden)
-- ============================================================
-- Diese Funktion prüft, ob ein User bereits in auth.users existiert,
-- aber kein Profil/Membership hat. Falls ja, wird er wiederhergestellt.
-- 
-- Wird verwendet, wenn ein User gelöscht wurde, aber noch in auth.users existiert.
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_user_if_exists(
  user_email text,
  full_name text,
  organization_id uuid,
  user_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_user_id uuid;
  profile_exists boolean;
  membership_exists boolean;
BEGIN
  -- Prüfe ob User in auth.users existiert
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  -- Wenn User nicht existiert, gib NULL zurück (signUp kann fortfahren)
  IF existing_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Prüfe ob Profil existiert
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = existing_user_id
  ) INTO profile_exists;
  
  -- Prüfe ob aktive Membership existiert
  SELECT EXISTS(
    SELECT 1 
    FROM public.organization_members 
    WHERE user_id = existing_user_id 
      AND organization_id = restore_user_if_exists.organization_id
      AND is_active = true
  ) INTO membership_exists;
  
  -- Wenn Profil und Membership existieren, User ist bereits vollständig
  IF profile_exists AND membership_exists THEN
    RAISE EXCEPTION 'User mit E-Mail % existiert bereits und ist aktiv', user_email;
  END IF;
  
  -- Stelle Profil wieder her (falls nicht vorhanden)
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (id, full_name)
    VALUES (existing_user_id, full_name)
    ON CONFLICT (id) DO UPDATE SET full_name = full_name;
  END IF;
  
  -- Stelle Membership wieder her (falls nicht vorhanden oder inaktiv)
  INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
  VALUES (organization_id, existing_user_id, user_role, true)
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET is_active = true, role = user_role;
  
  -- Gib User-ID zurück (signUp kann übersprungen werden)
  RETURN existing_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_user_if_exists(text, text, uuid, text) TO authenticated;
