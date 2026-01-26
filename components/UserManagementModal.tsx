
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { signUp } from '../services/supabaseAuthService';
import { removeMemberFromOrganization, updateMemberRole } from '../services/supabaseOrganizationService';
import { supabase } from '../lib/supabaseClient';

interface UserManagementModalProps {
  users: User[];
  organizationId: string;
  onClose: () => void;
  onUpdateUsers: (newUsers: User[]) => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ users, organizationId, onClose, onUpdateUsers, onShowNotification }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: UserRole.STAFF
  });
  const [sendImmediately, setSendImmediately] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const simulateEmailSend = (user: User) => {
    setIsSending(user.id);
    
    // Simulate network delay for the "automated email service"
    setTimeout(() => {
      console.log(`--- AUTOMATED EMAIL SERVICE ---`);
      console.log(`To: ${user.email}`);
      console.log(`Subject: Deine FLX-ASSETS Zugangsdaten`);
      console.log(`Body: Hallo ${user.firstName}, hier sind deine Logindaten:`);
      console.log(`Username: ${user.username}`);
      console.log(`Passwort: ${user.password}`);
      console.log(`-------------------------------`);
      
      onShowNotification(`E-Mail mit Zugangsdaten erfolgreich an ${user.email} gesendet.`, 'success');
      setIsSending(null);
    }, 1500);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.password || !formData.email) {
      onShowNotification("Bitte füllen Sie alle Pflichtfelder inklusive E-Mail aus.", "error");
      return;
    }

    if (!organizationId) {
      onShowNotification("Keine Organisation zugeordnet.", "error");
      return;
    }

    setIsCreating(true);
    console.log('🔵 UserManagementModal: Starte User-Erstellung...', { 
      email: formData.email, 
      organizationId,
      role: formData.role 
    });
    
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      
      // Erstelle User in Supabase Auth + Profil + Membership
      console.log('🔵 UserManagementModal: Rufe signUp auf...');
      const result = await signUp(
        formData.email,
        formData.password,
        fullName,
        organizationId,
        formData.role
      );

      console.log('🔵 UserManagementModal: signUp Ergebnis:', result);

      if (!result.success || !result.user) {
        console.error('❌ UserManagementModal: User-Erstellung fehlgeschlagen:', result.error);
        onShowNotification(result.error || 'Fehler beim Erstellen des Benutzers.', 'error');
        setIsCreating(false);
        return;
      }

      console.log('✅ UserManagementModal: User erfolgreich erstellt');

      // User zur Liste hinzufügen (mit Passwort für E-Mail)
      const userWithPassword = {
        ...result.user,
        password: formData.password // Passwort für E-Mail-Simulation
      };
      onUpdateUsers([...users, result.user]);
      
      if (sendImmediately) {
        simulateEmailSend(userWithPassword);
      } else {
        onShowNotification(`Benutzer ${result.user.name} wurde erfolgreich angelegt.`, 'success');
      }

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        role: UserRole.STAFF
      });
    } catch (error: any) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      onShowNotification(error.message || 'Fehler beim Erstellen des Benutzers.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!organizationId) {
      onShowNotification("Keine Organisation zugeordnet.", "error");
      return;
    }

    const userToDelete = users.find(u => u.id === id);
    const userName = userToDelete?.name || 'Benutzer';

    try {
      console.log('🔵 UserManagementModal: Starte Löschung für User:', id);
      
      // Versuche User komplett zu löschen (Membership + Profil)
      // Falls RPC-Funktion nicht existiert, nur Membership deaktivieren
      let deleteSuccess = false;
      try {
        console.log('🔵 UserManagementModal: Rufe delete_user_completely_secure auf...');
        const { error: deleteError, data } = await supabase.rpc('delete_user_completely_secure', {
          user_id: id
        });

        if (deleteError) {
          console.error('❌ UserManagementModal: RPC-Fehler:', deleteError);
          
          // Falls Funktion nicht existiert, nur Membership deaktivieren
          if (deleteError.code === '42883' || deleteError.message?.includes('function') || deleteError.message?.includes('does not exist')) {
            console.log('⚠️ delete_user_completely_secure Funktion existiert nicht, entferne nur aus Organisation...');
            await removeMemberFromOrganization(organizationId, id);
            deleteSuccess = true;
          } else {
            throw deleteError;
          }
        } else {
          console.log('✅ UserManagementModal: User komplett gelöscht (Membership + Profil)');
          deleteSuccess = true;
        }
      } catch (rpcError: any) {
        console.error('❌ UserManagementModal: RPC-Funktion fehlgeschlagen:', rpcError);
        // Fallback: Nur aus Organisation entfernen
        console.log('⚠️ RPC-Funktion fehlgeschlagen, entferne nur aus Organisation...', rpcError.message);
        try {
          await removeMemberFromOrganization(organizationId, id);
          deleteSuccess = true;
        } catch (removeError: any) {
          console.error('❌ UserManagementModal: Auch removeMemberFromOrganization fehlgeschlagen:', removeError);
          throw removeError;
        }
      }
      
      if (deleteSuccess) {
        // Aktualisiere lokale Liste
        onUpdateUsers(users.filter(u => u.id !== id));
        setIsConfirmingDelete(null);
        onShowNotification(`${userName} wurde entfernt. Hinweis: Der Benutzer bleibt in Supabase Auth sichtbar, kann sich aber nicht mehr einloggen.`, 'success');
      }
    } catch (error: any) {
      console.error('❌ UserManagementModal: Fehler beim Löschen des Benutzers:', error);
      onShowNotification(error.message || 'Fehler beim Löschen des Benutzers.', 'error');
    }
  };

  const handleToggleRole = async (id: string) => {
    if (!organizationId) {
      onShowNotification("Keine Organisation zugeordnet.", "error");
      return;
    }

    const user = users.find(u => u.id === id);
    if (!user) return;

    const newRole = user.role === UserRole.ADMIN ? UserRole.STAFF : UserRole.ADMIN;

    try {
      // Aktualisiere Rolle in Supabase
      await updateMemberRole(organizationId, id, newRole);
      
      // Aktualisiere lokale Liste
      const updatedUsers = users.map(u => {
        if (u.id === id) {
          return { ...u, role: newRole };
        }
        return u;
      });
      onUpdateUsers(updatedUsers);
      onShowNotification(`Rolle von ${user.name} wurde auf ${newRole === UserRole.ADMIN ? 'Admin' : 'Mitarbeiter'} geändert.`, 'success');
    } catch (error: any) {
      console.error('Fehler beim Ändern der Rolle:', error);
      onShowNotification(error.message || 'Fehler beim Ändern der Rolle.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-blue-500/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">System Administration</span>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
              Benutzer <span className="text-blue-500">verwalten</span>
            </h2>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2.5 rounded-2xl text-white hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {/* Add User Section */}
          <section className="mb-10 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter mb-6 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(0,145,255,0.5)]"></span>
              Neuen Benutzer anlegen
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vorname</label>
                  <input 
                    name="firstName" type="text" required placeholder="Max" 
                    className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white"
                    value={formData.firstName} onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nachname</label>
                  <input 
                    name="lastName" type="text" required placeholder="Mustermann" 
                    className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white"
                    value={formData.lastName} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-Mail Adresse</label>
                <input 
                  name="email" type="email" required placeholder="max@flx-software.de" 
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white"
                  value={formData.email} onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Benutzername</label>
                  <input 
                    name="username" type="text" required placeholder="max.mustermann" 
                    className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white"
                    value={formData.username} onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial-Passwort</label>
                  <input 
                    name="password" type="password" required placeholder="••••••••" 
                    className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white"
                    value={formData.password} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rolle</label>
                  <select 
                    name="role"
                    className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value={UserRole.STAFF}>Mitarbeiter</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <label className="flex items-center gap-3 cursor-pointer group mb-2">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={sendImmediately} 
                        onChange={() => setSendImmediately(!sendImmediately)} 
                      />
                      <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter group-hover:text-blue-500 transition-colors">Zugangsdaten per E-Mail senden</span>
                  </label>
                  <button 
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest italic shadow-xl shadow-blue-600/20 transition-all border-2 border-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Erstelle...
                      </>
                    ) : (
                      'Benutzer anlegen'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* User List */}
          <section>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter mb-6 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
              Aktuelle Benutzer ({users.length})
            </h3>
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[1.5rem] flex flex-col sm:flex-row items-center justify-between gap-4 group transition-all hover:border-blue-500/30">
                  <div className="flex items-center gap-5 w-full">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-2xl italic group-hover:bg-blue-50 group-hover:dark:bg-blue-900/10 group-hover:text-blue-500 transition-colors">
                      {user.firstName.charAt(0)}
                    </div>
                    <div className="flex-grow">
                      <p className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-lg leading-tight">{user.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${user.role === UserRole.ADMIN ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                          {user.role === UserRole.ADMIN ? 'Admin' : 'Mitarbeiter'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold truncate max-w-[150px]">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50 dark:border-slate-900">
                    <button 
                      onClick={() => simulateEmailSend(user)}
                      disabled={isSending !== null}
                      className={`p-3 rounded-xl transition-all ${isSending === user.id ? 'bg-blue-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-900'}`}
                      title="Zugangsdaten senden"
                    >
                      {isSending === user.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleToggleRole(user.id)}
                      className="p-3 text-slate-400 hover:text-amber-500 transition-all bg-slate-50 dark:bg-slate-900 rounded-xl"
                      title="Rolle wechseln"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </button>
                    
                    {isConfirmingDelete === user.id ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                        <button onClick={() => handleDeleteUser(user.id)} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase italic shadow-lg shadow-rose-600/20">Löschen</button>
                        <button onClick={() => setIsConfirmingDelete(null)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic">Abbruch</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsConfirmingDelete(user.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 transition-all bg-slate-50 dark:bg-slate-900 rounded-xl"
                        title="Benutzer löschen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-[#010409] border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-slate-900 dark:bg-slate-800 hover:bg-black text-white font-black rounded-2xl uppercase text-xs tracking-widest italic transition-all border border-white/5"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
