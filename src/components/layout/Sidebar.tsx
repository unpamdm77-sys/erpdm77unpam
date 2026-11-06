import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Utensils,
  Boxes,
  Sliders,
  Wallet,
  History,
  FileSpreadsheet,
  Flame,
  Cloud,
  CheckCircle2,
  X,
  Shield,
  Users,
  LogOut,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { UserRole } from '../../types/erp';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenGoogleSheetSettings: () => void;
  onOpenAccountSettings: () => void;
  onOpenAccountSwitcher: () => void;
}

const ALL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'Kasir (POS)', icon: Receipt, highlight: true },
  { id: 'cashier', label: 'Cashier Management', icon: CreditCard },
  { id: 'purchasing', label: 'Purchasing', icon: ShoppingCart },
  { id: 'products', label: 'Menu & HPP', icon: Utensils },
  { id: 'materials', label: 'Stok Bahan', icon: Boxes },
  { id: 'adjustment', label: 'Stok Adjustment', icon: Sliders },
  { id: 'finance', label: 'Laporan Keuangan', icon: Wallet },
  { id: 'history', label: 'Riwayat Penjualan', icon: History },
  { id: 'import', label: 'Import Excel', icon: FileSpreadsheet },
  { id: 'settings', label: 'Setting Akun Staff', icon: Shield, ownerOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  onOpenGoogleSheetSettings,
  onOpenAccountSettings,
  onOpenAccountSwitcher
}) => {
  const {
    config,
    transactions,
    currentUser,
    logout,
    firestoreStatus,
    cloudSyncStatus,
    lastCloudSyncTime,
    isGoogleConnected,
    isSyncing,
    lastSyncTime
  } = useERP();
  const isSheetConfigured = Boolean(config.googleWebAppUrl && config.googleWebAppUrl.trim().length > 0);
  const pendingCount = transactions.filter(t => !t.syncedToGoogleSheet).length;

  // Role permissions filter
  const isStaffOrSupervisor = currentUser.role === 'STAFF' || currentUser.role === 'SUPERVISOR';
  const isOwner = currentUser.role === 'OWNER';

  const visibleNavItems = ALL_NAV_ITEMS.filter(item => {
    // Owner can access all
    if (isOwner) return true;

    // Setting Akun is strictly for Owner
    if (item.ownerOnly) return false;

    // Staff and Supervisor cannot access Laporan Keuangan and Import Excel
    if (isStaffOrSupervisor) {
      if (item.id === 'finance' || item.id === 'import') return false;
    }

    return true;
  });

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950">OWNER</span>;
      case 'SUPERVISOR':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-400 text-slate-950">SPV</span>;
      case 'FINANCE':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-400 text-slate-950">FINANCE</span>;
      case 'STAFF':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-300 text-slate-900">STAFF</span>;
    }
  };

  const content = (
    <div className="h-full flex flex-col justify-between bg-white text-slate-800 select-none border-r border-slate-200">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              <Flame size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-wide text-blue-950 leading-tight">
                DIMSUM MENTAI 77
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-blue-600 font-semibold">UNPAM Viktor & Pusat</p>
              </div>
            </div>
          </div>
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="p-3.5 space-y-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (isMobileOpen) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'pos' && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                )}
                {item.ownerOnly && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${
                    isActive
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    OWNER
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer & User Profile */}
      <div className="p-3.5 border-t border-slate-100 space-y-2 bg-slate-50/50">
        {/* User Account Bar */}
        <div
          onClick={onOpenAccountSwitcher}
          className="p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/70 cursor-pointer transition flex items-center justify-between group"
          title="Klik untuk Beralih Akun"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</span>
                {getRoleBadge(currentUser.role)}
              </div>
              <p className="text-[10px] text-blue-700 font-mono truncate">@{currentUser.username}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition shrink-0" />
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            if (confirm(`Apakah Anda yakin ingin keluar dari akun ${currentUser.name}?`)) {
              logout();
            }
          }}
          className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-left text-xs font-bold flex items-center justify-between transition border border-rose-200 cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <LogOut size={13} className="text-rose-500" />
            <span>Keluar Sesi</span>
          </div>
          <span className="text-[10px] text-rose-500 font-mono">Logout &rarr;</span>
        </button>

        {/* Google Sheets / Firestore Status button */}
        <button
          onClick={onOpenGoogleSheetSettings}
          className="w-full p-2.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 text-left text-[11px] flex items-center justify-between transition border border-slate-200 cursor-pointer shadow-2xs"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Cloud
              size={13}
              className={
                firestoreStatus === 'connected' || isGoogleConnected || cloudSyncStatus === 'connected'
                  ? 'text-emerald-500'
                  : isSyncing || cloudSyncStatus === 'syncing'
                  ? 'text-amber-500 animate-spin'
                  : 'text-slate-400'
              }
            />
            <span className="truncate text-[10px] font-medium text-slate-700">
              {firestoreStatus === 'connected'
                ? 'Cloud Firestore Live'
                : isGoogleConnected
                ? (lastSyncTime ? `Drive (${lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})` : 'Google Drive')
                : cloudSyncStatus === 'connected'
                ? (lastCloudSyncTime ? `Sheet (${lastCloudSyncTime})` : 'Cloud Sheet Live')
                : 'Database Cloud'}
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${
              firestoreStatus === 'connected' || isGoogleConnected || cloudSyncStatus === 'connected'
                ? 'bg-emerald-100 text-emerald-800'
                : isSyncing || cloudSyncStatus === 'syncing'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {firestoreStatus === 'connected' ? 'Realtime' : isGoogleConnected ? 'Terkoneksi' : 'Offline'}
          </span>
        </button>

        <div className="px-1 text-[9px] text-slate-400 flex items-center justify-between">
          <span className="truncate">Sistem ERP POS v1.3</span>
          <span className="text-blue-600 font-semibold">UNPAM 77</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen shadow-xl shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          ></div>
          <div className="relative w-64 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
