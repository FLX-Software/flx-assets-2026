import Papa from 'papaparse';
import { Asset, AssetType, AssetTypeLabels } from '../types';

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ImportResult {
  validAssets: Asset[];
  errors: ImportError[];
  warnings: ImportError[];
}

/**
 * Spalten-Mapping: Deutsche/Englische Namen → Asset-Feldnamen
 */
const COLUMN_MAPPING: Record<string, keyof Asset> = {
  // Basis-Felder
  'qr-code': 'qrCode',
  'qr code': 'qrCode',
  'qrcode': 'qrCode',
  'marke': 'brand',
  'brand': 'brand',
  'hersteller': 'brand',
  'modell': 'model',
  'model': 'model',
  'kategorie': 'type',
  'category': 'type',
  'type': 'type',
  'zustand': 'condition',
  'condition': 'condition',
  'kaufjahr': 'purchaseYear',
  'purchase year': 'purchaseYear',
  'garantie bis': 'warrantyUntil',
  'warranty until': 'warrantyUntil',
  'wartungsintervall': 'maintenanceIntervalMonths',
  'maintenance interval': 'maintenanceIntervalMonths',
  'status': 'status',
  'kennzeichen': 'licensePlate',
  'license plate': 'licensePlate',
  // Allgemeine Felder
  'beschreibung': 'description',
  'description': 'description',
  'notizen': 'notes',
  'notes': 'notes',
  'tags': 'tags',
  'standort': 'location',
  'location': 'location',
  'abteilung': 'department',
  'department': 'department',
  'kostenstelle': 'costCenter',
  'cost center': 'costCenter',
  'anschaffungspreis': 'purchasePrice',
  'purchase price': 'purchasePrice',
  'anschaffungsdatum': 'purchaseDate',
  'purchase date': 'purchaseDate',
  'restwert': 'residualValue',
  'residual value': 'residualValue',
  'lieferant': 'supplier',
  'supplier': 'supplier',
  'rechnungsnummer': 'invoiceNumber',
  'invoice number': 'invoiceNumber',
  // Fahrzeug-spezifisch
  'vin': 'vin',
  'fahrgestellnummer': 'vin',
  'fahrzeugbrief-nr': 'vehicleRegistrationNumber',
  'erstzulassung': 'firstRegistrationDate',
  'first registration': 'firstRegistrationDate',
  'fahrzeugklasse': 'vehicleClass',
  'vehicle class': 'vehicleClass',
  'hubraum': 'engineDisplacement',
  'engine displacement': 'engineDisplacement',
  'leistung': 'power',
  'power': 'power',
  'kraftstoff': 'fuelType',
  'fuel type': 'fuelType',
  'getriebe': 'transmission',
  'transmission': 'transmission',
  'kilometerstand': 'mileage',
  'mileage': 'mileage',
  'versicherungsgesellschaft': 'insuranceCompany',
  'insurance company': 'insuranceCompany',
  'versicherungsnummer': 'insuranceNumber',
  'insurance number': 'insuranceNumber',
  'versicherung bis': 'insuranceUntil',
  'insurance until': 'insuranceUntil',
  'kfz-steuer': 'vehicleTaxMonthly',
  'vehicle tax': 'vehicleTaxMonthly',
  'zulassungsbehörde': 'registrationAuthority',
  'registration authority': 'registrationAuthority',
  // Maschine-spezifisch
  'seriennummer': 'serialNumber',
  'serial number': 'serialNumber',
  'hersteller-nr': 'manufacturerNumber',
  'manufacturer number': 'manufacturerNumber',
  'typbezeichnung': 'typeDesignation',
  'type designation': 'typeDesignation',
  'maschine leistung': 'machinePower',
  'machine power': 'machinePower',
  'gewicht': 'weight',
  'weight': 'weight',
  'abmessungen': 'dimensions',
  'dimensions': 'dimensions',
  'spannung': 'voltage',
  'voltage': 'voltage',
  'stromverbrauch': 'currentConsumption',
  'current consumption': 'currentConsumption',
  'betriebsdruck': 'operatingPressure',
  'operating pressure': 'operatingPressure',
  'drehzahl': 'rpm',
  'rpm': 'rpm',
  'letzte uvv-prüfung': 'lastUvvInspection',
  'last uvv inspection': 'lastUvvInspection',
  'nächste uvv-prüfung': 'nextUvvInspection',
  'next uvv inspection': 'nextUvvInspection',
  // Werkzeug-spezifisch
  'artikelnummer': 'articleNumber',
  'article number': 'articleNumber',
  'modellnummer': 'modelNumber',
  'model number': 'modelNumber',
  'größe': 'size',
  'size': 'size',
  'material': 'material',
  'werkzeugkasten': 'toolBoxSet',
  'tool box': 'toolBoxSet',
  'letzte kalibrierung': 'lastCalibration',
  'last calibration': 'lastCalibration',
  'nächste kalibrierung': 'nextCalibration',
  'next calibration': 'nextCalibration',
};

