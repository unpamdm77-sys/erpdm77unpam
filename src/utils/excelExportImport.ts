import * as XLSX from 'xlsx';
import { Material, MenuItem, PurchaseOrder, Expense, Transaction, UnitType, RecipeIngredient } from '../types/erp';

// Export multiple sheets into a single complete Excel backup workbook
export function exportCompleteExcelWorkbook(
  transactions: Transaction[],
  purchases: PurchaseOrder[],
  expenses: Expense[],
  materials: Material[],
  menuItems: MenuItem[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Penjualan Sheet
  const salesRows = transactions.map(t => ({
    'ID Transaksi': t.invoiceNo,
    'Tanggal': t.date,
    'Pelanggan': t.customer,
    'Tipe Pesanan': t.orderType,
    'Metode': t.paymentMethod,
    'Items Ringkas': t.items.map(i => `${i.name} (x${i.qty})`).join(', '),
    'Subtotal': t.subtotal,
    'Diskon': t.discount,
    'Total': t.total,
    'Total HPP': t.totalHpp,
    'Laba Kotor': t.grossProfit,
    'Status': t.status,
    'Kasir': t.cashierName
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Penjualan');

  // 2. Pembelian Stok Sheet
  const purchaseRows = purchases.map(p => ({
    'ID PO': p.poNumber,
    'Tanggal': p.date,
    'Supplier': p.supplier,
    'Bahan': p.materialName,
    'Qty': p.qty,
    'Satuan': p.unit,
    'Harga Satuan': p.unitPrice,
    'Total Biaya': p.total,
    'Status Bayar': p.paymentStatus,
    'Catatan': p.notes || ''
  }));
  const wsPurchases = XLSX.utils.json_to_sheet(purchaseRows);
  XLSX.utils.book_append_sheet(wb, wsPurchases, 'Pembelian_Stok');

  // 3. Pengeluaran Non-Stok Sheet
  const expenseRows = expenses.map(e => ({
    'ID Expense': e.expenseNo,
    'Tanggal': e.date,
    'Nama Beban': e.name,
    'Kategori': e.category,
    'Nominal Biaya': e.amount,
    'Catatan': e.notes || ''
  }));
  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran_NonStok');

  // 4. Stok Bahan Baku
  const materialRows = materials.map(m => ({
    'Kode Bahan': m.code,
    'Nama Bahan': m.name,
    'Kategori': m.category,
    'Stok Saat Ini': m.stock,
    'Satuan': m.unit,
    'Batas Min': m.minStock,
    'Harga Beli Rata-Rata': m.costPerUnit,
    'Total Nilai Stok': m.stock * m.costPerUnit,
    'Supplier': m.supplier || '',
    'Status': m.stock <= 0 ? 'HABIS' : m.stock <= m.minStock ? 'MENIPIS' : 'AMAN'
  }));
  const wsMaterials = XLSX.utils.json_to_sheet(materialRows);
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'Stok_Bahan_Baku');

  // 5. Menu Dimsum
  const menuRows = menuItems.map(m => ({
    'Kode Menu': m.code,
    'Kategori': (m.categories && m.categories.length > 0) ? m.categories.join(', ') : m.category,
    'Harga Jual': m.price,
    'Jumlah Bahan BOM': m.recipe.length,
    'Status Aktif': m.isAvailable ? 'Ya' : 'Tidak',
    'Deskripsi': m.description
  }));
  const wsMenu = XLSX.utils.json_to_sheet(menuRows);
  XLSX.utils.book_append_sheet(wb, wsMenu, 'Menu_Dimsum');

  // 6. BOM (Bill of Materials / Resep Detail) Sheet
  const bomRows: any[] = [];
  menuItems.forEach(menu => {
    menu.recipe.forEach(ing => {
      const mat = materials.find(m => m.id === ing.materialId);
      bomRows.push({
        'Kode Menu': menu.code,
        'Nama Menu': menu.name,
        'Kode Bahan': mat ? mat.code : ing.materialId,
        'Nama Bahan': mat ? mat.name : 'Unknown',
        'Takaran Qty': ing.qty,
        'Satuan': mat ? mat.unit : 'pcs',
        'Estimasi Biaya': mat ? mat.costPerUnit * ing.qty : 0
      });
    });
  });
  const wsBOM = XLSX.utils.json_to_sheet(bomRows);
  XLSX.utils.book_append_sheet(wb, wsBOM, 'BOM_Resep');

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ERP_DIMSUM_MENTAI_77_${todayStr}.xlsx`);
}

// 1. Template Download: Bahan Baku (Stok Bahan)
export function downloadMaterialTemplate() {
  const sampleData = [
    {
      'Kode Bahan': 'B-14',
      'Nama Bahan': 'Saus Sambal Extra Pedas Sachet',
      'Kategori': 'Saus & Bumbu',
      'Stok': 500,
      'Satuan': 'pcs',
      'Batas Min': 100,
      'Harga Satuan': 350,
      'Supplier': 'Distributor Saus Pamulang'
    },
    {
      'Kode Bahan': 'B-15',
      'Nama Bahan': 'Bawang Goreng Brebes Renyah',
      'Kategori': 'Topping & Keju',
      'Stok': 1000,
      'Satuan': 'gr',
      'Batas Min': 200,
      'Harga Satuan': 65,
      'Supplier': 'Pasar Ciputat'
    },
    {
      'Kode Bahan': 'B-16',
      'Nama Bahan': 'Daging Sapi Slice (Beef Yakiniku)',
      'Kategori': 'Daging & Isian',
      'Stok': 500,
      'Satuan': 'gr',
      'Batas Min': 150,
      'Harga Satuan': 140,
      'Supplier': 'Meat Mart Pamulang'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bahan_Baku');
  XLSX.writeFile(wb, 'Template_Import_Bahan_Baku_DIMSUM77.xlsx');
}

// 2. Template Download: Menu
export function downloadMenuTemplate() {
  const sampleData = [
    {
      'Kode Menu': 'DM-07',
      'Nama Menu': 'Dimsum Mentai Beef Slice (Isi 4)',
      'Kategori': 'Dimsum Mentai',
      'Harga Jual': 24000,
      'Deskripsi': 'Dimsum ayam lembut dengan topping slice beef bakar torch saus mentai gurih'
    },
    {
      'Kode Menu': 'MN-03',
      'Nama Menu': 'Es Kopi Susu Aren Mentai 77',
      'Kategori': 'Minuman',
      'Harga Jual': 12000,
      'Deskripsi': 'Kopi susu gula aren segar teman makan dimsum'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Menu');
  XLSX.writeFile(wb, 'Template_Import_Menu_DIMSUM77.xlsx');
}

// 3. Template Download: BOM (Bill of Materials / Resep)
export function downloadBOMTemplate() {
  const sampleData = [
    {
      'Kode Menu': 'DM-01',
      'Nama Menu (Opsional)': 'Dimsum Mentai Original (Isi 4)',
      'Kode Bahan': 'B-01',
      'Nama Bahan (Opsional)': 'Dimsum Ayam Kukus Mentah (Pcs)',
      'Jumlah Takaran (Qty)': 4
    },
    {
      'Kode Menu': 'DM-01',
      'Nama Menu (Opsional)': 'Dimsum Mentai Original (Isi 4)',
      'Kode Bahan': 'B-03',
      'Nama Bahan (Opsional)': 'Saus Mayonaise Mentai Racikan 77',
      'Jumlah Takaran (Qty)': 35
    },
    {
      'Kode Menu': 'DM-01',
      'Nama Menu (Opsional)': 'Dimsum Mentai Original (Isi 4)',
      'Kode Bahan': 'B-04',
      'Nama Bahan (Opsional)': 'Tobiko Orange (Telur Ikan Terbang)',
      'Jumlah Takaran (Qty)': 4
    },
    {
      'Kode Menu': 'DM-01',
      'Nama Menu (Opsional)': 'Dimsum Mentai Original (Isi 4)',
      'Kode Bahan': 'B-08',
      'Nama Bahan (Opsional)': 'Mika Box Bento Dimsum + Tutup',
      'Jumlah Takaran (Qty)': 1
    },
    {
      'Kode Menu': 'DM-01',
      'Nama Menu (Opsional)': 'Dimsum Mentai Original (Isi 4)',
      'Kode Bahan': 'B-09',
      'Nama Bahan (Opsional)': 'Sumpit Bambu Steril + Tusukan',
      'Jumlah Takaran (Qty)': 1
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BOM_Resep');
  XLSX.writeFile(wb, 'Template_Import_BOM_Resep_DIMSUM77.xlsx');
}

// 4. Template Download: Purchasing PO Restock
export function downloadPurchasingTemplate() {
  const sampleData = [
    {
      'No. PO': 'PO-2026-001',
      'Tanggal': new Date().toISOString().slice(0, 10),
      'Supplier': 'Supplier Frozen UNPAM',
      'Kode / Nama Bahan': 'Dimsum Ayam Beku (Frozen)',
      'Qty Masuk': 500,
      'Satuan': 'pcs',
      'Harga Satuan': 1200,
      'Status Bayar': 'LUNAS',
      'Catatan': 'Faktur No. INV-78891'
    },
    {
      'No. PO': 'PO-2026-002',
      'Tanggal': new Date().toISOString().slice(0, 10),
      'Supplier': 'CV Mentai Rasa Jaya',
      'Kode / Nama Bahan': 'Saus Mentai Special 77',
      'Qty Masuk': 5000,
      'Satuan': 'gram',
      'Harga Satuan': 85,
      'Status Bayar': 'LUNAS',
      'Catatan': 'Batch exp. 2027'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pembelian_PO');
  XLSX.writeFile(wb, 'Template_Import_Purchasing_PO_DIMSUM77.xlsx');
}

// 5. Template Download: Beban Operasional Non-Stok
export function downloadExpenseTemplate() {
  const sampleData = [
    {
      'Nama Pengeluaran': 'Gas LPG 3kg untuk Kukusan',
      'Kategori': 'Gas LPG',
      'Tanggal': new Date().toISOString().slice(0, 10),
      'Nominal Biaya': 22000,
      'Catatan Operasional': 'Toko Gas Berkah Pamulang'
    },
    {
      'Nama Pengeluaran': 'Es Batu Kristal 1 Karung',
      'Kategori': 'Operasional',
      'Tanggal': new Date().toISOString().slice(0, 10),
      'Nominal Biaya': 15000,
      'Catatan Operasional': 'Depot Es Batu Pamulang'
    },
    {
      'Nama Pengeluaran': 'Token Listrik Booth Outlet',
      'Kategori': 'Listrik & Air',
      'Tanggal': new Date().toISOString().slice(0, 10),
      'Nominal Biaya': 50000,
      'Catatan Operasional': 'PLN No. Meter 142239'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Beban_Operasional');
  XLSX.writeFile(wb, 'Template_Import_Beban_Operasional_DIMSUM77.xlsx');
}

// 6. Master Template with 5 Comprehensive Sheets in One Workbook
export function downloadCompleteMasterTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Bahan_Baku
  const matSample = [
    { 'Kode Bahan': 'B-01', 'Nama Bahan': 'Dimsum Ayam Kukus Mentah (Pcs)', 'Kategori': 'Daging & Isian', 'Stok': 280, 'Satuan': 'pcs', 'Batas Min': 50, 'Harga Satuan': 1750, 'Supplier': 'Supplier Dimsum Fresh' },
    { 'Kode Bahan': 'B-03', 'Nama Bahan': 'Saus Mayonaise Mentai Racikan 77', 'Kategori': 'Saus & Bumbu', 'Stok': 3500, 'Satuan': 'gr', 'Batas Min': 800, 'Harga Satuan': 90, 'Supplier': 'Dapur Pusat' },
    { 'Kode Bahan': 'B-04', 'Nama Bahan': 'Tobiko Orange (Telur Ikan Terbang)', 'Kategori': 'Topping & Keju', 'Stok': 450, 'Satuan': 'gr', 'Batas Min': 100, 'Harga Satuan': 280, 'Supplier': 'Toko Bahari' },
    { 'Kode Bahan': 'B-08', 'Nama Bahan': 'Mika Box Bento Dimsum + Tutup', 'Kategori': 'Kemasan & Alat', 'Stok': 180, 'Satuan': 'pcs', 'Batas Min': 40, 'Harga Satuan': 650, 'Supplier': 'Toko Plastik UNPAM' },
    { 'Kode Bahan': 'B-09', 'Nama Bahan': 'Sumpit Bambu Steril + Tusukan', 'Kategori': 'Kemasan & Alat', 'Stok': 220, 'Satuan': 'pcs', 'Batas Min': 50, 'Harga Satuan': 200, 'Supplier': 'Toko Plastik UNPAM' }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matSample), 'Bahan_Baku');

  // Sheet 2: Menu
  const menuSample = [
    { 'Kode Menu': 'DM-01', 'Nama Menu': 'Dimsum Mentai Original (Isi 4)', 'Kategori': 'Dimsum Mentai', 'Harga Jual': 18000, 'Deskripsi': '4 Pcs dimsum ayam lembut disiram saus mentai gurih creamy' },
    { 'Kode Menu': 'MN-01', 'Nama Menu': 'Es Teh Manis Melati Jumbo', 'Kategori': 'Minuman', 'Harga Jual': 5000, 'Deskripsi': 'Teh melati wangi segar jumbo' }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(menuSample), 'Menu');

  // Sheet 3: BOM_Resep
  const bomSample = [
    { 'Kode Menu': 'DM-01', 'Kode Bahan': 'B-01', 'Jumlah Takaran (Qty)': 4 },
    { 'Kode Menu': 'DM-01', 'Kode Bahan': 'B-03', 'Jumlah Takaran (Qty)': 35 },
    { 'Kode Menu': 'DM-01', 'Kode Bahan': 'B-04', 'Jumlah Takaran (Qty)': 4 },
    { 'Kode Menu': 'DM-01', 'Kode Bahan': 'B-08', 'Jumlah Takaran (Qty)': 1 },
    { 'Kode Menu': 'DM-01', 'Kode Bahan': 'B-09', 'Jumlah Takaran (Qty)': 1 }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bomSample), 'BOM_Resep');

  // Sheet 4: Pembelian_PO
  const poSample = [
    { 'No. PO': 'PO-2026-001', 'Tanggal': new Date().toISOString().slice(0, 10), 'Supplier': 'Supplier Dimsum Fresh', 'Kode / Nama Bahan': 'Dimsum Ayam Kukus Mentah (Pcs)', 'Qty Masuk': 500, 'Satuan': 'pcs', 'Harga Satuan': 1750, 'Status Bayar': 'LUNAS', 'Catatan': 'Pengiriman Pagi' }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(poSample), 'Pembelian_PO');

  // Sheet 5: Beban_Operasional
  const expSample = [
    { 'Nama Pengeluaran': 'Gas LPG 3kg', 'Kategori': 'Gas LPG', 'Tanggal': new Date().toISOString().slice(0, 10), 'Nominal Biaya': 22000, 'Catatan Operasional': 'Warung Gas Pamulang' }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expSample), 'Beban_Operasional');

  XLSX.writeFile(wb, 'Master_Template_Lengkap_ERP_DIMSUM77.xlsx');
}

// Parse uploaded Excel or CSV file (supports multi-sheet inspection)
export async function parseExcelOrCsvWorkbook(file: File): Promise<{
  sheetNames: string[];
  sheets: Record<string, any[]>;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheets: Record<string, any[]> = {};

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
        });

        resolve({
          sheetNames: workbook.SheetNames,
          sheets
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// 1. Convert parsed rows into Material objects
export function mapRowsToMaterials(rows: any[], existingMaterials: Material[]): Material[] {
  const newMaterials: Material[] = [];

  rows.forEach((row, idx) => {
    const name = row['Nama Bahan'] || row['name'] || row['Nama'] || row['Bahan'];
    if (!name || String(name).trim() === '') return;

    const rawCode = row['Kode Bahan'] || row['Kode'] || row['code'];
    const code = rawCode ? String(rawCode).trim() : `B-${(existingMaterials.length + newMaterials.length + 1).toString().padStart(2, '0')}`;
    const category = (row['Kategori'] || row['category'] || 'Daging & Isian') as Material['category'];
    const stock = Number(row['Stok Fisik'] || row['Stok'] || row['stock'] || 0);
    const unit = (row['Satuan'] || row['unit'] || 'pcs').toString().toLowerCase().trim() as UnitType;
    const minStock = Number(row['Batas Minimum'] || row['Batas Min'] || row['minStock'] || 20);
    const costPerUnit = Number(row['Harga Beli Satuan'] || row['Harga Satuan'] || row['Harga Beli Rata-Rata'] || row['costPerUnit'] || 0);
    const supplier = row['Supplier'] || row['supplier'] || '';

    // Check if material with same code or name already exists
    const existing = existingMaterials.find(m => m.code.toLowerCase() === code.toLowerCase() || m.name.toLowerCase() === String(name).toLowerCase());

    newMaterials.push({
      id: existing ? existing.id : `mat-${Date.now()}-${idx}`,
      code,
      name: String(name).trim(),
      category,
      stock,
      unit: (['pcs', 'gr', 'kg', 'ml', 'liter', 'lembar', 'pack', 'porsi', 'botol'].includes(unit) ? unit : 'pcs') as UnitType,
      minStock,
      costPerUnit,
      supplier: String(supplier).trim(),
      lastUpdated: new Date().toISOString().slice(0, 10)
    });
  });

  return newMaterials;
}

// 2. Convert parsed rows into MenuItem objects
export function mapRowsToMenuItems(rows: any[], existingMenu: MenuItem[]): MenuItem[] {
  const newMenuItems: MenuItem[] = [];

  rows.forEach((row, idx) => {
    const name = row['Nama Menu'] || row['name'] || row['Nama'] || row['Menu'];
    if (!name || String(name).trim() === '') return;

    const rawCode = row['Kode Menu'] || row['Kode'] || row['code'];
    const code = rawCode ? String(rawCode).trim() : `DM-${(existingMenu.length + newMenuItems.length + 1).toString().padStart(2, '0')}`;
    const category = (row['Kategori'] || row['category'] || 'Dimsum Mentai') as MenuItem['category'];
    const price = Number(row['Harga Jual'] || row['Harga'] || row['price'] || 0);
    const description = row['Deskripsi'] || row['description'] || '';

    // Check if menu with same code or name already exists
    const existing = existingMenu.find(m => m.code.toLowerCase() === code.toLowerCase() || m.name.toLowerCase() === String(name).toLowerCase());

    newMenuItems.push({
      id: existing ? existing.id : `menu-${Date.now()}-${idx}`,
      code,
      name: String(name).trim(),
      category: (['Dimsum Mentai', 'Dimsum Goreng', 'Dimsum Kukus', 'Minuman', 'Frozen Pack', 'Extra Topping'].includes(category)
        ? category
        : 'Dimsum Mentai') as MenuItem['category'],
      price,
      description: String(description).trim(),
      recipe: existing ? existing.recipe : [],
      isAvailable: true
    });
  });

  return newMenuItems;
}

// 3. Convert parsed rows into BOM (Bill of Materials) recipes and attach them to Menu items
export function mapRowsToBOM(
  rows: any[],
  currentMenuItems: MenuItem[],
  currentMaterials: Material[]
): {
  updatedMenuItems: MenuItem[];
  matchedCount: number;
  unmatchedErrors: string[];
} {
  const recipeMap: Record<string, RecipeIngredient[]> = {};
  const unmatchedErrors: string[] = [];
  let matchedCount = 0;

  rows.forEach((row, idx) => {
    const menuIdent = String(row['Kode Menu'] || row['Nama Menu'] || row['menu'] || '').trim();
    const matIdent = String(row['Kode Bahan'] || row['Nama Bahan'] || row['bahan'] || row['material'] || '').trim();
    const qty = Number(row['Jumlah Takaran (Qty)'] || row['Qty'] || row['Takaran'] || row['qty'] || 0);

    if (!menuIdent || !matIdent || qty <= 0) {
      return;
    }

    // Match menu item by code or name
    const targetMenu = currentMenuItems.find(
      m => m.code.toLowerCase() === menuIdent.toLowerCase() || m.name.toLowerCase() === menuIdent.toLowerCase()
    );

    if (!targetMenu) {
      unmatchedErrors.push(`Baris ${idx + 2}: Menu "${menuIdent}" tidak ditemukan di database menu.`);
      return;
    }

    // Match material by code or name
    const targetMat = currentMaterials.find(
      m => m.code.toLowerCase() === matIdent.toLowerCase() || m.name.toLowerCase() === matIdent.toLowerCase()
    );

    if (!targetMat) {
      unmatchedErrors.push(`Baris ${idx + 2}: Bahan "${matIdent}" untuk menu "${targetMenu.name}" tidak ditemukan di database bahan baku.`);
      return;
    }

    if (!recipeMap[targetMenu.id]) {
      recipeMap[targetMenu.id] = [];
    }

    // Prevent duplicate material in same recipe
    const existingIng = recipeMap[targetMenu.id].find(i => i.materialId === targetMat.id);
    if (existingIng) {
      existingIng.qty = qty;
    } else {
      recipeMap[targetMenu.id].push({
        materialId: targetMat.id,
        qty
      });
    }

    matchedCount++;
  });

  // Apply updated recipes
  const updatedMenuItems = currentMenuItems.map(menu => {
    if (recipeMap[menu.id]) {
      return {
        ...menu,
        recipe: recipeMap[menu.id]
      };
    }
    return menu;
  });

  return {
    updatedMenuItems,
    matchedCount,
    unmatchedErrors
  };
}
