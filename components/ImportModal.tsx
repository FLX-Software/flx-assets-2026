import React, { useState, useRef } from 'react';
import { Asset } from '../types';
import { validateCSVImport, generateImportTemplate, ImportResult, ImportError } from '../services/importService';
import { createAsset } from '../services/supabaseAssetService';

interface ImportModalProps {
  onClose: () => void;
  onImportComplete: () => void;
  organizationId: string;
  existingAssets: Asset[];
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImportComplete, organizationId, existingAssets }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Bitte wählen Sie eine CSV-Datei aus.');
      return;
    }

    setSelectedFile(file);

    try {
      setIsImporting(true);
      const result = await validateCSVImport(file, existingAssets);
      setImportResult(result);
      setStep('preview');
    } catch (error: any) {
      console.error('Fehler beim Validieren:', error);
      alert(`Fehler beim Lesen der CSV-Datei: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleStartImport = async () => {
    if (!importResult || importResult.validAssets.length === 0) {
      alert('Keine gültigen Assets zum Importieren gefunden.');
      return;
    }

    setStep('importing');
    setIsImporting(true);
    setImportProgress({ current: 0, total: importResult.validAssets.length });
    setImportStats({ success: 0, failed: 0 });

    const batchSize = 50;
    const batches: Asset[][] = [];
    for (let i = 0; i < importResult.validAssets.length; i += batchSize) {
      batches.push(importResult.validAssets.slice(i, i + batchSize));
    }

    let successCount = 0;
    let failedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      await Promise.all(
        batch.map(async (asset) => {
          try {
            const assetWithOrg: Asset = {
              ...asset,
              organizationId,
            };
            await createAsset(assetWithOrg, organizationId);
            successCount++;
          } catch (error) {
            console.error('Fehler beim Importieren des Assets:', error);
            failedCount++;
          } finally {
            setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
          }
        })
      );
    }

    setImportStats({ success: successCount, failed: failedCount });
    setStep('complete');
    setIsImporting(false);
    onImportComplete();
  };

  const handleDownloadTemplate = (full: boolean) => {
    generateImportTemplate(full);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] italic block mb-1">Daten Import</span>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
              {step === 'upload' && 'CSV-Datei <span className="text-blue-500">hochladen</span>'}
              {step === 'preview' && 'Import <span className="text-blue-500">Vorschau</span>'}
              {step === 'importing' && 'Import <span className="text-blue-500">läuft</span>'}
              {step === 'complete' && 'Import <span className="text-blue-500">abgeschlossen</span>'}
            </h2>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-grow custom-scrollbar">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-4">Template herunterladen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDownloadTemplate(false)}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <div className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase italic mb-1">Minimal-Template</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400">Nur Pflichtfelder</div>
                  </button>
                  <button
                    onClick={() => handleDownloadTemplate(true)}
                    className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
                  >
                    <div className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase italic mb-1">Vollständiges Template</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400">Alle Felder</div>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter mb-4">CSV-Datei auswählen</h3>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {isImporting ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Datei wird validiert...</span>
                    </div>
                  ) : selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedFile.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Klicken Sie erneut, um eine andere Datei auszuwählen</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">CSV-Datei auswählen</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">oder hier klicken</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && importResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase italic mb-1">Gültig</div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{importResult.validAssets.length}</div>
                </div>
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-900">
                  <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase italic mb-1">Fehler</div>
                  <div className="text-2xl font-black text-rose-700 dark:text-rose-300">{importResult.errors.length}</div>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-900">
                  <div className="text-xs font-black text-yellow-600 dark:text-yellow-400 uppercase italic mb-1">Warnungen</div>
                  <div className="text-2xl font-black text-yellow-700 dark:text-yellow-300">{importResult.warnings.length}</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-900">
                  <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase italic mb-2">Fehler:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className="text-xs text-rose-700 dark:text-rose-300">
                        Zeile {error.row}: {error.message}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-xs text-rose-600 dark:text-rose-400 italic">... und {importResult.errors.length - 10} weitere</div>
                    )}
                  </div>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-900">
                  <h4 className="text-xs font-black text-yellow-600 dark:text-yellow-400 uppercase italic mb-2">Warnungen:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResult.warnings.slice(0, 10).map((warning, idx) => (
                      <div key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                        Zeile {warning.row}: {warning.message}
                      </div>
                    ))}
                    {importResult.warnings.length > 10 && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 italic">... und {importResult.warnings.length - 10} weitere</div>
                    )}
                  </div>
                </div>
              )}

              {importResult.validAssets.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase italic mb-3">Vorschau (erste 5 Assets):</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.validAssets.slice(0, 5).map((asset, idx) => (
                      <div key={idx} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {asset.brand} {asset.model} ({asset.qrCode})
                        </div>
                      </div>
                    ))}
                    {importResult.validAssets.length > 5 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic text-center">
                        ... und {importResult.validAssets.length - 5} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase italic">
                  Importiere Assets...
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {importProgress.current} / {importProgress.total}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase italic mb-2">
                  Import abgeschlossen!
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase italic mb-1">Erfolgreich</div>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{importStats.success}</div>
                  </div>
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                    <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase italic mb-1">Fehler</div>
                    <div className="text-2xl font-black text-rose-700 dark:text-rose-300">{importStats.failed}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-[#010409] border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          {step === 'upload' && (
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black text-white font-black rounded-xl uppercase text-xs tracking-tighter italic transition-all"
            >
              Abbrechen
            </button>
          )}
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-xl uppercase text-xs tracking-tighter italic transition-all"
              >
                Zurück
              </button>
              <button
                onClick={handleStartImport}
                disabled={importResult?.validAssets.length === 0}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl uppercase text-xs tracking-tighter italic shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Importieren ({importResult?.validAssets.length || 0})
              </button>
            </>
          )}
          {step === 'complete' && (
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl uppercase text-xs tracking-tighter italic shadow-lg shadow-blue-600/20 transition-all"
            >
              Schließen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
