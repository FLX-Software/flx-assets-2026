-- ============================================================
-- Test: Prüfe RLS-Zugriff für User
-- ============================================================
-- Führe das als der authentifizierte User aus (nicht als service_role!)

-- 1. Prüfe ob User auf sein Profil zugreifen kann
SELECT * FROM public.profiles WHERE id = '898e9259-6072-437d-8faf-cc3ea86f5934';

-- 2. Prüfe ob User auf seine Memberships zugreifen kann
SELECT * FROM public.organization_members WHERE user_id = '898e9259-6072-437d-8faf-cc3ea86f5934';

-- 3. Prüfe ob User auf die Organisation zugreifen kann
SELECT o.* 
FROM public.organizations o
JOIN public.organization_members om ON om.organization_id = o.id
WHERE om.user_id = '898e9259-6072-437d-8faf-cc3ea86f5934';
