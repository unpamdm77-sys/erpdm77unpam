import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Material, UnitType } from '../../types/erp';
import { formatRupiah, formatNumber, formatDateOnly } from '../../utils/formatters';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  ShoppingCart,
  TrendingDown,
  PackageCheck
} from 'lucide-react';

interface MaterialsTabProps {
  onSwitchTab?: (tabId: string) => void;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ onSwitchTab }) => {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useERP();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingMat, setEditingMat] = useState<Material | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Material['category']>('Daging & Isian');
  const [stock, setStock] = useState<number | ''>('');
  const [unit, setUnit] = useState<UnitType>('pcs');
  const [minStock, setMinStock] = useState<number | ''>('');
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('');
  const [supplier, setSupplier] = useState('');

  const handleOpenAdd = () => {
    setEditingMat(null);
    setCode(`B-${(materials.length + 1).toString().padStart(2, '0')}`);
    setName('');
    setCategory('Daging & Isian');
    setStock('');
    setUnit('pcs');
    setMinStock(20);
    setCostPerUnit('');
    setSupplier('');
    setShowModal(true);
  };

  const handleOpenEdit = (m: Material) => {
    setEditingMat(m);
    setCode(m.code);
    setName(m.name);
    setCategory(m.category);
    setStock(m.stock);
    setUnit(m.unit);
    setMinStock(m.minStock);
    setCostPerUnit(m.costPerUnit);
    setSupplier(m.supplier || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingMat) {
      updateMaterial(editingMat.id, {
        code,
        name,
        category,
        stock: Number(stock || 0),
        unit,
        minStock: Number(minStock || 0),
        costPerUnit: Number(costPerUnit || 0),
        supplier
      });
    } else {
      addMaterial({
        code,
        name,
        category,
        stock: Number(stock || 0),
        unit,
        minStock: Number(minStock || 0),
        costPerUnit: Number(costPerUnit || 0),
        supplier
      });
    }
    setShowModal(false);
  };

  const totalAssetValue = materials.reduce((sum, m) => sum + m.stock * m.costPerUnit, 0);
  const lowStockCount = materials.filter(m => m.stock <= m.minStock).length;
  const outOfStockCount = materials.filter(m => m.stock <= 0).length;

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'Semua' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Boxes size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Manajemen Stok Bahan Baku
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data inventaris bahan baku mentah, bumbu, kemasan mika, dan batas minimum stok.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm transition text-xs"
        >
          <Plus size={16} />
          <span>+ Tambah Bahan Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Jenis Bahan</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{materials.length} Item</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Semua kategori</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Nilai Aset Stok</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(totalAssetValue)}</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Modal terikat bahan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Stok Menipis (Warning)</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{lowStockCount} Bahan</h3>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">Perlu dipantau</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Stok Habis Total</p>
          <h3 className="text-2xl font-black text-rose-600 mt-1">{outOfStockCount} Bahan</h3>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">Segera restock</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['Semua', 'Daging & Isian', 'Saus & Bumbu', 'Topping & Keju', 'Kemasan & Alat', 'Bahan Minuman'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama bahan, kode..."
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
                <th className="pb-3">Kode</th>
                <th className="pb-3">Nama Bahan Baku</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3 text-right">Stok Fisik</th>
                <th className="pb-3 text-right">Batas Min</th>
                <th className="pb-3 text-right">Harga Satuan</th>
                <th className="pb-3 text-right">Total Nilai</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map(mat => {
                const isOutOfStock = mat.stock <= 0;
                const isLow = mat.stock <= mat.minStock;
                const totalVal = mat.stock * mat.costPerUnit;

                return (
                  <tr key={mat.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-mono font-bold text-slate-800">{mat.code}</td>
                    <td className="py-3">
                      <p className="font-bold text-slate-900">{mat.name}</p>
                      {mat.supplier && (
                        <p className="text-[10px] text-slate-400">Supplier: {mat.supplier}</p>
                      )}
                    </td>
                    <td className="py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {mat.category}
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-slate-900">
                      {formatNumber(mat.stock)} <span className="text-[10px] text-slate-500 font-normal">{mat.unit}</span>
                    </td>
                    <td className="py-3 text-right text-slate-500">
                      {formatNumber(mat.minStock)} {mat.unit}
                    </td>
                    <td className="py-3 text-right text-slate-700">{formatRupiah(mat.costPerUnit)}</td>
                    <td className="py-3 text-right font-black text-slate-900">{formatRupiah(totalVal)}</td>
                    <td className="py-3 text-center">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          HABIS
                        </span>
                      ) : isLow ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          MENIPIS
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          AMAN
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right space-x-1">
                      {onSwitchTab && (
                        <button
                          title="Restock Sekarang"
                          onClick={() => onSwitchTab('purchasing')}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                        >
                          <ShoppingCart size={14} />
                        </button>
                      )}
                      <button
                        title="Edit Bahan"
                        onClick={() => handleOpenEdit(mat)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        title="Hapus Bahan"
                        onClick={() => {
                          if (confirm(`Hapus bahan baku "${mat.name}"?`)) {
                            deleteMaterial(mat.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MATERIAL MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Boxes className="text-amber-400" size={20} />
                <h3 className="font-bold text-base">
                  {editingMat ? 'Edit Data Bahan Baku' : 'Tambah Bahan Baku Baru'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Kode</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Bahan</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Saus Mentai Khusus"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="Daging & Isian">Daging & Isian</option>
                    <option value="Saus & Bumbu">Saus & Bumbu</option>
                    <option value="Topping & Keju">Topping & Keju</option>
                    <option value="Kemasan & Alat">Kemasan & Alat</option>
                    <option value="Bahan Minuman">Bahan Minuman</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Satuan</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="pcs">pcs (biji / porsi)</option>
                    <option value="gr">gr (gram)</option>
                    <option value="kg">kg (kilogram)</option>
                    <option value="ml">ml (mililiter)</option>
                    <option value="liter">liter</option>
                    <option value="lembar">lembar</option>
                    <option value="pack">pack</option>
                    <option value="botol">botol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Stok Fisik</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={e => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Batas Minimum</label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={e => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Harga Beli Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPerUnit}
                    onChange={e => setCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Supplier Langganan</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="Contoh: Toko Plastik Makmur UNPAM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
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
                  Simpan Bahan Baku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
