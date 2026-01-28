import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabaseClient';
import { Asset, DBAsset, RepairEntry, DBMaintenanceEvent, assetToDBAsset, dbAssetToAsset } from '../types';

export type FetchAssetsOptions = { loadMaintenance?: boolean };

/**
 * Lädt alle Assets einer Organisation.
 * loadMaintenance: false = kein Laden der maintenance_events (viel schneller für Listen/Übersicht).
 */
export async function fetchAssets(
  organizationId: string,
  options?: FetchAssetsOptions
): Promise<Asset[]> {
  const loadMaintenance = options?.loadMaintenance !== false;
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Assets:', error);
    throw error;
  }

  if (!data) return [];

  if (!loadMaintenance) {
    return data.map((dbAsset: DBAsset) => dbAssetToAsset(dbAsset, []));
  }

  const assetsWithMaintenance = await Promise.all(
    data.map(async (dbAsset: DBAsset) => {
      const maintenanceEvents = await fetchMaintenanceEvents(dbAsset.id);
      return dbAssetToAsset(dbAsset, maintenanceEvents);
    })
  );
  return assetsWithMaintenance;
}

/**
 * Lädt ein einzelnes Asset
 */
export async function fetchAsset(assetId: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (error || !data) {
    console.error('Asset nicht gefunden:', error);
    return null;
  }

  const maintenanceEvents = await fetchMaintenanceEvents(assetId);
  return dbAssetToAsset(data, maintenanceEvents);
}

/**
 * Prüft, ob ein QR-Code bereits global existiert (über alle Organisationen)
 */
export async function checkQRCodeExists(qrCode: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('assets')
    .select('id')
    .eq('qr_string', qrCode)
    .limit(1)
    .single();

  // Wenn Daten gefunden wurden, existiert der QR-Code bereits
  return !error && !!data;
}

/**
 * Generiert einen eindeutigen QR-Code
 */
export async function generateUniqueQRCode(baseQRCode?: string): Promise<string> {
  let qrCode = baseQRCode || `QR_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  let attempts = 0;
  const maxAttempts = 10;

  while (await checkQRCodeExists(qrCode) && attempts < maxAttempts) {
    qrCode = `QR_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    // Fallback: Verwende Timestamp + Random für absolute Eindeutigkeit
    qrCode = `QR_${Date.now()}_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  }

  return qrCode;
}

/**
 * Erstellt ein neues Asset
 */
export async function createAsset(asset: Asset, organizationId: string): Promise<Asset> {
  console.log('💾 createAsset gestartet', { assetId: asset.id, brand: asset.brand, organizationId });
  
  const dbAsset = assetToDBAsset(asset, organizationId);
  console.log('💾 DB-Asset vorbereitet', { id: dbAsset.id, image_url: dbAsset.image_url });

  const { data, error } = await supabase
    .from('assets')
    .insert(dbAsset)
    .select()
    .single();

  if (error || !data) {
    console.error('❌ Fehler beim Erstellen des Assets:', error);
    throw error || new Error('Asset konnte nicht erstellt werden');
  }

  console.log('✅ Asset erfolgreich erstellt', { id: data.id });
  return dbAssetToAsset(data, []);
}

/**
 * Erstellt mehrere Assets auf einmal (Bulk-Insert für bessere Performance)
 */
export async function createAssetsBulk(assets: Asset[], organizationId: string): Promise<{ success: Asset[]; failed: Array<{ asset: Asset; error: string }> }> {
  const startTime = Date.now();
  console.log('💾 createAssetsBulk gestartet', { count: assets.length, organizationId });
  
  try {
    console.log('🔄 Konvertiere Assets zu DB-Format...');
    const dbAssets = assets.map(asset => assetToDBAsset(asset, organizationId));
    console.log('✅ Konvertierung abgeschlossen', { dbAssetsCount: dbAssets.length });
    
    console.log('📤 Sende Bulk-Insert Request an Supabase...');
    const insertStartTime = Date.now();
    
    const { data, error } = await supabase
      .from('assets')
      .insert(dbAssets)
      .select();

    const insertDuration = Date.now() - insertStartTime;
    console.log(`📥 Supabase Response erhalten nach ${insertDuration}ms`, { 
      hasData: !!data, 
      dataLength: data?.length || 0, 
      hasError: !!error 
    });

    if (error) {
      console.error('❌ Fehler beim Bulk-Insert:', error);
      console.log('🔄 Fallback: Versuche Assets einzeln zu erstellen...');
      
      // Falls Bulk-Insert fehlschlägt, versuche Assets einzeln zu erstellen
      const results: { success: Asset[]; failed: Array<{ asset: Asset; error: string }> } = {
        success: [],
        failed: []
      };
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        try {
          console.log(`  📝 Erstelle Asset ${i + 1}/${assets.length}: ${asset.brand} ${asset.model}...`);
          const created = await createAsset(asset, organizationId);
          results.success.push(created);
          console.log(`  ✅ Asset ${i + 1}/${assets.length} erfolgreich`);
        } catch (err: any) {
          console.error(`  ❌ Asset ${i + 1}/${assets.length} fehlgeschlagen:`, err);
          results.failed.push({ asset, error: err.message || 'Unbekannter Fehler' });
        }
      }
      
      const totalDuration = Date.now() - startTime;
      console.log(`💾 createAssetsBulk abgeschlossen (Fallback) nach ${totalDuration}ms`, {
        success: results.success.length,
        failed: results.failed.length
      });
      
      return results;
    }

    if (!data || data.length === 0) {
      console.error('❌ Keine Assets zurückgegeben');
      const totalDuration = Date.now() - startTime;
      console.log(`💾 createAssetsBulk abgeschlossen nach ${totalDuration}ms (keine Daten)`);
      return { success: [], failed: assets.map(a => ({ asset: a, error: 'Keine Daten zurückgegeben' })) };
    }

    console.log('🔄 Konvertiere DB-Assets zurück zu Asset-Format...');
    const successAssets = data.map(dbAsset => dbAssetToAsset(dbAsset, []));
    
    const totalDuration = Date.now() - startTime;
    console.log('✅ Bulk-Insert erfolgreich', { 
      count: successAssets.length,
      duration: `${totalDuration}ms`
    });
    
    return {
      success: successAssets,
      failed: []
    };
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ Unerwarteter Fehler in createAssetsBulk nach ${totalDuration}ms:`, error);
    throw error;
  }
}

