import { jsPDF } from 'jspdf';
import { Transaction, Expense } from '../types/erp';
import { formatRupiah } from './formatters';

interface FinancePdfData {
  periodLabel: string;
  transactions: Transaction[];
  expenses: Expense[];
  grossSales: number;
  totalDiscounts: number;
  netRevenue: number;
  totalHpp: number;
  grossProfit: number;
  grossMarginPercent: number;
  totalOperatingExpenses: number;
  netProfit: number;
  netMarginPercent: number;
  printedBy?: string;
}

export const generateExecutiveFinancePdf = (data: FinancePdfData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. TOP HEADER BRAND BANNER (Dimsum 77 Brand Red)
  doc.setFillColor(220, 38, 38); // Red-600
  doc.rect(14, 12, 182, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DIMSUM MENTAI 77 — OUTLET UNPAM (UNIVERSITAS PAMULANG)', 20, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Keuangan Eksekutif & Laba Rugi (Profit & Loss Statement)', 20, 28);
  doc.setFontSize(8);
  doc.text('Jl. Pamulang Permai 1, Samping Gapura, Kec. Pamulang, Tangsel • WA: 0819-9645-1323', 20, 33);

  // 2. DOCUMENT TITLE & PERIODE INFO BOX
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN LABA RUGI & ARUS KEUANGAN OPERASIONAL', 14, 44);

  // Meta Pill Box
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(14, 48, 182, 10, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Periode: ${data.periodLabel.toUpperCase()}`, 18, 54.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`, 85, 54.5);
  doc.text(`Otorisasi: ${data.printedBy || 'Owner / Finance'}`, 145, 54.5);

  // 3. EXECUTIVE KPI SUMMARY CARDS (4 Columns)
  const cardY = 62;
  const cardW = 43;
  const cardH = 20;
  const gap = 3.3;

  // Card 1: Penjualan Bersih
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.setDrawColor(191, 219, 254); // Blue-200
  doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PENJUALAN BERSIH', 17, cardY + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(formatRupiah(data.netRevenue), 17, cardY + 11.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.transactions.length} Transaksi Sukses`, 17, cardY + 16.5);

  // Card 2: HPP Bahan Baku
  const card2X = 14 + cardW + gap;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('HPP BAHAN BAKU', card2X + 3, cardY + 5.5);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.text(formatRupiah(data.totalHpp), card2X + 3, cardY + 11.5);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('BOM Recipe Cost', card2X + 3, cardY + 16.5);

  // Card 3: Laba Kotor
  const card3X = card2X + cardW + gap;
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(167, 243, 208); // Emerald-200
  doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setTextColor(4, 120, 87);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('LABA KOTOR (GROSS)', card3X + 3, cardY + 5.5);
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(9.5);
  doc.text(formatRupiah(data.grossProfit), card3X + 3, cardY + 11.5);
  doc.setFontSize(6.5);
  doc.text(`Margin: ${data.grossMarginPercent}%`, card3X + 3, cardY + 16.5);

  // Card 4: Laba Bersih (Green if >= 0, Red if < 0)
  const card4X = card3X + cardW + gap;
  const isNetPositive = data.netProfit >= 0;
  if (isNetPositive) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
  }
  doc.roundedRect(card4X, cardY, cardW, cardH, 2, 2, 'FD');
  
  if (isNetPositive) {
    doc.setTextColor(4, 120, 87);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('LABA BERSIH (NET)', card4X + 3, cardY + 5.5);

  if (isNetPositive) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.setFontSize(9.5);
  doc.text(formatRupiah(data.netProfit), card4X + 3, cardY + 11.5);
  doc.setFontSize(6.5);
  doc.text(`Net Margin: ${data.netMarginPercent}%`, card4X + 3, cardY + 16.5);

  // 4. SECTION: LAPORAN LABA RUGI DETAIL (TABLE)
  let tableY = cardY + cardH + 7;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Rincian Laporan Laba Rugi (P&L)', 14, tableY);

  tableY += 3;
  // Header Table
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(14, tableY, 182, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('KOMPONEN KEUANGAN', 18, tableY + 4.5);
  doc.text('KETERANGAN PERHITUNGAN', 90, tableY + 4.5);
  doc.text('NOMINAL (RP)', 160, tableY + 4.5);

  tableY += 6.5;

  const plRows = [
    { label: 'Penjualan Kotor (Gross Sales)', desc: 'Total nilai transaksi sebelum potongan harga diskon', amount: formatRupiah(data.grossSales), type: 'normal' },
    { label: '(-) Diskon Promo Kasir', desc: 'Potongan harga voucher & diskon kasir langsung', amount: `-${formatRupiah(data.totalDiscounts)}`, type: 'sub' },
    { label: '(=) Penjualan Bersih (Net Revenue)', desc: 'Pendapatan riil masuk ke kas/rekening toko', amount: formatRupiah(data.netRevenue), type: 'bold' },
    { label: '(-) Harga Pokok Penjualan (HPP BOM)', desc: 'Biaya bahan baku ayam, saus mentai, nori, keju, kemasan', amount: `-${formatRupiah(data.totalHpp)}`, type: 'sub' },
    { label: '(=) LABA KOTOR (GROSS PROFIT)', desc: `Margin Kotor: ${data.grossMarginPercent}% dari penjualan bersih`, amount: formatRupiah(data.grossProfit), type: 'highlight-green' },
    { label: '(-) Beban Pengeluaran Operasional', desc: 'Gas LPG, listrik, sewa tempat, gaji, operasional harian', amount: `-${formatRupiah(data.totalOperatingExpenses)}`, type: 'sub' },
    {
      label: '(=) LABA BERSIH OPERASIONAL (NET PROFIT)',
      desc: `Net Margin: ${data.netMarginPercent}% ${data.netProfit >= 0 ? 'keuntungan bersih toko' : 'defisit / rugi operasional'}`,
      amount: formatRupiah(data.netProfit),
      type: data.netProfit >= 0 ? 'highlight-green' : 'highlight-red'
    },
  ];

  doc.setFontSize(7.5);
  plRows.forEach((row, i) => {
    const isEven = i % 2 === 1;
    if (row.type === 'highlight-red') {
      doc.setFillColor(254, 242, 242);
      doc.rect(14, tableY, 182, 7, 'F');
    } else if (row.type === 'highlight-green') {
      doc.setFillColor(236, 253, 245);
      doc.rect(14, tableY, 182, 7, 'F');
    } else if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, tableY, 182, 6.5, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, tableY + 6.5, 196, tableY + 6.5);

    if (row.type === 'highlight-green') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
    } else if (row.type === 'highlight-red') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(190, 18, 60);
    } else if (row.type === 'bold') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
    }

    doc.text(row.label, 18, tableY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(row.desc, 90, tableY + 4.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    if (row.type === 'highlight-green') {
      doc.setTextColor(5, 150, 105);
    } else if (row.type === 'highlight-red' || row.type === 'sub') {
      doc.setTextColor(225, 29, 72);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(row.amount, 160, tableY + 4.5);
    doc.setFontSize(7.5);

    tableY += row.type.startsWith('highlight') ? 7 : 6.5;
  });

  // 5. SECTION: BREAKDOWN BEBAN OPERASIONAL (TABLE)
  tableY += 6;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Rincian Pengeluaran Beban Operasional', 14, tableY);

  tableY += 3;
  // Expense table header
  doc.setFillColor(30, 41, 59);
  doc.rect(14, tableY, 182, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('KATEGORI BEBAN', 18, tableY + 4.5);
  doc.text('JUMLAH PENGELUARAN', 90, tableY + 4.5);
  doc.text('TOTAL BIAYA (RP)', 160, tableY + 4.5);

  tableY += 6.5;

  // Group expenses by category
  const expenseCatMap: Record<string, { count: number; total: number }> = {};
  data.expenses.forEach(e => {
    if (!expenseCatMap[e.category]) {
      expenseCatMap[e.category] = { count: 0, total: 0 };
    }
    expenseCatMap[e.category].count++;
    expenseCatMap[e.category].total += e.amount;
  });

  const catEntries = Object.entries(expenseCatMap);
  if (catEntries.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(14, tableY, 182, 6.5, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Tidak ada catatan beban pengeluaran operasional pada periode ini.', 18, tableY + 4.5);
    tableY += 6.5;
  } else {
    catEntries.forEach(([cat, val], idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, tableY, 182, 6, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(14, tableY + 6, 196, tableY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(cat, 18, tableY + 4.2);
      doc.setTextColor(100, 116, 139);
      doc.text(`${val.count} kali transaksi pengeluaran`, 90, tableY + 4.2);
      doc.setFont('courier', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text(formatRupiah(val.total), 160, tableY + 4.2);

      tableY += 6;
    });

    // Total expense row
    doc.setFillColor(254, 242, 242);
    doc.rect(14, tableY, 182, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(159, 18, 57);
    doc.text('TOTAL BEBAN OPERASIONAL', 18, tableY + 4.5);
    doc.text(`${data.expenses.length} Catatan Beban`, 90, tableY + 4.5);
    doc.setFont('courier', 'bold');
    doc.text(formatRupiah(data.totalOperatingExpenses), 160, tableY + 4.5);
    tableY += 6.5;
  }

  // 6. SECTION: REKAPITULASI METODE PEMBAYARAN KASIR
  tableY += 6;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Rekapitulasi Penerimaan Kas per Metode Pembayaran', 14, tableY);

  tableY += 3;
  // Payment table header
  doc.setFillColor(30, 41, 59);
  doc.rect(14, tableY, 182, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('METODE BAYAR', 18, tableY + 4.5);
  doc.text('VOLUME TRANSAKSI', 90, tableY + 4.5);
  doc.text('TOTAL DITERIMA (RP)', 160, tableY + 4.5);

  tableY += 6.5;

  const paymentMethods = ['TUNAI', 'QRIS', 'TRANSFER', 'DEBIT'] as const;
  paymentMethods.forEach((method, idx) => {
    const methodTrx = data.transactions.filter(t => t.paymentMethod === method);
    const methodTotal = methodTrx.reduce((sum, t) => sum + t.total, 0);

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, tableY, 182, 6, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, tableY + 6, 196, tableY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(method === 'TUNAI' ? 16 : method === 'QRIS' ? 37 : 71, method === 'TUNAI' ? 185 : method === 'QRIS' ? 99 : 85, method === 'TUNAI' ? 129 : method === 'QRIS' ? 235 : 105);
    doc.text(method, 18, tableY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${methodTrx.length} Nota (${data.transactions.length > 0 ? Math.round((methodTrx.length / data.transactions.length) * 100) : 0}%)`, 90, tableY + 4.2);

    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(methodTotal), 160, tableY + 4.2);

    tableY += 6;
  });

  // 7. FOOTER & FORMAL SIGNATURES
  const signY = pageHeight - 34;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, signY - 4, 196, signY - 4);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  // Left Signature: Bagian Keuangan
  doc.text('Dibuat & Diverifikasi Oleh:', 22, signY);
  doc.setFont('helvetica', 'bold');
  doc.text('Bagian Keuangan / Finance SPV', 22, signY + 4);
  doc.line(22, signY + 18, 70, signY + 18);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('( Tanda Tangan & Nama Terang )', 22, signY + 22);

  // Right Signature: Owner
  doc.setFontSize(7.5);
  doc.text('Disetujui Oleh:', 140, signY);
  doc.setFont('helvetica', 'bold');
  doc.text('Owner Dimsum Mentai 77', 140, signY + 4);
  doc.line(140, signY + 18, 185, signY + 18);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('( Tanda Tangan & Cap Outlet )', 140, signY + 22);

  // Page footer note
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen ini digenerate secara otomatis oleh Sistem ERP Dimsum Mentai 77 UNPAM (Universitas Pamulang). Sah tanpa materai.', 14, pageHeight - 6);

  // Save PDF
  const sanitizedPeriod = data.periodLabel.replace(/\s+/g, '_').toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`LAPORAN_KEUANGAN_DIMSUM77_${sanitizedPeriod}_${dateStr}.pdf`);
};
