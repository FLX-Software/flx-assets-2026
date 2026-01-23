-- ============================================================
-- Setup für ersten User: fabio.stoeckle@flx-software.de
-- ============================================================

-- 1. Finde die user_id aus auth.users
-- Führe das aus und notiere dir die UUID:
SELECT id, email FROM auth.users WHERE email = 'fabio.stoeckle@flx-software.de';

-- 2. Erstelle Organisation (ersetze USER_ID_HIER mit der UUID aus Schritt 1)
-- Führe das aus und notiere dir die organization_id:
INSERT INTO public.organizations (name, slug) 
VALUES ('FLX Software', 'flx-software') 
RETURNING id;

-- 3. Erstelle Profil (ersetze USER_ID_HIER mit der UUID aus Schritt 1)
INSERT INTO public.profiles (id, full_name)
VALUES ('USER_ID_HIER', 'Fabio Stoeckle')
ON CONFLICT (id) DO UPDATE SET full_name = 'Fabio Stoeckle';

-- 4. Erstelle Membership (ersetze ORG_ID_HIER und USER_ID_HIER)
INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
VALUES ('ORG_ID_HIER', 'USER_ID_HIER', 'admin', true)
ON CONFLICT (organization_id, user_id) DO UPDATE SET is_active = true, role = 'admin';
