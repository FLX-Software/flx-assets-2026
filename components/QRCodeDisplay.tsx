import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  assetName: string;
  brand: string;
  model: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, assetName, brand, model }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  // Sicherstellen, dass value vorhanden ist
  if (!value) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-slate-500 dark:text-slate-400">Kein QR-Code verfügbar</p>
      </div>
    );
  }

  const handleDownload = () => {
    const qrSvgElement = document.querySelector('#qr-code-svg svg') as SVGSVGElement;
    if (!qrSvgElement) return;

    // Konvertiere SVG zu Data URL
    const svgData = new XMLSerializer().serializeToString(qrSvgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Erstelle Canvas für finales Bild
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1000;

    // Weißer Hintergrund
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      const qrSize = 500;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 120;

      // Zeichne QR-Code
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Text hinzufügen
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${brand} ${model}`, canvas.width / 2, 60);

      ctx.font = '20px Inter, sans-serif';
      ctx.fillText(value, canvas.width / 2, qrY + qrSize + 60);

      // Download als PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `QR-${brand}-${model}-${value.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');

      URL.revokeObjectURL(svgUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
  };

  const handlePrint = () => {
    const qrSvgElement = document.querySelector('#qr-code-svg svg') as SVGSVGElement;
    if (!qrSvgElement) {
      console.error('QR-Code SVG nicht gefunden');
      return;
    }

    // Konvertiere SVG zu Data URL
    const svgData = new XMLSerializer().serializeToString(qrSvgElement);
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;

    // Erstelle Canvas für zuverlässigere Bildkonvertierung
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    const img = new Image();
    img.onload = () => {
      // Weißer Hintergrund
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Zeichne QR-Code
      const qrSize = 400;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 150;

      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Text hinzufügen
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${brand} ${model}`, canvas.width / 2, 80);

      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(value, canvas.width / 2, qrY + qrSize + 50);

      // Konvertiere Canvas zu Data URL
      const canvasDataUrl = canvas.toDataURL('image/png');

      // Erstelle temporäres Print-Element im aktuellen Dokument
      const printContainer = document.createElement('div');
      printContainer.style.position = 'fixed';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.innerHTML = `
        <div style="
          text-align: center;
          padding: 40px;
          border: 2px solid #000;
          border-radius: 16px;
          max-width: 600px;
          margin: 0 auto;
          background: white;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <div style="
            font-size: 24px;
            font-weight: 900;
            margin-bottom: 30px;
            text-transform: uppercase;
            color: #000;
          ">${brand} ${model}</div>
          <div style="margin: 20px 0;">
            <img src="${canvasDataUrl}" alt="QR Code" style="width: 400px; height: 400px; display: block; margin: 0 auto;" />
          </div>
          <div style="
            font-size: 18px;
            font-weight: 700;
            margin-top: 30px;
            letter-spacing: 2px;
            color: #000;
          ">${value}</div>
        </div>
      `;

      // Füge Print-Styles hinzu
      const printStyles = document.createElement('style');
      printStyles.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-qr-container,
          .print-qr-container * {
            visibility: visible;
          }
          .print-qr-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
        }
      `;
      document.head.appendChild(printStyles);

      printContainer.className = 'print-qr-container';
      document.body.appendChild(printContainer);

      // Warte kurz, dann drucke
      setTimeout(() => {
        window.print();
        // Aufräumen nach dem Druck
        setTimeout(() => {
          document.body.removeChild(printContainer);
          document.head.removeChild(printStyles);
        }, 100);
      }, 100);
    };

    img.onerror = (error) => {
      console.error('Fehler beim Laden des QR-Code-Bildes:', error);
      alert('Fehler beim Laden des QR-Codes für den Druck. Bitte versuchen Sie es erneut.');
    };

    img.src = svgDataUrl;
  };

  return (
    <div ref={qrRef} className="flex flex-col items-center justify-center py-8">
      <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl mb-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">
            {brand} {model}
          </h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Asset Label
          </p>
        </div>
        
        <div className="flex items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
          <div id="qr-code-svg">
            <QRCodeSVG
              value={value}
              size={300}
              level="H"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-1">
            {value}
          </p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Scan to view details
          </p>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={handleDownload}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl uppercase text-xs tracking-tighter italic shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black rounded-xl uppercase text-xs tracking-tighter italic transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Drucken
        </button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
