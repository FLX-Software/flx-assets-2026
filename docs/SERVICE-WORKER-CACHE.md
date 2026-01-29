# Service Worker & Cache – Troubleshooting

## Änderungen (v4)

- **HTML/Dokument** wird nicht mehr gecacht → immer frisch nach Deploy
- **API/Supabase** werden mit `credentials` durchgereicht, nie gecacht
- **Navigation Preload** aktiviert → schnellerer First Load
- **Auth-Timeout** auf 18s erhöht (SW kann erste Requests verzögern)

## Bei Cache-Problemen: Manuell leeren

### Chrome / Edge
1. `F12` → **Application** (Anwendung)
2. Links: **Storage** → **Clear site data** (Website-Daten löschen)
3. Oder: **Service Workers** → **Unregister** beim Eintrag
4. Seite hart neu laden: `Strg+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

### Firefox
1. `F12` → **Storage** (Speicher)
2. Rechtsklick auf die Domain → **Delete All**
3. Oder: **Service Workers** → **Unregister**
4. Hart neu laden: `Strg+Shift+R`

### Safari (iOS)
1. **Einstellungen** → **Safari** → **Verlauf und Websitedaten löschen**
2. Oder: **Erweitert** → **Website-Daten** → Eintrag löschen

## Nach Deploy

Nach einem neuen Deployment wird der SW automatisch aktualisiert (`updateViaCache: 'none'`). Bei Problemen: Cache manuell leeren (siehe oben).
