# Test- und Prüfanleitung Phase 1 (XSS, Import/Export, Session)

Diese Anleitung beschreibt, wie du die Änderungen von Phase 1 sachgerecht testen und prüfen kannst.

---

## 1. XSS eindämmen (sichere Ausgabe)

### Ziel
Kein ungefilterter HTML/JavaScript in der UI. Modell, Organisationsname, Benutzername, Beschreibung etc. werden nur als Text ausgegeben oder vor innerHTML escapest.

### Was wurde umgesetzt
- **React-Text:** Überall, wo User-Daten als `{variable}` gerendert werden, escaped React automatisch – keine Änderung nötig.
- **QRCodeDisplay (Druck):** `brand`, `model` und `value` werden vor der Verwendung in `innerHTML` mit `escapeHtml()` aus `lib/sanitize.ts` escapest.
- **Neues Modul:** `lib/sanitize.ts` mit `escapeHtml(str)` für alle Fälle, in denen Nutzerdaten in HTML-Strings (z. B. Druckansicht) eingebaut werden.

### Tests (XSS)

#### 1.1 Manuelle XSS-Payloads in der Oberfläche
1. **Modell / Marke / Beschreibung**
   - Als Admin ein neues Asset anlegen oder ein bestehendes bearbeiten.
   - In **Marke** oder **Modell** oder **Beschreibung** einen typischen XSS-String eintragen, z. B.:
     - `<script>alert('XSS')</script>`
     - `<img src=x onerror="alert('XSS')">`
     - `"><script>alert(1)</script>`
   - Speichern und prüfen:
     - In der Asset-Liste und in der Asset-Detailansicht soll **nur der eingegebene Text** erscheinen, **kein** Pop-up und **kein** ausgeführtes Script.
     - Der Text kann mit `< > " ' &` angezeigt werden (z. B. „&lt;script&gt;…”), wichtig ist: **keine Ausführung**.

2. **Organisationsname**
   - Nur mit Super-Admin sinnvoll testbar: Organisation anlegen/bearbeiten und als Namen z. B. `"><img src=x onerror=alert(1)>` eintragen.
   - Nach Speichern: Im Header/Organisation-Dropdown soll nur dieser Text erscheinen, **kein** Alert.

3. **Benutzername / Anzeigename**
   - Einen User anlegen oder Profil so ändern, dass der Anzeigename einen XSS-String enthält (z. B. `<script>alert(1)</script>`).
   - Prüfen: In der Navigation, in der User-Verwaltung und überall, wo der Name erscheint, wird er nur als Text gerendert, **kein** Script.

#### 1.2 QR-Druck (QRCodeDisplay)
1. Ein Asset mit Marke/Modell öffnen, das z. B. so aussieht:  
   Marke `Test`, Modell `"><img src=x onerror=alert(1)>`.
2. Auf den Tab „QR“ gehen und **Drucken** wählen.
3. **Erwartung:**  
   - In der Druckvorschau erscheinen nur die Zeichen (evtl. escaped), **kein** ausgeführtes Script, **kein** Alert.

#### 1.3 Kurz-Checkliste XSS
- [ ] Asset Marke/Modell/Beschreibung mit `<script>…</script>` → nur Text, kein Alert
- [ ] Organisationsname mit `onerror=alert(1)` → nur Text
- [ ] Benutzername mit HTML/JS → nur Text
- [ ] QR-Druck mit bösartigem Modell-String → nur Text in der Druckansicht, kein Script

---

## 2. Import/Export – Fehlerbehandlung, Timeout, Nutzer-Feedback

### Ziel
Kein endloser Spinner; bei Fehlern und bei Timeout klare Meldungen und sauberer Abbruch.

