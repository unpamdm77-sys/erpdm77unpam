import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ShieldCheck, X, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../../types/erp';
import { formatRupiah } from '../../utils/formatters';

interface SupervisorApprovalModalProps {
  transaction: Transaction;
  onApprove: () => void;
  onClose: () => void;
}

export const SupervisorApprovalModal: React.FC<SupervisorApprovalModalProps> = ({
  transaction,
  onApprove,
  onClose
}) => {
  const { verifySupervisorOrOwnerPin } = useERP();
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pinOrPassword.trim()) {
      setErrorMsg('Masukkan kata sandi / PIN Kepala Toko atau Owner!');
      return;
    }

    const isValid = verifySupervisorOrOwnerPin(pinOrPassword.trim());
    if (isValid) {
      onApprove();
      onClose();
    } else {
      setErrorMsg('Kata sandi salah! Hanya Kepala Toko (Supervisi) atau Owner yang dapat menyetujui void/retur.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-400">Approval Retur Diperlukan</h3>
              <p className="text-[11px] text-slate-300">Otorisasi Supervisor / Owner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span>Kebijakan Keamanan Kasir Dimsum 77</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Akun Staff Kasir tidak dapat melakukan retur transaksi secara sepihak. Masukkan kata sandi Kepala Toko (Supervisi) atau Owner untuk otorisasi void nota ini.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Faktur:</span>
              <span className="font-mono font-bold text-slate-900">{transaction.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pelanggan:</span>
              <span className="font-semibold text-slate-800">{transaction.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nilai Retur:</span>
              <span className="font-black text-rose-600">{formatRupiah(transaction.total)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMsg && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-semibold">
                {errorMsg}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi / PIN Supervisor atau Owner:
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Masukkan password supervisi/owner..."
                  value={pinOrPassword}
                  onChange={e => setPinOrPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Demo default supervisor: <code className="bg-slate-100 px-1 py-0.5 rounded">spv123</code> atau owner: <code className="bg-slate-100 px-1 py-0.5 rounded">owner123</code>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Setujui & Batalkan Nota
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
