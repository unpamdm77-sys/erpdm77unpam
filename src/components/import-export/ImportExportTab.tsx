import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  exportCompleteExcelWorkbook,
  downloadMaterialTemplate,
  downloadMenuTemplate,
  downloadBOMTemplate,
  downloadCompleteMasterTemplate,
  parseExcelOrCsvWorkbook,
  mapRowsToMaterials,
  mapRowsToMenuItems
} from '../../utils/excelExportImport';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Cloud,
  FileCheck,
  AlertCircle,
  Database,
  RotateCcw,
  Utensils,
  Boxes,
  Calculator,
  CheckCircle2,
  Info
} from 'lucide-react';

interface ImportExportTabProps {
  onOpenGoogleSheetSettings: () => void;
}

type ImportType = 'materials' | 'menu' | 'bom' | 'all';

export const ImportExportTab: React.FC<ImportExportTabProps> = ({ onOpenGoogleSheetSettings }) => {
  const {
    transactions,
    purchases,
    expenses,
    materials,
    menuItems,
    importMaterialsBatch,
    importMenuBatch,
    importBOMBatch,
    resetAllData
  } = useERP();

  const [activeImportTab, setActiveImportTab] = useState<ImportType>('materials');
  const [importStatus, setImportStatus] = useState<{ success?: string; error?: string; errorsList?: string[] } | null>(null);
  const [parsedSheets, setParsedSheets] = useState<{ sheetNames: string[]; sheets: Record<string, any[]> } | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportFullExcel = () => {
    exportCompleteExcelWorkbook(transactions, purchases, expenses, materials, menuItems);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    try {
      const result = await parseExcelOrCsvWorkbook(file);
      if (!result.sheetNames || result.sheetNames.length === 0) {
        setImportStatus({ error: 'File Excel / CSV kosong atau tidak memiliki lembar kerja.' });
        return;
      }

      setParsedSheets(result);

      // Auto-detect best sheet according to active tab
      const lowerSheets = result.sheetNames.map(s => s.toLowerCase());
      if (activeImportTab === 'materials') {
        const matIdx = lowerSheets.findIndex(s => s.includes('bahan') || s.includes('stok') || s.includes('material'));
        setSelectedSheetName(matIdx >= 0 ? result.sheetNames[matIdx] : result.sheetNames[0]);
      } else if (activeImportTab === 'menu') {
        const menuIdx = lowerSheets.findIndex(s => s.includes('menu') || s.includes('produk'));
        setSelectedSheetName(menuIdx >= 0 ? result.sheetNames[menuIdx] : result.sheetNames[0]);
      } else if (activeImportTab === 'bom') {
        const bomIdx = lowerSheets.findIndex(s => s.includes('bom') || s.includes('resep') || s.includes('recipe'));
        setSelectedSheetName(bomIdx >= 0 ? result.sheetNames[bomIdx] : result.sheetNames[0]);
      } else {
        setSelectedSheetName(result.sheetNames[0]);
      }
    } catch (err: any) {
      setImportStatus({ error: `Gagal membaca file: ${err?.message || 'Format tidak didukung'}` });
    }
  };

  const handleExecuteImport = () => {
    if (!parsedSheets || !selectedSheetName) return;
    const rows = parsedSheets.sheets[selectedSheetName] || [];

    if (rows.length === 0) {
      setImportStatus({ error: `Sheet "${selectedSheetName}" tidak memiliki baris data.` });
      return;
    }

    try {
      if (activeImportTab === 'materials') {
        const mapped = mapRowsToMaterials(rows, materials);
        if (mapped.length === 0) {
          setImportStatus({ error: 'Tidak ditemukan kolom data bahan yang valid (Nama Bahan, Stok, Satuan, Harga).' });
          return;
        }
        const res = importMaterialsBatch(mapped);
        setImportStatus({
          success: `Berhasil memproses ${mapped.length} bahan baku! (${res.added} bahan baru ditambahkan, ${res.updated} bahan diperbarui).`
        });
      } else if (activeImportTab === 'menu') {
        const mapped = mapRowsToMenuItems(rows, menuItems);
        if (mapped.length === 0) {
          setImportStatus({ error: 'Tidak ditemukan kolom data menu yang valid (Nama Menu, Harga Jual, Kategori).' });
          return;
        }
        const res = importMenuBatch(mapped);
        setImportStatus({
          success: `Berhasil memproses ${mapped.length} menu dimsum! (${res.added} menu baru ditambahkan, ${res.updated} menu diperbarui).`
        });
      } else if (activeImportTab === 'bom') {
        const res = importBOMBatch(rows);
        if (res.matchedCount === 0 && res.unmatchedErrors.length > 0) {
          setImportStatus({
            error: 'Gagal mengaitkan resep BOM: ' + res.unmatchedErrors[0],
            errorsList: res.unmatchedErrors
          });
          return;
        }
        setImportStatus({
          success: `Berhasil memperbarui ${res.matchedCount} komposisi bahan resep (BOM) ke menu terkait!`,
          errorsList: res.unmatchedErrors.length > 0 ? res.unmatchedErrors : undefined
        });
      } else if (activeImportTab === 'all') {
        // Multi-sheet master import
        let matsCount = 0;
        let menuCount = 0;
        let bomCount = 0;

        // Try import Bahan_Baku
        const matSheet = Object.keys(parsedSheets.sheets).find(s => s.toLowerCase().includes('bahan') || s.toLowerCase().includes('stok'));
        if (matSheet && parsedSheets.sheets[matSheet].length > 0) {
          const mappedMats = mapRowsToMaterials(parsedSheets.sheets[matSheet], materials);
          importMaterialsBatch(mappedMats);
          matsCount = mappedMats.length;
        }

        // Try import Menu
        const menuSheet = Object.keys(parsedSheets.sheets).find(s => s.toLowerCase().includes('menu'));
        if (menuSheet && parsedSheets.sheets[menuSheet].length > 0) {
          const mappedMenu = mapRowsToMenuItems(parsedSheets.sheets[menuSheet], menuItems);
          importMenuBatch(mappedMenu);
          menuCount = mappedMenu.length;
        }

        // Try import BOM_Resep
        const bomSheet = Object.keys(parsedSheets.sheets).find(s => s.toLowerCase().includes('bom') || s.toLowerCase().includes('resep'));
        if (bomSheet && parsedSheets.sheets[bomSheet].length > 0) {
          const bomRes = importBOMBatch(parsedSheets.sheets[bomSheet]);
          bomCount = bomRes.matchedCount;
        }

        setImportStatus({
          success: `Import Master Sukses! Terproses: ${matsCount} Bahan Baku, ${menuCount} Menu, dan ${bomCount} relasi Resep BOM.`
        });
      }

      setParsedSheets(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportStatus({ error: `Terjadi kendala saat import: ${err.message}` });
    }
  };

  const handleExportBackupJson = () => {
    const backup = {
      transactions,
      purchases,
      expenses,
      materials,
      menuItems,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BACKUP_DIMSUM77_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentPreviewRows = parsedSheets && selectedSheetName ? parsedSheets.sheets[selectedSheetName] || [] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <FileSpreadsheet size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Export & Import Excel (BOM, Bahan Baku & Menu)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Modul impor spreadsheet terintegrasi: unggah Bahan Baku, Menu Dimsum, dan Resep BOM otomatis.
          </p>
        </div>

        <button
          onClick={handleExportFullExcel}
          className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition text-xs"
        >
          <Download size={16} />
          <span>Download Seluruh Data Excel (.xlsx)</span>
        </button>
      </div>

      {/* Main Import Workspace */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Module Sub-tabs */}
        <div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Bagian yang Ingin Diimpor:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setActiveImportTab('materials');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                activeImportTab === 'materials'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Boxes size={20} className={activeImportTab === 'materials' ? 'text-slate-950' : 'text-amber-600'} />
              <div>
                <p className="text-xs font-black">Bahan Baku</p>
                <p className="text-[10px] opacity-80">Stok fisik & harga modal</p>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveImportTab('menu');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                activeImportTab === 'menu'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Utensils size={20} className={activeImportTab === 'menu' ? 'text-slate-950' : 'text-amber-600'} />
              <div>
                <p className="text-xs font-black">Menu Dimsum</p>
                <p className="text-[10px] opacity-80">Daftar harga & kategori</p>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveImportTab('bom');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                activeImportTab === 'bom'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calculator size={20} className={activeImportTab === 'bom' ? 'text-slate-950' : 'text-amber-600'} />
              <div>
                <p className="text-xs font-black">BOM (Resep HPP)</p>
                <p className="text-[10px] opacity-80">Takaran bahan per menu</p>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveImportTab('all');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                activeImportTab === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Database size={20} className={activeImportTab === 'all' ? 'text-slate-950' : 'text-amber-600'} />
              <div>
                <p className="text-xs font-black">Master 3 Sheet</p>
                <p className="text-[10px] opacity-80">Bahan + Menu + Resep</p>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Guidelines & Download Template Button */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Info size={15} className="text-amber-600" />
              <span>
                {activeImportTab === 'materials' && 'Format Kolom: Kode Bahan, Nama Bahan, Kategori, Stok Fisik, Satuan, Batas Minimum, Harga Beli Satuan'}
                {activeImportTab === 'menu' && 'Format Kolom: Kode Menu, Nama Menu, Kategori, Harga Jual, Deskripsi'}
                {activeImportTab === 'bom' && 'Format Kolom: Kode Menu, Kode Bahan, Jumlah Takaran (Qty) — otomatis memotong stok bahan & kalkulasi HPP'}
                {activeImportTab === 'all' && 'Master Workbook berisi 3 Tab sekaligus: Bahan_Baku, Menu, dan BOM_Resep'}
              </span>
            </span>
            <p className="text-[11px] text-slate-500">
              Gunakan template resmi kami agar format tabel sesuai standar sistem ERP Dimsum Mentai 77.
            </p>
          </div>

          <div>
            {activeImportTab === 'materials' && (
              <button
                onClick={downloadMaterialTemplate}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Download size={14} className="text-amber-600" />
                <span>Unduh Template Bahan Baku (.xlsx)</span>
              </button>
            )}
            {activeImportTab === 'menu' && (
              <button
                onClick={downloadMenuTemplate}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Download size={14} className="text-amber-600" />
                <span>Unduh Template Menu (.xlsx)</span>
              </button>
            )}
            {activeImportTab === 'bom' && (
              <button
                onClick={downloadBOMTemplate}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Download size={14} className="text-amber-600" />
                <span>Unduh Template BOM Resep (.xlsx)</span>
              </button>
            )}
            {activeImportTab === 'all' && (
              <button
                onClick={downloadCompleteMasterTemplate}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Download size={14} className="text-amber-600" />
                <span>Unduh Master Template 3 Sheet (.xlsx)</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center space-y-3 hover:border-amber-400 transition bg-slate-50/40">
          <Upload size={32} className="mx-auto text-amber-500" />
          <div>
            <p className="text-xs font-bold text-slate-800">
              Pilih file Excel (.xlsx / .xls) atau CSV untuk {activeImportTab.toUpperCase()}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              File akan diverifikasi dan ditampilkan pratinjaunya sebelum dimasukkan ke database sistem
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
          />
        </div>

        {/* Status Alerts */}
        {importStatus?.error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{importStatus.error}</span>
            </div>
            {importStatus.errorsList && (
              <ul className="text-[11px] text-rose-600 pl-6 list-disc">
                {importStatus.errorsList.slice(0, 4).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {importStatus?.success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold space-y-1">
            <div className="flex items-center gap-2">
              <FileCheck size={16} />
              <span>{importStatus.success}</span>
            </div>
            {importStatus.errorsList && (
              <div className="text-[11px] text-amber-800 pt-1">
                Catatan baris tidak cocok: {importStatus.errorsList.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedSheets && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                  Pratinjau Data ({currentPreviewRows.length} Baris Terdeteksi)
                </h4>
                {parsedSheets.sheetNames.length > 1 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-500">Pilih Lembar Kerja:</span>
                    <select
                      value={selectedSheetName}
                      onChange={e => setSelectedSheetName(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-slate-300 font-bold bg-white"
                    >
                      {parsedSheets.sheetNames.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={handleExecuteImport}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
              >
                Konfirmasi & Masukkan ke Sistem
              </button>
            </div>

            <div className="overflow-x-auto max-h-56 bg-white rounded-xl border border-slate-200 p-2">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                    {currentPreviewRows.length > 0 &&
                      Object.keys(currentPreviewRows[0]).slice(0, 6).map((k, i) => (
                        <th key={i} className="pb-2 px-2">{k}</th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPreviewRows.slice(0, 6).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {Object.values(row).slice(0, 6).map((val: any, cIdx) => (
                        <td key={cIdx} className="py-1.5 px-2 text-slate-700">
                          {String(val ?? '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Google Sheets Engine & Backups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
              <Cloud size={18} className="text-amber-500" />
              <span>Google Apps Script Realtime Connector</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Hubungkan ke Google Sheets aktif toko Anda untuk auto-sync setiap transaksi POS, pembelian restock (PO), dan pengeluaran operasional.
            </p>
          </div>

          <button
            onClick={onOpenGoogleSheetSettings}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
          >
            <Cloud size={14} className="text-amber-400" />
            <span>Buka Pengaturan Google Sheets Webhook</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
              <Database size={18} className="text-amber-500" />
              <span>Cadangan Database & Reset Awal</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Unduh arsip lengkap format JSON atau kembalikan semua data ke setelan demo awal Dimsum Mentai 77.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportBackupJson}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition"
            >
              Backup JSON
            </button>
            <button
              onClick={() => {
                if (confirm('Reset seluruh data kembali ke setelan awal Dimsum 77 UNPAM?')) {
                  resetAllData();
                  alert('Data berhasil direset.');
                }
              }}
              className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs border border-rose-200 transition"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
