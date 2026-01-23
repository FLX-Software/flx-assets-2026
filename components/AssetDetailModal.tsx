
import React, { useState, useRef, lazy, Suspense } from 'react';
import { Asset, AssetType, LoanRecord, RepairEntry, UserRole } from '../types';
import MaintenanceTimeline from './MaintenanceTimeline';
import { createMaintenanceEvent, updateMaintenanceEvent, deleteMaintenanceEvent } from '../services/supabaseAssetService';
import { uploadAssetImage, deleteAssetImage } from '../services/supabaseStorageService';

// Lazy Loading für QRCodeDisplay um Initial-Loading zu vermeiden
const QRCodeDisplay = lazy(() => import('./QRCodeDisplay'));

interface AssetDetailModalProps {
  asset: Asset;
  history: LoanRecord[];
  onClose: () => void;
  onSave: (updatedAsset: Asset) => void;
  onDelete: (id: string) => void;
  onReturn?: (asset: Asset) => void;
  isAdmin: boolean;
  organizationId: string;
}

const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, history, onClose, onSave, onDelete, onReturn, isAdmin, organizationId }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'maintenance' | 'qr'>('info');
  const [editMode, setEditMode] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [formData, setFormData] = useState<Asset>({ ...asset });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'purchaseYear' || name === 'condition' || name === 'maintenanceIntervalMonths' ? parseInt(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Zeige Vorschau
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

  const handleImageUpload = async () => {
    if (!selectedFile || !isAdmin) return;

    try {
      setIsUploadingImage(true);
      
      // Lösche altes Bild (falls es von Supabase Storage ist)
      const oldImageUrl = asset.imageUrl;
      if (oldImageUrl && oldImageUrl.includes('supabase.co/storage')) {
        await deleteAssetImage(oldImageUrl);
      }

      // Lade neues Bild hoch
      const uploadResult = await uploadAssetImage(selectedFile, formData.id, organizationId);
      
      if (uploadResult.error) {
        alert(`Fehler beim Upload: ${uploadResult.error}`);
        setIsUploadingImage(false);
        return;
      }

      // Aktualisiere Asset mit neuer Bild-URL
      const updatedAsset = { ...formData, imageUrl: uploadResult.url };
      setFormData(updatedAsset);
      setSelectedFile(null);
      
      // Speichere Asset
      await onSave(updatedAsset);
      
    } catch (error: any) {
      console.error('Fehler beim Bild-Upload:', error);
      alert(`Fehler beim Upload: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdateRepairHistory = async (updatedHistory: RepairEntry[]) => {
    // Maintenance-Events werden jetzt direkt in Supabase gespeichert
    // Die repairHistory im Asset ist nur für die Anzeige
    const updatedAsset = { ...formData, repairHistory: updatedHistory };
    setFormData(updatedAsset);
    // Asset wird gespeichert (ohne repairHistory, da das in maintenance_events ist)
    onSave(updatedAsset);
  };

  const handleUpdateMaintenanceData = (data: Partial<Asset>) => {
    const updatedAsset = { ...formData, ...data };
    onSave(updatedAsset);
    setFormData(updatedAsset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Wenn ein neues Bild ausgewählt wurde, lade es zuerst hoch
    if (selectedFile && isAdmin) {
      await handleImageUpload();
    } else {
      onSave(formData);
    }
    
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
                <>{formData.brand} <span className="text-blue-500">{formData.model}</span></>
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
            className={`flex-1 py-2 text-[10px] font-black uppercase italic tracking-tighter rounded-xl transition-all ${activeTab === 'info' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Info
          </button>
          <button 
            onClick={() => { setActiveTab('maintenance'); setEditMode(false); setIsConfirmingDelete(false); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase italic tracking-tighter rounded-xl transition-all ${activeTab === 'maintenance' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Service
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setEditMode(false); setIsConfirmingDelete(false); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase italic tracking-tighter rounded-xl transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Leihe
          </button>
          <button 
            onClick={() => { setActiveTab('qr'); setEditMode(false); setIsConfirmingDelete(false); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase italic tracking-tighter rounded-xl transition-all ${activeTab === 'qr' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Label
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-6 flex-grow custom-scrollbar">
          {isConfirmingDelete ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Asset endgültig löschen?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm">Dies kann nicht rückgängig gemacht werden.</p>
              <div className="flex gap-4 w-full max-w-xs">
                <button onClick={() => setIsConfirmingDelete(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-xl uppercase text-xs tracking-widest italic transition-all">Abbrechen</button>
                <button onClick={() => onDelete(formData.id)} className="flex-1 py-3 bg-rose-600 text-white font-black rounded-xl uppercase text-xs tracking-widest italic shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-700">Ja, löschen</button>
              </div>
            </div>
          ) : activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden aspect-video shadow-inner bg-slate-100 dark:bg-slate-900 group border border-slate-200 dark:border-slate-800">
                  <img src={formData.imageUrl} alt={formData.model} className="w-full h-full object-cover" />
                  {editMode && (
                    <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-100 transition-opacity">
                      <svg className="w-10 h-10 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Bild ändern</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
                {isAdmin && formData.status === 'loaned' && !editMode && (
                  <button onClick={() => onReturn?.(formData)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest italic shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">Zurückgeben</button>
                )}
                {formData.type === AssetType.VEHICLE && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kennzeichen</p>
                      <p className="text-lg font-black text-white italic tracking-tighter">{formData.licensePlate || 'K.A.'}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter">Details</h3>
                  {isAdmin && !editMode && (
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setIsConfirmingDelete(true)} className="text-[10px] font-black text-rose-500 uppercase italic tracking-widest hover:underline">Löschen</button>
                      <button type="button" onClick={() => setEditMode(true)} className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-widest hover:underline">Ändern</button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Marke</label>
                      {editMode ? <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" /> : <p className="text-xs font-black text-slate-700 dark:text-slate-300">{formData.brand}</p>}
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Modell</label>
                      {editMode ? <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" /> : <p className="text-xs font-black text-slate-700 dark:text-slate-300">{formData.model}</p>}
                    </div>
                  </div>
                  {editMode && formData.type === AssetType.VEHICLE && (
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Kennzeichen</label>
                      <input type="text" name="licensePlate" value={formData.licensePlate || ''} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 rounded-xl text-xs font-bold outline-none dark:text-white" />
                    </div>
                  )}
                  {editMode && (
                    <div className="flex gap-2 pt-4">
                      <button type="button" onClick={() => { setEditMode(false); setFormData({...asset}); setSelectedFile(null); }} disabled={isUploadingImage} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-xl uppercase text-[10px] tracking-tighter italic disabled:opacity-50">Abbrechen</button>
                      <button type="submit" disabled={isUploadingImage} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl uppercase text-[10px] tracking-tighter italic shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isUploadingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Upload...
                          </>
                        ) : (
                          'Sichern'
                        )}
                      </button>
                    </div>
                  )}
                  {editMode && selectedFile && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                        📷 Neues Bild ausgewählt: {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                        Das Bild wird beim Speichern hochgeladen
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'maintenance' && (
             <div className="animate-in slide-in-from-right-4 duration-300">
                <MaintenanceTimeline 
                  asset={formData} 
                  isAdmin={isAdmin}
                  onUpdateHistory={handleUpdateRepairHistory}
                  onUpdateMaintenanceData={handleUpdateMaintenanceData}
                  organizationId={organizationId}
                />
             </div>
          )}

          {activeTab === 'history' && !isConfirmingDelete && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tighter mb-4">Verlauf der Ausleihen</h3>
              {assetHistory.length > 0 ? (
                <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-8">
                  {assetHistory.map((record) => (
                    <div key={record.id} className="relative">
                      <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-[#0d1117] flex items-center justify-center ${record.timestampIn ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-blue-500 text-white shadow-[0_0_10px_rgba(0,145,255,0.4)]'}`}>
                         {record.timestampIn ? null : <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>}
                      </div>
                      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start">
                          <p className="font-black text-slate-900 dark:text-white uppercase italic text-sm">{record.userName}</p>
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
              ) : <p className="text-center py-10 text-slate-400 italic">Keine Einträge.</p>}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="animate-in zoom-in-95 duration-300">
              <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
                <QRCodeDisplay
                  value={formData.qrCode || ''}
                  assetName={`${formData.brand} ${formData.model}`}
                  brand={formData.brand}
                  model={formData.model}
                />
              </Suspense>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-[#010409] border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${formData.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{formData.status === 'available' ? 'Lager' : 'Einsatz'}</span>
          </div>
          <button onClick={onClose} className="px-8 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black text-white font-black rounded-xl uppercase text-xs tracking-tighter italic transition-all">Schließen</button>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailModal;
