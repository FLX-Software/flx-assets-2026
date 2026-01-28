
import React, { useState } from 'react';
import { Asset, AssetType, RepairEntry } from '../types';
import { createMaintenanceEvent, updateMaintenanceEvent, deleteMaintenanceEvent } from '../services/supabaseAssetService';

interface MaintenanceTimelineProps {
  asset: Asset;
  isAdmin: boolean;
  onUpdateHistory: (updatedHistory: RepairEntry[]) => void;
  onUpdateMaintenanceData?: (data: Partial<Asset>) => void;
  organizationId: string;
}

const MaintenanceTimeline: React.FC<MaintenanceTimelineProps> = ({ asset, isAdmin, onUpdateHistory, onUpdateMaintenanceData, organizationId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RepairEntry>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    performer: '',
    cost: 0
  });

  const history = [...asset.repairHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleToggleAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      performer: '',
      cost: 0
    });
    setEditingId(null);
    setIsAdding(!isAdding);
  };

  const handleEdit = (entry: RepairEntry) => {
    setFormData(entry);
    setEditingId(entry.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMaintenanceEvent(id);
      const updated = asset.repairHistory.filter(e => e.id !== id);
      onUpdateHistory(updated);
    } catch (error: any) {
      console.error('Fehler beim Löschen des Maintenance-Events:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.description || !formData.performer) return;

    try {
      let newEntry: RepairEntry;
      if (editingId) {
        // Update existing event
        await updateMaintenanceEvent(editingId, formData as Partial<RepairEntry>);
        newEntry = { ...formData as RepairEntry, id: editingId };
        const updatedHistory = asset.repairHistory.map(e => 
          e.id === editingId ? newEntry : e
        );
        onUpdateHistory(updatedHistory);
      } else {
        // Create new event
        const created = await createMaintenanceEvent(
          asset.id,
          organizationId,
          formData as Omit<RepairEntry, 'id'>
        );
        newEntry = created;
        const updatedHistory = [...asset.repairHistory, newEntry];
        onUpdateHistory(updatedHistory);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (error: any) {
      console.error('Fehler beim Speichern des Maintenance-Events:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Config Section for Admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-300 shadow-sm min-w-0">
          <div className="space-y-1">
            <label className="block text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1 italic">Wartungs-Intervall</label>
            <select 
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none dark:text-white focus:border-blue-500 transition-colors"
              value={asset.maintenanceIntervalMonths}
              onChange={(e) => onUpdateMaintenanceData?.({ maintenanceIntervalMonths: parseInt(e.target.value) })}
            >
              {[1, 3, 6, 12, 18, 24, 36, 48].map(m => (
                <option key={m} value={m}>{m} Monate</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-0">
            <label className="block text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1 italic">Letzte UVV Prüfung</label>
            <input 
              type="date"
              className="w-full max-w-full min-w-0 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none dark:text-white focus:border-blue-500 transition-colors"
              value={asset.lastUvv || ''}
              onChange={(e) => onUpdateMaintenanceData?.({ lastUvv: e.target.value })}
            />
          </div>
          {asset.type === AssetType.VEHICLE && (
            <div className="space-y-1 min-w-0">
              <label className="block text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1 italic">Nächster TÜV / AU</label>
              <input 
                type="date"
                className="w-full max-w-full min-w-0 p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs font-black outline-none dark:text-white focus:border-amber-500 transition-colors"
                value={asset.nextTuev || ''}
                onChange={(e) => onUpdateMaintenanceData?.({ nextTuev: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1 min-w-0">
            <label className="block text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1 italic">Nächste Allg. Wartung</label>
            <input 
              type="date"
              className="w-full max-w-full min-w-0 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none dark:text-white focus:border-blue-500 transition-colors"
              value={asset.nextMaintenance || ''}
              onChange={(e) => onUpdateMaintenanceData?.({ nextMaintenance: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter">Reparatur Historie</h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{history.length} Einträge</span>
          {isAdmin && !isAdding && (
            <button 
              onClick={handleToggleAdd}
              className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase italic rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all"
            >
              Neu Erfassen
            </button>
          )}
        </div>
      </div>

      {isAdding && isAdmin && (
        <form onSubmit={handleSubmit} className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              {editingId ? 'Eintrag bearbeiten' : 'Neuer Service-Eintrag'}
            </h4>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-rose-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <div className="min-w-0">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Datum</label>
              <input 
                type="date" 
                required
                className="w-full max-w-full min-w-0 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Kosten (€)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Ausführender Betrieb</label>
            <input 
              type="text" 
              required
              placeholder="Z.B. Hilti Service Center"
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white"
              value={formData.performer}
              onChange={e => setFormData({...formData, performer: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Beschreibung der Arbeit</label>
            <textarea 
              required
              rows={2}
              placeholder="Z.B. Motorbürsten getauscht, Gehäuse gereinigt..."
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-black rounded-xl uppercase text-[10px] tracking-widest italic shadow-lg shadow-blue-600/20"
          >
            {editingId ? 'Änderungen speichern' : 'Eintrag hinzufügen'}
          </button>
        </form>
      )}

      {history.length > 0 ? (
        <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-8 pb-4">
          {history.map((entry) => (
            <div key={entry.id} className="relative group">
              <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#0d1117] bg-blue-500 flex items-center justify-center">
                 <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-blue-500/30">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-black text-slate-900 dark:text-white uppercase italic text-xs">{entry.performer}</p>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {new Date(entry.date).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(entry)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {entry.description}
                </p>
                {entry.cost !== undefined && (
                  <p className="mt-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Kosten: <span className="text-slate-900 dark:text-slate-200">{entry.cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-400 text-[11px] font-bold uppercase italic tracking-widest">Keine Reparaturen dokumentiert</p>
        </div>
      )}

      {/* Maintenance Summary View (Non-Edit visual for Staff) */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Letzte UVV Prüfung</p>
            <p className="text-xs font-black text-slate-800 dark:text-white">{asset.lastUvv || 'Nicht geprüft'}</p>
          </div>
          {asset.type === AssetType.VEHICLE && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
              <p className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Nächster TÜV / AU</p>
              <p className="text-xs font-black text-slate-800 dark:text-white">{asset.nextTuev || 'K.A.'}</p>
            </div>
          )}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
            <p className="text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-1">Wartungs-Intervall</p>
            <p className="text-xs font-black text-slate-800 dark:text-white">{asset.maintenanceIntervalMonths} Monate</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceTimeline;
