import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UserAccount, UserRole } from '../../types/erp';
import {
  Shield,
  ShieldAlert,
  UserPlus,
  Users,
  Search,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Lock,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  UserCheck,
  Info,
  Cloud,
  RefreshCw
} from 'lucide-react';

interface AccountSettingsTabProps {
  onSwitchTab?: (tabId: string) => void;
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({ onSwitchTab }) => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    firestoreStatus,
    triggerManualSync,
    isManualSyncing,
    lastManualSyncTime
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSyncClick = async () => {
    setSyncFeedback(null);
    const res = await triggerManualSync();
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 4000);
  };
  
  // Modal states for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Strict RBAC Guard: If not OWNER, show blocked UI
  if (currentUser.role !== 'OWNER') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={36} />
          </div>
          <div>
            <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-black text-xs uppercase tracking-wide">
              Akses Ditolak
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Menu Setting Akun Khusus Pemilik (OWNER)
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Anda saat ini masuk sebagai <strong className="text-slate-900">{currentUser.name}</strong> dengan peran <strong className="text-amber-600">[{currentUser.role}]</strong>.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Menu ini digunakan untuk mengelola username, kata sandi, dan data pribadi seluruh staf dan supervisi, serta hanya dapat diakses oleh akun OWNER.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            {onSwitchTab && (
              <button
                onClick={() => onSwitchTab('dashboard')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Kembali ke Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const togglePassword = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setUsername('');
    setPassword('');
    setName('');
    setRole('STAFF');
    setPhone('');
    setAddress('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setPassword(user.password);
    setName(user.name);
    setRole(user.role);
    setPhone(user.phone || '');
    setAddress(user.address || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim() || !password.trim() || !name.trim()) {
      setFormError('Username, kata sandi, dan nama lengkap wajib diisi!');
      return;
    }

    if (editingUserId) {
      // Check duplicate username with other users
      if (users.some(u => u.id !== editingUserId && u.username.toLowerCase() === username.trim().toLowerCase())) {
        setFormError('Username ini sudah dipakai oleh staf lain. Silakan pilih username unik.');
        return;
      }
      updateUser(editingUserId, {
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role,
        phone: phone.trim(),
        address: address.trim()
      });
      setSuccessToast(`Akun ${name} berhasil diperbarui.`);
    } else {
      // Check duplicate username
      if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
        setFormError('Username ini sudah terdaftar. Silakan gunakan username lain.');
        return;
      }
      addUser({
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role,
        phone: phone.trim(),
        address: address.trim()
      });
      setSuccessToast(`Akun ${name} (${role}) berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleDelete = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Owner yang sedang Anda gunakan saat ini!');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${user.name} (${user.username})?`)) {
      deleteUser(user.id);
      setSuccessToast(`Akun ${user.name} telah dihapus.`);
      setTimeout(() => setSuccessToast(''), 3500);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black">👑 OWNER</span>;
      case 'SUPERVISOR':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-[10px] font-black">👔 SUPERVISI / KEPALA TOKO</span>;
      case 'FINANCE':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-black">📊 FINANCE</span>;
      case 'STAFF':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[10px] font-black">🧑‍🍳 STAFF KASIR</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/20 to-transparent pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
              <Shield size={28} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl md:text-2xl font-black text-amber-400">
                  Setting Akun & Kredensial Staf
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                  KHUSUS OWNER
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Kelola nama pengguna (username), kata sandi (password), kontak, dan hak akses karyawan Dimsum Mentai 77 UNPAM.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-md transition self-start md:self-auto cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Success Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Akun</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{users.length}</p>
          <span className="text-[10px] text-slate-500">Semua staf terdaftar</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600">Owner</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {users.filter(u => u.role === 'OWNER').length}
          </p>
          <span className="text-[10px] text-slate-500">Pemilik & Full Akses</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-600">Kepala Toko / SPV</span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {users.filter(u => u.role === 'SUPERVISOR').length}
          </p>
          <span className="text-[10px] text-slate-500">Approval & Operasional</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-600">Kasir / Frontliner</span>
          <p className="text-2xl font-black text-slate-700 mt-1">
            {users.filter(u => u.role === 'STAFF').length}
          </p>
          <span className="text-[10px] text-slate-500">Frontline Point of Sale</span>
        </div>
      </div>

      {/* Cloud Multi-Device Real-Time Sync Status & Manual Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-5 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Cloud size={24} className={firestoreStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-sm text-white">Sinkronisasi Database Multi-Device Real-Time</h3>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${firestoreStatus === 'connected' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                {firestoreStatus === 'connected' ? 'OTOMATIS AKTIF' : 'MENYAMBUNGKAN'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Setiap kali kasir bertransaksi atau data staf diubah, database langsung otomatis sinkron ke HP, tablet, & laptop tanpa perlu klik tombol apa pun.
            </p>
            {lastManualSyncTime && (
              <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                Sinkronisasi manual terakhir: {lastManualSyncTime.toLocaleTimeString('id-ID')} ({lastManualSyncTime.toLocaleDateString('id-ID')})
              </p>
            )}
            {syncFeedback && (
              <p className="text-[11px] text-emerald-400 font-bold mt-1 animate-in fade-in">
                ✓ {syncFeedback}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleManualSyncClick}
          disabled={isManualSyncing}
          title="Sinkronkan database sekarang secara manual bila jaringan sempat terputus"
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shrink-0 cursor-pointer disabled:opacity-50 shadow-md"
        >
          <RefreshCw size={14} className={isManualSyncing ? 'animate-spin' : ''} />
          <span>{isManualSyncing ? 'Menyinkronkan...' : 'Sinkronkan Manual'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan, username, atau no HP..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'OWNER', 'SUPERVISOR', 'FINANCE', 'STAFF'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                roleFilter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'Semua Role' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Nama Karyawan & Username</th>
                <th className="py-3.5 px-5">Peran / Hak Akses</th>
                <th className="py-3.5 px-5">Kontak & Alamat Domisili</th>
                <th className="py-3.5 px-5">Kata Sandi (Password)</th>
                <th className="py-3.5 px-5">Tgl Bergabung</th>
                <th className="py-3.5 px-5 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data akun yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isVisible = Boolean(showPasswordMap[user.id]);
                  const isSelf = user.id === currentUser.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-slate-900 text-amber-400 px-1.5 py-0.2 rounded font-black">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">@{user.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">{getRoleBadge(user.role)}</td>

                      <td className="py-4 px-5 space-y-1">
                        <div className="flex items-center text-slate-700">
                          <Phone size={12} className="mr-1.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{user.phone || '-'}</span>
                        </div>
                        <div className="flex items-center text-slate-500 max-w-xs truncate text-[11px]">
                          <MapPin size={12} className="mr-1.5 text-slate-400 shrink-0" />
                          <span className="truncate">{user.address || '-'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-900 text-xs font-bold border border-slate-200">
                            {isVisible ? user.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePassword(user.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                            title={isVisible ? 'Sembunyikan' : 'Tampilkan Kata Sandi'}
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-slate-500">
                        <div className="flex items-center space-x-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{user.joinDate}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs flex items-center space-x-1 transition"
                            title="Edit Data & Ganti Password"
                          >
                            <Edit3 size={13} />
                            <span>Edit / Ganti Pass</span>
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                              title="Hapus Akun Karyawan"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Access Reference Cards */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
          <Info size={16} className="text-amber-500" />
          <span>Matriks Hak Akses & Kebijakan Sistem:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-amber-700">👑 OWNER</span>
            <p className="text-slate-600 leading-relaxed">
              Full akses: Setting Akun karyawan, Import Excel, Laporan Keuangan, edit resep HPP & stok bahan.
            </p>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-blue-700">👔 SUPERVISI / KEPALA TOKO</span>
            <p className="text-slate-600 leading-relaxed">
              Operasional POS, Purchasing, Stock Opname, Riwayat, Approval Void/Retur Kasir. Dilarang Setting Akun, Import & Laporan Keuangan.
            </p>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-700">📊 FINANCE</span>
            <p className="text-slate-600 leading-relaxed">
              Laporan Keuangan, Arus Kas & Beban, POS, Stok, dan Import Excel. Dilarang mengakses Setting Akun karyawan.
            </p>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700">🧑‍🍳 STAFF KASIR</span>
            <p className="text-slate-600 leading-relaxed">
              Akses transaksi POS dan riwayat penjualan. Retur wajib persetujuan PIN supervisi/owner. Dilarang ubah purchasing, HPP resep & stok.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound size={18} className="text-amber-400" />
                <h3 className="font-black text-sm text-white">
                  {editingUserId ? 'Edit Akun & Reset Password' : 'Tambah Akun Karyawan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peran / Role Akses
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="STAFF">STAFF KASIR (Frontliner Kasir)</option>
                  <option value="SUPERVISOR">SUPERVISI / KEPALA TOKO (Approval & Operasional)</option>
                  <option value="FINANCE">FINANCE (Admin Keuangan & Laba Rugi)</option>
                  <option value="OWNER">OWNER (Pemilik Usaha - Full Akses)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Login
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: kasir_budi"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password Akun
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: pass123"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Karyawan
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Budi Santoso"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="misal: 08123456789"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Domisili
                </label>
                <textarea
                  rows={2}
                  placeholder="misal: Jl. Surya Kencana Pamulang, Tangerang Selatan"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
