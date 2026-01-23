import { supabase } from '../lib/supabaseClient';
import { Asset, DBAsset, RepairEntry, DBMaintenanceEvent, assetToDBAsset, dbAssetToAsset } from '../types';

/**
 * Lädt alle Assets einer Organisation
 */
export async function fetchAssets(organizationId: string): Promise<Asset[]> {
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

  // Für jedes Asset die Maintenance-Events laden
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
 * Erstellt ein neues Asset
 */
export async function createAsset(asset: Asset, organizationId: string): Promise<Asset> {
  const dbAsset = assetToDBAsset(asset, organizationId);

  const { data, error } = await supabase
    .from('assets')
    .insert(dbAsset)
    .select()
    .single();

  if (error || !data) {
    console.error('Fehler beim Erstellen des Assets:', error);
    throw error || new Error('Asset konnte nicht erstellt werden');
  }

  return dbAssetToAsset(data, []);
}

/**
 * Aktualisiert ein Asset
 */
export async function updateAsset(asset: Asset, organizationId: string): Promise<Asset> {
  const dbAsset = assetToDBAsset(asset, organizationId);
  const { id, ...updateData } = dbAsset;

  const { data, error } = await supabase
    .from('assets')
    .update(updateData)
    .eq('id', asset.id)
    .select()
    .single();

  if (error || !data) {
    console.error('Fehler beim Aktualisieren des Assets:', error);
    throw error || new Error('Asset konnte nicht aktualisiert werden');
  }

  const maintenanceEvents = await fetchMaintenanceEvents(asset.id);
  return dbAssetToAsset(data, maintenanceEvents);
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
