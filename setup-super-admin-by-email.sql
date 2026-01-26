-- ============================================================
-- Super-Admin einrichten (per E-Mail-Adresse)
-- ============================================================
-- Dieses Script markiert einen bestehenden User als Super-Admin
-- 
-- WICHTIG: Führe ZUERST fix-organization-members-role-constraint.sql aus!
-- 
-- ANPASSUNG: Ersetze 'deine-email@example.com' mit deiner E-Mail-Adresse
-- ============================================================

-- Markiere User als Super-Admin (anhand E-Mail-Adresse)
UPDATE public.organization_members
SET role = 'super_admin'
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'deine-email@example.com'
)
AND is_active = true;

-- Prüfe ob Super-Admin erfolgreich gesetzt wurde
SELECT 
  om.user_id,
  p.full_name,
  u.email,
  om.role,
  o.name as organization_name,
  om.is_active
FROM public.organization_members om
JOIN public.profiles p ON p.id = om.user_id
JOIN public.organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'deine-email@example.com'
  AND om.role = 'super_admin'
  AND om.is_active = true;
