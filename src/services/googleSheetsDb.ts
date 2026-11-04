import {
  Material,
  MenuItem,
  Transaction,
  PurchaseOrder,
  Expense,
  StockAdjustment,
  UserAccount,
  SalesTarget
} from '../types/erp';

export const DATABASE_SPREADSHEET_TITLE = 'DIMSUM MENTAI 77 - DATABASE ERP';

interface SheetMetadata {
  id: string;
  name: string;
  url: string;
}

/**
 * Find existing ERP spreadsheet on user's Google Drive
 */
export const findErpSpreadsheetOnDrive = async (accessToken: string): Promise<SheetMetadata | null> => {
  try {
    const query = encodeURIComponent(
      `name = '${DATABASE_SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.warn('Drive search error:', err);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      return {
        id: file.id,
        name: file.name,
        url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`
      };
    }
    return null;
  } catch (err) {
    console.error('Error finding spreadsheet on Drive:', err);
    return null;
  }
};

/**
 * Create a new dedicated ERP Spreadsheet on Google Drive
 */
export const createErpSpreadsheetOnDrive = async (accessToken: string): Promise<SheetMetadata> => {
  const payload = {
    properties: {
      title: DATABASE_SPREADSHEET_TITLE
    },
    sheets: [
      { properties: { title: 'Penjualan' } },
      { properties: { title: 'Bahan_Baku' } },
      { properties: { title: 'Menu_BOM' } },
      { properties: { title: 'Pembelian_PO' } },
      { properties: { title: 'Pengeluaran' } },
      { properties: { title: 'Stock_Opname' } },
      { properties: { title: 'Pengguna_Sistem' } }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet di Google Drive');
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize table headers
  await initializeTableHeaders(spreadsheetId, accessToken);

  return {
    id: spreadsheetId,
    name: DATABASE_SPREADSHEET_TITLE,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
};

/**
 * Ensure all sheets and header rows exist in the spreadsheet
 */
export const initializeTableHeaders = async (spreadsheetId: string, accessToken: string) => {
  // Fetch existing sheet titles
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  let existingTitles: string[] = [];
  if (metaRes.ok) {
    const metaData = await metaRes.json();
    existingTitles = (metaData.sheets || []).map((s: any) => s.properties.title);
  }

  const requiredSheets = [
    'Penjualan',
    'Bahan_Baku',
    'Menu_BOM',
    'Pembelian_PO',
    'Pengeluaran',
    'Stock_Opname',
    'Pengguna_Sistem'
  ];

  // Add missing sheets if any
  const missingSheets = requiredSheets.filter(title => !existingTitles.includes(title));
  if (missingSheets.length > 0) {
    const addSheetRequests = missingSheets.map(title => ({
      addSheet: { properties: { title } }
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests: addSheetRequests })
    });
  }

  // Populate Headers for each sheet
  const headerData = [
    {
      range: 'Penjualan!A1:N1',
      values: [[
        'ID Transaksi', 'Tanggal', 'Pelanggan', 'Tipe Order', 'Meja', 'Metode Pembayaran',
        'Subtotal', 'Diskon', 'Total', 'Total HPP', 'Laba Kotor', 'Kasir', 'Status', 'Items Detail'
      ]]
    },
    {
      range: 'Bahan_Baku!A1:J1',
      values: [[
        'ID Bahan', 'Kode', 'Nama Bahan', 'Kategori', 'Stok', 'Satuan',
        'Min Stok', 'Biaya Per Satuan', 'Supplier', 'Terakhir Update'
      ]]
    },
    {
      range: 'Menu_BOM!A1:H1',
      values: [[
        'ID Menu', 'Kode', 'Nama Menu', 'Kategori', 'Harga Jual',
        'Resep BOM (JSON)', 'Tersedia', 'Deskripsi'
      ]]
    },
    {
      range: 'Pembelian_PO!A1:L1',
      values: [[
        'ID PO', 'Nomor PO', 'Tanggal', 'Supplier', 'ID Bahan', 'Nama Bahan',
        'Qty', 'Satuan', 'Harga Satuan', 'Total Biaya', 'Status Pembayaran', 'Catatan'
      ]]
    },
    {
      range: 'Pengeluaran!A1:G1',
      values: [[
        'ID Biaya', 'Nomor Bukti', 'Tanggal', 'Nama Beban', 'Kategori', 'Nominal', 'Catatan'
      ]]
    },
    {
      range: 'Stock_Opname!A1:K1',
      values: [[
        'ID Opname', 'Tanggal', 'ID Bahan', 'Nama Bahan', 'Satuan', 'Stok Sistem',
        'Stok Nyata', 'Selisih', 'Biaya Kerugian', 'Alasan', 'Penanggung Jawab'
      ]]
    },
    {
      range: 'Pengguna_Sistem!A1:I1',
      values: [[
        'ID', 'Username', 'Password', 'Nama Lengkap', 'Role', 'No HP', 'Alamat', 'Tgl Gabung', 'Status Aktif'
      ]]
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData
    })
  });
};

