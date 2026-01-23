
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
  ADMIN = 'admin',
  STAFF = 'staff'
}

// Frontend-Display-Namen
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.STAFF]: 'Mitarbeiter'
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
  };
}

// Helper: Frontend-Asset → DB-Asset konvertieren
export function assetToDBAsset(asset: Asset, organizationId: string): Partial<DBAsset> {
  return {
    organization_id: organizationId,
    brand: asset.brand,
    model: asset.model,
    type: asset.type,
    purchase_year: asset.purchaseYear,
    warranty_until: asset.warrantyUntil,
    condition: asset.condition,
    image_url: asset.imageUrl,
    qr_string: asset.qrCode,
    status: asset.status,
    current_user_id: asset.currentUserId,
    last_maintenance: asset.lastMaintenance || null,
    next_maintenance: asset.nextMaintenance || null,
    maintenance_interval_months: asset.maintenanceIntervalMonths,
    last_uvv: asset.lastUvv || null,
    next_tuev: asset.nextTuev || null,
    license_plate: asset.licensePlate || null,
  };
}
