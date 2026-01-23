
import React, { useState, useRef } from 'react';
import { Asset, AssetType, AssetTypeLabels } from '../types';

interface AssetCreateModalProps {
  onClose: () => void;
  onSave: (newAsset: Asset) => void;
}

const AssetCreateModal: React.FC<AssetCreateModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    brand: '',
    model: '',
    type: AssetType.TOOL,
    purchaseYear: new Date().getFullYear(),
    warrantyUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    condition: 5,
    imageUrl: 'https://picsum.photos/seed/newasset/400/300',
    qrCode: `QR_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    status: 'available',
    currentUserId: null,
    maintenanceIntervalMonths: 12,
    repairHistory: []
  });

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
    if (!formData.brand || !formData.model || !formData.qrCode) {
      alert("Pflichtfelder fehlen!");
      return;
    }

    const newAsset: Asset = {
      ...formData as Asset,
      id: `a-${Date.now()}`,
    };
    onSave(newAsset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">Inventur Management</span>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Neues Asset <span className="text-blue-500">registrieren</span></h2>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-8 flex-grow custom-scrollbar">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asset Foto</label>
                <div onClick={() => fileInputRef.current?.click()} className="relative rounded-2xl overflow-hidden aspect-video shadow-inner bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-pointer group">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>
              <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">QR-CODE IDENTIFIER</label>
                <input type="text" name="qrCode" value={formData.qrCode} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-blue-200 rounded-xl text-xs font-black text-blue-600 uppercase italic outline-none" />
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marke *</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modell *</label>
                  <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
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
                  <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Kennzeichen *</label>
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
            </div>

            <div className="md:col-span-2 flex gap-4 mt-4 pt-6 border-t border-slate-100 dark:border-slate-800">
               <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest italic">Abbrechen</button>
               <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-blue-600/30">Asset registrieren</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetCreateModal;
