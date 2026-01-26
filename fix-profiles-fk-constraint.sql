-- ============================================================
-- FIX: Foreign Key Constraint für profiles
-- ============================================================
-- Problem: Foreign Key verweist auf auth.users, aber User ist noch nicht verfügbar
-- Lösung: Foreign Key Constraint entfernen oder auf public.users ändern
-- ============================================================

-- 1. Entferne den alten Foreign Key Constraint (falls vorhanden)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Erstelle einen neuen Foreign Key Constraint, der DEFERRABLE ist
-- DEFERRABLE bedeutet, dass der Constraint erst am Ende der Transaktion geprüft wird
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- ODER: Wenn das nicht funktioniert, entferne den Constraint komplett
-- (Die Referenz wird durch den Trigger sichergestellt)
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