### Was wurde umgesetzt
- **Import – Validierung:** Timeout 15 s beim CSV-Lesen/Validieren. Bei Timeout/Fehler: Fehlermeldung im Modal (roter Banner), kein stilles Hängen.
- **Import – Durchführung:** Gesamt-Timeout 5 Min. Beim Timeout: Abbruch, Meldung „Import abgebrochen: Zeitüberschreitung (5 Min.)…“, Anzeige des Fortschritts (erfolgreich/fehlgeschlagen) und Übergabe an `onImportComplete`.
- **Export:** Jeder Export (Assets, Ausleihen, Wartungen) läuft mit try/catch und 60 s Timeout; bei Fehler/Timeout: Fehlermeldung im Modal und optional per Toast (`onShowNotification`), Buttons zeigen „Exportiere…“ und sind während des Exports deaktiviert.

### Tests (Import)

#### 2.1 Import – Normalfall
1. Gültige CSV mit wenigen Zeilen (z. B. aus dem Voll-Template) hochladen.
2. **Erwartung:** Vorschau erscheint, „Import starten“ führt durch, Fortschritt und „Import abgeschlossen“ mit korrekten Erfolgs-/Fehlerzahlen.

#### 2.2 Import – Fehlerfall Validierung
1. Sehr große CSV oder eine Datei, die das Parsen stark verlangsamt (ggf. mit vielen Spalten/Zeilen), hochladen.
2. **Erwartung:**  
   - Läuft die Validierung länger als 15 s, erscheint eine Fehlermeldung (z. B. „Validierung wurde nach 15 Sekunden abgebrochen.“).  
   - Kein Spinner ohne Ende.
3. Zusätzlich: Kaputte CSV (z. B. unvollständige Anführungszeichen, falsche Kodierung).  
   **Erwartung:** Klare Fehlermeldung im roten Banner, kein Crash.

#### 2.3 Import – Timeout beim Importieren
1. Im Code den Gesamt-Timeout für den Test auf z. B. 30 Sekunden stellen (in `ImportModal.tsx`: `IMPORT_OVERALL_TIMEOUT_MS = 30000`), oder einen sehr großen Datensatz verwenden.
2. Import starten und warten, bis der Timeout greift.
3. **Erwartung:**  
   - Nach Ablauf: Meldung wie „Import abgebrochen: Zeitüberschreitung (5 Min.). …“ (bzw. die eingestellte Dauer).  
   - Schritt wechselt zu „Import abgeschlossen“, bereits importierte Anzahlen (erfolgreich/fehlgeschlagen) sind sichtbar.

#### 2.4 Import – Fehlermeldung schließen / Zurück
1. Fehler auslösen (z. B. ungültige CSV).  
2. **Erwartung:** Roter Banner mit Schließen-Button (×); nach Klick verschwindet die Meldung.  
3. Von „Vorschau“ auf „Zurück“ gehen.  
4. **Erwartung:** Keine alte Fehlermeldung mehr vom vorherigen Lauf.

### Tests (Export)

#### 2.5 Export – Normalfall
1. Export-Modal öffnen, z. B. „Assets exportieren“ wählen.
2. **Erwartung:** Kurz „Exportiere…“, dann Download der CSV und Schließen des Modals; optional Toast „Assets wurden exportiert.“

#### 2.6 Export – Fehler/Timeout (falls testbar)
1. Sehr viele Assets laden (oder im Test den Export künstlich verzögern).
2. **Erwartung:**  
   - Wird der 60 s-Timeout überschritten: Fehlermeldung im Modal (und ggf. Toast), kein andauernder Spinner.  
   - Bei anderen Fehlern (z. B. Speicher): Klare Meldung im Modal.

#### 2.7 Kurz-Checkliste Import/Export
- [ ] CSV-Validierung bricht nach 15 s mit Meldung ab
- [ ] Import bricht nach Gesamt-Timeout mit Meldung und Abschluss-Anzeige ab
- [ ] Fehler beim Import erscheinen im Modal (roter Banner)
- [ ] Export zeigt während des Exports „Exportiere…“ und deaktivierte Buttons
- [ ] Export-Fehler erscheinen im Modal (und optional als Toast)

---

## 3. Session / Reload – kein Endlos-Laden, Redirect bei ungültiger Session

### Ziel
Bei fehlender oder ungültiger Session nicht ewig im Ladezustand bleiben, sondern z. B. nach Timeout die Login-Seite anzeigen.

