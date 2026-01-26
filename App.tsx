
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Asset, LoanRecord, Organization } from './types';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';
import QRScanner from './components/QRScanner';
import AssetDetailModal from './components/AssetDetailModal';
import AssetCreateModal from './components/AssetCreateModal';
import UserManagementModal from './components/UserManagementModal';
import OrganizationManagementModal from './components/OrganizationManagementModal';
import Login from './components/Login';
import { processQRScan } from './services/supabaseInventoryService';
import { getCurrentUser, signOut, onAuthStateChange, loadUserWithOrganizations } from './services/supabaseAuthService';
import { fetchAssets, createAsset, updateAsset, deleteAsset } from './services/supabaseAssetService';
import { deleteAssetImage } from './services/supabaseStorageService';
import { fetchLoans } from './services/supabaseLoanService';
import { fetchOrganizationMembers, fetchUserOrganizations, fetchAllOrganizations } from './services/supabaseOrganizationService';

const App: React.FC = () => {
  console.log('🔵 App component rendering...');
  
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<LoanRecord[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [isOrgMgmtOpen, setIsOrgMgmtOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('flx_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  // Auth-State-Listener: Auto-Login nach Reload
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadData(user);
      } else {
        setCurrentUser(null);
        setAssets([]);
        setHistory([]);
        setUsers([]);
      }
      setIsLoading(false);
    });

    // Initial-Check
    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        loadData(user);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Daten laden (Assets, Loans, Users)
  const loadData = async (user: User) => {
    if (!user.organizationId) {
      showNotification('Keine Organisation zugeordnet.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const [assetsData, loansData, membersData] = await Promise.all([
        fetchAssets(user.organizationId),
        fetchLoans(user.organizationId),
        fetchOrganizationMembers(user.organizationId),
      ]);

      setAssets(assetsData);
      setHistory(loansData);
      setUsers(membersData);
    } catch (error: any) {
      console.error('Fehler beim Laden der Daten:', error);
      showNotification('Fehler beim Laden der Daten.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('flx_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('flx_theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    await loadData(user);
    
    // Lade verfügbare Organisationen (für Super-Admin oder User mit mehreren Orgs)
    if (user.role === UserRole.SUPER_ADMIN) {
      try {
        const allOrgs = await fetchAllOrganizations();
        setAvailableOrganizations(allOrgs);
      } catch (error) {
        console.error('Fehler beim Laden aller Organisationen:', error);
      }
    } else {
      try {
        const userOrgs = await fetchUserOrganizations(user.id);
        // Nur Organisationen, in denen User Admin ist
        const adminOrgs = userOrgs.filter(org => {
          // Prüfe ob User Admin in dieser Org ist
          return true; // Vereinfacht: Alle Orgs des Users
        });
        setAvailableOrganizations(adminOrgs);
      } catch (error) {
        console.error('Fehler beim Laden der User-Organisationen:', error);
      }
    }
    
    showNotification(`Willkommen zurück, ${user.firstName}!`, 'success');
  };

  const handleSwitchOrganization = async (orgId: string) => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const user = await loadUserWithOrganizations(currentUser.id, orgId);
      if (user) {
        setCurrentUser(user);
        await loadData(user);
        setIsOrgDropdownOpen(false);
        showNotification(`Zu ${user.organizationName} gewechselt`, 'success');
      }
    } catch (error: any) {
      console.error('Fehler beim Wechseln der Organisation:', error);
      showNotification('Fehler beim Wechseln der Organisation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    setAssets([]);
    setHistory([]);
    setUsers([]);
    showNotification(`Auf Wiedersehen!`, 'success');
  };

  const handleQRScan = useCallback(async (decodedText: string) => {
    if (!currentUser || !currentUser.organizationId) return;
    
    try {
      setIsLoading(true);
      const result = await processQRScan(decodedText, currentUser.organizationId, currentUser);
      
      if (result.success && result.asset) {
        // OPTIMISTIC UPDATE: Aktualisiere Asset lokal statt alles neu zu laden
        setAssets(prevAssets => 
          prevAssets.map(asset => 
            asset.id === result.asset!.id ? result.asset! : asset
          )
        );
        
        // Update selected asset if modal is open
        if (selectedAsset && selectedAsset.id === result.asset.id) {
          setSelectedAsset(result.asset);
        }
        
        // History nur aktualisieren, wenn ein Loan erstellt/aktualisiert wurde
        // Lade nur den neuen/aktualisierten Loan, nicht die gesamte History
        if (result.asset.status === 'loaned' || result.asset.status === 'available') {
          // Für Rückgabe: Finde den aktualisierten Loan
          // Für Ausleihe: Der neue Loan wurde bereits erstellt, lade ihn separat
          try {
            const { fetchLoans } = await import('./services/supabaseLoanService');
            const latestLoans = await fetchLoans(currentUser.organizationId);
            // Aktualisiere nur die ersten 10 neuesten Loans (für Performance)
            setHistory(prevHistory => {
              const existingIds = new Set(prevHistory.map(l => l.id));
              const newLoans = latestLoans.filter(l => !existingIds.has(l.id));
              return [...newLoans, ...prevHistory].slice(0, 50); // Max 50 Einträge
            });
          } catch (historyError) {
            console.warn('Fehler beim Aktualisieren der History:', historyError);
            // Ignoriere History-Fehler, Asset-Update war erfolgreich
          }
        }
        
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error: any) {
      console.error('Fehler beim QR-Scan:', error);
      showNotification(error.message || 'Ein Fehler ist aufgetreten.', 'error');
    } finally {
      setIsLoading(false);
      setIsScannerOpen(false);
    }
  }, [currentUser, selectedAsset]);

  const handleReturnAsset = async (asset: Asset) => {
    await handleQRScan(asset.qrCode);
  };

  const handleSaveAsset = async (updatedAsset: Asset) => {
    if (!currentUser?.organizationId) return;
    
    try {
      setIsLoading(true);
      await updateAsset(updatedAsset, currentUser.organizationId);
      
      // Assets neu laden
      const updatedAssets = await fetchAssets(currentUser.organizationId);
      setAssets(updatedAssets);
      setSelectedAsset(updatedAsset);
      showNotification("Asset-Daten wurden aktualisiert.", 'success');
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error);
      showNotification(error.message || 'Fehler beim Speichern.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAsset = async (newAsset: Asset) => {
    if (!currentUser?.organizationId) return;
    
    try {
      setIsLoading(true);
      console.log('💾 Erstelle Asset in Supabase...', { id: newAsset.id, brand: newAsset.brand });
      
      await createAsset(newAsset, currentUser.organizationId);
      
      console.log('✅ Asset erstellt, lade Assets neu...');
      
      // Assets neu laden
      const updatedAssets = await fetchAssets(currentUser.organizationId);
      setAssets(updatedAssets);
      setIsCreateModalOpen(false);
      showNotification(`Neues Asset "${newAsset.brand} ${newAsset.model}" wurde angelegt.`, 'success');
    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen:', error);
      showNotification(error.message || 'Fehler beim Erstellen.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!currentUser?.organizationId) return;
    
    const assetToDelete = assets.find(a => a.id === assetId);
    
    try {
      setIsLoading(true);
      
      // Lösche Bild aus Storage (falls vorhanden)
      if (assetToDelete?.imageUrl && assetToDelete.imageUrl.includes('supabase.co/storage')) {
        try {
          await deleteAssetImage(assetToDelete.imageUrl);
        } catch (imageError) {
          console.warn('Fehler beim Löschen des Bildes:', imageError);
          // Weiter mit Asset-Löschung auch wenn Bild-Löschung fehlschlägt
        }
      }
      
      await deleteAsset(assetId);
      
      // Assets neu laden
      const updatedAssets = await fetchAssets(currentUser.organizationId);
      setAssets(updatedAssets);
      setSelectedAsset(null);
      showNotification(`Asset "${assetToDelete?.brand} ${assetToDelete?.model}" wurde gelöscht.`, 'success');
    } catch (error: any) {
      console.error('Fehler beim Löschen:', error);
      showNotification(error.message || 'Fehler beim Löschen.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsers = async (newUsers: User[]) => {
    // Lade aktuelle Users aus Supabase neu
    if (currentUser?.organizationId) {
      try {
        const updatedUsers = await fetchOrganizationMembers(currentUser.organizationId);
        setUsers(updatedUsers);
        
        // Prüfe ob aktueller User noch existiert
        if (currentUser) {
          const stillExists = updatedUsers.find(u => u.id === currentUser.id);
          if (!stillExists) {
            handleLogout();
          } else {
            setCurrentUser(stillExists);
          }
        }
      } catch (error: any) {
        console.error('Fehler beim Aktualisieren der User-Liste:', error);
        // Fallback: Verwende die übergebenen Users
        setUsers(newUsers);
      }
    } else {
      setUsers(newUsers);
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Schließe Organisation-Dropdown beim Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOrgDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.org-dropdown-container')) {
          setIsOrgDropdownOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOrgDropdownOpen]);

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#010409]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-bold">Lade...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-[#010409] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation / Header */}
      <nav className="bg-[#010409] text-white p-4 sticky top-0 z-30 shadow-2xl border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-black text-xl sm:text-2xl tracking-tighter uppercase leading-none italic">
                FLX-<span className="text-blue-500">ASSETS</span>
              </span>
              {currentUser.organizationName && (
                <span className="text-xs sm:text-sm font-black text-white uppercase italic tracking-tighter border-l-2 border-blue-500/40 pl-2.5 ml-1">
                  {currentUser.organizationName}
                </span>
              )}
            </div>
            <span className="text-[9px] tracking-[0.3em] font-black text-blue-500/40 uppercase">Alles im Griff</span>
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
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white px-3 py-2 rounded-xl border border-blue-400/30 shadow-lg shadow-blue-600/20 transition-all active:scale-95 group disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-xs font-black uppercase italic tracking-tighter hidden xs:inline">Scan</span>
            </button>

            <div className="h-8 w-px bg-white/10 mx-1"></div>

            {/* Organisation-Dropdown (nur wenn mehrere Organisationen verfügbar) */}
            {availableOrganizations.length > 1 && (
              <div className="relative org-dropdown-container">
                <button
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-bold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="hidden sm:inline max-w-[150px] truncate">{currentUser.organizationName || 'Organisation'}</span>
                  <svg className={`w-4 h-4 transition-transform ${isOrgDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isOrgDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0d1117] border border-blue-500/20 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2">
                      {availableOrganizations.map(org => (
                        <button
                          key={org.id}
                          onClick={() => handleSwitchOrganization(org.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                            org.id === currentUser.organizationId
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-white/10 text-white'
                          }`}
                        >
                          <p className="font-black text-sm uppercase italic">{org.name}</p>
                          {org.id === currentUser.organizationId && (
                            <p className="text-xs text-blue-200 mt-0.5">Aktuell</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black uppercase italic tracking-tighter leading-none">{currentUser.name}</p>
                <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">
                  {currentUser.role === UserRole.SUPER_ADMIN ? 'Super-Admin' : currentUser.role === UserRole.ADMIN ? 'Admin' : 'Mitarbeiter'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                disabled={isLoading}
                className="p-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                title="Abmelden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        {isLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Lade...</p>
            </div>
          </div>
        )}

        {notification && (
          <div className={`fixed top-24 right-4 left-4 z-[100] p-4 rounded-xl shadow-2xl shadow-blue-500/20 transform transition-all border animate-in slide-in-from-top duration-300 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 font-bold flex-1">
                {notification.type === 'success' ? (
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                )}
                <span className="flex-1">{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Benachrichtigung schließen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN) ? (
          <AdminDashboard 
            assets={assets} 
            users={users}
            loans={history}
            onShowDetails={setSelectedAsset} 
            onAddAsset={() => setIsCreateModalOpen(true)}
            onManageUsers={() => setIsUserMgmtOpen(true)}
            onManageOrganizations={currentUser.role === UserRole.SUPER_ADMIN ? () => setIsOrgMgmtOpen(true) : undefined}
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
          organizationId={currentUser.organizationId || ''}
        />
      )}

      {isUserMgmtOpen && (
        <UserManagementModal 
          users={users}
          organizationId={currentUser.organizationId || ''}
          onClose={() => setIsUserMgmtOpen(false)}
          onUpdateUsers={handleUpdateUsers}
          onShowNotification={showNotification}
        />
      )}

      {isOrgMgmtOpen && (
        <OrganizationManagementModal 
          onClose={() => setIsOrgMgmtOpen(false)}
          onShowNotification={showNotification}
          onOrganizationCreated={async (org) => {
            // Lade verfügbare Organisationen neu
            if (currentUser?.role === UserRole.SUPER_ADMIN) {
              const allOrgs = await fetchAllOrganizations();
              setAvailableOrganizations(allOrgs);
            }
          }}
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
          isAdmin={currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN}
          organizationId={currentUser.organizationId || ''}
        />
      )}
    </div>
  );
};

export default App;