/**
 * Read all tables from Google Sheets and convert them into application models
 */
export const fetchAllErpDataFromSheets = async (spreadsheetId: string, accessToken: string) => {
  const ranges = [
    'Penjualan!A2:N',
    'Bahan_Baku!A2:J',
    'Menu_BOM!A2:H',
    'Pembelian_PO!A2:L',
    'Pengeluaran!A2:G',
    'Stock_Opname!A2:K',
    'Pengguna_Sistem!A2:I'
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&')}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gagal membaca data dari Google Sheets');
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  // Parse Transactions
  const rawTrx = valueRanges[0]?.values || [];
  const transactions: Transaction[] = rawTrx.map((row: any[], idx: number) => {
    let items = [];
    try {
      items = row[13] ? JSON.parse(row[13]) : [];
    } catch {}

    return {
      id: row[0] || `trx-${idx}`,
      invoiceNo: row[0] || `INV-${idx}`,
      date: row[1] || new Date().toISOString(),
      customer: row[2] || 'Pelanggan',
      orderType: (row[3] as any) || 'Dine In',
      tableNo: row[4] || '',
      paymentMethod: (row[5] as any) || 'QRIS',
      subtotal: Number(row[6]) || 0,
      discount: Number(row[7]) || 0,
      total: Number(row[8]) || 0,
      totalHpp: Number(row[9]) || 0,
      grossProfit: Number(row[10]) || 0,
      cashierName: row[11] || 'Kasir',
      status: (row[12] as any) || 'COMPLETED',
      items,
      syncedToGoogleSheet: true
    };
  });

  // Parse Materials
  const rawMaterials = valueRanges[1]?.values || [];
  const materials: Material[] = rawMaterials.map((row: any[], idx: number) => ({
    id: row[0] || `mat-${idx + 1}`,
    code: row[1] || `B-${idx + 1}`,
    name: row[2] || `Bahan ${idx + 1}`,
    category: row[3] || 'Daging & Isian',
    stock: Number(row[4]) || 0,
    unit: (row[5] as any) || 'pcs',
    minStock: Number(row[6]) || 0,
    costPerUnit: Number(row[7]) || 0,
    supplier: row[8] || '',
    lastUpdated: row[9] || new Date().toISOString().slice(0, 10)
  }));

  // Parse Menu & BOM
  const rawMenu = valueRanges[2]?.values || [];
  const menuItems: MenuItem[] = rawMenu.map((row: any[], idx: number) => {
    let recipe = [];
    try {
      recipe = row[5] ? JSON.parse(row[5]) : [];
    } catch {}

    return {
      id: row[0] || `menu-${idx + 1}`,
      code: row[1] || `MN-${idx + 1}`,
      name: row[2] || `Menu ${idx + 1}`,
      category: row[3] || 'Dimsum Mentai',
      price: Number(row[4]) || 0,
      recipe,
      isAvailable: row[6] === 'true' || row[6] === true || row[6] === 'TRUE',
      description: row[7] || ''
    };
  });

  // Parse Purchasing PO
  const rawPurchases = valueRanges[3]?.values || [];
  const purchases: PurchaseOrder[] = rawPurchases.map((row: any[], idx: number) => ({
    id: row[0] || `po-${idx + 1}`,
    poNumber: row[1] || `PO-${idx + 1}`,
    date: row[2] || new Date().toISOString().slice(0, 10),
    supplier: row[3] || '',
    materialId: row[4] || '',
    materialName: row[5] || '',
    qty: Number(row[6]) || 0,
    unit: (row[7] as any) || 'pcs',
    unitPrice: Number(row[8]) || 0,
    total: Number(row[9]) || 0,
    paymentStatus: (row[10] as any) || 'LUNAS',
    notes: row[11] || '',
    syncedToGoogleSheet: true
  }));

  // Parse Expenses
  const rawExpenses = valueRanges[4]?.values || [];
  const expenses: Expense[] = rawExpenses.map((row: any[], idx: number) => ({
    id: row[0] || `exp-${idx + 1}`,
    expenseNo: row[1] || `EXP-${idx + 1}`,
    date: row[2] || new Date().toISOString().slice(0, 10),
    name: row[3] || '',
    category: (row[4] as any) || 'Operasional',
    amount: Number(row[5]) || 0,
    notes: row[6] || '',
    syncedToGoogleSheet: true
  }));

  // Parse Adjustments
  const rawAdjustments = valueRanges[5]?.values || [];
  const adjustments: StockAdjustment[] = rawAdjustments.map((row: any[], idx: number) => ({
    id: row[0] || `adj-${idx + 1}`,
    date: row[1] || new Date().toISOString().slice(0, 10),
    materialId: row[2] || '',
    materialName: row[3] || '',
    unit: (row[4] as any) || 'pcs',
    systemStock: Number(row[5]) || 0,
    actualStock: Number(row[6]) || 0,
    difference: Number(row[7]) || 0,
    lossCost: Number(row[8]) || 0,
    reason: (row[9] as any) || 'Selisih Hitung / Opname',
    adjustedBy: row[10] || 'Kasir'
  }));

  // Parse Users
  const rawUsers = valueRanges[6]?.values || [];
  const users: UserAccount[] = rawUsers.map((row: any[], idx: number) => ({
    id: row[0] || `usr-${idx + 1}`,
    username: row[1] || `user_${idx + 1}`,
    password: row[2] || 'pass123',
    name: row[3] || `Staf ${idx + 1}`,
    role: (row[4] as any) || 'STAFF',
    phone: row[5] || '',
    address: row[6] || '',
    joinDate: row[7] || new Date().toISOString().slice(0, 10),
    isActive: row[8] !== 'false' && row[8] !== false && row[8] !== 'FALSE'
  }));

  return {
    transactions,
    materials,
    menuItems,
    purchases,
    expenses,
    adjustments,
    users
  };
};

