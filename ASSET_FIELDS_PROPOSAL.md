# Asset-Datenfelder: Vorschläge für Erweiterung

## 📊 Aktuelle Felder

### Basis-Informationen
- ✅ Marke (brand)
- ✅ Modell (model)
- ✅ Kategorie (type: Fahrzeug, Maschine, Werkzeug)
- ✅ Zustand (condition: 1-5)
- ✅ Bild (imageUrl)
- ✅ QR-Code (qrCode)

### Kauf & Garantie
- ✅ Kaufjahr (purchaseYear)
- ✅ Garantie bis (warrantyUntil)

### Wartung
- ✅ Letzte Wartung (lastMaintenance)
- ✅ Nächste Wartung (nextMaintenance)
- ✅ Wartungsintervall (maintenanceIntervalMonths)
- ✅ Reparatur-Historie (repairHistory)

### Fahrzeuge-spezifisch
- ✅ Kennzeichen (licensePlate)
- ✅ TÜV/AU (lastUvv, nextTuev)

---

## 🚗 Vorschläge: Fahrzeuge

### Identifikation
- **Fahrgestellnummer (VIN)** - Eindeutige Identifikation
- **Fahrzeugbrief-Nr.** - Für Dokumentation
- **Erstzulassung** - Datum der ersten Zulassung
- **Fahrzeugklasse** - Pkw, Lkw, Transporter, etc.

### Technische Daten
- **Hubraum** - z.B. "2000 ccm"
- **Leistung** - z.B. "150 PS" oder "110 kW"
- **Kraftstoff** - Benzin, Diesel, Elektro, Hybrid, etc.
- **Getriebe** - Manuell, Automatik
- **Kilometerstand** - Aktueller Stand (wird bei jeder Wartung aktualisiert)

### Versicherung & Zulassung
- **Versicherungsgesellschaft** - Name der Versicherung
- **Versicherungsnummer** - Polizzennummer
- **Versicherung bis** - Ablaufdatum
- **KFZ-Steuer** - Monatlicher Betrag
- **Zulassungsbehörde** - Wo zugelassen

### Dokumente & Zertifikate
- **Fahrzeugschein vorhanden** - Boolean
- **Fahrzeugbrief vorhanden** - Boolean
- **Serviceheft vorhanden** - Boolean

### Kosten
- **Anschaffungspreis** - Kaufpreis
- **Restwert** - Aktueller Wert
- **Kostenstelle** - Für Buchhaltung

---

## ⚙️ Vorschläge: Maschinen

### Identifikation
- **Seriennummer** - Eindeutige Identifikation
- **Hersteller-Nr.** - Interne Nummer des Herstellers
- **Typbezeichnung** - Offizielle Typbezeichnung

### Technische Daten
- **Leistung** - z.B. "5 kW" oder "7 PS"
- **Gewicht** - z.B. "250 kg"
- **Abmessungen** - Länge x Breite x Höhe
- **Spannung** - z.B. "230V" oder "400V"
- **Stromverbrauch** - z.B. "15 A"
- **Betriebsdruck** - Für Druckluftgeräte
- **Drehzahl** - Für Motoren

### Zertifikate & Prüfungen
- **CE-Kennzeichnung** - Boolean
- **GS-Zeichen** - Boolean
- **Letzte UVV-Prüfung** - Unfallverhütungsvorschrift
- **Nächste UVV-Prüfung** - Fälligkeitsdatum
- **Prüfbericht vorhanden** - Boolean

### Standort & Nutzung
- **Standort** - Wo steht die Maschine?
- **Abteilung** - Welche Abteilung nutzt sie?
- **Verantwortlicher** - Wer ist verantwortlich?

### Kosten
- **Anschaffungspreis** - Kaufpreis
- **Restwert** - Aktueller Wert
- **Kostenstelle** - Für Buchhaltung

---

## 🔧 Vorschläge: Werkzeuge

### Identifikation
- **Seriennummer** - Eindeutige Identifikation
- **Artikelnummer** - Hersteller-Artikelnummer
- **Modellnummer** - Modellbezeichnung

### Technische Daten
- **Größe/Größen** - z.B. "10mm", "1/2 Zoll", "M8-M12"
- **Material** - z.B. "Chrom-Vanadium", "Edelstahl"
- **Leistung** - Für Elektrowerkzeuge
- **Spannung** - Für Elektrowerkzeuge

