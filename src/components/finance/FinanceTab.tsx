import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Expense } from '../../types/erp';
import { formatRupiah, formatNumber, formatDateOnly } from '../../utils/formatters';
import {
  Wallet,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  CheckCircle2,
  Receipt
} from 'lucide-react';

export const FinanceTab: React.FC = () => {
  const { transactions, expenses, addExpense, deleteExpense } = useERP();

  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('month');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Form states
  const [expenseName, setExpenseName] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Gas LPG');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseNotes, setExpenseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  const filterItemByDate = (dateStr: string) => {
    if (dateFilter === 'today') return dateStr.startsWith(todayStr);
    if (dateFilter === '7days') return dateStr.slice(0, 10) >= sevenDaysAgo;
    if (dateFilter === 'month') return dateStr.startsWith(currentMonthStr);
    return true; // 'all'
  };

  const filteredTransactions = transactions.filter(
    t => t.status === 'COMPLETED' && filterItemByDate(t.date)
  );

  const filteredExpenses = expenses.filter(e => filterItemByDate(e.date));

  // Calculations
  const grossSales = filteredTransactions.reduce((acc, t) => acc + t.subtotal, 0);
  const totalDiscounts = filteredTransactions.reduce((acc, t) => acc + t.discount, 0);
  const netRevenue = filteredTransactions.reduce((acc, t) => acc + t.total, 0);
  const totalHpp = filteredTransactions.reduce((acc, t) => acc + t.totalHpp, 0);
  const grossProfit = netRevenue - totalHpp;
  const grossMarginPercent = netRevenue > 0 ? Math.round((grossProfit / netRevenue) * 100) : 0;

  const totalOperatingExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalOperatingExpenses;
  const netMarginPercent = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 100) : 0;

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName || !expenseAmount) return;

    try {
      setIsSubmitting(true);
      await addExpense({
        name: expenseName,
        category: expenseCategory,
        amount: Number(expenseAmount),
        date: expenseDate,
        notes: expenseNotes
      });
      setIsSubmitting(false);
      setShowAddExpenseModal(false);
      setExpenseName('');
      setExpenseAmount('');
      setExpenseNotes('');
    } catch {
      setIsSubmitting(false);
      alert('Gagal mencatat beban pengeluaran');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Wallet size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Laporan Keuangan & Pengeluaran Beban
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Laporan laba rugi (P&L) komprehensif Dimsum Mentai 77, HPP bahan, dan beban operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-xl transition ${dateFilter === 'today' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-3 py-1.5 rounded-xl transition ${dateFilter === '7days' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:text-slate-900'}`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 rounded-xl transition ${dateFilter === 'month' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition ${dateFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Semua
            </button>
          </div>

          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition text-xs"
          >
            <Plus size={15} />
            <span>+ Catat Beban Operasional</span>
          </button>
        </div>
      </div>

      {/* KPI 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Penjualan Bersih (Net)</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(netRevenue)}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{filteredTransactions.length} transaksi sukses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Harga Pokok (HPP BOM)</p>
          <h3 className="text-2xl font-black text-amber-700 mt-1">{formatRupiah(totalHpp)}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Biaya bahan baku riil</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Laba Kotor (Gross Profit)</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatRupiah(grossProfit)}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Margin: {grossMarginPercent}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Laba Bersih (Net Profit)</p>
          <h3 className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatRupiah(netProfit)}
          </h3>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Margin Bersih: {netMarginPercent}%</p>
        </div>
      </div>

      {/* Main Grid: Comprehensive P&L Income Statement + Expenses List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Statement Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Laporan Laba Rugi (P&L)</h3>
              <p className="text-xs text-slate-400">Ringkasan kinerja keuangan outlet Dimsum 77</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg">
              Periode: {dateFilter.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            {/* Revenue */}
            <div className="pt-2 space-y-1.5">
              <p className="font-bold text-slate-900 uppercase text-[11px] text-amber-600">
                1. Pendapatan Usaha
              </p>
              <div className="flex justify-between text-slate-600">
                <span>Penjualan Kotor (Gross Sales)</span>
                <span>{formatRupiah(grossSales)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Potongan Diskon Mahasiswa / Promo</span>
                <span>-{formatRupiah(totalDiscounts)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1">
                <span>Total Penjualan Bersih</span>
                <span>{formatRupiah(netRevenue)}</span>
              </div>
            </div>

            {/* HPP */}
            <div className="pt-3 space-y-1.5">
              <p className="font-bold text-slate-900 uppercase text-[11px] text-amber-600">
                2. Harga Pokok Penjualan (HPP)
              </p>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Bahan Baku Terpakai (BOM Resep Dimsum)</span>
                <span className="text-amber-800">-{formatRupiah(totalHpp)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-emerald-700 bg-emerald-50/60 p-2 rounded-xl">
                <span>LABA KOTOR (GROSS PROFIT)</span>
                <span>{formatRupiah(grossProfit)} ({grossMarginPercent}%)</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="pt-3 space-y-1.5">
              <p className="font-bold text-slate-900 uppercase text-[11px] text-amber-600">
                3. Beban Operasional Non-Stok
              </p>
              {filteredExpenses.length === 0 ? (
                <p className="text-slate-400 py-1 text-[11px]">Belum ada beban operasional tercatat.</p>
              ) : (
                filteredExpenses.slice(0, 5).map(exp => (
                  <div key={exp.id} className="flex justify-between text-slate-600">
                    <span className="truncate pr-2">{exp.name}</span>
                    <span className="text-rose-600">-{formatRupiah(exp.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between font-bold text-slate-800 pt-1">
                <span>Total Beban Operasional</span>
                <span className="text-rose-700">-{formatRupiah(totalOperatingExpenses)}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="pt-4">
              <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Laba Bersih Akhir (Net Profit)
                  </p>
                  <p className="text-xs text-slate-300">Setelah seluruh HPP & Biaya Operasional</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-amber-400">{formatRupiah(netProfit)}</p>
                  <p className="text-[11px] font-semibold text-emerald-400">Margin: {netMarginPercent}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List & Manager */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Rincian Beban Operasional</h3>
                <p className="text-xs text-slate-400">Gas butane/LPG, es batu, listrik, sewa gerobak UNPAM</p>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                + Tambah
              </button>
            </div>

            <div className="overflow-y-auto max-h-[380px] space-y-2 pt-2 pr-1">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Tidak ada catatan pengeluaran beban pada periode ini.
                </div>
              ) : (
                filteredExpenses.map(exp => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{exp.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded-md">
                          {exp.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateOnly(exp.date)} {exp.notes ? `• ${exp.notes}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-black text-rose-600 text-sm">
                        -{formatRupiah(exp.amount)}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pengeluaran "${exp.name}"?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="text-slate-300 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs mt-4">
            <span className="font-bold text-slate-700">Total Pengeluaran Beban:</span>
            <span className="font-black text-rose-600 text-sm">
              {formatRupiah(totalOperatingExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* ADD EXPENSE MODAL (Matches Google Apps Script ADD_EXPENSE to Pengeluaran_NonStok) */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="text-amber-400" size={20} />
                <h3 className="font-bold text-base">Catat Pengeluaran Non-Stok</h3>
              </div>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Beban Pengeluaran
                </label>
                <input
                  type="text"
                  required
                  value={expenseName}
                  onChange={e => setExpenseName(e.target.value)}
                  placeholder="Contoh: Gas LPG 3kg untuk Kukusan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Kategori</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="Gas LPG">Gas LPG / Butane</option>
                    <option value="Operasional">Operasional Harian</option>
                    <option value="Sewa Tempat">Sewa Tempat UNPAM</option>
                    <option value="Listrik & Air">Listrik & Air</option>
                    <option value="Gaji Pegawai">Gaji Pegawai</option>
                    <option value="Kebersihan">Kebersihan & Keamanan</option>
                    <option value="Marketing">Promosi / Spanduk</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nominal Biaya (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 23000"
                  className="w-full font-black text-lg px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={e => setExpenseNotes(e.target.value)}
                  placeholder="Keterangan toko / kwitansi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
