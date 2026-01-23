-- ============================================================
-- Diagnose: Prüfe ob alles für User existiert
-- ============================================================

-- 1. Prüfe ob User in auth.users existiert
SELECT 'auth.users' as tabelle, id, email, created_at 
FROM auth.users 
WHERE email = 'fabio.stoeckle@flx-software.de';

-- 2. Prüfe ob Profil existiert
SELECT 'profiles' as tabelle, id, full_name, created_at 
FROM public.profiles 
WHERE id = '898e9259-6072-437d-8faf-cc3ea86f5934';

-- 3. Prüfe ob Organisationen existieren
SELECT 'organizations' as tabelle, id, name, slug, is_active 
FROM public.organizations;

-- 4. Prüfe ob Membership existiert
SELECT 'organization_members' as tabelle, organization_id, user_id, role, is_active, created_at
FROM public.organization_members 
WHERE user_id = '898e9259-6072-437d-8faf-cc3ea86f5934';
