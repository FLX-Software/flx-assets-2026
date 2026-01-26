
import React, { useState, useMemo } from 'react';
import { Asset, User, AssetType } from '../types';
import AssetCard from './AssetCard';

interface StaffDashboardProps {
  assets: Asset[];
  currentUser: User;
  onReturnAsset: (asset: Asset) => void;
  onStartScan: () => void;
  onShowDetails: (asset: Asset) => void;
}

type StaffSortOption = 'name-asc' | 'name-desc' | 'condition-asc' | 'condition-desc';

const StaffDashboard: React.FC<StaffDashboardProps> = ({ assets, currentUser, onReturnAsset, onStartScan, onShowDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState<number | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<StaffSortOption>('name-asc');

  const myAssets = useMemo(() => {
    let filtered = assets.filter(a => a.currentUserId === currentUser.id);
    
    // Volltextsuche (Marke, Modell, QR-Code)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.brand.toLowerCase().includes(searchLower) ||
        a.model.toLowerCase().includes(searchLower) ||
        a.qrCode.toLowerCase().includes(searchLower)
      );
    }
    
    // Zustand-Filter
    if (filterCondition !== 'ALL') {
      filtered = filtered.filter(a => a.condition === filterCondition);
    }
    
    // Sortierung
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.brand + ' ' + a.model).localeCompare(b.brand + ' ' + b.model);
        case 'name-desc':
          return (b.brand + ' ' + b.model).localeCompare(a.brand + ' ' + a.model);
        case 'condition-asc':
          return a.condition - b.condition;
        case 'condition-desc':
          return b.condition - a.condition;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [assets, currentUser.id, searchQuery, filterCondition, sortBy]);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1 uppercase italic tracking-tighter">
              Willkommen, <span className="text-blue-600">{currentUser.name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {myAssets.length} {myAssets.length === 1 ? 'Asset' : 'Assets'} aktiv im Besitz
            </p>
          </div>
        </div>
      </header>

      {/* My Assets Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase italic tracking-tighter">
            <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
            Meine Ausrüstung
          </h2>
          {myAssets.length > 0 && (
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {myAssets.length}
            </span>
          )}
        </div>

        {/* Suche & Filter für Mitarbeiter */}
        {assets.filter(a => a.currentUserId === currentUser.id).length > 0 && (
          <div className="bg-white dark:bg-[#0d1117] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Volltextsuche */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Marke, Modell oder QR-Code suchen..." 
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Filter */}
              <div className="flex gap-3">
                <div className="w-40">
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-lg appearance-none cursor-pointer focus:border-blue-500 outline-none text-sm font-bold dark:text-white"
                    value={filterCondition}
                    onChange={(e) => setFilterCondition(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                  >
                    <option value="ALL">Alle Zustände</option>
                    <option value="5">Sehr gut (5)</option>
                    <option value="4">Gut (4)</option>
                    <option value="3">Befriedigend (3)</option>
                    <option value="2">Ausreichend (2)</option>
                    <option value="1">Mangelhaft (1)</option>
                  </select>
                </div>
                <div className="w-36">
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-lg appearance-none cursor-pointer focus:border-blue-500 outline-none text-sm font-bold dark:text-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as StaffSortOption)}
                  >
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="condition-desc">Bester Zustand</option>
                    <option value="condition-asc">Schlechtester Zustand</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {myAssets.length > 0 ? (
            myAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                actionLabel="Zurückgeben"
                onAction={onReturnAsset}
                onDetails={onShowDetails}
              />
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-3xl py-16 px-4 text-center shadow-sm">
              <div className="bg-blue-50 dark:bg-blue-900/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                 <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
              </div>
              <p className="text-slate-800 dark:text-white font-bold text-xl">Bereit für den nächsten Einsatz?</p>
              <p className="text-slate-400 mt-1 mb-8">Scanne ein Gerät, um es auszuleihen.</p>
              <button 
                onClick={onStartScan}
                className="bg-slate-900 dark:bg-blue-600 text-white font-black px-8 py-3 rounded-xl hover:bg-black dark:hover:bg-blue-700 transition-all"
              >
                JETZT SCANNEN
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={onStartScan}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl shadow-[0_8px_24px_rgba(37,99,235,0.4)] flex items-center gap-3 font-black text-sm uppercase italic tracking-tighter transition-all active:scale-95 group"
        >
          <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-90 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="hidden sm:inline">Scan Asset</span>
          <span className="sm:hidden">Scan</span>
        </button>
      </div>
    </div>
  );
};

export default StaffDashboard;
