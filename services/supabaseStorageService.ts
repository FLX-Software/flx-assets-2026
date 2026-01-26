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
  organizationId: string,
  abortSignal?: AbortSignal
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  let heartbeatInterval: NodeJS.Timeout | null = null;
  
  try {
    console.log('📤 uploadAssetImage gestartet', { fileName: file.name, size: file.size, assetId, organizationId });
    
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

    console.log('📤 Upload zu Supabase Storage...', { bucket: BUCKET_NAME, fileName, fileSize: file.size });

    // Prüfe Auth-Session vor Upload
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('⚠️ Keine aktive Session, versuche Session zu erneuern...');
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !newSession) {
        console.error('❌ Konnte Session nicht erneuern:', refreshError);
        return { url: null, error: 'Keine gültige Session. Bitte melden Sie sich erneut an.' };
      }
      console.log('✅ Session erneuert');
    }

    const uploadStartTime = Date.now();
    
    // Upload zu Supabase Storage mit Timeout-Überwachung
    // Verwende eine neue File-Instanz um sicherzustellen, dass das File-Objekt frisch ist
    const fileBlob = new Blob([file], { type: file.type });
    const freshFile = new File([fileBlob], file.name, { type: file.type, lastModified: Date.now() });
    
    const uploadPromise = supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, freshFile, {
        cacheControl: '3600',
        upsert: false, // Nicht überschreiben, neue Datei erstellen
        contentType: file.type, // Explizit Content-Type setzen
      });

    // Überwache den Upload mit einem Heartbeat
    heartbeatInterval = setInterval(() => {
      if (abortSignal?.aborted) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        return;
      }
      const elapsed = Date.now() - uploadStartTime;
      console.log(`⏳ Upload läuft noch... (${Math.round(elapsed / 1000)}s)`);
    }, 10000); // Alle 10 Sekunden loggen

    // Prüfe auf Abort-Signal
    if (abortSignal?.aborted) {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      return { url: null, error: 'Upload abgebrochen' };
    }

    try {
      const { data, error } = await uploadPromise;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      
      // Prüfe erneut auf Abort nach dem Upload
      if (abortSignal?.aborted) {
        return { url: null, error: 'Upload abgebrochen' };
      }
      
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`✅ Upload abgeschlossen in ${Math.round(uploadDuration / 1000)}s`);

      if (error) {
        console.error('❌ Upload-Fehler:', error);
        return { url: null, error: error.message || 'Upload fehlgeschlagen' };
      }
    } catch (uploadError: any) {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      console.error('❌ Upload-Exception:', uploadError);
      return { url: null, error: uploadError.message || 'Upload fehlgeschlagen' };
    }

    console.log('✅ Upload erfolgreich, hole öffentliche URL...');

    // Hole öffentliche URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      console.error('❌ Konnte URL nicht generieren');
      return { url: null, error: 'Konnte URL nicht generieren' };
    }

    console.log('✅ Upload komplett, URL:', urlData.publicUrl);
    return { url: urlData.publicUrl, error: null };
  } catch (error: any) {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    console.error('❌ Unerwarteter Fehler beim Upload:', error);
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
