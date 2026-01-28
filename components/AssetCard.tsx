import React from 'react';
import { Asset, User, AssetTypeLabels, AssetStatusLabels } from '../types';

interface AssetCardProps {
  asset: Asset;
  assignedUser?: User;
  onAction?: (asset: Asset) => void;
  actionLabel?: string;
  onDetails?: (asset: Asset) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, assignedUser, onAction, actionLabel, onDetails }) => {
  const statusDotColor = asset.status === 'available' ? 'bg-blue-500' : asset.status === 'loaned' ? 'bg-amber-500' : 'bg-rose-500';
  const modelColor = asset.status === 'available' ? 'text-blue-600 dark:text-blue-400' : asset.status === 'loaned' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';

  return (
    <div
      onClick={() => onDetails?.(asset)}
      className={`bg-white dark:bg-[#0d1117] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-blue-500/30 ${onDetails ? 'cursor-pointer' : ''}`}
    >
      <div className="p-3 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-sm leading-tight text-slate-900 dark:text-white uppercase italic tracking-tighter truncate">
              {asset.brand} <span className={modelColor}>{asset.model}</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate">{asset.qrCode}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor}`} title={`Status: ${AssetStatusLabels[asset.status] || asset.status}${asset.condition != null ? `, Zustand: ${asset.condition}/5` : ''}`} />
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
              asset.status === 'available' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
              asset.status === 'loaned' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
              'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
            }`}>
              {AssetStatusLabels[asset.status] || asset.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="uppercase tracking-wider">{AssetTypeLabels[asset.type]}</span>
          <span>Garantie: {asset.warrantyUntil || '–'}</span>
          {assignedUser && <span className="text-amber-600 dark:text-amber-400">{assignedUser.name.split(' ')[0]}</span>}
        </div>
      </div>

      {onAction && actionLabel && (
        <div className="px-3 pb-3">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(asset); }}
            className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white font-black rounded-lg transition-all uppercase text-[10px] tracking-tighter italic"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default AssetCard;
