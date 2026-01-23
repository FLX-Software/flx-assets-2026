
import React from 'react';
import { Asset, User, AssetTypeLabels } from '../types';

interface AssetCardProps {
  asset: Asset;
  assignedUser?: User;
  onAction?: (asset: Asset) => void;
  actionLabel?: string;
  onDetails?: (asset: Asset) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, assignedUser, onAction, actionLabel, onDetails }) => {
  const conditionColor = (c: number) => {
    if (c >= 4) return 'bg-blue-500';
    if (c >= 2) return 'bg-slate-400';
    return 'bg-rose-500';
  };

  return (
    <div 
      onClick={() => onDetails?.(asset)}
      className={`bg-white dark:bg-[#0d1117] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all hover:shadow-xl hover:shadow-blue-500/5 group ${onDetails ? 'cursor-pointer' : ''}`}
    >
      <div className="relative h-44 overflow-hidden">
        <img 
          src={asset.imageUrl} 
          alt={asset.model} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest ${asset.status === 'available' ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-slate-900 dark:bg-slate-800'}`}>
            {asset.status === 'available' ? 'Verfügbar' : 'Verliehen'}
          </span>
        </div>
        
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
           <span className="bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1 rounded text-white text-[10px] font-bold uppercase tracking-tight">
            {AssetTypeLabels[asset.type]}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-black text-lg leading-tight text-slate-900 dark:text-white uppercase italic tracking-tighter">
              {asset.brand} <span className="text-blue-600">{asset.model}</span>
            </h3>
          </div>
          <div className={`w-3 h-3 rounded-full mt-1.5 shadow-sm ${conditionColor(asset.condition)}`} title={`Zustand: ${asset.condition}/5`} />
        </div>
        
        <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">Garantie bis</span>
            <span className="text-slate-700 dark:text-slate-300">{asset.warrantyUntil}</span>
          </div>
          {assignedUser && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Benutzer</span>
              <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase italic">{assignedUser.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </div>

      {onAction && actionLabel && (
        <div className="p-5 pt-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onAction(asset); }}
            className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-tighter italic"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default AssetCard;
