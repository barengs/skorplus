import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { printSchoolStudentsPDF } from '../../../../utils/pdfReportGenerator';
import StudentReportModal from '../../Admin/Reports/StudentReportModal';

export default function SchoolAdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterClassLevel, setFilterClassLevel] = useState('');
  const [classLevels, setClassLevels] = useState([]);
  const [reportStudentId, setReportStudentId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', nisn: '', class_level: '', phone: '', avatar: '', program: 'intensif',
    gender: '', birth_year: '', address: '', is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Batch import state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  // Excel Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const importFileInputRef = useRef(null);

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

  useEffect(() => {
    loadData();
    api.get('/class-levels').then(res => {
      if (Array.isArray(res.data)) setClassLevels(res.data);
    }).catch(() => {});
  }, []);

  const openModal = (student = null) => {
    if (student) {
      setFormData({
        name: student.name, email: student.email, password: '',
        nisn: student.nisn || '', class_level: student.class_level || '', phone: student.phone || '', avatar: student.avatar || '',
        program: student.program || 'intensif', gender: student.gender || '',
        birth_year: student.birth_year ? String(student.birth_year) : '',
        address: student.address || '', is_active: student.is_active,
      });
      setEditingStudent(student);
    } else {
      setFormData({
        name: '', email: '', password: '', nisn: '', class_level: '', phone: '', avatar: '',
        program: 'intensif', gender: '', birth_year: '', address: '', is_active: true,
      });
      setEditingStudent(null);
    }
    setModalOpen(true);
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const compressedFile = await compressImageToFile(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 });
      const form = new FormData();
      form.append('file', compressedFile);
      const res = await api.post('/upload/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.url) {
        setFormData(prev => ({ ...prev, avatar: res.data.url }));
        toast.success('Foto profil berhasil diunggah!');
      }
    } catch {
      toast.error('Gagal mengunggah foto profil');
    } finally {
      setUploadingAvatar(false);
    }
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

  const handleExport = async () => {
    try {
      const response = await api.get('/school-admin/students/export', {
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
      const response = await api.get('/school-admin/students/template', {
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
      const response = await api.post('/school-admin/students/import', formData, {
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
      loadData();
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

  const [statusGroupFilter, setStatusGroupFilter] = useState('all');

  const counts = useMemo(() => {
    return {
      all: students.length,
      perlu_tindak_lanjut: students.filter((s) => s.follow_up?.status_key === 'perlu_tindak_lanjut' || (s.last_cbt_score !== null && Number(s.last_cbt_score) < 55)).length,
      butuh_penguatan: students.filter((s) => s.follow_up?.status_key === 'butuh_penguatan').length,
      kompetitif: students.filter((s) => s.follow_up?.status_key === 'kompetitif').length,
      mastered: students.filter((s) => s.follow_up?.status_key === 'mastered' || (s.irt?.predicted_utbk_score && s.irt.predicted_utbk_score >= 680)).length,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nisn || '').includes(searchTerm);
      const matchProg = !filterProgram || s.program === filterProgram;
      const matchClass = !filterClassLevel || s.class_level === filterClassLevel;

      let matchStatus = true;
      if (statusGroupFilter !== 'all') {
        if (statusGroupFilter === 'perlu_tindak_lanjut') {
          matchStatus = s.follow_up?.status_key === 'perlu_tindak_lanjut' || (s.last_cbt_score !== null && Number(s.last_cbt_score) < 55);
        } else if (statusGroupFilter === 'mastered') {
          matchStatus = s.follow_up?.status_key === 'mastered' || (s.irt?.predicted_utbk_score && s.irt.predicted_utbk_score >= 680);
        } else {
          matchStatus = s.follow_up?.status_key === statusGroupFilter;
        }
      }

      return matchSearch && matchProg && matchClass && matchStatus;
    });
  }, [students, searchTerm, filterProgram, filterClassLevel, statusGroupFilter]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nama Siswa & Identitas',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={info.row.original.name}
            src={info.row.original.avatar}
            size="md"
          />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
              {info.row.original.nisn && (
                <span className="font-mono">NISN: {info.row.original.nisn}</span>
              )}
              {info.row.original.class_level && (
                <>
                  <span>•</span>
                  <span>Kls {info.row.original.class_level}</span>
                </>
              )}
              {info.row.original.target_campus && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{info.row.original.target_campus}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'irt.predicted_utbk_score',
      header: 'Prediksi UTBK (IRT)',
      cell: ({ row }) => {
        const irtScore = row.original.irt?.predicted_utbk_score || (row.original.last_cbt_score !== null && row.original.last_cbt_score !== undefined ? Math.round(500 + ((Number(row.original.last_cbt_score) - 50) * 8)) : null);
        return irtScore ? (
          <div>
            <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
              {irtScore} pts
            </div>
            <div className="text-[10px] text-slate-400">
              CBT: {row.original.last_cbt_score ?? '-'} pts {row.original.irt?.theta !== null && row.original.irt?.theta !== undefined ? `(θ ${row.original.irt.theta > 0 ? '+' : ''}${row.original.irt.theta})` : ''}
            </div>
            {row.original.irt?.weak_subtest && (
              <div className="text-[10px] text-rose-500 font-semibold truncate max-w-[150px] mt-0.5" title={`Subtes Lemah: ${row.original.irt.weak_subtest}`}>
                ⚠️ {row.original.irt.weak_subtest}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Belum ada tes</span>
        );
      },
    },
    {
      accessorKey: 'bkt.mastery_percentage',
      header: 'Penguasaan (BKT)',
      cell: ({ row }) => {
        const bktMastery = row.original.bkt?.mastery_percentage;
        return bktMastery !== null && bktMastery !== undefined ? (
          <div>
            <div className={`font-black text-sm ${bktMastery >= 80 ? 'text-emerald-600 dark:text-emerald-400' : (bktMastery >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400')}`}>
              {bktMastery}%
            </div>
            <div className="text-[10px] text-slate-400">
              {row.original.bkt?.status_label || 'Terekam'}
            </div>
            {row.original.bkt?.weak_topic && (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[150px] mt-0.5" title={`Topik Lemah: ${row.original.bkt.weak_topic}`}>
                ⚠️ {row.original.bkt.weak_topic}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Belum ada kuis</span>
        );
      },
    },
    {
      accessorKey: 'follow_up',
      header: 'Klasifikasi & Tindak Lanjut',
      cell: ({ row }) => {
        const followUp = row.original.follow_up || {};
        return (
          <div className="space-y-1 max-w-[240px]">
            <Badge color={followUp.badge_color || 'slate'} className="text-[10px] font-bold">
              {followUp.status_label || 'Belum Ada Aktivitas'}
            </Badge>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {followUp.action_title || 'Tindak Lanjut Belajar'}
            </div>
            <div className="text-[11px] text-slate-500 line-clamp-2" title={followUp.action_detail}>
              {followUp.action_detail || '-'}
            </div>
          </div>
        );
      },
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
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const followUp = row.original.follow_up || {};
        return (
          <div className="flex items-center gap-1.5 justify-end">
            {followUp.whatsapp_url && (
              <a
                href={followUp.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all inline-flex items-center"
                title="Hubungi Siswa via WhatsApp untuk tindak lanjut"
              >
                <FontAwesomeIcon icon={['fab', 'whatsapp']} className="text-sm" />
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportStudentId(row.original.id)}
              title="Lihat Rapor & Analisis BKT/IRT Siswa"
            >
              <FontAwesomeIcon icon={['fas', 'chart-pie']} className="mr-1 text-blue-600" /> Rapor
            </Button>
            <Button variant="outline" size="sm" onClick={() => openModal(row.original)}>
              <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="mr-1 text-amber-600" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDelete(row.original.id)} className="text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-800">
              <FontAwesomeIcon icon={['fas', 'trash']} className="mr-1 text-rose-600" /> Hapus
            </Button>
          </div>
        );
      },
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => printSchoolStudentsPDF(school, filteredStudents)}
              disabled={filteredStudents.length === 0}
              title="Cetak rekapitulasi data siswa & hasil pembelajaran (PDF)"
            >
              <FontAwesomeIcon icon={['fas', 'file-pdf']} className="mr-2 text-rose-600" /> Cetak Laporan (PDF)
            </Button>
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <FontAwesomeIcon icon={['fas', 'file-import']} className="mr-2 text-emerald-600" /> Import Excel
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <FontAwesomeIcon icon={['fas', 'file-export']} className="mr-2 text-blue-600" /> Export Excel
            </Button>
            <Button variant="outline" onClick={() => setBatchModalOpen(true)}>
              <FontAwesomeIcon icon={['fas', 'users']} className="mr-2 text-indigo-600" /> Impor Massal
            </Button>
            <Button variant="primary" onClick={() => openModal()}>
              <FontAwesomeIcon icon={['fas', 'user-plus']} className="mr-2 text-white" /> Tambah Siswa
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-3">
          <Input
            placeholder="Cari nama, email, atau NISN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            value={filterClassLevel}
            onChange={e => setFilterClassLevel(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
          >
            <option value="">Semua Tingkat Kelas</option>
            {classLevels.map(lvl => (
              <option key={lvl.id} value={lvl.name}>{lvl.name}</option>
            ))}
          </select>
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
          <Button variant="outline" onClick={loadData}>
            <FontAwesomeIcon icon={['fas', 'rotate-right']} className="mr-1.5 text-slate-600 dark:text-slate-300" /> Refresh Data
          </Button>
        </div>

        {/* Status Group Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          <span className="text-xs font-bold text-slate-500 mr-1">Status Kesiapan & Tindak Lanjut:</span>
          <button
            type="button"
            onClick={() => setStatusGroupFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusGroupFilter === 'all' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            Semua Siswa ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusGroupFilter('perlu_tindak_lanjut')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusGroupFilter === 'perlu_tindak_lanjut' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100'}`}
          >
            🚨 Butuh Pendampingan ({counts.perlu_tindak_lanjut})
          </button>
          <button
            type="button"
            onClick={() => setStatusGroupFilter('butuh_penguatan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusGroupFilter === 'butuh_penguatan' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100'}`}
          >
            ⚠️ Butuh Penguatan ({counts.butuh_penguatan})
          </button>
          <button
            type="button"
            onClick={() => setStatusGroupFilter('mastered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusGroupFilter === 'mastered' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'}`}
          >
            🏆 Rekomendasi Lanjut ({counts.mastered})
          </button>
          <button
            type="button"
            onClick={() => setStatusGroupFilter('kompetitif')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusGroupFilter === 'kompetitif' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100'}`}
          >
            🎯 Kompetitif ({counts.kompetitif})
          </button>
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
                    onChange={handleAvatarFileChange}
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
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tingkat Kelas</label>
                  <select
                    value={formData.class_level}
                    onChange={e => setFormData({ ...formData, class_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
                  >
                    <option value="">Pilih Tingkat Kelas</option>
                    {classLevels.map(lvl => (
                      <option key={lvl.id} value={lvl.name}>{lvl.name}</option>
                    ))}
                    {formData.class_level && !classLevels.some(lvl => lvl.name === formData.class_level) && (
                      <option value={formData.class_level}>{formData.class_level}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">No. WhatsApp</label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="081..." />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tahun Lahir</label>
                  <Input type="number" value={formData.birth_year} onChange={e => setFormData({ ...formData, birth_year: e.target.value })} placeholder="Contoh: 2008" />
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
                <Button type="submit" className="flex-1" disabled={saving || uploadingAvatar}>
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

      {/* Excel Import Modal */}
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
      {reportStudentId && (
        <StudentReportModal
          userId={reportStudentId}
          apiEndpoint={`/school-admin/students/${reportStudentId}/report`}
          onClose={() => setReportStudentId(null)}
        />
      )}
    </AppLayout>
  );
}
