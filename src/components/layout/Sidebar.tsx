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
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenGoogleSheetSettings: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'Kasir (POS)', icon: Receipt, highlight: true },
  { id: 'purchasing', label: 'Purchasing', icon: ShoppingCart },
  { id: 'products', label: 'Menu & HPP', icon: Utensils },
  { id: 'materials', label: 'Stok Bahan', icon: Boxes },
  { id: 'adjustment', label: 'Stok Adjustment', icon: Sliders },
  { id: 'finance', label: 'Laporan Keuangan', icon: Wallet },
  { id: 'history', label: 'Riwayat Penjualan', icon: History },
  { id: 'import', label: 'Import Excel', icon: FileSpreadsheet },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  onOpenGoogleSheetSettings
}) => {
  const { config, transactions } = useERP();
  const isSheetConfigured = Boolean(config.googleWebAppUrl && config.googleWebAppUrl.trim().length > 0);
  const pendingCount = transactions.filter(t => !t.syncedToGoogleSheet).length;

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-900 text-white select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Flame size={22} className="text-slate-950" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-wide text-amber-400 leading-tight">
                DIMSUM MENTAI 77
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[10px] text-slate-400 font-medium">UNPAM Viktor & Pusat</p>
              </div>
            </div>
          </div>
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="p-3.5 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (isMobileOpen) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={17} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'pos' && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        {/* Google Sheets Status button */}
        <button
          onClick={onOpenGoogleSheetSettings}
          className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-left text-[11px] flex items-center justify-between transition border border-slate-700/60"
        >
          <div className="flex items-center space-x-2">
            <Cloud size={14} className={isSheetConfigured ? 'text-emerald-400' : 'text-slate-400'} />
            <span className="truncate">Google Sheets</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              isSheetConfigured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
            }`}
          >
            {isSheetConfigured ? (pendingCount > 0 ? `${pendingCount} antri` : 'Sinkron') : 'Offline'}
          </span>
        </button>

        <div className="px-1 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="truncate">Kasir: {config.cashierName.split('(')[0]}</span>
          <span className="text-amber-400 font-bold">v1.2</span>
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
