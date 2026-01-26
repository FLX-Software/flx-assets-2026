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
 */
export async function createOrganization(name: string, slug?: string): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Fehler beim Erstellen der Organisation:', error);
    throw error || new Error('Organisation konnte nicht erstellt werden');
  }

  return data;
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
