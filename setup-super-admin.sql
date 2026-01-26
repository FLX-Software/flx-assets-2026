-- ============================================================
-- Super-Admin einrichten
-- ============================================================
-- Dieses Script markiert einen bestehenden User als Super-Admin
-- 
-- WICHTIG: Führe ZUERST fix-organization-members-role-constraint.sql aus!
-- ============================================================

-- ============================================================
-- SCHRITT 1: Finde deine User-ID
-- ============================================================
-- Führe diese Abfrage aus und kopiere die UUID aus der Spalte 'id':
-- Ersetze 'deine-email@example.com' mit deiner E-Mail-Adresse!

SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'deine-email@example.com';

-- ============================================================
-- SCHRITT 2: Markiere User als Super-Admin
-- ============================================================
-- Nachdem du deine User-ID aus Schritt 1 hast, führe diese Abfrage aus:
-- Ersetze 'DEINE_USER_ID_HIER' mit der UUID aus Schritt 1!

-- UNCOMMENT und ersetze 'DEINE_USER_ID_HIER':
/*
UPDATE public.organization_members
SET role = 'super_admin'
WHERE user_id = 'DEINE_USER_ID_HIER'
  AND is_active = true;
*/

-- ============================================================
-- SCHRITT 3: Prüfe ob Super-Admin erfolgreich gesetzt wurde
-- ============================================================
-- Ersetze 'DEINE_USER_ID_HIER' mit deiner UUID und führe aus:

-- UNCOMMENT und ersetze 'DEINE_USER_ID_HIER':
/*
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
*/
