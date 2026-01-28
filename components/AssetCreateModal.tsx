import React, { useState } from 'react';
import { Asset, AssetType, AssetTypeLabels, AssetStatusLabels, AssetStatus } from '../types';

interface AssetCreateModalProps {
  onClose: () => void;
  onSave: (newAsset: Asset) => void;
  organizationId: string;
}

type TabType = 'basic' | 'general' | 'vehicle' | 'machine' | 'tool' | 'financial';

const AssetCreateModal: React.FC<AssetCreateModalProps> = ({ onClose, onSave, organizationId }) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    brand: '',
    model: '',
    type: AssetType.TOOL,
    purchaseYear: new Date().getFullYear(),
    warrantyUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    condition: 5,
    imageUrl: '',
    qrCode: `QR_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    status: 'available',
    currentUserId: null,
    maintenanceIntervalMonths: 12,
    repairHistory: []
  });

  const [activeTab, setActiveTab] = useState<TabType>('basic');

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
        // Tags als komma-separierte Liste speichern
        return { ...prev, [name]: value ? value.split(',').map(t => t.trim()).filter(Boolean) : undefined };
      }
      return { ...prev, [name]: value || undefined };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.model || !formData.qrCode) {
      alert("Pflichtfelder fehlen!");
      return;
    }
    try {
      const assetId = `a-${Date.now()}`;
      const newAsset: Asset = { ...formData as Asset, id: assetId, imageUrl: '' };
      await onSave(newAsset);
    } catch (error: any) {
      console.error('❌ Fehler beim Speichern:', error);
      alert(error?.message || 'Fehler beim Speichern.');
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'basic', label: 'Basis', icon: '📋' },
    { id: 'general', label: 'Allgemein', icon: '📝' },
    { id: 'financial', label: 'Finanzen', icon: '💰' },
    { id: 'vehicle', label: 'Fahrzeug', icon: '🚗' },
    { id: 'machine', label: 'Maschine', icon: '⚙️' },
    { id: 'tool', label: 'Werkzeug', icon: '🔧' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">Inventur Management</span>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Neues Asset <span className="text-blue-500">registrieren</span></h2>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const isRelevant = 
                (tab.id === 'vehicle' && formData.type === AssetType.VEHICLE) ||
                (tab.id === 'machine' && formData.type === AssetType.MACHINE) ||
                (tab.id === 'tool' && formData.type === AssetType.TOOL) ||
                (tab.id !== 'vehicle' && tab.id !== 'machine' && tab.id !== 'tool');
              
              if (!isRelevant) return null;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-black uppercase italic tracking-tighter transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto p-8 flex-grow custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tab: Basis */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                      <select name="status" value={formData.status || 'available'} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white">
                        {(['available', 'loaned', 'defective'] as AssetStatus[]).map(s => (
                          <option key={s} value={s}>{AssetStatusLabels[s]}</option>
                        ))}
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
                        <input type="date" name="warrantyUntil" value={formData.warrantyUntil} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Allgemein */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Beschreibung</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-medium outline-none dark:text-white" placeholder="Zusätzliche Informationen zum Asset..." />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notizen</label>
                  <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-medium outline-none dark:text-white" placeholder="Interne Notizen..." />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tags (komma-separiert)</label>
                  <input type="text" name="tags" value={formData.tags?.join(', ') || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. winterreifen, elektrisch, schwer" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standort</label>
                    <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. Lager 1, Werkstatt" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abteilung</label>
                    <input type="text" name="department" value={formData.department || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. Produktion, Verwaltung" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kostenstelle</label>
                    <input type="text" name="costCenter" value={formData.costCenter || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Anschaffungsdatum</label>
                    <input type="date" name="purchaseDate" value={formData.purchaseDate || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lieferant</label>
                    <input type="text" name="supplier" value={formData.supplier || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rechnungsnummer</label>
                    <input type="text" name="invoiceNumber" value={formData.invoiceNumber || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dokumente vorhanden</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasInvoice" checked={formData.hasInvoice || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">Rechnung</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasWarrantyCertificate" checked={formData.hasWarrantyCertificate || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">Garantieschein</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasManual" checked={formData.hasManual || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">Bedienungsanleitung</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Finanzen */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Anschaffungspreis (€)</label>
                    <input type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Restwert (€)</label>
                    <input type="number" step="0.01" name="residualValue" value={formData.residualValue || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abschreibungsdauer (Jahre)</label>
                  <input type="number" name="depreciationYears" value={formData.depreciationYears || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                </div>
              </div>
            )}

            {/* Tab: Fahrzeug */}
            {activeTab === 'vehicle' && formData.type === AssetType.VEHICLE && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-tighter mb-4">Identifikation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fahrgestellnummer (VIN)</label>
                      <input type="text" name="vin" value={formData.vin || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white uppercase" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fahrzeugbrief-Nr.</label>
                      <input type="text" name="vehicleRegistrationNumber" value={formData.vehicleRegistrationNumber || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Erstzulassung</label>
                      <input type="date" name="firstRegistrationDate" value={formData.firstRegistrationDate || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fahrzeugklasse</label>
                      <select name="vehicleClass" value={formData.vehicleClass || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white">
                        <option value="">—</option>
                        <option value="Pkw">Pkw</option>
                        <option value="Lkw">Lkw</option>
                        <option value="Transporter">Transporter</option>
                        <option value="Motorrad">Motorrad</option>
                        <option value="Anhänger">Anhänger</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-4">Technische Daten</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hubraum</label>
                      <input type="text" name="engineDisplacement" value={formData.engineDisplacement || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. 2000 ccm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leistung</label>
                      <input type="text" name="power" value={formData.power || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. 150 PS oder 110 kW" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kraftstoff</label>
                      <select name="fuelType" value={formData.fuelType || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white">
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
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Getriebe</label>
                      <select name="transmission" value={formData.transmission || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white">
                        <option value="">—</option>
                        <option value="Manuell">Manuell</option>
                        <option value="Automatik">Automatik</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kilometerstand</label>
                      <input type="number" name="mileage" value={formData.mileage || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase italic tracking-tighter mb-4">Versicherung & Zulassung</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versicherungsgesellschaft</label>
                      <input type="text" name="insuranceCompany" value={formData.insuranceCompany || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versicherungsnummer</label>
                      <input type="text" name="insuranceNumber" value={formData.insuranceNumber || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versicherung bis</label>
                      <input type="date" name="insuranceUntil" value={formData.insuranceUntil || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">KFZ-Steuer (€/Monat)</label>
                      <input type="number" step="0.01" name="vehicleTaxMonthly" value={formData.vehicleTaxMonthly || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zulassungsbehörde</label>
                      <input type="text" name="registrationAuthority" value={formData.registrationAuthority || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dokumente vorhanden</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasVehicleRegistration" checked={formData.hasVehicleRegistration || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">Fahrzeugschein</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasVehicleTitle" checked={formData.hasVehicleTitle || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">Fahrzeugbrief</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasServiceBook" checked={formData.hasServiceBook || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">Serviceheft</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Maschine */}
            {activeTab === 'machine' && formData.type === AssetType.MACHINE && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-tighter mb-4">Identifikation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seriennummer</label>
                      <input type="text" name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hersteller-Nr.</label>
                      <input type="text" name="manufacturerNumber" value={formData.manufacturerNumber || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Typbezeichnung</label>
                      <input type="text" name="typeDesignation" value={formData.typeDesignation || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-4">Technische Daten</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leistung</label>
                      <input type="text" name="machinePower" value={formData.machinePower || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. 5 kW oder 7 PS" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gewicht</label>
                      <input type="text" name="weight" value={formData.weight || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. 250 kg" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abmessungen</label>
                      <input type="text" name="dimensions" value={formData.dimensions || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="L x B x H" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spannung</label>
                      <input type="text" name="voltage" value={formData.voltage || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. 230V oder 400V" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stromverbrauch</label>
                      <input type="text" name="currentConsumption" value={formData.currentConsumption || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. 15 A" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Betriebsdruck</label>
                      <input type="text" name="operatingPressure" value={formData.operatingPressure || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Drehzahl</label>
                      <input type="text" name="rpm" value={formData.rpm || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase italic tracking-tighter mb-4">Zertifikate & Prüfungen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Letzte UVV-Prüfung</label>
                      <input type="date" name="lastUvvInspection" value={formData.lastUvvInspection || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nächste UVV-Prüfung</label>
                      <input type="date" name="nextUvvInspection" value={formData.nextUvvInspection || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasCeMarking" checked={formData.hasCeMarking || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">CE-Kennzeichnung</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasGsMarking" checked={formData.hasGsMarking || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">GS-Zeichen</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasInspectionReport" checked={formData.hasInspectionReport || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">Prüfbericht</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Werkzeug */}
            {activeTab === 'tool' && formData.type === AssetType.TOOL && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-tighter mb-4">Identifikation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seriennummer</label>
                      <input type="text" name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Artikelnummer</label>
                      <input type="text" name="articleNumber" value={formData.articleNumber || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modellnummer</label>
                      <input type="text" name="modelNumber" value={formData.modelNumber || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-4">Technische Daten</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Größe/Größen</label>
                      <input type="text" name="size" value={formData.size || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. 10mm, 1/2 Zoll, M8-M12" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Material</label>
                      <input type="text" name="material" value={formData.material || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="z.B. Chrom-Vanadium, Edelstahl" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leistung</label>
                      <input type="text" name="toolPower" value={formData.toolPower || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="Für Elektrowerkzeuge" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spannung</label>
                      <input type="text" name="toolVoltage" value={formData.toolVoltage || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" placeholder="Für Elektrowerkzeuge" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Werkzeugkasten/Set</label>
                      <input type="text" name="toolBoxSet" value={formData.toolBoxSet || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase italic tracking-tighter mb-4">Zertifikate & Kalibrierung</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Letzte Kalibrierung</label>
                      <input type="date" name="lastCalibration" value={formData.lastCalibration || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nächste Kalibrierung</label>
                      <input type="date" name="nextCalibration" value={formData.nextCalibration || ''} onChange={handleChange} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold outline-none dark:text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasCeMarking" checked={formData.hasCeMarking || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">CE-Kennzeichnung</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasGsMarking" checked={formData.hasGsMarking || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">GS-Zeichen</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="requiresCalibration" checked={formData.requiresCalibration || false} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                      <span className="text-sm font-bold">Kalibrierung erforderlich</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest italic">Abbrechen</button>
              <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2">
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