/**
 * Boolean-Feld-Mapping
 */
const BOOLEAN_FIELDS: (keyof Asset)[] = [
  'hasInvoice',
  'hasWarrantyCertificate',
  'hasManual',
  'isDecommissioned',
  'hasVehicleRegistration',
  'hasVehicleTitle',
  'hasServiceBook',
  'hasCeMarking',
  'hasGsMarking',
  'hasInspectionReport',
  'requiresCalibration',
];

/**
 * Parst CSV-Datei und gibt Rohdaten zurück
 */
export function parseCSVFile(file: File): Promise<Papa.ParseResult<any>> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Mappt CSV-Spalten zu Asset-Feldern
 */
function mapColumnToField(columnName: string): keyof Asset | null {
  const normalized = columnName.toLowerCase().trim();
  return COLUMN_MAPPING[normalized] || null;
}

/**
 * Konvertiert String zu AssetType
 */
function parseAssetType(value: string): AssetType | null {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('fahrzeug') || normalized.includes('vehicle')) return AssetType.VEHICLE;
  if (normalized.includes('maschine') || normalized.includes('machine')) return AssetType.MACHINE;
  if (normalized.includes('werkzeug') || normalized.includes('tool')) return AssetType.TOOL;
  return null;
}

/**
 * Konvertiert deutsches Datum (DD.MM.YYYY) zu ISO-String
 */
function parseDateDE(dateString: string): string | null {
  if (!dateString || dateString.trim() === '' || dateString === '-' || dateString === 'N/A') {
    return null;
  }

  // Versuche DD.MM.YYYY
  const deMatch = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (deMatch) {
    const [, day, month, year] = deMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Versuche ISO-Format (YYYY-MM-DD)
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return dateString;
  }

  return null;
}

/**
 * Konvertiert Boolean-String zu Boolean
 */
function parseBoolean(value: string): boolean | null {
  if (!value || value.trim() === '') return null;
  const normalized = value.toLowerCase().trim();
  if (normalized === 'ja' || normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === '✓') {
    return true;
  }
  if (normalized === 'nein' || normalized === 'no' || normalized === 'false' || normalized === '0' || normalized === '✗') {
    return false;
  }
  return null;
}

/**
 * Validiert und konvertiert eine CSV-Zeile zu einem Asset
 */
