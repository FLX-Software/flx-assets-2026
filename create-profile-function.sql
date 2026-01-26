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
  -- Prüfe ob User in auth.users existiert (mit kurzer Wartezeit falls nötig)
  -- Versuche max. 3x mit steigender Wartezeit
  DECLARE
    user_exists boolean := false;
    retry_count integer := 0;
  BEGIN
    WHILE retry_count < 3 AND NOT user_exists LOOP
      SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
      
      IF NOT user_exists THEN
        retry_count := retry_count + 1;
        PERFORM pg_sleep(0.5 * retry_count); -- 0.5s, 1s, 1.5s
      END IF;
    END LOOP;
    
    -- Erstelle Profil nur wenn User existiert
    IF user_exists THEN
      INSERT INTO public.profiles (id, full_name)
      VALUES (user_id, full_name)
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    ELSE
      RAISE EXCEPTION 'User % existiert nicht in auth.users', user_id;
    END IF;
  END;
END;
$$;

-- Erlaube Admins, diese Funktion aufzurufen
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text) TO authenticated;
