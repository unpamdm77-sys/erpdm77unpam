import { jsPDF } from 'jspdf';

/**
 * PDF Template Generator for Dimsum Mentai 77 UNPAM
 * Creates clean, professional, print-ready PDF form templates for:
 * 1. Bahan Baku & Stock Opname
 * 2. Menu Dimsum & Resep HPP (BOM)
 * 3. Surat Jalan / Faktur Pembelian Bahan (Purchasing PO)
 * 4. Catatan Pengeluaran Beban Operasional Kasir
 * 5. Rekap Transaksi Penjualan Kasir
 */

const addHeader = (doc: jsPDF, title: string, subtitle: string) => {
  // Brand Header Banner
  doc.setFillColor(220, 38, 38); // Red-600
  doc.rect(14, 12, 182, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DIMSUM MENTAI 77 — OUTLET UNPAM (UNIVERSITAS PAMULANG)', 20, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem ERP & POS Terintegrasi Cloud • Formulir Standar Operasional', 20, 28);

  // Document Title
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 43);

  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 48);

  // Meta Info box
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(14, 52, 182, 12, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text('Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }), 20, 60);
  doc.text('Petugas / Supervisor: .....................................................', 105, 60);
};

const addFooter = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.height || 297;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 20, 196, pageHeight - 20);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen template resmi Dimsum Mentai 77 UNPAM. Data formulir ini dapat diinput ke sistem via menu Import Data Excel/PDF.', 14, pageHeight - 14);

  // Signatures
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Diverifikasi Oleh (Supervisor / Finance):', 14, pageHeight - 28);
  doc.line(14, pageHeight - 24, 75, pageHeight - 24);

  doc.text('Disetujui Oleh (Owner):', 130, pageHeight - 28);
  doc.line(130, pageHeight - 24, 185, pageHeight - 24);
};

/**
 * 1. Template PDF: Bahan Baku & Stock Opname
 */
export const generateMaterialPdfTemplate = () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(
    doc,
    'FORMULIR MASTER BAHAN BAKU & STOCK OPNAME FISIK',
    'Gunakan formulir ini untuk pengecekan stok fisik gudang atau import data bahan baku baru ke ERP.'
  );

  // Table Headers
  const startY = 70;
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.rect(14, startY, 182, 8, 'F');
  doc.setDrawColor(191, 219, 254); // Blue-200
  doc.rect(14, startY, 182, 8, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text('KODE', 17, startY + 5.5);
  doc.text('NAMA BAHAN BAKU', 38, startY + 5.5);
  doc.text('KATEGORI', 85, startY + 5.5);
  doc.text('STOK FISIK', 118, startY + 5.5);
  doc.text('SATUAN', 140, startY + 5.5);
  doc.text('HARGA MODAL (RP)', 158, startY + 5.5);

  // Pre-filled & blank rows for recording
  const sampleRows = [
    { code: 'ING-01', name: 'Dimsum Ayam Beku (Frozen)', cat: 'Bahan Inti', stock: '250', unit: 'pcs', cost: '1.200' },
    { code: 'ING-02', name: 'Saus Mentai Special 77', cat: 'Saus & Bumbu', stock: '2.500', unit: 'gram', cost: '85' },
    { code: 'ING-03', name: 'Keju Mozzarella Grated', cat: 'Topping', stock: '1.200', unit: 'gram', cost: '120' },
    { code: 'ING-04', name: 'Tobiko Orange (Telur Ikan)', cat: 'Topping', stock: '500', unit: 'gram', cost: '150' },
    { code: 'ING-05', name: 'Nori Seaweed Bubuk', cat: 'Topping', stock: '300', unit: 'gram', cost: '90' },
    { code: 'ING-06', name: 'Mika / Lunchbox Dimsum', cat: 'Packaging', stock: '180', unit: 'pcs', cost: '650' },
    { code: 'ING-07', name: 'Sumpit Bambu Steril', cat: 'Packaging', stock: '200', unit: 'pasang', cost: '250' },
    { code: 'ING-08', name: 'Gas Butane Can Torch', cat: 'Operasional', stock: '6', unit: 'kaleng', cost: '18.000' },
    { code: 'ING-09', name: 'Chili Oil Botol Racikan', cat: 'Saus & Bumbu', stock: '1.500', unit: 'ml', cost: '60' },
    { code: 'ING-10', name: 'Bahan Baku Tambahan (Isi di sini)', cat: 'Pilih Kategori', stock: '......', unit: '......', cost: '......' },
    { code: 'ING-11', name: 'Bahan Baku Tambahan (Isi di sini)', cat: 'Pilih Kategori', stock: '......', unit: '......', cost: '......' },
    { code: 'ING-12', name: 'Bahan Baku Tambahan (Isi di sini)', cat: 'Pilih Kategori', stock: '......', unit: '......', cost: '......' },
    { code: 'ING-13', name: 'Bahan Baku Tambahan (Isi di sini)', cat: 'Pilih Kategori', stock: '......', unit: '......', cost: '......' },
    { code: 'ING-14', name: 'Bahan Baku Tambahan (Isi di sini)', cat: 'Pilih Kategori', stock: '......', unit: '......', cost: '......' },
  ];

  let currentY = startY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  sampleRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 8.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 8.5, 'D');

    doc.setFont('courier', 'bold');
    doc.text(row.code, 17, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(row.name, 38, currentY + 5.5);
    doc.text(row.cat, 85, currentY + 5.5);
    doc.text(row.stock, 122, currentY + 5.5);
    doc.text(row.unit, 142, currentY + 5.5);
    doc.text(row.cost, 162, currentY + 5.5);

    currentY += 8.5;
  });

  addFooter(doc);
  doc.save('TEMPLATE_FORMULIR_BAHAN_BAKU_DIMSUM77.pdf');
};

