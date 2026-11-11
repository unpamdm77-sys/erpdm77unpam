import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Menu, Flame, Cloud, Receipt, Bell, User, Users, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types/erp';

interface HeaderProps {
  activeTab: string;
  onOpenMobileMenu: () => void;
  onOpenGoogleSheetSettings: () => void;
  onOpenVercelGuide?: () => void;
  onOpenAccountSwitcher?: () => void;
  onSwitchTab: (tabId: string) => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard Operasional',
  pos: 'Kasir & Point of Sale (POS)',
  cashier: 'Cashier Management (Rekap Kasir & Metode Bayar)',
  purchasing: 'Purchasing (Restock Bahan)',
  products: 'Menu & Kalkulasi HPP (BOM Resep)',
  materials: 'Manajemen Stok Bahan Baku',
  adjustment: 'Stok Adjustment (Stock Opname)',
  'stock-request': 'Request Stok Inventaris (RSI)',
  'stock-audit': 'Cek Stok Yesterday & Harian (Stock Audit)',
  finance: 'Laporan Keuangan & Pengeluaran',
  history: 'Riwayat Penjualan Kasir',
  import: 'Export & Import Excel',
  settings: 'Setting Akun & Sandi Karyawan (Khusus Owner)',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenGoogleSheetSettings,
  onOpenVercelGuide,
  onOpenAccountSwitcher,
  onSwitchTab,
}) => {
  const {
    materials,
    cart,
    currentUser,
    logout,
    config,
    firestoreStatus,
    cloudSyncStatus,
    lastCloudSyncTime,
    isGoogleConnected,
    googleUser,
    isSyncing,
    lastSyncTime,
    isManualSyncing,
    lastManualSyncTime,
    triggerManualSync
  } = useERP();
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleManualSyncClick = async () => {
    setSyncToast(null);
    const res = await triggerManualSync();
    setSyncToast(res.message);
    setTimeout(() => {
      setSyncToast(null);
    }, 3500);
  };

  const isSheetConfigured = Boolean(config.googleWebAppUrl && config.googleWebAppUrl.trim().length > 0);
  const lowStockCount = materials.filter(m => m.stock <= m.minStock).length;

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">OWNER</span>;
      case 'SUPERVISOR':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800 border border-red-300">SPV</span>;
      case 'FINANCE':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">FINANCE</span>;
      case 'STAFF':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-300">STAFF</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-3 sm:px-4 md:px-8 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 sm:p-2 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden focus:outline-none"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight leading-tight">
            {TAB_TITLES[activeTab] || 'DIMSUM MENTAI 77'}
          </h1>
          <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
            Outlet Dimsum Mentai 77 UNPAM (Universitas Pamulang) • Sistem ERP & POS
          </p>
        </div>
      </div>

      {/* Right: Quick Indicators & Buttons */}
      <div className="flex items-center space-x-2.5">
        {/* User Switcher Quick Button */}
        {onOpenAccountSwitcher && (
          <button
            onClick={onOpenAccountSwitcher}
            className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer"
            title="Klik untuk beralih akun / login"
          >
            <div className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden sm:inline font-bold text-[11px]">{currentUser.name}</span>
            {getRoleBadge(currentUser.role)}
          </button>
        )}

        {/* Vercel Deploy Guide Button */}
        {onOpenVercelGuide && (
          <button
            onClick={onOpenVercelGuide}
            title="Panduan Deploy Vercel.app"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span className="text-[11px]">▲</span>
            <span className="hidden sm:inline">Vercel.app</span>
          </button>
        )}

        {/* Low Stock Badge */}
        {lowStockCount > 0 && (
          <button
            onClick={() => onSwitchTab('materials')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>{lowStockCount} Bahan Menipis</span>
          </button>
        )}

        {/* Firebase Cloud Firestore Real-Time Auto & Manual Sync */}
        <div className="relative">
          <button
            onClick={handleManualSyncClick}
            disabled={isManualSyncing}
            title={
              firestoreStatus === 'connected'
                ? `Sinkronisasi Otomatis Real-Time AKTIF. Klik untuk sinkronisasi manual sekarang.${lastManualSyncTime ? ` (Terakhir sync: ${lastManualSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})` : ''}`
                : 'Koneksi terputus. Klik untuk coba hubungkan dan sinkronkan manual sekarang.'
            }
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer disabled:opacity-60 ${
              firestoreStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : firestoreStatus === 'connecting'
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
            }`}
          >
            <RefreshCw
              size={13}
              className={`${isManualSyncing ? 'animate-spin text-red-600' : firestoreStatus === 'connected' ? 'text-emerald-600 hover:rotate-180 transition-transform duration-500' : 'text-rose-600'}`}
            />
            <span className="hidden sm:inline text-[11px]">
              {isManualSyncing
                ? 'Menyinkronkan...'
                : firestoreStatus === 'connected'
                ? 'Cloud Otomatis'
                : 'Sync Terputus'}
            </span>
            {firestoreStatus === 'connected' && !isManualSyncing && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          {/* Sync Toast Feedback Popup */}
          {syncToast && (
            <div className="absolute right-0 top-full mt-2 w-64 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-[11px] font-medium z-50 flex items-start space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{syncToast}</div>
            </div>
          )}
        </div>

        {/* Google Sheets Live Database Indicator */}
        <button
          onClick={onOpenGoogleSheetSettings}
          title={
            isGoogleConnected
              ? `Google Drive & Sheets Terhubung (${googleUser?.email || 'Akun Google'}). Klik untuk sync atau kelola database.`
              : isSheetConfigured
              ? `Cloud Database Terhubung (${lastCloudSyncTime || 'Real-Time'}). Klik untuk pengaturan atau tarik data.`
              : 'Hubungkan Akun Google untuk Database Real-Time'
          }
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
            isGoogleConnected || cloudSyncStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : isSyncing || cloudSyncStatus === 'syncing'
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Cloud
            size={14}
            className={
              isGoogleConnected || cloudSyncStatus === 'connected'
                ? 'text-emerald-600'
                : isSyncing || cloudSyncStatus === 'syncing'
                ? 'text-amber-500 animate-spin'
                : 'text-slate-400'
            }
          />
          <span className="hidden md:inline text-[11px]">
            {isGoogleConnected
              ? (lastSyncTime ? `Drive Live (${lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})` : 'Drive Live')
              : cloudSyncStatus === 'connected'
              ? (lastCloudSyncTime ? `Live Sheet (${lastCloudSyncTime})` : 'Live Sheet')
              : isSyncing || cloudSyncStatus === 'syncing'
              ? 'Menyinkronkan...'
              : 'Konek Google Sheet'}
          </span>
          {(isGoogleConnected || cloudSyncStatus === 'connected') && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        {/* Fast POS Switch if not on POS tab */}
        {activeTab !== 'pos' && (
          <button
            onClick={() => onSwitchTab('pos')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-xs transition text-xs cursor-pointer"
          >
            <Receipt size={15} />
            <span className="hidden sm:inline">Kasir POS</span>
            {cart.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-red-600 text-[9px] flex items-center justify-center font-black">
                {cart.length}
              </span>
            )}
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={() => {
            if (confirm(`Apakah Anda yakin ingin keluar dari akun ${currentUser.name}?`)) {
              logout();
            }
          }}
          title="Keluar Sesi (Logout)"
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200 cursor-pointer"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
