import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Material, UnitType } from '../../types/erp';
import { formatRupiah, formatNumber, formatDateOnly } from '../../utils/formatters';
import { CategoryManagerModal } from '../categories/CategoryManagerModal';
import { HorizontalScrollPills } from '../common/HorizontalScrollPills';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  ShoppingCart,
  TrendingDown,
  PackageCheck,
  Tags,
  Lock,
  AlertCircle
} from 'lucide-react';
import { DecimalInput } from '../common/DecimalInput';

interface MaterialsTabProps {
  onSwitchTab?: (tabId: string) => void;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ onSwitchTab }) => {
  const {
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    materialCategories,
    currentUser
  } = useERP();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // RBAC permissions: Owner & Finance can edit materials; Supervisor & Staff cannot
  const canEditMaterials = currentUser.role === 'OWNER' || currentUser.role === 'FINANCE';

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingMat, setEditingMat] = useState<Material | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(materialCategories[0] || 'Daging & Isian');
  const [stock, setStock] = useState<number | ''>('');
  const [unit, setUnit] = useState<UnitType>('pcs');
  const [minStock, setMinStock] = useState<number | ''>('');
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('');
  const [supplier, setSupplier] = useState('');

  const handleOpenAdd = () => {
    if (!canEditMaterials) return;
    setEditingMat(null);
    setCode(`B-${(materials.length + 1).toString().padStart(2, '0')}`);
    setName('');
    setCategory(materialCategories[0] || 'Daging & Isian');
    setStock('');
    setUnit('pcs');
    setMinStock(20);
    setCostPerUnit('');
    setSupplier('');
    setShowModal(true);
  };

  const handleOpenEdit = (m: Material) => {
    if (!canEditMaterials) return;
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
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
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
            <span className="p-2 bg-red-100 text-red-700 rounded-xl">
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

        <div className="flex items-center gap-2">
          {/* Kelola Kategori Bahan Button */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs border border-slate-200"
          >
            <Tags size={15} />
            <span>Kelola Kategori</span>
          </button>

          {canEditMaterials ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition text-xs"
            >
              <Plus size={16} />
              <span>Tambah Bahan Baru</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold border border-slate-200">
              <Lock size={14} />
              <span>Mode Lihat ({currentUser.role})</span>
            </div>
          )}
        </div>
      </div>

      {!canEditMaterials && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Informasi Akses:</strong> Akun Anda berstatus <strong>{currentUser.role}</strong> (Mode Lihat). Supervisor dan Staff tidak dapat menambah, mengedit, atau menghapus master data stok bahan baku.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Jenis Bahan</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{materials.length} Item</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Semua kategori</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Nilai Aset Persediaan</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatRupiah(totalAssetValue)}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Dihitung dari modal beli</p>
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
          <div className="w-full sm:flex-1 min-w-0">
            <HorizontalScrollPills
              categories={['Semua', ...materialCategories]}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
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
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
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
                      {canEditMaterials ? (
                        <>
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
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Lihat Saja</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Material Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {editingMat ? 'Edit Data Bahan Baku' : 'Tambah Bahan Baku Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
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
                    placeholder="Contoh: Saus Mentai Khas 77"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {materialCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Satuan</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Stok Fisik</label>
                  <DecimalInput
                    value={stock}
                    onChange={val => setStock(val)}
                    unit={unit}
                    min={0}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Batas Min</label>
                  <DecimalInput
                    value={minStock}
                    onChange={val => setMinStock(val)}
                    unit={unit}
                    min={0}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-rose-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Biaya Satuan (Rp)</label>
                  <DecimalInput
                    value={costPerUnit}
                    onChange={val => setCostPerUnit(val)}
                    min={0}
                    placeholder="0"
                    showQuickHelpers={false}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Supplier Utama</label>
                <input
                  type="text"
                  placeholder="Nama toko / pasar / langganan"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <CategoryManagerModal
          defaultTab="material"
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  );
};
