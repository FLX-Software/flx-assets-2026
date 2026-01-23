
import { Asset, User, UserRole } from '../types';

/**
 * Handles the logic of scanning a QR code to toggle the state of an asset.
 * If the asset is available, it gets checked out to the current user.
 * If the asset is currently with the user, it gets checked in (returned).
 */
export const processQRScan = (
  qrData: string, 
  assets: Asset[], 
  currentUser: User
): { updatedAssets: Asset[]; message: string; success: boolean } => {
  const assetIndex = assets.findIndex(a => a.qrCode === qrData);
  
  if (assetIndex === -1) {
    return { updatedAssets: assets, message: "Unbekannter QR-Code!", success: false };
  }

  const asset = assets[assetIndex];
  const newAssets = [...assets];

  if (asset.status === 'available') {
    // Checkout process
    newAssets[assetIndex] = {
      ...asset,
      status: 'loaned',
      currentUserId: currentUser.id
    };
    return { 
      updatedAssets: newAssets, 
      message: `${asset.brand} ${asset.model} wurde an Sie ausgeliehen.`, 
      success: true 
    };
  } else {
    // Return process
    if (asset.currentUserId !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      return { 
        updatedAssets: assets, 
        message: `Dieses Gerät wird aktuell von jemand anderem genutzt.`, 
        success: false 
      };
    }
    
    newAssets[assetIndex] = {
      ...asset,
      status: 'available',
      currentUserId: null
    };
    return { 
      updatedAssets: newAssets, 
      message: `${asset.brand} ${asset.model} wurde erfolgreich zurückgegeben.`, 
      success: true 
    };
  }
};
