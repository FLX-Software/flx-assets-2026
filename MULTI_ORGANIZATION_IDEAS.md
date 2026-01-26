# Multi-Organisation & Super-Admin Konzept

## 🎯 Ziel
Als App-Inhaber sollst du:
1. Neue Organisationen anlegen können
2. User in verschiedenen Organisationen anlegen können
3. Bei jeder Organisation einloggen können (für Support/Schulung)

---

## 📋 Ideen & Konzepte

### 1. **Super-Admin Rolle**

#### Option A: Neue Rolle `SUPER_ADMIN`
```typescript
enum UserRole {
  STAFF = 'staff',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'  // NEU
}
```

**Vorteile:**
- Klare Trennung zwischen normalen Admins und Super-Admin
- Einfache RLS-Policy-Prüfungen (`role = 'super_admin'`)
- Kann in jeder Organisation Admin-Rechte haben

**Nachteile:**
- Zusätzliche Rolle muss verwaltet werden
- RLS-Policies müssen angepasst werden

#### Option B: Spezielle Organisation "FLX Software" (System-Org)
- Super-Admin ist Admin in einer speziellen System-Organisation
- Diese Organisation hat Zugriff auf alle anderen Organisationen
- Prüfung: `is_admin_of_system_organization()`

**Vorteile:**
- Nutzt bestehende Struktur
- Keine neue Rolle nötig

**Nachteile:**
- Komplexere Logik
- System-Organisation muss speziell behandelt werden

#### Option C: Flag in `profiles` Tabelle
```sql
ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
```

**Vorteile:**
- Einfach zu implementieren
- Unabhängig von Organisationen

**Nachteile:**
- Zusätzliche Spalte
- Muss in RLS-Policies berücksichtigt werden

**💡 Empfehlung: Option A (SUPER_ADMIN Rolle)** - Am klarsten und wartbarsten

---

### 2. **Organisation-Management UI**

#### Komponente: `OrganizationManagementModal`
- **Zugriff:** Nur für SUPER_ADMIN
- **Funktionen:**
  - Liste aller Organisationen anzeigen
  - Neue Organisation anlegen (Name, Slug)
  - Organisation bearbeiten/löschen (soft delete)
  - Organisation aktivieren/deaktivieren
  - Statistiken pro Organisation (Asset-Anzahl, User-Anzahl)

#### UI-Struktur:
```
┌─────────────────────────────────────┐
│  Organisationen verwalten            │
├─────────────────────────────────────┤
│  [+ Neue Organisation]               │
│                                      │
│  📊 FLX Software                    │
│     Slug: flx-software               │
│     15 Assets | 3 User | Aktiv       │
│     [Bearbeiten] [Deaktivieren]      │
│                                      │
│  📊 Kunde A GmbH                    │
│     Slug: kunde-a                    │
│     42 Assets | 8 User | Aktiv       │
│     [Bearbeiten] [Deaktivieren]      │
└─────────────────────────────────────┘
```

---

### 3. **Multi-Organisation-Login (Organisation wechseln)**

#### Option A: Dropdown im Header
- **Position:** Rechts oben neben User-Menü
- **Funktion:** 
  - Zeigt aktuelle Organisation
  - Dropdown mit allen Organisationen, in denen User Admin ist
  - Beim Wechsel: Daten neu laden, `organizationId` im User-Objekt aktualisieren

#### Option B: Separates Modal
- Button "Organisation wechseln" im User-Menü
- Modal zeigt alle verfügbaren Organisationen
- Beim Klick: Organisation wechseln

#### Option C: Sidebar mit Organisation-Liste
- Permanente Sidebar mit allen Organisationen
- Aktive Organisation hervorgehoben
- Klick wechselt Organisation

**💡 Empfehlung: Option A (Dropdown im Header)** - Am wenigsten aufdringlich, schnell zugänglich

#### Implementierung:
```typescript
// In App.tsx
const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);

// Beim Login: Alle Organisationen laden, in denen User Admin ist
const loadAvailableOrganizations = async (userId: string) => {
  const orgs = await fetchUserOrganizations(userId);
  setAvailableOrganizations(orgs);
};

// Organisation wechseln
const switchOrganization = async (orgId: string) => {
  const user = await loadUserWithOrganizations(currentUser.id, orgId);
  if (user) {
    setCurrentUser(user);
    await loadData(user);
    showNotification(`Zu ${user.organizationName} gewechselt`, 'success');
  }
};
```