/**
 * Aktualisiert ein Asset
 * @param loadMaintenanceEvents - Wenn false, werden Maintenance-Events nicht geladen (für Performance)
 */
export async function updateAsset(
  asset: Asset, 
  organizationId: string, 
  loadMaintenanceEvents: boolean = true
): Promise<Asset> {
  console.log('💾 updateAsset gestartet', { assetId: asset.id, brand: asset.brand, organizationId });
  
  const dbAsset = assetToDBAsset(asset, organizationId);
  const { id, ...updateData } = dbAsset;
  
  console.log('💾 DB-Asset vorbereitet', { id, updateFields: Object.keys(updateData).length });

  const { data, error } = await supabase
    .from('assets')
    .update(updateData)
    .eq('id', asset.id)
    .select()
    .single();

  if (error || !data) {
    console.error('❌ Fehler beim Aktualisieren des Assets:', error);
    throw error || new Error('Asset konnte nicht aktualisiert werden');
  }

  console.log('✅ Asset erfolgreich aktualisiert', { id: data.id });

  // Maintenance-Events nur laden, wenn explizit gewünscht (für Performance)
  const maintenanceEvents = loadMaintenanceEvents 
    ? await fetchMaintenanceEvents(asset.id) 
    : [];
  return dbAssetToAsset(data, maintenanceEvents);
}

/**
 * Aktualisiert nur die Bild-URL eines Assets (minimaler Payload).
 * Nutzt fetch() statt Supabase-Client, um hängende Verbindungen beim 2. Upload zu vermeiden.
 */
export async function updateAssetImageUrl(
  assetId: string,
  organizationId: string,
  imageUrl: string
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? supabaseAnonKey;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/assets?id=eq.${encodeURIComponent(assetId)}&organization_id=eq.${encodeURIComponent(organizationId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Fehler beim Aktualisieren der Bild-URL:', res.status, err);
    throw new Error(err || `Update fehlgeschlagen (${res.status})`);
  }
}

/**
 * Löscht ein Asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    console.error('Fehler beim Löschen des Assets:', error);
    throw error;
  }
}

/**
 * Lädt Maintenance-Events für ein Asset
 */
export async function fetchMaintenanceEvents(assetId: string): Promise<RepairEntry[]> {
  const { data, error } = await supabase
    .from('maintenance_events')
    .select('*')
    .eq('asset_id', assetId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Maintenance-Events:', error);
    return [];
  }

  if (!data) return [];

  return data.map((event: DBMaintenanceEvent) => ({
    id: event.id,
    date: event.date,
    description: event.description,
    performer: event.performer,
    cost: event.cost || undefined,
  }));
}

/**
 * Erstellt ein Maintenance-Event
 */
export async function createMaintenanceEvent(
  assetId: string,
  organizationId: string,
  event: Omit<RepairEntry, 'id'>
): Promise<RepairEntry> {
  const { data, error } = await supabase
    .from('maintenance_events')
    .insert({
      asset_id: assetId,
      organization_id: organizationId,
      date: event.date,
      description: event.description,
      performer: event.performer,
      cost: event.cost || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Fehler beim Erstellen des Maintenance-Events:', error);
    throw error || new Error('Maintenance-Event konnte nicht erstellt werden');
  }

  return {
    id: data.id,
    date: data.date,
    description: data.description,
    performer: data.performer,
    cost: data.cost || undefined,
  };
}

/**
 * Aktualisiert ein Maintenance-Event
 */
export async function updateMaintenanceEvent(
  eventId: string,
  event: Partial<RepairEntry>
): Promise<RepairEntry> {
  const { data, error } = await supabase
    .from('maintenance_events')
    .update({
      date: event.date,
      description: event.description,
      performer: event.performer,
      cost: event.cost || null,
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error || !data) {
    console.error('Fehler beim Aktualisieren des Maintenance-Events:', error);
    throw error || new Error('Maintenance-Event konnte nicht aktualisiert werden');
  }

  return {
    id: data.id,
    date: data.date,
    description: data.description,
    performer: data.performer,
    cost: data.cost || undefined,
  };
}

/**
 * Löscht ein Maintenance-Event
 */
export async function deleteMaintenanceEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Fehler beim Löschen des Maintenance-Events:', error);
    throw error;
  }
}
