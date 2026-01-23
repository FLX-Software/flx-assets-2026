
import { Asset, AssetType, User, UserRole, LoanRecord } from './types';

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    firstName: 'Max',
    lastName: 'Mustermann',
    name: 'Max Mustermann', 
    email: 'max@flx-software.de',
    username: 'admin',
    password: 'password123',
    role: UserRole.ADMIN 
  },
  { 
    id: 'u2', 
    firstName: 'Sven',
    lastName: 'Handwerker',
    name: 'Sven Handwerker', 
    email: 'sven@flx-software.de',
    username: 'sven',
    password: 'password123',
    role: UserRole.STAFF 
  },
  { 
    id: 'u3', 
    firstName: 'Julia',
    lastName: 'Bauleitung',
    name: 'Julia Bauleitung', 
    email: 'julia@flx-software.de',
    username: 'julia',
    password: 'password123',
    role: UserRole.STAFF 
  },
];

export const INITIAL_LOAN_HISTORY: LoanRecord[] = [
  { id: 'l1', assetId: 'a1', userId: 'u2', userName: 'Sven Handwerker', timestampOut: '2023-10-15T08:00:00Z', timestampIn: '2023-10-15T16:30:00Z' },
  { id: 'l2', assetId: 'a2', userId: 'u3', userName: 'Julia Bauleitung', timestampOut: '2023-11-01T07:15:00Z', timestampIn: '2023-11-05T17:00:00Z' },
  { id: 'l3', assetId: 'a2', userId: 'u2', userName: 'Sven Handwerker', timestampOut: '2024-01-10T09:00:00Z' },
  { id: 'l4', assetId: 'a4', userId: 'u2', userName: 'Sven Handwerker', timestampOut: '2024-02-01T10:30:00Z' },
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'a1',
    brand: 'Festool',
    model: 'Kapex KS 120',
    type: AssetType.MACHINE,
    purchaseYear: 2022,
    warrantyUntil: '2025-06-30',
    condition: 5,
    imageUrl: 'https://picsum.photos/seed/kapex/400/300',
    qrCode: 'QR_FESTOOL_001',
    currentUserId: null,
    status: 'available',
    lastMaintenance: '2023-05-20',
    nextMaintenance: '2024-05-20'
  },
  {
    id: 'a2',
    brand: 'Hilti',
    model: 'TE 70-ATC',
    type: AssetType.MACHINE,
    purchaseYear: 2021,
    warrantyUntil: '2024-12-31',
    condition: 3,
    imageUrl: 'https://picsum.photos/seed/hilti/400/300',
    qrCode: 'QR_HILTI_70',
    currentUserId: 'u2',
    status: 'loaned',
    lastMaintenance: '2023-11-10',
    nextMaintenance: '2024-11-10'
  },
  {
    id: 'a3',
    brand: 'Mercedes-Benz',
    model: 'Sprinter 316 CDI',
    type: AssetType.VEHICLE,
    purchaseYear: 2020,
    warrantyUntil: '2024-05-15',
    condition: 4,
    imageUrl: 'https://picsum.photos/seed/sprinter/400/300',
    qrCode: 'QR_SPRINTER_VB1',
    currentUserId: null,
    status: 'available',
    lastMaintenance: '2024-01-05',
    nextMaintenance: '2025-01-05'
  },
  {
    id: 'a4',
    brand: 'Makita',
    model: 'DDF486Z',
    type: AssetType.TOOL,
    purchaseYear: 2023,
    warrantyUntil: '2026-01-01',
    condition: 5,
    imageUrl: 'https://picsum.photos/seed/makita/400/300',
    qrCode: 'QR_MAKITA_BOHR',
    currentUserId: 'u2',
    status: 'loaned',
    lastMaintenance: '2023-12-01',
    nextMaintenance: '2024-12-01'
  }
];
