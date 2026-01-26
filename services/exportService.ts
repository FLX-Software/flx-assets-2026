import Papa from 'papaparse';
import { Asset, LoanRecord, RepairEntry, AssetType, AssetTypeLabels } from '../types';

/**
 * Exportiert Assets als CSV
 */
export function exportAssetsToCSV(assets: Asset[]): void {
  if (assets.length === 0) {
    alert('Keine Assets zum Exportieren vorhanden.');
    return;
  }

  // Erstelle CSV-Daten mit allen möglichen Spalten
  const csvData = assets.map(asset => {
    const row: Record<string, string> = {
      'QR-Code': asset.qrCode || '',
      'Marke': asset.brand || '',
      'Modell': asset.model || '',
      'Kategorie': AssetTypeLabels[asset.type] || '',
      'Zustand': asset.condition?.toString() || '',
      'Kaufjahr': asset.purchaseYear?.toString() || '',
      'Garantie bis': asset.warrantyUntil ? formatDateDE(asset.warrantyUntil) : '',
      'Wartungsintervall (Monate)': asset.maintenanceIntervalMonths?.toString() || '',
      'Status': asset.status === 'available' ? 'Verfügbar' : 'Ausgeliehen',
      'Letzte Wartung': asset.lastMaintenance ? formatDateDE(asset.lastMaintenance) : '',
      'Nächste Wartung': asset.nextMaintenance ? formatDateDE(asset.nextMaintenance) : '',
      'Nächster TÜV': asset.nextTuev ? formatDateDE(asset.nextTuev) : '',
      'Letzte UVV': asset.lastUvv ? formatDateDE(asset.lastUvv) : '',
      // Allgemeine Felder
      'Beschreibung': asset.description || '',
      'Notizen': asset.notes || '',
      'Tags': asset.tags?.join(', ') || '',
      'Standort': asset.location || '',
      'Abteilung': asset.department || '',
      'Kostenstelle': asset.costCenter || '',
      'Anschaffungspreis': asset.purchasePrice?.toString() || '',
      'Anschaffungsdatum': asset.purchaseDate ? formatDateDE(asset.purchaseDate) : '',
      'Restwert': asset.residualValue?.toString() || '',
      'Abschreibungsdauer (Jahre)': asset.depreciationYears?.toString() || '',
      'Lieferant': asset.supplier || '',
      'Rechnungsnummer': asset.invoiceNumber || '',
      'Rechnung vorhanden': formatBoolean(asset.hasInvoice),
      'Garantieschein vorhanden': formatBoolean(asset.hasWarrantyCertificate),
      'Bedienungsanleitung vorhanden': formatBoolean(asset.hasManual),
      'Verfügbar ab': asset.availableFrom ? formatDateDE(asset.availableFrom) : '',
      'Ausgemustert': formatBoolean(asset.isDecommissioned),
      'Ausmusterungsdatum': asset.decommissionedDate ? formatDateDE(asset.decommissionedDate) : '',
      'Ausmusterungsgrund': asset.decommissionedReason || '',
    };

    // Fahrzeug-spezifisch
    if (asset.type === AssetType.VEHICLE) {
      row['Kennzeichen'] = asset.licensePlate || '';
      row['Fahrgestellnummer (VIN)'] = asset.vin || '';
      row['Fahrzeugbrief-Nr.'] = asset.vehicleRegistrationNumber || '';
      row['Erstzulassung'] = asset.firstRegistrationDate ? formatDateDE(asset.firstRegistrationDate) : '';
      row['Fahrzeugklasse'] = asset.vehicleClass || '';
      row['Hubraum'] = asset.engineDisplacement || '';
      row['Leistung'] = asset.power || '';
      row['Kraftstoff'] = asset.fuelType || '';
      row['Getriebe'] = asset.transmission || '';
      row['Kilometerstand'] = asset.mileage?.toString() || '';
      row['Versicherungsgesellschaft'] = asset.insuranceCompany || '';
      row['Versicherungsnummer'] = asset.insuranceNumber || '';
      row['Versicherung bis'] = asset.insuranceUntil ? formatDateDE(asset.insuranceUntil) : '';
      row['KFZ-Steuer (€/Monat)'] = asset.vehicleTaxMonthly?.toString() || '';
      row['Zulassungsbehörde'] = asset.registrationAuthority || '';
      row['Fahrzeugschein vorhanden'] = formatBoolean(asset.hasVehicleRegistration);
      row['Fahrzeugbrief vorhanden'] = formatBoolean(asset.hasVehicleTitle);
      row['Serviceheft vorhanden'] = formatBoolean(asset.hasServiceBook);
    }

    // Maschine-spezifisch
    if (asset.type === AssetType.MACHINE) {
      row['Seriennummer'] = asset.serialNumber || '';
      row['Hersteller-Nr.'] = asset.manufacturerNumber || '';
      row['Typbezeichnung'] = asset.typeDesignation || '';
      row['Leistung'] = asset.machinePower || '';
      row['Gewicht'] = asset.weight || '';
      row['Abmessungen'] = asset.dimensions || '';
      row['Spannung'] = asset.voltage || '';
      row['Stromverbrauch'] = asset.currentConsumption || '';
      row['Betriebsdruck'] = asset.operatingPressure || '';
      row['Drehzahl'] = asset.rpm || '';
      row['CE-Kennzeichnung'] = formatBoolean(asset.hasCeMarking);
      row['GS-Zeichen'] = formatBoolean(asset.hasGsMarking);
      row['Letzte UVV-Prüfung'] = asset.lastUvvInspection ? formatDateDE(asset.lastUvvInspection) : '';
      row['Nächste UVV-Prüfung'] = asset.nextUvvInspection ? formatDateDE(asset.nextUvvInspection) : '';
      row['Prüfbericht vorhanden'] = formatBoolean(asset.hasInspectionReport);
    }

    // Werkzeug-spezifisch
    if (asset.type === AssetType.TOOL) {
      row['Seriennummer'] = asset.serialNumber || '';
      row['Artikelnummer'] = asset.articleNumber || '';
      row['Modellnummer'] = asset.modelNumber || '';
      row['Größe'] = asset.size || '';
      row['Material'] = asset.material || '';
      row['Leistung'] = asset.toolPower || '';
      row['Spannung'] = asset.toolVoltage || '';
      row['Werkzeugkasten/Set'] = asset.toolBoxSet || '';
      row['CE-Kennzeichnung'] = formatBoolean(asset.hasCeMarking);
      row['GS-Zeichen'] = formatBoolean(asset.hasGsMarking);
      row['Kalibrierung erforderlich'] = formatBoolean(asset.requiresCalibration);
      row['Letzte Kalibrierung'] = asset.lastCalibration ? formatDateDE(asset.lastCalibration) : '';
      row['Nächste Kalibrierung'] = asset.nextCalibration ? formatDateDE(asset.nextCalibration) : '';
    }

    return row;
  });

  // Generiere CSV mit Semikolon als Trennzeichen
  const csv = Papa.unparse(csvData, {
    delimiter: ';',
    header: true,
    encoding: 'UTF-8',
  });

  // Füge BOM hinzu für Excel-Kompatibilität
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `assets_export_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exportiert Loans als CSV
 */
export function exportLoansToCSV(loans: LoanRecord[], assets: Asset[]): void {
  if (loans.length === 0) {
    alert('Keine Ausleihen zum Exportieren vorhanden.');
    return;
  }

  const csvData = loans.map(loan => {
    const asset = assets.find(a => a.id === loan.assetId);
    return {
      'Asset QR-Code': asset?.qrCode || '',
      'Asset Marke': asset?.brand || '',
      'Asset Modell': asset?.model || '',
      'Benutzer': loan.userName || '',
      'Ausgabe-Datum': formatDateDE(loan.timestampOut),
      'Rückgabe-Datum': loan.timestampIn ? formatDateDE(loan.timestampIn) : '',
      'Status': loan.timestampIn ? 'Zurückgegeben' : 'Ausgeliehen',
    };
  });

  const csv = Papa.unparse(csvData, {
    delimiter: ';',
    header: true,
    encoding: 'UTF-8',
  });

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `loans_export_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exportiert Maintenance-Events als CSV
 */
export function exportMaintenanceToCSV(assets: Asset[]): void {
  // Sammle alle Maintenance-Events aus allen Assets
  const maintenanceData: Array<{
    'Asset QR-Code': string;
    'Asset Marke': string;
    'Asset Modell': string;
    'Datum': string;
    'Beschreibung': string;
    'Durchgeführt von': string;
    'Kosten': string;
  }> = [];

  assets.forEach(asset => {
    asset.repairHistory?.forEach(entry => {
      maintenanceData.push({
        'Asset QR-Code': asset.qrCode || '',
        'Asset Marke': asset.brand || '',
        'Asset Modell': asset.model || '',
        'Datum': formatDateDE(entry.date),
        'Beschreibung': entry.description || '',
        'Durchgeführt von': entry.performer || '',
        'Kosten': entry.cost?.toString() || '',
      });
    });
  });

  if (maintenanceData.length === 0) {
    alert('Keine Wartungs-Events zum Exportieren vorhanden.');
    return;
  }

  const csv = Papa.unparse(maintenanceData, {
    delimiter: ';',
    header: true,
    encoding: 'UTF-8',
  });

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `maintenance_export_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formatiert Datum im deutschen Format (DD.MM.YYYY)
 */
function formatDateDE(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return '';
  }
}

/**
 * Formatiert Boolean-Wert (Ja/Nein)
 */
function formatBoolean(value: boolean | null | undefined): string {
  if (value === true) return 'Ja';
  if (value === false) return 'Nein';
  return '';
}
