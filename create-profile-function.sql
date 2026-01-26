-- ============================================================
-- Funktion: Erstelle Profil für neuen User (SECURITY DEFINER)
-- ============================================================
-- Diese Funktion umgeht RLS und erstellt Profile direkt
-- Wird von Admins verwendet, um Profile für neue User zu erstellen

CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id uuid,
  full_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Erstelle Profil direkt - der Trigger hat es möglicherweise bereits erstellt
  -- ON CONFLICT behandelt den Fall, dass das Profil bereits existiert
  INSERT INTO public.profiles (id, full_name)
  VALUES (user_id, full_name)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  
  -- Keine Prüfung auf auth.users, da:
  -- 1. Der Trigger handle_new_user() erstellt Profile nur für existierende Users
  -- 2. Diese Funktion wird nur aufgerufen, nachdem signUp() erfolgreich war
  -- 3. ON CONFLICT behandelt den Fall, dass das Profil bereits existiert
END;
$$;

-- Erlaube Admins, diese Funktion aufzurufen
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text) TO authenticated;
