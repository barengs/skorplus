import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import DataTable from '../../../organisms/DataTable/DataTable';
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../../../../features/admin/adminUsersSlice';
import api from '../../../../services/api';
import { toast } from 'react-toastify';

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, loading } = useSelector((state) => state.adminUsers);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  
  const [availableSchools, setAvailableSchools] = useState([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    program: '',
    phone: '',
    school_id: '',
    school: '',
    nisn: '',
    gender: '',
    birth_year: '',
    address: '',
    role: 'siswa',
    is_active: true,
  });

  useEffect(() => {
    dispatch(fetchAdminUsers());
    api.get('/admin/roles').then((res) => setAvailableRoles(res.data)).catch(() => {});
    api.get('/learning-packages').then((res) => setAvailablePrograms(res.data)).catch(() => {});
    api.get('/schools/public').then((res) => setAvailableSchools(res.data)).catch(() => {});
  }, [dispatch]);

  const handleSchoolChange = (e) => {
    const selectedId = e.target.value;
    const selectedSchool = availableSchools.find(s => String(s.id) === String(selectedId));
    
    setFormData(prev => {
      const nextData = { ...prev, school_id: selectedId, school: selectedSchool ? selectedSchool.name : '' };
      // Auto-select program if school has an active package
      if (selectedSchool && selectedSchool.active_learning_packages && selectedSchool.active_learning_packages.length > 0) {
        nextData.program = selectedSchool.active_learning_packages[0].name;
      }
      return nextData;
    });
  };

  const openModal = (user = null) => {
    if (user) {
      const userSchool = availableSchools.find(
        (s) => String(s.id) === String(user.school_id) || (s.name && s.name.toLowerCase() === (user.school || '').toLowerCase())
      );
      const schoolProgram = userSchool?.active_learning_packages?.[0]?.name;

      setFormData({
        name: user.name,
        email: user.email,
        program: schoolProgram || user.program || '',
        phone: user.phone || '',
        school_id: user.school_id || (userSchool ? String(userSchool.id) : ''),
        school: user.school || (userSchool ? userSchool.name : ''),
        nisn: user.nisn || '',
        gender: user.gender || '',
        birth_year: user.birth_year ? String(user.birth_year) : '',
        address: user.address || '',
        role: user.roles?.[0] || 'siswa',
        is_active: user.is_active,
      });
      setEditingUser(user);
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        program: '',
        phone: '',
        school_id: '',
        school: '',
        nisn: '',
        gender: '',
        birth_year: '',
        address: '',
        role: 'siswa',
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await dispatch(updateAdminUser({ id: editingUser.id, ...formData })).unwrap();
        toast.success('Pengguna berhasil diperbarui!');
      } else {
        await dispatch(createAdminUser(formData)).unwrap();
        toast.success('Pengguna berhasil ditambahkan!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err || 'Gagal menyimpan pengguna');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Yakin ingin menghapus pengguna ini?')) {
      try {
        await dispatch(deleteAdminUser(userId)).unwrap();
        toast.success('Pengguna berhasil dihapus');
      } catch (err) {
        toast.error(err || 'Gagal menghapus pengguna');
      }
    }
  };

  const currentSchool = useMemo(() => {
    return availableSchools.find(
      (s) => String(s.id) === String(formData.school_id) || (s.name && s.name.toLowerCase() === (formData.school || '').toLowerCase())
    );
  }, [availableSchools, formData.school_id, formData.school]);

  const currentSchoolPackages = currentSchool?.active_learning_packages || [];

  const getProgramBadgeColor = (val) => {
    const colors = { mandiri: 'slate', intensif: 'blue', garansi: 'gold' };
    return colors[val?.toLowerCase()] || 'purple';
  };

  const [activeTab, setActiveTab] = useState('siswa');

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = searchTerm === '' || u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.includes(searchTerm);
      const matchProgram = filterProgram === '' || u.program === filterProgram;
      
      const isSiswa = u.roles?.includes('siswa');
      const matchTab = activeTab === 'siswa' ? isSiswa : !isSiswa;

      return matchSearch && matchProgram && matchTab;
    });
  }, [users, searchTerm, filterProgram, activeTab]);

  // TanStack Table Column Definitions
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: (info) => <span className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'program',
        header: 'Program',
        cell: (info) => {
          const val = info.getValue();
          return val ? <Badge color={getProgramBadgeColor(val)}>{val}</Badge> : '-';
        },
      },
      {
        accessorKey: 'roles',
        header: 'Role',
        cell: (info) => (
          <div className="flex gap-1">
            {(info.getValue() || []).map((r) => (
              <Badge key={r} color="blue">{r}</Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: (info) => (
          info.getValue() ? <Badge color="emerald">✓ Aktif</Badge> : <Badge color="slate">Nonaktif</Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openModal(row.original); }}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }}>
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const handleRowClick = (user) => {
    if (user.roles?.includes('siswa') || activeTab === 'siswa') {
      navigate(`/admin/users/${user.id}`);
    }
  };

  return (
    <AppLayout title="Kelola Pengguna & Siswa">
      <div className="w-full pb-16 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Manajemen Pengguna</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Pengguna Terdaftar: {users.length}</p>
          </div>
          <Button onClick={() => openModal()}>+ Tambah Pengguna</Button>
        </div>

        {/* Tabs for Separation */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`px-4 py-2 font-semibold text-sm rounded-md transition-all ${
              activeTab === 'siswa'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Data Siswa
          </button>
          <button
            onClick={() => setActiveTab('pengurus')}
            className={`px-4 py-2 font-semibold text-sm rounded-md transition-all ${
              activeTab === 'pengurus'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Data Pengurus (Admin & Tutor)
          </button>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Cari nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {activeTab === 'siswa' && (
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Program</option>
              {availablePrograms.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          )}
          <Button variant="ghost" onClick={() => dispatch(fetchAdminUsers())}>
            🔄 Refresh Data
          </Button>
        </div>

        {/* TanStack Paginated Table */}
        <DataTable columns={columns} data={filteredUsers} loading={loading} onRowClick={handleRowClick} />

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Program
                    </label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Pilih Program</option>
                      {currentSchoolPackages.length > 0 && (
                        <optgroup label={`Paket Mitra: ${currentSchool?.name}`}>
                          {currentSchoolPackages.map((p) => (
                            <option key={`school-pkg-${p.id}`} value={p.name}>
                              ⭐ {p.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Daftar Paket Program">
                        {availablePrograms.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Program Standar (Legacy)">
                        <option value="intensif">Intensif</option>
                        <option value="mandiri">Mandiri</option>
                        <option value="garansi">Garansi</option>
                      </optgroup>
                    </select>
                    {currentSchoolPackages.length > 0 && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <span>✓</span> Terpilih otomatis dari paket sekolah
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Role Pengguna
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Nomor HP / WA
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08123456789"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Pilih Gender</option>
                      <option value="laki-laki">Laki-laki</option>
                      <option value="perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Tahun Lahir
                    </label>
                    <Input
                      type="number"
                      value={formData.birth_year}
                      onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                      placeholder="Contoh: 2006"
                      min="1950"
                      max="2030"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      NISN
                    </label>
                    <Input
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      placeholder="10 digit NISN"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Asal Sekolah
                  </label>
                  <select
                    value={formData.school_id}
                    onChange={handleSchoolChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Pilih Sekolah (Opsional)</option>
                    {availableSchools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Alamat domisili atau tempat tinggal"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Aktifkan Pengguna
                  </label>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setModalOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Simpan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
