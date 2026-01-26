# Export/Import Implementierungsplan

## 🎯 Übersicht

### Export
- **CSV-Export**: Assets, Loans, Maintenance-Events
- **Excel-Export**: Optional (mit Bibliothek wie `xlsx`)
- **Intelligente Spalten**: Nur relevante Felder je Asset-Typ

### Import
- **CSV-Import**: Bulk-Erstellung von Assets
- **Template-Download**: Vorlage mit allen möglichen Spalten
- **Validierung**: Vor dem Import mit Preview
- **Fehlerbehandlung**: Zeile-für-Zeile mit detailliertem Feedback

---

## 📋 Export-Strategie

### 1. CSV-Export für Assets

**Spalten-Struktur:**
```
Basis-Felder (immer):
- QR-Code
- Marke
- Modell
- Kategorie (Fahrzeug/Maschine/Werkzeug)
- Zustand (1-5)
- Kaufjahr
- Garantie bis
- Wartungsintervall (Monate)
- Status (available/loaned)
- Kennzeichen (nur wenn Fahrzeug)

Allgemeine Felder (optional):
- Beschreibung
- Notizen
- Tags (komma-separiert)
- Standort
- Abteilung
- Kostenstelle
- Anschaffungspreis
- Anschaffungsdatum
- Restwert
- Lieferant
- Rechnungsnummer

Fahrzeug-spezifisch (nur wenn Kategorie = Fahrzeug):
- VIN
- Erstzulassung
- Fahrzeugklasse
- Hubraum
- Leistung
- Kraftstoff
- Getriebe
- Kilometerstand
- Versicherungsgesellschaft
- Versicherungsnummer
- Versicherung bis
- KFZ-Steuer
- Zulassungsbehörde

Maschine-spezifisch (nur wenn Kategorie = Maschine):
- Seriennummer
- Hersteller-Nr.
- Typbezeichnung
- Leistung
- Gewicht
- Abmessungen
- Spannung
- Letzte UVV-Prüfung
- Nächste UVV-Prüfung

Werkzeug-spezifisch (nur wenn Kategorie = Werkzeug):
- Seriennummer
- Artikelnummer
- Modellnummer
- Größe
- Material
- Werkzeugkasten/Set
- Letzte Kalibrierung
- Nächste Kalibrierung

Boolean-Felder (Ja/Nein):
- Rechnung vorhanden
- Garantieschein vorhanden
- Bedienungsanleitung vorhanden
- CE-Kennzeichnung
- GS-Zeichen
- etc.
```

**Implementierung:**
- Service-Funktion: `exportAssetsToCSV(assets: Asset[])`
- Nutzt `papaparse` oder native CSV-Generierung
- UTF-8 BOM für Excel-Kompatibilität

### 2. CSV-Export für Loans

**Spalten:**
- Asset QR-Code
- Asset Marke
- Asset Modell
- Benutzer (Name)
- Ausgabe-Datum
- Rückgabe-Datum
- Notizen

### 3. CSV-Export für Maintenance

**Spalten:**
- Asset QR-Code
- Asset Marke
- Asset Modell
- Datum
- Beschreibung
- Durchgeführt von
- Kosten

---

## 📥 Import-Strategie

### Herausforderung: Viele optionale Felder

**Lösung: Flexible Spalten-Mapping**

### 1. Template-Download

**Zwei Varianten:**
- **Minimal-Template**: Nur Pflichtfelder (Marke, Modell, QR-Code, Kategorie)
- **Vollständiges Template**: Alle möglichen Spalten mit Beispiel-Daten

**Spalten-Namen:**
- Deutsche Namen (z.B. "Marke", "Modell")
- Englische Namen (z.B. "Brand", "Model")
- Flexible Mapping (z.B. "Hersteller" → "Marke")

### 2. Import-Prozess

**Schritt 1: Datei-Upload**
- CSV-Datei auswählen
- Encoding-Erkennung (UTF-8, Windows-1252, etc.)

**Schritt 2: Parsing & Mapping**
- CSV parsen mit `papaparse`
- Spalten-Header erkennen
- Mapping zu Asset-Feldern (flexibel)
- Beispiel-Mapping:
  ```
  "Marke" → brand
  "Hersteller" → brand
  "Brand" → brand
  "Fahrzeugklasse" → vehicleClass (nur wenn type = VEHICLE)
  ```

**Schritt 3: Validierung**
- Pflichtfelder prüfen (Marke, Modell, QR-Code)
- Datentyp-Validierung (Zahlen, Datum, Boolean)
- Asset-Typ-spezifische Validierung
- Duplikat-Prüfung (QR-Code bereits vorhanden?)

**Schritt 4: Preview-Modal**
- Zeigt alle Assets, die importiert werden
- Markiert Fehler (rot) und Warnungen (gelb)
- Zeigt Mapping-Ergebnisse
- Erlaubt manuelle Korrekturen

**Schritt 5: Batch-Import**
- Importiert Assets in Batches (z.B. 10-20 pro Batch)
- Zeigt Fortschritt
- Sammelt Fehler pro Zeile
- Erstellt Fehler-Report

### 3. Fehlerbehandlung

**Fehler-Typen:**
- **Kritisch**: Import wird abgebrochen (z.B. ungültige Organisation)
- **Zeilen-Fehler**: Nur diese Zeile wird übersprungen
- **Warnungen**: Import läuft weiter, aber mit Warnung

**Fehler-Report:**
- CSV mit Fehlern exportieren
- Zeigt Zeilennummer + Fehlermeldung
- Erlaubt Korrektur und Re-Import

