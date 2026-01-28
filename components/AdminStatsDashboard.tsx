import React from 'react';
import { Asset, LoanRecord, AssetType, AssetTypeLabels } from '../types';
import { getMaintenanceStatus } from '../services/maintenanceService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminStatsDashboardProps {
  assets: Asset[];
  loans: LoanRecord[];
}

const COLORS = {
  blue: '#3b82f6',
  slate: '#64748b',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
};

const AdminStatsDashboard: React.FC<AdminStatsDashboardProps> = ({ assets, loans }) => {
  // Asset-Typ-Verteilung
  const typeDistribution = Object.values(AssetType).map(type => ({
    name: AssetTypeLabels[type],
    value: assets.filter(a => a.type === type).length,
    type
  })).filter(item => item.value > 0);

  // Ausleihstatus-Verteilung: Frei blau, Verliehen gelb, Defekt rot
  const statusDistribution = [
    { name: 'Frei', value: assets.filter(a => a.status === 'available').length, color: COLORS.blue },
    { name: 'Verliehen', value: assets.filter(a => a.status === 'loaned').length, color: COLORS.amber },
    { name: 'Defekt', value: assets.filter(a => a.status === 'defective').length, color: COLORS.rose },
  ];

  // Wartungsstatus
  const maintenanceStats = assets.map(asset => {
    const status = getMaintenanceStatus(asset);
    return {
      asset: `${asset.brand} ${asset.model}`,
      status: status.isCritical ? 'Kritisch' : status.needsMaintenance ? 'Fällig' : 'OK',
      nextMaintenance: asset.nextMaintenance || 'N/A',
      nextTuev: asset.nextTuev || 'N/A',
    };
  }).filter(item => item.status !== 'OK');

  // Ausleihhistorie (letzte 10)
  const recentLoans = loans
    .sort((a, b) => new Date(b.timestampOut).getTime() - new Date(a.timestampOut).getTime())
    .slice(0, 10);

  // Monatliche Ausleihstatistik (letzte 6 Monate)
  const monthlyLoans = React.useMemo(() => {
    const months: { [key: string]: number } = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
      months[monthKey] = 0;
    }

    loans.forEach(loan => {
      const loanDate = new Date(loan.timestampOut);
      const monthKey = loanDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
      if (months.hasOwnProperty(monthKey)) {
        months[monthKey]++;
      }
    });

    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [loans]);

  return (
    <div className="space-y-6 mb-8">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset-Typ-Verteilung */}
        <div className="bg-white dark:bg-[#0d1117] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tighter">
            Assets nach Typ
          </h3>
          {typeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.keys(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              <p className="text-sm">Keine Daten verfügbar</p>
            </div>
          )}
        </div>

        {/* Ausleihstatus */}
        <div className="bg-white dark:bg-[#0d1117] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tighter">
            Ausleihstatus
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monatliche Ausleihstatistik */}
      <div className="bg-white dark:bg-[#0d1117] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tighter">
          Ausleihstatistik (letzte 6 Monate)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyLoans}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Bar dataKey="count" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Wartungsübersicht */}
      <div className="bg-white dark:bg-[#0d1117] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tighter">
          Wartungsübersicht
        </h3>
        {maintenanceStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Asset</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nächste Wartung</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nächster TÜV/AU</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceStats.map((item, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{item.asset}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        item.status === 'Kritisch' 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.nextMaintenance}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.nextTuev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">Alle Assets sind wartungsmäßig in Ordnung</p>
          </div>
        )}
      </div>

      {/* Ausleihhistorie */}
      <div className="bg-white dark:bg-[#0d1117] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tighter">
          Letzte Ausleihen
        </h3>
        {recentLoans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Asset ID</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Benutzer</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ausgeliehen</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Zurückgegeben</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.map((loan) => {
                  const asset = assets.find(a => a.id === loan.assetId);
                  const isReturned = !!loan.timestampIn;
                  return (
                    <tr 
                      key={loan.id} 
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {asset ? `${asset.brand} ${asset.model}` : loan.assetId}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{loan.userName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(loan.timestampOut).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {loan.timestampIn 
                          ? new Date(loan.timestampIn).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          isReturned 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          {isReturned ? 'Zurückgegeben' : 'Aktiv'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">Noch keine Ausleihen vorhanden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStatsDashboard;
