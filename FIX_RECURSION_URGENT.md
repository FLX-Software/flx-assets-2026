# ⚠️ URGENT: Infinite Recursion Fix

## Problem
Die RLS-Policies verursachen infinite recursion, wodurch kein Login mehr möglich ist.

## Sofort-Lösung

**Führe dieses SQL-Script in Supabase aus:**

1. Öffne Supabase SQL Editor
2. Kopiere den Inhalt von `fix-profiles-members-rls-v2.sql`
3. Führe es aus

## Was das Script macht

- Erstellt eine `SECURITY DEFINER` Funktion, die Rekursion verhindert
- Vereinfacht die Policies für `profiles` und `organization_members`
- Behebt die infinite recursion

## Nach dem Ausführen

- Logge dich aus und wieder ein
- Die App sollte wieder funktionieren
