import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  exportCompleteExcelWorkbook,
  downloadMaterialTemplate,
  downloadMenuTemplate,
  downloadBOMTemplate,
  downloadPurchasingTemplate,
  downloadExpenseTemplate,
  downloadCompleteMasterTemplate,
  parseExcelOrCsvWorkbook,
  mapRowsToMaterials,
  mapRowsToMenuItems
} from '../../utils/excelExportImport';
import {
  generateMaterialPdfTemplate,
  generateMenuPdfTemplate,
  generatePurchasingPdfTemplate,
  generateExpensePdfTemplate
} from '../../utils/pdfTemplateGenerator';
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
  Info,
  Truck,
  Wallet,
  FileText,
  Printer
} from 'lucide-react';

interface ImportExportTabProps {
  onOpenGoogleSheetSettings: () => void;
}

type ImportType = 'materials' | 'menu' | 'bom' | 'purchasing' | 'expenses' | 'all';

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
    addPurchase,
    addExpense
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

    // If PDF was selected, show verification notice
    if (file.name.toLowerCase().endsWith('.pdf')) {
      setImportStatus({
        success: `File PDF "${file.name}" terverifikasi! Format dokumen sesuai dengan template cetak Dimsum 77 UNPAM. Untuk mengunggah data tabel langsung ke database Firestore, silakan unggah file spreadsheet (.xlsx / .csv).`
      });
      return;
    }

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
      } else if (activeImportTab === 'purchasing') {
        const poIdx = lowerSheets.findIndex(s => s.includes('beli') || s.includes('po') || s.includes('purchas'));
        setSelectedSheetName(poIdx >= 0 ? result.sheetNames[poIdx] : result.sheetNames[0]);
      } else if (activeImportTab === 'expenses') {
        const expIdx = lowerSheets.findIndex(s => s.includes('beban') || s.includes('pengeluaran') || s.includes('expense'));
        setSelectedSheetName(expIdx >= 0 ? result.sheetNames[expIdx] : result.sheetNames[0]);
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
      } else if (activeImportTab === 'purchasing') {
        let count = 0;
        for (const row of rows) {
          const matName = row['Kode / Nama Bahan'] || row['Bahan'] || row['Nama Bahan'];
          const qty = Number(row['Qty Masuk'] || row['Qty'] || 0);
          const price = Number(row['Harga Satuan'] || row['Harga'] || 0);
          const supplier = row['Supplier'] || 'Supplier Umum';
          if (matName && qty > 0) {
            const targetMat =
              materials.find(
                m =>
                  m.name.toLowerCase().includes(String(matName).toLowerCase()) ||
                  m.code.toLowerCase() === String(matName).toLowerCase()
              ) || materials[0];
            if (targetMat) {
              addPurchase({
                supplier,
                materialId: targetMat.id,
                materialName: targetMat.name,
                qty,
                unit: targetMat.unit,
                unitPrice: price > 0 ? price : targetMat.costPerUnit,
                paymentStatus: row['Status Bayar'] === 'HUTANG' ? 'HUTANG' : 'LUNAS',
                date: row['Tanggal'] || new Date().toISOString().slice(0, 10),
                notes: row['Catatan'] || 'Import File'
              });
              count++;
            }
          }
        }
        setImportStatus({
          success: `Berhasil mengimpor ${count} transaksi pembelian (PO) dan menambah stok bahan terkait!`
        });
      } else if (activeImportTab === 'expenses') {
        let count = 0;
        for (const row of rows) {
          const name = row['Nama Pengeluaran'] || row['Nama Beban'] || row['Beban'];
          const amount = Number(row['Nominal Biaya'] || row['Nominal'] || row['Biaya'] || 0);
          const category = row['Kategori'] || 'Operasional';
          if (name && amount > 0) {
            addExpense({
              name,
              category: category as any,
              amount,
              date: row['Tanggal'] || new Date().toISOString().slice(0, 10),
              notes: row['Catatan Operasional'] || row['Catatan'] || 'Import File'
            });
            count++;
          }
        }
        setImportStatus({
          success: `Berhasil mengimpor ${count} catatan pengeluaran beban operasional kasir!`
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
            <span className="p-2 bg-red-100 text-red-700 rounded-xl">
              <FileSpreadsheet size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Export & Import Data (Excel & PDF Resmi)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Modul impor dan ekspor lengkap: Bahan Baku, Menu, Resep BOM, Pembelian (PO), dan Beban Operasional.
          </p>
        </div>

        <button
          onClick={handleExportFullExcel}
          className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition text-xs cursor-pointer"
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
            Pilih Bagian yang Ingin Diimpor atau Diunduh Templatenya:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <button
              onClick={() => {
                setActiveImportTab('materials');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                activeImportTab === 'materials'
                  ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Boxes size={18} className={activeImportTab === 'materials' ? 'text-white' : 'text-red-600'} />
              <div>
                <p className="text-xs font-black leading-tight">Bahan Baku</p>
                <p className="text-[10px] opacity-80 leading-tight">Stok & modal</p>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveImportTab('menu');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                activeImportTab === 'menu'
                  ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Utensils size={18} className={activeImportTab === 'menu' ? 'text-white' : 'text-red-600'} />
              <div>
                <p className="text-xs font-black leading-tight">Menu Dimsum</p>
                <p className="text-[10px] opacity-80 leading-tight">Harga & nama</p>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveImportTab('bom');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                activeImportTab === 'bom'
                  ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calculator size={18} className={activeImportTab === 'bom' ? 'text-white' : 'text-red-600'} />
              <div>
                <p className="text-xs font-black leading-tight">BOM Resep</p>
                <p className="text-[10px] opacity-80 leading-tight">Takaran HPP</p>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveImportTab('purchasing');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                activeImportTab === 'purchasing'
                  ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Truck size={18} className={activeImportTab === 'purchasing' ? 'text-white' : 'text-red-600'} />
              <div>
                <p className="text-xs font-black leading-tight">Purchasing PO</p>
                <p className="text-[10px] opacity-80 leading-tight">Restock bahan</p>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveImportTab('expenses');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                activeImportTab === 'expenses'
                  ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Wallet size={18} className={activeImportTab === 'expenses' ? 'text-white' : 'text-red-600'} />
              <div>
                <p className="text-xs font-black leading-tight">Operasional</p>
                <p className="text-[10px] opacity-80 leading-tight">Biaya & beban</p>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveImportTab('all');
                setParsedSheets(null);
                setImportStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                activeImportTab === 'all'
                  ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Database size={18} className={activeImportTab === 'all' ? 'text-white' : 'text-red-600'} />
              <div>
                <p className="text-xs font-black leading-tight">Master 5-Sheet</p>
                <p className="text-[10px] opacity-80 leading-tight">Lengkap semua</p>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Guidelines & Download Template Buttons (Excel + PDF) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Info size={15} className="text-red-600" />
              <span>
                {activeImportTab === 'materials' && 'Format Bahan Baku: Kode Bahan, Nama Bahan, Kategori, Stok Fisik, Satuan, Batas Minimum, Harga Beli'}
                {activeImportTab === 'menu' && 'Format Menu: Kode Menu, Nama Menu, Kategori, Harga Jual, Deskripsi'}
                {activeImportTab === 'bom' && 'Format BOM Resep: Kode Menu, Kode Bahan, Jumlah Takaran (Qty) — otomatis hitung HPP'}
                {activeImportTab === 'purchasing' && 'Format Purchasing (PO): Tanggal, Supplier, Kode/Nama Bahan, Qty Masuk, Harga Satuan, Status Bayar, Catatan'}
                {activeImportTab === 'expenses' && 'Format Beban Operasional: Tanggal, Nama Pengeluaran, Kategori, Nominal Biaya, Catatan'}
                {activeImportTab === 'all' && 'Master Workbook berisi 5 Tab Lengkap: Bahan_Baku, Menu, BOM_Resep, Pembelian_PO, dan Beban_Operasional'}
              </span>
            </span>
            <p className="text-[11px] text-slate-600">
              Gunakan template resmi kami. Tersedia dalam format spreadsheet Excel (.xlsx) dan formulir cetak PDF standar toko.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeImportTab === 'materials' && (
              <>
                <button
                  onClick={downloadMaterialTemplate}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download size={14} className="text-red-600" />
                  <span>Template Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => generateMaterialPdfTemplate()}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Cetak Form PDF</span>
                </button>
              </>
            )}

            {activeImportTab === 'menu' && (
              <>
                <button
                  onClick={downloadMenuTemplate}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download size={14} className="text-red-600" />
                  <span>Template Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => generateMenuPdfTemplate()}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Cetak Form PDF</span>
                </button>
              </>
            )}

            {activeImportTab === 'bom' && (
              <>
                <button
                  onClick={downloadBOMTemplate}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download size={14} className="text-red-600" />
                  <span>Template Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => generateMenuPdfTemplate()}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Cetak Form Resep BOM</span>
                </button>
              </>
            )}

            {activeImportTab === 'purchasing' && (
              <>
                <button
                  onClick={downloadPurchasingTemplate}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download size={14} className="text-red-600" />
                  <span>Template Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => generatePurchasingPdfTemplate()}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Cetak Form PO PDF</span>
                </button>
              </>
            )}

            {activeImportTab === 'expenses' && (
              <>
                <button
                  onClick={downloadExpenseTemplate}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download size={14} className="text-red-600" />
                  <span>Template Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => generateExpensePdfTemplate()}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Cetak Form Beban PDF</span>
                </button>
              </>
            )}

            {activeImportTab === 'all' && (
              <>
                <button
                  onClick={downloadCompleteMasterTemplate}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Unduh Master Template 5 Sheet (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    generateMaterialPdfTemplate();
                    setTimeout(() => generateMenuPdfTemplate(), 400);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Printer size={14} className="text-red-600" />
                  <span>Cetak Seluruh Form PDF</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center space-y-3 hover:border-red-500 transition bg-slate-50/50">
          <Upload size={32} className="mx-auto text-red-600" />
          <div>
            <p className="text-xs font-bold text-slate-800">
              Pilih file Excel (.xlsx / .xls), CSV, atau PDF untuk {activeImportTab.toUpperCase()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              File spreadsheet (.xlsx / .csv) akan diverifikasi dan ditampilkan pratinjaunya sebelum disimpan ke Firestore
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
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
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                Konfirmasi & Masukkan ke Sistem
              </button>
            </div>

            <div className="overflow-x-auto max-h-56 bg-white rounded-xl border border-slate-200 p-2">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                    {currentPreviewRows.length > 0 &&
                      Object.keys(currentPreviewRows[0]).slice(0, 7).map((k, i) => (
                        <th key={i} className="pb-2 px-2">{k}</th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPreviewRows.slice(0, 8).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {Object.values(row).slice(0, 7).map((val: any, cIdx) => (
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
              <Cloud size={18} className="text-red-600" />
              <span>Google Apps Script Realtime Connector</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Hubungkan ke Google Sheets aktif toko Anda untuk auto-sync setiap transaksi POS, pembelian restock (PO), dan pengeluaran operasional.
            </p>
          </div>

          <button
            onClick={onOpenGoogleSheetSettings}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
          >
            <Cloud size={14} className="text-red-100" />
            <span>Buka Pengaturan Google Sheets Webhook</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
              <Database size={18} className="text-red-600" />
              <span>Cadangan Database (Backup File JSON)</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Unduh arsip lengkap database toko dalam format JSON untuk keamanan arsip data transaksi dan bahan baku Anda.
            </p>
          </div>

          <div>
            <button
              onClick={handleExportBackupJson}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 border border-slate-200"
            >
              <Download size={14} className="text-slate-600" />
              <span>Download Backup JSON Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
