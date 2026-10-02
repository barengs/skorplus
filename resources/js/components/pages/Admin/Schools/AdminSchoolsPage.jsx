import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import Avatar from '../../../atoms/Avatar';
import DataTable from '../../../organisms/DataTable/DataTable';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compressImageToFile } from '../../../../utils/imageCompressor';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    name: '', npsn: '', email: '', phone: '', address: '', logo: '', photo: '', is_active: true,
    // Admin account creation (new school only)
    admin_name: '', admin_email: '', admin_password: '', admin_avatar: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingInitialAdminAvatar, setUploadingInitialAdminAvatar] = useState(false);

  const logoInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const initialAdminAvatarInputRef = useRef(null);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '', avatar: '' });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [uploadingAdminAvatar, setUploadingAdminAvatar] = useState(false);
  const adminAvatarInputRef = useRef(null);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/schools');
      setSchools(res.data);
    } catch {
      toast.error('Gagal memuat data sekolah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchools(); }, []);

  const handleFileUpload = async (file, type = 'avatar') => {
    if (!file) return null;
    const maxDim = type === 'thumbnail' ? 1280 : 512;
    const compressedFile = await compressImageToFile(file, { maxWidth: maxDim, maxHeight: maxDim, quality: 0.85 });
    const form = new FormData();
    form.append('file', compressedFile);
    const endpoint = type === 'thumbnail' ? '/admin/upload/thumbnail' : '/upload/avatar';
    const res = await api.post(endpoint, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  };

  const openModal = (school = null) => {
    if (school) {
      setFormData({
        name: school.name, npsn: school.npsn || '', email: school.email || '',
        phone: school.phone || '', address: school.address || '',
        logo: school.logo || '', photo: school.photo || '',
        is_active: school.is_active,
        admin_name: '', admin_email: '', admin_password: '', admin_avatar: '',
      });
      setEditingSchool(school);
    } else {
      setFormData({
        name: '', npsn: '', email: '', phone: '', address: '', logo: '', photo: '', is_active: true,
        admin_name: '', admin_email: '', admin_password: '', admin_avatar: '',
      });
      setEditingSchool(null);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSchool) {
        const res = await api.put(`/admin/schools/${editingSchool.id}`, formData);
        setSchools(s => s.map(x => x.id === editingSchool.id ? res.data : x));
        toast.success('Sekolah berhasil diperbarui!');
      } else {
        const res = await api.post('/admin/schools', formData);
        setSchools(s => [res.data, ...s]);
        toast.success('Sekolah berhasil didaftarkan!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan sekolah');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus sekolah ini?')) return;
    try {
      await api.delete(`/admin/schools/${id}`);
      setSchools(s => s.filter(x => x.id !== id));
      toast.success('Sekolah berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus sekolah');
    }
  };

  const openAdminModal = (school) => {
    setSelectedSchool(school);
    setAdminForm({ name: '', email: '', password: '', phone: '', avatar: '' });
    setAdminModalOpen(true);
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    setSavingAdmin(true);
    try {
      await api.post(`/admin/schools/${selectedSchool.id}/admin`, adminForm);
      toast.success('Akun Admin Sekolah berhasil dibuat!');
      setAdminModalOpen(false);
      loadSchools();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal membuat akun admin');
    } finally {
      setSavingAdmin(false);
    }
  };

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return schools;
    const s = searchTerm.toLowerCase();
    return schools.filter(x =>
      x.name.toLowerCase().includes(s) ||
      (x.npsn || '').includes(s) ||
      (x.email || '').toLowerCase().includes(s)
    );
  }, [schools, searchTerm]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Sekolah & Logo',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            {info.row.original.logo ? (
              <img src={info.row.original.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <FontAwesomeIcon icon={['fas', 'school']} className="text-slate-400 text-lg" />
            )}
          </div>
          <div>
            <Link
              to={`/admin/schools/${info.row.original.id}`}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {info.getValue()}
            </Link>
            {info.row.original.npsn && (
              <div className="text-xs text-slate-500 font-mono">NPSN: {info.row.original.npsn}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Kontak',
      cell: (info) => (
        <div className="text-sm">
          {info.row.original.email && <div>{info.row.original.email}</div>}
          {info.row.original.phone && <div className="text-xs text-slate-500">{info.row.original.phone}</div>}
        </div>
      ),
    },
    {
      accessorKey: 'students_count',
      header: 'Siswa',
      cell: (info) => (
        <Badge color="blue">{info.getValue() || 0} siswa</Badge>
      ),
    },
    {
      accessorKey: 'admins_count',
      header: 'Admin',
      cell: (info) => (
        <Badge color="purple">{info.getValue() || 0} admin</Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: (info) => (
        info.getValue()
          ? <Badge color="emerald">✓ Aktif</Badge>
          : <Badge color="slate">Nonaktif</Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end flex-wrap">
          <Link to={`/admin/schools/${row.original.id}`}>
            <Button variant="outline" size="sm">
              <FontAwesomeIcon icon={['fas', 'eye']} className="mr-1" /> Detail
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => openAdminModal(row.original)}>
            <FontAwesomeIcon icon={['fas', 'user-plus']} className="mr-1" /> Admin
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openModal(row.original)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row.original.id)}>
            Hapus
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <AppLayout title="Manajemen Sekolah">
      <div className="w-full pb-16 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Manajemen Sekolah</h2>
            <p className="text-slate-500 text-sm mt-0.5">{schools.length} sekolah terdaftar</p>
          </div>
          <Button onClick={() => openModal()}>
            <FontAwesomeIcon icon={['fas', 'plus']} className="mr-2" /> Daftarkan Sekolah
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <Input
            placeholder="Cari nama, NPSN, atau email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="ghost" onClick={loadSchools}>🔄 Refresh</Button>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={filteredSchools} loading={loading} />
      </div>

      {/* School Form Modal (With Logo and Photo Upload) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
              {editingSchool ? 'Edit Sekolah' : 'Daftarkan Sekolah Baru'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Logo & Photo Section */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                {/* Logo */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Logo Sekolah</label>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <FontAwesomeIcon icon={['fas', 'school']} className="text-slate-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingLogo(true);
                        try {
                          const url = await handleFileUpload(file, 'thumbnail');
                          if (url) setFormData(prev => ({ ...prev, logo: url }));
                        } catch { toast.error('Gagal mengunggah logo'); }
                        finally { setUploadingLogo(false); }
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? '...' : 'Pilih'}
                    </Button>
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Foto Gedung</label>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.photo ? (
                        <img src={formData.photo} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <FontAwesomeIcon icon={['fas', 'image']} className="text-slate-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingPhoto(true);
                        try {
                          const url = await handleFileUpload(file, 'thumbnail');
                          if (url) setFormData(prev => ({ ...prev, photo: url }));
                        } catch { toast.error('Gagal mengunggah foto'); }
                        finally { setUploadingPhoto(false); }
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? '...' : 'Pilih'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* School fields */}
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Sekolah <span className="text-red-500">*</span>
                </label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="SMAN 1 ..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">NPSN</label>
                  <Input value={formData.npsn} onChange={e => setFormData({ ...formData, npsn: e.target.value })} placeholder="8 digit NPSN" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">No. Telepon</label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="021-xxxxxx" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Sekolah</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="info@sekolah.sch.id" />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Alamat</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. ..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="school_is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded text-blue-600" />
                <label htmlFor="school_is_active" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aktifkan Sekolah</label>
              </div>

              {/* Admin account section — new schools only */}
              {!editingSchool && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Buat Akun Admin Sekolah (Opsional)
                  </p>

                  {/* Initial Admin Avatar */}
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <Avatar name={formData.admin_name || 'Admin'} src={formData.admin_avatar} size="md" />
                    <div>
                      <input
                        type="file"
                        ref={initialAdminAvatarInputRef}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingInitialAdminAvatar(true);
                          try {
                            const url = await handleFileUpload(file, 'avatar');
                            if (url) setFormData(prev => ({ ...prev, admin_avatar: url }));
                          } catch { toast.error('Gagal mengunggah foto'); }
                          finally { setUploadingInitialAdminAvatar(false); }
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => initialAdminAvatarInputRef.current?.click()}
                        disabled={uploadingInitialAdminAvatar}
                      >
                        {uploadingInitialAdminAvatar ? 'Mengunggah...' : 'Foto Admin'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nama Admin</label>
                    <Input value={formData.admin_name} onChange={e => setFormData({ ...formData, admin_name: e.target.value })} placeholder="Pak/Bu ..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Admin</label>
                      <Input type="email" value={formData.admin_email} onChange={e => setFormData({ ...formData, admin_email: e.target.value })} placeholder="admin@..." />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                      <Input type="password" value={formData.admin_password} onChange={e => setFormData({ ...formData, admin_password: e.target.value })} placeholder="Min. 6 karakter" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1" disabled={saving || uploadingLogo || uploadingPhoto}>
                  {saving ? 'Menyimpan...' : 'Simpan Sekolah'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              Tambah Admin Sekolah
            </h2>
            <p className="text-slate-500 text-sm mb-4">Sekolah: <strong>{selectedSchool?.name}</strong></p>

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              {/* Admin Avatar */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <Avatar name={adminForm.name || 'Admin'} src={adminForm.avatar} size="lg" />
                <div className="flex-1">
                  <input
                    type="file"
                    ref={adminAvatarInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingAdminAvatar(true);
                      try {
                        const url = await handleFileUpload(file, 'avatar');
                        if (url) setAdminForm(prev => ({ ...prev, avatar: url }));
                      } catch { toast.error('Gagal mengunggah foto'); }
                      finally { setUploadingAdminAvatar(false); }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adminAvatarInputRef.current?.click()}
                    disabled={uploadingAdminAvatar}
                  >
                    {uploadingAdminAvatar ? 'Mengunggah...' : 'Pilih Foto Admin'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nama Admin <span className="text-red-500">*</span></label>
                <Input value={adminForm.name} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email <span className="text-red-500">*</span></label>
                <Input type="email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password <span className="text-red-500">*</span></label>
                  <Input type="password" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">No. HP</label>
                  <Input value={adminForm.phone} onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="081..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setAdminModalOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1" disabled={savingAdmin || uploadingAdminAvatar}>
                  {savingAdmin ? 'Menyimpan...' : 'Buat Akun Admin'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
