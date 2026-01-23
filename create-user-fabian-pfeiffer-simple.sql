-- ============================================================
-- EINFACHE VERSION: Alles in einem Schritt
-- Für: Fabian Pfeiffer (fabian.pfeiffer@flx-software.de)
-- ============================================================
-- 
-- VORAUSSETZUNG: User muss bereits in Supabase Auth existieren!
-- 
-- Falls nicht: Gehe zu Authentication → Users → Add User
--   - E-Mail: fabian.pfeiffer@flx-software.de
--   - Passwort: admin
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Hole die user_id
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'fabian.pfeiffer@flx-software.de';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ User nicht gefunden! Bitte erstelle zuerst den User in Supabase Auth.';
  END IF;
  
  -- Erstelle/finde Organisation
  INSERT INTO public.organizations (name, slug, is_active) 
  VALUES ('FLX Software', 'flx-software', true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_org_id;
  
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'flx-software';
  END IF;
  
  -- Erstelle Profil
  INSERT INTO public.profiles (id, full_name)
  VALUES (v_user_id, 'Fabian Pfeiffer')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Fabian Pfeiffer';
  
  -- Erstelle Membership (Admin)
  INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
  VALUES (v_org_id, v_user_id, 'admin', true)
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET is_active = true, role = 'admin';
  
  RAISE NOTICE '✅ Setup erfolgreich! User ID: %, Org ID: %', v_user_id, v_org_id;
END $$;
