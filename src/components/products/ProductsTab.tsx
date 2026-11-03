import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { MenuItem, RecipeIngredient } from '../../types/erp';
import { formatRupiah } from '../../utils/formatters';
import {
  Utensils,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Percent,
  Calculator,
  Search,
  Check,
  Flame
} from 'lucide-react';

export const ProductsTab: React.FC = () => {
  const { menuItems, materials, addMenuItem, updateMenuItem, deleteMenuItem, calculateMenuHpp } = useERP();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(menuItems[0]?.id || null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuItem['category']>('Dimsum Mentai');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [recipe, setRecipe] = useState<RecipeIngredient[]>([]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCode(`DM-${(menuItems.length + 1).toString().padStart(2, '0')}`);
    setName('');
    setCategory('Dimsum Mentai');
    setPrice('');
    setDescription('');
    // Start with 1 default ingredient
    setRecipe(materials.length > 0 ? [{ materialId: materials[0].id, qty: 1 }] : []);
    setShowModal(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setDescription(item.description);
    setRecipe([...item.recipe]);
    setShowModal(true);
  };

  const handleAddRecipeIngredient = () => {
    if (materials.length === 0) return;
    setRecipe(prev => [...prev, { materialId: materials[0].id, qty: 1 }]);
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    setRecipe(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateRecipeIngredient = (index: number, materialId: string, qty: number) => {
    setRecipe(prev =>
      prev.map((ing, idx) => (idx === index ? { materialId, qty } : ing))
    );
  };

  const calculateFormHpp = () => {
    return recipe.reduce((sum, ing) => {
      const mat = materials.find(m => m.id === ing.materialId);
      return sum + (mat ? mat.costPerUnit * ing.qty : 0);
    }, 0);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    if (editingItem) {
      updateMenuItem(editingItem.id, {
        code,
        name,
        category,
        price: Number(price),
        description,
        recipe
      });
    } else {
      addMenuItem({
        code,
        name,
        category,
        price: Number(price),
        description,
        recipe,
        isAvailable: true
      });
    }
    setShowModal(false);
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Utensils size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Katalog Menu & Kalkulasi HPP (BOM Resep)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bill of Materials (BOM) otomatis menghitung biaya bahan per porsi secara akurat dan realtime.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm transition text-xs"
        >
          <Plus size={16} />
          <span>+ Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {['Semua', 'Dimsum Mentai', 'Dimsum Goreng', 'Dimsum Kukus', 'Minuman', 'Frozen Pack', 'Extra Topping'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
            placeholder="Cari menu dimsum..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Menu Cards with Collapsible BOM Recipe Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMenu.map(item => {
          const hpp = calculateMenuHpp(item);
          const profit = item.price - hpp;
          const margin = item.price > 0 ? Math.round((profit / item.price) * 100) : 0;
          const isExpanded = expandedItemId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{item.code}</span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 mt-1">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus menu "${item.name}"?`)) {
                        deleteMenuItem(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Financial Box: Harga Jual vs HPP vs Margin */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Harga Jual</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{formatRupiah(item.price)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">HPP (Modal BOM)</p>
                  <p className="text-sm font-black text-amber-700 mt-0.5">{formatRupiah(hpp)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Margin Kotor</p>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">
                    {margin}% <span className="text-[10px] font-normal">({formatRupiah(profit)})</span>
                  </p>
                </div>
              </div>

              {/* Recipe BOM Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 p-2 rounded-xl bg-slate-100/70 hover:bg-slate-100 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Calculator size={14} className="text-amber-600" />
                    <span>Komposisi Resep ({item.recipe.length} Bahan Baku)</span>
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2 text-xs">
                    {item.recipe.length === 0 ? (
                      <p className="text-slate-400 text-center py-2 text-[11px]">Resep belum ditentukan.</p>
                    ) : (
                      item.recipe.map((ing, idx) => {
                        const mat = materials.find(m => m.id === ing.materialId);
                        const cost = mat ? mat.costPerUnit * ing.qty : 0;
                        return (
                          <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-200/50 last:border-none">
                            <span className="font-medium text-slate-800">
                              {mat ? mat.name : 'Bahan tidak ditemukan'}
                            </span>
                            <div className="text-right">
                              <span className="font-bold text-slate-900">
                                {ing.qty} {mat?.unit}
                              </span>
                              <span className="text-slate-400 ml-1.5">({formatRupiah(cost)})</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MENU MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Utensils className="text-amber-400" size={20} />
                <h3 className="font-bold text-base">
                  {editingItem ? 'Edit Menu & Resep HPP' : 'Tambah Menu Baru & Komposisi HPP'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveMenu} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Kode Menu</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Menu</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Dimsum Mentai Beef Special"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="Dimsum Mentai">Dimsum Mentai</option>
                    <option value="Dimsum Goreng">Dimsum Goreng</option>
                    <option value="Dimsum Kukus">Dimsum Kukus</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Frozen Pack">Frozen Pack</option>
                    <option value="Extra Topping">Extra Topping</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={price}
                    onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 20000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-amber-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Keterangan isi porsi, saus, dll."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Recipe Ingredients Builder */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider">
                      Resep Bahan Baku (BOM per Porsi)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tentukan bahan yang otomatis berkurang saat menu ini terjual di kasir
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRecipeIngredient}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    + Bahan
                  </button>
                </div>

                <div className="space-y-2">
                  {recipe.map((ing, idx) => {
                    const mat = materials.find(m => m.id === ing.materialId);
                    const cost = mat ? mat.costPerUnit * ing.qty : 0;
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <select
                          value={ing.materialId}
                          onChange={e => handleUpdateRecipeIngredient(idx, e.target.value, ing.qty)}
                          className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({formatRupiah(m.costPerUnit)}/{m.unit})
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 w-24">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={ing.qty}
                            onChange={e => handleUpdateRecipeIngredient(idx, ing.materialId, Number(e.target.value))}
                            className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                          <span className="text-[11px] text-slate-500">{mat?.unit}</span>
                        </div>
                        <span className="w-20 text-right text-[11px] font-semibold text-slate-700">
                          {formatRupiah(cost)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeIngredient(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Live Form HPP summary */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-emerald-900">Total HPP per Porsi:</span>
                    <p className="text-[10px] text-emerald-700">
                      Laba per porsi: {formatRupiah(Number(price || 0) - calculateFormHpp())}
                    </p>
                  </div>
                  <span className="text-base font-black text-emerald-800">
                    {formatRupiah(calculateFormHpp())}
                  </span>
                </div>
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
                  Simpan Menu & Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
