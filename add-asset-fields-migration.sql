-- ============================================================
-- Migration: Erweiterte Asset-Felder hinzufügen
-- ============================================================
-- Diese Migration fügt alle neuen Felder aus ASSET_FIELDS_PROPOSAL.md hinzu
-- ============================================================

-- ============================================================
-- ALLGEMEINE FELDER (für alle Asset-Typen)
-- ============================================================

-- Beschreibung & Details
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS tags TEXT[]; -- Array von Tags

-- Standort & Organisation
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS location TEXT; -- Standort
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS department TEXT; -- Abteilung
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS cost_center TEXT; -- Kostenstelle
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES public.profiles(id); -- Verantwortlicher

-- Finanzen
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2); -- Anschaffungspreis
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS purchase_date DATE; -- Anschaffungsdatum (genauer als purchase_year)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS residual_value DECIMAL(10,2); -- Restwert
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS depreciation_years INTEGER; -- Abschreibungsdauer
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS supplier TEXT; -- Lieferant
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS invoice_number TEXT; -- Rechnungsnummer

-- Dokumente (Boolean-Flags)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_invoice BOOLEAN DEFAULT false; -- Rechnung vorhanden
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_warranty_certificate BOOLEAN DEFAULT false; -- Garantieschein vorhanden
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_manual BOOLEAN DEFAULT false; -- Bedienungsanleitung vorhanden

-- Status & Verfügbarkeit
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS available_from DATE; -- Verfügbar ab
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS reserved_for_user_id UUID REFERENCES public.profiles(id); -- Reserviert für
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS is_decommissioned BOOLEAN DEFAULT false; -- Ausgemustert
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS decommissioned_date DATE; -- Ausmusterungsdatum
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS decommissioned_reason TEXT; -- Ausmusterungsgrund

-- ============================================================
-- FAHRZEUGE-SPEZIFISCHE FELDER
-- ============================================================

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS vin TEXT; -- Fahrgestellnummer (VIN)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS vehicle_registration_number TEXT; -- Fahrzeugbrief-Nr.
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS first_registration_date DATE; -- Erstzulassung
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS vehicle_class TEXT; -- Fahrzeugklasse (Pkw, Lkw, Transporter, etc.)

-- Technische Daten
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS engine_displacement TEXT; -- Hubraum (z.B. "2000 ccm")
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS power TEXT; -- Leistung (z.B. "150 PS" oder "110 kW")
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS fuel_type TEXT; -- Kraftstoff (Benzin, Diesel, Elektro, Hybrid, etc.)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS transmission TEXT; -- Getriebe (Manuell, Automatik)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS mileage INTEGER; -- Kilometerstand

-- Versicherung & Zulassung
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS insurance_company TEXT; -- Versicherungsgesellschaft
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS insurance_number TEXT; -- Versicherungsnummer
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS insurance_until DATE; -- Versicherung bis
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS vehicle_tax_monthly DECIMAL(10,2); -- KFZ-Steuer (monatlich)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS registration_authority TEXT; -- Zulassungsbehörde

-- Dokumente & Zertifikate
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_vehicle_registration BOOLEAN DEFAULT false; -- Fahrzeugschein vorhanden
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_vehicle_title BOOLEAN DEFAULT false; -- Fahrzeugbrief vorhanden
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_service_book BOOLEAN DEFAULT false; -- Serviceheft vorhanden

-- ============================================================
-- MASCHINEN-SPEZIFISCHE FELDER
-- ============================================================

-- Identifikation
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS serial_number TEXT; -- Seriennummer (auch für Werkzeuge)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS manufacturer_number TEXT; -- Hersteller-Nr.
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS type_designation TEXT; -- Typbezeichnung

-- Technische Daten
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS machine_power TEXT; -- Leistung (z.B. "5 kW" oder "7 PS")
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS weight TEXT; -- Gewicht (z.B. "250 kg")
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS dimensions TEXT; -- Abmessungen (Länge x Breite x Höhe)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS voltage TEXT; -- Spannung (z.B. "230V" oder "400V")
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS current_consumption TEXT; -- Stromverbrauch (z.B. "15 A")
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS operating_pressure TEXT; -- Betriebsdruck
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS rpm TEXT; -- Drehzahl

-- Zertifikate & Prüfungen
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_ce_marking BOOLEAN DEFAULT false; -- CE-Kennzeichnung
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_gs_marking BOOLEAN DEFAULT false; -- GS-Zeichen
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS last_uvv_inspection DATE; -- Letzte UVV-Prüfung
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS next_uvv_inspection DATE; -- Nächste UVV-Prüfung
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS has_inspection_report BOOLEAN DEFAULT false; -- Prüfbericht vorhanden

-- ============================================================
-- WERKZEUGE-SPEZIFISCHE FELDER
-- ============================================================

-- Identifikation (serial_number wird oben bereits hinzugefügt)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS article_number TEXT; -- Artikelnummer
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS model_number TEXT; -- Modellnummer

-- Technische Daten
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS size TEXT; -- Größe/Größen (z.B. "10mm", "1/2 Zoll", "M8-M12")
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS material TEXT; -- Material (z.B. "Chrom-Vanadium", "Edelstahl")
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS tool_power TEXT; -- Leistung (für Elektrowerkzeuge)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS tool_voltage TEXT; -- Spannung (für Elektrowerkzeuge)

-- Zertifikate
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS requires_calibration BOOLEAN DEFAULT false; -- Kalibrierung erforderlich
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS last_calibration DATE; -- Letzte Kalibrierung
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS next_calibration DATE; -- Nächste Kalibrierung

-- Standort & Nutzung
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS tool_box_set TEXT; -- Werkzeugkasten/Set

-- ============================================================
-- INDEXES für bessere Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_assets_location ON public.assets(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_department ON public.assets(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_cost_center ON public.assets(cost_center) WHERE cost_center IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_responsible_user ON public.assets(responsible_user_id) WHERE responsible_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON public.assets(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_vin ON public.assets(vin) WHERE vin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_tags ON public.assets USING GIN(tags) WHERE tags IS NOT NULL;

-- ============================================================
-- KOMMENTARE für Dokumentation
-- ============================================================

COMMENT ON COLUMN public.assets.description IS 'Beschreibung des Assets (Freitext)';
COMMENT ON COLUMN public.assets.notes IS 'Interne Notizen';
COMMENT ON COLUMN public.assets.tags IS 'Schlagwörter für Suche';
COMMENT ON COLUMN public.assets.location IS 'Standort des Assets';
COMMENT ON COLUMN public.assets.department IS 'Abteilung';
COMMENT ON COLUMN public.assets.cost_center IS 'Kostenstelle für Buchhaltung';
COMMENT ON COLUMN public.assets.responsible_user_id IS 'Verantwortlicher User';
COMMENT ON COLUMN public.assets.purchase_price IS 'Anschaffungspreis';
COMMENT ON COLUMN public.assets.purchase_date IS 'Anschaffungsdatum (genauer als purchase_year)';
COMMENT ON COLUMN public.assets.residual_value IS 'Restwert';
COMMENT ON COLUMN public.assets.supplier IS 'Lieferant';
COMMENT ON COLUMN public.assets.vin IS 'Fahrgestellnummer (VIN) für Fahrzeuge';
COMMENT ON COLUMN public.assets.mileage IS 'Kilometerstand für Fahrzeuge';
COMMENT ON COLUMN public.assets.serial_number IS 'Seriennummer für Maschinen und Werkzeuge';
