import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Plus, Edit2, Trash2, Check, Tags, Utensils, Boxes, AlertCircle, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

interface CategoryManagerModalProps {
  onClose: () => void;
  defaultTab?: 'menu' | 'material';
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  onClose,
  defaultTab = 'menu'
}) => {
  const {
    menuCategories,
    materialCategories,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    reorderMenuCategories,
    addMaterialCategory,
    updateMaterialCategory,
    deleteMaterialCategory,
    reorderMaterialCategories,
    menuItems,
    materials,
    currentUser
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'material'>(defaultTab);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const canEdit = currentUser.role === 'OWNER' || currentUser.role === 'FINANCE' || currentUser.role === 'SUPERVISOR';

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const isMenu = activeSubTab === 'menu';
    const list = isMenu ? [...menuCategories] : [...materialCategories];
    const item = list[index];
    list[index] = list[index - 1];
    list[index - 1] = item;
    if (isMenu) {
      reorderMenuCategories(list);
    } else {
      reorderMaterialCategories(list);
    }
  };

  const handleMoveDown = (index: number) => {
    const isMenu = activeSubTab === 'menu';
    const list = isMenu ? [...menuCategories] : [...materialCategories];
    if (index >= list.length - 1) return;
    const item = list[index];
    list[index] = list[index + 1];
    list[index + 1] = item;
    if (isMenu) {
      reorderMenuCategories(list);
    } else {
      reorderMaterialCategories(list);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) return;
    const isMenu = activeSubTab === 'menu';
    const list = isMenu ? [...menuCategories] : [...materialCategories];
    const [moved] = list.splice(draggedIdx, 1);
    list.splice(targetIndex, 0, moved);
    if (isMenu) {
      reorderMenuCategories(list);
    } else {
      reorderMaterialCategories(list);
    }
    setDraggedIdx(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (activeSubTab === 'menu') {
      if (menuCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        setErrorMsg('Kategori menu dengan nama ini sudah ada!');
        return;
      }
      addMenuCategory(trimmed);
    } else {
      if (materialCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        setErrorMsg('Kategori bahan dengan nama ini sudah ada!');
        return;
      }
      addMaterialCategory(trimmed);
    }
    setNewCatName('');
  };

  const handleStartEdit = (cat: string) => {
    setEditingCatName(cat);
    setEditingCatValue(cat);
    setErrorMsg('');
  };

  const handleSaveEdit = (oldCat: string) => {
    const trimmed = editingCatValue.trim();
    if (!trimmed || trimmed === oldCat) {
      setEditingCatName(null);
      return;
    }

    if (activeSubTab === 'menu') {
      if (menuCategories.some(c => c.toLowerCase() === trimmed.toLowerCase() && c !== oldCat)) {
        setErrorMsg('Nama kategori menu sudah ada yang sama!');
        return;
      }
      updateMenuCategory(oldCat, trimmed);
    } else {
      if (materialCategories.some(c => c.toLowerCase() === trimmed.toLowerCase() && c !== oldCat)) {
        setErrorMsg('Nama kategori bahan sudah ada yang sama!');
        return;
      }
      updateMaterialCategory(oldCat, trimmed);
    }
    setEditingCatName(null);
  };

  const handleDelete = (cat: string) => {
    const isMenu = activeSubTab === 'menu';
    const usedCount = isMenu
      ? menuItems.filter(m => ((m.categories && m.categories.length > 0) ? m.categories.includes(cat) : m.category === cat)).length
      : materials.filter(m => m.category === cat).length;

    if (usedCount > 0) {
      if (
        !confirm(
          `Kategori "${cat}" sedang digunakan oleh ${usedCount} item. Jika dihapus, item akan dipindahkan ke kategori default. Lanjutkan?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Hapus kategori "${cat}"?`)) return;
    }

    if (isMenu) {
      deleteMenuCategory(cat);
    } else {
      deleteMaterialCategory(cat);
    }
  };

  const currentList = activeSubTab === 'menu' ? menuCategories : materialCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Tags size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-400">Kelola Kategori</h3>
              <p className="text-[11px] text-slate-300">
                Tambah, ubah nama, atau hapus kategori menu & bahan baku
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Tabs: Menu vs Material */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveSubTab('menu');
              setEditingCatName(null);
              setErrorMsg('');
            }}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeSubTab === 'menu'
                ? 'bg-white border-amber-500 text-amber-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Utensils size={15} />
            <span>Kategori Menu ({menuCategories.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('material');
              setEditingCatName(null);
              setErrorMsg('');
            }}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeSubTab === 'material'
                ? 'bg-white border-amber-500 text-amber-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes size={15} />
            <span>Kategori Bahan Baku ({materialCategories.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!canEdit && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>
                Role <strong>{currentUser.role}</strong> dalam mode lihat. Perubahan kategori hanya dapat dilakukan oleh Owner atau Finance.
              </span>
            </div>
          )}

          {/* Add Category Form (Enabled if canEdit) */}
          {canEdit && (
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder={
                  activeSubTab === 'menu'
                    ? 'Nama kategori menu baru (contoh: Dimsum Mentai Super)'
                    : 'Nama kategori bahan baru (contoh: Packaging Frozen)'
                }
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs shrink-0"
              >
                <Plus size={16} />
                <span>Tambah</span>
              </button>
            </form>
          )}

          {/* Category List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Daftar Kategori Aktif ({currentList.length})
              </p>
              <p className="text-[10px] font-medium text-slate-400">
                Geser (drag) atau klik panah ↑ / ↓ untuk atur urutan
              </p>
            </div>
            {currentList.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">Belum ada kategori.</p>
            ) : (
              currentList.map((cat, idx) => {
                const isEditing = editingCatName === cat;
                const usedCount =
                  activeSubTab === 'menu'
                    ? menuItems.filter(m => ((m.categories && m.categories.length > 0) ? m.categories.includes(cat) : m.category === cat)).length
                    : materials.filter(m => m.category === cat).length;

                return (
                  <div
                    key={cat}
                    draggable={canEdit && !isEditing}
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, idx)}
                    className={`p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2.5 hover:bg-white hover:shadow-xs transition ${
                      draggedIdx === idx ? 'opacity-40 border-dashed border-amber-500 bg-amber-50/50' : ''
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingCatValue}
                          onChange={e => setEditingCatValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(cat);
                            if (e.key === 'Escape') setEditingCatName(null);
                          }}
                          autoFocus
                          className="flex-1 px-3 py-1.5 rounded-lg border border-amber-400 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat)}
                          className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                          title="Simpan"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatName(null)}
                          className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                          title="Batal"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {canEdit && (
                            <div className="flex items-center space-x-0.5 shrink-0 text-slate-400">
                              <span
                                className="cursor-grab active:cursor-grabbing p-1 hover:text-slate-700"
                                title="Geser untuk ubah urutan"
                              >
                                <GripVertical size={14} />
                              </span>
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveUp(idx)}
                                  className="p-0.5 text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400 transition"
                                  title="Geser Naik (Ke Atas)"
                                >
                                  <ArrowUp size={11} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === currentList.length - 1}
                                  onClick={() => handleMoveDown(idx)}
                                  className="p-0.5 text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400 transition"
                                  title="Geser Turun (Ke Bawah)"
                                >
                                  <ArrowDown size={11} />
                                </button>
                              </div>
                            </div>
                          )}
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="text-xs font-bold text-slate-800 truncate">{cat}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 shrink-0">
                            {usedCount} item
                          </span>
                        </div>

                        {canEdit && (
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Ubah Nama Kategori"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Kategori"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