### Was wurde umgesetzt
- **App.tsx:** Beim Start wird `getCurrentUser()` mit einem **Timeout von 12 Sekunden** per `Promise.race` ausgeführt.  
- Läuft der Auth-Check länger als 12 s (z. B. Netzwerk hängt, Supabase antwortet nicht), gilt die Session als nicht verfügbar: Ladezustand wird beendet, Nutzerdaten werden geleert, die **Login-Ansicht** wird angezeigt.

### Tests (Session)

#### 3.1 Normalfall – eingeloggt, Reload
1. Einloggen, App nutzen.
2. Seite neu laden (F5 / Reload).
3. **Erwartung:** Kurz „Lade…“, dann wieder die eingeloggte Ansicht. **Kein** dauerhafter Spinner.

#### 3.2 Normalfall – ausgeloggt
1. Ausloggen oder in einem anderen Tab die Session bei Supabase entfernen/invalidieren.
2. Seite neu laden oder App erneut öffnen.
3. **Erwartung:** Kurz „Lade…“, dann **Login-Maske**. **Kein** Endlos-Spinner.

#### 3.3 Auth-Check-Timeout (künstlich provozieren)
1. In den Developer Tools (F12) unter „Network“ die Verbindung drosseln (z. B. „Slow 3G“) oder in `lib/supabaseClient.ts` / Auth-Service temporär eine Verzögerung einbauen, sodass `getCurrentUser()` bzw. `loadUserWithOrganizations` länger als 12 s braucht.
2. App im „nicht eingeloggt“-Zustand öffnen (z. B. Cache leeren, in einem privaten Fenster öffnen) und neu laden.
3. **Erwartung:** Nach höchstens etwa 12 Sekunden erscheint die **Login-Seite**, in der Konsole ggf. „Auth-Check Timeout – zeige Login.“. **Kein** Spinner, der dauerhaft bleibt.

#### 3.4 Service Worker / Cache (optional)
1. PWA bereits installiert bzw. SW aktiv.
2. Einloggen, dann Session serverseitig oder im Storage invalidieren.
3. Seite neu laden.
4. **Erwartung:** Spätestens nach dem Auth-Check-Timeout (12 s) erscheint die Login-Seite.  
   Falls du Caching-Probleme vermutest: im Application-Tab „Clear storage“ / „Cache leeren“ und erneut testen.

#### 3.5 Kurz-Checkliste Session
- [ ] Reload bei gültiger Session → kurz Ladeanzeige, dann normaler Inhalt
- [ ] Reload ohne Session → kurz Ladeanzeige, dann Login
- [ ] Auth-Check dauert > 12 s → Login wird angezeigt, kein Endlos-Spinner

---

## 4. Übersicht der geänderten Dateien (Phase 1)

| Datei | Änderung |
|-------|----------|
| `lib/sanitize.ts` | Neu: `escapeHtml()` für sichere HTML-Ausgabe |
| `components/QRCodeDisplay.tsx` | `brand`, `model`, `value` vor innerHTML mit `escapeHtml()` escapen |
| `App.tsx` | Auth-Initial-Check mit 12 s Timeout, bei Timeout Login anzeigen; `ExportModal` erhält `onShowNotification` |
| `components/ImportModal.tsx` | Timeout Validierung 15 s, Gesamt-Timeout Import 5 Min., Fehler-Banner, Abschluss bei Timeout |
| `components/ExportModal.tsx` | Try/catch, 60 s Timeout, Loading-Zustand, Fehler im Modal und optional via `onShowNotification` |

---

## 5. Typische Test-Umgebung

- **Browser:** Chrome/Edge oder Firefox, DevTools offen (Console + Network).
- **Supabase:** Lokal oder Projekt-URL; ggf. „Slow 3G“ oder Throttling für Timeout-Tests.
- **Account:** Admin bzw. Super-Admin für Import/Export und Organisations-/Nutzer-Tests; ggf. zweiten Nutzer für Namens-XSS-Tests.

Wenn du jeden Abschnitt (XSS, Import/Export, Session) anhand dieser Schritte durchgehst, bist du bei der Prüfung von Phase 1 auf der sicheren Seite.
