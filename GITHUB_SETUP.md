# GitHub Repository Setup

## Schritt 1: Repository auf GitHub erstellen

1. Gehe zu: https://github.com/organizations/FLX-Software/repositories/new
   (oder: https://github.com/new wenn du persönlich erstellst)

2. **Repository Name**: `flx-assets-2026`
3. **Description** (optional): "FLX Assets - Professionelle Inventarverwaltung"
4. **Visibility**: Wähle Public oder Private
5. **WICHTIG**: 
   - ❌ KEIN README hinzufügen
   - ❌ KEINE .gitignore hinzufügen
   - ❌ KEINE Lizenz hinzufügen
   (Wir haben bereits alles lokal)

6. Klicke auf **"Create repository"**

## Schritt 2: Code pushen

Nachdem das Repository erstellt wurde, führe diese Befehle aus:

```bash
cd C:\App\flx-assets-2026-main

# Prüfe ob alles committed ist
git status

# Falls nicht, committe alle Änderungen
git add .
git commit -m "Initial commit - Ready for deployment"

# Pushe zum Repository
git push -u origin main
```

## Falls Authentifizierung erforderlich ist

GitHub verwendet seit 2021 keine Passwörter mehr für HTTPS. Du musst einen **Personal Access Token** verwenden:

1. Gehe zu: https://github.com/settings/tokens
2. Klicke auf **"Generate new token"** → **"Generate new token (classic)"**
3. **Note**: "Vercel Deployment"
4. **Expiration**: Wähle eine Dauer (z.B. 90 Tage)
5. **Scopes**: Aktiviere mindestens `repo` (alle Repository-Berechtigungen)
6. Klicke auf **"Generate token"**
7. **Kopiere den Token** (wird nur einmal angezeigt!)

8. Beim `git push` wird nach Username und Password gefragt:
   - **Username**: Dein GitHub-Username
   - **Password**: **Füge den Personal Access Token ein** (nicht dein GitHub-Passwort!)

## Alternative: SSH verwenden

Falls du SSH bevorzugst:

1. Erstelle einen SSH-Key (falls noch nicht vorhanden):
```bash
ssh-keygen -t ed25519 -C "deine-email@example.com"
```

2. Füge den Public Key zu GitHub hinzu:
   - Kopiere den Inhalt von `~/.ssh/id_ed25519.pub`
   - Gehe zu: https://github.com/settings/keys
   - Klicke auf "New SSH key"
   - Füge den Key ein

3. Ändere den Remote auf SSH:
```bash
git remote set-url origin git@github.com:FLX-Software/flx-assets-2026.git
```

4. Pushe:
```bash
git push -u origin main
```

## Troubleshooting

### "repository not found"
- Prüfe, ob das Repository wirklich existiert: https://github.com/FLX-Software/flx-assets-2026
- Prüfe, ob du Zugriff auf die Organisation `FLX-Software` hast
- Stelle sicher, dass der Repository-Name exakt übereinstimmt

### "Authentication failed"
- Verwende einen Personal Access Token statt Passwort
- Prüfe, ob der Token die `repo` Berechtigung hat
- Prüfe, ob der Token noch gültig ist

### "Permission denied"
- Prüfe, ob du Mitglied der `FLX-Software` Organisation bist
- Prüfe, ob du Schreibrechte auf das Repository hast
