
export enum AssetType {
  VEHICLE = 'vehicle',
  MACHINE = 'machine',
  TOOL = 'tool'
}

// Frontend-Display-Namen
export const AssetTypeLabels: Record<AssetType, string> = {
  [AssetType.VEHICLE]: 'Fahrzeug',
  [AssetType.MACHINE]: 'Maschine',
  [AssetType.TOOL]: 'Werkzeug'
};

export enum UserRole {
  STAFF = 'staff',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Frontend-Display-Namen
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.STAFF]: 'Mitarbeiter',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_ADMIN]: 'Super-Admin'
};

export interface RepairEntry {
  id: string;
  date: string;
  description: string;
  cost?: number;
  performer: string;
}

// DB-Entity: Asset (wie in Supabase gespeichert)
export interface DBAsset {
  id: string;
  organization_id: string;
  brand: string;
  model: string;
  type: AssetType;
  purchase_year: number | null;
  warranty_until: string | null;
  condition: number | null;
  image_url: string | null;
  qr_string: string;
  status: 'available' | 'loaned';
  current_user_id: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  maintenance_interval_months: number;
  last_uvv: string | null;
  next_tuev: string | null;
  license_plate: string | null;
  // Allgemeine Felder
  description: string | null;
  notes: string | null;
  tags: string[] | null;
  location: string | null;
  department: string | null;
  cost_center: string | null;
  responsible_user_id: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  residual_value: number | null;
  depreciation_years: number | null;
  supplier: string | null;
  invoice_number: string | null;
  has_invoice: boolean | null;
  has_warranty_certificate: boolean | null;
  has_manual: boolean | null;
  available_from: string | null;
  reserved_for_user_id: string | null;
  is_decommissioned: boolean | null;
  decommissioned_date: string | null;
  decommissioned_reason: string | null;
  // Fahrzeuge-spezifisch
  vin: string | null;
  vehicle_registration_number: string | null;
  first_registration_date: string | null;
  vehicle_class: string | null;
  engine_displacement: string | null;
  power: string | null;
  fuel_type: string | null;
  transmission: string | null;
  mileage: number | null;
  insurance_company: string | null;
  insurance_number: string | null;
  insurance_until: string | null;
  vehicle_tax_monthly: number | null;
  registration_authority: string | null;
  has_vehicle_registration: boolean | null;
  has_vehicle_title: boolean | null;
  has_service_book: boolean | null;
  // Maschinen-spezifisch
  serial_number: string | null;
  manufacturer_number: string | null;
  type_designation: string | null;
  machine_power: string | null;
  weight: string | null;
  dimensions: string | null;
  voltage: string | null;
  current_consumption: string | null;
  operating_pressure: string | null;
  rpm: string | null;
  has_ce_marking: boolean | null;
  has_gs_marking: boolean | null;
  last_uvv_inspection: string | null;
  next_uvv_inspection: string | null;
  has_inspection_report: boolean | null;
  // Werkzeuge-spezifisch
  article_number: string | null;
  model_number: string | null;
  size: string | null;
  material: string | null;
  tool_power: string | null;
  tool_voltage: string | null;
  requires_calibration: boolean | null;
  last_calibration: string | null;
  next_calibration: string | null;
  tool_box_set: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend-Modell: Asset (kompatibel mit bestehender App)
export interface Asset {
  id: string;
  organizationId: string;
  brand: string;
  model: string;
  type: AssetType;
  purchaseYear: number;
  warrantyUntil: string;
  condition: number; // 1-5
  imageUrl: string;
  qrCode: string;
  currentUserId: string | null;
  status: 'available' | 'loaned';
  lastMaintenance?: string;
  nextMaintenance?: string;
  nextTuev?: string;
  lastUvv?: string;
  maintenanceIntervalMonths: number;
  repairHistory: RepairEntry[];
  licensePlate?: string;
  // Allgemeine Felder
  description?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  department?: string;
  costCenter?: string;
  responsibleUserId?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  residualValue?: number;
  depreciationYears?: number;
  supplier?: string;
  invoiceNumber?: string;
  hasInvoice?: boolean;
  hasWarrantyCertificate?: boolean;
  hasManual?: boolean;
  availableFrom?: string;
  reservedForUserId?: string;
  isDecommissioned?: boolean;
  decommissionedDate?: string;
  decommissionedReason?: string;
  // Fahrzeuge-spezifisch
  vin?: string;
  vehicleRegistrationNumber?: string;
  firstRegistrationDate?: string;
  vehicleClass?: string;
  engineDisplacement?: string;
  power?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  insuranceCompany?: string;
  insuranceNumber?: string;
  insuranceUntil?: string;
  vehicleTaxMonthly?: number;
  registrationAuthority?: string;
  hasVehicleRegistration?: boolean;
  hasVehicleTitle?: boolean;
  hasServiceBook?: boolean;
  // Maschinen-spezifisch
  serialNumber?: string;
  manufacturerNumber?: string;
  typeDesignation?: string;
  machinePower?: string;
  weight?: string;
  dimensions?: string;
  voltage?: string;
  currentConsumption?: string;
  operatingPressure?: string;
  rpm?: string;
  hasCeMarking?: boolean;
  hasGsMarking?: boolean;
  lastUvvInspection?: string;
  nextUvvInspection?: string;
  hasInspectionReport?: boolean;
  // Werkzeuge-spezifisch
  articleNumber?: string;
  modelNumber?: string;
  size?: string;
  material?: string;
  toolPower?: string;
  toolVoltage?: string;
  requiresCalibration?: boolean;
  lastCalibration?: string;
  nextCalibration?: string;
  toolBoxSet?: string;
}

// DB-Entity: Profile
export interface DBProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend-Modell: User (kompatibel mit bestehender App)
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
  organizationId?: string; // Aktuelle Organisation
  organizationName?: string; // Name der Organisation
}

