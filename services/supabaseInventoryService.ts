import { Asset, User } from '../types';
import { fetchAsset, updateAsset } from './supabaseAssetService';
import { createLoan, findActiveLoan, returnLoan } from './supabaseLoanService';
import { supabase } from '../lib/supabaseClient';

/**
 * Verarbeitet einen QR-Scan: Ausleihe oder Rückgabe
 */
export async function processQRScan(
  qrData: string,
  organizationId: string,
  currentUser: User
): Promise<{ success: boolean; message: string; asset?: Asset }> {
  try {
    // Asset anhand QR-Code finden (direkt, ohne fetchAsset um Performance zu sparen)
    const { data: dbAsset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('qr_string', qrData)
      .eq('organization_id', organizationId)
      .single();

    if (assetError || !dbAsset) {
      return { success: false, message: 'Unbekannter QR-Code!' };
    }

    // Konvertiere DB-Asset zu Asset (ohne Maintenance-Events für Performance)
    // Maintenance-Events werden nur geladen, wenn das Asset-Detail-Modal geöffnet wird
    const { dbAssetToAsset } = await import('../types');
    const asset = dbAssetToAsset(dbAsset, []); // Leere Maintenance-Events für Performance

    if (asset.status === 'available') {
      // AUSLEIHE
      // 1. Asset-Status auf 'loaned' setzen
      const updatedAsset: Asset = {
        ...asset,
        status: 'loaned',
        currentUserId: currentUser.id,
      };
      // Maintenance-Events nicht laden für Performance (werden nur im Detail-Modal benötigt)
      await updateAsset(updatedAsset, organizationId, false);

      // 2. Loan-Record erstellen
      await createLoan(organizationId, asset.id, currentUser.id);

      return {
        success: true,
        message: `${asset.brand} ${asset.model} wurde an Sie ausgeliehen.`,
        asset: updatedAsset,
      };
    } else {
      // RÜCKGABE
      // Prüfen, ob User das Asset hat oder Admin ist
      if (asset.currentUserId !== currentUser.id && currentUser.role !== 'admin') {
        return {
          success: false,
          message: 'Dieses Gerät wird aktuell von jemand anderem genutzt.',
        };
      }

      // 1. Asset-Status auf 'available' setzen
      const updatedAsset: Asset = {
        ...asset,
        status: 'available',
        currentUserId: null,
      };
      // Maintenance-Events nicht laden für Performance (werden nur im Detail-Modal benötigt)
      await updateAsset(updatedAsset, organizationId, false);

      // 2. Aktiven Loan schließen (ohne zusätzliche Query, direkt über asset_id)
      const { data: activeLoanData, error: loanError } = await supabase
        .from('loans')
        .select('id')
        .eq('asset_id', asset.id)
        .is('timestamp_in', null)
        .order('timestamp_out', { ascending: false })
        .limit(1)
        .single();
      
      if (!loanError && activeLoanData) {
        await returnLoan(activeLoanData.id);
      }

      return {
        success: true,
        message: `${asset.brand} ${asset.model} wurde erfolgreich zurückgegeben.`,
        asset: updatedAsset,
      };
    }
  } catch (error: any) {
    console.error('Fehler beim QR-Scan:', error);
    return {
      success: false,
      message: error.message || 'Ein Fehler ist aufgetreten.',
    };
  }
}
