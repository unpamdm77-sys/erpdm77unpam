import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Cloud,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Database,
  Smartphone,
  Laptop,
  ArrowDownUp,
  AlertCircle,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';

interface GasSyncModalProps {
  onClose: () => void;
}

export const GasSyncModal: React.FC<GasSyncModalProps> = ({ onClose }) => {
  const {
    config,
    updateConfig,
    cloudSyncStatus,
    lastCloudSyncTime,
    pullFromGoogleSheet,
    seedAllToGoogleSheet,
    syncAllToGoogleSheet,
    transactions,
    materials,
    menuItems,
    users
  } = useERP();

  const [url, setUrl] = useState(config.googleWebAppUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSyncGoogleSheet);
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const pendingCount = transactions.filter(t => !t.syncedToGoogleSheet).length;

  const handleSave = () => {
    updateConfig({
      googleWebAppUrl: url.trim(),
      autoSyncGoogleSheet: autoSync
    });
    setFeedback({
      success: true,
      message: 'URL Google Apps Script berhasil disimpan. Sistem akan mulai menyinkronkan data secara otomatis.'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleTestAndPull = async () => {
    if (!url.trim()) {
      setFeedback({ success: false, message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.' });
      return;
    }
    setTesting(true);
    setFeedback(null);

    // Save URL first
    updateConfig({ googleWebAppUrl: url.trim(), autoSyncGoogleSheet: true });

    const res = await pullFromGoogleSheet(false);
    setTesting(false);
    setFeedback({
      success: res.success,
      message: res.message
    });
  };

  const handleSeedAll = async () => {
    if (!url.trim()) {
      setFeedback({ success: false, message: 'Harap simpan URL Web App terlebih dahulu sebelum upload.' });
      return;
    }

    if (!confirm('Apakah Anda ingin mengunggah seluruh data awal (Bahan Baku, Menu, Resep HPP, Akun Staf, & Target) ke Google Sheet Anda? Sheet akan otomatis dibuatkan tabelnya.')) {
      return;
    }

    setSeeding(true);
    setFeedback(null);
    updateConfig({ googleWebAppUrl: url.trim() });

    const res = await seedAllToGoogleSheet();
    setSeeding(false);
    setFeedback({
      success: res.success,
      message: res.message
    });
  };

  const handleSyncPending = async () => {
    setSyncingAll(true);
    const res = await syncAllToGoogleSheet();
    setSyncingAll(false);
    setFeedback({
      success: res.successCount > 0,
      message: `Sinkronisasi selesai! ${res.successCount} transaksi berhasil dikirim ke Google Sheets.`
    });
  };

  const appsScriptCode = `/**
 * ERP & POS DIMSUM MENTAI 77 UNPAM - Full Real-Time Database Engine
 * Menghubungkan Google Sheets sebagai database multi-perangkat real-time.
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'GET_ALL';

    if (action === 'GET_ALL') {
      var data = getAllERPData(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: "SUCCESS",
        data: data,
        timestamp: new Date().getTime()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "SUCCESS",
      message: "ERP Dimsum Mentai 77 Apps Script Engine Aktif!"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ERROR",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData.contents;
    var request = JSON.parse(contents);
    var action = request.action;
    var data = request.data;
    var result = { status: "SUCCESS" };

    if (action === 'SEED_ALL_DATA' || action === 'SYNC_FULL_STATE') {
      saveAllERPData(ss, data);
      result.message = "Seluruh database Google Sheets berhasil diinisialisasi!";
    }
    else if (action === 'ADD_TRANSACTION') {
      var sheetTrx = getOrCreateSheet(ss, "Penjualan", [
        "ID Transaksi", "Tanggal", "Pelanggan", "Tipe Order", "Meja", "Metode", "Items JSON", "Subtotal", "Diskon", "Total", "Total HPP", "Laba Kotor", "Kasir", "Status"
      ]);
      sheetTrx.appendRow([
        data.id,
        data.date,
        data.customer || "Umum",
        data.orderType || "Dine In",
        data.tableNo || "-",
        data.paymentMethod,
        JSON.stringify(data.items),
        data.subtotal,
        data.discount || 0,
        data.total,
        data.totalHpp,
        data.grossProfit,
        data.cashierName || "-",
        "COMPLETED"
      ]);

      // Potong stok bahan baku di sheet Bahan_Baku
      deductMaterialsStockFromTrx(ss, data.items);
      result.message = "Transaksi tersimpan & stok bahan baku otomatis dipotong!";
    }
    else if (action === 'REFUND_TRANSACTION') {
      var sheetTrx = ss.getSheetByName("Penjualan");
      if (sheetTrx) {
        var rows = sheetTrx.getDataRange().getValues();
        for (var i = 1; i < rows.length; i++) {
          if (rows[i][0] == data.id || rows[i][0] == data.invoiceNo) {
            sheetTrx.getRange(i + 1, 14).setValue("REFUNDED");
            break;
          }
        }
      }
      result.message = "Transaksi berhasil di-refund!";
    }
    else if (action === 'ADD_PURCHASE') {
      var sheetPo = getOrCreateSheet(ss, "Pembelian_Stok", [
        "ID PO", "Tanggal", "Supplier", "ID Bahan", "Nama Bahan", "Qty", "Satuan", "Harga Satuan", "Total Biaya", "Status Bayar", "Catatan"
      ]);
      sheetPo.appendRow([
        data.id,
        data.date,
        data.supplier,
        data.materialId || "-",
        data.materialName,
        data.qty,
        data.unit,
        data.unitPrice,
        data.total,
        data.paymentStatus || "LUNAS",
        data.notes || ""
      ]);

      // Tambah stok bahan baku di sheet Bahan_Baku
      addMaterialStock(ss, data.materialId, data.qty, data.unitPrice, data.supplier);
      result.message = "Data purchasing tersimpan & stok bahan bertambah!";
    }
    else if (action === 'ADD_EXPENSE') {
      var sheetExp = getOrCreateSheet(ss, "Pengeluaran", [
        "ID Beban", "Tanggal", "Nama Beban", "Kategori", "Nominal Biaya", "Catatan"
      ]);
      sheetExp.appendRow([
        data.id,
        data.date || new Date().toISOString().slice(0, 10),
        data.name,
        data.category || "Operasional",
        data.amount,
        data.notes || ""
      ]);
      result.message = "Pengeluaran beban tersimpan di Google Sheet!";
    }
    else if (action === 'ADD_ADJUSTMENT') {
      var sheetAdj = getOrCreateSheet(ss, "Stok_Opname", [
        "ID Opname", "Tanggal", "ID Bahan", "Nama Bahan", "Stok Sistem", "Stok Fisik", "Selisih", "Alasan", "Estimasi Kerugian", "Petugas"
      ]);
      sheetAdj.appendRow([
        data.id,
        data.date,
        data.materialId,
        data.materialName,
        data.systemStock,
        data.actualStock,
        data.difference,
        data.reason,
        data.lossCost || 0,
        data.adjustedBy
      ]);

      // Update stok aktual di Bahan_Baku
      setMaterialExactStock(ss, data.materialId, data.actualStock);
      result.message = "Stok opname tersimpan & stok disesuaikan!";
    }
    else if (action === 'UPDATE_MATERIALS') {
      saveMaterialsSheet(ss, data);
      result.message = "Stok bahan baku diperbarui!";
    }
    else if (action === 'UPDATE_MENU') {
      saveMenuSheet(ss, data);
      result.message = "Daftar menu & resep diperbarui!";
    }
    else if (action === 'UPDATE_USERS') {
      saveUsersSheet(ss, data);
      result.message = "Data akun pengguna diperbarui!";
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ERROR",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =================== HELPER FUNCTIONS ===================

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#F3F4F6");
    }
  }
  return sheet;
}

function getAllERPData(ss) {
  return {
    materials: readMaterialsSheet(ss),
    menuItems: readMenuSheet(ss),
    transactions: readTransactionsSheet(ss),
    purchases: readPurchasesSheet(ss),
    expenses: readExpensesSheet(ss),
    adjustments: readAdjustmentsSheet(ss),
    users: readUsersSheet(ss),
    salesTargets: readSalesTargets(ss)
  };
}

function saveAllERPData(ss, data) {
  if (data.materials) saveMaterialsSheet(ss, data.materials);
  if (data.menuItems) saveMenuSheet(ss, data.menuItems);
  if (data.users) saveUsersSheet(ss, data.users);
  if (data.salesTargets) saveSalesTargets(ss, data.salesTargets);
}

function saveMaterialsSheet(ss, materials) {
  var sheet = getOrCreateSheet(ss, "Bahan_Baku", ["ID Bahan", "Kode", "Nama Bahan", "Kategori", "Stok", "Satuan", "Min Stok", "HPP per Satuan", "Supplier", "Tgl Update"]);
  sheet.clearContents();
  sheet.appendRow(["ID Bahan", "Kode", "Nama Bahan", "Kategori", "Stok", "Satuan", "Min Stok", "HPP per Satuan", "Supplier", "Tgl Update"]);
  var rows = [];
  materials.forEach(function(m) {
    rows.push([m.id, m.code, m.name, m.category, m.stock, m.unit, m.minStock, m.costPerUnit, m.supplier, m.lastUpdated]);
  });
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 10).setValues(rows);
  }
}

function readMaterialsSheet(ss) {
  var sheet = ss.getSheetByName("Bahan_Baku");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      code: String(r[1]),
      name: String(r[2]),
      category: String(r[3]),
      stock: Number(r[4]) || 0,
      unit: String(r[5]),
      minStock: Number(r[6]) || 0,
      costPerUnit: Number(r[7]) || 0,
      supplier: String(r[8]),
      lastUpdated: String(r[9])
    });
  }
  return list;
}

function saveMenuSheet(ss, menuItems) {
  var sheet = getOrCreateSheet(ss, "Menu_Dimsum", ["ID Menu", "Kode", "Nama Menu", "Kategori", "Harga Jual", "Deskripsi", "Tersedia", "Resep BOM JSON"]);
  sheet.clearContents();
  sheet.appendRow(["ID Menu", "Kode", "Nama Menu", "Kategori", "Harga Jual", "Deskripsi", "Tersedia", "Resep BOM JSON"]);
  var rows = [];
  menuItems.forEach(function(m) {
    rows.push([m.id, m.code, m.name, m.category, m.price, m.description || "", m.isAvailable ? "YA" : "TIDAK", JSON.stringify(m.recipe || [])]);
  });
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
}

function readMenuSheet(ss) {
  var sheet = ss.getSheetByName("Menu_Dimsum");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var recipe = [];
    try { if (r[7]) recipe = JSON.parse(r[7]); } catch(e){}
    list.push({
      id: String(r[0]),
      code: String(r[1]),
      name: String(r[2]),
      category: String(r[3]),
      price: Number(r[4]) || 0,
      description: String(r[5]),
      isAvailable: r[6] === "YA" || r[6] === true,
      recipe: recipe
    });
  }
  return list;
}

function saveUsersSheet(ss, users) {
  var sheet = getOrCreateSheet(ss, "Akun_Pengguna", ["ID Pengguna", "Username", "Password", "Nama Lengkap", "Role", "No HP", "Alamat", "Tgl Gabung", "Aktif"]);
  sheet.clearContents();
  sheet.appendRow(["ID Pengguna", "Username", "Password", "Nama Lengkap", "Role", "No HP", "Alamat", "Tgl Gabung", "Aktif"]);
  var rows = [];
  users.forEach(function(u) {
    rows.push([u.id, u.username, u.password, u.name, u.role, u.phone || "", u.address || "", u.joinDate || "", u.isActive ? "YA" : "TIDAK"]);
  });
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
}

function readUsersSheet(ss) {
  var sheet = ss.getSheetByName("Akun_Pengguna");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      username: String(r[1]),
      password: String(r[2]),
      name: String(r[3]),
      role: String(r[4]),
      phone: String(r[5]),
      address: String(r[6]),
      joinDate: String(r[7]),
      isActive: r[8] === "YA" || r[8] === true
    });
  }
  return list;
}

function saveSalesTargets(ss, targets) {
  var sheet = getOrCreateSheet(ss, "Target_Penjualan", ["Target Harian", "Target Mingguan", "Target Bulanan"]);
  sheet.clearContents();
  sheet.appendRow(["Target Harian", "Target Mingguan", "Target Bulanan"]);
  sheet.appendRow([targets.daily || 1500000, targets.weekly || 10000000, targets.monthly || 45000000]);
}

function readSalesTargets(ss) {
  var sheet = ss.getSheetByName("Target_Penjualan");
  if (!sheet) return { daily: 1500000, weekly: 10000000, monthly: 45000000 };
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { daily: 1500000, weekly: 10000000, monthly: 45000000 };
  return {
    daily: Number(rows[1][0]) || 1500000,
    weekly: Number(rows[1][1]) || 10000000,
    monthly: Number(rows[1][2]) || 45000000
  };
}

function readTransactionsSheet(ss) {
  var sheet = ss.getSheetByName("Penjualan");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var items = [];
    try { if (r[6]) items = JSON.parse(r[6]); } catch(e){}
    list.push({
      id: String(r[0]),
      invoiceNo: String(r[0]),
      date: String(r[1]),
      customer: String(r[2]),
      orderType: String(r[3]),
      tableNo: String(r[4]),
      paymentMethod: String(r[5]),
      items: items,
      subtotal: Number(r[7]) || 0,
      discount: Number(r[8]) || 0,
      total: Number(r[9]) || 0,
      totalHpp: Number(r[10]) || 0,
      grossProfit: Number(r[11]) || 0,
      cashierName: String(r[12]),
      status: String(r[13]) || "COMPLETED",
      syncedToGoogleSheet: true
    });
  }
  return list;
}

function readPurchasesSheet(ss) {
  var sheet = ss.getSheetByName("Pembelian_Stok");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      poNumber: String(r[0]),
      date: String(r[1]),
      supplier: String(r[2]),
      materialId: String(r[3]),
      materialName: String(r[4]),
      qty: Number(r[5]) || 0,
      unit: String(r[6]),
      unitPrice: Number(r[7]) || 0,
      total: Number(r[8]) || 0,
      paymentStatus: String(r[9]),
      notes: String(r[10]),
      syncedToGoogleSheet: true
    });
  }
  return list;
}

function readExpensesSheet(ss) {
  var sheet = ss.getSheetByName("Pengeluaran");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      expenseNo: String(r[0]),
      date: String(r[1]),
      name: String(r[2]),
      category: String(r[3]),
      amount: Number(r[4]) || 0,
      notes: String(r[5]),
      syncedToGoogleSheet: true
    });
  }
  return list;
}

function readAdjustmentsSheet(ss) {
  var sheet = ss.getSheetByName("Stok_Opname");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      date: String(r[1]),
      materialId: String(r[2]),
      materialName: String(r[3]),
      systemStock: Number(r[4]) || 0,
      actualStock: Number(r[5]) || 0,
      difference: Number(r[6]) || 0,
      reason: String(r[7]),
      lossCost: Number(r[8]) || 0,
      adjustedBy: String(r[9])
    });
  }
  return list;
}

function deductMaterialsStockFromTrx(ss, items) {
  var sheetMat = ss.getSheetByName("Bahan_Baku");
  var sheetMenu = ss.getSheetByName("Menu_Dimsum");
  if (!sheetMat || !sheetMenu || !items) return;

  var menuRows = sheetMenu.getDataRange().getValues();
  var matRange = sheetMat.getDataRange();
  var matRows = matRange.getValues();

  items.forEach(function(item) {
    for (var m = 1; m < menuRows.length; m++) {
      if (menuRows[m][0] == item.id || menuRows[m][2] == item.name) {
        var recipe = [];
        try { recipe = JSON.parse(menuRows[m][7]); } catch(e){}
        recipe.forEach(function(ing) {
          for (var k = 1; k < matRows.length; k++) {
            if (matRows[k][0] == ing.materialId) {
              var currentStock = Number(matRows[k][4]) || 0;
              var deduction = (ing.qty || 1) * (item.qty || 1);
              var newStock = Math.max(0, currentStock - deduction);
              matRows[k][4] = newStock;
              sheetMat.getRange(k + 1, 5).setValue(newStock);
              break;
            }
          }
        });
        break;
      }
    }
  });
}

function addMaterialStock(ss, materialId, qty, unitPrice, supplier) {
  var sheetMat = ss.getSheetByName("Bahan_Baku");
  if (!sheetMat) return;
  var rows = sheetMat.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == materialId) {
      var currentStock = Number(rows[i][4]) || 0;
      var newStock = currentStock + Number(qty);
      sheetMat.getRange(i + 1, 5).setValue(newStock);
      if (supplier) sheetMat.getRange(i + 1, 9).setValue(supplier);
      sheetMat.getRange(i + 1, 10).setValue(new Date().toISOString().slice(0, 10));
      break;
    }
  }
}

function setMaterialExactStock(ss, materialId, actualStock) {
  var sheetMat = ss.getSheetByName("Bahan_Baku");
  if (!sheetMat) return;
  var rows = sheetMat.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == materialId) {
      sheetMat.getRange(i + 1, 5).setValue(actualStock);
      sheetMat.getRange(i + 1, 10).setValue(new Date().toISOString().slice(0, 10));
      break;
    }
  }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base text-amber-400">Database Real-Time Google Sheets</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Multi-Device Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hubungkan satu spreadsheet untuk diakses bersamaan di HP kasir, laptop owner, dan tablet toko
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Live Multi-Device Explanation Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <ArrowDownUp size={16} />
                <span>Sinkronisasi Otomatis Antar Perangkat (Real-Time):</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                cloudSyncStatus === 'connected' ? 'bg-emerald-500 text-slate-950' :
                cloudSyncStatus === 'syncing' ? 'bg-amber-400 text-slate-950 animate-pulse' :
                'bg-slate-700 text-slate-300'
              }`}>
                {cloudSyncStatus === 'connected' ? '🟢 Terhubung Real-Time' :
                 cloudSyncStatus === 'syncing' ? '🟡 Menyelaraskan...' : '⚪ Offline / Belum Konek'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center space-x-2.5">
                <Smartphone size={20} className="text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-white text-[11px]">HP Kasir UNPAM</p>
                  <p className="text-[10px] text-slate-400">Transaksi otomatis memotong stok di cloud</p>
                </div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center space-x-2.5">
                <Laptop size={20} className="text-red-400 shrink-0" />
                <div>
                  <p className="font-bold text-white text-[11px]">Laptop Owner</p>
                  <p className="text-[10px] text-slate-400">Pantau omzet & edit resep dari mana saja</p>
                </div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center space-x-2.5">
                <Database size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-white text-[11px]">Google Sheets</p>
                  <p className="text-[10px] text-slate-400">Database pusat yang selalu sama di tiap alat</p>
                </div>
              </div>
            </div>

            {lastCloudSyncTime && (
              <p className="text-[10px] text-slate-400 text-right">
                Sinkronisasi terakhir: <strong className="text-slate-200">{lastCloudSyncTime}</strong> (diperbarui berkala setiap 20 detik)
              </p>
            )}
          </div>

          {/* Form Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                URL Google Apps Script Web App
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tempel URL Web App dari Apps Script spreadsheet Anda (pastikan izin: <strong>Anyone / Siapa saja</strong>).
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-800">Auto-Sync Real-Time Setiap Saat</p>
                <p className="text-[11px] text-slate-500">
                  Tarik otomatis data terbaru dari cloud dan simpan tiap penjualan kasir
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={e => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={handleSave}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Simpan URL
              </button>

              <button
                onClick={handleTestAndPull}
                disabled={testing}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <DownloadCloud size={14} />}
                <span>{testing ? 'Menyinkronkan...' : 'Tarik Data Terbaru dari Cloud'}</span>
              </button>

              <button
                onClick={handleSeedAll}
                disabled={seeding}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer shadow-xs"
                title="Kirim semua bahan, menu, dan akun awal ke spreadsheet kosong"
              >
                {seeding ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                <span>{seeding ? 'Mengunggah Database...' : 'Upload Database Awal ke Sheet (1-Klik)'}</span>
              </button>

              {pendingCount > 0 && (
                <button
                  onClick={handleSyncPending}
                  disabled={syncingAll}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {syncingAll ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
                  <span>Kirim {pendingCount} Transaksi Tertunda</span>
                </button>
              )}
            </div>

            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  feedback.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.success ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>

          {/* Step-by-Step Tutorial */}
          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles size={15} className="text-amber-500" />
              <span>Cara Pasang Google Sheets sebagai Database (Hanya 3 Menit):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
              <li>Buat <strong>Google Spreadsheet baru</strong> di Google Drive Anda (beri nama misalnya: <em>Database Dimsum Mentai 77</em>).</li>
              <li>Di spreadsheet, klik menu atas: <strong>Ekstensi (Extensions) &gt; Apps Script</strong>.</li>
              <li>Hapus kode bawaan <code>myFunction()</code>, lalu <strong>Salin & Tempel</strong> kode skrip di bawah ini.</li>
              <li>Klik tombol biru <strong>Deploy &gt; New deployment (Penerapan baru)</strong>.</li>
              <li>Pilih jenis <strong>Web app (Aplikasi web)</strong>:
                <ul className="list-disc list-inside pl-4 mt-1 text-[11px] text-slate-500">
                  <li>Execute as: <strong>Me (email Anda)</strong></li>
                  <li>Who has access: <strong>Anyone (Siapa saja)</strong> &rarr; Wajib agar semua perangkat kasir bisa akses tanpa login Google ulang.</li>
                </ul>
              </li>
              <li>Klik <strong>Deploy</strong>, lalu salin <strong>Web App URL</strong> dan tempelkan ke kolom URL di atas.</li>
              <li>Klik tombol hijau <strong>"Upload Database Awal ke Sheet (1-Klik)"</strong> untuk langsung mengisi seluruh tabel menu, bahan baku, dan akun staf secara otomatis!</li>
            </ol>
          </div>

          {/* Apps Script Code Block */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Kode Google Apps Script Engine (Tinggal Salin)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Mendukung pembacaan real-time, auto potong stok saat kasir jualan, dan update resep:
                </p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {codeCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{codeCopied ? 'Berhasil Tersalin!' : 'Salin Seluruh Kode'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-56 border border-slate-800 select-all">
              {appsScriptCode}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Database: {materials.length} Bahan • {menuItems.length} Menu • {users.length} Akun Staf
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
