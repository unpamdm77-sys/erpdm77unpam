import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Menu, Flame, Cloud, Receipt, Bell } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onOpenMobileMenu: () => void;
  onOpenGoogleSheetSettings: () => void;
  onOpenVercelGuide?: () => void;
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
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenGoogleSheetSettings,
  onOpenVercelGuide,
  onSwitchTab,
}) => {
  const { materials, cart } = useERP();
  const lowStockCount = materials.filter(m => m.stock <= m.minStock).length;

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
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-xs transition text-xs"
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
      </div>
    </header>
  );
};
