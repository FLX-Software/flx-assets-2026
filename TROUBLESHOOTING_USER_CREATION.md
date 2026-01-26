# Troubleshooting: User-Erstellung hängt

## Problem
Die User-Erstellung bleibt im "Erstelle..."-Status hängen.

## Mögliche Ursachen

### 1. E-Mail-Bestätigung aktiviert
Supabase erfordert standardmäßig E-Mail-Bestätigung. Wenn aktiviert:
- `signUp` gibt zwar einen User zurück, aber `email_confirmed_at` ist `null`
- Der User kann sich nicht einloggen, bis die E-Mail bestätigt wurde

**Lösung:**
1. Gehe zu Supabase Dashboard → Authentication → Settings
2. Deaktiviere "Enable email confirmations" unter "Email Auth"
3. Oder: Verwende Service Role Key für User-Erstellung (nicht empfohlen für Frontend)

### 2. RLS-Policy blockiert Profil/Membership-Erstellung
Die Row Level Security Policies könnten die Erstellung blockieren.

**Prüfung:**
- Öffne Browser-Konsole (F12)
- Schaue nach Fehlermeldungen in der Konsole
- Prüfe Network-Tab für fehlgeschlagene Requests

### 3. Netzwerk-Timeout
Die Anfrage könnte hängen bleiben.

**Lösung:**
- Prüfe Browser Network-Tab
- Schaue ob Requests zu Supabase erfolgreich sind

## Debugging-Schritte

1. **Öffne Browser-Konsole (F12)**
2. **Versuche einen User anzulegen**
3. **Schaue nach Logs:**
   - `🔵 signUp: Starte User-Erstellung...`
   - `🔵 signUp: Erstelle Auth-User...`
   - `🔵 signUp: Auth-Response:`
   - Weitere Logs sollten folgen

4. **Prüfe Network-Tab:**
   - Suche nach Requests zu `supabase.co/auth/v1/signup`
   - Prüfe Status-Code (sollte 200 sein)
   - Prüfe Response-Body

## Schnelle Lösung

Falls E-Mail-Bestätigung das Problem ist:

1. **In Supabase Dashboard:**
   - Authentication → Settings → Email Auth
   - Deaktiviere "Enable email confirmations"
   - Speichere

2. **Oder: User manuell aktivieren**
   - Authentication → Users
   - Finde den neuen User
   - Klicke auf "..." → "Confirm email"

## Alternative: User über Supabase Dashboard erstellen

1. Gehe zu Supabase Dashboard → Authentication → Users → Add User
2. Erstelle User mit E-Mail/Passwort
3. Führe `fix-missing-profiles.sql` aus, um Profil zu erstellen
4. Führe SQL aus, um Membership zu erstellen