/**
 * 2. Template PDF: Menu Dimsum & BOM Resep
 */
export const generateMenuPdfTemplate = () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(
    doc,
    'FORMULIR KATALOG MENU & BILL OF MATERIALS (BOM RESEP)',
    'Formulir pendaftaran menu baru dan komposisi bahan baku per porsi untuk kalkulasi HPP otomatis.'
  );

  const startY = 70;
  doc.setFillColor(239, 246, 255);
  doc.rect(14, startY, 182, 8, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.rect(14, startY, 182, 8, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('KODE MENU', 17, startY + 5.5);
  doc.text('NAMA MENU DIMSUM', 45, startY + 5.5);
  doc.text('KATEGORI', 100, startY + 5.5);
  doc.text('HARGA JUAL (RP)', 132, startY + 5.5);
  doc.text('EST. HPP (RP)', 164, startY + 5.5);

  const menuRows = [
    { code: 'DM-01', name: 'Dimsum Mentai Original (Isi 4)', cat: 'Dimsum Mentai', price: '20.000', hpp: '8.450' },
    { code: 'DM-02', name: 'Dimsum Mentai Mozzarella Melt', cat: 'Dimsum Mentai', price: '25.000', hpp: '11.200' },
    { code: 'DM-03', name: 'Dimsum Mentai Nori Crunch', cat: 'Dimsum Mentai', price: '22.000', hpp: '9.350' },
    { code: 'DM-04', name: 'Dimsum Goreng Crispy Original', cat: 'Dimsum Goreng', price: '18.000', hpp: '7.100' },
    { code: 'DM-05', name: 'Dimsum Mentai Beef Special', cat: 'Dimsum Mentai', price: '26.000', hpp: '12.000' },
    { code: 'DM-06', name: 'Menu Baru Tambahan (Isi di sini)', cat: 'Pilih Kategori', price: '......', hpp: '......' },
    { code: 'DM-07', name: 'Menu Baru Tambahan (Isi di sini)', cat: 'Pilih Kategori', price: '......', hpp: '......' },
  ];

  let currentY = startY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  menuRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 8.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 8.5, 'D');

    doc.setFont('courier', 'bold');
    doc.text(row.code, 17, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(row.name, 45, currentY + 5.5);
    doc.text(row.cat, 100, currentY + 5.5);
    doc.text(row.price, 135, currentY + 5.5);
    doc.text(row.hpp, 166, currentY + 5.5);

    currentY += 8.5;
  });

  // Second table: BOM recipe breakdown instructions
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text('KOMPOSISI TAKARAN RESEP (BILL OF MATERIALS) PER PORSI:', 14, currentY);

  currentY += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, currentY, 182, 7, 'D');

  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('KODE MENU', 17, currentY + 5);
  doc.text('KODE BAHAN', 50, currentY + 5);
  doc.text('NAMA BAHAN BAKU', 85, currentY + 5);
  doc.text('TAKARAN (QTY)', 140, currentY + 5);
  doc.text('SATUAN', 170, currentY + 5);

  currentY += 7;
  const sampleBom = [
    { menuCode: 'DM-01', matCode: 'ING-01', matName: 'Dimsum Ayam Beku', qty: '4', unit: 'pcs' },
    { menuCode: 'DM-01', matCode: 'ING-02', matName: 'Saus Mentai Special 77', qty: '35', unit: 'gram' },
    { menuCode: 'DM-01', matCode: 'ING-04', matName: 'Tobiko Orange', qty: '5', unit: 'gram' },
    { menuCode: 'DM-01', matCode: 'ING-06', matName: 'Mika Lunchbox', qty: '1', unit: 'pcs' },
    { menuCode: 'DM-01', matCode: 'ING-07', matName: 'Sumpit Bambu', qty: '1', unit: 'pasang' },
    { menuCode: 'DM-02', matCode: 'ING-03', matName: 'Keju Mozzarella Grated', qty: '20', unit: 'gram' },
  ];

  sampleBom.forEach((b, idx) => {
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 7, 'D');
    doc.setFont('courier', 'normal');
    doc.text(b.menuCode, 17, currentY + 5);
    doc.text(b.matCode, 50, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(b.matName, 85, currentY + 5);
    doc.text(b.qty, 145, currentY + 5);
    doc.text(b.unit, 170, currentY + 5);
    currentY += 7;
  });

  addFooter(doc);
  doc.save('TEMPLATE_FORMULIR_MENU_BOM_DIMSUM77.pdf');
};

