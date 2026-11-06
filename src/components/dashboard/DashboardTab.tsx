import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatRupiah, formatNumber, formatDateTime } from '../../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  PackageCheck,
  Receipt,
  Truck,
  Target,
  Edit3,
  X,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface DashboardTabProps {
  onSwitchTab: (tabId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onSwitchTab }) => {
  const {
    transactions,
    materials,
    menuItems,
    expenses,
    salesTargets,
    updateSalesTargets,
    currentUser
  } = useERP();

  // Target modal state
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [dailyTargetInput, setDailyTargetInput] = useState<number>(salesTargets.daily);
  const [weeklyTargetInput, setWeeklyTargetInput] = useState<number>(salesTargets.weekly);
  const [monthlyTargetInput, setMonthlyTargetInput] = useState<number>(salesTargets.monthly);
  const [targetSuccessMsg, setTargetSuccessMsg] = useState('');

  // Filter for today's transactions
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTransactions = transactions.filter(
    t => t.status === 'COMPLETED' && t.date.startsWith(todayStr)
  );

  const todayOmset = todayTransactions.reduce((acc, t) => acc + t.total, 0);
  const todayTrxCount = todayTransactions.length;
  const todayGrossProfit = todayTransactions.reduce((acc, t) => acc + t.grossProfit, 0);

  // Today's expenses
  const todayExpenses = expenses
    .filter(e => e.date.startsWith(todayStr))
    .reduce((acc, e) => acc + e.amount, 0);

  const todayNetProfit = todayGrossProfit - todayExpenses;

  // Weekly transactions (Last 7 Days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weekTransactions = transactions.filter(
    t => t.status === 'COMPLETED' && t.date.slice(0, 10) >= sevenDaysAgo
  );
  const weekOmset = weekTransactions.reduce((acc, t) => acc + t.total, 0);

  // Monthly transactions (Current Month YYYY-MM)
  const currentMonthStr = todayStr.slice(0, 7);
  const monthTransactions = transactions.filter(
    t => t.status === 'COMPLETED' && t.date.startsWith(currentMonthStr)
  );
  const monthOmset = monthTransactions.reduce((acc, t) => acc + t.total, 0);

  // Target Progress Percentages
  const dailyProgress = salesTargets.daily > 0 ? Math.min(100, Math.round((todayOmset / salesTargets.daily) * 100)) : 0;
  const weeklyProgress = salesTargets.weekly > 0 ? Math.min(100, Math.round((weekOmset / salesTargets.weekly) * 100)) : 0;
  const monthlyProgress = salesTargets.monthly > 0 ? Math.min(100, Math.round((monthOmset / salesTargets.monthly) * 100)) : 0;

  const handleOpenTargetModal = () => {
    setDailyTargetInput(salesTargets.daily);
    setWeeklyTargetInput(salesTargets.weekly);
    setMonthlyTargetInput(salesTargets.monthly);
    setTargetSuccessMsg('');
    setShowTargetModal(true);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalesTargets({
      daily: Number(dailyTargetInput) || 0,
      weekly: Number(weeklyTargetInput) || 0,
      monthly: Number(monthlyTargetInput) || 0
    });
    setTargetSuccessMsg('Target penjualan berhasil diperbarui!');
    setTimeout(() => {
      setShowTargetModal(false);
    }, 800);
  };

  // Low stock materials
  const lowStockMaterials = materials.filter(m => m.stock <= m.minStock);
  const outOfStockMaterials = materials.filter(m => m.stock <= 0);

  // Total inventory valuation
  const inventoryAssetValuation = materials.reduce(
    (acc, m) => acc + m.stock * m.costPerUnit,
    0
  );

  // Top selling menu items
  const menuSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  transactions
    .filter(t => t.status === 'COMPLETED')
    .forEach(t => {
      t.items.forEach(item => {
        if (!menuSalesMap[item.name]) {
          menuSalesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
        }
        menuSalesMap[item.name].qty += item.qty;
        menuSalesMap[item.name].revenue += item.subtotal;
      });
    });

  const topSellingMenu = Object.values(menuSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Quick Tag */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-blue-500/20">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30">
            <Flame size={14} className="text-blue-300" />
            <span>Kantin & Kuliner UNPAM Viktor</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Dashboard Operasional Dimsum</h2>
          <p className="text-blue-100/80 text-xs md:text-sm">
            Pantau penjualan realtime, target omset berkala, stok bahan mentai, dan laba kotor hari ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSwitchTab('pos')}
            className="flex items-center space-x-2 bg-white hover:bg-blue-50 text-blue-900 font-black px-4 py-2.5 rounded-xl shadow-md transition text-xs"
          >
            <Receipt size={16} />
            <span>Buka Kasir (POS)</span>
          </button>
          <button
            onClick={() => onSwitchTab('purchasing')}
            className="flex items-center space-x-2 bg-blue-900/60 hover:bg-blue-900 text-white font-medium px-4 py-2.5 rounded-xl border border-blue-400/30 transition text-xs"
          >
            <Truck size={16} />
            <span>Restock Bahan</span>
          </button>
        </div>
      </div>

      {/* TARGET PENJUALAN SECTION (Harian, Mingguan, Bulanan) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Target size={22} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Target Penjualan Outlet UNPAM</h3>
              <p className="text-xs text-slate-500">
                Pencapaian target omset penjualan: Harian (Hari ini), Mingguan (7 Hari), dan Bulanan (Bulan Berjalan)
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenTargetModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-900 font-bold text-xs transition self-start sm:self-auto border border-slate-200 hover:border-blue-300"
          >
            <Edit3 size={15} />
            <span>Atur Target Penjualan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Target Harian */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-blue-100/30 border border-blue-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 uppercase tracking-wide">Target Harian</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                dailyProgress >= 100
                  ? 'bg-emerald-500 text-white'
                  : dailyProgress >= 70
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {dailyProgress >= 100 ? '🎉 Tercapai!' : `${dailyProgress}%`}
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{formatRupiah(todayOmset)}</span>
                <span className="text-xs text-slate-500">/ {formatRupiah(salesTargets.daily)}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {todayOmset >= salesTargets.daily ? (
                  <span className="text-emerald-700 font-bold">Surplus +{formatRupiah(todayOmset - salesTargets.daily)}</span>
                ) : (
                  <span>Sisa: <strong className="text-slate-700">{formatRupiah(salesTargets.daily - todayOmset)}</strong></span>
                )}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  dailyProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                style={{ width: `${Math.min(100, dailyProgress)}%` }}
              ></div>
            </div>
          </div>

          {/* Target Mingguan (7 Hari) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-blue-100/30 border border-blue-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 uppercase tracking-wide">Target Mingguan (7 Hari)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                weeklyProgress >= 100
                  ? 'bg-emerald-500 text-white'
                  : weeklyProgress >= 70
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {weeklyProgress >= 100 ? '🎉 Tercapai!' : `${weeklyProgress}%`}
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{formatRupiah(weekOmset)}</span>
                <span className="text-xs text-slate-500">/ {formatRupiah(salesTargets.weekly)}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {weekOmset >= salesTargets.weekly ? (
                  <span className="text-emerald-700 font-bold">Surplus +{formatRupiah(weekOmset - salesTargets.weekly)}</span>
                ) : (
                  <span>Sisa: <strong className="text-slate-700">{formatRupiah(salesTargets.weekly - weekOmset)}</strong></span>
                )}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  weeklyProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                style={{ width: `${Math.min(100, weeklyProgress)}%` }}
              ></div>
            </div>
          </div>

          {/* Target Bulanan */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 border border-emerald-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">Target Bulanan (Bulan Ini)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                monthlyProgress >= 100
                  ? 'bg-emerald-500 text-white'
                  : monthlyProgress >= 70
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {monthlyProgress >= 100 ? '🎉 Tercapai!' : `${monthlyProgress}%`}
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900">{formatRupiah(monthOmset)}</span>
                <span className="text-xs text-slate-500">/ {formatRupiah(salesTargets.monthly)}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {monthOmset >= salesTargets.monthly ? (
                  <span className="text-emerald-700 font-bold">Surplus +{formatRupiah(monthOmset - salesTargets.monthly)}</span>
                ) : (
                  <span>Sisa: <strong className="text-slate-700">{formatRupiah(salesTargets.monthly - monthOmset)}</strong></span>
                )}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  monthlyProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                }`}
                style={{ width: `${Math.min(100, monthlyProgress)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omset Hari Ini */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Omset Hari Ini</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(todayOmset)}</h3>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{todayTrxCount} pesanan</span> hari ini
          </p>
        </div>

        {/* Transaksi Sukses */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Transaksi Sukses</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">{formatNumber(todayTrxCount)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Total tercatat: <span className="font-semibold text-slate-700">{transactions.length} struk</span>
          </p>
        </div>

        {/* Laba Kotor Hari Ini */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Laba Kotor (Gross)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">{formatRupiah(todayGrossProfit)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Estimasi Bersih: <span className="font-bold text-slate-800">{formatRupiah(todayNetProfit)}</span>
          </p>
        </div>

        {/* Stok Menipis Alert */}
        <div
          onClick={() => onSwitchTab('materials')}
          className={`p-5 rounded-2xl shadow-xs border cursor-pointer hover:shadow-md transition ${
            lowStockMaterials.length > 0
              ? 'bg-rose-50/50 border-rose-200'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Stok Menipis (Alert)</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              lowStockMaterials.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <h3 className={`text-2xl font-black mt-2 ${
            lowStockMaterials.length > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {lowStockMaterials.length} <span className="text-xs font-normal text-slate-500">Bahan</span>
          </h3>
          <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center justify-between">
            <span>{outOfStockMaterials.length} bahan habis total</span>
            <span className="text-amber-700 underline text-[10px]">Cek Bahan &rarr;</span>
          </p>
        </div>
      </div>

      {/* Grid: Top Selling Menu & Low Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Terlaris (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Menu Paling Laris (Top Sellers)</h3>
              <p className="text-xs text-slate-500">Porsi terjual terbanyak dari seluruh transaksi</p>
            </div>
            <button
              onClick={() => onSwitchTab('products')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Lihat HPP & Resep</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {topSellingMenu.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">Belum ada transaksi penjualan.</p>
            ) : (
              topSellingMenu.map((item, index) => {
                const maxQty = topSellingMenu[0].qty || 1;
                const percent = Math.min(100, Math.round((item.qty / maxQty) * 100));
                return (
                  <div key={index} className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          {index + 1}
                        </span>
                        {item.name}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{item.qty} porsi</span>
                        <span className="text-slate-400 text-[10px] ml-2">({formatRupiah(item.revenue)})</span>
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ringkasan Stok & Aset Bahan Baku (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Status Bahan Baku</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                {materials.length} Total
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Nilai Aset Stok Bahan</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{formatRupiah(inventoryAssetValuation)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Dihitung dari harga beli rata-rata</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Perhatian Khusus (Restock Segera):</p>
              {lowStockMaterials.length === 0 ? (
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <PackageCheck size={16} />
                  <span>Semua stok bahan baku saat ini berada di atas batas aman.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {lowStockMaterials.slice(0, 4).map(mat => (
                    <div
                      key={mat.id}
                      className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{mat.name}</p>
                        <p className="text-[10px] text-rose-600">
                          Sisa: <span className="font-black">{mat.stock} {mat.unit}</span> (Min: {mat.minStock})
                        </p>
                      </div>
                      <button
                        onClick={() => onSwitchTab('purchasing')}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px]"
                      >
                        Beli
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onSwitchTab('materials')}
            className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition text-center"
          >
            Kelola Seluruh Stok Bahan &rarr;
          </button>
        </div>
      </div>

      {/* Transaksi Terkini */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Transaksi Kasir Terkini</h3>
            <p className="text-xs text-slate-500">Pesanan terbaru yang masuk dan memotong stok otomatis</p>
          </div>
          <button
            onClick={() => onSwitchTab('history')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Semua Riwayat Penjualan</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">No. Nota</th>
                <th className="pb-3">Waktu</th>
                <th className="pb-3">Pelanggan</th>
                <th className="pb-3">Menu Dipesan</th>
                <th className="pb-3">Metode</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-right">Laba Kotor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 font-mono font-bold text-slate-900">{t.invoiceNo}</td>
                  <td className="py-3 text-slate-500">{formatDateTime(t.date)}</td>
                  <td className="py-3 font-semibold text-slate-800">{t.customer}</td>
                  <td className="py-3 text-slate-600 max-w-xs truncate">
                    {t.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-black text-slate-900">{formatRupiah(t.total)}</td>
                  <td className="py-3 text-right font-bold text-emerald-600">{formatRupiah(t.grossProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Setting Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Target size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-400">Atur Target Penjualan</h4>
                  <p className="text-[11px] text-slate-300">Target omset harian, mingguan, bulanan</p>
                </div>
              </div>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTargets} className="p-6 space-y-4">
              {targetSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{targetSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Penjualan Harian (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  value={dailyTargetInput}
                  onChange={e => setDailyTargetInput(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Target omset kasir per hari (misal: Rp 1.500.000)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Penjualan Mingguan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  required
                  value={weeklyTargetInput}
                  onChange={e => setWeeklyTargetInput(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Target omset kasir per minggu (misal: Rp 10.000.000)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Penjualan Bulanan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  required
                  value={monthlyTargetInput}
                  onChange={e => setMonthlyTargetInput(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Target omset kasir per bulan berjalan (misal: Rp 45.000.000)
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
