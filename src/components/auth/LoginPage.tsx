import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Flame,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AlertCircle,
  Store,
  KeyRound
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useERP();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan username dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = login(username, password);
      setIsLoading(false);
      if (!success) {
        setErrorMessage('Username atau kata sandi salah. Silakan periksa kembali atau tanyakan kepada Owner.');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans">
      <div className="w-full max-w-2xl relative z-10 space-y-5">
        {/* Main Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header Banner - Solid Clean */}
          <div className="bg-slate-900 p-6 md:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src="/assets/aistudio/logo_dm77_d20d4c54.png"
                alt="Dimsum Mentai 77 Logo"
                className="w-16 h-16 object-contain drop-shadow-md shrink-0 rounded-2xl bg-white p-1 border border-amber-400/40"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-black text-xl tracking-wider text-amber-400 leading-tight">
                    DIMSUM MENTAI 77
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-amber-300 text-[10px] font-bold border border-amber-400/40">
                    UNPAM (Universitas Pamulang)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Sistem ERP & Point of Sale (POS) Outlet Terintegrasi
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 self-start sm:self-auto">
              <Shield size={14} className="text-emerald-400" />
              <span>Sesi Aman (RBAC)</span>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-base md:text-lg font-black text-white">
                Masuk ke Akun Karyawan
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Silakan ketik username dan kata sandi akun Anda untuk membuka sistem.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username Akun
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ketik username Anda..."
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Kata Sandi (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center space-x-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showPassword ? 'Sembunyikan' : 'Lihat Sandi'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ketik kata sandi..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3.5 px-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Masuk ke Sistem ERP</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <KeyRound size={13} className="text-amber-400" />
                <span>Pengaturan Akun & Password dikelola oleh Owner</span>
              </span>
              <span>v1.4 UNPAM</span>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-[11px] text-slate-500 max-w-lg mx-auto leading-relaxed">
          DIMSUM MENTAI 77 UNPAM • Jl. Pamulang Permai 1 No.Samping, Gapura, Kec. Pamulang, Tangsel • Telp/WA: 0819-9645-1323
        </div>
      </div>
    </div>
  );
};