---

### 4. **User-Management über Organisationen hinweg**

#### Option A: Globales User-Management (nur für SUPER_ADMIN)
- **Komponente:** `GlobalUserManagementModal`
- Zeigt alle User aus allen Organisationen
- Filter nach Organisation
- Kann User in beliebige Organisationen hinzufügen
- Kann User aus Organisationen entfernen

#### Option B: Organisation-spezifisches User-Management (wie bisher)
- Jede Organisation verwaltet ihre eigenen User
- SUPER_ADMIN kann in jede Organisation wechseln und dort User verwalten

**💡 Empfehlung: Option B** - Einfacher, nutzt bestehende Struktur

#### Erweiterung für SUPER_ADMIN:
- Im `UserManagementModal`: Zusätzliche Option "User in andere Organisation hinzufügen"
- Dropdown mit allen Organisationen
- User kann in mehrere Organisationen gleichzeitig sein

---

### 5. **RLS-Policies Anpassungen**

#### Neue Funktionen benötigt:
```sql
-- Prüft ob User Super-Admin ist
CREATE FUNCTION is_super_admin(user_id uuid) RETURNS boolean;

-- Prüft ob User Admin in einer Organisation ist (für Super-Admin)
CREATE FUNCTION is_admin_of_any_organization(user_id uuid) RETURNS boolean;

-- Super-Admin kann alle Organisationen sehen
CREATE POLICY "super_admin_read_all_organizations" ...;

-- Super-Admin kann Organisationen erstellen
CREATE POLICY "super_admin_create_organizations" ...;
```

---

### 6. **Datenbank-Änderungen**

#### Minimal (Option A - SUPER_ADMIN Rolle):
- Keine DB-Änderungen nötig! 
- Nur `UserRole` Enum erweitern
- RLS-Policies anpassen

#### Alternative (Option C - Flag):
```sql
ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
CREATE INDEX idx_profiles_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;
```

---

### 7. **UI/UX Flow**

#### Login-Flow:
1. User loggt sich ein
2. System prüft: Ist User SUPER_ADMIN?
3. Wenn ja: Zeige Organisation-Auswahl oder automatisch erste Organisation
4. Wenn nein: Normale Login-Flow (erste Organisation)

#### Dashboard-Flow:
1. SUPER_ADMIN sieht zusätzlichen Button "Organisationen verwalten"
2. Header zeigt Dropdown mit aktueller Organisation
3. Beim Wechsel: Daten werden neu geladen

#### User-Management-Flow:
1. SUPER_ADMIN wechselt zu Organisation A
2. Öffnet User-Management
3. Kann User anlegen/bearbeiten (wie normaler Admin)
4. Zusätzlich: Kann User in andere Organisationen hinzufügen

---

### 8. **Service-Funktionen**

#### Neue Funktionen in `supabaseOrganizationService.ts`:
```typescript
// Für Super-Admin: Alle Organisationen laden
export async function fetchAllOrganizations(): Promise<Organization[]>

// Organisation erstellen (nur Super-Admin)
export async function createOrganization(name: string, slug: string): Promise<Organization>

// Organisation bearbeiten (nur Super-Admin)
export async function updateOrganization(orgId: string, data: Partial<Organization>): Promise<Organization>

// Organisation deaktivieren (nur Super-Admin)
export async function deactivateOrganization(orgId: string): Promise<void>

// User zu Organisation hinzufügen (Super-Admin kann in jede Org)
export async function addUserToOrganization(orgId: string, userId: string, role: UserRole): Promise<void>
```

---

### 9. **Sicherheit & RLS**

#### Wichtige Punkte:
- Super-Admin darf **nicht** automatisch alle Daten sehen
- Super-Admin muss **explizit** zu einer Organisation wechseln
- RLS-Policies müssen Super-Admin berücksichtigen, aber nicht zu permissiv sein
- Super-Admin kann nur in Organisationen, in denen er Admin ist

