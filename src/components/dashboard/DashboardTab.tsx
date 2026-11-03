import React from 'react';
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
  PlusCircle,
  Receipt,
  Truck
} from 'lucide-react';

interface DashboardTabProps {
  onSwitchTab: (tabId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onSwitchTab }) => {
  const { transactions, materials, menuItems, expenses, purchases } = useERP();

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-6 rounded-3xl shadow-lg border border-amber-500/20">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
            <Flame size={14} className="text-amber-400" />
            <span>Kantin & Kuliner UNPAM Viktor</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Dashboard Operasional Dimsum</h2>
          <p className="text-slate-300 text-xs md:text-sm">
            Pantau penjualan realtime, stok bahan mentai, dan laporan laba kotor hari ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSwitchTab('pos')}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md transition text-xs"
          >
            <Receipt size={16} />
            <span>Buka Kasir (POS)</span>
          </button>
          <button
            onClick={() => onSwitchTab('purchasing')}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition text-xs"
          >
            <Truck size={16} />
            <span>Restock Bahan</span>
          </button>
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
    </div>
  );
};
