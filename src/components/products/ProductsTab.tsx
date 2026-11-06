import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { MenuItem, RecipeIngredient } from '../../types/erp';
import { formatRupiah } from '../../utils/formatters';
import { CategoryManagerModal } from '../categories/CategoryManagerModal';
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
  Flame,
  Tags,
  Lock,
  AlertCircle
} from 'lucide-react';

export const ProductsTab: React.FC = () => {
  const {
    menuItems,
    materials,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    calculateMenuHpp,
    menuCategories,
    currentUser
  } = useERP();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(menuItems[0]?.id || null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // RBAC permissions: Owner & Finance can edit menu; Supervisor & Staff cannot
  const canEditMenu = currentUser.role === 'OWNER' || currentUser.role === 'FINANCE';

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(menuCategories[0] || 'Dimsum Mentai');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string>('');
  const [recipe, setRecipe] = useState<RecipeIngredient[]>([]);

  const PRESET_PHOTOS = [
    { label: 'Mentai Original', url: '/src/assets/images/dimsum_mentai_original_1793977235878.jpg' },
    { label: 'Mentai Mozzarella', url: '/src/assets/images/dimsum_mentai_mozzarella_1793977235926.jpg' },
    { label: 'Mentai Nori', url: '/src/assets/images/dimsum_mentai_nori_1793977237418.jpg' },
    { label: 'Goreng Crispy', url: '/src/assets/images/dimsum_goreng_crispy_1793977238184.jpg' },
  ];

  // Helper to compress uploaded images via canvas to ~400x400 JPEG (<40KB) for fast Firestore sync
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new window.Image();
      img.src = evt.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setImage(compressedDataUrl);
        } else {
          setImage(evt.target?.result as string);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    if (!canEditMenu) return;
    setEditingItem(null);
    setCode(`DM-${(menuItems.length + 1).toString().padStart(2, '0')}`);
    setName('');
    setCategory(menuCategories[0] || 'Dimsum Mentai');
    setPrice('');
    setDescription('');
    setImage('');
    // Start with 1 default ingredient
    setRecipe(materials.length > 0 ? [{ materialId: materials[0].id, qty: 1 }] : []);
    setShowModal(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    if (!canEditMenu) return;
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setDescription(item.description);
    setImage(item.image || '');
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
        image: image.trim() ? image : undefined,
        recipe
      });
    } else {
      addMenuItem({
        code,
        name,
        category,
        price: Number(price),
        description,
        image: image.trim() ? image : undefined,
        recipe,
        isAvailable: true
      });
    }
    setShowModal(false);
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
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
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
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

        <div className="flex items-center gap-2">
          {/* Kelola Kategori Button */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs border border-slate-200"
          >
            <Tags size={15} />
            <span>Kelola Kategori</span>
          </button>

          {canEditMenu ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition text-xs"
            >
              <Plus size={16} />
              <span>Tambah Menu Baru</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold border border-slate-200">
              <Lock size={14} />
              <span>Mode Lihat ({currentUser.role})</span>
            </div>
          )}
        </div>
      </div>

      {!canEditMenu && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-blue-600 shrink-0" />
          <span>
            <strong>Informasi Akses:</strong> Akun Anda berstatus <strong>{currentUser.role}</strong> (Mode Lihat). Sesuai kebijakan operasional, hanya <strong>Owner</strong> dan <strong>Finance</strong> yang memiliki hak akses untuk menambah, mengubah resep BOM, atau menghapus menu.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {['Semua', ...menuCategories].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
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
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3">
                  {/* Photo Thumbnail */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                      <Utensils size={24} />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">{item.code}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                  </div>
                </div>

                {canEditMenu && (
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                      title="Edit Menu & Resep"
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
                      title="Hapus Menu"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Box: Harga Jual vs HPP vs Margin */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Harga Jual</span>
                  <span className="text-xs font-bold text-slate-900">{formatRupiah(item.price)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">BOM (HPP)</span>
                  <span className="text-xs font-bold text-blue-700">{formatRupiah(hpp)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Margin Laba</span>
                  <span className={`text-xs font-bold ${margin >= 40 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {margin}% ({formatRupiah(profit)})
                  </span>
                </div>
              </div>

              {/* Collapsible BOM Recipe Details */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <span className="flex items-center gap-1.5">
                    <Calculator size={14} className="text-blue-600" />
                    <span>Komposisi Resep Bahan ({item.recipe.length} bahan)</span>
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-xs animate-in fade-in duration-150">
                    {item.recipe.length === 0 ? (
                      <p className="text-slate-400 text-center py-2 text-[11px]">Belum ada bahan baku yang dikaitkan.</p>
                    ) : (
                      item.recipe.map((ing, idx) => {
                        const mat = materials.find(m => m.id === ing.materialId);
                        const subtotal = mat ? mat.costPerUnit * ing.qty : 0;
                        return (
                          <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-200/40 last:border-0">
                            <div>
                              <span className="font-semibold text-slate-800">{mat?.name || 'Bahan Dihapus'}</span>
                              <span className="text-slate-400 ml-1">
                                ({ing.qty} {mat?.unit || 'unit'} @ {mat ? formatRupiah(mat.costPerUnit) : 0})
                              </span>
                            </div>
                            <span className="font-mono font-bold text-slate-700">{formatRupiah(subtotal)}</span>
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

      {/* Add / Edit Menu Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {editingItem ? 'Edit Menu & Resep BOM' : 'Tambah Menu Dimsum Baru'}
            </h3>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
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
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                  >
                    {menuCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
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

              {/* Photo Upload & Presets Section */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Foto Menu (Tampil di Grid Kasir)
                  </label>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="text-[10px] text-rose-600 font-bold hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Photo Preview Thumbnail */}
                  {image ? (
                    <img
                      src={image}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Utensils size={20} />
                      <span className="text-[9px] mt-0.5">No Foto</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    {/* Device or Camera File Upload */}
                    <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition">
                      <Plus size={14} />
                      <span>Upload dari Perangkat / Kamera</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Presets */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Atau pilih foto preset cepat:</span>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_PHOTOS.map(p => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setImage(p.url)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition ${
                              image === p.url
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                  >
                    + Bahan
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex justify-between items-center text-xs">
                  <span className="font-bold text-blue-900">Total Biaya Resep (BOM):</span>
                  <span className="font-black text-blue-900 text-sm">{formatRupiah(calculateFormHpp())}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <CategoryManagerModal
          defaultTab="menu"
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  );
};
