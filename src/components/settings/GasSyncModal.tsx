import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Cloud, Check, Copy, ExternalLink, RefreshCw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface GasSyncModalProps {
  onClose: () => void;
}

export const GasSyncModal: React.FC<GasSyncModalProps> = ({ onClose }) => {
  const { config, updateConfig, syncWithGoogleSheet, syncAllToGoogleSheet, transactions } = useERP();
  const [url, setUrl] = useState(config.googleWebAppUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSyncGoogleSheet);
  const [testing, setTesting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const pendingCount = transactions.filter(t => !t.syncedToGoogleSheet).length;

  const handleSave = () => {
    updateConfig({
      googleWebAppUrl: url.trim(),
      autoSyncGoogleSheet: autoSync
    });
  };

  const handleTest = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: 'Masukkan URL Web App terlebih dahulu.' });
      return;
    }
    setTesting(true);
    setTestResult(null);

    // Save URL first
    updateConfig({ googleWebAppUrl: url.trim() });

    const res = await syncWithGoogleSheet('ADD_EXPENSE', {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      name: 'Tes Koneksi DIMSUM MENTAI 77 Web App',
      amount: 1000
    });

    setTesting(false);
    setTestResult(res);
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    const res = await syncAllToGoogleSheet();
    setSyncingAll(false);
    alert(`Sinkronisasi selesai! ${res.successCount} transaksi berhasil dikirim ke Google Sheets.`);
  };

  const appsScriptCode = `/**
 * ERP DIMSUM MENTAI 77 UNPAM - Google Apps Script Engine
 */

function doGet() {
  return HtmlService.createHtmlOutput('<h3>ERP & POS Dimsum Mentai 77 UNPAM Engine Aktif!</h3>')
      .setTitle('ERP & POS - DIMSUM MENTAI 77 UNPAM')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var result = processERPAction(request);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Router API Server untuk menangani aksi dari Web App
function processERPAction(request) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = request.action;
    var data = request.data;

    if (action === 'ADD_TRANSACTION') {
      var sheet = getOrCreateSheet(ss, "Penjualan");
      sheet.appendRow([
        data.id,
        data.date,
        data.customer,
        data.paymentMethod,
        JSON.stringify(data.items),
        data.subtotal,
        data.discount,
        data.total,
        data.totalHpp,
        data.total - data.totalHpp
      ]);
    } 
    else if (action === 'ADD_PURCHASE') {
      var sheet = getOrCreateSheet(ss, "Pembelian_Stok");
      sheet.appendRow([
        data.id,
        data.date,
        data.supplier,
        data.materialName,
        data.qty,
        data.unit,
        data.unitPrice,
        data.total
      ]);
    }
    else if (action === 'ADD_EXPENSE') {
      var sheet = getOrCreateSheet(ss, "Pengeluaran_NonStok");
      sheet.appendRow([
        data.id,
        data.name,
        data.amount
      ]);
    }

    return { status: "SUCCESS", message: "Data tersimpan di Google Sheet!" };
  } catch (err) {
    return { status: "ERROR", message: err.toString() };
  }
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === "Penjualan") {
      sheet.appendRow(["ID Transaksi", "Tanggal", "Pelanggan", "Metode", "Items JSON", "Subtotal", "Diskon", "Total", "Total HPP", "Laba Kotor"]);
    } else if (sheetName === "Pembelian_Stok") {
      sheet.appendRow(["ID PO", "Tanggal", "Supplier", "Bahan", "Qty", "Satuan", "Harga Satuan", "Total Biaya"]);
    } else if (sheetName === "Pengeluaran_NonStok") {
      sheet.appendRow(["ID Expense", "Nama Beban", "Nominal Biaya"]);
    }
  }
  return sheet;
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="text-amber-400" size={20} />
            <h3 className="font-bold text-base">Integrasi Google Sheets & Apps Script</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-3">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Koneksi Langsung ke Spreadsheet Usaha</p>
              <p className="mt-1 leading-relaxed">
                Setiap transaksi kasir, pembelian bahan baku (PO), dan pengeluaran operasional dapat otomatis tersimpan langsung ke baris Google Sheets pemilik toko.
              </p>
            </div>
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
                Deploy skrip sebagai Web App dengan izin: <em>Execute as: Me</em>, <em>Who has access: Anyone</em>.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-800">Kirim Otomatis Saat Transaksi</p>
                <p className="text-[11px] text-slate-500">Kirim ke Google Sheets secara realtime saat kasir mencetak struk</p>
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

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Simpan Pengaturan
              </button>
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-600 transition disabled:opacity-50"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                <span>{testing ? 'Menguji...' : 'Uji Koneksi'}</span>
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={handleSyncAll}
                  disabled={syncingAll}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {syncingAll ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
                  <span>Kirim {pendingCount} Data Tertunda</span>
                </button>
              )}
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.success ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Apps Script Guide & Code */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Kode Google Apps Script
                </h4>
                <p className="text-[11px] text-slate-500">
                  Buka Google Sheets baru &gt; Ekstensi &gt; Apps Script &gt; Tempel kode berikut:
                </p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                {codeCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{codeCopied ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
              {appsScriptCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
