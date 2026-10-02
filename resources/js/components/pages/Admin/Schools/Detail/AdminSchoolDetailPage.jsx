import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../../../../templates/AppLayout';
import Button from '../../../../atoms/Button';
import Badge from '../../../../atoms/Badge';
import Input from '../../../../atoms/Input';
import Avatar from '../../../../atoms/Avatar';
import DataTable from '../../../../organisms/DataTable/DataTable';
import api from '../../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SchoolPackagesSection from './SchoolPackagesSection';
import { compressImageToFile } from '../../../../../utils/imageCompressor';

export default function AdminSchoolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');

  // Student Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', nisn: '', phone: '', avatar: '', program: 'intensif', is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // School Media Edit Modal
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaForm, setMediaForm] = useState({ logo: '', photo: '' });
  const [savingMedia, setSavingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const logoInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Admin Modal
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '', avatar: '' });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [uploadingAdminAvatar, setUploadingAdminAvatar] = useState(false);
  const adminAvatarInputRef = useRef(null);

  // Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const importFileInputRef = useRef(null);

  const fetchSchoolDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/schools/${id}`);
      setSchool(res.data);
      setMediaForm({
        logo: res.data.logo || '',
        photo: res.data.photo || '',
      });
    } catch {
      toast.error('Gagal memuat detail sekolah');
      navigate('/admin/schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchoolDetail(); }, [id]);

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

  const onAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await handleFileUpload(file, 'avatar');
      if (url) {
        setFormData(prev => ({ ...prev, avatar: url }));
        toast.success('Foto profil berhasil diunggah!');
      }
    } catch {
      toast.error('Gagal mengunggah foto profil');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onAdminAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAdminAvatar(true);
    try {
      const url = await handleFileUpload(file, 'avatar');
      if (url) {
        setAdminForm(prev => ({ ...prev, avatar: url }));
        toast.success('Foto profil admin berhasil diunggah!');
      }
    } catch {
      toast.error('Gagal mengunggah foto profil');
    } finally {
      setUploadingAdminAvatar(false);
    }
  };

  const onSchoolLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const url = await handleFileUpload(file, 'thumbnail');
      if (url) {
        setMediaForm(prev => ({ ...prev, logo: url }));
        toast.success('Logo sekolah berhasil diunggah!');
      }
    } catch {
      toast.error('Gagal mengunggah logo');
    } finally {
      setUploadingMedia(false);
    }
  };

  const onSchoolPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const url = await handleFileUpload(file, 'thumbnail');
      if (url) {
        setMediaForm(prev => ({ ...prev, photo: url }));
        toast.success('Foto gedung sekolah berhasil diunggah!');
      }
    } catch {
      toast.error('Gagal mengunggah foto sekolah');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSaveMedia = async (e) => {
    e.preventDefault();
    setSavingMedia(true);
    try {
      const res = await api.put(`/admin/schools/${id}`, mediaForm);
      setSchool(prev => ({ ...prev, logo: res.data.logo, photo: res.data.photo }));
      toast.success('Foto & logo sekolah berhasil diperbarui!');
      setMediaModalOpen(false);
    } catch {
      toast.error('Gagal menyimpan perubahan media');
    } finally {
      setSavingMedia(false);
    }
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    setSavingAdmin(true);
    try {
      const res = await api.post(`/admin/schools/${id}/admin`, adminForm);
      setSchool(prev => ({
        ...prev,
        admins: [...(prev.admins || []), res.data.user],
        admins_count: (prev.admins_count || 0) + 1,
      }));
      toast.success('Akun Admin Sekolah berhasil dibuat!');
      setAdminModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal membuat akun admin');
    } finally {
      setSavingAdmin(false);
    }
  };

  const openModal = (student = null) => {
    if (student) {
      setFormData({
        name: student.name, email: student.email, password: '',
        nisn: student.nisn || '', phone: student.phone || '',
        avatar: student.avatar || '',
        program: student.program || 'intensif', is_active: student.is_active,
      });
      setEditingStudent(student);
    } else {
      setFormData({
        name: '', email: '', password: '', nisn: '', phone: '', avatar: '',
        program: 'intensif', is_active: true,
      });
      setEditingStudent(null);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStudent) {
        const res = await api.put(`/admin/schools/${id}/students/${editingStudent.id}`, formData);
        setSchool(prev => ({
          ...prev,
          students: prev.students.map(s => s.id === editingStudent.id ? res.data.student : s),
        }));
        toast.success('Data siswa berhasil diperbarui!');
      } else {
        const res = await api.post(`/admin/schools/${id}/students`, formData);
        setSchool(prev => ({
          ...prev,
          students: [res.data.student, ...prev.students],
          students_count: (prev.students_count || 0) + 1,
        }));
        toast.success('Siswa berhasil ditambahkan!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data siswa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Hapus siswa ini dari sekolah?')) return;
    try {
      await api.delete(`/admin/schools/${id}/students/${studentId}`);
      setSchool(prev => ({
        ...prev,
        students: prev.students.filter(s => s.id !== studentId),
        students_count: Math.max(0, (prev.students_count || 1) - 1),
      }));
      toast.success('Siswa berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus siswa');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/admin/schools/${id}/students/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `data-siswa-${school?.name?.replace(/\s+/g, '-').toLowerCase() || 'sekolah'}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('File Excel berhasil diunduh!');
    } catch (err) {
      toast.error('Gagal mengekspor data siswa');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/admin/schools/students/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template-import-data-siswa.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template Excel berhasil diunduh!');
    } catch (err) {
      toast.error('Gagal mengunduh template Excel');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Pilih file Excel terlebih dahulu');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setImporting(true);
      const response = await api.post(`/admin/schools/${id}/students/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success(response.data.message || 'Siswa berhasil diimpor!');
      if (response.data.imported) {
        toast.info(`${response.data.imported} siswa berhasil diimpor`);
      }
      
      setImportModalOpen(false);
      setImportFile(null);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
      fetchSchoolDetail();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        toast.error(
          <div>
            <strong>Gagal mengimpor:</strong>
            <ul className="list-disc pl-4 mt-1 text-xs">
              {Object.values(errors).flat().slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
              {Object.values(errors).flat().length > 3 && <li>...dan lainnya</li>}
            </ul>
          </div>
        );
      } else {
        toast.error(err.response?.data?.message || 'Gagal mengimpor data siswa');
      }
    } finally {
      setImporting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!school?.students) return [];
    return school.students.filter(s => {
      const matchSearch = !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nisn || '').includes(searchTerm);
      const matchProg = !filterProgram || s.program === filterProgram;
      return matchSearch && matchProg;
    });
  }, [school?.students, searchTerm, filterProgram]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nama Siswa',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={info.row.original.name}
            src={info.row.original.avatar}
            size="md"
          />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</div>
            {info.row.original.nisn && (
              <div className="text-xs text-slate-500 font-mono">NISN: {info.row.original.nisn}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email / Kontak',
      cell: (info) => (
        <div className="text-sm">
          <div>{info.getValue()}</div>
          {info.row.original.phone && <div className="text-xs text-slate-500">{info.row.original.phone}</div>}
        </div>
      ),
    },
    {
      accessorKey: 'program',
      header: 'Program',
      cell: (info) => {
        const val = info.getValue();
        const colors = { intensif: 'blue', mandiri: 'slate', garansi: 'gold' };
        return <Badge color={colors[val] || 'purple'}>{val || 'intensif'}</Badge>;
      },
    },
    {
      accessorKey: 'cbt_sessions_count',
      header: 'Aktivitas CBT',
      cell: (info) => (
        <Badge color="slate">{info.getValue() || 0} sesi ujian</Badge>
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
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={() => openModal(row.original)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row.original.id)}>Hapus</Button>
        </div>
      ),
    },
  ], []);

  if (loading) {
    return (
      <AppLayout title="Detail Sekolah">
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!school) return null;

  return (
    <AppLayout title={`Detail: ${school.name}`}>
      <div className="w-full pb-16 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link to="/admin/schools">
            <Button variant="ghost" size="sm">
              <FontAwesomeIcon icon={['fas', 'arrow-left']} className="mr-2" /> Kembali ke Daftar Sekolah
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMediaModalOpen(true)}>
              <FontAwesomeIcon icon={['fas', 'camera']} className="mr-1.5" /> Ubah Logo & Foto
            </Button>
            <Button size="sm" onClick={() => setAdminModalOpen(true)}>
              <FontAwesomeIcon icon={['fas', 'user-shield']} className="mr-1.5" /> Tambah Admin Sekolah
            </Button>
          </div>
        </div>

        {/* School Profile Card with Photo Cover */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {/* Cover Photo */}
          <div className="relative h-48 sm:h-64 w-full bg-gradient-to-r from-blue-700 to-indigo-800 overflow-hidden">
            {school.photo ? (
              <img
                src={school.photo}
                alt={school.name}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40">
                <FontAwesomeIcon icon={['fas', 'school']} className="text-6xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>

          {/* School Identity Bar */}
          <div className="p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              <div className="flex items-end gap-4">
                {/* Logo */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-xl ring-4 ring-white dark:ring-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                  {school.logo ? (
                    <img src={school.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-blue-600 text-white flex items-center justify-center text-3xl font-black">
                      <FontAwesomeIcon icon={['fas', 'school']} />
                    </div>
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{school.name}</h2>
                    {school.is_active
                      ? <Badge color="emerald">Aktif</Badge>
                      : <Badge color="slate">Nonaktif</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                    {school.npsn && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-semibold">NPSN: {school.npsn}</span>}
                    {school.email && <span>{school.email}</span>}
                    {school.phone && <span>• {school.phone}</span>}
                  </div>
                </div>
              </div>
            </div>

            {school.address && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <FontAwesomeIcon icon={['fas', 'map-marker-alt']} className="text-red-500" /> {school.address}
              </p>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">Total Siswa</div>
                <div className="text-2xl font-black text-blue-600">{school.students_count || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">Admin Sekolah</div>
                <div className="text-2xl font-black text-purple-600">{school.admins_count || 0}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">Siswa Aktif</div>
                <div className="text-2xl font-black text-emerald-600">
                  {school.students?.filter(s => s.is_active).length || 0}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">Nonaktif</div>
                <div className="text-2xl font-black text-slate-400">
                  {school.students?.filter(s => !s.is_active).length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admins List Section */}
        {school.admins && school.admins.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'user-shield']} className="text-purple-500" />
              Pengelola & Admin Sekolah ({school.admins.length})
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {school.admins.map((adm) => (
                <div key={adm.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <Avatar name={adm.name} src={adm.avatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{adm.name}</div>
                    <div className="text-xs text-slate-500 truncate">{adm.email}</div>
                    {adm.phone && <div className="text-[11px] text-slate-400 truncate">{adm.phone}</div>}
                  </div>
                  <Badge color="purple">Admin</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packages & Contracts Section */}
        <SchoolPackagesSection
          schoolId={id}
          schoolName={school.name}
          totalStudents={school.students_count || 0}
        />

        {/* Students Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={['fas', 'user-graduate']} className="text-blue-500" />
                Daftar Siswa Terdaftar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{school.students?.length || 0} siswa terdaftar di sekolah ini</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
                <FontAwesomeIcon icon={['fas', 'file-import']} className="mr-1.5" /> Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FontAwesomeIcon icon={['fas', 'file-export']} className="mr-1.5" /> Export
              </Button>
              <Button size="sm" onClick={() => openModal()}>
                <FontAwesomeIcon icon={['fas', 'user-plus']} className="mr-1.5" /> Tambah Siswa
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <Input
              placeholder="Cari nama, email, atau NISN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              value={filterProgram}
              onChange={e => setFilterProgram(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
            >
              <option value="">Semua Program</option>
              <option value="intensif">Intensif</option>
              <option value="mandiri">Mandiri</option>
              <option value="garansi">Garansi</option>
            </select>
            <Button variant="ghost" onClick={fetchSchoolDetail}>🔄 Refresh Data</Button>
          </div>

          {/* Students Table */}
          <DataTable columns={columns} data={filteredStudents} loading={false} />
        </div>
      </div>

      {/* Student Form Modal (With Photo Upload) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
              {editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Avatar Uploader */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <Avatar name={formData.name || 'Siswa'} src={formData.avatar} size="xl" />
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Foto Profil Siswa
                  </label>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={onAvatarFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? 'Mengunggah...' : 'Pilih Foto'}
                    </Button>
                    {formData.avatar && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, avatar: '' })}
                      >
                        Hapus Foto
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Siswa <span className="text-red-500">*</span>
                </label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Password {!editingStudent && <span className="text-slate-400 font-normal">(Default: password123)</span>}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingStudent ? 'Biarkan kosong jika tidak diubah' : 'password123'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">NISN</label>
                  <Input value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} placeholder="10 digit NISN" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">No. WhatsApp</label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="081..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Program</label>
                  <select
                    value={formData.program}
                    onChange={e => setFormData({ ...formData, program: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
                  >
                    <option value="intensif">Intensif</option>
                    <option value="mandiri">Mandiri</option>
                    <option value="garansi">Garansi</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status Aktif</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1" disabled={saving || uploadingAvatar}>
                  {saving ? 'Menyimpan...' : 'Simpan Siswa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* School Media Modal (Logo & Foto Sekolah) */}
      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Ubah Logo & Foto Gedung Sekolah
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Unggah logo resmi dan foto lingkungan/gedung sekolah untuk mempercantik profil.
            </p>

            <form onSubmit={handleSaveMedia} className="space-y-4">
              {/* Logo Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Logo Sekolah
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {mediaForm.logo ? (
                      <img src={mediaForm.logo} alt="Logo preview" className="w-full h-full object-contain" />
                    ) : (
                      <FontAwesomeIcon icon={['fas', 'school']} className="text-2xl text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={onSchoolLogoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingMedia}
                    >
                      {uploadingMedia ? 'Mengunggah...' : 'Pilih File Logo'}
                    </Button>
                    <Input
                      placeholder="Atau masukkan URL logo..."
                      value={mediaForm.logo}
                      onChange={e => setMediaForm({ ...mediaForm, logo: e.target.value })}
                      className="mt-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Building Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Foto Gedung / Lingkungan Sekolah
                </label>
                <div className="w-full h-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden mb-3 flex items-center justify-center">
                  {mediaForm.photo ? (
                    <img src={mediaForm.photo} alt="Building preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                      <FontAwesomeIcon icon={['fas', 'image']} className="text-2xl" />
                      <span>Belum ada foto gedung</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={onSchoolPhotoChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingMedia}
                >
                  {uploadingMedia ? 'Mengunggah...' : 'Pilih Foto Gedung'}
                </Button>
                <Input
                  placeholder="Atau masukkan URL foto gedung..."
                  value={mediaForm.photo}
                  onChange={e => setMediaForm({ ...mediaForm, photo: e.target.value })}
                  className="mt-2 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setMediaModalOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1" disabled={savingMedia || uploadingMedia}>
                  {savingMedia ? 'Menyimpan...' : 'Simpan Media'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Account Modal (With Photo Upload) */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              Tambah Admin Sekolah
            </h2>
            <p className="text-slate-500 text-sm mb-4">Sekolah: <strong>{school?.name}</strong></p>

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              {/* Admin Avatar */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <Avatar name={adminForm.name || 'Admin'} src={adminForm.avatar} size="lg" />
                <div className="flex-1">
                  <input
                    type="file"
                    ref={adminAvatarInputRef}
                    onChange={onAdminAvatarFileChange}
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
      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FontAwesomeIcon icon={['fas', 'file-import']} className="text-blue-500" />
                Import Data Siswa
              </h2>
              <button
                onClick={() => { setImportModalOpen(false); setImportFile(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Sekolah: <strong>{school?.name}</strong>. Unduh template Excel di bawah, lengkapi data siswa, lalu upload file kembali.
            </p>

            <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Template Format Siswa</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">File format .xlsx siap isi</div>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleDownloadTemplate} className="border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white">
                <FontAwesomeIcon icon={['fas', 'download']} className="mr-1.5" />
                Unduh Template
              </Button>
            </div>

            <form onSubmit={handleImport} className="space-y-4">
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors text-center">
                <input
                  type="file"
                  ref={importFileInputRef}
                  onChange={e => setImportFile(e.target.files?.[0])}
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="excel_file_input"
                />
                <label htmlFor="excel_file_input" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 mx-auto flex items-center justify-center text-xl mb-2">
                    <FontAwesomeIcon icon={['fas', 'file-excel']} />
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {importFile ? importFile.name : 'Klik untuk memilih file Excel'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Format yang didukung: .xlsx, .xls
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setImportModalOpen(false); setImportFile(null); }} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={importing || !importFile}>
                  {importing ? 'Memproses...' : 'Mulai Import'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
