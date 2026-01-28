-- ============================================================
-- Migration: Status "defective" (Defekt) für Assets erlauben
-- ============================================================
-- Nur nötig, wenn die Spalte "status" eine CHECK-Constraint hat.
-- In Supabase: SQL Editor → dieses Script ausführen.
-- ============================================================

-- Bestehende Constraint entfernen (Name ggf. anpassen)
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;

-- Neue Constraint: available | loaned | defective
ALTER TABLE public.assets
  ADD CONSTRAINT assets_status_check
  CHECK (status IN ('available', 'loaned', 'defective'));
