import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Menu, Flame, Cloud, Receipt, Bell, User, Users, LogOut } from 'lucide-react';
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
  purchasing: 'Purchasing (Restock Bahan)',
  products: 'Menu & Kalkulasi HPP (BOM Resep)',
  materials: 'Manajemen Stok Bahan Baku',
  adjustment: 'Stok Adjustment (Stock Opname)',
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
  const { materials, cart, currentUser, logout } = useERP();
  const lowStockCount = materials.filter(m => m.stock <= m.minStock).length;

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">OWNER</span>;
      case 'SUPERVISOR':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-300">SPV</span>;
      case 'FINANCE':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">FINANCE</span>;
      case 'STAFF':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-300">STAFF</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden focus:outline-none"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
            {TAB_TITLES[activeTab] || 'DIMSUM MENTAI 77'}
          </h1>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Outlet UNPAM Viktor • Sistem ERP & POS Terintegrasi
          </p>
        </div>
      </div>

      {/* Right: Quick Indicators & Buttons */}
      <div className="flex items-center space-x-2.5">
        {/* User Switcher Quick Button */}
        {onOpenAccountSwitcher && (
          <button
            onClick={onOpenAccountSwitcher}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition"
            title="Klik untuk beralih akun / login"
          >
            <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
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
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            <span className="text-[11px]">▲</span>
            <span className="hidden sm:inline">Vercel.app</span>
          </button>
        )}

        {/* Low Stock Badge */}
        {lowStockCount > 0 && (
          <button
            onClick={() => onSwitchTab('materials')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100 transition"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>{lowStockCount} Bahan Menipis</span>
          </button>
        )}

        {/* Google Sheets Trigger */}
        <button
          onClick={onOpenGoogleSheetSettings}
          title="Pengaturan Google Sheets"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
        >
          <Cloud size={16} />
        </button>

        {/* Fast POS Switch if not on POS tab */}
        {activeTab !== 'pos' && (
          <button
            onClick={() => onSwitchTab('pos')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-xs transition text-xs cursor-pointer"
          >
            <Receipt size={15} />
            <span className="hidden sm:inline">Kasir POS</span>
            {cart.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 text-[9px] flex items-center justify-center font-bold">
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
