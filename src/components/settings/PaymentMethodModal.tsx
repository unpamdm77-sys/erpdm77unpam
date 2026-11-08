import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  QrCode,
  Banknote,
  Smartphone,
  Wallet,
  AlertCircle
} from 'lucide-react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose }) => {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useERP();
  const [newMethodName, setNewMethodName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMethodName.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Nama metode pembayaran tidak boleh kosong!');
      return;
    }
    if (paymentMethods.includes(clean)) {
      setErrorMsg(`Metode "${clean}" sudah ada!`);
      return;
    }

    addPaymentMethod(clean);
    setNewMethodName('');
    setErrorMsg('');
  };

  const handleStartEdit = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingValue(currentName);
    setErrorMsg('');
  };

  const handleSaveEdit = (oldName: string) => {
    const clean = editingValue.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Nama metode tidak boleh kosong!');
      return;
    }
    if (clean !== oldName && paymentMethods.includes(clean)) {
      setErrorMsg(`Metode "${clean}" sudah ada dalam daftar!`);
      return;
    }

    updatePaymentMethod(oldName, clean);
    setEditingIndex(null);
    setEditingValue('');
    setErrorMsg('');
  };

  const handleDelete = (name: string) => {
    if (paymentMethods.length <= 1) {
      setErrorMsg('Minimal harus ada 1 metode pembayaran aktif!');
      return;
    }
    if (confirm(`Hapus metode pembayaran "${name}"? Metode ini tidak akan tampil lagi di kasir POS.`)) {
      deletePaymentMethod(name);
      setErrorMsg('');
    }
  };

  const getMethodIcon = (name: string) => {
    const upper = name.toUpperCase();
    if (upper.includes('TUNAI') || upper.includes('CASH')) {
      return <Banknote size={16} className="text-emerald-600 shrink-0" />;
    }
    if (upper.includes('QRIS') || upper.includes('QR')) {
      return <QrCode size={16} className="text-red-600 shrink-0" />;
    }
    if (upper.includes('GOPAY') || upper.includes('SHOPEE') || upper.includes('OVO') || upper.includes('DANA')) {
      return <Smartphone size={16} className="text-cyan-600 shrink-0" />;
    }
    if (upper.includes('DEBIT') || upper.includes('KARTU') || upper.includes('EDC')) {
      return <CreditCard size={16} className="text-blue-600 shrink-0" />;
    }
    return <Wallet size={16} className="text-amber-600 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <CreditCard size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide">Kelola Metode Pembayaran</h3>
              <p className="text-[11px] text-slate-400">Atur metode transaksi kasir POS Outlet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2 text-[11px] font-bold">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Add New Method */}
          <form onSubmit={handleAdd} className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Tambah Metode Baru
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: GOPAY, SHOPEEPAY, BCA..."
                value={newMethodName}
                onChange={e => {
                  setNewMethodName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span>Tambah</span>
              </button>
            </div>
          </form>

          {/* Methods List */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Daftar Metode Aktif ({paymentMethods.length})
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {paymentMethods.map((method, idx) => {
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={method}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                  >
                    <div className="flex items-center space-x-2.5 flex-1 mr-2">
                      {getMethodIcon(method)}
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(method);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          className="flex-1 px-2 py-1 text-xs font-black uppercase rounded-lg border border-red-500 bg-white"
                        />
                      ) : (
                        <span className="font-extrabold text-slate-800 tracking-wide text-xs">
                          {method}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(method)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Simpan Perubahan"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition"
                            title="Batal"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(idx, method)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
                            title="Ubah Nama"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(method)}
                            disabled={paymentMethods.length <= 1}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              paymentMethods.length <= 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Hapus Metode"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
