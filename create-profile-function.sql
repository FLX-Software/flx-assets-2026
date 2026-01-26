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
  INSERT INTO public.profiles (id, full_name)
  VALUES (user_id, full_name)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
END;
$$;

-- Erlaube Admins, diese Funktion aufzurufen
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text) TO authenticated;
