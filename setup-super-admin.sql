-- ============================================================
-- Super-Admin einrichten
-- ============================================================
-- Dieses Script markiert einen bestehenden User als Super-Admin
-- 
-- WICHTIG: Führe ZUERST fix-organization-members-role-constraint.sql aus!
-- 
-- ANPASSUNG: Ersetze 'DEINE_USER_ID_HIER' mit der UUID des App-Inhabers
-- ============================================================

-- Schritt 1: Finde die user_id des App-Inhabers
-- Führe das aus und kopiere die UUID:
-- SELECT id, email FROM auth.users WHERE email = 'deine-email@example.com';

-- Schritt 2: Markiere User als Super-Admin
-- Ersetze 'DEINE_USER_ID_HIER' mit der UUID aus Schritt 1:
UPDATE public.organization_members
SET role = 'super_admin'
WHERE user_id = 'DEINE_USER_ID_HIER'
  AND is_active = true;

-- Schritt 3: Prüfe ob Super-Admin erfolgreich gesetzt wurde
SELECT 
  om.user_id,
  p.full_name,
  om.role,
  o.name as organization_name,
  om.is_active
FROM public.organization_members om
JOIN public.profiles p ON p.id = om.user_id
JOIN public.organizations o ON o.id = om.organization_id
WHERE om.user_id = 'DEINE_USER_ID_HIER'
  AND om.role = 'super_admin'
  AND om.is_active = true;
