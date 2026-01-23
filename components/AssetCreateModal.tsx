
import React, { useState, useRef } from 'react';
import { Asset, AssetType } from '../types';

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
    currentUserId: null
  });

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
    if (!formData.brand || !formData.model || !formData.qrCode) {
      alert("Bitte füllen Sie alle Pflichtfelder aus (Marke, Modell, QR-Code).");
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
        {/* Header */}
        <div className="p-6 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">Inventur Management</span>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
              Neues Asset <span className="text-blue-500">registrieren</span>
            </h2>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-8 flex-grow">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Image & QR */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Asset Foto</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative rounded-2xl overflow-hidden aspect-video shadow-inner bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-pointer group hover:border-blue-400 transition-colors"
                >
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Foto hochladen</span>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">QR-CODE IDENTIFIER</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="qrCode"
                    value={formData.qrCode}
                    onChange={handleChange}
                    className="flex-grow p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter italic focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Z.B. QR_TOOL_001"
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, qrCode: `QR_${Math.random().toString(36).substring(2, 9).toUpperCase()}`}))}
                    className="p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    title="Zufällig generieren"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Marke *</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white" placeholder="Z.B. Hilti" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Modell *</label>
                  <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white" placeholder="Z.B. TE-50" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Kategorie</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white">
                  {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Kaufjahr</label>
                  <input type="number" name="purchaseYear" value={formData.purchaseYear} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Garantie bis</label>
                  <input type="date" name="warrantyUntil" value={formData.warrantyUntil} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-blue-500 outline-none dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Zustand (1-5)</label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  name="condition" 
                  value={formData.condition} 
                  onChange={handleChange} 
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 my-4" 
                />
                <div className="flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 px-1">
                  <span>DEFEKT</span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">AKTUELL: {formData.condition} / 5</span>
                  <span>NEUWERTIG</span>
                </div>
              </div>
            </div>

            {/* Bottom: Actions */}
            <div className="md:col-span-2 flex gap-4 mt-4 pt-6 border-t border-slate-100 dark:border-slate-800">
               <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl uppercase text-xs tracking-widest italic hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Abbrechen
              </button>
              <button 
                type="submit" 
                className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
              >
                Asset registrieren
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetCreateModal;
