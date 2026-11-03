import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UserRole } from '../../types/erp';
import {
  Flame,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  Store
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { users, login } = useERP();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan username dan password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = login(username, password);
      setIsLoading(false);
      if (!success) {
        setErrorMessage('Username atau kata sandi tidak sesuai. Silakan hubungi Owner jika lupa password.');
      }
    }, 250);
  };

  const handleQuickLogin = (uname: string, pword: string) => {
    setUsername(uname);
    setPassword(pword);
    setErrorMessage('');
    setIsLoading(true);
    setTimeout(() => {
      login(uname, pword);
      setIsLoading(false);
    }, 200);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'OWNER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950">OWNER (Full Akses)</span>;
      case 'SUPERVISOR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500 text-white">KEPALA TOKO / SPV</span>;
      case 'FINANCE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-white">FINANCE</span>;
      case 'STAFF':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-300 text-slate-900">STAFF KASIR</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full"></div>
      <div className="absolute -bottom-20 right-10 w-[400px] h-[300px] bg-rose-500/10 blur-[120px] pointer-events-none rounded-full"></div>

      <div className="w-full max-w-4xl relative z-10 space-y-6">
        {/* Main Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Brand Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
                  <Flame size={26} className="text-slate-950" />
                </div>
                <div>
                  <h1 className="font-black text-lg tracking-wider text-amber-400 leading-tight">
                    DIMSUM MENTAI 77
                  </h1>
                  <span className="text-xs text-slate-400 font-semibold tracking-wide">
                    OUTLET UNPAM VIKTOR
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs text-amber-300 font-medium">
                  <Store size={14} />
                  <span>Sistem ERP & POS Terintegrasi</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                  Portal Masuk Kasir & Manajemen Outlet
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sistem operasional lengkap kasir POS, kontrol resep & HPP, stok bahan baku, purchasing, serta laporan keuangan laba rugi.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <Shield size={14} className="text-amber-400" />
                <span>Autentikasi Hak Akses Bertingkat (RBAC)</span>
              </div>
              <p className="text-slate-500 text-[10px]">
                Menu Setting Akun & Password karyawan dikelola secara khusus oleh Owner.
              </p>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-8 flex flex-col justify-center bg-slate-900">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white">Login Pengguna</h3>
              <p className="text-xs text-slate-400">
                Masukkan username dan kata sandi akun Anda untuk melanjutkan.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-rose-300 text-xs animate-shake">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Masukkan username (contoh: owner77)"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-mono"
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
                    className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center space-x-1"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi akun"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
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
          </div>
        </div>

        {/* Quick Demo Role Cards for Immediate Testing */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles size={15} className="text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200">
                Pilih Cepat Akun Demo (Uji Coba Hak Akses):
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">Klik salah satu untuk langsung masuk</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u.username, u.password)}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-left transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white group-hover:text-amber-400 transition truncate">
                      {u.name}
                    </span>
                  </div>
                  <div className="mb-2">{getRoleBadge(u.role)}</div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
                  <span>User: <strong className="text-slate-300">{u.username}</strong></span>
                  <span>Pass: <strong className="text-slate-300">{u.password}</strong></span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-[11px] text-slate-500">
          DIMSUM MENTAI 77 UNPAM • Pamulang Tangerang Selatan • Sistem ERP & POS Terintegrasi
        </div>
      </div>
    </div>
  );
};
