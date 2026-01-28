/**
 * Bildkompression-Service für bessere Performance
 * Komprimiert Bilder vor Upload/Base64-Konvertierung
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  format: 'jpeg',
};

/**
 * Komprimiert ein Bild-File
 * @param file - Das Original-Bild
 * @param options - Kompressions-Optionen
 * @returns Komprimiertes File oder null bei Fehler
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File | null> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    console.log('🖼️ Komprimiere Bild...', { 
      originalSize: Math.round(file.size / 1024) + 'KB',
      maxWidth: opts.maxWidth,
      quality: opts.quality 
    });

    // Lade Bild in Canvas
    const image = await loadImage(file);
    
    // Berechne neue Dimensionen
    const { width, height } = calculateDimensions(
      image.width,
      image.height,
      opts.maxWidth,
      opts.maxHeight
    );

    // Erstelle Canvas und zeichne komprimiertes Bild
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Konnte Canvas-Context nicht erstellen');
      return null;
    }

    ctx.drawImage(image, 0, 0, width, height);
    if (image.src && image.src.startsWith('blob:')) {
      URL.revokeObjectURL(image.src);
    }

    // Konvertiere zu Blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        `image/${opts.format}`,
        opts.quality
      );
    });

    if (!blob) {
      console.error('❌ Konnte Bild nicht komprimieren');
      return null;
    }

    const compressedFile = new File([blob], file.name, {
      type: `image/${opts.format}`,
      lastModified: Date.now(),
    });

    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    console.log('✅ Bild komprimiert', {
      originalSize: Math.round(file.size / 1024) + 'KB',
      compressedSize: Math.round(compressedFile.size / 1024) + 'KB',
      compressionRatio: compressionRatio + '%',
      dimensions: `${width}x${height}`
    });

    return compressedFile;
  } catch (error) {
    console.error('❌ Fehler bei Bildkompression:', error);
    return null;
  }
}

/**
 * Konvertiert ein File zu Base64 mit Kompression
 */
export async function fileToBase64(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  // Komprimiere zuerst
  const compressed = await compressImage(file, options);
  const fileToConvert = compressed || file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(fileToConvert);
  });
}

/**
 * Lädt ein Bild in ein Image-Element
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

/**
 * Berechnet neue Dimensionen unter Beibehaltung des Seitenverhältnisses
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Skaliere runter wenn zu groß
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Prüft ob ein Bild komprimiert werden sollte
 */
export function shouldCompress(file: File): boolean {
  const MAX_SIZE_FOR_COMPRESSION = 200 * 1024; // 200KB
  return file.size > MAX_SIZE_FOR_COMPRESSION;
}
