
import React, { useState, useRef, lazy, Suspense } from 'react';
import { Asset, AssetType, AssetTypeLabels, LoanRecord, RepairEntry, UserRole } from '../types';
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
  const [infoSubTab, setInfoSubTab] = useState<'basic' | 'general' | 'vehicle' | 'machine' | 'tool' | 'financial'>('basic');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => {
      if (type === 'checkbox') {
        return { ...prev, [name]: checked };
      }
      if (name === 'purchaseYear' || name === 'condition' || name === 'maintenanceIntervalMonths' || 
          name === 'mileage' || name === 'purchasePrice' || name === 'residualValue' || 
          name === 'depreciationYears' || name === 'vehicleTaxMonthly') {
        return { ...prev, [name]: value ? parseFloat(value) : undefined };
      }
      if (name === 'tags') {
        return { ...prev, [name]: value ? value.split(',').map(t => t.trim()).filter(Boolean) : undefined };
      }
      return { ...prev, [name]: value || undefined };
    });
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
      console.log('📤 Starte Bild-Upload...', { fileName: selectedFile.name, size: selectedFile.size, assetId: formData.id });
      
      // Lösche altes Bild (falls es von Supabase Storage ist)
      const oldImageUrl = asset.imageUrl;
      if (oldImageUrl && oldImageUrl.includes('supabase.co/storage')) {
        try {
          await deleteAssetImage(oldImageUrl);
          console.log('✅ Altes Bild gelöscht');
        } catch (deleteError) {
          console.warn('⚠️ Fehler beim Löschen des alten Bildes (fortsetzen):', deleteError);
          // Weiter mit Upload auch wenn Löschen fehlschlägt
        }
      }

      // Lade neues Bild hoch mit Timeout
      const uploadPromise = uploadAssetImage(selectedFile, formData.id, organizationId);
      const timeoutPromise = new Promise<{ url: null; error: string }>((resolve) => {
        setTimeout(() => resolve({ url: null, error: 'Upload-Timeout: Das Bild konnte nicht innerhalb von 30 Sekunden hochgeladen werden' }), 30000);
      });
      
      const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
      
      if (uploadResult.error) {
        console.error('❌ Upload-Fehler:', uploadResult.error);
        alert(`Fehler beim Upload: ${uploadResult.error}`);
        setIsUploadingImage(false);
        return;
      }

      console.log('✅ Upload erfolgreich:', uploadResult.url);

      // Aktualisiere Asset mit neuer Bild-URL
      const updatedAsset = { ...formData, imageUrl: uploadResult.url };
      setFormData(updatedAsset);
      setSelectedFile(null);
      
      // Speichere Asset
      console.log('💾 Speichere Asset mit neuem Bild...');
      await onSave(updatedAsset);
      console.log('✅ Asset gespeichert');
      
    } catch (error: any) {
      console.error('❌ Fehler beim Bild-Upload:', error);
      alert(`Fehler beim Upload: ${error.message || 'Unbekannter Fehler'}`);
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
    
    try {
      // Wenn ein neues Bild ausgewählt wurde, lade es zuerst hoch
      if (selectedFile && isAdmin) {
        await handleImageUpload();
      } else {
        console.log('💾 Speichere Asset-Änderungen...', { assetId: formData.id });
        await onSave(formData);
        console.log('✅ Asset-Änderungen gespeichert');
      }
      
      setEditMode(false);
    } catch (error: any) {
      console.error('❌ Fehler beim Speichern:', error);
      alert(`Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`);
    }
  };

  const assetHistory = history.filter(h => h.assetId === asset.id).sort((a, b) => 
    new Date(b.timestampOut).getTime() - new Date(a.timestampOut).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
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
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => { setActiveTab('info'); setIsConfirmingDelete(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-black uppercase italic tracking-tighter transition-all whitespace-nowrap ${
                activeTab === 'info'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">📋</span>
              Info
            </button>
            <button 
              onClick={() => { setActiveTab('maintenance'); setEditMode(false); setIsConfirmingDelete(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-black uppercase italic tracking-tighter transition-all whitespace-nowrap ${
                activeTab === 'maintenance'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">🔧</span>
              Service
            </button>
            <button 
              onClick={() => { setActiveTab('history'); setEditMode(false); setIsConfirmingDelete(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-black uppercase italic tracking-tighter transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">📦</span>
              Leihe
            </button>
            <button 
              onClick={() => { setActiveTab('qr'); setEditMode(false); setIsConfirmingDelete(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-black uppercase italic tracking-tighter transition-all whitespace-nowrap ${
                activeTab === 'qr'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">🏷️</span>
              Label
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-8 flex-grow custom-scrollbar">
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
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Admin-Actions */}
              {isAdmin && !editMode && (
                <div className="flex justify-end gap-4 mb-4">
                  <button type="button" onClick={() => setIsConfirmingDelete(true)} className="text-sm font-black text-rose-500 uppercase italic tracking-widest hover:underline">Löschen</button>
                  <button type="button" onClick={() => setEditMode(true)} className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-widest hover:underline">Ändern</button>
                </div>
              )}

              {/* Info Sub-Tabs */}
              {!editMode && (
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-4">
                  {[
                    { id: 'basic' as const, label: 'Basis', icon: '📋' },
                    { id: 'general' as const, label: 'Allgemein', icon: '📝' },
                    { id: 'financial' as const, label: 'Finanzen', icon: '💰' },
                    ...(formData.type === AssetType.VEHICLE ? [{ id: 'vehicle' as const, label: 'Fahrzeug', icon: '🚗' }] : []),
                    ...(formData.type === AssetType.MACHINE ? [{ id: 'machine' as const, label: 'Maschine', icon: '⚙️' }] : []),
                    ...(formData.type === AssetType.TOOL ? [{ id: 'tool' as const, label: 'Werkzeug', icon: '🔧' }] : []),
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInfoSubTab(tab.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-black uppercase italic tracking-tighter whitespace-nowrap transition-all ${
                        infoSubTab === tab.id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab: Basis - nur im Edit-Mode oder wenn Basis-Tab aktiv */}
              {(infoSubTab === 'basic' || editMode) && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Tab: Basis - Edit-Mode Ansicht */}
                  {editMode && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asset Foto</label>
                            <div className="relative rounded-2xl overflow-hidden aspect-video shadow-inner bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800">
                              {formData.imageUrl ? (
                                <>
                                  <img src={formData.imageUrl} alt={formData.model} className="w-full h-full object-cover" />
                                  <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                    <svg className="w-10 h-10 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Bild ändern</span>
                                  </div>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm('Bild wirklich entfernen?')) {
                                          setFormData(prev => ({ ...prev, imageUrl: '' }));
                                          setSelectedFile(null);
                                          if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                          }
                                        }
                                      }}
                                      className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg shadow-lg transition-all"
                                      title="Bild entfernen"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex items-center justify-center cursor-pointer">
                                  <div className="text-center">
                                    <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Bild hinzufügen</p>
                                  </div>
                                </div>
                              )}
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                              {selectedFile && (
                                <button
                                  type="button"
                                  onClick={handleImageUpload}
                                  disabled={isUploadingImage}
                                  className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black rounded-lg uppercase text-xs tracking-widest transition-all"
                                >
                                  {isUploadingImage ? 'Upload läuft...' : 'Bild hochladen'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">QR-CODE IDENTIFIER *</label>
                            <input type="text" name="qrCode" value={formData.qrCode} onChange={handleChange} required className="w-full p-3 bg-white dark:bg-slate-900 border border-blue-200 rounded-xl text-xs font-black text-blue-600 uppercase italic outline-none" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marke *</label>
                              <input type="text" name="brand" value={formData.brand} onChange={handleChange} required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modell *</label>
                              <input type="text" name="model" value={formData.model} onChange={handleChange} required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kategorie</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white">
                              {Object.values(AssetType).map(t => <option key={t} value={t}>{AssetTypeLabels[t]}</option>)}
                            </select>
                          </div>

                          {formData.type === AssetType.VEHICLE && (
                            <div className="animate-in slide-in-from-left-2 duration-300">
                              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Kennzeichen</label>
                              <input type="text" name="licensePlate" value={formData.licensePlate || ''} onChange={handleChange} className="w-full p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-xl text-sm font-black italic tracking-tighter outline-none dark:text-white uppercase" placeholder="Z.B. B-FLX 101" />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Wartungsintervall</label>
                              <select name="maintenanceIntervalMonths" value={formData.maintenanceIntervalMonths} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white">
                                <option value={3}>3 Monate</option>
                                <option value={6}>6 Monate</option>
                                <option value={12}>12 Monate</option>
                                <option value={24}>24 Monate</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zustand (1-5)</label>
                              <input type="number" min="1" max="5" name="condition" value={formData.condition} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kaufjahr</label>
                              <input type="number" name="purchaseYear" value={formData.purchaseYear} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Garantie bis</label>
                              <input type="date" name="warrantyUntil" value={formData.warrantyUntil || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Basis - Read-Only Ansicht */}
                  {infoSubTab === 'basic' && !editMode && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asset Foto</label>
                          <div className="relative rounded-2xl overflow-hidden aspect-video shadow-inner bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800">
                            {formData.imageUrl ? (
                              <>
                                <img src={formData.imageUrl} alt={formData.model} className="w-full h-full object-cover" />
                                {editMode && (
                                  <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                    <svg className="w-10 h-10 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Bild ändern</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div onClick={() => editMode && fileInputRef.current?.click()} className={`w-full h-full flex items-center justify-center ${editMode ? 'cursor-pointer' : ''}`}>
                                <div className="text-center">
                                  <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {editMode ? (
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Bild hinzufügen</p>
                                  ) : (
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Kein Bild</p>
                                  )}
                                </div>
                              </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                          </div>
                        </div>
                        {!editMode && (
                          <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">QR-CODE IDENTIFIER</label>
                            <p className="text-xs font-black text-blue-600 uppercase italic">{formData.qrCode}</p>
                          </div>
                        )}
                        {isAdmin && formData.status === 'loaned' && !editMode && (
                          <button onClick={() => onReturn?.(formData)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase text-sm tracking-widest italic shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">Zurückgeben</button>
                        )}
                        {formData.type === AssetType.VEHICLE && formData.licensePlate && (
                          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kennzeichen</p>
                              <p className="text-lg font-black text-white italic tracking-tighter">{formData.licensePlate}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marke</label>
                            {editMode ? (
                              <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            ) : (
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.brand}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modell</label>
                            {editMode ? (
                              <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            ) : (
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.model}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kategorie</label>
                          {editMode ? (
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white">
                              {Object.values(AssetType).map(t => <option key={t} value={t}>{AssetTypeLabels[t]}</option>)}
                            </select>
                          ) : (
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{AssetTypeLabels[formData.type]}</p>
                          )}
                        </div>

                        {formData.type === AssetType.VEHICLE && (
                          <div className="animate-in slide-in-from-left-2 duration-300">
                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Kennzeichen</label>
                            {editMode ? (
                              <input type="text" name="licensePlate" value={formData.licensePlate || ''} onChange={handleChange} className="w-full p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-xl text-sm font-black italic tracking-tighter outline-none dark:text-white uppercase" placeholder="Z.B. B-FLX 101" />
                            ) : (
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">{formData.licensePlate || '—'}</p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Wartungsintervall</label>
                            {editMode ? (
                              <select name="maintenanceIntervalMonths" value={formData.maintenanceIntervalMonths} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white">
                                <option value={3}>3 Monate</option>
                                <option value={6}>6 Monate</option>
                                <option value={12}>12 Monate</option>
                                <option value={24}>24 Monate</option>
                              </select>
                            ) : (
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.maintenanceIntervalMonths} Monate</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zustand (1-5)</label>
                            {editMode ? (
                              <input type="number" min="1" max="5" name="condition" value={formData.condition} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            ) : (
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.condition}/5</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kaufjahr</label>
                            {editMode ? (
                              <input type="number" name="purchaseYear" value={formData.purchaseYear} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            ) : (
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.purchaseYear || '—'}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Garantie bis</label>
                            {editMode ? (
                              <input type="date" name="warrantyUntil" value={formData.warrantyUntil || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                            ) : (
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.warrantyUntil ? new Date(formData.warrantyUntil).toLocaleDateString('de-DE') : '—'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}
                </form>
              )}

              {/* Tab: Allgemein */}
              {!editMode && infoSubTab === 'general' && (
                  <div className="space-y-6">
                    {formData.description && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Beschreibung</label>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{formData.description}</p>
                      </div>
                    )}
                    {formData.notes && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notizen</label>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{formData.notes}</p>
                      </div>
                    )}
                    {formData.tags && formData.tags.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-bold">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.location && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standort</label>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.location}</p>
                        </div>
                      )}
                      {formData.department && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abteilung</label>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.department}</p>
                        </div>
                      )}
                      {formData.costCenter && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kostenstelle</label>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.costCenter}</p>
                        </div>
                      )}
                      {formData.purchaseDate && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Anschaffungsdatum</label>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(formData.purchaseDate).toLocaleDateString('de-DE')}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.supplier && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lieferant</label>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.supplier}</p>
                        </div>
                      )}
                      {formData.invoiceNumber && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rechnungsnummer</label>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.invoiceNumber}</p>
                        </div>
                      )}
                    </div>
                    {(formData.hasInvoice || formData.hasWarrantyCertificate || formData.hasManual) && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dokumente vorhanden</label>
                        <div className="grid grid-cols-3 gap-3">
                          {formData.hasInvoice && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Rechnung</span>}
                          {formData.hasWarrantyCertificate && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Garantieschein</span>}
                          {formData.hasManual && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Bedienungsanleitung</span>}
                        </div>
                      </div>
                    )}
                  </div>
              )}

              {/* Tab: Finanzen */}
              {!editMode && infoSubTab === 'financial' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.purchasePrice !== undefined && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Anschaffungspreis (€)</label>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.purchasePrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                        </div>
                      )}
                      {formData.residualValue !== undefined && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Restwert (€)</label>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.residualValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                        </div>
                      )}
                    </div>
                    {formData.depreciationYears !== undefined && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abschreibungsdauer (Jahre)</label>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.depreciationYears} Jahre</p>
                      </div>
                    )}
                  </div>
              )}

              {/* Tab: Fahrzeug */}
              {!editMode && infoSubTab === 'vehicle' && formData.type === AssetType.VEHICLE && (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-tighter mb-4">Identifikation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.vin && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fahrgestellnummer (VIN)</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono uppercase">{formData.vin}</p>
                          </div>
                        )}
                        {formData.vehicleRegistrationNumber && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fahrzeugbrief-Nr.</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.vehicleRegistrationNumber}</p>
                          </div>
                        )}
                        {formData.firstRegistrationDate && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Erstzulassung</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(formData.firstRegistrationDate).toLocaleDateString('de-DE')}</p>
                          </div>
                        )}
                        {formData.vehicleClass && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fahrzeugklasse</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.vehicleClass}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {(formData.engineDisplacement || formData.power || formData.fuelType || formData.transmission || formData.mileage) && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-4">Technische Daten</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.engineDisplacement && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hubraum</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.engineDisplacement}</p>
                            </div>
                          )}
                          {formData.power && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leistung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.power}</p>
                            </div>
                          )}
                          {formData.fuelType && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kraftstoff</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.fuelType}</p>
                            </div>
                          )}
                          {formData.transmission && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Getriebe</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.transmission}</p>
                            </div>
                          )}
                          {formData.mileage !== undefined && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kilometerstand</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.mileage.toLocaleString('de-DE')} km</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(formData.insuranceCompany || formData.insuranceNumber || formData.insuranceUntil || formData.vehicleTaxMonthly || formData.registrationAuthority) && (
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase italic tracking-tighter mb-4">Versicherung & Zulassung</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.insuranceCompany && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versicherungsgesellschaft</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.insuranceCompany}</p>
                            </div>
                          )}
                          {formData.insuranceNumber && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versicherungsnummer</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.insuranceNumber}</p>
                            </div>
                          )}
                          {formData.insuranceUntil && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versicherung bis</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(formData.insuranceUntil).toLocaleDateString('de-DE')}</p>
                            </div>
                          )}
                          {formData.vehicleTaxMonthly !== undefined && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">KFZ-Steuer (€/Monat)</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.vehicleTaxMonthly.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                            </div>
                          )}
                          {formData.registrationAuthority && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zulassungsbehörde</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.registrationAuthority}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(formData.hasVehicleRegistration || formData.hasVehicleTitle || formData.hasServiceBook) && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dokumente vorhanden</label>
                        <div className="grid grid-cols-3 gap-3">
                          {formData.hasVehicleRegistration && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Fahrzeugschein</span>}
                          {formData.hasVehicleTitle && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Fahrzeugbrief</span>}
                          {formData.hasServiceBook && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Serviceheft</span>}
                        </div>
                      </div>
                    )}
                  </div>
              )}

              {/* Tab: Maschine */}
              {!editMode && infoSubTab === 'machine' && formData.type === AssetType.MACHINE && (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-tighter mb-4">Identifikation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.serialNumber && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seriennummer</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.serialNumber}</p>
                          </div>
                        )}
                        {formData.manufacturerNumber && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hersteller-Nr.</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.manufacturerNumber}</p>
                          </div>
                        )}
                        {formData.typeDesignation && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Typbezeichnung</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.typeDesignation}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {(formData.machinePower || formData.weight || formData.dimensions || formData.voltage || formData.currentConsumption || formData.operatingPressure || formData.rpm) && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-4">Technische Daten</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.machinePower && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leistung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.machinePower}</p>
                            </div>
                          )}
                          {formData.weight && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gewicht</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.weight}</p>
                            </div>
                          )}
                          {formData.dimensions && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abmessungen</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.dimensions}</p>
                            </div>
                          )}
                          {formData.voltage && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spannung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.voltage}</p>
                            </div>
                          )}
                          {formData.currentConsumption && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stromverbrauch</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.currentConsumption}</p>
                            </div>
                          )}
                          {formData.operatingPressure && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Betriebsdruck</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.operatingPressure}</p>
                            </div>
                          )}
                          {formData.rpm && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Drehzahl</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.rpm}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(formData.lastUvvInspection || formData.nextUvvInspection || formData.hasCeMarking || formData.hasGsMarking || formData.hasInspectionReport) && (
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase italic tracking-tighter mb-4">Zertifikate & Prüfungen</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {formData.lastUvvInspection && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Letzte UVV-Prüfung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(formData.lastUvvInspection).toLocaleDateString('de-DE')}</p>
                            </div>
                          )}
                          {formData.nextUvvInspection && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nächste UVV-Prüfung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(formData.nextUvvInspection).toLocaleDateString('de-DE')}</p>
                            </div>
                          )}
                        </div>
                        {(formData.hasCeMarking || formData.hasGsMarking || formData.hasInspectionReport) && (
                          <div className="grid grid-cols-3 gap-3">
                            {formData.hasCeMarking && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ CE-Kennzeichnung</span>}
                            {formData.hasGsMarking && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ GS-Zeichen</span>}
                            {formData.hasInspectionReport && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Prüfbericht</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Werkzeug */}
                {!editMode && infoSubTab === 'tool' && formData.type === AssetType.TOOL && (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-tighter mb-4">Identifikation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.serialNumber && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seriennummer</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.serialNumber}</p>
                          </div>
                        )}
                        {formData.articleNumber && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Artikelnummer</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.articleNumber}</p>
                          </div>
                        )}
                        {formData.modelNumber && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modellnummer</label>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.modelNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {(formData.size || formData.material || formData.toolPower || formData.toolVoltage || formData.toolBoxSet) && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-4">Technische Daten</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.size && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Größe/Größen</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.size}</p>
                            </div>
                          )}
                          {formData.material && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Material</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.material}</p>
                            </div>
                          )}
                          {formData.toolPower && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leistung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.toolPower}</p>
                            </div>
                          )}
                          {formData.toolVoltage && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spannung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.toolVoltage}</p>
                            </div>
                          )}
                          {formData.toolBoxSet && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Werkzeugkasten/Set</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formData.toolBoxSet}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(formData.lastCalibration || formData.nextCalibration || formData.hasCeMarking || formData.hasGsMarking || formData.requiresCalibration) && (
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase italic tracking-tighter mb-4">Zertifikate & Kalibrierung</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {formData.lastCalibration && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Letzte Kalibrierung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(formData.lastCalibration).toLocaleDateString('de-DE')}</p>
                            </div>
                          )}
                          {formData.nextCalibration && (
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nächste Kalibrierung</label>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(formData.nextCalibration).toLocaleDateString('de-DE')}</p>
                            </div>
                          )}
                        </div>
                        {(formData.hasCeMarking || formData.hasGsMarking || formData.requiresCalibration) && (
                          <div className="grid grid-cols-3 gap-3">
                            {formData.hasCeMarking && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ CE-Kennzeichnung</span>}
                            {formData.hasGsMarking && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ GS-Zeichen</span>}
                            {formData.requiresCalibration && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✓ Kalibrierung erforderlich</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
              )}

              {/* Edit Mode: Alle Felder bearbeitbar */}
              {editMode && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {/* Allgemeine Felder */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-3">Allgemein</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Beschreibung</label>
                            <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Notizen</label>
                            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Tags (komma-separiert)</label>
                            <input type="text" name="tags" value={formData.tags?.join(', ') || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Standort</label>
                              <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Abteilung</label>
                              <input type="text" name="department" value={formData.department || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Kostenstelle</label>
                            <input type="text" name="costCenter" value={formData.costCenter || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Lieferant</label>
                              <input type="text" name="supplier" value={formData.supplier || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Rechnungsnummer</label>
                              <input type="text" name="invoiceNumber" value={formData.invoiceNumber || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Dokumente vorhanden</label>
                            <div className="grid grid-cols-3 gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="hasInvoice" checked={formData.hasInvoice || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                <span className="text-xs font-bold">Rechnung</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="hasWarrantyCertificate" checked={formData.hasWarrantyCertificate || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                <span className="text-xs font-bold">Garantieschein</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="hasManual" checked={formData.hasManual || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                <span className="text-xs font-bold">Bedienungsanleitung</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Finanzen */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-3">Finanzen</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Anschaffungspreis (€)</label>
                            <input type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Restwert (€)</label>
                            <input type="number" step="0.01" name="residualValue" value={formData.residualValue || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Anschaffungsdatum</label>
                            <input type="date" name="purchaseDate" value={formData.purchaseDate || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Abschreibungsdauer (Jahre)</label>
                            <input type="number" name="depreciationYears" value={formData.depreciationYears || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Fahrzeug-spezifisch */}
                      {formData.type === AssetType.VEHICLE && (
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-tighter mb-3">Fahrzeug</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Fahrgestellnummer (VIN)</label>
                                <input type="text" name="vin" value={formData.vin || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white uppercase" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Fahrzeugklasse</label>
                                <select name="vehicleClass" value={formData.vehicleClass || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white">
                                  <option value="">—</option>
                                  <option value="Pkw">Pkw</option>
                                  <option value="Lkw">Lkw</option>
                                  <option value="Transporter">Transporter</option>
                                  <option value="Motorrad">Motorrad</option>
                                  <option value="Anhänger">Anhänger</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Hubraum</label>
                                <input type="text" name="engineDisplacement" value={formData.engineDisplacement || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" placeholder="z.B. 2000 ccm" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Leistung</label>
                                <input type="text" name="power" value={formData.power || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" placeholder="z.B. 150 PS" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Kraftstoff</label>
                                <select name="fuelType" value={formData.fuelType || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white">
                                  <option value="">—</option>
                                  <option value="Benzin">Benzin</option>
                                  <option value="Diesel">Diesel</option>
                                  <option value="Elektro">Elektro</option>
                                  <option value="Hybrid">Hybrid</option>
                                  <option value="LPG">LPG</option>
                                  <option value="CNG">CNG</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Getriebe</label>
                                <select name="transmission" value={formData.transmission || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white">
                                  <option value="">—</option>
                                  <option value="Manuell">Manuell</option>
                                  <option value="Automatik">Automatik</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Kilometerstand</label>
                              <input type="number" name="mileage" value={formData.mileage || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Versicherungsgesellschaft</label>
                                <input type="text" name="insuranceCompany" value={formData.insuranceCompany || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Versicherungsnummer</label>
                                <input type="text" name="insuranceNumber" value={formData.insuranceNumber || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Versicherung bis</label>
                                <input type="date" name="insuranceUntil" value={formData.insuranceUntil || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">KFZ-Steuer (€/Monat)</label>
                                <input type="number" step="0.01" name="vehicleTaxMonthly" value={formData.vehicleTaxMonthly || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Dokumente</label>
                              <div className="grid grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="hasVehicleRegistration" checked={formData.hasVehicleRegistration || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">Fahrzeugschein</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="hasVehicleTitle" checked={formData.hasVehicleTitle || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">Fahrzeugbrief</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="hasServiceBook" checked={formData.hasServiceBook || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">Serviceheft</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Maschine-spezifisch */}
                      {formData.type === AssetType.MACHINE && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-3">Maschine</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Seriennummer</label>
                                <input type="text" name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Hersteller-Nr.</label>
                                <input type="text" name="manufacturerNumber" value={formData.manufacturerNumber || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Leistung</label>
                                <input type="text" name="machinePower" value={formData.machinePower || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" placeholder="z.B. 5 kW" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Gewicht</label>
                                <input type="text" name="weight" value={formData.weight || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" placeholder="z.B. 250 kg" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Spannung</label>
                                <input type="text" name="voltage" value={formData.voltage || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" placeholder="z.B. 230V" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Abmessungen</label>
                                <input type="text" name="dimensions" value={formData.dimensions || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" placeholder="L x B x H" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Letzte UVV-Prüfung</label>
                                <input type="date" name="lastUvvInspection" value={formData.lastUvvInspection || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Nächste UVV-Prüfung</label>
                                <input type="date" name="nextUvvInspection" value={formData.nextUvvInspection || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Zertifikate</label>
                              <div className="grid grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="hasCeMarking" checked={formData.hasCeMarking || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">CE-Kennzeichnung</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="hasGsMarking" checked={formData.hasGsMarking || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">GS-Zeichen</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="hasInspectionReport" checked={formData.hasInspectionReport || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">Prüfbericht</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Werkzeug-spezifisch */}
                      {formData.type === AssetType.TOOL && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-3">Werkzeug</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Seriennummer</label>
                                <input type="text" name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Artikelnummer</label>
                                <input type="text" name="articleNumber" value={formData.articleNumber || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Größe</label>
                                <input type="text" name="size" value={formData.size || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" placeholder="z.B. 10mm" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Material</label>
                                <input type="text" name="material" value={formData.material || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Werkzeugkasten/Set</label>
                              <input type="text" name="toolBoxSet" value={formData.toolBoxSet || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Letzte Kalibrierung</label>
                                <input type="date" name="lastCalibration" value={formData.lastCalibration || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Nächste Kalibrierung</label>
                                <input type="date" name="nextCalibration" value={formData.nextCalibration || ''} onChange={handleChange} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-white" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Zertifikate</label>
                              <div className="grid grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="hasCeMarking" checked={formData.hasCeMarking || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">CE-Kennzeichnung</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="hasGsMarking" checked={formData.hasGsMarking || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">GS-Zeichen</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" name="requiresCalibration" checked={formData.requiresCalibration || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                                  <span className="text-xs font-bold">Kalibrierung erforderlich</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
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
                      {selectedFile && (
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
              )}
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
