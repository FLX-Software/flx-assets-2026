
import React, { useState } from 'react';
import { Asset, User, AssetType } from '../types';
import AssetCard from './AssetCard';

interface AdminDashboardProps {
  assets: Asset[];
  users: User[];
  onShowDetails: (asset: Asset) => void;
  onAddAsset: () => void;
  onManageUsers: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ assets, users, onShowDetails, onAddAsset, onManageUsers }) => {
  const [filterType, setFilterType] = useState<AssetType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'available' | 'loaned' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(a => {
    const matchesType = filterType === 'ALL' || a.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    const matchesSearch = (a.brand + ' ' + a.model).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const stats = {
    total: assets.length,
    loaned: assets.filter(a => a.status === 'loaned').length,
    available: assets.filter(a => a.status === 'available').length
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Asset-Übersicht</h1>
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Zentrales Management der FLX-Assets</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={onManageUsers}
            className="bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 uppercase italic tracking-tighter text-sm border border-slate-700/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Benutzer verwalten
          </button>
          
          <button 
            onClick={onAddAsset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 uppercase italic tracking-tighter text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
            Asset hinzufügen
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Gesamtbestand</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30">
          <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Bereit</p>
          <p className="text-4xl font-black text-blue-700 dark:text-blue-500">{stats.available}</p>
        </div>
        <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-800 dark:border-slate-700">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Im Einsatz</p>
          <p className="text-4xl font-black text-white">{stats.loaned}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0d1117] p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 flex flex-col md:flex-row gap-5">
        <div className="flex-grow">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Suche</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Marke oder Modell suchen..." 
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-56">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kategorie</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 rounded-xl appearance-none cursor-pointer focus:border-blue-500 outline-none text-sm font-bold dark:text-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="ALL">Alle Kategorien</option>
            <option value={AssetType.VEHICLE}>Fahrzeuge</option>
            <option value={AssetType.MACHINE}>Maschinen</option>
            <option value={AssetType.TOOL}>Werkzeuge</option>
          </select>
        </div>
        <div className="w-full md:w-56">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Verfügbarkeit</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 rounded-xl appearance-none cursor-pointer focus:border-blue-500 outline-none text-sm font-bold dark:text-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="ALL">Alle Status</option>
            <option value="available">Verfügbar</option>
            <option value="loaned">Verliehen</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.length > 0 ? (
          filteredAssets.map(asset => (
            <AssetCard 
              key={asset.id} 
              asset={asset} 
              assignedUser={users.find(u => u.id === asset.currentUserId)} 
              // Fix: Property name should be onDetails as defined in AssetCardProps
              onDetails={onShowDetails}
            />
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-white dark:bg-[#0d1117] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Keine Ergebnisse gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
