import React, { useState } from 'react';
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
import { GasSyncModal } from './components/settings/GasSyncModal';
import { VercelDeployModal } from './components/settings/VercelDeployModal';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGasModal, setShowGasModal] = useState(false);
  const [showVercelModal, setShowVercelModal] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenGoogleSheetSettings={() => setShowGasModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenGoogleSheetSettings={() => setShowGasModal(true)}
          onOpenVercelGuide={() => setShowVercelModal(true)}
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
            {activeTab === 'finance' && <FinanceTab />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'import' && (
              <ImportExportTab onOpenGoogleSheetSettings={() => setShowGasModal(true)} />
            )}
          </div>
        </main>
      </div>

      {/* Google Sheets Modal */}
      {showGasModal && <GasSyncModal onClose={() => setShowGasModal(false)} />}

      {/* Vercel Deploy Guide Modal */}
      {showVercelModal && <VercelDeployModal onClose={() => setShowVercelModal(false)} />}
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
