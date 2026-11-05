import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  X,
  HardDrive,
  Share2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Laptop
} from 'lucide-react';

interface GoogleSheetsConnectModalProps {
  onClose: () => void;
}

export const GoogleSheetsConnectModal: React.FC<GoogleSheetsConnectModalProps> = ({ onClose }) => {
  const {
    firestoreStatus,
    pushAllToFirestore,
    triggerManualSync,
    isManualSyncing,
    lastManualSyncTime,
    googleUser,
    isGoogleConnected,
    spreadsheetId,
    spreadsheetUrl,
    isSyncing,
    lastSyncTime,
    syncError,
    autoSyncEnabled,
    setAutoSyncEnabled,
    connectGoogleDatabase,
    disconnectGoogleDatabase,
    syncFromGoogleSheets,
    syncToGoogleSheets,
    setCustomSpreadsheetId
  } = useERP();

  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isPushingFirestore, setIsPushingFirestore] = useState(false);

  const handlePushFirestore = async () => {
    setIsPushingFirestore(true);
    setActionMessage(null);
    const res = await triggerManualSync();
    setIsPushingFirestore(false);
    if (res.success) {
      setActionMessage({ text: res.message, type: 'success' });
    } else {
      setActionMessage({ text: res.message, type: 'error' });
    }
  };

  const handleConnect = async () => {
    setActionMessage(null);
    const res = await connectGoogleDatabase();
    if (res.success) {
      setActionMessage({ text: res.message, type: 'success' });
    } else {
      setActionMessage({ text: res.message, type: 'error' });
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Apakah Anda yakin ingin memutuskan koneksi Google Sheets Database?')) {
      await disconnectGoogleDatabase();
      setActionMessage({ text: 'Koneksi Google Sheets diputuskan.', type: 'success' });
    }
  };

  const handlePullData = async () => {
    setActionMessage(null);
    const res = await syncFromGoogleSheets();
    if (res.success) {
      setActionMessage({ text: res.message, type: 'success' });
    } else {
      setActionMessage({ text: res.message, type: 'error' });
    }
  };

  const handlePushData = async () => {
    if (confirm('Kirim seluruh data lokal saat ini untuk memperbarui Google Spreadsheet?')) {
      setActionMessage(null);
      const res = await syncToGoogleSheets();
      if (res.success) {
        setActionMessage({ text: res.message, type: 'success' });
      } else {
        setActionMessage({ text: res.message, type: 'error' });
      }
    }
  };

  const handleSaveCustomId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setActionMessage(null);
    const res = await setCustomSpreadsheetId(customInput);
    if (res.success) {
      setActionMessage({ text: res.message, type: 'success' });
      setCustomInput('');
      setShowCustomInput(false);
    } else {
      setActionMessage({ text: res.message, type: 'error' });
    }
  };

  const handleCopyId = () => {
    if (!spreadsheetId) return;
    navigator.clipboard.writeText(spreadsheetId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base text-white">Database Google Sheets Realtime</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px]">
                  MULTI-DEVICE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pusat data terintegrasi cloud via Google Drive & Google Sheets API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Cloud Firestore Status Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-700/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Cloud size={20} className={firestoreStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-xs text-white">Firebase Cloud Firestore Real-Time</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${firestoreStatus === 'connected' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                    {firestoreStatus === 'connected' ? 'OTOMATIS AKTIF' : 'MENGHUBUNGKAN'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Setiap transaksi, stok, dan menu langsung tersimpan otomatis ke cloud tanpa perlu klik sinkronisasi.
                </p>
                {lastManualSyncTime && (
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Sinkronisasi manual terakhir: {lastManualSyncTime.toLocaleTimeString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handlePushFirestore}
              disabled={isPushingFirestore || isManualSyncing}
              title="Gunakan untuk sinkronisasi manual jika koneksi internet sempat terputus"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isPushingFirestore || isManualSyncing ? 'animate-spin' : ''} />
              <span>{isPushingFirestore || isManualSyncing ? 'Menyinkronkan...' : 'Sinkronkan Manual'}</span>
            </button>
          </div>

          {/* Action notification message */}
          {actionMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Sync error alert */}
          {syncError && !actionMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center space-x-2">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{syncError}</span>
            </div>
          )}

          {/* Unauthorized Domain Resolution Guide */}
          {((actionMessage?.type === 'error' && (actionMessage.text.includes('unauthorized-domain') || actionMessage.text.includes('Authorized Domains'))) ||
            (syncError && (syncError.includes('unauthorized-domain') || syncError.includes('Authorized Domains')))) && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3 text-xs text-amber-950 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 font-black text-amber-900 text-sm">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <span>Domain Aplikasi Belum Didaftarkan di Firebase Console</span>
              </div>
              <p className="leading-relaxed text-slate-700 text-xs">
                Firebase Authentication mewajibkan setiap domain web didaftarkan ke <strong>Authorized Domains</strong> agar fitur popup Google Sign-In diizinkan berjalan secara aman.
              </p>

              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Domain Aplikasi Anda:</span>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.hostname);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2000);
                      }
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer transition"
                  >
                    {copiedDomain ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedDomain ? 'Berhasil Disalin!' : 'Salin Domain'}</span>
                  </button>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 font-bold break-all select-all">
                  {typeof window !== 'undefined' ? window.location.hostname : 'run.app'}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Cara mengatasinya (Hanya butuh 30 detik):</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px]">
                  <li>Klik tombol kuning <strong>"Buka Firebase Console"</strong> di bawah.</li>
                  <li>Di halaman pengaturan Firebase, scroll ke bagian <strong>Authorized domains</strong> lalu klik <strong>Add domain</strong>.</li>
                  <li>Paste domain di atas (tambahkan juga <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">run.app</code> & <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">vercel.app</code>) lalu klik <strong>Save</strong>.</li>
                  <li>Kembali ke aplikasi ini dan klik <strong>"Masuk dengan Google"</strong>.</li>
                </ol>
              </div>

              <div className="pt-1">
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0989370800/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs"
                >
                  <span>Buka Firebase Console Settings (Authorized Domains)</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start space-x-2.5">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px] leading-relaxed">
                  <span className="font-black text-emerald-900">Kabar Baik:</span> Database Real-Time Cloud Dimsum Mentai 77 Anda <strong>SUDAH AKTIF 100%</strong> melalui <strong>Firebase Cloud Firestore</strong>! Seluruh transaksi POS kasir, restock, stok opname, dan menu sudah langsung sinkron antar-perangkat tanpa perlu login Google sekalipun.
                </div>
              </div>
            </div>
          )}

          {/* Connection Panel */}
          {!isGoogleConnected ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Cloud size={28} />
                </div>
                <div className="max-w-md mx-auto">
                  <h4 className="font-black text-slate-900 text-sm">
                    Hubungkan Akun Google untuk Database Terpusat
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Dengan menghubungkan Google Sheets, semua perubahan data (penjualan kasir, pembelian bahan baku, stock opname, dan menu) akan tersimpan langsung di Google Drive Anda dan <strong>dapat diakses realtime dari HP, tablet, maupun laptop mana pun</strong>.
                  </p>
                </div>

                {/* Google Sign In Button */}
                <button
                  onClick={handleConnect}
                  disabled={isSyncing}
                  className="inline-flex items-center space-x-3 px-6 py-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-2xl shadow-md transition font-bold text-xs text-slate-800 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>
                    {isSyncing ? 'Menghubungkan...' : 'Masuk dengan Google (unpam.dm77@gmail.com)'}
                  </span>
                </button>
              </div>

              {/* Benefits list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                    <Laptop size={14} />
                    <span>Real-Time Multi Device</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Kasir di outlet dan owner di rumah melihat data transaksi yang sinkron detik itu juga.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                    <HardDrive size={14} />
                    <span>Otomatis di Drive</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    File spreadsheet dibuat otomatis dengan tabel Penjualan, Stok, Menu, dan Pembelian.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-700 font-bold">
                    <ShieldCheck size={14} />
                    <span>Aman & Terkendali</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Data tersimpan di Google Cloud resmi Anda sendiri, bebas diexport atau dibagikan.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Account Info */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {googleUser?.displayName ? googleUser.displayName.charAt(0) : 'G'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">
                        {googleUser?.displayName || 'Akun Google'}
                      </span>
                      <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-200/60 text-emerald-800 rounded-full text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Terhubung</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">
                      {googleUser?.email || 'unpam.dm77@gmail.com'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 transition self-start sm:self-auto"
                >
                  Putuskan Akun
                </button>
              </div>

              {/* Active Spreadsheet Details */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Google Spreadsheet Aktif
                    </span>
                    <h4 className="font-black text-sm text-slate-900 mt-0.5">
                      DIMSUM MENTAI 77 - DATABASE ERP
                    </h4>
                    {lastSyncTime && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Terakhir diperbarui: {lastSyncTime.toLocaleTimeString('id-ID')} ({lastSyncTime.toLocaleDateString('id-ID')})
                      </p>
                    )}
                  </div>

                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
                    >
                      <span>Buka di Google Sheets</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                {spreadsheetId && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 block font-mono">Spreadsheet ID:</span>
                      <span className="font-mono text-slate-700 truncate block text-[11px]">
                        {spreadsheetId}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyId}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg shrink-0 transition"
                      title="Salin ID Spreadsheet"
                    >
                      {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Real-Time Auto Sync Option */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-bold text-slate-900">
                      Sinkronisasi Otomatis Realtime Antar Device
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                      Setiap 25 Detik
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Otomatis mengambil data penjualan, stok bahan, dan menu yang diubah di device kasir/owner lain.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={e => setAutoSyncEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Manual Sync Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handlePullData}
                  disabled={isSyncing}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Tarik Data Terbaru dari Sheets</span>
                </button>

                <button
                  onClick={handlePushData}
                  disabled={isSyncing}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  <Cloud size={14} />
                  <span>Kirim Seluruh Data Lokal ke Sheets</span>
                </button>
              </div>

              {/* Custom Spreadsheet ID Drawer Toggle */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1"
                >
                  <span>{showCustomInput ? '▲ Tutup input kustom' : '▼ Gunakan Spreadsheet ID atau URL Kustom'}</span>
                </button>

                {showCustomInput && (
                  <form onSubmit={handleSaveCustomId} className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tempel URL atau ID Google Spreadsheet..."
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isSyncing || !customInput.trim()}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50"
                      >
                        Hubungkan
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Pastikan akun Google yang sedang login memiliki akses edit ke file Spreadsheet tersebut.
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Google Workspace Sheets & Drive v4</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
