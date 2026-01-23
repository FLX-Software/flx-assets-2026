
import React, { useState, useRef } from 'react';
import { Asset, AssetType, LoanRecord } from '../types';

interface AssetDetailModalProps {
  asset: Asset;
  history: LoanRecord[];
  onClose: () => void;
  onSave: (updatedAsset: Asset) => void;
  onDelete: (id: string) => void;
  onReturn?: (asset: Asset) => void;
  isAdmin: boolean;
}

const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, history, onClose, onSave, onDelete, onReturn, isAdmin }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'qr'>('info');
  const [editMode, setEditMode] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [formData, setFormData] = useState<Asset>({ ...asset });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'purchaseYear' || name === 'condition' ? parseInt(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setEditMode(false);
  };

  const assetHistory = history.filter(h => h.assetId === asset.id).sort((a, b) => 
    new Date(b.timestampOut).getTime() - new Date(a.timestampOut).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">Asset Intelligence</span>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
              {editMode ? 'Stammdaten bearbeiten' : (
                <>{asset.brand} <span className="text-blue-500">{asset.model}</span></>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 mx-6 mt-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => { setActiveTab('info'); setIsConfirmingDelete(false); }}
            className={`flex-1 py-2 text-xs font-black uppercase italic tracking-tighter rounded-xl transition-all ${activeTab === 'info' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Info
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setEditMode(false); setIsConfirmingDelete(false); }}
            className={`flex-1 py-2 text-xs font-black uppercase italic tracking-tighter rounded-xl transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Historie
          </button>
          <button 
            onClick={() => { setActiveTab('qr'); setEditMode(false); setIsConfirmingDelete(false); }}
            className={`flex-1 py-2 text-xs font-black uppercase italic tracking-tighter rounded-xl transition-all ${activeTab === 'qr' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            QR-Code
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-6 flex-grow">
          {isConfirmingDelete ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Asset endgültig löschen?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm">Dies kann nicht rückgängig gemacht werden. Das Asset "{asset.brand} {asset.model}" wird dauerhaft aus dem System entfernt.</p>
              <div className="flex gap-4 w-full max-w-xs">
                <button 
                  onClick={() => setIsConfirmingDelete(false)} 
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-xl uppercase text-xs tracking-widest italic transition-all"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={() => onDelete(asset.id)} 
                  className="flex-1 py-3 bg-rose-600 text-white font-black rounded-xl uppercase text-xs tracking-widest italic shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-700"
                >
                  Ja, löschen
                </button>
              </div>
            </div>
          ) : activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden aspect-video shadow-inner bg-slate-100 dark:bg-slate-900 group border border-slate-200 dark:border-slate-800">
                  <img src={formData.imageUrl} alt={formData.model} className="w-full h-full object-cover" />
                  {editMode && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-100 transition-opacity"
                    >
                      <svg className="w-10 h-10 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Bild ändern</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>

                {/* Status-Based Action Button for Admin */}
                {isAdmin && asset.status === 'loaned' && !editMode && (
                  <button 
                    onClick={() => onReturn?.(asset)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest italic shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Asset jetzt zurückgeben (Admin)
                  </button>
                )}

                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> Wartungsstatus
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Zuletzt</span>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">{asset.lastMaintenance || 'k.A.'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Nächste</span>
                      <p className={`text-xs font-black ${new Date(asset.nextMaintenance || '') < new Date() ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-500'}`}>
                        {asset.nextMaintenance || 'k.A.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter">Informationen</h3>
                  {isAdmin && !editMode && (
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="text-[10px] font-black text-rose-500 uppercase italic tracking-widest hover:underline"
                      >
                        Löschen
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditMode(true)}
                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-widest hover:underline"
                      >
                        Ändern
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {editMode ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Marke</label>
                        <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-blue-500 outline-none dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Modell</label>
                        <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-blue-500 outline-none dark:text-white" />
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Kategorie</label>
                      {editMode ? (
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white">
                          {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : <p className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">{asset.type}</p>}
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Zustand</label>
                      {editMode ? (
                        <input type="number" min="1" max="5" name="condition" value={formData.condition} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                      ) : (
                        <div className="flex gap-1 items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 h-[38px]">
                          {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= asset.condition ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Kaufjahr</label>
                      {editMode ? (
                        <input type="number" name="purchaseYear" value={formData.purchaseYear} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                      ) : <p className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">{asset.purchaseYear}</p>}
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Garantie</label>
                      {editMode ? (
                        <input type="date" name="warrantyUntil" value={formData.warrantyUntil} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                      ) : <p className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">{asset.warrantyUntil}</p>}
                    </div>
                  </div>

                  {editMode && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[9px] font-black text-blue-400 uppercase mb-1">Letzte Wartung</label>
                        <input type="date" name="lastMaintenance" value={formData.lastMaintenance || ''} onChange={handleChange} className="w-full p-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-xs font-bold outline-none dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-blue-400 uppercase mb-1">Nächste Wartung</label>
                        <input type="date" name="nextMaintenance" value={formData.nextMaintenance || ''} onChange={handleChange} className="w-full p-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-xs font-bold outline-none dark:text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {editMode && (
                  <div className="flex gap-2 pt-4">
                    <button type="button" onClick={() => { setEditMode(false); setFormData({...asset}); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-xl uppercase text-[10px] tracking-tighter italic">Abbrechen</button>
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl uppercase text-[10px] tracking-tighter italic shadow-lg shadow-blue-600/20">Sichern</button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'history' && !isConfirmingDelete && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter mb-4">Verlauf der Ausleihen</h3>
              {assetHistory.length > 0 ? (
                <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-8">
                  {assetHistory.map((record, idx) => (
                    <div key={record.id} className="relative">
                      <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#0d1117] flex items-center justify-center ${record.timestampIn ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-blue-500 text-white shadow-[0_0_10px_rgba(0,145,255,0.4)]'}`}>
                         {record.timestampIn ? null : <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>}
                      </div>
                      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start">
                          <p className="font-black text-slate-900 dark:text-white uppercase italic text-sm">{record.userName}</p>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${record.timestampIn ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {record.timestampIn ? 'Abgeschlossen' : 'Aktiv'}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-[10px] font-bold">
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 uppercase">Ausgabe</p>
                            <p className="text-slate-600 dark:text-slate-300">{new Date(record.timestampOut).toLocaleString('de-DE')}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 uppercase">Rückgabe</p>
                            <p className="text-slate-600 dark:text-slate-300">{record.timestampIn ? new Date(record.timestampIn).toLocaleString('de-DE') : '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 italic">Noch keine Einträge vorhanden.</div>
              )}
            </div>
          )}

          {activeTab === 'qr' && !isConfirmingDelete && (
            <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-300">
               <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl mb-6 group relative">
                  <div className="w-48 h-48 bg-slate-900 flex items-center justify-center rounded-xl">
                     <svg className="w-40 h-40 text-white" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 3h2v2h-2v-2zm3-3h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2z" />
                     </svg>
                  </div>
               </div>
               <div className="text-center">
                 <p className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-xl">{asset.qrCode}</p>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Eindeutiger Asset Identifier</p>
               </div>
               <button className="mt-10 px-8 py-3 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-xl uppercase text-xs tracking-tighter italic flex items-center gap-2 hover:bg-black dark:hover:bg-blue-700 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  Label Drucken
               </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-[#010409] border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${asset.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {asset.status === 'available' ? 'Lagerbestand' : 'Außer Haus'}
            </span>
          </div>
          {!editMode && !isConfirmingDelete && (
            <button 
              onClick={onClose}
              className="px-8 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black rounded-xl uppercase text-xs tracking-tighter italic transition-all"
            >
              Schließen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetailModal;
