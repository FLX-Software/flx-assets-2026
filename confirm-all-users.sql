-- ============================================================
-- Setze alle Benutzer als E-Mail-bestätigt
-- ============================================================
-- Diese SQL-Abfrage markiert alle Benutzer in auth.users als E-Mail-bestätigt,
-- sodass sie sich ohne E-Mail-Bestätigung einloggen können.
-- 
-- WICHTIG: Führe diese Abfrage nur aus, wenn du sicher bist, dass alle
-- E-Mail-Adressen korrekt sind!
-- ============================================================

-- Setze alle Benutzer als bestätigt
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Zeige Ergebnis
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;