export function validateAssetRow(
  row: any,
  rowIndex: number,
  existingQRCodes: Set<string>
): { asset: Partial<Asset> | null; errors: ImportError[]; warnings: ImportError[] } {
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];
  const asset: Partial<Asset> = {};

  // Mappe alle Spalten
  Object.keys(row).forEach(columnName => {
    const fieldName = mapColumnToField(columnName);
    if (!fieldName) {
      // Unbekannte Spalte - ignorieren (keine Warnung)
      return;
    }

    const value = row[columnName]?.toString().trim() || '';

    // Spezielle Behandlung für bestimmte Felder
    if (fieldName === 'type') {
      const assetType = parseAssetType(value);
      if (assetType) {
        asset.type = assetType;
      } else if (value) {
        errors.push({
          row: rowIndex + 2, // +2 weil Header + 1-basierte Zeilennummer
          field: columnName,
          message: `Ungültige Kategorie: "${value}". Erlaubt: Fahrzeug, Maschine, Werkzeug`,
          type: 'error',
        });
      }
    } else if (fieldName === 'qrCode') {
      if (value) {
        asset.qrCode = value;
      }
    } else if (fieldName === 'brand') {
      if (value) {
        asset.brand = value;
      }
    } else if (fieldName === 'model') {
      if (value) {
        asset.model = value;
      }
    } else if (fieldName === 'condition') {
      const num = parseInt(value);
      if (!isNaN(num) && num >= 1 && num <= 5) {
        asset.condition = num;
      } else if (value) {
        warnings.push({
          row: rowIndex + 2,
          field: columnName,
          message: `Ungültiger Zustand: "${value}". Muss zwischen 1-5 sein.`,
          type: 'warning',
        });
      }
    } else if (fieldName === 'purchaseYear') {
      const num = parseInt(value);
      if (!isNaN(num)) {
        asset.purchaseYear = num;
      }
    } else if (fieldName === 'maintenanceIntervalMonths') {
      const num = parseInt(value);
      if (!isNaN(num)) {
        asset.maintenanceIntervalMonths = num;
      }
    } else if (fieldName === 'tags') {
      if (value) {
        asset.tags = value.split(',').map(t => t.trim()).filter(Boolean);
      }
    } else if (BOOLEAN_FIELDS.includes(fieldName)) {
      const bool = parseBoolean(value);
      if (bool !== null) {
        (asset as any)[fieldName] = bool;
      }
    } else if (fieldName.includes('Date') || fieldName.includes('Until') || fieldName.includes('Inspection') || fieldName.includes('Calibration')) {
      const date = parseDateDE(value);
      if (date) {
        (asset as any)[fieldName] = date;
      }
    } else if (fieldName === 'purchasePrice' || fieldName === 'residualValue' || fieldName === 'vehicleTaxMonthly') {
      const num = parseFloat(value.replace(',', '.'));
      if (!isNaN(num)) {
        (asset as any)[fieldName] = num;
      }
    } else if (fieldName === 'mileage') {
      const num = parseInt(value);
      if (!isNaN(num)) {
        asset.mileage = num;
      }
    } else if (fieldName === 'status') {
      // Status-Validierung: Nur 'available' oder 'loaned' erlaubt
      const normalizedStatus = value.toLowerCase().trim();
      if (normalizedStatus === 'available' || normalizedStatus === 'verfügbar' || normalizedStatus === 'lager' || normalizedStatus === 'frei') {
        asset.status = 'available';
      } else if (normalizedStatus === 'loaned' || normalizedStatus === 'ausgeliehen' || normalizedStatus === 'einsatz' || normalizedStatus === 'verliehen') {
        asset.status = 'loaned';
      } else if (value && value !== '-' && value !== 'N/A') {
        // Ungültiger Status-Wert - Warnung und Standard setzen
        warnings.push({
          row: rowIndex + 2,
          field: columnName,
          message: `Ungültiger Status: "${value}". Verwende Standard "available". Erlaubt: available/verfügbar/lager oder loaned/ausgeliehen/einsatz`,
          type: 'warning',
        });
        asset.status = 'available'; // Standard-Wert
      }
      // Wenn leer, wird später 'available' gesetzt
    } else {
      // Text-Feld
      if (value && value !== '-' && value !== 'N/A') {
        (asset as any)[fieldName] = value;
      }
    }
  });

  // Validierung: Pflichtfelder
  if (!asset.brand) {
    errors.push({
      row: rowIndex + 2,
      field: 'Marke',
      message: 'Marke ist ein Pflichtfeld',
      type: 'error',
    });
  }

  if (!asset.model) {
    errors.push({
      row: rowIndex + 2,
      field: 'Modell',
      message: 'Modell ist ein Pflichtfeld',
      type: 'error',
    });
  }

  // QR-Code: Wenn nicht vorhanden, automatisch generieren
  if (!asset.qrCode) {
    asset.qrCode = `QR_${Date.now()}_${rowIndex}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    warnings.push({
      row: rowIndex + 2,
      field: 'QR-Code',
      message: `QR-Code wurde automatisch generiert: ${asset.qrCode}`,
      type: 'warning',
    });
  } else if (existingQRCodes.has(asset.qrCode)) {
    errors.push({
      row: rowIndex + 2,
      field: 'QR-Code',
      message: `QR-Code "${asset.qrCode}" existiert bereits. Diese Zeile wird übersprungen.`,
      type: 'error',
    });
  } else {
    existingQRCodes.add(asset.qrCode);
  }

  // Standard-Werte (wenn nicht vorhanden, leer lassen wie gewünscht)
  if (!asset.type) {
    asset.type = AssetType.TOOL; // Fallback, aber sollte eigentlich gesetzt sein
  }
  // Status: Immer sicherstellen, dass ein gültiger Wert gesetzt ist
  if (!asset.status || (asset.status !== 'available' && asset.status !== 'loaned')) {
    asset.status = 'available'; // Standard-Wert
  }
  if (asset.condition === undefined) {
    // Leer lassen
  }
  if (!asset.maintenanceIntervalMonths) {
    // Leer lassen
  }

  // Asset-Typ-spezifische Validierung
  if (asset.type === AssetType.VEHICLE) {
    // Warnung wenn Maschinen-Felder vorhanden
    if (asset.serialNumber || asset.machinePower) {
      warnings.push({
        row: rowIndex + 2,
        message: 'Fahrzeug-Felder sollten für Maschinen nicht verwendet werden',
        type: 'warning',
      });
    }
  }

  return {
    asset: errors.length === 0 ? asset : null,
    errors,
    warnings,
  };
}

/**
 * Validiert alle CSV-Zeilen und gibt Import-Result zurück
 */
export async function validateCSVImport(
  file: File,
  existingAssets: Asset[]
): Promise<ImportResult> {
  const existingQRCodes = new Set(existingAssets.map(a => a.qrCode));
  const parseResult = await parseCSVFile(file);
  
  const validAssets: Asset[] = [];
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];

  parseResult.data.forEach((row: any, index: number) => {
    const result = validateAssetRow(row, index, existingQRCodes);
    
    if (result.asset) {
      // Erstelle vollständiges Asset-Objekt
      // Nur minimale Standard-Werte für Pflichtfelder, Rest bleibt leer wenn nicht vorhanden
      const asset: Asset = {
        id: `a-${Date.now()}-${index}`,
        organizationId: '', // Wird beim Import gesetzt
        brand: result.asset.brand || '',
        model: result.asset.model || '',
        type: result.asset.type || AssetType.TOOL, // Fallback für Kategorie
        purchaseYear: result.asset.purchaseYear ?? new Date().getFullYear(), // Nur wenn undefined
        warrantyUntil: result.asset.warrantyUntil || undefined, // Nicht als leerer String setzen
        condition: result.asset.condition ?? 5, // Nur wenn undefined
        imageUrl: 'https://picsum.photos/seed/newasset/400/300',
        qrCode: result.asset.qrCode || '',
        currentUserId: null,
        status: (result.asset.status === 'available' || result.asset.status === 'loaned') ? result.asset.status : 'available', // Status muss gültig sein
        maintenanceIntervalMonths: result.asset.maintenanceIntervalMonths ?? 12, // Nur wenn undefined
        repairHistory: [],
        ...result.asset, // Überschreibt die obigen Werte wenn in result.asset vorhanden
      };
      validAssets.push(asset);
    }

    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return {
    validAssets,
    errors,
    warnings,
  };
}

/**
 * Generiert Template-CSV für Import
 */
export function generateImportTemplate(full: boolean = false): void {
  const headers = full
    ? [
        'QR-Code', 'Marke', 'Modell', 'Kategorie', 'Zustand', 'Kaufjahr', 'Garantie bis',
        'Wartungsintervall (Monate)', 'Beschreibung', 'Standort', 'Abteilung', 'Kostenstelle',
        'Anschaffungspreis', 'Anschaffungsdatum', 'Restwert', 'Lieferant', 'Rechnungsnummer',
        'Kennzeichen', 'VIN', 'Kilometerstand', 'Kraftstoff', 'Seriennummer', 'Größe', 'Material',
      ]
    : ['QR-Code', 'Marke', 'Modell', 'Kategorie'];

  const exampleRow = full
    ? [
        'QR_EXAMPLE1', 'Bosch', 'Schraubendreher', 'Werkzeug', '5', '2024', '31.12.2026',
        '12', 'Beispiel-Beschreibung', 'Lager 1', 'Werkstatt', 'KST001',
        '29.99', '01.01.2024', '20.00', 'Händler XY', 'RE-2024-001',
        '', '', '', '', 'SN12345', '10mm', 'Chrom-Vanadium',
      ]
    : ['QR_EXAMPLE1', 'Bosch', 'Schraubendreher', 'Werkzeug'];

  const csvData = [headers, exampleRow];
  const csv = Papa.unparse(csvData, {
    delimiter: ';',
    header: false,
    encoding: 'UTF-8',
  });

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', full ? 'assets_import_template_full.csv' : 'assets_import_template_minimal.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
