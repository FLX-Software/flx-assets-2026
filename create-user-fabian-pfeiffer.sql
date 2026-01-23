-- ============================================================
-- USER SETUP für Fabian Pfeiffer
-- E-Mail: fabian.pfeiffer@flx-software.de
-- Rolle: Admin
-- Organisation: FLX Software
-- ============================================================
-- 
-- WICHTIG: Der User muss ZUERST in Supabase Auth erstellt werden!
-- 
-- Option 1: Über Supabase Dashboard
--   1. Gehe zu Authentication → Users → Add User
--   2. E-Mail: fabian.pfeiffer@flx-software.de
--   3. Passwort: admin
--   4. Notiere dir die user_id (UUID)
--
-- Option 2: Über Supabase Auth API (kannst du auch in der App machen)
--   Oder führe zuerst Schritt 1 aus, um die user_id zu bekommen
-- ============================================================

-- SCHRITT 1: Finde die user_id aus auth.users
-- Führe das aus und kopiere die UUID:
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'fabian.pfeiffer@flx-software.de';

-- SCHRITT 2: Führe das komplette Setup aus (ersetze 'USER_ID_HIER' mit der UUID aus Schritt 1):
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Hole die user_id aus auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'fabian.pfeiffer@flx-software.de';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ User nicht gefunden! Bitte erstelle zuerst den User in Supabase Auth (Authentication → Users → Add User)';
  END IF;
  
  RAISE NOTICE '✅ User gefunden: %', v_user_id;
  
  -- Stelle sicher, dass die Organisation existiert
  INSERT INTO public.organizations (name, slug, is_active) 
  VALUES ('FLX Software', 'flx-software', true)
  ON CONFLICT (slug) DO UPDATE SET is_active = true
  RETURNING id INTO v_org_id;
  
  -- Falls Organisation schon existiert, hole die ID
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id 
    FROM public.organizations 
    WHERE slug = 'flx-software';
  END IF;
  
  RAISE NOTICE '✅ Organisation gefunden/erstellt: %', v_org_id;
  
  -- Erstelle Profil
  INSERT INTO public.profiles (id, full_name)
  VALUES (v_user_id, 'Fabian Pfeiffer')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Fabian Pfeiffer';
  
  RAISE NOTICE '✅ Profil erstellt/aktualisiert';
  
  -- Erstelle Membership mit Admin-Rolle
  INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
  VALUES (v_org_id, v_user_id, 'admin', true)
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET is_active = true, role = 'admin';
  
  RAISE NOTICE '✅ Membership erstellt/aktualisiert (Rolle: admin)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Setup erfolgreich abgeschlossen!';
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '   Organisation ID: %', v_org_id;
  RAISE NOTICE '   E-Mail: fabian.pfeiffer@flx-software.de';
  RAISE NOTICE '   Rolle: admin';
END $$;

-- SCHRITT 3: Prüfe ob alles korrekt erstellt wurde
SELECT 
  '✅ Setup-Status für Fabian Pfeiffer' as status,
  (SELECT COUNT(*) FROM public.profiles WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'fabian.pfeiffer@flx-software.de'
  )) as profil_existiert,
  (SELECT COUNT(*) FROM public.organizations WHERE slug = 'flx-software') as org_existiert,
  (SELECT COUNT(*) FROM public.organization_members WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'fabian.pfeiffer@flx-software.de'
  ) AND is_active = true AND role = 'admin') as membership_existiert,
  (SELECT full_name FROM public.profiles WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'fabian.pfeiffer@flx-software.de'
  )) as vollständiger_name;
