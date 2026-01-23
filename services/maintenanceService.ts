
import { Asset } from '../types';

export const getMaintenanceStatus = (asset: Asset) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const checkDeadline = (dateStr?: string) => {
    if (!dateStr) return 'ok';
    const date = new Date(dateStr);
    if (date < now) return 'overdue';
    if (date < thirtyDaysFromNow) return 'warning';
    return 'ok';
  };

  const statusMap = {
    tuev: checkDeadline(asset.nextTuev),
    uvv: checkDeadline(asset.lastUvv ? new Date(new Date(asset.lastUvv).setMonth(new Date(asset.lastUvv).getMonth() + asset.maintenanceIntervalMonths)).toISOString() : undefined),
    maintenance: checkDeadline(asset.nextMaintenance)
  };

  const isCritical = Object.values(statusMap).some(s => s === 'overdue' || s === 'warning');

  return { statusMap, isCritical };
};

/**
 * Simulates a daily cron job that sends emails to admins
 */
export const runDailyMaintenanceCheck = (assets: Asset[]) => {
  const criticalAssets = assets.filter(a => getMaintenanceStatus(a).isCritical);
  
  if (criticalAssets.length > 0) {
    console.log(`--- CRON JOB: MAINTENANCE REMINDER ---`);
    console.log(`Betreff: Achtung! ${criticalAssets.length} Assets benötigen Wartung`);
    criticalAssets.forEach(a => {
      const { statusMap } = getMaintenanceStatus(a);
      console.log(`- ${a.brand} ${a.model} (${a.qrCode}): ${JSON.stringify(statusMap)}`);
    });
    console.log(`--------------------------------------`);
    return true;
  }
  return false;
};
