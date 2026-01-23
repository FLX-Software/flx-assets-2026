-- ============================================================
-- KOMPLETTES SETUP für fabio.stoeckle@flx-software.de
-- User ID: 898e9259-6072-437d-8faf-cc3ea86f5934
-- ============================================================

-- 1. Erstelle Organisation (falls nicht vorhanden)
INSERT INTO public.organizations (name, slug, is_active) 
VALUES ('FLX Software', 'flx-software', true)
ON CONFLICT (slug) DO UPDATE SET is_active = true
RETURNING id;

-- 2. Erstelle Profil
INSERT INTO public.profiles (id, full_name)
VALUES ('898e9259-6072-437d-8faf-cc3ea86f5934', 'Fabio Stoeckle')
ON CONFLICT (id) DO UPDATE SET full_name = 'Fabio Stoeckle';

-- 3. Erstelle Membership (hole org_id automatisch)
INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
SELECT 
  o.id as organization_id,
  '898e9259-6072-437d-8faf-cc3ea86f5934'::uuid as user_id,
  'admin' as role,
  true as is_active
FROM public.organizations o
WHERE o.slug = 'flx-software'
ON CONFLICT (organization_id, user_id) 
DO UPDATE SET is_active = true, role = 'admin';

-- 4. Prüfe ob alles erstellt wurde
SELECT 
  '✅ Setup-Status' as status,
  (SELECT COUNT(*) FROM public.profiles WHERE id = '898e9259-6072-437d-8faf-cc3ea86f5934') as profil_existiert,
  (SELECT COUNT(*) FROM public.organizations WHERE slug = 'flx-software') as org_existiert,
  (SELECT COUNT(*) FROM public.organization_members WHERE user_id = '898e9259-6072-437d-8faf-cc3ea86f5934' AND is_active = true) as membership_existiert;
