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
  Calendar,
  CheckCircle2,
  TrendingDown,
  ShoppingBag
} from 'lucide-react';

export const PurchasingTab: React.FC = () => {
  const { materials, purchases, addPurchase, deletePurchase } = useERP();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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
      setIsSubmitting(false);
      setShowAddModal(false);
    } catch (err) {
      setIsSubmitting(false);
      alert('Gagal mencatat pembelian');
    }
  };

  const totalPurchasingSpent = purchases.reduce((sum, p) => sum + p.total, 0);

  const filteredPurchases = purchases.filter(p => {
    const q = search.toLowerCase();
    return (
      p.poNumber.toLowerCase().includes(q) ||
      p.materialName.toLowerCase().includes(q) ||
      p.supplier.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Truck size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Purchasing & Restock Bahan Baku
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat invoice pembelian dari supplier, tambah stok otomatis, dan perbarui harga modal rata-rata.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm transition text-xs"
        >
          <Plus size={16} />
          <span>+ Catat Belanja Bahan (PO)</span>
        </button>
      </div>

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
          <h3 className="text-base font-bold text-slate-800 mt-1 truncate">
            Supplier Dimsum Tangerang, Toko Plastik UNPAM
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Mitra langganan Dimsum 77</p>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-base">Riwayat Pembelian Bahan Baku (PO)</h3>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari PO, supplier, bahan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">No. PO</th>
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Supplier</th>
                <th className="pb-3">Bahan Baku</th>
                <th className="pb-3 text-right">Qty</th>
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
                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan pembelian ${po.poNumber}?`)) {
                            deletePurchase(po.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PURCHASE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="text-amber-400" size={20} />
                <h3 className="font-bold text-base">Catat Pembelian Bahan (Restock)</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Bahan Baku
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={e => handleMaterialChange(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name} (Stok Saat Ini: {m.stock} {m.unit})
                    </option>
                  ))}
                </select>
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jumlah Masuk (Qty dalam {selectedMaterial?.unit})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={qty}
                    onChange={e => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 100"
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Beli Satuan (Rp / {selectedMaterial?.unit})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 1750"
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Total Calculation banner */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">Total Pengeluaran Beli:</span>
                <span className="text-base font-black text-slate-900">
                  {formatRupiah(Number(qty || 0) * Number(unitPrice || 0))}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Kualitas super, dapat diskon borongan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian & Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
