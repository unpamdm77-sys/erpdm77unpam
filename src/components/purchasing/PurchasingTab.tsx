import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { formatRupiah, formatNumber, formatDateOnly } from '../../utils/formatters';
import { PurchaseOrder, UnitType } from '../../types/erp';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  TrendingDown,
  ShoppingBag,
  Lock,
  AlertCircle
} from 'lucide-react';
import { DecimalInput } from '../common/DecimalInput';
import { DateRangeFilter, DateFilterPreset, filterItemByDateRange } from '../common/DateRangeFilter';

export const PurchasingTab: React.FC = () => {
  const { materials, purchases, addPurchase, updatePurchase, deletePurchase, currentUser } = useERP();

  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);

  // RBAC: Staff cannot edit purchasing
  const canEditPurchasing = currentUser.role !== 'STAFF';

  // Form states
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || '');
  const [supplier, setSupplier] = useState('');
  const [qty, setQty] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<'LUNAS' | 'HUTANG'>('LUNAS');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  const handleOpenAdd = (materialId?: string) => {
    if (!canEditPurchasing) return;
    setEditingPO(null);
    if (materialId) {
      setSelectedMaterialId(materialId);
      const targetMat = materials.find(m => m.id === materialId);
      if (targetMat) {
        setSupplier(targetMat.supplier || '');
        setUnitPrice(targetMat.costPerUnit || '');
      }
    } else if (materials.length > 0) {
      setSelectedMaterialId(materials[0].id);
      setSupplier(materials[0].supplier || '');
      setUnitPrice(materials[0].costPerUnit || '');
    }
    setQty('');
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (po: PurchaseOrder) => {
    if (!canEditPurchasing) return;
    setEditingPO(po);
    setSelectedMaterialId(po.materialId);
    setSupplier(po.supplier);
    setQty(po.qty);
    setUnitPrice(po.unitPrice);
    setPaymentStatus(po.paymentStatus);
    setPurchaseDate(po.date);
    setNotes(po.notes || '');
    setShowAddModal(true);
  };

  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const targetMat = materials.find(m => m.id === matId);
    if (targetMat) {
      setSupplier(targetMat.supplier || '');
      setUnitPrice(targetMat.costPerUnit || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !qty || !unitPrice) return;

    try {
      setIsSubmitting(true);
      if (editingPO) {
        await updatePurchase(editingPO.id, {
          supplier: supplier || 'Supplier Umum',
          qty: Number(qty),
          unitPrice: Number(unitPrice),
          paymentStatus,
          notes,
          date: purchaseDate
        });
      } else {
        await addPurchase({
          supplier: supplier || 'Supplier Umum',
          materialId: selectedMaterial.id,
          materialName: selectedMaterial.name,
          qty: Number(qty),
          unit: selectedMaterial.unit,
          unitPrice: Number(unitPrice),
          paymentStatus,
          notes,
          date: purchaseDate
        });
      }
      setIsSubmitting(false);
      setShowAddModal(false);
    } catch (err) {
      setIsSubmitting(false);
      alert('Gagal menyimpan perubahan pembelian');
    }
  };

  const totalPurchasingSpent = purchases.reduce((sum, p) => sum + p.total, 0);

  const filteredPurchases = purchases.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.poNumber.toLowerCase().includes(q) ||
      p.materialName.toLowerCase().includes(q) ||
      p.supplier.toLowerCase().includes(q);

    const matchesDate = filterItemByDateRange(p.date, datePreset, startDate, endDate);

    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-red-100 text-red-700 rounded-xl">
              <Truck size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Purchasing & Restock Bahan Baku
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat invoice pembelian dari supplier, sesuaikan (adjust) faktur yang keliru, dan sinkronkan stok otomatis.
          </p>
        </div>

        {canEditPurchasing ? (
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition text-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Catat Belanja Bahan (PO)</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold border border-slate-200">
            <Lock size={14} />
            <span>Mode Lihat ({currentUser.role})</span>
          </div>
        )}
      </div>

      {!canEditPurchasing && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>
            <strong>Informasi Akses:</strong> Akun Anda berstatus <strong>STAFF</strong>. Staff kasir dapat melihat riwayat faktur pembelian bahan, tetapi tidak diizinkan membuat atau mengubah data Purchasing. Otorisasi belanja dipegang oleh Kepala Toko / Supervisi, Finance, atau Owner.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Pengeluaran Restock</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(totalPurchasingSpent)}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Seluruh PO tercatat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Jumlah Pembelian (PO)</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{purchases.length} Faktur</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Stok otomatis bertambah</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Supplier Utama</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {purchases.length > 0 ? purchases[0].supplier : 'Belum Ada'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Langganan terdekat UNPAM</p>
        </div>
      </div>

      {/* PURCHASES TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-red-600" />
            <span className="text-xs font-bold text-slate-800">Filter Tanggal Restock:</span>
          </div>
          <DateRangeFilter
            preset={datePreset}
            onPresetChange={setDatePreset}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-sm">Arsip Faktur & Surat Jalan Pembelian</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari No. PO, Supplier, Bahan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">No. PO</th>
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Supplier</th>
                <th className="pb-3">Bahan Baku</th>
                <th className="pb-3 text-right">Qty Masuk</th>
                <th className="pb-3 text-right">Harga Satuan</th>
                <th className="pb-3 text-right">Total Biaya</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat pembelian bahan.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-mono font-bold text-slate-900">{po.poNumber}</td>
                    <td className="py-3 text-slate-500">{formatDateOnly(po.date)}</td>
                    <td className="py-3 font-semibold text-slate-800">{po.supplier}</td>
                    <td className="py-3 font-bold text-slate-900">{po.materialName}</td>
                    <td className="py-3 text-right font-semibold text-slate-800">
                      {formatNumber(po.qty)} {po.unit}
                    </td>
                    <td className="py-3 text-right text-slate-600">{formatRupiah(po.unitPrice)}</td>
                    <td className="py-3 text-right font-black text-slate-900">{formatRupiah(po.total)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        po.paymentStatus === 'LUNAS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {po.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {canEditPurchasing ? (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(po)}
                            className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            title="Adjust / Edit Faktur PO"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus catatan pembelian ${po.poNumber}?`)) {
                                deletePurchase(po.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus PO"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PURCHASE MODAL */}
      {showAddModal && canEditPurchasing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="text-amber-400" size={20} />
                <h3 className="font-bold text-base">
                  {editingPO ? `Adjust / Edit Faktur Pembelian (${editingPO.poNumber})` : 'Catat Pembelian Bahan (Restock)'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Bahan Baku
                </label>
                <select
                  disabled={Boolean(editingPO)}
                  value={selectedMaterialId}
                  onChange={e => handleMaterialChange(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name} (Stok: {m.stock} {m.unit})
                    </option>
                  ))}
                </select>
                {editingPO && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Bahan baku terkunci pada PO ini. Untuk mengganti bahan, buat PO baru.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Supplier / Toko
                  </label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="Contoh: Toko Plastik UNPAM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jumlah Masuk (Qty dalam {selectedMaterial?.unit})
                  </label>
                  <DecimalInput
                    value={qty}
                    onChange={val => setQty(val)}
                    unit={selectedMaterial?.unit}
                    min={0.01}
                    placeholder="0"
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Beli per {selectedMaterial?.unit} (Rp)
                  </label>
                  <DecimalInput
                    value={unitPrice}
                    onChange={val => setUnitPrice(val)}
                    min={0}
                    placeholder="0"
                    showQuickHelpers={false}
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="LUNAS">LUNAS (Kas Keluar)</option>
                    <option value="HUTANG">HUTANG / TEMPO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Biaya
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 font-black text-slate-900 border border-slate-200">
                    {formatRupiah(Number(qty || 0) * Number(unitPrice || 0))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Catatan Tambahan (Purchasing)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Misal: Nomor nota supplier / nomor resi / keterangan tempo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-2 text-[11px] text-slate-800">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {editingPO ? (
                    <>Penyesuaian (adjust) pada PO ini akan otomatis mengoreksi stok fisik bahan baku dan harga rata-rata secara akurat.</>
                  ) : (
                    <>Stok bahan <strong>{selectedMaterial?.name}</strong> akan otomatis bertambah <strong>+{qty || 0} {selectedMaterial?.unit}</strong> setelah disimpan.</>
                  )}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingPO ? 'Simpan Penyesuaian (Adjust)' : 'Simpan Pembelian')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
