# GitHub Authentifizierung für privates Repository

Das Repository existiert, aber du hast keine gültige Authentifizierung. Hier ist die Lösung:

## Lösung: Personal Access Token verwenden

### Schritt 1: Personal Access Token erstellen

1. Gehe zu: https://github.com/settings/tokens
2. Klicke auf **"Generate new token"** → **"Generate new token (classic)"**
3. **Note**: "FLX Assets Repository Access"
4. **Expiration**: Wähle eine Dauer (z.B. 90 Tage oder "No expiration")
5. **Scopes**: Aktiviere mindestens:
   - ✅ `repo` (Full control of private repositories)
6. Klicke auf **"Generate token"**
7. **WICHTIG**: Kopiere den Token sofort! (wird nur einmal angezeigt)
   - Beispiel: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Schritt 2: Credentials aktualisieren

**Option A: Windows Credential Manager löschen (empfohlen)**

1. Öffne die Windows-Suche (Windows-Taste)
2. Suche nach: **"Credential Manager"** oder **"Anmeldeinformationsverwaltung"**
3. Öffne **"Windows-Anmeldeinformationsverwaltung"**
4. Gehe zu **"Windows-Anmeldeinformationen"**
5. Suche nach Einträgen mit `git:https://github.com`
6. **Lösche alle GitHub-Einträge**
7. Versuche erneut zu pushen - Windows wird nach neuen Credentials fragen

**Option B: Token direkt in URL einbetten (temporär)**

```bash
cd C:\App\flx-assets-2026-main

# Ersetze TOKEN mit deinem Personal Access Token
git remote set-url origin https://TOKEN@github.com/FLX-Software/flx-assets-2026.git

# Versuche zu pushen
git push -u origin main
```

**Option C: Git Credential Helper verwenden**

```bash
# Credentials manuell setzen
git credential-manager-core store

# Dann beim Push:
# Username: Dein GitHub-Username (z.B. "fabio-stoeckle" oder "FLX-Software")
# Password: Dein Personal Access Token (NICHT dein GitHub-Passwort!)
```

### Schritt 3: Push durchführen

Nachdem die Credentials aktualisiert wurden:

```bash
cd C:\App\flx-assets-2026-main
git push -u origin main
```

Wenn nach Username/Password gefragt wird:
- **Username**: Dein GitHub-Username oder die Organisation `FLX-Software`
- **Password**: Dein **Personal Access Token** (nicht dein GitHub-Passwort!)

## Alternative: SSH verwenden

Falls du SSH bevorzugst:

### Schritt 1: SSH-Key erstellen (falls noch nicht vorhanden)

```bash
# Prüfe ob bereits ein SSH-Key existiert
ls ~/.ssh/id_ed25519.pub

# Falls nicht, erstelle einen neuen:
ssh-keygen -t ed25519 -C "stoecklefabio@gmail.com"
# Drücke Enter für alle Fragen (Standard-Pfad, kein Passphrase)
```

### Schritt 2: SSH-Key zu GitHub hinzufügen

1. Kopiere den Public Key:
```bash
cat ~/.ssh/id_ed25519.pub
# Kopiere die gesamte Ausgabe
```

2. Gehe zu: https://github.com/settings/keys
3. Klicke auf **"New SSH key"**
4. **Title**: "FLX Assets Development"
5. **Key**: Füge den kopierten Public Key ein
6. Klicke auf **"Add SSH key"**

### Schritt 3: Remote auf SSH ändern

```bash
cd C:\App\flx-assets-2026-main
git remote set-url origin git@github.com:FLX-Software/flx-assets-2026.git
git push -u origin main
```

## Troubleshooting

### "repository not found" trotz Token
- Prüfe, ob du Mitglied der `FLX-Software` Organisation bist
- Prüfe, ob der Token die `repo` Berechtigung hat
- Prüfe, ob der Token noch gültig ist

### "Permission denied"
- Stelle sicher, dass du Schreibrechte auf das Repository hast
- Prüfe in GitHub: Settings → Collaborators & teams

### Credentials werden nicht gespeichert
- Lösche alte Credentials im Windows Credential Manager
- Verwende `git credential-manager-core store` manuell