/**
 * 3. Template PDF: Purchasing Restock & Surat Jalan
 */
export const generatePurchasingPdfTemplate = () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(
    doc,
    'FORMULIR SURAT PESANAN & BELANJA BAHAN (PURCHASING PO)',
    'Formulir penerimaan barang masuk supplier, verifikasi invoice, dan penyesuaian belanja restock.'
  );

  const startY = 70;
  doc.setFillColor(239, 246, 255);
  doc.rect(14, startY, 182, 8, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.rect(14, startY, 182, 8, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('NO. PO', 17, startY + 5.5);
  doc.text('TANGGAL', 42, startY + 5.5);
  doc.text('SUPPLIER', 65, startY + 5.5);
  doc.text('BAHAN BAKU', 105, startY + 5.5);
  doc.text('QTY', 140, startY + 5.5);
  doc.text('HARGA/SATUAN', 152, startY + 5.5);
  doc.text('TOTAL (RP)', 175, startY + 5.5);

  const poRows = [
    { po: 'PO-2026-001', date: '01/11/2026', sup: 'Supplier Frozen UNPAM', mat: 'Dimsum Ayam Beku', qty: '500 pcs', price: '1.200', total: '600.000' },
    { po: 'PO-2026-002', date: '02/11/2026', sup: 'CV Mentai Rasa Jaya', mat: 'Saus Mentai 77 Special', qty: '5 kg', price: '85.000', total: '425.000' },
    { po: 'PO-2026-003', date: '03/11/2026', sup: 'Toko Plastik Pamulang', mat: 'Mika / Lunchbox', qty: '300 pcs', price: '650', total: '195.000' },
    { po: 'PO-2026-004', date: '04/11/2026', sup: 'Toko Gas Pamulang', mat: 'Gas Butane Can Torch', qty: '12 klg', price: '18.000', total: '216.000' },
    { po: 'PO-2026-005', date: '.../.../2026', sup: '...............................', mat: '............................', qty: '.......', price: '.......', total: '.......' },
    { po: 'PO-2026-006', date: '.../.../2026', sup: '...............................', mat: '............................', qty: '.......', price: '.......', total: '.......' },
    { po: 'PO-2026-007', date: '.../.../2026', sup: '...............................', mat: '............................', qty: '.......', price: '.......', total: '.......' },
    { po: 'PO-2026-008', date: '.../.../2026', sup: '...............................', mat: '............................', qty: '.......', price: '.......', total: '.......' },
  ];

  let currentY = startY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  poRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 8.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 8.5, 'D');

    doc.setFont('courier', 'bold');
    doc.text(row.po, 17, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(row.date, 42, currentY + 5.5);
    doc.text(row.sup, 65, currentY + 5.5);
    doc.text(row.mat, 105, currentY + 5.5);
    doc.text(row.qty, 138, currentY + 5.5);
    doc.text(row.price, 153, currentY + 5.5);
    doc.text(row.total, 175, currentY + 5.5);

    currentY += 8.5;
  });

  addFooter(doc);
  doc.save('TEMPLATE_FORMULIR_PURCHASING_PO_DIMSUM77.pdf');
};

