import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { StockRequest } from '../../types/erp';
import { formatRupiah } from '../../utils/formatters';
import { DecimalInput } from '../common/DecimalInput';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Building,
  Check,
  X,
  FileText
} from 'lucide-react';
import { sendToGoogleChatWebhook, formatRsiChatNotification } from '../../services/googleChat';

export const StockRequestTab: React.FC = () => {
  const {
    stockRequests,
    materials,
    currentUser,
    addStockRequest,
    commitStockRequest,
    deleteStockRequest
  } = useERP();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMMITTED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState<StockRequest | null>(null);
  const [showGoogleChatModal, setShowGoogleChatModal] = useState(false);
  const [googleChatWebhookUrl, setGoogleChatWebhookUrl] = useState(() => {
    return localStorage.getItem('dm77_gchat_webhook_url') || '';
  });
  const [chatNoticeSuccess, setChatNoticeSuccess] = useState<string | null>(null);
  const [chatNoticeError, setChatNoticeError] = useState<string | null>(null);

  // Form States for New Request
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');
  const [qty, setQty] = useState<number>(1);
  const [purposeCategory, setPurposeCategory] = useState<StockRequest['purposeCategory']>('Operasional Toko');
  const [requestedByName, setRequestedByName] = useState<string>(currentUser.name);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission check: Supervisor, Manager, or Owner can approve (COMMIT) and delete any request
  const canApprove =
    currentUser.role === 'OWNER' ||
    currentUser.role === 'SUPERVISOR' ||
    (currentUser.role as string) === 'MANAGER';

  // Save Google Chat Webhook URL
  const handleSaveGoogleChatWebhook = () => {
    localStorage.setItem('dm77_gchat_webhook_url', googleChatWebhookUrl.trim());
    setChatNoticeSuccess('URL Webhook Google Chat berhasil disimpan!');
    setTimeout(() => setChatNoticeSuccess(null), 3000);
  };

  // Helper to send Google Chat message
  const triggerGoogleChatAlert = async (action: 'REQUEST_CREATED' | 'REQUEST_COMMITTED', rsi: StockRequest) => {
    const url = googleChatWebhookUrl.trim() || localStorage.getItem('dm77_gchat_webhook_url') || '';
    if (!url) return;

    try {
      const payload = formatRsiChatNotification(action, {
        requestNo: rsi.requestNo,
        materialName: rsi.materialName,
        qty: rsi.qty,
        unit: rsi.unit,
        purposeCategory: rsi.purposeCategory,
        requestedBy: rsi.requestedBy,
        notes: rsi.notes,
        committedBy: rsi.committedBy
      });
      await sendToGoogleChatWebhook(url, payload);
    } catch (err) {
      console.warn('Google Chat notification failed:', err);
    }
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalCount = stockRequests.length;
    const pendingCount = stockRequests.filter(r => r.status === 'PENDING').length;
    const committedCount = stockRequests.filter(r => r.status === 'COMMITTED').length;
    const totalCommittedCost = stockRequests
      .filter(r => r.status === 'COMMITTED')
      .reduce((sum, r) => sum + (r.totalCost || 0), 0);

    return { totalCount, pendingCount, committedCount, totalCommittedCost };
  }, [stockRequests]);

  // Filtered RSI List
  const filteredRequests = useMemo(() => {
    return stockRequests.filter(req => {
      // 1. Search Query
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        req.requestNo.toLowerCase().includes(query) ||
        req.materialName.toLowerCase().includes(query) ||
        req.materialCode.toLowerCase().includes(query) ||
        req.requestedBy.toLowerCase().includes(query) ||
        (req.notes && req.notes.toLowerCase().includes(query)) ||
        (req.committedBy && req.committedBy.toLowerCase().includes(query));

      // 2. Status Filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && req.status === 'PENDING') ||
        (statusFilter === 'COMMITTED' && req.status === 'COMMITTED');

      // 3. Category Filter
      const matchesCategory =
        categoryFilter === 'ALL' || req.purposeCategory === categoryFilter;

      // 4. Date Filter
      let matchesDate = true;
      if (req.date) {
        const reqDate = new Date(req.date);
        const now = new Date();

        if (dateFilter === 'TODAY') {
          matchesDate = reqDate.toDateString() === now.toDateString();
        } else if (dateFilter === '7DAYS') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = reqDate >= sevenDaysAgo;
        } else if (dateFilter === 'MONTH') {
          matchesDate =
            reqDate.getMonth() === now.getMonth() &&
            reqDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'CUSTOM') {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            matchesDate = matchesDate && reqDate >= start;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && reqDate <= end;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [stockRequests, search, statusFilter, categoryFilter, dateFilter, customStartDate, customEndDate]);

  // Handle Create RSI
  const handleOpenCreateModal = () => {
    setSelectedMaterialId(materials[0]?.id || '');
    setQty(1);
    setPurposeCategory('Operasional Toko');
    setRequestedByName(currentUser.name);
    setNotes('');
    setShowCreateModal(true);
  };

  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || qty <= 0) return;

    setIsSubmitting(true);
    const created = addStockRequest({
      materialId: selectedMaterialId,
      qty: Number(qty),
      purposeCategory,
      requestedBy: requestedByName.trim() || currentUser.name,
      notes: notes.trim()
    });

    if (created) {
      triggerGoogleChatAlert('REQUEST_CREATED', created);
    }

    setIsSubmitting(false);
    setShowCreateModal(false);
  };

  // Handle Commit RSI (Execute Stock Decrease)
  const handleConfirmCommit = async () => {
    if (!showCommitModal) return;

    setIsSubmitting(true);
    const res = await commitStockRequest(showCommitModal.id, currentUser.name);

    if (res.success) {
      const updatedReq = {
        ...showCommitModal,
        status: 'COMMITTED' as const,
        committedBy: currentUser.name,
        committedAt: new Date().toISOString()
      };
      triggerGoogleChatAlert('REQUEST_COMMITTED', updatedReq);
    }

    setIsSubmitting(false);
    setShowCommitModal(null);
  };

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <ClipboardList size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Request Stok Inventaris (RSI)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan & persetujuan pengeluaran stok di luar penjualan kasir (operasional toko, tisu, baterai, gas LPG, perlengkapan sanitasi).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Google Chat Space Settings Button */}
          <button
            onClick={() => setShowGoogleChatModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs border border-slate-200"
            title="Integrasi Google Chat"
          >
            <MessageSquare size={15} className="text-emerald-600" />
            <span>Google Chat</span>
          </button>

          {/* Create New Request Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition text-xs"
          >
            <Plus size={16} />
            <span>Buat Request Stok</span>
          </button>
        </div>
      </div>

      {/* Role Notice */}
      <div className="p-3 bg-slate-100/80 border border-slate-200/70 text-slate-700 rounded-2xl text-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={16} className={canApprove ? 'text-emerald-600' : 'text-amber-600'} />
          <span>
            Login sebagai: <strong>{currentUser.name}</strong> ({currentUser.role}) —{' '}
            {canApprove ? (
              <span className="text-emerald-700 font-semibold">
                Memiliki hak akses <strong>Approval (COMMIT)</strong> & <strong>DELETE</strong> pengajuan stok.
              </span>
            ) : (
              <span className="text-slate-600">
                Mode Staff: Anda dapat mengajukan request stok. Persetujuan dilakukan oleh Supervisor / Manager / Owner.
              </span>
            )}
          </span>
        </div>
        {metrics.pendingCount > 0 && canApprove && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 animate-pulse">
            {metrics.pendingCount} Menunggu Approval
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Pengajuan</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{metrics.totalCount}</span>
            <span className="text-xs text-slate-400">RSI</span>
          </div>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-3xl border border-amber-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Menunggu Approval</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-900">{metrics.pendingCount}</span>
            <span className="text-xs text-amber-700">PENDING</span>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-3xl border border-emerald-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Disetujui & Dikeluarkan</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-900">{metrics.committedCount}</span>
            <span className="text-xs text-emerald-700">COMMITTED</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Biaya Operasional</span>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900">
              {formatRupiah(metrics.totalCommittedCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari no. RSI, bahan, pemohon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({stockRequests.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span>NOT COMMITTED (PENDING)</span>
              {metrics.pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'PENDING' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'}`}>
                  {metrics.pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('COMMITTED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                statusFilter === 'COMMITTED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span>COMMITTED</span>
              {metrics.committedCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'COMMITTED' ? 'bg-emerald-800 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
                  {metrics.committedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Date Filter & Purpose Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 items-center justify-between text-xs">
          <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Filter Waktu:</span>
            {[
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'TODAY', label: 'Hari Ini' },
              { id: '7DAYS', label: '7 Hari' },
              { id: 'MONTH', label: 'Bulan Ini' },
              { id: 'CUSTOM', label: 'Rentang Kustom' }
            ].map(df => (
              <button
                key={df.id}
                onClick={() => setDateFilter(df.id as any)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition text-[11px] ${
                  dateFilter === df.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Tujuan:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Operasional Toko">Operasional Toko</option>
              <option value="Kebersihan & Sanitasi">Kebersihan & Sanitasi</option>
              <option value="Peralatan Kitchen">Peralatan Kitchen</option>
              <option value="Packaging Tambahan">Packaging Tambahan</option>
              <option value="Listrik / Gas / Baterai">Listrik / Gas / Baterai</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500">Dari:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white"
            />
            <span className="text-[11px] font-bold text-slate-500">Sampai:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        )}
      </div>

      {/* RSI Requests Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <ClipboardList size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Tidak Ada Data Request Stok</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL' || dateFilter !== 'ALL'
                ? 'Tidak ada pengajuan yang sesuai dengan kriteria filter atau pencarian Anda.'
                : 'Belum ada pengajuan request stok inventaris yang dibuat.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              + Buat Request Stok Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">No. RSI & Tanggal</th>
                  <th className="py-3 px-4">Barang / Bahan Baku</th>
                  <th className="py-3 px-4">Jumlah (Qty)</th>
                  <th className="py-3 px-4">Estimasi Biaya</th>
                  <th className="py-3 px-4">Kategori & Keperluan</th>
                  <th className="py-3 px-4">Pemohon</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi / Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map(req => {
                  const isPending = req.status === 'PENDING';
                  const dateStr = req.date
                    ? new Date(req.date).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      {/* No RSI */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{req.requestNo}</span>
                        <span className="text-[10px] text-slate-400">{dateStr}</span>
                      </td>

                      {/* Material Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{req.materialName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.materialCode}</div>
                      </td>

                      {/* Qty & Unit */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="text-sm font-black text-red-700">{req.qty}</span>{' '}
                        <span className="text-xs text-slate-500">{req.unit}</span>
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{formatRupiah(req.totalCost || 0)}</div>
                        <div className="text-[10px] text-slate-400">
                          @{formatRupiah(req.costPerUnit || 0)}/{req.unit}
                        </div>
                      </td>

                      {/* Purpose & Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {req.purposeCategory}
                        </span>
                        {req.notes && (
                          <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-2">
                            "{req.notes}"
                          </p>
                        )}
                      </td>

                      {/* Requester */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{req.requestedBy}</span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300/80">
                            <Clock size={11} />
                            <span>NOT COMMITTED (PENDING)</span>
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                              <CheckCircle2 size={11} />
                              <span>COMMITTED</span>
                            </span>
                            {req.committedBy && (
                              <div className="text-[9px] text-slate-400 mt-1">
                                Disetujui: <strong className="text-slate-600">{req.committedBy}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            {canApprove ? (
                              <>
                                {/* COMMIT Button (Supervisor, Manager, Owner) */}
                                <button
                                  onClick={() => setShowCommitModal(req)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition text-[11px] flex items-center space-x-1"
                                  title="Setujui dan otomatis kurangi stok"
                                >
                                  <Check size={13} />
                                  <span>COMMIT</span>
                                </button>

                                {/* DELETE Button */}
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus/Tolak pengajuan ${req.requestNo} (${req.materialName})?`)) {
                                      deleteStockRequest(req.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition border border-rose-200"
                                  title="Hapus / Tolak Request"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <div className="text-[10px] text-amber-700 font-semibold italic">
                                Menunggu Approval
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-[10px] font-semibold text-emerald-700">
                              Stok Terpotong
                            </span>
                            {canApprove && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus catatan riwayat ${req.requestNo}? (Stok bahan tidak akan dikembalikan otomatis)`)) {
                                    deleteStockRequest(req.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-300 hover:text-rose-500"
                                title="Hapus Riwayat Catatan"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Buat Request Stok Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <ClipboardList size={18} />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Form Pengajuan Request Stok (RSI)
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ajukan pengeluaran bahan untuk kebutuhan di luar penjualan menu, seperti baterai timbangan, sabun cuci, tisu makan, atau gas LPG.
            </p>

            <form onSubmit={handleSubmitNewRequest} className="space-y-4 text-xs">
              {/* Select Material */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Bahan Baku / Barang Operasional
                </label>
                <select
                  required
                  value={selectedMaterialId}
                  onChange={e => setSelectedMaterialId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code}) — Sisa Stok: {m.stock} {m.unit} — Biaya: {formatRupiah(m.costPerUnit)}/{m.unit}
                    </option>
                  ))}
                </select>
                {selectedMaterial && (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Sisa stok di sistem: <strong>{selectedMaterial.stock} {selectedMaterial.unit}</strong>
                    </span>
                    <span>
                      Harga beli: <strong>{formatRupiah(selectedMaterial.costPerUnit)}</strong>/{selectedMaterial.unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Qty Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jumlah yang Diminta ({selectedMaterial?.unit || 'unit'})
                  </label>
                  <DecimalInput
                    value={qty}
                    onChange={val => setQty(val)}
                    unit={selectedMaterial?.unit}
                    min={0.01}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-slate-900 text-sm"
                  />
                  {selectedMaterial && qty > selectedMaterial.stock && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Jumlah melebihi stok yang ada ({selectedMaterial.stock} {selectedMaterial.unit})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tujuan Penggunaan
                  </label>
                  <select
                    value={purposeCategory}
                    onChange={e => setPurposeCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="Operasional Toko">Operasional Toko</option>
                    <option value="Kebersihan & Sanitasi">Kebersihan & Sanitasi</option>
                    <option value="Peralatan Kitchen">Peralatan Kitchen</option>
                    <option value="Packaging Tambahan">Packaging Tambahan</option>
                    <option value="Listrik / Gas / Baterai">Listrik / Gas / Baterai</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              {/* Requester Name */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Pemohon
                </label>
                <input
                  type="text"
                  required
                  value={requestedByName}
                  onChange={e => setRequestedByName(e.target.value)}
                  placeholder="Nama staf pemohon..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              {/* Purpose Notes */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Keterangan / Keperluan Lengkap
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Baterai AA untuk timbangan digital dapur & mouse kasir..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Cost Summary Box */}
              {selectedMaterial && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900">Total Nilai Biaya Stok:</span>
                  <span className="font-black text-amber-950 text-sm">
                    {formatRupiah(qty * selectedMaterial.costPerUnit)}
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedMaterialId || qty <= 0}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
                >
                  Kirim Pengajuan RSI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi COMMIT (Eksekusi Pengurangan Stok) */}
      {showCommitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2.5">
              <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Setujui & Eksekusi Pengurangan Stok
                </h3>
                <p className="text-[11px] text-slate-500">Nomor: {showCommitModal.requestNo}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Barang:</span>
                <span className="font-bold text-slate-900">{showCommitModal.materialName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Keluar:</span>
                <span className="font-black text-red-600">
                  {showCommitModal.qty} {showCommitModal.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan:</span>
                <span className="font-semibold text-slate-800">{showCommitModal.purposeCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pemohon:</span>
                <span className="font-semibold text-slate-800">{showCommitModal.requestedBy}</span>
              </div>
              {showCommitModal.notes && (
                <div className="pt-1 border-t border-slate-200 text-slate-600 text-[11px]">
                  <strong>Catatan:</strong> "{showCommitModal.notes}"
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                Saat Anda menekan <strong>COMMIT</strong>, sistem otomatis <strong>mengurangi stok bahan</strong> di inventaris dan mencatat Anda ({currentUser.name}) sebagai pihak yang menyetujui.
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCommitModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmCommit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs text-xs flex items-center space-x-1.5"
              >
                <Check size={14} />
                <span>{isSubmitting ? 'Memproses...' : 'COMMIT (Setujui & Potong Stok)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Google Chat Integration Settings */}
      {showGoogleChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <MessageSquare size={18} />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Integrasi Notifikasi Google Chat
                </h3>
              </div>
              <button
                onClick={() => setShowGoogleChatModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Hubungkan sistem RSI dengan Google Chat Space toko untuk menerima pesan otomatis saat ada pengajuan baru atau stok yang di-commit.
            </p>

            {chatNoticeSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold">
                {chatNoticeSuccess}
              </div>
            )}
            {chatNoticeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold">
                {chatNoticeError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Google Chat Incoming Webhook URL
                </label>
                <input
                  type="text"
                  value={googleChatWebhookUrl}
                  onChange={e => setGoogleChatWebhookUrl(e.target.value)}
                  placeholder="https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Cara dapatkan Webhook di Google Chat: Masuk ke Space Google Chat &rarr; Klik nama Space &rarr; "Apps & Integrations" &rarr; "Manage webhooks" &rarr; "Add webhook" &rarr; Copy URL lalu paste di sini.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Uji Coba Kirim Pesan:</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!googleChatWebhookUrl.trim()) {
                        setChatNoticeError('Harap masukkan URL Webhook terlebih dahulu.');
                        return;
                      }
                      setChatNoticeError(null);
                      const res = await sendToGoogleChatWebhook(googleChatWebhookUrl.trim(), {
                        text: `🔔 *[TEST KONEKSI ERP POS DIMSUM MENTAI 77]*\nSistem notifikasi Google Chat berhasil terhubung pada ${new Date().toLocaleString('id-ID')}!`
                      });
                      if (res.success) {
                        setChatNoticeSuccess(res.message);
                      } else {
                        setChatNoticeError(res.message);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
                  >
                    <Send size={12} />
                    <span>Kirim Test Pesan</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowGoogleChatModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveGoogleChatWebhook}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-xs text-xs"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