/**
 * Append a newly completed transaction row directly into Google Sheets
 */
export const appendTransactionToSheet = async (
  spreadsheetId: string,
  accessToken: string,
  trx: Transaction
) => {
  const row = [
    trx.invoiceNo,
    trx.date,
    trx.customer,
    trx.orderType,
    trx.tableNo || '-',
    trx.paymentMethod,
    trx.subtotal,
    trx.discount,
    trx.total,
    trx.totalHpp,
    trx.grossProfit,
    trx.cashierName,
    trx.status,
    JSON.stringify(trx.items)
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Penjualan!A:N:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    }
  );
};

/**
 * Append a purchase order into Google Sheets
 */
export const appendPurchaseToSheet = async (
  spreadsheetId: string,
  accessToken: string,
  po: PurchaseOrder
) => {
  const row = [
    po.id,
    po.poNumber,
    po.date,
    po.supplier,
    po.materialId,
    po.materialName,
    po.qty,
    po.unit,
    po.unitPrice,
    po.total,
    po.paymentStatus,
    po.notes || ''
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pembelian_PO!A:L:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    }
  );
};

/**
 * Append an operational expense into Google Sheets
 */
export const appendExpenseToSheet = async (
  spreadsheetId: string,
  accessToken: string,
  exp: Expense
) => {
  const row = [
    exp.id,
    exp.expenseNo,
    exp.date,
    exp.name,
    exp.category,
    exp.amount,
    exp.notes || ''
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengeluaran!A:G:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    }
  );
};

/**
 * Append stock adjustment (opname) into Google Sheets
 */
