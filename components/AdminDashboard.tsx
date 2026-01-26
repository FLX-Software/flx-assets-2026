
import React, { useState, useMemo } from 'react';
import { Asset, User, AssetType, LoanRecord } from '../types';
import AssetCard from './AssetCard';
import AdminStatsDashboard from './AdminStatsDashboard';
import { getMaintenanceStatus } from '../services/maintenanceService';

interface AdminDashboardProps {
  assets: Asset[];
  users: User[];
  loans: LoanRecord[];
  onShowDetails: (asset: Asset) => void;
  onAddAsset: () => void;
  onManageUsers: () => void;
  onManageOrganizations?: () => void;
  onExport: () => void;
  onImport: () => void;
}

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'condition-asc' | 'condition-desc';
type MaintenanceFilter = 'ALL' | 'OK' | 'WARNING' | 'CRITICAL';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ assets, users, loans, onShowDetails, onAddAsset, onManageUsers, onManageOrganizations, onExport, onImport }) => {
  const [filterType, setFilterType] = useState<AssetType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'available' | 'loaned' | 'ALL'>('ALL');
  const [filterCondition, setFilterCondition] = useState<number | 'ALL'>('ALL');
  const [filterMaintenance, setFilterMaintenance] = useState<MaintenanceFilter>('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const filteredAssets = React.useMemo(() => {
    let filtered = assets.filter(a => {
      // Basis-Filter
      const matchesType = filterType === 'ALL' || a.type === filterType;
      const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
      
      // Volltextsuche (Marke, Modell, QR-Code)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        a.brand.toLowerCase().includes(searchLower) ||
        a.model.toLowerCase().includes(searchLower) ||
        a.qrCode.toLowerCase().includes(searchLower);
      
      // Zustand-Filter
      const matchesCondition = filterCondition === 'ALL' || a.condition === filterCondition;
      
      // Wartungsstatus-Filter
      let matchesMaintenance = true;
      if (filterMaintenance !== 'ALL') {
        const maintenanceStatus = getMaintenanceStatus(a);
        if (filterMaintenance === 'CRITICAL') {
          matchesMaintenance = maintenanceStatus.isCritical;
        } else if (filterMaintenance === 'WARNING') {
          matchesMaintenance = Object.values(maintenanceStatus.statusMap).some(s => s === 'warning') && !maintenanceStatus.isCritical;
        } else if (filterMaintenance === 'OK') {
          matchesMaintenance = !maintenanceStatus.isCritical && !Object.values(maintenanceStatus.statusMap).some(s => s === 'warning');
        }
      }
      
      // Datum-Filter (Kaufjahr)
      let matchesDate = true;
      if (filterDateFrom || filterDateTo) {
        const purchaseYear = a.purchaseYear;
        if (filterDateFrom) {
          const fromYear = parseInt(filterDateFrom);
          matchesDate = matchesDate && purchaseYear >= fromYear;
        }
        if (filterDateTo) {
          const toYear = parseInt(filterDateTo);
          matchesDate = matchesDate && purchaseYear <= toYear;
        }
      }
      
      return matchesType && matchesStatus && matchesSearch && matchesCondition && matchesMaintenance && matchesDate;
    });

    // Sortierung
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.brand + ' ' + a.model).localeCompare(b.brand + ' ' + b.model);
        case 'name-desc':
          return (b.brand + ' ' + b.model).localeCompare(a.brand + ' ' + a.model);
        case 'date-asc':
          return (a.purchaseYear || 0) - (b.purchaseYear || 0);
        case 'date-desc':
          return (b.purchaseYear || 0) - (a.purchaseYear || 0);
        case 'condition-asc':
          return a.condition - b.condition;
        case 'condition-desc':
          return b.condition - a.condition;
        default:
          return 0;
      }
    });

    return filtered;
  }, [assets, filterType, filterStatus, filterCondition, filterMaintenance, filterDateFrom, filterDateTo, searchQuery, sortBy]);

  const criticalAssets = assets.filter(a => getMaintenanceStatus(a).isCritical);

  const stats = {
    total: assets.length,
    loaned: assets.filter(a => a.status === 'loaned').length,
    available: assets.filter(a => a.status === 'available').length
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1.5 uppercase italic tracking-tighter">Asset-Übersicht</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Zentrales Management der FLX-Assets</p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setShowStatsModal(true)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 uppercase italic tracking-tighter text-xs border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">Statistiken</span>
            </button>
            
            {onManageOrganizations && (
              <button 
                onClick={onManageOrganizations}
                className="bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-black px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 uppercase italic tracking-tighter text-xs border border-purple-200 dark:border-purple-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden sm:inline">Organisationen</span>
              </button>
            )}
            
            <button 
              onClick={onManageUsers}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 uppercase italic tracking-tighter text-xs border border-slate-200 dark:border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="hidden sm:inline">Benutzer</span>
            </button>
            
            <button 
              onClick={onImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 uppercase italic tracking-tighter text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="hidden sm:inline">Import</span>
            </button>
            
            <button 
              onClick={onExport}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all active:scale-95 uppercase italic tracking-tighter text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <button 
              onClick={onAddAsset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 uppercase italic tracking-tighter text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Neues Asset</span>
              <span className="sm:hidden">Hinzufügen</span>
            </button>
          </div>
        </div>

      {/* Critical Section */}
      {criticalAssets.length > 0 && (
        <section className="mb-6 animate-in slide-in-from-top duration-500">
           <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/20">
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-black text-rose-900 dark:text-rose-100 uppercase italic tracking-tighter leading-none">GEFAHRENZONE</h2>
                  <p className="text-rose-600 dark:text-rose-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">{criticalAssets.length} Assets benötigen Aufmerksamkeit</p>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {criticalAssets.map(asset => (
                  <div 
                    key={asset.id} 
                    onClick={() => onShowDetails(asset)}
                    className="min-w-[240px] bg-white dark:bg-[#0d1117] p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-sm cursor-pointer hover:border-rose-500 transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <img src={asset.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <p className="font-black text-xs uppercase italic dark:text-white">{asset.brand} {asset.model}</p>
                        <p className="text-[10px] font-bold text-rose-600">{asset.licensePlate || asset.qrCode}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {getMaintenanceStatus(asset).statusMap.tuev !== 'ok' && (
                        <div className="flex justify-between text-[10px] font-bold">
                           <span className="text-slate-400 uppercase">TÜV / AU</span>
                           <span className="text-rose-600">{asset.nextTuev}</span>
                        </div>
                      )}
                      {getMaintenanceStatus(asset).statusMap.maintenance !== 'ok' && (
                        <div className="flex justify-between text-[10px] font-bold">
                           <span className="text-slate-400 uppercase">Wartung</span>
                           <span className="text-rose-600">{asset.nextMaintenance}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>
      )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-[#0d1117] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Gesamt</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30">
            <p className="text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest mb-1">Bereit</p>
            <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-500">{stats.available}</p>
          </div>
          <div className="bg-slate-900 dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-800 dark:border-slate-700">
            <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest mb-1">Verliehen</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{stats.loaned}</p>
          </div>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-[#0d1117] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
        {/* Basis-Suche und Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
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
          
          {/* Basis-Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="w-40">
              <select 
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-lg appearance-none cursor-pointer focus:border-blue-500 outline-none text-sm font-bold dark:text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="ALL">Alle Kategorien</option>
                <option value={AssetType.VEHICLE}>Fahrzeuge</option>
                <option value={AssetType.MACHINE}>Maschinen</option>
                <option value={AssetType.TOOL}>Werkzeuge</option>
              </select>
            </div>
            <div className="w-36">
              <select 
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-lg appearance-none cursor-pointer focus:border-blue-500 outline-none text-sm font-bold dark:text-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="ALL">Alle Status</option>
                <option value="available">Verfügbar</option>
                <option value="loaned">Verliehen</option>
              </select>
            </div>
            <div className="w-32">
              <select 
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-lg appearance-none cursor-pointer focus:border-blue-500 outline-none text-sm font-bold dark:text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="date-desc">Neueste zuerst</option>
                <option value="date-asc">Älteste zuerst</option>
                <option value="condition-desc">Bester Zustand</option>
                <option value="condition-asc">Schlechtester Zustand</option>
              </select>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Erweitert
            </button>
          </div>
        </div>

        {/* Erweiterte Filter (ausklappbar) */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Zustand-Filter */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Zustand</label>
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

              {/* Wartungsstatus-Filter */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Wartung</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-lg appearance-none cursor-pointer focus:border-blue-500 outline-none text-sm font-bold dark:text-white"
                  value={filterMaintenance}
                  onChange={(e) => setFilterMaintenance(e.target.value as MaintenanceFilter)}
                >
                  <option value="ALL">Alle</option>
                  <option value="OK">OK</option>
                  <option value="WARNING">Warnung</option>
                  <option value="CRITICAL">Kritisch</option>
                </select>
              </div>

              {/* Datum von */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Kaufjahr von</label>
                <input
                  type="number"
                  placeholder="z.B. 2020"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium dark:text-white"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              {/* Datum bis */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Kaufjahr bis</label>
                <input
                  type="number"
                  placeholder="z.B. 2024"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium dark:text-white"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Filter zurücksetzen */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilterCondition('ALL');
                  setFilterMaintenance('ALL');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ergebnisse Info */}
      {filteredAssets.length !== assets.length && (
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-bold">{filteredAssets.length}</span> von <span className="font-bold">{assets.length}</span> Assets
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredAssets.length > 0 ? (
          filteredAssets.map(asset => (
            <AssetCard 
              key={asset.id} 
              asset={asset} 
              assignedUser={users.find(u => u.id === asset.currentUserId)} 
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

      {/* Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0d1117] w-full max-w-7xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-slate-800">
              <div>
                <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">Dashboard Analytics</span>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Statistiken & Übersichten</h2>
              </div>
              <button 
                onClick={() => setShowStatsModal(false)} 
                className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6 flex-grow custom-scrollbar">
              <AdminStatsDashboard assets={assets} loans={loans} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
