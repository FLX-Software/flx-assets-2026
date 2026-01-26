-- ============================================================
-- TRIGGER: Automatisches Profil-Erstellen bei neuen Auth-Users
-- ============================================================
-- Dieser Trigger erstellt automatisch ein Profil in der profiles-Tabelle,
-- wenn ein neuer User in auth.users erstellt wird.

-- Funktion, die beim Erstellen eines neuen Auth-Users aufgerufen wird
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger, der die Funktion aufruft
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ZUSÄTZLICH: Erstelle Profile für bestehende Auth-Users ohne Profil
-- ============================================================
-- Führe das aus, um fehlende Profile für bereits existierende Users zu erstellen
INSERT INTO public.profiles (id, full_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
