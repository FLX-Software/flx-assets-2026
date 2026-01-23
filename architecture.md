
# CraftTrack Architektur & Datenbank-Design

## 1. Architekturplan
- **Frontend**: React (SPA) mit Tailwind CSS für performantes, responsives UI.
- **Zustand**: Lokaler State (useState/useEffect) simuliert Cloud-Sync via LocalStorage für Offline-Szenarien.
- **PWA**: Service Worker sorgt für Caching der Assets; Manifest ermöglicht Home-Screen-Installation.
- **QR-Integration**: Nutzung der Gerätekamera via `html5-qrcode`. Validierung der Scans gegen die Asset-Datenbank.

## 2. Datenbank-Schema (Vorschlag für Supabase/PostgreSQL)

### Tabelle: `profiles`
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid (PK) | Auth-ID |
| full_name | text | Name des Mitarbeiters |
| role | user_role (enum) | 'admin' oder 'staff' |

### Tabelle: `assets`
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid (PK) | Eindeutige ID |
| brand | text | Marke |
| model | text | Modellname |
| type | asset_type (enum) | Fahrzeug, Maschine, Werkzeug |
| purchase_year | integer | Kaufjahr |
| warranty_until | date | Garantieende |
| condition | integer | Zustand (1-5) |
| image_url | text | URL zum Foto |
| qr_string | text (Unique) | String für QR-Generierung |
| status | text | 'available' oder 'loaned' |
| current_user_id| uuid (FK) | Verweis auf profile |

### Tabelle: `loans` (Historie)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid (PK) | - |
| asset_id | uuid (FK) | Verweis auf asset |
| user_id | uuid (FK) | Verweis auf profile |
| checked_out_at | timestamp | Leihbeginn |
| checked_in_at | timestamp | Rückgabezeitpunkt |
