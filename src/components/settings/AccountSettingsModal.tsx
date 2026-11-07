import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UserAccount, UserRole } from '../../types/erp';
import {
  Users,
  X,
  Plus,
  Shield,
  ShieldAlert,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Lock,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AccountSettingsModalProps {
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ onClose }) => {
  const { users, currentUser, addUser, updateUser, deleteUser } = useERP();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Access check: Only OWNER is allowed
  if (currentUser.role !== 'OWNER') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-900">Akses Ditolak</h3>
          <p className="text-xs text-slate-600">
            Menu Setting Akun dan Data Karyawan hanya dapat diakses secara eksklusif oleh akun <strong>OWNER</strong>.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setName('');
    setRole('STAFF');
    setPhone('');
    setAddress('');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(user.password);
    setName(user.name);
    setRole(user.role);
    setPhone(user.phone);
    setAddress(user.address);
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim() || !name.trim()) {
      setErrorMsg('Username, password, dan nama lengkap wajib diisi!');
      return;
    }

    if (editingUser) {
      // Check username collision with others
      if (users.some(u => u.id !== editingUser.id && u.username.toLowerCase() === username.trim().toLowerCase())) {
        setErrorMsg('Username sudah digunakan oleh akun lain!');
        return;
      }
      updateUser(editingUser.id, {
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role,
        phone: phone.trim(),
        address: address.trim()
      });
      setSuccessMsg(`Akun ${name} berhasil diperbarui.`);
    } else {
      // Check username collision
      if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
        setErrorMsg('Username sudah terdaftar! Gunakan username lain.');
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
      setSuccessMsg(`Akun baru ${name} (${role}) berhasil dibuat.`);
    }

    setTimeout(() => setSuccessMsg(''), 3000);
    setShowAddModal(false);
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Owner yang sedang aktif digunakan!');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun "${user.name}" (${user.username})?`)) {
      deleteUser(user.id);
      setSuccessMsg(`Akun ${user.name} telah dihapus.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-lg border border-amber-300">OWNER (Full Akses)</span>;
      case 'SUPERVISOR':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 text-[10px] font-black rounded-lg border border-red-300">KEPALA TOKO / SUPERVISI</span>;
      case 'FINANCE':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg border border-emerald-300">FINANCE (Keuangan)</span>;
      case 'STAFF':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[10px] font-black rounded-lg border border-slate-300">STAFF KASIR</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg text-amber-400">Setting Akun & Data Karyawan</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                  KHUSUS OWNER
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Kelola hak akses, username, data diri, dan kata sandi staff, supervisi, finance & owner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action bar & Alert */}
        <div className="p-6 pb-2 space-y-3 shrink-0">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-600 font-medium">
                Total Akun Terdaftar: <strong className="text-slate-900">{users.length} akun</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Staff dan Supervisi dapat login dengan username dan password yang tercatat di bawah ini.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition shrink-0"
            >
              <Plus size={16} />
              <span>Tambah Akun Karyawan</span>
            </button>
          </div>
        </div>

        {/* Table of Accounts */}
        <div className="p-6 pt-2 overflow-y-auto flex-1">
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama & Username</th>
                  <th className="py-3 px-4">Role Akses</th>
                  <th className="py-3 px-4">Data Kontak & Alamat</th>
                  <th className="py-3 px-4">Tgl Gabung</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => {
                  const isVisible = Boolean(showPasswordMap[u.id]);
                  const isSelf = u.id === currentUser.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-semibold">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">@{u.username}</div>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3.5 px-4 text-[11px] space-y-0.5">
                        <div className="flex items-center text-slate-700">
                          <Phone size={12} className="mr-1 text-slate-400" />
                          <span>{u.phone || '-'}</span>
                        </div>
                        <div className="flex items-center text-slate-500 max-w-xs truncate">
                          <MapPin size={12} className="mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{u.address || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{u.joinDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 text-[11px] border border-slate-200">
                            {isVisible ? u.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                            title={isVisible ? 'Sembunyikan' : 'Lihat Kata Sandi'}
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Data & Password"
                          >
                            <Edit2 size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Akun"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Role Access Matrix Explanation */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Shield size={14} className="text-amber-500" />
              <span>Ringkasan Hak Akses Sistem:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-slate-600">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <p className="font-bold text-amber-700">👑 OWNER</p>
                <p>Full akses ke semua menu, Setting Akun, Import Excel, Laporan Keuangan, serta bebas ubah menu & stok.</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <p className="font-bold text-red-700">👔 KEPALA TOKO / SUPERVISI</p>
                <p>Akses POS, Purchasing, Opname, Riwayat, Approval Retur. Tidak bisa akses Import Excel, Setting Akun, Laporan Keuangan, & tidak bisa edit stok/menu.</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <p className="font-bold text-emerald-700">📊 FINANCE</p>
                <p>Akses Laporan Keuangan, POS, Purchasing, Stok, Import Excel. Tidak bisa akses Setting Akun.</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <p className="font-bold text-slate-700">🧑‍🍳 STAFF KASIR</p>
                <p>Akses POS dan Riwayat. Tidak bisa akses Import Excel, Setting Akun, Laporan Keuangan, tidak bisa edit purchasing, tidak bisa edit stok/menu, retur kasir WAJIB approval supervisi/owner.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm text-amber-400">
                {editingUser ? 'Edit Data Akun & Password' : 'Buat Akun Karyawan Baru'}
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Akun</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 font-bold bg-white"
                >
                  <option value="STAFF">STAFF (Kasir Outlet)</option>
                  <option value="SUPERVISOR">KEPALA TOKO / SUPERVISI</option>
                  <option value="FINANCE">FINANCE (Keuangan)</option>
                  <option value="OWNER">OWNER (Pemilik Toko)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: staff_andi"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: pass123"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Staff</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Andi Firmansyah"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
                <input
                  type="text"
                  placeholder="misal: 08123456789"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Domisili</label>
                <textarea
                  rows={2}
                  placeholder="misal: Jl. Surya Kencana Pamulang, Tangsel"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
