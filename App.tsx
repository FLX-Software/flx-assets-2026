
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Asset, LoanRecord } from './types';
import { MOCK_USERS, INITIAL_ASSETS, INITIAL_LOAN_HISTORY } from './constants';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';
import QRScanner from './components/QRScanner';
import AssetDetailModal from './components/AssetDetailModal';
import AssetCreateModal from './components/AssetCreateModal';
import UserManagementModal from './components/UserManagementModal';
import Login from './components/Login';
import { processQRScan } from './services/inventoryService';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [history, setHistory] = useState<LoanRecord[]>(INITIAL_LOAN_HISTORY);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('flx_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    const savedAssets = localStorage.getItem('flx_assets');
    const savedHistory = localStorage.getItem('flx_history');
    const savedUsers = localStorage.getItem('flx_users');
    const savedUserId = localStorage.getItem('flx_auth_user_id');

    const currentUsers = savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    setUsers(currentUsers);

    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    if (savedUserId) {
      const syncedUser = currentUsers.find((u: User) => u.id === savedUserId);
      if (syncedUser) setCurrentUser(syncedUser);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('flx_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('flx_theme', 'light');
    }
  }, [isDarkMode]);

  const persistData = (newAssets: Asset[], newHistory: LoanRecord[], newUsers?: User[]) => {
    setAssets(newAssets);
    setHistory(newHistory);
    localStorage.setItem('flx_assets', JSON.stringify(newAssets));
    localStorage.setItem('flx_history', JSON.stringify(newHistory));
    if (newUsers) {
      setUsers(newUsers);
      localStorage.setItem('flx_users', JSON.stringify(newUsers));
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('flx_auth_user_id', user.id);
    showNotification(`Willkommen zurück, ${user.firstName}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('flx_auth_user_id');
    showNotification(`Auf Wiedersehen!`, 'success');
  };

  const handleQRScan = useCallback((decodedText: string) => {
    if (!currentUser) return;
    const assetIndex = assets.findIndex(a => a.qrCode === decodedText);
    const result = processQRScan(decodedText, assets, currentUser);
    
    if (result.success) {
      const updatedAssets = result.updatedAssets;
      const asset = assets[assetIndex];
      let updatedHistory = [...history];

      if (asset.status === 'available') {
        const newRecord: LoanRecord = {
          id: `l-${Date.now()}`,
          assetId: asset.id,
          userId: currentUser.id,
          userName: currentUser.name,
          timestampOut: new Date().toISOString()
        };
        updatedHistory.push(newRecord);
      } else {
        const recordIndex = updatedHistory.findIndex(h => h.assetId === asset.id && !h.timestampIn);
        if (recordIndex !== -1) {
          updatedHistory[recordIndex] = {
            ...updatedHistory[recordIndex],
            timestampIn: new Date().toISOString()
          };
        }
      }

      persistData(updatedAssets, updatedHistory);
      showNotification(result.message, 'success');
      
      // Update the selected asset in modal if it's open
      if (selectedAsset && selectedAsset.id === asset.id) {
        setSelectedAsset(updatedAssets[assetIndex]);
      }
    } else {
      showNotification(result.message, 'error');
    }
    setIsScannerOpen(false);
  }, [assets, history, currentUser, selectedAsset]);

  const handleReturnAsset = (asset: Asset) => {
    handleQRScan(asset.qrCode);
  };

  const handleSaveAsset = (updatedAsset: Asset) => {
    const newAssets = assets.map(a => a.id === updatedAsset.id ? updatedAsset : a);
    persistData(newAssets, history);
    setSelectedAsset(updatedAsset);
    showNotification("Asset-Daten wurden aktualisiert.", 'success');
  };

  const handleCreateAsset = (newAsset: Asset) => {
    const newAssets = [...assets, newAsset];
    persistData(newAssets, history);
    setIsCreateModalOpen(false);
    showNotification(`Neues Asset "${newAsset.brand} ${newAsset.model}" wurde angelegt.`, 'success');
  };

  const handleDeleteAsset = (assetId: string) => {
    const assetToDelete = assets.find(a => a.id === assetId);
    const newAssets = assets.filter(a => a.id !== assetId);
    const newHistory = history.filter(h => h.assetId !== assetId);
    
    persistData(newAssets, newHistory);
    setSelectedAsset(null);
    showNotification(`Asset "${assetToDelete?.brand} ${assetToDelete?.model}" wurde gelöscht.`, 'success');
  };

  const handleUpdateUsers = (newUsers: User[]) => {
    persistData(assets, history, newUsers);
    if (currentUser) {
      const stillExists = newUsers.find(u => u.id === currentUser.id);
      if (!stillExists) {
        handleLogout();
      } else {
        setCurrentUser(stillExists);
      }
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-[#010409] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation / Header */}
      <nav className="bg-[#010409] text-white p-4 sticky top-0 z-30 shadow-2xl border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#000510] rounded-xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(0,145,255,0.2)] border border-blue-500/10">
               <span className="font-black text-lg italic tracking-tighter leading-none text-[#0091FF]">FLX</span>
               <span className="text-[5px] font-bold text-[#0091FF] tracking-[0.1em] mt-0.5 uppercase">Software</span>
            </div>
            <div className="flex flex-col hidden xs:flex">
              <span className="font-black text-xl sm:text-2xl tracking-tighter uppercase leading-none italic">
                FLX-<span className="text-blue-500">ASSETS</span>
              </span>
              <span className="text-[9px] tracking-[0.3em] font-black text-blue-500/40 uppercase">Inventory OS</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <button 
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl border border-blue-400/30 shadow-lg shadow-blue-600/20 transition-all active:scale-95 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-xs font-black uppercase italic tracking-tighter hidden xs:inline">Scan</span>
            </button>

            <div className="h-8 w-px bg-white/10 mx-1"></div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black uppercase italic tracking-tighter leading-none">{currentUser.name}</p>
                <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">{currentUser.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all"
                title="Abmelden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        {notification && (
          <div className={`fixed top-24 right-4 left-4 z-50 p-4 rounded-xl shadow-2xl shadow-blue-500/20 transform transition-all border animate-in slide-in-from-top duration-300 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'}`}>
            <div className="flex items-center gap-3 font-bold">
              {notification.type === 'success' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              )}
              {notification.message}
            </div>
          </div>
        )}

        {currentUser.role === UserRole.ADMIN ? (
          <AdminDashboard 
            assets={assets} 
            users={users} 
            onShowDetails={setSelectedAsset} 
            onAddAsset={() => setIsCreateModalOpen(true)}
            onManageUsers={() => setIsUserMgmtOpen(true)}
          />
        ) : (
          <StaffDashboard 
            assets={assets} 
            currentUser={currentUser} 
            onReturnAsset={handleReturnAsset}
            onStartScan={() => setIsScannerOpen(true)}
            onShowDetails={setSelectedAsset}
          />
        )}
      </main>

      {isScannerOpen && (
        <QRScanner onScan={handleQRScan} onClose={() => setIsScannerOpen(false)} />
      )}

      {isCreateModalOpen && (
        <AssetCreateModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSave={handleCreateAsset} 
        />
      )}

      {isUserMgmtOpen && (
        <UserManagementModal 
          users={users}
          onClose={() => setIsUserMgmtOpen(false)}
          onUpdateUsers={handleUpdateUsers}
          onShowNotification={showNotification}
        />
      )}

      {selectedAsset && (
        <AssetDetailModal 
          asset={selectedAsset} 
          history={history}
          onClose={() => setSelectedAsset(null)} 
          onSave={handleSaveAsset}
          onDelete={handleDeleteAsset}
          onReturn={handleReturnAsset}
          isAdmin={currentUser.role === UserRole.ADMIN}
        />
      )}
    </div>
  );
};

export default App;
