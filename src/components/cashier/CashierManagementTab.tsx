import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { PaymentMethod, Transaction } from '../../types/erp';
import { formatRupiah, formatNumber, formatDateTime } from '../../utils/formatters';
import {
  Receipt,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Printer,
  Download,
  Filter,
  Search,
  Wallet,
  Clock,
  Coins
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CashierManagementTabProps {
  onSwitchTab?: (tabId: string) => void;
}

export const CashierManagementTab: React.FC<CashierManagementTabProps> = ({ onSwitchTab }) => {
  const { transactions, config, currentUser } = useERP();

  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('today');
  const [selectedCashier, setSelectedCashier] = useState<string>('Semua');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<'Semua' | PaymentMethod>('Semua');
  const [search, setSearch] = useState('');
  
  // Shift close modal state
  const [showShiftCloseModal, setShowShiftCloseModal] = useState(false);
  const [cashDrawerCount, setCashDrawerCount] = useState<number | ''>('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftSuccessMsg, setShiftSuccessMsg] = useState('');

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  const filterItemByDate = (dateStr: string) => {
    if (dateFilter === 'today') return dateStr.startsWith(todayStr);
    if (dateFilter === '7days') return dateStr.slice(0, 10) >= sevenDaysAgo;
    if (dateFilter === 'month') return dateStr.startsWith(currentMonthStr);
    return true;
  };

  // Base completed transactions matching date filter
  const periodTransactions = transactions.filter(
    t => t.status === 'COMPLETED' && filterItemByDate(t.date)
  );

  // Cashier list derived from filtered transactions
  const cashierList = Array.from(new Set(periodTransactions.map(t => t.cashierName).filter(Boolean)));

  // Transactions filtered by selected cashier
  const cashierFilteredTransactions = periodTransactions.filter(
    t => selectedCashier === 'Semua' || t.cashierName === selectedCashier
  );

  // Overall totals
  const totalSales = cashierFilteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactionsCount = cashierFilteredTransactions.length;
  const averageTicket = totalTransactionsCount > 0 ? Math.round(totalSales / totalTransactionsCount) : 0;

  // -------------------------------------------------------------
  // SEPARATE CALCULATIONS BY PAYMENT METHOD CATEGORY
  // -------------------------------------------------------------
  const getMethodStats = (method: PaymentMethod) => {
    const list = cashierFilteredTransactions.filter(t => t.paymentMethod === method);
    const amount = list.reduce((sum, t) => sum + t.total, 0);
    const count = list.length;
    const percentage = totalSales > 0 ? Math.round((amount / totalSales) * 100) : 0;
    return { list, amount, count, percentage };
  };

  const cashStats = getMethodStats('TUNAI');
  const qrisStats = getMethodStats('QRIS');
  const transferStats = getMethodStats('TRANSFER');
  const debitStats = getMethodStats('DEBIT');

  // Total cash received and change given for TUNAI
  const totalCashReceived = cashStats.list.reduce((sum, t) => sum + (t.cashReceived || t.total), 0);
  const totalChangeGiven = cashStats.list.reduce((sum, t) => sum + (t.change || 0), 0);
  const netCashInDrawer = totalCashReceived - totalChangeGiven;

  // Digital (Non-tunai) total
  const totalDigitalSales = qrisStats.amount + transferStats.amount + debitStats.amount;
  const totalDigitalCount = qrisStats.count + transferStats.count + debitStats.count;

  // Final table list with method and search filters
  const displayedTransactions = cashierFilteredTransactions.filter(t => {
    const matchMethod = selectedMethodFilter === 'Semua' || t.paymentMethod === selectedMethodFilter;
    const matchSearch =
      search === '' ||
      t.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.cashierName.toLowerCase().includes(search.toLowerCase());
    return matchMethod && matchSearch;
  });

  // Export / Print Shift Summary PDF
  const handlePrintShiftReport = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // Header
    doc.setFillColor(220, 38, 38);
    doc.rect(14, 12, 182, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DIMSUM MENTAI 77 — OUTLET UNPAM (UNIVERSITAS PAMULANG)', 20, 20);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Jl. Pamulang Permai 1, Samping Gapura, Kec. Pamulang, Tangsel • WA: 0819-9645-1323', 20, 25);
    doc.text('Laporan Rekapitulasi Kasir & Pemisahan Metode Pembayaran', 20, 30);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAP SHIFT PENJUALAN KASIR', 14, 42);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 46, 182, 10, 2, 2, 'FD');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${dateFilter.toUpperCase()}`, 18, 52.5);
    doc.text(`Kasir: ${selectedCashier}`, 75, 52.5);
    doc.text(`Waktu Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 130, 52.5);

    // Summary Boxes
    let curY = 62;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. Ringkasan Total Penjualan', 14, curY);

    curY += 4;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, curY, 88, 18, 2, 2, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text('TOTAL PENJUALAN KASIR', 18, curY + 6);
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(formatRupiah(totalSales), 18, curY + 13);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(108, curY, 88, 18, 2, 2, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text('VOLUME TRANSAKSI', 112, curY + 6);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(`${totalTransactionsCount} Nota`, 112, curY + 13);

    // Method Breakdown Table
    curY += 25;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Pemisahan per Kategori Metode Pembayaran', 14, curY);

    curY += 4;
    doc.setFillColor(30, 41, 59);
    doc.rect(14, curY, 182, 6.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text('METODE PEMBAYARAN', 18, curY + 4.5);
    doc.text('JUMLAH TRANSAKSI', 85, curY + 4.5);
    doc.text('KONTRIBUSI (%)', 125, curY + 4.5);
    doc.text('TOTAL RUPIAH', 160, curY + 4.5);

    curY += 6.5;
    const methodsData = [
      { name: 'TUNAI (Uang Fisik Laci)', count: cashStats.count, pct: `${cashStats.percentage}%`, amount: formatRupiah(cashStats.amount), color: [16, 185, 129] },
      { name: 'QRIS (Dinamis / Statis)', count: qrisStats.count, pct: `${qrisStats.percentage}%`, amount: formatRupiah(qrisStats.amount), color: [220, 38, 38] },
      { name: 'TRANSFER BANK', count: transferStats.count, pct: `${transferStats.percentage}%`, amount: formatRupiah(transferStats.amount), color: [217, 119, 6] },
      { name: 'KARTU DEBIT / EDC', count: debitStats.count, pct: `${debitStats.percentage}%`, amount: formatRupiah(debitStats.amount), color: [71, 85, 105] },
    ];

    methodsData.forEach((m, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, curY, 182, 7, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(14, curY + 7, 196, curY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(m.color[0], m.color[1], m.color[2]);
      doc.text(m.name, 18, curY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${m.count} nota`, 85, curY + 5);
      doc.text(m.pct, 125, curY + 5);

      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(m.amount, 160, curY + 5);

      curY += 7;
    });

    // Cash drawer balance
    curY += 5;
    doc.setFillColor(236, 253, 245);
    doc.rect(14, curY, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text('TOTAL UANG FISIK WAJIB DI LACI KASIR (NET CASH):', 18, curY + 5.5);
    doc.setFont('courier', 'bold');
    doc.text(formatRupiah(netCashInDrawer), 160, curY + 5.5);

    // Signatures
    const signY = 245;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, signY - 4, 196, signY - 4);
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    doc.text('Kasir yang Bertugas:', 25, signY);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedCashier === 'Semua' ? (currentUser?.name || 'Kasir Outlet') : selectedCashier, 25, signY + 4);
    doc.line(25, signY + 18, 75, signY + 18);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('( Tanda Tangan Kasir )', 25, signY + 22);

    doc.setFontSize(7.5);
    doc.text('Supervisor / Owner Toko:', 135, signY);
    doc.setFont('helvetica', 'bold');
    doc.text('Owner Dimsum 77 UNPAM', 135, signY + 4);
    doc.line(135, signY + 18, 185, signY + 18);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('( Verifikasi Setoran )', 135, signY + 22);

    doc.save(`REKAP_KASIR_DIMSUM77_${selectedCashier.replace(/\s+/g, '_')}_${todayStr}.pdf`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 sm:p-2 bg-red-100 text-red-700 rounded-xl">
              <Receipt size={18} />
            </span>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              Cashier Management (Manajemen Kasir)
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Rekapitulasi penjualan shift kasir, pemisahan metode pembayaran, dan kontrol fisik uang laci.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-xl text-[11px] sm:text-xs font-bold text-slate-600">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition cursor-pointer ${dateFilter === 'today' ? 'bg-red-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition cursor-pointer ${dateFilter === '7days' ? 'bg-red-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition cursor-pointer ${dateFilter === 'month' ? 'bg-red-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition cursor-pointer ${dateFilter === 'all' ? 'bg-red-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
            >
              Semua
            </button>
          </div>

          {/* Cashier Filter Dropdown if more than 1 cashier exists */}
          {cashierList.length > 0 && (
            <select
              value={selectedCashier}
              onChange={e => setSelectedCashier(e.target.value)}
              className="text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="Semua">Semua Kasir ({cashierList.length})</option>
              {cashierList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Print Shift Report */}
          <button
            onClick={handlePrintShiftReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
            title="Cetak Laporan Rekapitulasi Kasir PDF"
          >
            <Printer size={14} />
            <span>Cetak Rekap Kasir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Total Penjualan & Ringkasan Laci */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Penjualan Kasir */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
              Total Penjualan
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <h3 className="text-base sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2">
            {formatRupiah(totalSales)}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
            {totalTransactionsCount} struk nota selesai
          </p>
        </div>

        {/* Uang Tunai di Laci Kasir */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-emerald-800 font-bold uppercase tracking-wider">
              Fisik Laci (Tunai)
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote size={16} />
            </div>
          </div>
          <h3 className="text-base sm:text-2xl font-black text-emerald-700 mt-1 sm:mt-2">
            {formatRupiah(netCashInDrawer)}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 mt-0.5">
            {cashStats.count} transaksi tunai (Cash in Register)
          </p>
        </div>

        {/* Non-Tunai / Digital */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
              Digital (Non-Tunai)
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <QrCode size={16} />
            </div>
          </div>
          <h3 className="text-base sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2">
            {formatRupiah(totalDigitalSales)}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
            {totalDigitalCount} transaksi (QRIS, Transfer, Debit)
          </p>
        </div>

        {/* Average Ticket Size */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
              Rata-rata Nota
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins size={16} />
            </div>
          </div>
          <h3 className="text-base sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2">
            {formatRupiah(averageTicket)}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
            Rata-rata per pelanggan
          </p>
        </div>
      </div>

      {/* SECTION: PEMISAHAN METODE PEMBAYARAN SECARA TERPISAH (4 Cards) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Pemisahan Penjualan Berdasarkan Kategori Metode Pembayaran
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Rincian komparasi arus kas masuk: Tunai fisik laci, QRIS dinamis, transfer bank, dan kartu debit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. TUNAI */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Banknote size={16} />
                  </span>
                  <span className="font-black text-xs text-emerald-950 uppercase">1. TUNAI (CASH)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900">
                  {cashStats.percentage}%
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs text-slate-500">Total Omset Tunai:</span>
                <p className="text-xl font-black text-emerald-700">{formatRupiah(cashStats.amount)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Jumlah Transaksi:</span>
                <span className="font-bold text-slate-900">{cashStats.count} nota</span>
              </div>
              <div className="flex justify-between">
                <span>Uang Diterima:</span>
                <span className="font-bold text-slate-900">{formatRupiah(totalCashReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Kembalian:</span>
                <span className="font-bold text-slate-900">-{formatRupiah(totalChangeGiven)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-emerald-200/40">
                <span>Net Fisik Laci:</span>
                <span>{formatRupiah(netCashInDrawer)}</span>
              </div>
            </div>
          </div>

          {/* 2. QRIS */}
          <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/50 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-amber-200 text-amber-900 rounded-lg">
                    <QrCode size={16} />
                  </span>
                  <span className="font-black text-xs text-amber-950 uppercase">2. QRIS DINAMIS</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                  {qrisStats.percentage}%
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs text-slate-600">Total Omset QRIS:</span>
                <p className="text-xl font-black text-amber-700">{formatRupiah(qrisStats.amount)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/80 text-[11px] text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>Jumlah Transaksi:</span>
                <span className="font-bold text-slate-900">{qrisStats.count} nota</span>
              </div>
              <div className="flex justify-between">
                <span>Status Dana:</span>
                <span className="font-bold text-amber-800">Bank Settlement</span>
              </div>
              <div className="flex justify-between">
                <span>Kanal Pembayaran:</span>
                <span className="font-bold text-slate-900">BCA/GoPay/Dana</span>
              </div>
            </div>
          </div>

          {/* 3. TRANSFER BANK */}
          <div className="p-4 rounded-2xl border border-slate-300 bg-slate-50 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-slate-200 text-slate-800 rounded-lg">
                    <Building2 size={16} />
                  </span>
                  <span className="font-black text-xs text-slate-900 uppercase">3. TRANSFER BANK</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">
                  {transferStats.percentage}%
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs text-slate-600">Total Omset Transfer:</span>
                <p className="text-xl font-black text-slate-900">{formatRupiah(transferStats.amount)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>Jumlah Transaksi:</span>
                <span className="font-bold text-slate-900">{transferStats.count} nota</span>
              </div>
              <div className="flex justify-between">
                <span>Status Dana:</span>
                <span className="font-bold text-slate-800">Rekening Usaha</span>
              </div>
              <div className="flex justify-between">
                <span>Rekening Tujuan:</span>
                <span className="font-bold text-slate-900">BCA / Mandiri</span>
              </div>
            </div>
          </div>

          {/* 4. KARTU DEBIT */}
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50/40 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-red-100 text-red-800 rounded-lg">
                    <CreditCard size={16} />
                  </span>
                  <span className="font-black text-xs text-red-950 uppercase">4. KARTU DEBIT</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-200 text-red-900">
                  {debitStats.percentage}%
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs text-slate-600">Total Omset Debit:</span>
                <p className="text-xl font-black text-red-700">{formatRupiah(debitStats.amount)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-red-200/60 text-[11px] text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>Jumlah Transaksi:</span>
                <span className="font-bold text-slate-900">{debitStats.count} nota</span>
              </div>
              <div className="flex justify-between">
                <span>Kliring:</span>
                <span className="font-bold text-red-800">Mesin EDC Toko</span>
              </div>
              <div className="flex justify-between">
                <span>Kartu:</span>
                <span className="font-bold text-slate-900">GPN / Visa / Master</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: TABEL TRANSAKSI KASIR DETAIL */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Method Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['Semua', 'TUNAI', 'QRIS', 'TRANSFER', 'DEBIT'] as const).map(m => (
              <button
                key={m}
                onClick={() => setSelectedMethodFilter(m)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                  selectedMethodFilter === m
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m === 'Semua' ? 'Semua Metode' : m}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Cari nota atau kasir..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] sm:text-[10px]">
                <th className="pb-3 px-2">No. Nota</th>
                <th className="pb-3 px-2">Waktu</th>
                <th className="pb-3 px-2">Kasir Bertugas</th>
                <th className="pb-3 px-2">Pelanggan</th>
                <th className="pb-3 px-2">Metode Bayar</th>
                <th className="pb-3 px-2 text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada transaksi kasir pada filter ini.
                  </td>
                </tr>
              ) : (
                displayedTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-900">{t.invoiceNo}</td>
                    <td className="py-2.5 px-2 text-slate-500 text-[11px]">{formatDateTime(t.date)}</td>
                    <td className="py-2.5 px-2 font-medium text-slate-800">{t.cashierName}</td>
                    <td className="py-2.5 px-2 text-slate-700">{t.customer} ({t.orderType})</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.paymentMethod === 'TUNAI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.paymentMethod === 'QRIS'
                          ? 'bg-amber-100 text-amber-800'
                          : t.paymentMethod === 'TRANSFER'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-black text-slate-900">
                      {formatRupiah(t.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
