
export enum AssetType {
  VEHICLE = 'Fahrzeug',
  MACHINE = 'Maschine',
  TOOL = 'Werkzeug'
}

export enum UserRole {
  ADMIN = 'Admin',
  STAFF = 'Mitarbeiter'
}

export interface RepairEntry {
  id: string;
  date: string;
  description: string;
  cost?: number;
  performer: string;
}

export interface Asset {
  id: string;
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
  // New Fields
  nextTuev?: string; // For vehicles/trailers
  lastUvv?: string; // Safety check
  maintenanceIntervalMonths: number;
  repairHistory: RepairEntry[];
  licensePlate?: string; // Only for vehicles
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
}

export interface LoanRecord {
  id: string;
  assetId: string;
  userId: string;
  userName: string;
  timestampOut: string;
  timestampIn?: string;
}
