# E-Mail-Bestätigung deaktivieren

## In Supabase Dashboard:

1. Gehe zu **Authentication** → **Settings** → **Email Auth**
2. Deaktiviere **"Enable email confirmations"**
3. Speichere die Änderungen

## Oder für bestehende Benutzer manuell bestätigen:

Führe diese SQL-Abfrage in Supabase SQL Editor aus:

```sql
-- Setze alle Benutzer als bestätigt
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
```

## Für neue Benutzer (bereits implementiert):

Beim Erstellen von Benutzern durch Admins wird bereits `emailRedirectTo: undefined` gesetzt, 
sodass keine E-Mail-Bestätigung erforderlich ist.