#### RLS-Strategie:
```sql
-- Super-Admin kann alle Organisationen sehen
CREATE POLICY "super_admin_read_organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role = 'super_admin'
      AND om.is_active = true
    )
  );

-- Super-Admin kann Organisationen erstellen
CREATE POLICY "super_admin_create_organizations"
  ON organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role = 'super_admin'
      AND om.is_active = true
    )
  );
```

---

### 10. **Migration-Strategie**

#### Schritt 1: Super-Admin Rolle hinzufügen
- `UserRole` Enum erweitern
- Bestehenden App-Inhaber als SUPER_ADMIN markieren (SQL)

#### Schritt 2: RLS-Policies anpassen
- Neue Policies für Super-Admin erstellen
- Bestehende Policies erweitern

#### Schritt 3: UI-Komponenten erstellen
- `OrganizationManagementModal`
- Organisation-Dropdown im Header
- Super-Admin-Checks in bestehenden Komponenten

#### Schritt 4: Services erweitern
- Neue Funktionen in `supabaseOrganizationService.ts`
- `loadUserWithOrganizations` erweitern für Super-Admin

---

## 🎨 UI/UX Vorschläge

### Header mit Organisation-Dropdown:
```
┌─────────────────────────────────────────────────────┐
│ FLX-ASSETS    [Organisation ▼]    [User ▼] [Logout]│
│              FLX Software                          │
│              ────────────                          │
│              Kunde A GmbH                          │
│              Kunde B GmbH                          │
└─────────────────────────────────────────────────────┘
```

### Super-Admin Dashboard:
```
┌─────────────────────────────────────────────────────┐
│ [Organisationen verwalten] [Benutzer verwalten]     │
│                                                     │
│ Aktuelle Organisation: FLX Software                │
│                                                     │
│ [Normales Dashboard wie bisher]                    │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Empfohlene Implementierung

### Phase 1: Grundlagen
1. ✅ `SUPER_ADMIN` Rolle hinzufügen
2. ✅ SQL-Funktion `is_super_admin()` erstellen
3. ✅ RLS-Policies für Super-Admin anpassen
4. ✅ Bestehenden App-Inhaber als SUPER_ADMIN markieren

### Phase 2: Organisation-Management
5. ✅ `OrganizationManagementModal` Komponente
6. ✅ Service-Funktionen für Organisation-CRUD
7. ✅ Button im Dashboard (nur für Super-Admin)

### Phase 3: Multi-Organisation-Login
8. ✅ Organisation-Dropdown im Header
9. ✅ `switchOrganization` Funktion
10. ✅ Daten neu laden beim Wechsel

### Phase 4: Erweiterte Features
11. ✅ User-Management über Organisationen hinweg
12. ✅ Statistiken pro Organisation
13. ✅ Bulk-Operationen (User zu mehreren Orgs hinzufügen)

---

## 🔒 Sicherheitsüberlegungen

1. **Super-Admin sollte nicht automatisch alle Daten sehen**
   - Muss explizit zu Organisation wechseln
   - RLS-Policies respektieren `organizationId`

2. **Audit-Log**
   - Wer hat welche Organisation erstellt?
   - Wer hat User zu welcher Organisation hinzugefügt?

3. **Rate Limiting**
   - Organisation-Erstellung limitieren
   - User-Erstellung über Organisationen hinweg limitieren

---

## 📝 Offene Fragen

1. **Soll Super-Admin automatisch Admin in neuen Organisationen sein?**
   - Ja: Automatisch Admin-Membership erstellen
   - Nein: Super-Admin muss sich manuell hinzufügen

2. **Soll Super-Admin alle Assets/User sehen können ohne zu wechseln?**
   - Nein (empfohlen): Muss zu Organisation wechseln
   - Ja: Globales Dashboard mit allen Daten

3. **Soll es eine "System-Organisation" geben?**
   - Für Super-Admin als "Home-Base"
   - Oder Super-Admin hat keine feste Organisation

---

## 🚀 Nächste Schritte

Nach deinem Go würde ich implementieren:
1. Super-Admin Rolle + RLS-Policies
2. Organisation-Management-Modal
3. Organisation-Dropdown im Header
4. Service-Funktionen für Organisation-CRUD

Soll ich mit der Implementierung starten?
