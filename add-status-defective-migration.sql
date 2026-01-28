-- ============================================================
-- Migration: Status "defective" (Defekt) für Assets erlauben
-- ============================================================
-- Fehler: new row violates check constraint "assets_status_check"
--
-- So führst du die Migration aus:
-- 1. Supabase Dashboard öffnen → Projekt wählen
-- 2. Links "SQL Editor" → "New query"
-- 3. Dieses ganze Script einfügen und auf "Run" klicken
-- ============================================================

-- Bestehende Constraint entfernen
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;

-- Neue Constraint: available | loaned | defective
ALTER TABLE public.assets
  ADD CONSTRAINT assets_status_check
  CHECK (status IN ('available', 'loaned', 'defective'));
