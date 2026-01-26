
import React, { useState, useEffect, useRef } from 'react';
import { Asset, User, AssetTypeLabels } from '../types';

interface AssetCardProps {
  asset: Asset;
  assignedUser?: User;
  onAction?: (asset: Asset) => void;
  actionLabel?: string;
  onDetails?: (asset: Asset) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, assignedUser, onAction, actionLabel, onDetails }) => {
  const [isInView, setIsInView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Lazy Loading mit Intersection Observer
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Lade 50px vor dem sichtbaren Bereich
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

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
      <div ref={imgRef} className="relative h-44 overflow-hidden bg-slate-200 dark:bg-slate-800">
        {asset.imageUrl ? (
          <>
            {isInView ? (
              <img 
                src={asset.imageUrl + (asset.imageUrl.includes('supabase.co') ? `?t=${Date.now()}` : '')} 
                alt={asset.model} 
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  console.warn('⚠️ Bild konnte nicht geladen werden:', asset.imageUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            {!imageLoaded && isInView && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
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
      
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base leading-tight text-slate-900 dark:text-white uppercase italic tracking-tighter truncate">
              {asset.brand} <span className="text-blue-600">{asset.model}</span>
            </h3>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ml-2 flex-shrink-0 shadow-sm ${conditionColor(asset.condition)}`} title={`Zustand: ${asset.condition}/5`} />
        </div>
        
        <div className="space-y-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">Garantie</span>
            <span className="text-slate-700 dark:text-slate-300">{asset.warrantyUntil}</span>
          </div>
          {assignedUser && (
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Benutzer</span>
              <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase italic">{assignedUser.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </div>

      {onAction && actionLabel && (
        <div className="px-4 pb-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onAction(asset); }}
            className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-black rounded-lg transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-tighter italic"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default AssetCard;
