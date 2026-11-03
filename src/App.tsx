import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { PosTab } from './components/pos/PosTab';
import { PurchasingTab } from './components/purchasing/PurchasingTab';
import { ProductsTab } from './components/products/ProductsTab';
import { MaterialsTab } from './components/materials/MaterialsTab';
import { AdjustmentTab } from './components/adjustment/AdjustmentTab';
import { FinanceTab } from './components/finance/FinanceTab';
import { HistoryTab } from './components/history/HistoryTab';
import { ImportExportTab } from './components/import-export/ImportExportTab';
import { AccountSettingsTab } from './components/settings/AccountSettingsTab';
import { GasSyncModal } from './components/settings/GasSyncModal';
import { VercelDeployModal } from './components/settings/VercelDeployModal';
import { AccountSettingsModal } from './components/settings/AccountSettingsModal';
import { AccountSwitcherModal } from './components/auth/AccountSwitcherModal';
import { LoginPage } from './components/auth/LoginPage';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useERP();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGasModal, setShowGasModal] = useState(false);
  const [showVercelModal, setShowVercelModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [showAccountSwitcherModal, setShowAccountSwitcherModal] = useState(false);

  // If user is not authenticated, render the mandatory Login Wall
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Enforce tab access permissions whenever user role or active tab changes
  useEffect(() => {
    // Non-owner cannot access settings tab
    if (currentUser.role !== 'OWNER' && activeTab === 'settings') {
      setActiveTab('dashboard');
    }
    // Staff and supervisor cannot access finance or import tabs
    const isStaffOrSupervisor = currentUser.role === 'STAFF' || currentUser.role === 'SUPERVISOR';
    if (isStaffOrSupervisor && (activeTab === 'finance' || activeTab === 'import')) {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, activeTab]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenGoogleSheetSettings={() => setShowGasModal(true)}
        onOpenAccountSettings={() => setShowAccountSettingsModal(true)}
        onOpenAccountSwitcher={() => setShowAccountSwitcherModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenGoogleSheetSettings={() => setShowGasModal(true)}
          onOpenVercelGuide={() => setShowVercelModal(true)}
          onOpenAccountSwitcher={() => setShowAccountSwitcherModal(true)}
          onSwitchTab={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardTab onSwitchTab={setActiveTab} />}
            {activeTab === 'pos' && <PosTab />}
            {activeTab === 'purchasing' && <PurchasingTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'materials' && <MaterialsTab onSwitchTab={setActiveTab} />}
            {activeTab === 'adjustment' && <AdjustmentTab />}
            {activeTab === 'finance' && currentUser.role !== 'STAFF' && currentUser.role !== 'SUPERVISOR' && (
              <FinanceTab />
            )}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'import' && currentUser.role !== 'STAFF' && currentUser.role !== 'SUPERVISOR' && (
              <ImportExportTab onOpenGoogleSheetSettings={() => setShowGasModal(true)} />
            )}
            {activeTab === 'settings' && (
              <AccountSettingsTab onSwitchTab={setActiveTab} />
            )}
          </div>
        </main>
      </div>

      {/* Google Sheets Modal */}
      {showGasModal && <GasSyncModal onClose={() => setShowGasModal(false)} />}

      {/* Vercel Deploy Guide Modal */}
      {showVercelModal && <VercelDeployModal onClose={() => setShowVercelModal(false)} />}

      {/* Account Settings Modal (Exclusive for OWNER) */}
      {showAccountSettingsModal && (
        <AccountSettingsModal onClose={() => setShowAccountSettingsModal(false)} />
      )}

      {/* Account Switcher Modal */}
      {showAccountSwitcherModal && (
        <AccountSwitcherModal
          onClose={() => setShowAccountSwitcherModal(false)}
          onOpenOwnerSettings={() => setShowAccountSettingsModal(true)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <AppContent />
    </ERPProvider>
  );
}
