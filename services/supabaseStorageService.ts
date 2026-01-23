import { supabase } from '../lib/supabaseClient';

const BUCKET_NAME = 'asset-images';

/**
 * Lädt ein Bild in Supabase Storage hoch
 * @param file - Die Bilddatei
 * @param assetId - Die Asset-ID (für eindeutigen Dateinamen)
 * @param organizationId - Die Organisation-ID (für Pfad-Organisation)
 * @returns Die öffentliche URL des hochgeladenen Bildes
 */
export async function uploadAssetImage(
  file: File,
  assetId: string,
  organizationId: string
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  try {
    // Validiere Dateityp
    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'Nur Bilddateien sind erlaubt' };
    }

    // Validiere Dateigröße (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return { url: null, error: 'Bild ist zu groß (max. 5MB)' };
    }

    // Erstelle eindeutigen Dateinamen: orgId/assetId-timestamp.extension
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const fileName = `${organizationId}/${assetId}-${timestamp}.${fileExtension}`;

    // Upload zu Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false, // Nicht überschreiben, neue Datei erstellen
      });

    if (error) {
      console.error('Upload-Fehler:', error);
      return { url: null, error: error.message };
    }

    // Hole öffentliche URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return { url: null, error: 'Konnte URL nicht generieren' };
    }

    return { url: urlData.publicUrl, error: null };
  } catch (error: any) {
    console.error('Unerwarteter Fehler beim Upload:', error);
    return { url: null, error: error.message || 'Upload fehlgeschlagen' };
  }
}

/**
 * Löscht ein Bild aus Supabase Storage
 * @param imageUrl - Die URL des zu löschenden Bildes
 * @returns Erfolg oder Fehler
 */
export async function deleteAssetImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extrahiere Dateinamen aus der URL
    // Format: https://[project].supabase.co/storage/v1/object/public/asset-images/orgId/assetId-timestamp.ext
    const urlParts = imageUrl.split('/');
    const fileName = urlParts.slice(urlParts.indexOf('asset-images') + 1).join('/');

    if (!fileName) {
      return { success: false, error: 'Ungültige Bild-URL' };
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error('Lösch-Fehler:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unerwarteter Fehler beim Löschen:', error);
    return { success: false, error: error.message || 'Löschen fehlgeschlagen' };
  }
}

/**
 * Prüft ob der Storage Bucket existiert
 */
export async function checkBucketExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Fehler beim Prüfen der Buckets:', error);
      return false;
    }
    return data?.some(bucket => bucket.name === BUCKET_NAME) || false;
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    return false;
  }
}
