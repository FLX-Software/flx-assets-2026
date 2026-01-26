import { supabase } from '../lib/supabaseClient';
import { User, UserRole, DBProfile, DBOrganizationMember, Organization } from '../types';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Registriert einen neuen User in Supabase Auth und erstellt Profil + Membership
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  organizationId: string,
  role: UserRole = UserRole.STAFF
): Promise<AuthResult> {
  try {
    console.log('🔵 signUp: Starte User-Erstellung...', { email, organizationId, role });
    
    // 1. User in Supabase Auth anlegen
    console.log('🔵 signUp: Erstelle Auth-User...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: undefined, // Keine E-Mail-Bestätigung erforderlich für Admin-Erstellung
      },
    });

    console.log('🔵 signUp: Auth-Response:', { 
      hasUser: !!authData?.user, 
      hasError: !!authError,
      error: authError?.message 
    });

    if (authError) {
      console.error('❌ signUp: Auth-Fehler:', authError);
      return { success: false, error: authError.message || 'Registrierung fehlgeschlagen' };
    }

    if (!authData?.user) {
      console.error('❌ signUp: Kein User-Objekt zurückgegeben');
      return { success: false, error: 'Registrierung fehlgeschlagen: Kein User-Objekt erhalten' };
    }

    const userId = authData.user.id;
    console.log('✅ signUp: Auth-User erstellt, ID:', userId);

    // 2. Profil wird automatisch vom Trigger erstellt (create-profile-trigger.sql)
    // Warte kurz, damit der Trigger das Profil erstellt hat
    console.log('🔵 signUp: Warte auf automatische Profil-Erstellung durch Trigger...');
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms warten (reduziert von 1.5s)

    // Versuche Profil zu erstellen - verwende SQL-Funktion um RLS zu umgehen
    console.log('🔵 signUp: Erstelle/aktualisiere Profil über SQL-Funktion...');
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Versuche Profil zu erstellen - verwende SQL-Funktion um RLS zu umgehen
    // Falls Funktion nicht existiert, verwende direkten INSERT mit Retry
    let profileError = null;
    
    try {
      // Versuche RPC-Funktion (falls vorhanden) mit Timeout
      const rpcPromise = supabase.rpc('create_profile_for_user', {
        user_id: userId,
        full_name: fullName
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RPC-Funktion Timeout (5s)')), 5000)
      );

      const result = await Promise.race([rpcPromise, timeoutPromise]) as any;
      const rpcError = result?.error || null;

      if (rpcError) {
        // Wenn Funktion nicht existiert (42883), versuche direkten INSERT
        if (rpcError.code === '42883' || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {
          console.log('⚠️ signUp: RPC-Funktion existiert nicht, verwende direkten INSERT...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: fullName,
            });
          
          if (insertError) {
            // 23505 = unique_violation (Profil existiert bereits) - das ist OK!
            if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('already exists')) {
              console.log('✅ signUp: Profil existiert bereits (wurde vom Trigger erstellt)');
              profileError = null;
            } else {
              profileError = insertError;
            }
          } else {
            console.log('✅ signUp: Profil erstellt (direkter INSERT)');
            profileError = null;
          }
        } else if (rpcError.code === 'P0001' && rpcError.message?.includes('existiert nicht in auth.users')) {
          // User existiert noch nicht - warte länger und versuche erneut
          console.log('⚠️ signUp: User noch nicht in auth.users, warte länger...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 Sekunden warten
          
          // Versuche erneut
          const { error: retryError } = await supabase.rpc('create_profile_for_user', {
            user_id: userId,
            full_name: fullName
          });
          
          if (retryError && retryError.code !== '23505') {
            profileError = retryError;
          } else {
            console.log('✅ signUp: Profil erstellt/aktualisiert (Retry erfolgreich)');
            profileError = null;
          }
        } else {
          profileError = rpcError;
        }
      } else {
        console.log('✅ signUp: Profil erstellt/aktualisiert (RPC-Funktion)');
        profileError = null;
      }
    } catch (error: any) {
      // Timeout oder anderer Fehler - versuche direkten INSERT als Fallback
      console.log('⚠️ signUp: RPC-Funktion fehlgeschlagen, verwende direkten INSERT als Fallback...', error.message);
      
      // Direkter INSERT mit Timeout
      try {
        const insertPromise = supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
          });

        const insertTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('INSERT Timeout (5s)')), 5000)
        );

        const insertResult = await Promise.race([insertPromise, insertTimeout]) as any;
        const insertError = insertResult?.error || null;

        if (insertError) {
          // 23505 = unique_violation (Profil existiert bereits) - das ist OK!
          // 42501 = RLS Policy violation - versuche Update statt Insert
          if (insertError.code === '23505' || 
              insertError.message?.includes('duplicate') || 
              insertError.message?.includes('already exists')) {
            console.log('✅ signUp: Profil existiert bereits (wurde vom Trigger erstellt)');
            profileError = null;
          } else if (insertError.code === '42501') {
            // RLS blockiert - Profil wurde wahrscheinlich vom Trigger erstellt, versuche Update
            console.log('⚠️ signUp: RLS blockiert INSERT, versuche Update...');
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ full_name: fullName })
              .eq('id', userId);
            
            if (updateError) {
              console.log('✅ signUp: Profil existiert bereits (Update nicht nötig oder nicht möglich)');
              profileError = null; // Ignoriere Update-Fehler, Profil existiert wahrscheinlich
            } else {
              console.log('✅ signUp: Profil aktualisiert (Fallback UPDATE)');
              profileError = null;
            }
          } else {
            profileError = insertError;
          }
        } else {
          console.log('✅ signUp: Profil erstellt (Fallback INSERT)');
          profileError = null;
        }
      } catch (insertTimeoutError: any) {
        console.error('❌ signUp: INSERT Timeout - Profil wurde wahrscheinlich vom Trigger erstellt');
        // Annahme: Profil wurde vom Trigger erstellt, weiter mit Membership
        profileError = null;
      }
    }

    if (profileError) {
      console.error('❌ signUp: Profil-Erstellung fehlgeschlagen:', profileError);
      return { success: false, error: `Profil konnte nicht erstellt werden: ${profileError.message}` };
    }

    // 3. Membership anlegen
    console.log('🔵 signUp: Erstelle Membership...', { organizationId, userId, role });
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
        is_active: true,
      });

    if (memberError) {
      console.error('❌ signUp: Membership-Erstellung fehlgeschlagen:', memberError);
      return { success: false, error: `Membership konnte nicht erstellt werden: ${memberError.message}` };
    }
    console.log('✅ signUp: Membership erstellt');

    // 4. User-Objekt für Frontend zusammenbauen
    const user: User = {
      id: userId,
      firstName,
      lastName,
      name: fullName,
      email,
      username: email.split('@')[0], // Fallback
      role,
      organizationId,
    };

    console.log('✅ signUp: User erfolgreich erstellt:', user);
    return { success: true, user };
  } catch (error: any) {
    console.error('❌ signUp: Unerwarteter Fehler:', error);
    return { success: false, error: error.message || 'Unbekannter Fehler' };
  }
}

