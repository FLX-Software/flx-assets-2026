
export enum AssetType {
  VEHICLE = 'Fahrzeug',
  MACHINE = 'Maschine',
  TOOL = 'Werkzeug'
}

export enum UserRole {
  ADMIN = 'Admin',
  STAFF = 'Mitarbeiter'
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
  currentUserId: string | null; // ID of user who currently has it
  status: 'available' | 'loaned';
  lastMaintenance?: string;
  nextMaintenance?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Display name
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

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  date: string;
  description: string;
  performer: string;
}
