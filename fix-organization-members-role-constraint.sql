-- ============================================================
-- Fix: Erweitere CHECK Constraint für organization_members.role
-- ============================================================
-- Der bestehende Constraint erlaubt nur 'admin' und 'staff',
-- aber nicht 'super_admin'. Dieses Script erweitert den Constraint.
-- ============================================================

-- Schritt 1: Lösche den alten CHECK Constraint
ALTER TABLE public.organization_members
DROP CONSTRAINT IF EXISTS organization_members_role_check;

-- Schritt 2: Erstelle neuen CHECK Constraint mit 'super_admin'
ALTER TABLE public.organization_members
ADD CONSTRAINT organization_members_role_check
CHECK (role IN ('admin', 'staff', 'super_admin'));

-- Schritt 3: Prüfe ob Constraint erfolgreich erstellt wurde
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.organization_members'::regclass
  AND conname = 'organization_members_role_check';
