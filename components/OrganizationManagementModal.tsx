import React, { useState, useEffect } from 'react';
import { Organization } from '../types';
import { fetchAllOrganizations, createOrganization, updateOrganization, deactivateOrganization } from '../services/supabaseOrganizationService';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser } from '../services/supabaseAuthService';

interface OrganizationManagementModalProps {
  onClose: () => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  onOrganizationCreated?: (org: Organization) => void;
}

const OrganizationManagementModal: React.FC<OrganizationManagementModalProps> = ({ 
  onClose, 
  onShowNotification,
  onOrganizationCreated 
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [orgStats, setOrgStats] = useState<Record<string, { assets: number; users: number }>>({});

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const orgs = await fetchAllOrganizations();
      setOrganizations(orgs);
      
      // Lade Statistiken für jede Organisation
      const stats: Record<string, { assets: number; users: number }> = {};
      for (const org of orgs) {
        try {
          const [assetsResult, membersResult] = await Promise.all([
            supabase.from('assets').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
            supabase.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true)
          ]);
          stats[org.id] = {
            assets: assetsResult.count || 0,
            users: membersResult.count || 0
          };
        } catch (error) {
          stats[org.id] = { assets: 0, users: 0 };
        }
      }
      setOrgStats(stats);
    } catch (error: any) {
      console.error('Fehler beim Laden der Organisationen:', error);
      onShowNotification('Fehler beim Laden der Organisationen', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onShowNotification('Bitte geben Sie einen Namen ein', 'error');
      return;
    }

    try {
      setIsCreating(true);
      const currentUser = await getCurrentUser();
      const newOrg = await createOrganization(
        formData.name.trim(), 
        formData.slug.trim() || undefined,
        currentUser?.id
      );
      
      setOrganizations([...organizations, newOrg]);
      setFormData({ name: '', slug: '' });
      onShowNotification(`Organisation "${newOrg.name}" wurde erstellt`, 'success');
      
      if (onOrganizationCreated) {
        onOrganizationCreated(newOrg);
      }
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Organisation:', error);
      onShowNotification(error.message || 'Fehler beim Erstellen der Organisation', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateOrganization = async (org: Organization) => {
    try {
      const updated = await updateOrganization(org.id, { name: formData.name, slug: formData.slug });
      setOrganizations(organizations.map(o => o.id === org.id ? updated : o));
      setEditingOrg(null);
      setFormData({ name: '', slug: '' });
      onShowNotification(`Organisation "${updated.name}" wurde aktualisiert`, 'success');
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Organisation:', error);
      onShowNotification(error.message || 'Fehler beim Aktualisieren', 'error');
    }
  };

  const handleDeactivateOrganization = async (orgId: string) => {
    if (!confirm('Möchten Sie diese Organisation wirklich deaktivieren?')) return;
    
    try {
      await deactivateOrganization(orgId);
      setOrganizations(organizations.map(o => o.id === orgId ? { ...o, is_active: false } : o));
      onShowNotification('Organisation wurde deaktiviert', 'success');
    } catch (error: any) {
      console.error('Fehler beim Deaktivieren:', error);
      onShowNotification(error.message || 'Fehler beim Deaktivieren', 'error');
    }
  };

  const startEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({ name: org.name, slug: org.slug || '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-blue-500/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">Super-Admin</span>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
              Organisationen <span className="text-blue-500">verwalten</span>
            </h2>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2.5 rounded-2xl text-white hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {/* Create Organization Section */}
          <section className="mb-10 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter mb-6 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(0,145,255,0.5)]"></span>
              {editingOrg ? 'Organisation bearbeiten' : 'Neue Organisation anlegen'}
            </h3>
            <form onSubmit={editingOrg ? (e) => { e.preventDefault(); handleUpdateOrganization(editingOrg); } : handleCreateOrganization} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Kunde A GmbH" 
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white"
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Slug (optional, wird automatisch generiert)</label>
                <input 
                  type="text" 
                  placeholder="kunde-a-gmbh" 
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white"
                  value={formData.slug} 
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest italic shadow-xl shadow-blue-600/20 transition-all border-2 border-white/10 disabled:opacity-50"
                >
                  {isCreating ? 'Erstelle...' : editingOrg ? 'Aktualisieren' : 'Organisation anlegen'}
                </button>
                {editingOrg && (
                  <button 
                    type="button"
                    onClick={() => { setEditingOrg(null); setFormData({ name: '', slug: '' }); }}
                    className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-2xl uppercase text-[11px] tracking-widest italic"
                  >
                    Abbrechen
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Organizations List */}
          <section>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter mb-6 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
              Alle Organisationen ({organizations.length})
            </h3>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-sm font-bold">Lade Organisationen...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {organizations.map(org => (
                  <div key={org.id} className="p-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-lg">{org.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold">Slug: {org.slug || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 ml-13">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {orgStats[org.id]?.assets || 0} Assets
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {orgStats[org.id]?.users || 0} Benutzer
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                          org.is_active 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {org.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEdit(org)}
                        className="p-3 text-slate-400 hover:text-blue-500 transition-all bg-slate-50 dark:bg-slate-900 rounded-xl"
                        title="Bearbeiten"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {org.is_active && (
                        <button 
                          onClick={() => handleDeactivateOrganization(org.id)}
                          className="p-3 text-slate-300 hover:text-rose-500 transition-all bg-slate-50 dark:bg-slate-900 rounded-xl"
                          title="Deaktivieren"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default OrganizationManagementModal;