// DB-Entity: Organization
export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// DB-Entity: OrganizationMember
export interface DBOrganizationMember {
  organization_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// DB-Entity: Loan
export interface DBLoan {
  id: string;
  organization_id: string;
  asset_id: string;
  user_id: string;
  timestamp_out: string;
  timestamp_in: string | null;
  notes: string | null;
  created_at: string;
}

// Frontend-Modell: LoanRecord (kompatibel mit bestehender App)
export interface LoanRecord {
  id: string;
  assetId: string;
  userId: string;
  userName: string;
  timestampOut: string;
  timestampIn?: string;
}

// DB-Entity: MaintenanceEvent
export interface DBMaintenanceEvent {
  id: string;
  organization_id: string;
  asset_id: string;
  date: string;
  description: string;
  performer: string;
  cost: number | null;
  created_at: string;
}

// Helper: DB-Asset → Frontend-Asset konvertieren
export function dbAssetToAsset(dbAsset: DBAsset, repairHistory: RepairEntry[] = []): Asset {
  return {
    id: dbAsset.id,
    organizationId: dbAsset.organization_id,
    brand: dbAsset.brand,
    model: dbAsset.model,
    type: dbAsset.type,
    purchaseYear: dbAsset.purchase_year || new Date().getFullYear(),
    warrantyUntil: dbAsset.warranty_until || '',
    condition: dbAsset.condition || 5,
    imageUrl: dbAsset.image_url || 'https://picsum.photos/seed/asset/400/300',
    qrCode: dbAsset.qr_string,
    currentUserId: dbAsset.current_user_id,
    status: dbAsset.status,
    lastMaintenance: dbAsset.last_maintenance || undefined,
    nextMaintenance: dbAsset.next_maintenance || undefined,
    nextTuev: dbAsset.next_tuev || undefined,
    lastUvv: dbAsset.last_uvv || undefined,
    maintenanceIntervalMonths: dbAsset.maintenance_interval_months,
    repairHistory,
    licensePlate: dbAsset.license_plate || undefined,
    // Allgemeine Felder
    description: dbAsset.description || undefined,
    notes: dbAsset.notes || undefined,
    tags: dbAsset.tags || undefined,
    location: dbAsset.location || undefined,
    department: dbAsset.department || undefined,
    costCenter: dbAsset.cost_center || undefined,
    responsibleUserId: dbAsset.responsible_user_id || undefined,
    purchasePrice: dbAsset.purchase_price || undefined,
    purchaseDate: dbAsset.purchase_date || undefined,
    residualValue: dbAsset.residual_value || undefined,
    depreciationYears: dbAsset.depreciation_years || undefined,
    supplier: dbAsset.supplier || undefined,
    invoiceNumber: dbAsset.invoice_number || undefined,
    hasInvoice: dbAsset.has_invoice || undefined,
    hasWarrantyCertificate: dbAsset.has_warranty_certificate || undefined,
    hasManual: dbAsset.has_manual || undefined,
    availableFrom: dbAsset.available_from || undefined,
    reservedForUserId: dbAsset.reserved_for_user_id || undefined,
    isDecommissioned: dbAsset.is_decommissioned || undefined,
    decommissionedDate: dbAsset.decommissioned_date || undefined,
    decommissionedReason: dbAsset.decommissioned_reason || undefined,
    // Fahrzeuge-spezifisch
    vin: dbAsset.vin || undefined,
    vehicleRegistrationNumber: dbAsset.vehicle_registration_number || undefined,
    firstRegistrationDate: dbAsset.first_registration_date || undefined,
    vehicleClass: dbAsset.vehicle_class || undefined,
    engineDisplacement: dbAsset.engine_displacement || undefined,
    power: dbAsset.power || undefined,
    fuelType: dbAsset.fuel_type || undefined,
    transmission: dbAsset.transmission || undefined,
    mileage: dbAsset.mileage || undefined,
    insuranceCompany: dbAsset.insurance_company || undefined,
    insuranceNumber: dbAsset.insurance_number || undefined,
    insuranceUntil: dbAsset.insurance_until || undefined,
    vehicleTaxMonthly: dbAsset.vehicle_tax_monthly || undefined,
    registrationAuthority: dbAsset.registration_authority || undefined,
    hasVehicleRegistration: dbAsset.has_vehicle_registration || undefined,
    hasVehicleTitle: dbAsset.has_vehicle_title || undefined,
    hasServiceBook: dbAsset.has_service_book || undefined,
    // Maschinen-spezifisch
    serialNumber: dbAsset.serial_number || undefined,
    manufacturerNumber: dbAsset.manufacturer_number || undefined,
    typeDesignation: dbAsset.type_designation || undefined,
    machinePower: dbAsset.machine_power || undefined,
    weight: dbAsset.weight || undefined,
    dimensions: dbAsset.dimensions || undefined,
    voltage: dbAsset.voltage || undefined,
    currentConsumption: dbAsset.current_consumption || undefined,
    operatingPressure: dbAsset.operating_pressure || undefined,
    rpm: dbAsset.rpm || undefined,
    hasCeMarking: dbAsset.has_ce_marking || undefined,
    hasGsMarking: dbAsset.has_gs_marking || undefined,
    lastUvvInspection: dbAsset.last_uvv_inspection || undefined,
    nextUvvInspection: dbAsset.next_uvv_inspection || undefined,
    hasInspectionReport: dbAsset.has_inspection_report || undefined,
    // Werkzeuge-spezifisch
    articleNumber: dbAsset.article_number || undefined,
    modelNumber: dbAsset.model_number || undefined,
    size: dbAsset.size || undefined,
    material: dbAsset.material || undefined,
    toolPower: dbAsset.tool_power || undefined,
    toolVoltage: dbAsset.tool_voltage || undefined,
    requiresCalibration: dbAsset.requires_calibration || undefined,
    lastCalibration: dbAsset.last_calibration || undefined,
    nextCalibration: dbAsset.next_calibration || undefined,
    toolBoxSet: dbAsset.tool_box_set || undefined,
  };
}

// Helper: Konvertiert leere Strings oder undefined zu null für Date-Felder
function normalizeDateField(value: string | undefined | null): string | null {
  if (!value || value.trim() === '' || value === '') {
    return null;
  }
  return value;
}

// Helper: Frontend-Asset → DB-Asset konvertieren
export function assetToDBAsset(asset: Asset, organizationId: string): Partial<DBAsset> {
  return {
    organization_id: organizationId,
    brand: asset.brand,
    model: asset.model,
    type: asset.type,
    purchase_year: asset.purchaseYear,
    warranty_until: normalizeDateField(asset.warrantyUntil),
    condition: asset.condition,
    image_url: asset.imageUrl,
    qr_string: asset.qrCode,
    status: asset.status,
    current_user_id: asset.currentUserId,
    last_maintenance: normalizeDateField(asset.lastMaintenance),
    next_maintenance: normalizeDateField(asset.nextMaintenance),
    maintenance_interval_months: asset.maintenanceIntervalMonths,
    last_uvv: normalizeDateField(asset.lastUvv),
    next_tuev: normalizeDateField(asset.nextTuev),
    license_plate: asset.licensePlate || null,
    // Allgemeine Felder
    description: asset.description || null,
    notes: asset.notes || null,
    tags: asset.tags || null,
    location: asset.location || null,
    department: asset.department || null,
    cost_center: asset.costCenter || null,
    responsible_user_id: asset.responsibleUserId || null,
    purchase_price: asset.purchasePrice || null,
    purchase_date: normalizeDateField(asset.purchaseDate),
    residual_value: asset.residualValue || null,
    depreciation_years: asset.depreciationYears || null,
    supplier: asset.supplier || null,
    invoice_number: asset.invoiceNumber || null,
    has_invoice: asset.hasInvoice || null,
    has_warranty_certificate: asset.hasWarrantyCertificate || null,
    has_manual: asset.hasManual || null,
    available_from: normalizeDateField(asset.availableFrom),
    reserved_for_user_id: asset.reservedForUserId || null,
    is_decommissioned: asset.isDecommissioned || null,
    decommissioned_date: normalizeDateField(asset.decommissionedDate),
    decommissioned_reason: asset.decommissionedReason || null,
    // Fahrzeuge-spezifisch
    vin: asset.vin || null,
    vehicle_registration_number: asset.vehicleRegistrationNumber || null,
    first_registration_date: normalizeDateField(asset.firstRegistrationDate),
    vehicle_class: asset.vehicleClass || null,
    engine_displacement: asset.engineDisplacement || null,
    power: asset.power || null,
    fuel_type: asset.fuelType || null,
    transmission: asset.transmission || null,
    mileage: asset.mileage || null,
    insurance_company: asset.insuranceCompany || null,
    insurance_number: asset.insuranceNumber || null,
    insurance_until: normalizeDateField(asset.insuranceUntil),
    vehicle_tax_monthly: asset.vehicleTaxMonthly || null,
    registration_authority: asset.registrationAuthority || null,
    has_vehicle_registration: asset.hasVehicleRegistration || null,
    has_vehicle_title: asset.hasVehicleTitle || null,
    has_service_book: asset.hasServiceBook || null,
    // Maschinen-spezifisch
    serial_number: asset.serialNumber || null,
    manufacturer_number: asset.manufacturerNumber || null,
    type_designation: asset.typeDesignation || null,
    machine_power: asset.machinePower || null,
    weight: asset.weight || null,
    dimensions: asset.dimensions || null,
    voltage: asset.voltage || null,
    current_consumption: asset.currentConsumption || null,
    operating_pressure: asset.operatingPressure || null,
    rpm: asset.rpm || null,
    has_ce_marking: asset.hasCeMarking || null,
    has_gs_marking: asset.hasGsMarking || null,
    last_uvv_inspection: normalizeDateField(asset.lastUvvInspection),
    next_uvv_inspection: normalizeDateField(asset.nextUvvInspection),
    has_inspection_report: asset.hasInspectionReport || null,
    // Werkzeuge-spezifisch
    article_number: asset.articleNumber || null,
    model_number: asset.modelNumber || null,
    size: asset.size || null,
    material: asset.material || null,
    tool_power: asset.toolPower || null,
    tool_voltage: asset.toolVoltage || null,
    requires_calibration: asset.requiresCalibration || null,
    last_calibration: normalizeDateField(asset.lastCalibration),
    next_calibration: normalizeDateField(asset.nextCalibration),
    tool_box_set: asset.toolBoxSet || null,
  };
}
