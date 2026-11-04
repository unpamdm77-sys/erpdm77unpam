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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full"></div>
      <div className="absolute -bottom-20 right-10 w-[400px] h-[300px] bg-rose-500/10 blur-[120px] pointer-events-none rounded-full"></div>

      <div className="w-full max-w-2xl relative z-10 space-y-5">
        {/* Main Login Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-13 h-13 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
                <Flame size={28} className="text-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-black text-xl tracking-wider text-amber-400 leading-tight">
                    DIMSUM MENTAI 77
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                    UNPAM VIKTOR
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sistem ERP & Point of Sale (POS) Outlet Terintegrasi
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 self-start sm:self-auto">
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
                className="w-full mt-4 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
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
        <div className="text-center text-[11px] text-slate-500">
          DIMSUM MENTAI 77 UNPAM • Pamulang Tangerang Selatan • Sistem ERP & POS Terintegrasi Cloud
        </div>
      </div>
    </div>
  );
};
