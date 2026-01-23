
import React from 'react';
import { Asset, User } from '../types';
import AssetCard from './AssetCard';

interface StaffDashboardProps {
  assets: Asset[];
  currentUser: User;
  onReturnAsset: (asset: Asset) => void;
  onStartScan: () => void;
  onShowDetails: (asset: Asset) => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ assets, currentUser, onReturnAsset, onStartScan, onShowDetails }) => {
  const myAssets = assets.filter(a => a.currentUserId === currentUser.id);

  return (
    <div className="p-4 pb-32">
      <header className="mb-10 mt-6 text-center md:text-left">
        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-3 inline-block">
          Team Member
        </span>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-2 tracking-tight italic uppercase">
          Willkommen, <span className="text-blue-600">{currentUser.name.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Status: {myAssets.length} Assets aktiv im Besitz.</p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            Meine Ausrüstung
          </h2>
          {myAssets.length > 0 && (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{myAssets.length} Items</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* FLX Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={onStartScan}
          className="bg-[#0091FF] hover:bg-blue-600 text-white px-10 py-5 rounded-2xl shadow-[0_10px_40px_rgba(0,145,255,0.4)] flex items-center gap-4 font-black text-xl italic tracking-tighter border-2 border-white/20 transition-all active:scale-95 group"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          </div>
          SCAN ASSET
        </button>
      </div>
    </div>
  );
};

export default StaffDashboard;