/**
 * 4. Template PDF: Catatan Beban Operasional Kasir
 */
export const generateExpensePdfTemplate = () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(
    doc,
    'FORMULIR PENGELUARAN BEBAN OPERASIONAL KASIR',
    'Catatan bukti kas keluar (voucher kas kecil) untuk operasional, gas LPG, es batu, listrik, dll.'
  );

  const startY = 70;
  doc.setFillColor(239, 246, 255);
  doc.rect(14, startY, 182, 8, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.rect(14, startY, 182, 8, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('NO. BUKTI', 17, startY + 5.5);
  doc.text('TANGGAL', 42, startY + 5.5);
  doc.text('NAMA PENGELUARAN', 65, startY + 5.5);
  doc.text('KATEGORI BEBAN', 115, startY + 5.5);
  doc.text('NOMINAL (RP)', 148, startY + 5.5);
  doc.text('PARAF', 178, startY + 5.5);

  const expRows = [
    { no: 'EXP-001', date: '01/11/2026', name: 'Gas LPG 3kg untuk Kukusan', cat: 'Gas LPG', amount: '22.000' },
    { no: 'EXP-002', date: '02/11/2026', name: 'Es Batu Kristal 1 Karung', cat: 'Operasional', amount: '15.000' },
    { no: 'EXP-003', date: '03/11/2026', name: 'Token Listrik Booth Outlet', cat: 'Listrik & Air', amount: '50.000' },
    { no: 'EXP-004', date: '04/11/2026', name: 'Kebersihan & Keamanan UNPAM', cat: 'Kebersihan', amount: '20.000' },
    { no: 'EXP-005', date: '05/11/2026', name: 'Sewa Gerobak / Tempat Mingguan', cat: 'Sewa Tempat', amount: '250.000' },
    { no: 'EXP-006', date: '.../.../2026', name: '..............................................', cat: '....................', amount: '................' },
    { no: 'EXP-007', date: '.../.../2026', name: '..............................................', cat: '....................', amount: '................' },
    { no: 'EXP-008', date: '.../.../2026', name: '..............................................', cat: '....................', amount: '................' },
    { no: 'EXP-009', date: '.../.../2026', name: '..............................................', cat: '....................', amount: '................' },
  ];

  let currentY = startY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  expRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 8.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 8.5, 'D');

    doc.setFont('courier', 'bold');
    doc.text(row.no, 17, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(row.date, 42, currentY + 5.5);
    doc.text(row.name, 65, currentY + 5.5);
    doc.text(row.cat, 115, currentY + 5.5);
    doc.text(row.amount, 150, currentY + 5.5);
    doc.text('........', 180, currentY + 5.5);

    currentY += 8.5;
  });

  addFooter(doc);
  doc.save('TEMPLATE_FORMULIR_BIAYA_OPERASIONAL_DIMSUM77.pdf');
};
