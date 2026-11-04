import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UserAccount, UserRole } from '../../types/erp';
import {
  Users,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface AccountSwitcherModalProps {
  onClose: () => void;
  onOpenOwnerSettings?: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  onClose,
  onOpenOwnerSettings
}) => {
  const { users, currentUser, login } = useERP();

  const [selectedUser, setSelectedUser] = useState<UserAccount>(currentUser);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSelectUser = (user: UserAccount) => {
    setSelectedUser(user);
    setPasswordInput('');
    setErrorMsg('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const success = login(selectedUser.username, passwordInput);
    if (success) {
      setSuccessMsg(`Berhasil beralih akun ke ${selectedUser.name} (${selectedUser.role})`);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg('Kata sandi salah. Silakan coba lagi atau tanyakan ke Owner.');
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md border border-amber-300">OWNER</span>;
      case 'SUPERVISOR':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md border border-blue-300">KEPALA TOKO / SPV</span>;
      case 'FINANCE':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-300">FINANCE</span>;
      case 'STAFF':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-black rounded-md border border-slate-300">STAFF KASIR</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-400">Ganti Akun & Hak Akses</h3>
              <p className="text-[11px] text-slate-300">
                Pilih profil pengguna untuk login ke sistem kasir & ERP
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

        {/* Current Active Account Box */}
        <div className="p-6 pb-2 space-y-4">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-amber-700 font-bold uppercase">Akun Aktif Saat Ini</p>
                <p className="text-xs font-black text-slate-900">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">@{currentUser.username}</p>
              </div>
            </div>
            <div>{getRoleBadge(currentUser.role)}</div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Select User to Switch */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Pilih Akun yang Ingin Digunakan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map(u => {
                const isSelected = selectedUser.id === u.id;
                const isCurrent = currentUser.id === u.id;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">{u.name}</span>
                      {getRoleBadge(u.role)}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-mono">@{u.username}</span>
                      {isCurrent ? (
                        <span className="text-amber-700 font-bold">Sedang Aktif</span>
                      ) : (
                        <span className="text-slate-400 font-medium">Klik untuk pilih &rarr;</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password confirmation form */}
          {selectedUser.id !== currentUser.id && (
            <form onSubmit={handleLoginSubmit} className="pt-2 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masukkan Kata Sandi untuk <span className="text-amber-600">{selectedUser.name}</span>:
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password akun..."
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Masuk sebagai {selectedUser.name}
                </button>
              </div>
            </form>
          )}

          {/* Owner shortcut to manage accounts if currentUser is OWNER */}
          {currentUser.role === 'OWNER' && onOpenOwnerSettings && (
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOwnerSettings();
                }}
                className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 flex items-center justify-center gap-2 transition"
              >
                <Shield size={15} className="text-amber-600" />
                <span>Buka Menu Setting Akun & Kelola Password Karyawan &rarr;</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
