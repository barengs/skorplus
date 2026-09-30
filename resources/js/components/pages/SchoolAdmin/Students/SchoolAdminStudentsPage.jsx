import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import DataTable from '../../../organisms/DataTable/DataTable';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function SchoolAdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', nisn: '', phone: '', program: 'intensif',
    gender: '', birth_year: '', address: '', is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Batch import state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school-admin/students');
      setSchool(res.data.school);
      setStudents(res.data.students || []);
    } catch {
      toast.error('Gagal memuat data siswa sekolah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (student = null) => {
    if (student) {
      setFormData({
        name: student.name, email: student.email, password: '',
        nisn: student.nisn || '', phone: student.phone || '',
        program: student.program || 'intensif', gender: student.gender || '',
        birth_year: student.birth_year ? String(student.birth_year) : '',
        address: student.address || '', is_active: student.is_active,
      });
      setEditingStudent(student);
    } else {
      setFormData({
        name: '', email: '', password: '', nisn: '', phone: '',
        program: 'intensif', gender: '', birth_year: '', address: '', is_active: true,
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
        const res = await api.put(`/school-admin/students/${editingStudent.id}`, formData);
        setStudents(s => s.map(x => x.id === editingStudent.id ? res.data.student : x));
        toast.success('Data siswa berhasil diperbarui!');
      } else {
        const res = await api.post('/school-admin/students', formData);
        setStudents(s => [res.data.student, ...s]);
        toast.success('Siswa berhasil didaftarkan!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data siswa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus siswa ini dari daftar sekolah?')) return;
    try {
      await api.delete(`/school-admin/students/${id}`);
      setStudents(s => s.filter(x => x.id !== id));
      toast.success('Siswa berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus siswa');
    }
  };

  const handleBatchImport = async (e) => {
    e.preventDefault();
    if (!batchText.trim()) {
      toast.warn('Masukkan data siswa dalam format teks atau CSV');
      return;
    }

    // Parse CSV / TSV lines: Nama, Email, NISN (optional), Phone (optional)
    const lines = batchText.trim().split('\n');
    const parsedStudents = [];

    for (let line of lines) {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      if (parts.length >= 2 && parts[1].includes('@')) {
        parsedStudents.push({
          name: parts[0],
          email: parts[1],
          nisn: parts[2] || '',
          phone: parts[3] || '',
          program: 'intensif',
        });
      }
    }

    if (parsedStudents.length === 0) {
      toast.error('Format data tidak valid. Contoh per baris: Nama, Email, NISN, NoHp');
      return;
    }

    setBatchLoading(true);
    try {
      const res = await api.post('/school-admin/students/batch', { students: parsedStudents });
      toast.success(res.data.message || `Berhasil mengimpor ${parsedStudents.length} siswa!`);
      if (res.data.errors && res.data.errors.length > 0) {
        toast.warn(`${res.data.errors.length} data dilewati karena duplikat`);
      }
      setBatchModalOpen(false);
      setBatchText('');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengimpor siswa');
    } finally {
      setBatchLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nisn || '').includes(searchTerm);
      const matchProg = !filterProgram || s.program === filterProgram;
      return matchSearch && matchProg;
    });
  }, [students, searchTerm, filterProgram]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nama Siswa',
      cell: (info) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</div>
          {info.row.original.nisn && (
            <div className="text-xs text-slate-500 font-mono">NISN: {info.row.original.nisn}</div>
          )}
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

  return (
    <AppLayout title="Data Siswa Sekolah">
      <div className="w-full pb-16 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Data Siswa — {school?.name || 'Sekolah'}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Total {students.length} siswa terdaftar di bawah akun sekolah ini
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBatchModalOpen(true)}>
              <FontAwesomeIcon icon={['fas', 'file-import']} className="mr-2" /> Impor Massal
            </Button>
            <Button onClick={() => openModal()}>
              <FontAwesomeIcon icon={['fas', 'user-plus']} className="mr-2" /> Tambah Siswa
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-3">
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
          <Button variant="ghost" onClick={loadData}>🔄 Refresh Data</Button>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={filteredStudents} loading={loading} />
      </div>

      {/* Student Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
              {editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
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
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
                  >
                    <option value="">Pilih</option>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="student_is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="student_is_active" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status Aktif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Siswa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Impor Massal Siswa
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Tempel (paste) data siswa dari Excel/CSV. Satu baris per siswa dengan format:<br />
              <code className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded text-[11px]">
                Nama, Email, NISN, NoHp
              </code>
            </p>

            <form onSubmit={handleBatchImport} className="space-y-4">
              <textarea
                rows={8}
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                placeholder="Contoh:&#10;Ahmad Fauzi, ahmad@sekolah.sch.id, 0091234561, 08123456789&#10;Bunga Citra, bunga@sekolah.sch.id, 0091234562, 08123456788"
                className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setBatchModalOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1" disabled={batchLoading}>
                  {batchLoading ? 'Mengimpor...' : 'Mulai Impor Siswa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
