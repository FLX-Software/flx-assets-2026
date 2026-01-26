-- ============================================================
-- FIX: Foreign Key Constraint für profiles
-- ============================================================
-- Problem: Foreign Key verweist auf auth.users, aber User ist noch nicht verfügbar
-- Lösung: Foreign Key Constraint entfernen (Trigger stellt die Referenz sicher)
-- ============================================================

-- Entferne den Foreign Key Constraint komplett
-- Der Trigger handle_new_user() stellt sicher, dass Profile nur für existierende Users erstellt werden
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Hinweis: Der Foreign Key Constraint wird nicht benötigt, da:
-- 1. Der Trigger handle_new_user() automatisch Profile erstellt
-- 2. Profile werden nur über den Trigger oder über die create_profile_for_user() Funktion erstellt
-- 3. Beide Methoden stellen sicher, dass der User in auth.users existiert
