import { supabase } from '../lib/supabaseClient';
import { Organization, User, UserRole, DBOrganizationMember } from '../types';

/**
 * Lädt alle Organisationen eines Users
 */
export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      organizations(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Fehler beim Laden der Organisationen:', error);
    throw error;
  }

  if (!data) return [];

  return data.map((item: any) => item.organizations).filter(Boolean);
}

/**
 * Erstellt eine neue Organisation
 * @param name Name der Organisation
 * @param slug Optional: Slug (wird automatisch generiert wenn nicht angegeben)
 * @param currentUserId Optional: User-ID des Super-Admins (wird automatisch als Admin hinzugefügt)
 */
export async function createOrganization(
  name: string, 
  slug?: string, 
  currentUserId?: string
): Promise<Organization> {
  const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name,
      slug: generatedSlug,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Fehler beim Erstellen der Organisation:', error);
    throw error || new Error('Organisation konnte nicht erstellt werden');
  }

  // Wenn currentUserId angegeben ist, füge Super-Admin automatisch als Admin hinzu
  if (currentUserId) {
    try {
      await addMemberToOrganization(data.id, currentUserId, 'admin');
      console.log('✅ Super-Admin automatisch als Admin zur neuen Organisation hinzugefügt');
    } catch (memberError) {
      console.warn('⚠️ Konnte Super-Admin nicht automatisch hinzufügen:', memberError);
      // Fehler ignorieren, Organisation wurde erstellt
    }
  }

  return data;
}

/**
 * Lädt alle Organisationen (nur für Super-Admin)
 */
export async function fetchAllOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Fehler beim Laden aller Organisationen:', error);
    throw error;
  }

  return data || [];
}

/**
 * Aktualisiert eine Organisation (nur für Super-Admin)
 */
export async function updateOrganization(
  orgId: string, 
  data: Partial<Organization>
): Promise<Organization> {
  const { data: updated, error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', orgId)
    .select()
    .single();

  if (error || !updated) {
    console.error('Fehler beim Aktualisieren der Organisation:', error);
    throw error || new Error('Organisation konnte nicht aktualisiert werden');
  }

  return updated;
}

/**
 * Deaktiviert eine Organisation (soft delete, nur für Super-Admin)
 */
export async function deactivateOrganization(orgId: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ is_active: false })
    .eq('id', orgId);

  if (error) {
    console.error('Fehler beim Deaktivieren der Organisation:', error);
    throw error;
  }
}

/**
 * Lädt alle Mitglieder einer Organisation
 */
export async function fetchOrganizationMembers(organizationId: string): Promise<User[]> {
  console.log('🔵 fetchOrganizationMembers: Lade Mitglieder für Org:', organizationId);
  
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      profiles(*)
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) {
    console.error('❌ fetchOrganizationMembers: Fehler beim Laden:', error);
    throw error;
  }

  if (!data) {
    console.log('⚠️ fetchOrganizationMembers: Keine Daten zurückgegeben');
    return [];
  }

  console.log('✅ fetchOrganizationMembers: Gefundene Memberships:', data.length);

  return data
    .filter((member: any) => member.profiles) // Filtere Members ohne Profil
    .map((member: any) => {
      const profile = member.profiles;
      if (!profile) {
        console.warn('⚠️ fetchOrganizationMembers: Member ohne Profil gefunden:', member.user_id);
        return null;
      }
      
      const nameParts = (profile.full_name || '').split(' ');
      return {
        id: profile.id,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        name: profile.full_name || 'Unbekannt',
        email: '', // Müsste aus auth.users geladen werden
        username: '',
        role: member.role as UserRole,
        organizationId: organizationId,
      };
    })
    .filter((user): user is User => user !== null); // Entferne null-Werte
}

/**
 * Fügt einen User zu einer Organisation hinzu
 */
export async function addMemberToOrganization(
  organizationId: string,
  userId: string,
  role: UserRole
): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role,
      is_active: true,
    });

  if (error) {
    console.error('Fehler beim Hinzufügen des Members:', error);
    throw error;
  }
}

/**
 * Entfernt einen User aus einer Organisation (soft delete)
 */
export async function removeMemberFromOrganization(
  organizationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ is_active: false })
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Fehler beim Entfernen des Members:', error);
    throw error;
  }
}

/**
 * Ändert die Rolle eines Members
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: UserRole
): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Fehler beim Aktualisieren der Rolle:', error);
    throw error;
  }
}