### Zertifikate
- **CE-Kennzeichnung** - Boolean
- **GS-Zeichen** - Boolean
- **Kalibrierung erforderlich** - Boolean
- **Letzte Kalibrierung** - Datum
- **Nächste Kalibrierung** - Fälligkeitsdatum

### Standort & Nutzung
- **Standort** - Wo liegt das Werkzeug?
- **Werkzeugkasten/Set** - Zu welchem Set gehört es?
- **Verantwortlicher** - Wer ist verantwortlich?

### Kosten
- **Anschaffungspreis** - Kaufpreis
- **Restwert** - Aktueller Wert
- **Kostenstelle** - Für Buchhaltung

---

## 📋 Allgemeine Felder (für alle Asset-Typen)

### Beschreibung & Details
- **Beschreibung** - Freitext für zusätzliche Infos
- **Notizen** - Interne Notizen
- **Tags** - Schlagwörter für Suche (z.B. "winterreifen", "elektrisch")

### Standort & Organisation
- **Standort** - Wo befindet sich das Asset?
- **Abteilung** - Welche Abteilung nutzt es?
- **Kostenstelle** - Für Buchhaltung
- **Verantwortlicher** - Wer ist verantwortlich?

### Finanzen
- **Anschaffungspreis** - Kaufpreis
- **Anschaffungsdatum** - Genauer Kaufdatum (nicht nur Jahr)
- **Restwert** - Aktueller Wert
- **Abschreibungsdauer** - Jahre
- **Lieferant** - Von wem gekauft?
- **Rechnungsnummer** - Für Nachverfolgung

### Dokumente
- **Rechnung vorhanden** - Boolean
- **Garantieschein vorhanden** - Boolean
- **Bedienungsanleitung vorhanden** - Boolean
- **Dokumente** - Array von Dokument-URLs (PDFs, etc.)

### Status & Verfügbarkeit
- **Verfügbar ab** - Wann wird es wieder verfügbar?
- **Reserviert für** - Wer hat es reserviert?
- **Ausgemustert** - Boolean (nicht mehr in Nutzung)
- **Ausmusterungsdatum** - Wann ausgemustert?
- **Ausmusterungsgrund** - Warum ausgemustert?

---

## 🎯 Priorisierung

### Phase 1: Wichtigste Felder (sofort)
1. **Beschreibung** - Für alle Assets
2. **Anschaffungspreis** - Für alle Assets
3. **Standort** - Für alle Assets
4. **Seriennummer** - Für Maschinen & Werkzeuge
5. **Fahrgestellnummer (VIN)** - Für Fahrzeuge
6. **Kilometerstand** - Für Fahrzeuge (wichtig für Wartung)

### Phase 2: Sehr nützlich
7. **Kostenstelle** - Für Buchhaltung
8. **Verantwortlicher** - Für alle Assets
9. **Abteilung** - Für Organisation
10. **Lieferant** - Für Nachbestellung
11. **Anschaffungsdatum** - Genauer als nur Jahr
12. **Restwert** - Für Bilanzierung

### Phase 3: Nice-to-have
13. **Tags** - Für erweiterte Suche
14. **Notizen** - Interne Notizen
15. **Dokumente** - PDF-Upload
16. **Technische Details** - Je nach Asset-Typ spezifisch

---

## 💡 Implementierungs-Vorschlag

### Option A: Flexible JSON-Spalte
- Eine `metadata` JSONB-Spalte in der Datenbank
- Frontend kann beliebige Felder hinzufügen
- Sehr flexibel, aber weniger strukturiert

### Option B: Erweiterte Spalten
- Neue Spalten für wichtige Felder
- Strukturiert, aber weniger flexibel
- Empfohlen für Phase 1 & 2

### Option C: Hybrid
- Wichtige Felder als Spalten (Phase 1 & 2)
- Zusätzliche Felder in JSON (Phase 3)

---

## 📝 Nächste Schritte

1. **Welche Felder sind für dich am wichtigsten?**
2. **Soll ich mit Phase 1 starten?**
3. **Welche Asset-Typen nutzt ihr am meisten?** (Fahrzeuge, Maschinen, Werkzeuge)

Sag mir Bescheid, welche Felder du priorisieren möchtest, dann implementiere ich sie!
