import React from 'react';
import { Asset, LoanRecord } from '../types';
import { exportAssetsToCSV, exportLoansToCSV, exportMaintenanceToCSV } from '../services/exportService';

interface ExportModalProps {
  onClose: () => void;
  assets: Asset[];
  loans: LoanRecord[];
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, assets, loans }) => {
  const handleExportAssets = () => {
    exportAssetsToCSV(assets);
    onClose();
  };

  const handleExportLoans = () => {
    exportLoansToCSV(loans, assets);
    onClose();
  };

  const handleExportMaintenance = () => {
    exportMaintenanceToCSV(assets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20 animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">Daten Export</span>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Export <span className="text-blue-500">auswählen</span></h2>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={handleExportAssets}
            className="w-full p-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-blue-600/30 transition-all flex items-center justify-between"
          >
            <span>Assets exportieren</span>
            <span className="text-sm">({assets.length} Assets)</span>
          </button>

          <button
            onClick={handleExportLoans}
            className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-between"
          >
            <span>Ausleihen exportieren</span>
            <span className="text-sm">({loans.length} Einträge)</span>
          </button>

          <button
            onClick={handleExportMaintenance}
            className="w-full p-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-purple-600/30 transition-all flex items-center justify-between"
          >
            <span>Wartungen exportieren</span>
            <span className="text-sm">
              ({assets.reduce((sum, a) => sum + (a.repairHistory?.length || 0), 0)} Events)
            </span>
          </button>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-xl uppercase text-xs tracking-widest italic transition-all"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
