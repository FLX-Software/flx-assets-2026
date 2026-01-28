import React, { useState } from 'react';
import { Asset, LoanRecord } from '../types';
import { exportAssetsToCSV, exportLoansToCSV, exportMaintenanceToCSV } from '../services/exportService';

const EXPORT_TIMEOUT_MS = 60000; // 60 Sekunden

interface ExportModalProps {
  onClose: () => void;
  assets: Asset[];
  loans: LoanRecord[];
  onShowNotification?: (message: string, type: 'success' | 'error') => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, assets, loans, onShowNotification }) => {
  const [exporting, setExporting] = useState<'assets' | 'loans' | 'maintenance' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runWithTimeout = <T,>(label: string, fn: () => T | Promise<T>): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} wurde nach ${EXPORT_TIMEOUT_MS / 1000} Sekunden abgebrochen.`)), EXPORT_TIMEOUT_MS)
    );
    return Promise.race([Promise.resolve(fn()), timeout]);
  };

  const handleExportAssets = async () => {
    setError(null);
    setExporting('assets');
    try {
      await runWithTimeout('Assets-Export', () => {
        exportAssetsToCSV(assets);
      });
      onShowNotification?.('Assets wurden exportiert.', 'success');
      onClose();
    } catch (e: any) {
      const msg = e?.message || 'Export fehlgeschlagen.';
      setError(msg);
      onShowNotification?.(msg, 'error');
    } finally {
      setExporting(null);
    }
  };

  const handleExportLoans = async () => {
    setError(null);
    setExporting('loans');
    try {
      await runWithTimeout('Ausleihen-Export', () => {
        exportLoansToCSV(loans, assets);
      });
      onShowNotification?.('Ausleihen wurden exportiert.', 'success');
      onClose();
    } catch (e: any) {
      const msg = e?.message || 'Export fehlgeschlagen.';
      setError(msg);
      onShowNotification?.(msg, 'error');
    } finally {
      setExporting(null);
    }
  };

  const handleExportMaintenance = async () => {
    setError(null);
    setExporting('maintenance');
    try {
      await runWithTimeout('Wartungen-Export', () => {
        exportMaintenanceToCSV(assets);
      });
      onShowNotification?.('Wartungen wurden exportiert.', 'success');
      onClose();
    } catch (e: any) {
      const msg = e?.message || 'Export fehlgeschlagen.';
      setError(msg);
      onShowNotification?.(msg, 'error');
    } finally {
      setExporting(null);
    }
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
          {error && (
            <div className="p-4 bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-sm font-bold flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="ml-auto p-1 rounded hover:bg-rose-200 dark:hover:bg-rose-800" aria-label="Schließen">×</button>
            </div>
          )}
          <button
            onClick={() => handleExportAssets()}
            disabled={!!exporting}
            className="w-full p-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-wait text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-blue-600/30 transition-all flex items-center justify-between"
          >
            <span>{exporting === 'assets' ? 'Exportiere…' : 'Assets exportieren'}</span>
            <span className="text-sm">({assets.length} Assets)</span>
          </button>

          <button
            onClick={() => handleExportLoans()}
            disabled={!!exporting}
            className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-wait text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-between"
          >
            <span>{exporting === 'loans' ? 'Exportiere…' : 'Ausleihen exportieren'}</span>
            <span className="text-sm">({loans.length} Einträge)</span>
          </button>

          <button
            onClick={() => handleExportMaintenance()}
            disabled={!!exporting}
            className="w-full p-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-wait text-white font-black rounded-2xl uppercase text-xs tracking-widest italic shadow-xl shadow-purple-600/30 transition-all flex items-center justify-between"
          >
            <span>{exporting === 'maintenance' ? 'Exportiere…' : 'Wartungen exportieren'}</span>
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