---

## 🛠️ Technische Umsetzung

### Bibliotheken

**Option 1: Papaparse (empfohlen)**
```bash
npm install papaparse
npm install @types/papaparse
```
- Sehr gut für CSV-Parsing
- Encoding-Erkennung
- Streaming für große Dateien

**Option 2: ExcelJS (für Excel)**
```bash
npm install exceljs
```
- Für Excel-Import/Export
- Komplexer, aber mächtiger

### Service-Struktur

```
services/
  exportService.ts
    - exportAssetsToCSV()
    - exportLoansToCSV()
    - exportMaintenanceToCSV()
    - exportToExcel() (optional)

  importService.ts
    - parseCSVFile()
    - mapColumnsToFields()
    - validateAssetRow()
    - importAssetsBatch()
    - generateErrorReport()
```

### UI-Komponenten

```
components/
  ExportModal.tsx
    - Dropdown: Assets/Loans/Maintenance
    - Button: CSV/Excel exportieren
    - Filter-Optionen (optional)

  ImportModal.tsx
    - Datei-Upload
    - Template-Download
    - Preview-Tabelle
    - Validierungs-Feedback
    - Import-Button
    - Fortschrittsanzeige
```

---

## 📝 CSV-Format Details

### Encoding
- UTF-8 mit BOM für Excel-Kompatibilität
- Semikolon als Trennzeichen (deutsches Excel)
- Oder Komma (international)

### Datum-Format
- ISO 8601: `YYYY-MM-DD`
- Oder deutsches Format: `DD.MM.YYYY`
- Beide unterstützen

### Boolean-Werte
- `true/false`
- `Ja/Nein`
- `1/0`
- `✓/✗`

### Tags
- Komma-separiert: `tag1, tag2, tag3`
- Oder Semikolon (wenn Komma als Trennzeichen)

### Leere Werte
- Leere Zellen = `null` (optionales Feld)
- `-` oder `N/A` = explizit leer

---

## 🎨 UI/UX Überlegungen

### Export
- Button im Admin-Dashboard
- Dropdown: "Export → Assets CSV", "Export → Loans CSV", etc.
- Direkter Download

### Import
- Button im Admin-Dashboard: "Import → Assets"
- Modal öffnet sich
- Schritt-für-Schritt-Wizard:
  1. Datei auswählen oder Template downloaden
  2. Preview & Validierung
  3. Import bestätigen
  4. Fortschritt & Ergebnis

### Feedback
- Erfolgreich importiert: Grüne Nachricht
- Fehler: Rote Nachricht mit Details
- Warnungen: Gelbe Nachricht
- Fehler-Report als CSV downloadbar

---

## 🔄 Workflow-Beispiel

### Export
1. Admin klickt "Export → Assets CSV"
2. System generiert CSV mit allen Assets
3. Datei wird heruntergeladen: `assets_export_2026-01-23.csv`

### Import
1. Admin klickt "Import → Assets"
2. Modal öffnet sich
3. Admin lädt Template herunter (optional)
4. Admin füllt Template aus
5. Admin lädt CSV hoch
6. System parst und validiert
7. Preview zeigt: "50 Assets gefunden, 2 Fehler"
8. Admin korrigiert Fehler (optional)
9. Admin klickt "Importieren"
10. System importiert in Batches
11. Ergebnis: "48 Assets erfolgreich importiert, 2 Fehler"
12. Fehler-Report als CSV downloadbar

---

## ⚠️ Besondere Herausforderungen

### 1. Viele optionale Felder
**Lösung**: 
- Flexible Spalten-Mapping
- Asset-Typ-spezifische Validierung
- Ignoriere unbekannte Spalten

### 2. Asset-Typ-spezifische Felder
**Lösung**:
- Validiere nur relevante Felder je Asset-Typ
- Warnung wenn Fahrzeug-Feld bei Maschine vorhanden

### 3. Duplikate
**Lösung**:
- Prüfe QR-Code auf Duplikate
- Option: Überschreiben oder Überspringen

### 4. Performance bei großen Imports
**Lösung**:
- Batch-Import (10-20 Assets pro Batch)
- Progress-Bar
- Background-Processing (optional)

### 5. Encoding-Probleme
**Lösung**:
- Auto-Encoding-Erkennung
- UTF-8 als Standard
- Warnung bei Encoding-Problemen

---

## 🚀 Implementierungs-Reihenfolge

### Phase 1: Export (einfacher)
1. ✅ CSV-Export für Assets
2. ✅ CSV-Export für Loans
3. ✅ CSV-Export für Maintenance
4. ✅ UI: Export-Button im Admin-Dashboard

### Phase 2: Import (komplexer)
1. ✅ Template-Download
2. ✅ CSV-Parsing
3. ✅ Spalten-Mapping
4. ✅ Validierung
5. ✅ Preview-Modal
6. ✅ Batch-Import
7. ✅ Fehlerbehandlung
8. ✅ UI: Import-Modal

---

## 💡 Erweiterte Features (später)

- **Excel-Import/Export**: Mit Formatierung
- **Inkrementeller Import**: Nur neue/geänderte Assets
- **Mapping-Speicherung**: Gespeicherte Spalten-Mappings
- **Scheduled Exports**: Automatische Exports
- **Import-Historie**: Log aller Imports

---

## 📦 Dependencies

```json
{
  "papaparse": "^5.4.1",
  "@types/papaparse": "^5.3.14"
}
```

Optional:
```json
{
  "exceljs": "^4.4.0"
}
```
