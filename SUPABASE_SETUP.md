# Supabase Setup Guide für FLX-ASSETS

## 1. Supabase-Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Notiere dir die **Project URL** und den **anon/public key** aus den Settings → API

## 2. SQL-Migration ausführen

1. Öffne den **SQL Editor** in deinem Supabase-Dashboard
2. Kopiere den kompletten SQL-Code aus der vorherigen Migration
3. Führe ihn aus (sollte "Success no rows returned" anzeigen)

## 3. Environment-Variablen setzen

1. Erstelle eine `.env.local` Datei im Projekt-Root (oder kopiere `.env.example`)
2. Füge deine Supabase-Credentials ein:

```env
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key-hier
```

## 4. Dependencies installieren

```bash
npm install
```

## 5. Ersten User anlegen

Da die App jetzt Supabase Auth nutzt, musst du den ersten User über Supabase anlegen:

### Option A: Über Supabase Dashboard
1. Gehe zu **Authentication** → **Users** → **Add User**
2. Erstelle einen User mit E-Mail/Passwort
3. Notiere dir die `user_id` (UUID)

### Option B: Über SQL (für schnellen Test)

```sql
-- 1. Organisation erstellen
insert into public.organizations (name, slug) 
values ('FLX Software', 'flx-software') 
returning id;

-- Notiere dir die organization_id (z.B. '123e4567-e89b-12d3-a456-426614174000')

-- 2. Profil für den Auth-User erstellen (ersetze USER_ID und ORG_ID)
insert into public.profiles (id, full_name)
values ('USER_ID_HIER', 'Max Mustermann');

-- 3. Membership erstellen
insert into public.organization_members (organization_id, user_id, role, is_active)
values ('ORG_ID_HIER', 'USER_ID_HIER', 'admin', true);
```

## 6. App starten

```bash
npm run dev
```

## 7. Login

- Verwende die **E-Mail-Adresse** des Users (nicht mehr Username!)
- Passwort wie in Supabase gesetzt

## Wichtige Hinweise

- **RLS (Row Level Security)** ist aktiviert: User sehen nur Daten ihrer Organisation
- **Multi-Tenant**: Jeder User gehört zu mindestens einer Organisation
- **Rollen**: `admin` kann Assets/Users verwalten, `staff` kann nur ausleihen/rückgeben
- Die alte LocalStorage-Logik wurde entfernt – alles läuft jetzt über Supabase

## Troubleshooting

### "Missing Supabase environment variables"
→ Prüfe, ob `.env.local` existiert und die Variablen korrekt gesetzt sind

### "relation does not exist"
→ SQL-Migration wurde nicht vollständig ausgeführt → nochmal ausführen

### "User nicht gefunden"
→ Prüfe, ob Profil + Membership in Supabase existieren (siehe Schritt 5)

### "Keine Organisation zugeordnet"
→ User hat keine aktive Membership → über SQL oder Dashboard hinzufügen
