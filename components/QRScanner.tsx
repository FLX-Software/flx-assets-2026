
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (scanMethod === 'camera') {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 15, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
        },
        (errorMessage) => {}
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        scannerRef.current = null;
      }
    };
  }, [onScan, scanMethod]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010409]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#0d1117] rounded-[2.5rem] overflow-hidden relative shadow-[0_20px_60px_rgba(0,145,255,0.4)] border border-slate-200 dark:border-blue-500/20 flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 dark:bg-[#010409] flex justify-between items-center border-b border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(0,145,255,0.8)]"></div>
            <span className="font-black text-white uppercase italic tracking-tighter text-lg">FLX <span className="text-blue-500">Scanner</span></span>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2.5 rounded-2xl text-white hover:bg-rose-600 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 m-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setScanMethod('camera')}
            className={`flex-1 py-3 text-[10px] font-black uppercase italic tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${scanMethod === 'camera' ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Kamera
          </button>
          <button 
            onClick={() => setScanMethod('manual')}
            className={`flex-1 py-3 text-[10px] font-black uppercase italic tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${scanMethod === 'manual' ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Eingabe
          </button>
        </div>

        {/* Scanner Content */}
        <div className="flex-grow flex flex-col min-h-[300px]">
          {scanMethod === 'camera' ? (
            <div className="px-6 pb-6">
              <div id="qr-reader" className="w-full rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800"></div>
              <div className="mt-6 text-center">
                <p className="text-slate-900 dark:text-white font-black uppercase italic tracking-tighter text-lg mb-1">Kamera aktiv</p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">
                  Richten Sie das Fadenkreuz auf den QR-Code am Gerät aus.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="p-8 flex flex-col justify-center flex-grow animate-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Manuelle Identifikation</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Geben Sie den Code vom Asset-Label ein</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Asset QR-String</label>
                  <input 
                    type="text" 
                    autoFocus
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg font-black dark:text-white uppercase placeholder:text-slate-300 dark:placeholder:text-slate-700 italic tracking-tighter"
                    placeholder="Z.B. QR_HILTI_70"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase italic tracking-tighter text-lg border-2 border-white/10"
                >
                  Asset Identifizieren
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-[#010409] border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-400 dark:text-slate-600 text-[9px] font-black uppercase tracking-[0.4em]">FLX Software Assets &bull; Secure Track</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
