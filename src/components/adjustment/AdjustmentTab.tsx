import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { StockAdjustment } from '../../types/erp';
import { formatRupiah, formatNumber, formatDateTime } from '../../utils/formatters';
import {
  Sliders,
  Plus,
  AlertOctagon,
  Search,
  CheckCircle2,
  TrendingDown,
  RotateCcw
} from 'lucide-react';

export const AdjustmentTab: React.FC = () => {
  const { materials, adjustments, addAdjustment, config } = useERP();

  const [showModal, setShowModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || '');
  const [actualStock, setActualStock] = useState<number | ''>('');
  const [reason, setReason] = useState<StockAdjustment['reason']>('Selisih Hitung / Opname');
  const [search, setSearch] = useState('');

  const selectedMat = materials.find(m => m.id === selectedMaterialId);
  const systemStock = selectedMat ? selectedMat.stock : 0;
  const difference = typeof actualStock === 'number' ? actualStock - systemStock : 0;
  const lossCost = difference < 0 && selectedMat ? Math.abs(difference) * selectedMat.costPerUnit : 0;

  const handleOpenAdd = () => {
    if (materials.length > 0) {
      setSelectedMaterialId(materials[0].id);
      setActualStock(materials[0].stock);
    }
    setReason('Selisih Hitung / Opname');
    setShowModal(true);
  };

  const handleMaterialChange = (id: string) => {
    setSelectedMaterialId(id);
    const m = materials.find(mat => mat.id === id);
    if (m) {
      setActualStock(m.stock);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMat || typeof actualStock !== 'number') return;

    addAdjustment({
      materialId: selectedMat.id,
      actualStock,
      reason,
      adjustedBy: config.cashierName
    });

    setShowModal(false);
  };

  const totalLoss = adjustments.reduce((sum, a) => sum + a.lossCost, 0);

  const filteredAdjustments = adjustments.filter(a => {
    const q = search.toLowerCase();
    return a.materialName.toLowerCase().includes(q) || a.reason.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Sliders size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Stok Adjustment (Stock Opname)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan stok sistem dengan perhitungan fisik nyata di outlet bila terjadi selisih, bahan rusak, atau tumpah.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm transition text-xs"
        >
          <Plus size={16} />
          <span>+ Catat Penyesuaian Stok (Opname)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Penyesuaian Dilakukan</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{adjustments.length} Kali</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Audit fisik outlet</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Nilai Susut / Waste</p>
          <h3 className="text-2xl font-black text-rose-600 mt-1">{formatRupiah(totalLoss)}</h3>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">Kerugian bahan terbuang</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Petugas Audit Terakhir</p>
          <h3 className="text-base font-bold text-slate-800 mt-1 truncate">
            {adjustments[0]?.adjustedBy || config.cashierName}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Verifikasi penanggung jawab shift</p>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-base">Riwayat Stock Opname & Penyesuaian</h3>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari bahan, alasan..."
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
                <th className="pb-3">Waktu</th>
                <th className="pb-3">Bahan Baku</th>
                <th className="pb-3 text-right">Stok Sistem</th>
                <th className="pb-3 text-right">Stok Nyata</th>
                <th className="pb-3 text-right">Selisih</th>
                <th className="pb-3">Alasan / Kategori</th>
                <th className="pb-3 text-right">Estimasi Nilai</th>
                <th className="pb-3 text-right">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat penyesuaian stok opname.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 text-slate-500">{formatDateTime(adj.date)}</td>
                    <td className="py-3 font-bold text-slate-900">{adj.materialName}</td>
                    <td className="py-3 text-right text-slate-600">
                      {formatNumber(adj.systemStock)} {adj.unit}
                    </td>
                    <td className="py-3 text-right font-black text-slate-900">
                      {formatNumber(adj.actualStock)} {adj.unit}
                    </td>
                    <td className="py-3 text-right font-bold">
                      <span className={adj.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {adj.difference > 0 ? `+${formatNumber(adj.difference)}` : formatNumber(adj.difference)} {adj.unit}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-semibold">
                        {adj.reason}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-rose-600">
                      {adj.lossCost > 0 ? `-${formatRupiah(adj.lossCost)}` : '-'}
                    </td>
                    <td className="py-3 text-right text-slate-500">{adj.adjustedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="text-amber-400" size={20} />
                <h3 className="font-bold text-base">Catat Stok Opname & Penyesuaian</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Bahan Baku yang Dihitung
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={e => handleMaterialChange(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Sistem: {m.stock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Stok di Sistem</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {systemStock} {selectedMat?.unit}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Harga Pokok per {selectedMat?.unit}</span>
                  <p className="text-base font-bold text-amber-700 mt-0.5">
                    {formatRupiah(selectedMat?.costPerUnit || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hasil Hitung Fisik Nyata ({selectedMat?.unit})
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={actualStock}
                    onChange={e => setActualStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full font-black text-lg px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alasan Penyesuaian
                  </label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="Selisih Hitung / Opname">Selisih Hitung / Opname</option>
                    <option value="Barang Rusak / Basi">Barang Rusak / Basi</option>
                    <option value="Tumpah / Waste Masak">Tumpah / Waste Masak</option>
                    <option value="Kadaluarsa (Expired)">Kadaluarsa (Expired)</option>
                    <option value="Tester / Konsumsi">Tester / Konsumsi Pegawai</option>
                    <option value="Koreksi Lainnya">Koreksi Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Difference and loss indicator */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">Selisih Koreksi:</span>
                  <span className={`ml-2 font-black ${difference < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {difference > 0 ? `+${difference}` : difference} {selectedMat?.unit}
                  </span>
                </div>
                {lossCost > 0 && (
                  <span className="font-bold text-rose-700">
                    Nilai Kerugian: -{formatRupiah(lossCost)}
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  Simpan Koreksi Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
