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
    // Asset anhand QR-Code finden
    const { data: assets, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('qr_string', qrData)
      .eq('organization_id', organizationId)
      .single();

    if (assetError || !assets) {
      return { success: false, message: 'Unbekannter QR-Code!' };
    }

    const asset = await fetchAsset(assets.id);
    if (!asset) {
      return { success: false, message: 'Asset nicht gefunden!' };
    }

    if (asset.status === 'available') {
      // AUSLEIHE
      // 1. Asset-Status auf 'loaned' setzen
      const updatedAsset: Asset = {
        ...asset,
        status: 'loaned',
        currentUserId: currentUser.id,
      };
      await updateAsset(updatedAsset, organizationId);

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
      await updateAsset(updatedAsset, organizationId);

      // 2. Aktiven Loan schließen
      const activeLoan = await findActiveLoan(asset.id);
      if (activeLoan) {
        await returnLoan(activeLoan.id);
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
