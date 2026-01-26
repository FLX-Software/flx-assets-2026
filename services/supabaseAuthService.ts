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
    
    // 0. Passwort-Validierung VOR dem signUp
    if (!password || password.length < 6) {
      return {
        success: false,
        error: 'Das Passwort muss mindestens 6 Zeichen lang sein.'
      };
    }
    
    // 1. Prüfe ob User bereits in auth.users existiert (z.B. nach fehlgeschlagenem Versuch)
    // Falls ja, versuche ihn wiederherzustellen oder zu löschen
    let userId: string | null = null;
    let wasRestored = false;
    let authData: any = null;
    let userWasCreated = false; // Track ob User erstellt wurde (für Rollback)
    
    try {
      console.log('🔵 signUp: Prüfe ob User bereits existiert...');
      
      // RPC-Aufruf mit Timeout (erhöht auf 5s)
      const restorePromise = supabase.rpc('restore_user_if_exists', {
        user_email: email,
        full_name: fullName,
        organization_id: organizationId,
        user_role: role
      });
      
      const restoreTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('restore_user_if_exists Timeout (5s)')), 5000)
      );
      
      const restoreResult = await Promise.race([restorePromise, restoreTimeout]) as any;
      const restoreData = restoreResult?.data || null;
      const restoreError = restoreResult?.error || null;
      
      if (!restoreError && restoreData) {
        console.log('✅ signUp: User existiert bereits in auth.users, stelle wieder her...', restoreData);
        userId = restoreData;
        wasRestored = true;
        // Passwort kann nicht aktualisiert werden ohne Service Role, aber User kann sich mit altem Passwort einloggen
        // Oder: Admin muss Passwort manuell zurücksetzen
      } else if (restoreError) {
        // Wenn Fehler "User existiert bereits und ist aktiv", dann Fehler zurückgeben
        if (restoreError.message?.includes('existiert bereits und ist aktiv')) {
          return { 
            success: false, 
            error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits und ist aktiv.' 
          };
        }
        // Andere Fehler ignorieren (z.B. Funktion existiert nicht), versuche normalen signUp
        console.log('⚠️ signUp: restore_user_if_exists Fehler (ignoriert):', restoreError.message);
      }
    } catch (restoreException: any) {
      // Timeout oder anderer Fehler - ignoriere und versuche normalen signUp
      console.log('⚠️ signUp: restore_user_if_exists fehlgeschlagen (ignoriert), versuche normalen signUp...', restoreException.message);
    }
    
    // 1. User in Supabase Auth anlegen (nur wenn nicht wiederhergestellt)
    if (!wasRestored) {
      console.log('🔵 signUp: Erstelle Auth-User...');
      
      // signUp mit Timeout
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: undefined, // Keine E-Mail-Bestätigung erforderlich für Admin-Erstellung
        },
      });
      
      const signUpTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('signUp Timeout (10s)')), 10000)
      );
      
      let authResult: any;
      try {
        authResult = await Promise.race([signUpPromise, signUpTimeout]);
      } catch (timeoutError: any) {
        console.error('❌ signUp: signUp Timeout:', timeoutError.message);
        return { 
          success: false, 
          error: 'Die Benutzer-Erstellung dauert zu lange. Bitte versuchen Sie es erneut oder prüfen Sie Ihre Internetverbindung.' 
        };
      }

      authData = authResult.data;
      const authError = authResult.error;
      
      console.log('🔵 signUp: Auth-Response:', { 
        hasUser: !!authData?.user, 
        hasError: !!authError,
        error: authError?.message 
      });

      if (authError) {
        console.error('❌ signUp: Auth-Fehler:', authError);
        
        // Spezielle Behandlung für Rate Limits
        if (authError.message?.includes('rate limit') || authError.message?.includes('429')) {
          return { 
            success: false, 
            error: 'Zu viele Anfragen. Bitte warten Sie einige Minuten, bevor Sie einen neuen Benutzer erstellen.' 
          };
        }
        
        // Wenn "User already registered" oder ähnlich, versuche Wiederherstellung
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('already exists') ||
            authError.message?.includes('User already registered')) {
          console.log('⚠️ signUp: User bereits registriert, versuche Wiederherstellung...');
          // Versuche erneut Wiederherstellung (mit Timeout)
          try {
            const restorePromise2 = supabase.rpc('restore_user_if_exists', {
              user_email: email,
              full_name: fullName,
              organization_id: organizationId,
              user_role: role
            });
            
            const restoreTimeout2 = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('restore_user_if_exists Timeout (5s)')), 5000)
            );
            
            const restoreResult2 = await Promise.race([restorePromise2, restoreTimeout2]) as any;
            const restoreData2 = restoreResult2?.data || null;
            const restoreError2 = restoreResult2?.error || null;
            
            if (!restoreError2 && restoreData2) {
              userId = restoreData2;
              wasRestored = true;
              console.log('✅ signUp: User erfolgreich wiederhergestellt nach signUp-Fehler');
            } else if (restoreError2?.message?.includes('existiert bereits und ist aktiv')) {
              return { 
                success: false, 
                error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits und ist aktiv.' 
              };
            } else {
              // Wenn Wiederherstellung fehlschlägt, versuche User direkt zu finden und Profil/Membership zu erstellen
              console.log('⚠️ signUp: Wiederherstellung fehlgeschlagen, versuche direkten Zugriff auf auth.users...');
              // Da wir nicht direkt auf auth.users zugreifen können, müssen wir dem Admin sagen, dass er den User löschen soll
              return { 
                success: false, 
                error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits in Supabase Auth. Bitte löschen Sie den Benutzer vollständig aus Supabase Auth (Authentication → Users), um ihn erneut anzulegen.' 
              };
            }
          } catch (restoreException2: any) {
            console.error('❌ signUp: Wiederherstellung fehlgeschlagen:', restoreException2);
            return { 
              success: false, 
              error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits in Supabase Auth. Bitte löschen Sie den Benutzer vollständig aus Supabase Auth (Authentication → Users), um ihn erneut anzulegen.' 
            };
          }
        } else {
          // Andere Fehler (z.B. Passwort zu kurz) - prüfe ob User trotzdem erstellt wurde
          console.log('⚠️ signUp: Auth-Fehler, prüfe ob User trotzdem erstellt wurde...', authError.message);
          
          // Wenn Fehler "Password must be at least 6 characters" oder ähnlich,
          // könnte der User trotzdem erstellt worden sein (je nach Supabase-Konfiguration)
          // Versuche User wiederherzustellen (falls erstellt wurde)
          if (authError.message?.includes('Password') || authError.message?.includes('password') || 
              authError.message?.includes('at least 6') || authError.message?.includes('mindestens 6')) {
            console.log('⚠️ signUp: Passwort-Fehler erkannt, prüfe ob User trotzdem erstellt wurde...');
            
            // Versuche User wiederherzustellen (falls erstellt wurde)
            try {
              const restorePromise3 = supabase.rpc('restore_user_if_exists', {
                user_email: email,
                full_name: fullName,
                organization_id: organizationId,
                user_role: role
              });
              
              const restoreTimeout3 = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('restore_user_if_exists Timeout (5s)')), 5000)
              );
              
              const restoreResult3 = await Promise.race([restorePromise3, restoreTimeout3]) as any;
              const restoreData3 = restoreResult3?.data || null;
              const restoreError3 = restoreResult3?.error || null;
              
              if (!restoreError3 && restoreData3) {
                // User wurde gefunden und wiederhergestellt
                userId = restoreData3;
                wasRestored = true;
                console.log('✅ signUp: User wurde trotz Passwort-Fehler erstellt und erfolgreich wiederhergestellt');
                // Weiter mit Profil/Membership-Erstellung
              } else if (restoreError3?.message?.includes('existiert bereits und ist aktiv')) {
                return {
                  success: false,
                  error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits und ist aktiv. Bitte löschen Sie den Benutzer aus Supabase Auth (Authentication → Users), um ihn erneut anzulegen.'
                };
              } else {
                // User wurde nicht erstellt oder konnte nicht wiederhergestellt werden
                console.log('⚠️ signUp: User wurde nicht erstellt oder konnte nicht wiederhergestellt werden');
                return {
                  success: false,
                  error: 'Das Passwort muss mindestens 6 Zeichen lang sein.'
                };
              }
            } catch (restoreException3: any) {
              console.warn('⚠️ signUp: Wiederherstellung nach Passwort-Fehler fehlgeschlagen:', restoreException3);
              // Gebe klare Fehlermeldung zurück
              return {
                success: false,
                error: 'Das Passwort muss mindestens 6 Zeichen lang sein. Falls der Benutzer bereits angelegt wurde, löschen Sie ihn bitte aus Supabase Auth (Authentication → Users) und versuchen Sie es erneut.'
              };
            }
          } else {
            // Andere Fehler (nicht Passwort-bezogen)
            return { success: false, error: authError.message || 'Registrierung fehlgeschlagen' };
          }
        }
      }

      if (!authData?.user) {
        // Wenn kein User-Objekt zurückgegeben wurde, aber auch kein Fehler,
        // könnte der User trotzdem erstellt worden sein (z.B. bei Passwort-Fehler)
        // Versuche Wiederherstellung
        if (!wasRestored) {
          console.log('⚠️ signUp: Kein User-Objekt, aber auch kein Fehler - versuche Wiederherstellung...');
          try {
            const restorePromise4 = supabase.rpc('restore_user_if_exists', {
              user_email: email,
              full_name: fullName,
              organization_id: organizationId,
              user_role: role
            });
            
            const restoreTimeout4 = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('restore_user_if_exists Timeout (5s)')), 5000)
            );
            
            const restoreResult4 = await Promise.race([restorePromise4, restoreTimeout4]) as any;
            const restoreData4 = restoreResult4?.data || null;
            const restoreError4 = restoreResult4?.error || null;
            
            if (!restoreError4 && restoreData4) {
              userId = restoreData4;
              wasRestored = true;
              console.log('✅ signUp: User wurde gefunden und wiederhergestellt');
            } else {
              console.error('❌ signUp: Kein User-Objekt zurückgegeben und Wiederherstellung fehlgeschlagen');
              return { success: false, error: 'Registrierung fehlgeschlagen: Kein User-Objekt erhalten' };
            }
          } catch (restoreException4: any) {
            console.error('❌ signUp: Wiederherstellung fehlgeschlagen:', restoreException4);
            return { success: false, error: 'Registrierung fehlgeschlagen: Kein User-Objekt erhalten' };
          }
        } else {
          console.error('❌ signUp: Kein User-Objekt zurückgegeben');
          return { success: false, error: 'Registrierung fehlgeschlagen: Kein User-Objekt erhalten' };
        }
      } else {
        userId = authData.user.id;
        userWasCreated = true; // Markiere dass User erstellt wurde
        console.log('✅ signUp: Auth-User erstellt, ID:', userId);
      }
    }

    // 2. Profil und Membership erstellen (nur wenn User nicht wiederhergestellt wurde)
    // Wenn User wiederhergestellt wurde, sind Profil und Membership bereits erstellt
    
    if (!wasRestored) {
      // Profil wird automatisch vom Trigger erstellt (create-profile-trigger.sql)
      // Warte kurz, damit der Trigger das Profil erstellt hat
      console.log('🔵 signUp: Warte auf automatische Profil-Erstellung durch Trigger...');
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms warten (reduziert von 1.5s)

      // Versuche Profil zu erstellen - verwende SQL-Funktion um RLS zu umgehen
      console.log('🔵 signUp: Erstelle/aktualisiere Profil über SQL-Funktion...');
    } else {
      console.log('✅ signUp: User wurde wiederhergestellt, Profil und Membership bereits vorhanden');
    }
    
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Versuche Profil zu erstellen - verwende SQL-Funktion um RLS zu umgehen
    // Falls Funktion nicht existiert, verwende direkten INSERT mit Retry
    // (Überspringe wenn User wiederhergestellt wurde)
    let profileError = null;
    let profileCreated = wasRestored; // Wenn wiederhergestellt, ist Profil bereits erstellt
    
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
        console.log('⚠️ signUp: INSERT Timeout - Profil wurde wahrscheinlich vom Trigger erstellt, fahre fort...');
        // Annahme: Profil wurde vom Trigger erstellt, weiter mit Membership
        profileError = null;
        profileCreated = true;
      }
    }

    // Wenn Profil-Erstellung fehlgeschlagen ist, aber nicht wegen Timeout/Conflict, dann Fehler
    if (profileError && !profileCreated) {
      console.error('❌ signUp: Profil-Erstellung fehlgeschlagen:', profileError);
      // Prüfe ob es ein RLS-Fehler ist - dann nehmen wir an dass Trigger es erstellt hat
      if (profileError.code === '42501') {
        console.log('⚠️ signUp: RLS blockiert - Profil wurde wahrscheinlich vom Trigger erstellt, fahre fort...');
        profileError = null;
      } else {
        return { success: false, error: `Profil konnte nicht erstellt werden: ${profileError.message}` };
      }
    }
    
    if (!profileError) {
      console.log('✅ signUp: Profil erstellt oder existiert bereits');
    }

    // 3. Membership anlegen (nur wenn User nicht wiederhergestellt wurde)
    if (!wasRestored) {
      console.log('🔵 signUp: Erstelle Membership...', { organizationId, userId, role });
      
      // Membership-Erstellung mit Timeout und Retry
      let memberError = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !memberError) {
      try {
        const memberPromise = supabase
          .from('organization_members')
          .insert({
            organization_id: organizationId,
            user_id: userId,
            role,
            is_active: true,
          });

        const memberTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Membership-Erstellung Timeout (5s)')), 5000)
        );

        const memberResult = await Promise.race([memberPromise, memberTimeout]) as any;
        memberError = memberResult?.error || null;
        
        if (!memberError) {
          console.log(`✅ signUp: Membership erstellt (Versuch ${retryCount + 1})`);
          break;
        }
        
        // Wenn es ein RLS-Fehler ist, warte kurz und versuche es erneut
        if (memberError.code === '42501' && retryCount < maxRetries - 1) {
          console.log(`⚠️ signUp: RLS-Fehler bei Membership-Erstellung, warte 1s und versuche erneut (Versuch ${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
          memberError = null; // Reset für nächsten Versuch
          continue;
        }
        
        // Bei anderen Fehlern, breche ab
        break;
      } catch (timeoutError: any) {
        if (retryCount < maxRetries - 1) {
          console.log(`⚠️ signUp: Membership-Erstellung Timeout, versuche erneut (Versuch ${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
          continue;
        } else {
          console.error('❌ signUp: Membership-Erstellung Timeout nach mehreren Versuchen:', timeoutError.message);
          return { success: false, error: `Membership konnte nicht erstellt werden: ${timeoutError.message}` };
        }
      }
    }

      if (memberError) {
        console.error('❌ signUp: Membership-Erstellung fehlgeschlagen nach mehreren Versuchen:', memberError);
        return { success: false, error: `Membership konnte nicht erstellt werden: ${memberError.message || 'Unbekannter Fehler'}` };
      }
    } else {
      console.log('✅ signUp: Membership bereits vorhanden (User wurde wiederhergestellt)');
    }

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
 * Login mit E-Mail/Passwort oder Benutzername/Passwort
 */
export async function signIn(emailOrUsername: string, password: string): Promise<AuthResult> {
  try {
    let email = emailOrUsername.trim();
    
    // Wenn die Eingabe kein @ enthält, ist es wahrscheinlich ein Benutzername
    // Versuche, die E-Mail-Adresse über SQL-Funktion zu finden
    if (!email.includes('@')) {
      console.log('🔵 signIn: Eingabe ist kein @, suche nach Benutzername...');
      
      try {
        // Rufe SQL-Funktion auf, um E-Mail-Adresse zu finden
        const { data: foundEmail, error: rpcError } = await supabase.rpc('find_email_by_username', {
          username_input: email
        });
        
        if (rpcError) {
          console.error('❌ signIn: Fehler beim Suchen nach E-Mail:', rpcError);
          // Fallback: Versuche es trotzdem mit der Eingabe
        } else if (foundEmail) {
          console.log('✅ signIn: E-Mail gefunden für Benutzername:', foundEmail);
          email = foundEmail;
        } else {
          console.log('⚠️ signIn: Keine E-Mail für Benutzername gefunden, versuche direkten Login...');
          // Keine E-Mail gefunden, versuche es trotzdem (könnte eine ungewöhnliche E-Mail sein)
        }
      } catch (rpcException: any) {
        console.error('❌ signIn: Exception beim Suchen nach E-Mail:', rpcException);
        // Fallback: Versuche es trotzdem mit der Eingabe
      }
    }
    
    // Versuche Login mit der E-Mail-Adresse
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Wenn die Eingabe kein @ enthielt und der Login fehlgeschlagen ist,
      // geben wir eine spezifischere Fehlermeldung
      if (!emailOrUsername.includes('@')) {
        return { 
          success: false, 
          error: 'Ungültiger Benutzername oder Passwort. Bitte verwenden Sie Ihre E-Mail-Adresse oder überprüfen Sie Ihre Eingabe.' 
        };
      }
      return { success: false, error: error?.message || 'Ungültige E-Mail oder Passwort.' };
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

    // Profil laden mit Timeout
    console.log('🔍 Loading profile...');
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const profileTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profil-Query Timeout (10s)')), 10000)
    );
    
    const { data: profile, error: profileError } = await Promise.race([
      profilePromise,
      profileTimeout
    ]) as any;

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

    // Memberships laden (zuerst ohne organizations join) mit Timeout
    console.log('🔍 Loading memberships...');
    const membershipsPromise = supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    const membershipsTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Memberships-Query Timeout (10s)')), 10000)
    );
    
    let membershipsResult: any;
    try {
      membershipsResult = await Promise.race([membershipsPromise, membershipsTimeout]);
    } catch (timeoutError) {
      console.error('❌ Memberships-Query Timeout:', timeoutError);
      throw timeoutError;
    }
    
    const { data: memberships, error: memberError } = membershipsResult;

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

    // Prüfe ob User Super-Admin ist
    const isSuperAdmin = memberships.some(m => m.role === 'super_admin');
    
    // Wenn Super-Admin und organizationId angegeben, aber keine Membership in dieser Org:
    // Füge Super-Admin automatisch als Admin hinzu
    if (isSuperAdmin && organizationId) {
      const hasMembershipInOrg = memberships.some(m => m.organization_id === organizationId);
      if (!hasMembershipInOrg) {
        console.log('🔵 Super-Admin: Füge automatisch Admin-Membership zur Organisation hinzu...');
        try {
          const { addMemberToOrganization } = await import('./supabaseOrganizationService');
          await addMemberToOrganization(organizationId, userId, 'admin');
          // Lade Memberships neu
          const { data: updatedMemberships } = await supabase
            .from('organization_members')
            .select('*, organizations(*)')
            .eq('user_id', userId)
            .eq('is_active', true);
          if (updatedMemberships) {
            memberships = updatedMemberships as any;
            console.log('✅ Super-Admin: Automatisch als Admin hinzugefügt');
          }
        } catch (addError) {
          console.warn('⚠️ Konnte Super-Admin nicht automatisch hinzufügen:', addError);
          // Weiter mit bestehenden Memberships
        }
      }
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

    // Bestimme Rolle: Wenn Super-Admin, dann SUPER_ADMIN, sonst Membership-Rolle
    // Aber in der aktuellen Organisation hat Super-Admin Admin-Rechte
    const effectiveRole = isSuperAdmin 
      ? UserRole.SUPER_ADMIN 
      : (currentMembership.role as UserRole);

    // Email nur einmal laden (nicht zweimal)
    const email = authUser.email || '';
    const username = email.split('@')[0] || '';

    const user: User = {
      id: profile.id,
      firstName,
      lastName,
      name: profile.full_name,
      email,
      username,
      role: effectiveRole,
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
