-- ============================================================
-- EINFACHE VERSION: Alles in einem Schritt
-- ============================================================
-- WICHTIG: Ersetze 'DEINE_USER_ID_HIER' mit der UUID aus auth.users!

-- Schritt 1: Finde deine user_id
-- Führe das aus und kopiere die UUID:
SELECT id, email FROM auth.users WHERE email = 'fabio.stoeckle@flx-software.de';

-- Schritt 2: Führe das aus (ersetze 'DEINE_USER_ID_HIER' mit der UUID aus Schritt 1):
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Hole die user_id
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'fabio.stoeckle@flx-software.de';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User nicht gefunden! Bitte prüfe die E-Mail-Adresse.';
  END IF;
  
  -- Erstelle Organisation
  INSERT INTO public.organizations (name, slug) 
  VALUES ('FLX Software', 'flx-software')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_org_id;
  
  -- Falls Organisation schon existiert, hole die ID
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'flx-software';
  END IF;
  
  -- Erstelle Profil
  INSERT INTO public.profiles (id, full_name)
  VALUES (v_user_id, 'Fabio Stoeckle')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Fabio Stoeckle';
  
  -- Erstelle Membership
  INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
  VALUES (v_org_id, v_user_id, 'admin', true)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET is_active = true, role = 'admin';
  
  RAISE NOTICE '✅ Setup erfolgreich! User ID: %, Org ID: %', v_user_id, v_org_id;
END $$;