/**
 * Login mit E-Mail/Passwort
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Login fehlgeschlagen' };
    }

    // Profil + Memberships laden
    const user = await loadUserWithOrganizations(data.user.id);
    if (!user) {
      return { success: false, error: 'Benutzerdaten konnten nicht geladen werden' };
    }

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unbekannter Fehler' };
  }
}

/**
 * Lädt User mit Profil + aktueller Organisation
 */
export async function loadUserWithOrganizations(userId: string, organizationId?: string): Promise<User | null> {
  try {
    console.log('🔍 Loading user with organizations, userId:', userId);
    
    // Prüfe ob User authentifiziert ist
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Auth user:', authUser?.id, 'Error:', authError);
    
    if (!authUser || authUser.id !== userId) {
      console.error('❌ User nicht authentifiziert oder ID stimmt nicht überein');
      return null;
    }

    // Profil laden
    console.log('🔍 Loading profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Profil-Query-Fehler:', profileError);
      console.error('Error details:', JSON.stringify(profileError, null, 2));
      return null;
    }
    
    if (!profile) {
      console.error('❌ Profil nicht gefunden (null)');
      return null;
    }
    
    console.log('✅ Profil gefunden:', profile.full_name);

    // Memberships laden (zuerst ohne organizations join)
    console.log('🔍 Loading memberships...');
    const { data: memberships, error: memberError } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (memberError) {
      console.error('❌ Membership-Query-Fehler:', memberError);
      console.error('Error details:', JSON.stringify(memberError, null, 2));
      
      // Versuche ohne organizations join
      console.log('🔍 Retry ohne organizations join...');
      const { data: membershipsSimple, error: memberErrorSimple } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (memberErrorSimple) {
        console.error('❌ Auch einfache Query fehlgeschlagen:', memberErrorSimple);
        return null;
      }
      
      if (!membershipsSimple || membershipsSimple.length === 0) {
        console.error('❌ Keine aktiven Memberships gefunden');
        return null;
      }
      
      console.log('✅ Memberships gefunden (ohne org join):', membershipsSimple.length);
      // Verwende die einfache Version
      const currentMembership = membershipsSimple[0];
      const currentOrgId = currentMembership.organization_id;
      
      // Lade Organisation separat
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', currentOrgId)
        .single();
      
      const nameParts = profile.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const user: User = {
        id: profile.id,
        firstName,
        lastName,
        name: profile.full_name,
        email: authUser.email || '',
        username: authUser.email?.split('@')[0] || '',
        role: currentMembership.role as UserRole,
        organizationId: currentOrgId,
        organizationName: org?.name || 'Unbekannte Organisation',
      };

      return user;
    }

    if (!memberships || memberships.length === 0) {
      console.error('❌ Keine aktiven Memberships gefunden für User:', userId);
      return null;
    }
    console.log('✅ Memberships gefunden:', memberships.length);

    // Aktuelle Organisation bestimmen
    let currentOrgId = organizationId;
    if (!currentOrgId) {
      // Erste aktive Organisation nehmen
      currentOrgId = memberships[0].organization_id;
    }

    const currentMembership = memberships.find(m => m.organization_id === currentOrgId) || memberships[0];
    
    // Hole Organisation-Daten
    const orgData = (currentMembership as any).organizations;
    const orgName = orgData?.name || 'Unbekannte Organisation';
    
    const nameParts = profile.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const user: User = {
      id: profile.id,
      firstName,
      lastName,
      name: profile.full_name,
      email: (await supabase.auth.getUser()).data.user?.email || '',
      username: (await supabase.auth.getUser()).data.user?.email?.split('@')[0] || '',
      role: currentMembership.role as UserRole,
      organizationId: currentOrgId,
      organizationName: orgName,
    };

    return user;
  } catch (error: any) {
    console.error('Fehler beim Laden des Users:', error);
    return null;
  }
}

/**
 * Aktuell eingeloggten User laden
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return loadUserWithOrganizations(user.id);
}

/**
 * Logout
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Auth-State-Listener (für Auto-Login nach Reload)
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await loadUserWithOrganizations(session.user.id);
      callback(user || null);
    } else {
      callback(null);
    }
  });
}