export const appendAdjustmentToSheet = async (
  spreadsheetId: string,
  accessToken: string,
  adj: StockAdjustment
) => {
  const row = [
    adj.id,
    adj.date,
    adj.materialId,
    adj.materialName,
    adj.unit,
    adj.systemStock,
    adj.actualStock,
    adj.difference,
    adj.lossCost,
    adj.reason,
    adj.adjustedBy
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Stock_Opname!A:K:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    }
  );
};

/**
 * Synchronize full materials table to Google Sheets
 */
export const syncMaterialsToSheet = async (
  spreadsheetId: string,
  accessToken: string,
  materials: Material[]
) => {
  const rows = materials.map(m => [
    m.id,
    m.code,
    m.name,
    m.category,
    m.stock,
    m.unit,
    m.minStock,
    m.costPerUnit,
    m.supplier,
    m.lastUpdated
  ]);

  // Clear existing data rows first (A2:J)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Bahan_Baku!A2:J:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (rows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Bahan_Baku!A2:J?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
      }
    );
  }
};

/**
 * Synchronize full user accounts table to Google Sheets
 */
export const syncUsersToSheet = async (
  spreadsheetId: string,
  accessToken: string,
  users: UserAccount[]
) => {
  const rows = users.map(u => [
    u.id,
    u.username,
    u.password,
    u.name,
    u.role,
    u.phone,
    u.address,
    u.joinDate,
    u.isActive ? 'TRUE' : 'FALSE'
  ]);

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengguna_Sistem!A2:I:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (rows.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengguna_Sistem!A2:I?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
      }
    );
  }
};

/**
 * Push all local data to Google Sheets to seed or fully synchronize the spreadsheet
 */
export const pushEntireDatabaseToSheets = async (
  spreadsheetId: string,
  accessToken: string,
  data: {
    materials: Material[];
    menuItems: MenuItem[];
    transactions: Transaction[];
    purchases: PurchaseOrder[];
    expenses: Expense[];
    adjustments: StockAdjustment[];
    users: UserAccount[];
  }
) => {
  await initializeTableHeaders(spreadsheetId, accessToken);

  const trxRows = data.transactions.map(t => [
    t.invoiceNo, t.date, t.customer, t.orderType, t.tableNo || '-', t.paymentMethod,
    t.subtotal, t.discount, t.total, t.totalHpp, t.grossProfit, t.cashierName, t.status,
    JSON.stringify(t.items)
  ]);

  const matRows = data.materials.map(m => [
    m.id, m.code, m.name, m.category, m.stock, m.unit, m.minStock, m.costPerUnit, m.supplier, m.lastUpdated
  ]);

  const menuRows = data.menuItems.map(m => [
    m.id, m.code, m.name, m.category, m.price, JSON.stringify(m.recipe), m.isAvailable ? 'TRUE' : 'FALSE', m.description
  ]);

  const poRows = data.purchases.map(p => [
    p.id, p.poNumber, p.date, p.supplier, p.materialId, p.materialName, p.qty, p.unit, p.unitPrice, p.total, p.paymentStatus, p.notes || ''
  ]);

  const expRows = data.expenses.map(e => [
    e.id, e.expenseNo, e.date, e.name, e.category, e.amount, e.notes || ''
  ]);

  const adjRows = data.adjustments.map(a => [
    a.id, a.date, a.materialId, a.materialName, a.unit, a.systemStock, a.actualStock, a.difference, a.lossCost, a.reason, a.adjustedBy
  ]);

  const userRows = data.users.map(u => [
    u.id, u.username, u.password, u.name, u.role, u.phone, u.address, u.joinDate, u.isActive ? 'TRUE' : 'FALSE'
  ]);

  // Batch update all data ranges
  const batchData = [
    { range: 'Penjualan!A2:N', values: trxRows },
    { range: 'Bahan_Baku!A2:J', values: matRows },
    { range: 'Menu_BOM!A2:H', values: menuRows },
    { range: 'Pembelian_PO!A2:L', values: poRows },
    { range: 'Pengeluaran!A2:G', values: expRows },
    { range: 'Stock_Opname!A2:K', values: adjRows },
    { range: 'Pengguna_Sistem!A2:I', values: userRows }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData
    })
  });
};
