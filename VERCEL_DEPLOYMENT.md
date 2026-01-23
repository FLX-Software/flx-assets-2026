# Vercel Deployment Guide für FLX-ASSETS

Diese Anleitung führt dich Schritt für Schritt durch das Deployment deiner FLX-ASSETS App auf Vercel.

## Voraussetzungen

1. **Vercel Account**: Erstelle einen kostenlosen Account auf [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket Account**: Vercel benötigt ein Git-Repository (oder du verwendest die CLI)
3. **Supabase Credentials**: Deine `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`

## Option 1: Deployment über Vercel Dashboard (Empfohlen)

### Schritt 1: Projekt zu Git hinzufügen

Falls noch nicht geschehen, initialisiere ein Git-Repository:

```bash
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
```

### Schritt 2: Repository zu GitHub/GitLab/Bitbucket pushen

```bash
# Erstelle ein neues Repository auf GitHub/GitLab/Bitbucket
# Dann:
git remote add origin <DEINE_REPO_URL>
git branch -M main
git push -u origin main
```

### Schritt 3: Projekt in Vercel importieren

1. Gehe zu [vercel.com/dashboard](https://vercel.com/dashboard)
2. Klicke auf **"Add New..."** → **"Project"**
3. Wähle dein Git-Provider (GitHub/GitLab/Bitbucket) aus
4. Wähle das Repository `flx-assets-2026-main` aus
5. Klicke auf **"Import"**

### Schritt 4: Build-Einstellungen konfigurieren

Vercel sollte automatisch folgende Einstellungen erkennen:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Falls nicht, stelle sicher, dass diese Werte korrekt sind.

### Schritt 5: Environment Variables hinzufügen

**WICHTIG**: Füge deine Supabase-Credentials als Environment Variables hinzu:

1. In der Vercel-Projektseite, gehe zu **Settings** → **Environment Variables**
2. Füge folgende Variablen hinzu:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | Deine Supabase URL (z.B. `https://xxxxx.supabase.co`) | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Dein Supabase Anon Key | Production, Preview, Development |

**Hinweis**: 
- Wähle für beide Variablen alle drei Environments (Production, Preview, Development)
- Die Werte werden beim Build in die App eingebunden
- **NIEMALS** die `.env.local` Datei committen!

### Schritt 6: Deployment starten

1. Klicke auf **"Deploy"**
2. Warte, bis der Build abgeschlossen ist (ca. 1-2 Minuten)
3. Nach erfolgreichem Build erhältst du eine URL wie: `https://flx-assets-2026-main.vercel.app`

### Schritt 7: Custom Domain (Optional)

Falls du eine eigene Domain verwenden möchtest:

1. Gehe zu **Settings** → **Domains**
2. Füge deine Domain hinzu (z.B. `assets.flx-software.de`)
3. Folge den DNS-Anweisungen von Vercel

---

## Option 2: Deployment über Vercel CLI

### Schritt 1: Vercel CLI installieren

```bash
npm install -g vercel
```

### Schritt 2: Login

```bash
vercel login
```

### Schritt 3: Projekt deployen

```bash
# Im Projektverzeichnis
vercel
```

Folge den interaktiven Prompts:
- **Set up and deploy?** → `Y`
- **Which scope?** → Wähle deinen Account
- **Link to existing project?** → `N` (für erstes Deployment)
- **Project name?** → `flx-assets` (oder wie du möchtest)
- **Directory?** → `./` (aktuelles Verzeichnis)

### Schritt 4: Environment Variables setzen

```bash
vercel env add VITE_SUPABASE_URL
# Füge deine Supabase URL ein

vercel env add VITE_SUPABASE_ANON_KEY
# Füge deinen Supabase Anon Key ein
```

Für alle Environments:
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_URL development

vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SUPABASE_ANON_KEY preview
vercel env add VITE_SUPABASE_ANON_KEY development
```

### Schritt 5: Production Deployment

```bash
vercel --prod
```

---

## Nach dem Deployment

### 1. Supabase CORS konfigurieren

Falls du Supabase verwendest, musst du deine Vercel-Domain zu den erlaubten Origins hinzufügen:

1. Gehe zu deinem Supabase Dashboard
2. **Settings** → **API**
3. Unter **"Allowed Origins"** füge hinzu:
   - `https://deine-app.vercel.app`
   - `https://*.vercel.app` (für Preview-Deployments)

### 2. Testen

1. Öffne deine Vercel-URL
2. Teste Login/Logout
3. Teste Asset-Erstellung und -Bearbeitung
4. Prüfe die Browser-Konsole auf Fehler

### 3. Automatische Deployments

Vercel deployt automatisch bei jedem Push zu deinem `main` Branch:
- **Production**: Jeder Push zu `main`
- **Preview**: Jeder Push zu anderen Branches oder Pull Requests

---

## Troubleshooting

### Build schlägt fehl

**Problem**: `Error: Cannot find module '...'`
**Lösung**: Stelle sicher, dass alle Dependencies in `package.json` aufgeführt sind und `npm install` erfolgreich läuft.

**Problem**: `Environment variable VITE_SUPABASE_URL is not defined`
**Lösung**: Prüfe, ob die Environment Variables in Vercel korrekt gesetzt sind (Settings → Environment Variables).

### App lädt nicht / Whitescreen

**Problem**: Whitescreen nach Deployment
**Lösung**: 
1. Öffne die Browser-Konsole (F12)
2. Prüfe auf Fehler
3. Stelle sicher, dass die Environment Variables korrekt sind
4. Prüfe die Network-Tab für fehlgeschlagene Requests

### CORS-Fehler

**Problem**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
**Lösung**: Füge deine Vercel-Domain zu den Supabase Allowed Origins hinzu (siehe oben).

---

## Wichtige Dateien

- `vercel.json`: Vercel-Konfiguration (bereits erstellt)
- `.env.local`: **NIEMALS committen!** (sollte in `.gitignore` sein)
- `.env.example`: Beispiel für Environment Variables (kann committed werden)

---

## Kosten

Vercel bietet einen **kostenlosen Hobby-Plan** mit:
- Unbegrenzte Deployments
- 100 GB Bandbreite/Monat
- SSL-Zertifikate inklusive
- Custom Domains möglich

Für größere Projekte gibt es bezahlte Pläne.

---

## Nächste Schritte

Nach erfolgreichem Deployment:
1. ✅ Teste alle Features (Login, Assets, Multi-Tenant)
2. ✅ Konfiguriere Custom Domain (optional)
3. ✅ Setze up Monitoring/Alerts (optional)
4. ✅ Dokumentiere die Production-URL für dein Team

---

**Viel Erfolg beim Deployment! 🚀**
