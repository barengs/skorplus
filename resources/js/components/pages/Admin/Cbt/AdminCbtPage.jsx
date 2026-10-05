import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import DataTable from '../../../organisms/DataTable/DataTable';
import api from '../../../../services/api';
import { fetchAdminExams, createAdminExam, updateAdminExam, deleteAdminExam } from '../../../../features/admin/adminCbtSlice';
import { toast } from 'react-toastify';

const formatDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

export default function AdminCbtPage() {
  const dispatch = useDispatch();
  const { exams, loading } = useSelector((state) => state.adminCbt);

  const [activeTab, setActiveTab] = useState('exams'); // 'exams' | 'types'

  // Exams state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    exam_type_id: '',
    description: '',
    duration_minutes: 120,
    is_active: true,
    schedule_type: 'always',
    start_time: '',
    end_time: '',
    start_hour: '',
    end_hour: '',
    scheduled_days: [],
    interval_hours: 2,
  });
  const [editingId, setEditingId] = useState(null);

  // Exam Types state
  const [examTypes, setExamTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: '📝',
    duration_minutes: 60,
    total_questions: 20,
    is_active: true,
  });

  // Detail Soal & Siswa Aktif (Merged Fullscreen Modal)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailExam, setDetailExam] = useState(null);
  const [detailTab, setDetailTab] = useState('questions'); // 'questions' | 'active_students'
  const [detailQuestions, setDetailQuestions] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeRefreshInterval, setActiveRefreshInterval] = useState(null);

  const fetchExamTypes = async () => {
    try {
      setTypesLoading(true);
      const res = await api.get('/admin/cbt/exam-types');
      setExamTypes(res.data || []);
    } catch (err) {
      toast.error('Gagal memuat tipe ujian');
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAdminExams());
    fetchExamTypes();
  }, [dispatch]);

  const columns = React.useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Judul Paket',
      cell: (info) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</span>
          {info.row.original.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm mt-0.5" title={info.row.original.description}>
              {info.row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'duration_minutes',
      header: 'Durasi',
      cell: (info) => <span className="text-slate-500">{info.getValue()} menit</span>,
    },
    {
      accessorKey: 'questions_count',
      header: 'Jumlah Soal',
      cell: (info) => <span className="text-slate-500">{info.getValue() || 0} soal</span>,
    },
    {
      header: 'Jadwal Penyelenggaraan',
      cell: ({ row }) => {
        const exam = row.original;
        const type = exam.schedule_type || 'always';
        const status = exam.schedule_status || 'always';

        if (type === 'always') {
          return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Setiap Saat (Bebas)</span>
            </div>
          );
        }

        const badgeMap = {
          upcoming: { color: 'amber', label: 'Belum Dibuka' },
          ongoing: { color: 'emerald', label: 'Sedang Berlangsung' },
          expired: { color: 'rose', label: 'Telah Berakhir' },
        };

        const badge = badgeMap[status] || { color: 'slate', label: status };

        return (
          <div className="space-y-1 max-w-xs">
            <div className="flex items-center gap-2">
              <Badge color={badge.color}>{badge.label}</Badge>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {type === 'once' ? 'Sekali' : type === 'daily' ? 'Harian' : type === 'weekly' ? 'Mingguan' : 'Interval'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {exam.schedule_description || '-'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: (info) => (
        <Badge color={info.getValue() ? 'emerald' : 'slate'}>
          {info.getValue() ? 'Aktif' : 'Draft'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const exam = row.original;
        return (
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800 hover:bg-purple-50" onClick={() => openDetailModal(exam)}>
              Detail Soal
            </Button>
            <Link to={`/admin/cbt/${exam.id}/questions`}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">Kelola Soal</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => openModal(exam)}>Edit</Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(exam.id)}>Hapus</Button>
          </div>
        );
      },
    }
  ], []);

  const openModal = (exam = null) => {
    if (exam) {
      setFormData({
        title: exam.title,
        exam_type_id: exam.exam_type_id || '',
        description: exam.description || '',
        duration_minutes: exam.duration_minutes,
        is_active: exam.is_active,
        schedule_type: exam.schedule_type || 'always',
        start_time: formatDateTimeLocal(exam.start_time),
        end_time: formatDateTimeLocal(exam.end_time),
        start_hour: exam.start_hour || '',
        end_hour: exam.end_hour || '',
        scheduled_days: Array.isArray(exam.scheduled_days) ? exam.scheduled_days : [],
        interval_hours: exam.interval_hours || 2,
      });
      setEditingId(exam.id);
    } else {
      setFormData({
        title: '',
        exam_type_id: '',
        description: '',
        duration_minutes: 120,
        is_active: true,
        schedule_type: 'always',
        start_time: '',
        end_time: '',
        start_hour: '',
        end_hour: '',
        scheduled_days: [],
        interval_hours: 2,
      });
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let payload = { ...formData };

      if (payload.schedule_type === 'always') {
        payload.start_time = null;
        payload.end_time = null;
        payload.start_hour = null;
        payload.end_hour = null;
        payload.scheduled_days = null;
        payload.interval_hours = null;
      } else if (payload.schedule_type === 'once') {
        payload.start_hour = null;
        payload.end_hour = null;
        payload.scheduled_days = null;
        payload.interval_hours = null;
      } else {
        payload.start_time = null;
        payload.end_time = null;
        if (payload.schedule_type !== 'weekly') {
          payload.scheduled_days = null;
        }
        if (payload.schedule_type !== 'interval') {
          payload.interval_hours = null;
        }
      }

      if (editingId) {
        await dispatch(updateAdminExam({ id: editingId, data: payload })).unwrap();
        toast.success('Paket ujian berhasil diperbarui!');
      } else {
        await dispatch(createAdminExam(payload)).unwrap();
        toast.success('Paket ujian berhasil ditambahkan!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err || 'Gagal menyimpan paket ujian');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus paket ujian ini?')) {
      try {
        await dispatch(deleteAdminExam(id)).unwrap();
        toast.success('Paket ujian berhasil dihapus!');
      } catch (err) {
        toast.error(err?.message || 'Gagal menghapus paket ujian');
      }
    }
  };

  // Detail Soal & Monitoring Handlers (Combined)
  const fetchActiveSessions = async (examId) => {
    try {
      const res = await api.get(`/admin/cbt/exams/${examId}/active-sessions`);
      setActiveSessions(res.data.active_sessions || []);
    } catch (err) {
      // silent fail on poll
    }
  };

  const openDetailModal = async (exam, initialTab = 'questions') => {
    setDetailExam(exam);
    setDetailTab(initialTab);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setActiveLoading(true);

    try {
      const resExam = await api.get(`/admin/cbt/exams/${exam.id}`);
      setDetailQuestions(resExam.data.questions || []);
    } catch (err) {
      toast.error('Gagal memuat detail soal');
      setDetailQuestions([]);
    } finally {
      setDetailLoading(false);
    }

    try {
      const resActive = await api.get(`/admin/cbt/exams/${exam.id}/active-sessions`);
      setActiveSessions(resActive.data.active_sessions || []);
    } catch (err) {
      setActiveSessions([]);
    } finally {
      setActiveLoading(false);
    }

    // Auto-refresh data siswa aktif setiap 10 detik selama modal terbuka
    const interval = setInterval(() => {
      fetchActiveSessions(exam.id);
    }, 10000);
    setActiveRefreshInterval(interval);
  };

  const closeDetailModal = () => {
    if (activeRefreshInterval) {
      clearInterval(activeRefreshInterval);
      setActiveRefreshInterval(null);
    }
    setDetailModalOpen(false);
    setDetailExam(null);
    setDetailQuestions([]);
    setActiveSessions([]);
  };

  // Exam Types Handlers
  const openTypeModal = (type = null) => {
    if (type) {
      setTypeFormData({
        name: type.name || '',
        code: type.code || '',
        description: type.description || '',
        icon: type.icon || '📝',
        duration_minutes: Math.round((type.duration_seconds || 3600) / 60),
        total_questions: type.total_questions || 20,
        is_active: type.is_active ?? true,
      });
      setEditingTypeId(type.id);
    } else {
      setTypeFormData({
        name: '',
        code: '',
        description: '',
        icon: '📝',
        duration_minutes: 60,
        total_questions: 20,
        is_active: true,
      });
      setEditingTypeId(null);
    }
    setTypeModalOpen(true);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: typeFormData.name,
        code: typeFormData.code || undefined,
        description: typeFormData.description,
        icon: typeFormData.icon,
        duration_seconds: typeFormData.duration_minutes * 60,
        total_questions: typeFormData.total_questions,
        is_active: typeFormData.is_active,
      };

      if (editingTypeId) {
        await api.put(`/admin/cbt/exam-types/${editingTypeId}`, payload);
        toast.success('Tipe ujian berhasil diperbarui!');
      } else {
        await api.post('/admin/cbt/exam-types', payload);
        toast.success('Tipe ujian baru berhasil ditambahkan!');
      }
      setTypeModalOpen(false);
      fetchExamTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tipe ujian');
    }
  };

  const handleDeleteType = async (id) => {
    if (confirm('Yakin ingin menghapus tipe ujian ini?')) {
      try {
        await api.delete(`/admin/cbt/exam-types/${id}`);
        toast.success('Tipe ujian berhasil dihapus!');
        fetchExamTypes();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal menghapus tipe ujian');
      }
    }
  };

  return (
    <AppLayout title="Kelola Ujian & Soal (CBT)">
      <div className="w-full pb-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Manajemen CBT</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Kelola paket tryout, bank soal, dan tipe/subtes ujian secara dinamis.</p>
          </div>
          {activeTab === 'exams' ? (
            <Button onClick={() => openModal()}>+ Tambah Paket Ujian</Button>
          ) : (
            <Button onClick={() => openTypeModal()}>+ Tambah Tipe Ujian</Button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'exams'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📋 Paket Ujian ({exams?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'types'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🧩 Tipe / Subtes Ujian ({examTypes?.length || 0})
          </button>
        </div>

        {/* Tab 1: Paket Ujian */}
        {activeTab === 'exams' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4">
              <DataTable 
                columns={columns} 
                data={exams} 
                loading={loading} 
                onSearch={true} 
              />
            </div>
          </div>
        )}

        {/* Tab 2: Tipe Ujian */}
        {activeTab === 'types' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 overflow-x-auto">
              {typesLoading ? (
                <div className="py-12 text-center text-slate-500 text-sm">Memuat tipe ujian...</div>
              ) : examTypes.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">Belum ada tipe ujian yang ditambahkan.</div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Ikon</th>
                      <th className="px-4 py-3">Kode</th>
                      <th className="px-4 py-3">Nama Tipe Ujian</th>
                      <th className="px-4 py-3">Durasi</th>
                      <th className="px-4 py-3">Jumlah Soal</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {examTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-xl">{type.icon || '📝'}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-xs text-slate-500 dark:text-slate-400">{type.code}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{type.name}</td>
                        <td className="px-4 py-3">{Math.round((type.duration_seconds || 3600) / 60)} menit</td>
                        <td className="px-4 py-3">{type.total_questions || 20} soal</td>
                        <td className="px-4 py-3">
                          <Badge color={type.is_active ? 'emerald' : 'slate'}>
                            {type.is_active ? 'Aktif' : 'Non-aktif'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => openTypeModal(type)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteType(type.id)}>Hapus</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Modal Paket Ujian */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg p-6 sm:p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">{editingId ? 'Edit Paket Ujian' : 'Tambah Paket Ujian Baru'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <FormField label="Judul Paket" required>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="Contoh: Tryout TPS - SNBT 2026" 
                    required 
                  />
                </FormField>
                <FormField label="Kategori / Tipe Ujian Induk (Opsional)">
                  <select
                    value={formData.exam_type_id || ''}
                    onChange={e => setFormData({...formData, exam_type_id: e.target.value ? parseInt(e.target.value) : ''})}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Paket Campuran / Multidisiplin (Semua Subtes) --</option>
                    {examTypes?.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon || '📝'} {type.name} ({type.code || type.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hubungkan paket ini ke master tipe ujian tertentu, atau biarkan campuran jika paket terdiri dari berbagai subtes soal.
                  </p>
                </FormField>
                <FormField label="Deskripsi / Panduan Pengerjaan">
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
                    placeholder="Tuliskan petunjuk pengerjaan, tata tertib ujian, atau deskripsi subtes paket ini..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </FormField>
                <FormField label="Durasi (menit)" required>
                  <Input 
                    type="number" 
                    min="1" 
                    value={formData.duration_minutes} 
                    onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 60})} 
                    required 
                  />
                </FormField>
                <FormField label="Status">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-blue-600" />
                    <span>Aktif (Ditampilkan kepada Siswa)</span>
                  </label>
                </FormField>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                  <FormField label="Pengaturan Waktu & Penyelenggaraan">
                    <select
                      value={formData.schedule_type}
                      onChange={e => setFormData({ ...formData, schedule_type: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="always">🟢 Bebas / Tersedia Setiap Saat (Kapan Saja)</option>
                      <option value="once">📅 Sekali Saja (Rentang Tanggal & Jam Tertentu)</option>
                      <option value="daily">🔄 Berulang Harian (Jam Tertentu Tiap Hari)</option>
                      <option value="weekly">📆 Berulang Mingguan (Hari & Jam Tertentu)</option>
                      <option value="interval">⏱️ Berulang Interval (Misal: Tiap 2 Jam Sekali)</option>
                    </select>
                  </FormField>

                  {/* Keterangan & Form Dinamis berdasarkan schedule_type */}
                  {formData.schedule_type === 'always' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                      ℹ️ Ujian dapat diakses oleh siswa kapan saja tanpa batasan tanggal maupun jam pelaksanaan.
                    </p>
                  )}

                  {formData.schedule_type === 'once' && (
                    <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                      <FormField label="Waktu Buka Ujian" required>
                        <Input
                          type="datetime-local"
                          value={formData.start_time}
                          onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="Waktu Tutup Ujian" required>
                        <Input
                          type="datetime-local"
                          value={formData.end_time}
                          onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                          required
                        />
                      </FormField>
                    </div>
                  )}

                  {(formData.schedule_type === 'daily' || formData.schedule_type === 'weekly' || formData.schedule_type === 'interval') && (
                    <div className="space-y-4 animate-fadeIn">
                      {formData.schedule_type === 'weekly' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Pilih Hari Penyelenggaraan:
                          </label>
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                            {[
                              { id: 1, label: 'Sen' },
                              { id: 2, label: 'Sel' },
                              { id: 3, label: 'Rab' },
                              { id: 4, label: 'Kam' },
                              { id: 5, label: 'Jum' },
                              { id: 6, label: 'Sab' },
                              { id: 7, label: 'Min' },
                            ].map(day => {
                              const isChecked = (formData.scheduled_days || []).includes(day.id);
                              return (
                                <button
                                  type="button"
                                  key={day.id}
                                  onClick={() => {
                                    const current = formData.scheduled_days || [];
                                    const next = isChecked
                                      ? current.filter(d => d !== day.id)
                                      : [...current, day.id].sort((a, b) => a - b);
                                    setFormData({ ...formData, scheduled_days: next });
                                  }}
                                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                                  }`}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {formData.schedule_type === 'interval' && (
                        <FormField label="Interval Pengerjaan (Setiap Berapa Jam?)" required>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="24"
                              value={formData.interval_hours}
                              onChange={e => setFormData({ ...formData, interval_hours: parseInt(e.target.value) || 1 })}
                              className="w-28"
                              required
                            />
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Jam Sekali</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Contoh: Jika diatur 2 jam dengan jam mulai 08:00, ujian dapat dimulai pada 08:00, 10:00, 12:00, dst.
                          </p>
                        </FormField>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Mulai Pukul (WIB)">
                          <Input
                            type="time"
                            value={formData.start_hour}
                            onChange={e => setFormData({ ...formData, start_hour: e.target.value })}
                            placeholder="08:00"
                          />
                        </FormField>
                        <FormField label="Berakhir Pukul (WIB)">
                          <Input
                            type="time"
                            value={formData.end_hour}
                            onChange={e => setFormData({ ...formData, end_hour: e.target.value })}
                            placeholder="17:00"
                          />
                        </FormField>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Kosongkan jam jika berlaku 24 jam penuh pada hari yang ditentukan.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Tipe Ujian (Dynamic) */}
        {typeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{editingTypeId ? 'Edit Tipe Ujian' : 'Tambah Tipe Ujian Baru'}</h3>
              <form onSubmit={handleSaveType} className="space-y-4">
                <FormField label="Nama Tipe Ujian" required>
                  <Input 
                    placeholder="Contoh: Literasi Bahasa Indonesia"
                    value={typeFormData.name} 
                    onChange={e => setTypeFormData({...typeFormData, name: e.target.value})} 
                    required 
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Kode Unik (Opsional)">
                    <Input 
                      placeholder="Contoh: lit-indo"
                      value={typeFormData.code} 
                      onChange={e => setTypeFormData({...typeFormData, code: e.target.value})} 
                    />
                  </FormField>
                  <FormField label="Ikon / Emoji">
                    <Input 
                      placeholder="🧠, 📚, 💡, dll."
                      value={typeFormData.icon} 
                      onChange={e => setTypeFormData({...typeFormData, icon: e.target.value})} 
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Durasi Pengerjaan (menit)" required>
                    <Input 
                      type="number" 
                      min="1" 
                      max="1440"
                      value={typeFormData.duration_minutes} 
                      onChange={e => setTypeFormData({...typeFormData, duration_minutes: parseInt(e.target.value) || 60})} 
                      required 
                    />
                  </FormField>
                  <FormField label="Jumlah Soal Latihan" required>
                    <Input 
                      type="number" 
                      min="1" 
                      max="200"
                      value={typeFormData.total_questions} 
                      onChange={e => setTypeFormData({...typeFormData, total_questions: parseInt(e.target.value) || 20})} 
                      required 
                    />
                  </FormField>
                </div>

                <FormField label="Deskripsi">
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Deskripsi singkat mengenai jenis tes ini..."
                    value={typeFormData.description}
                    onChange={e => setTypeFormData({...typeFormData, description: e.target.value})}
                  />
                </FormField>

                <FormField label="Status">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input 
                      type="checkbox" 
                      checked={typeFormData.is_active} 
                      onChange={e => setTypeFormData({...typeFormData, is_active: e.target.checked})} 
                      className="rounded text-blue-600" 
                    />
                    <span>Aktif (Dapat dipilih oleh siswa)</span>
                  </label>
                </FormField>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setTypeModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan Tipe Ujian</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detail Soal & Siswa Aktif (FULLSCREEN DENGAN TAB) */}
        {detailModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden animate-fadeIn">
            {/* Topbar Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
              <div className="flex items-center gap-4 min-w-0">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Kembali / Tutup"
                >
                  <span className="text-xl font-bold">←</span>
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                      {detailExam?.title}
                    </h2>
                    {detailExam?.exam_type && (
                      <Badge color="blue" className="text-xs">
                        {detailExam.exam_type.icon} {detailExam.exam_type.name}
                      </Badge>
                    )}
                    <Badge color={detailExam?.is_active ? 'emerald' : 'slate'} className="text-xs">
                      {detailExam?.is_active ? 'Aktif' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ⏱ Durasi: {detailExam?.duration_minutes} menit • 📝 {detailQuestions.length} Soal • {detailExam?.schedule_description || 'Tersedia Bebas'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link to={`/admin/cbt/${detailExam?.id}/questions`}>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                    ✏️ Kelola Soal Ujian
                  </Button>
                </Link>
                <Button size="sm" onClick={closeDetailModal}>
                  ✕ Tutup
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDetailTab('questions')}
                className={`py-3.5 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  detailTab === 'questions'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>📝 Daftar Soal</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  detailTab === 'questions'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {detailQuestions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('active_students')}
                className={`py-3.5 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  detailTab === 'active_students'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>👥 Siswa Sedang Mengerjakan</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  activeSessions.length > 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {activeSessions.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  {activeSessions.length}
                </span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="max-w-6xl mx-auto">
                {/* TAB 1: DAFTAR SOAL */}
                {detailTab === 'questions' && (
                  <div>
                    {detailLoading ? (
                      <div className="py-24 text-center text-slate-500">
                        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm font-medium">Memuat bank soal ujian...</p>
                      </div>
                    ) : detailQuestions.length === 0 ? (
                      <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12">
                        <span className="text-5xl mb-4 block">📝</span>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Belum Ada Soal</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                          Paket ujian ini belum memiliki soal. Tambahkan soal secara manual atau import dari template Excel.
                        </p>
                        <Link to={`/admin/cbt/${detailExam?.id}/questions`}>
                          <Button>+ Kelola & Tambah Soal</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                          <span>Menampilkan seluruh {detailQuestions.length} butir soal</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            ✓ Kunci jawaban ditandai warna hijau
                          </span>
                        </div>

                        {detailQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-start gap-4">
                              <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-sm">
                                {idx + 1}
                              </span>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  {q.exam_type && (
                                    <Badge color="blue" className="text-xs font-semibold">
                                      {q.exam_type.name}
                                    </Badge>
                                  )}
                                  {q.subtest && (
                                    <Badge color="slate" className="text-xs">
                                      🧩 {q.subtest}
                                    </Badge>
                                  )}
                                  <Badge color={q.is_active ? 'emerald' : 'slate'} className="text-xs">
                                    {q.is_active ? 'Aktif' : 'Non-aktif'}
                                  </Badge>
                                  <span className="text-xs text-slate-400 font-mono ml-auto">
                                    ⏱ {q.duration_seconds || 90} detik • {q.points || 1} poin
                                  </span>
                                </div>

                                <div
                                  className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed prose dark:prose-invert max-w-none mb-4"
                                  dangerouslySetInnerHTML={{ __html: q.question_text }}
                                />

                                {/* Opsi Jawaban */}
                                {q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    {q.options.map((opt) => (
                                      <div
                                        key={opt.id}
                                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition-colors ${
                                          opt.is_correct
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                          opt.is_correct
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}>
                                          {opt.option_label}
                                        </span>
                                        <span className="flex-1 min-w-0 leading-snug">{opt.option_text}</span>
                                        {opt.is_correct && (
                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">✓ Kunci</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SISWA AKTIF MENGERJAKAN */}
                {detailTab === 'active_students' && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          Monitoring Siswa Sedang Mengerjakan
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Data otomatis diperbarui setiap 10 detik saat tab ini aktif.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchActiveSessions(detailExam?.id)}
                        className="text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                      >
                        🔄 Refresh Sekarang
                      </Button>
                    </div>

                    {activeLoading ? (
                      <div className="py-24 text-center text-slate-500">
                        <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm font-medium">Memeriksa siswa aktif...</p>
                      </div>
                    ) : activeSessions.length === 0 ? (
                      <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12">
                        <span className="text-5xl mb-4 block">🧘</span>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Tidak Ada Siswa Sedang Mengerjakan
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Saat ini belum ada siswa yang sedang aktif dalam sesi pengerjaan ujian ini.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeSessions.map((session) => (
                          <div
                            key={session.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs shrink-0">
                                    {session.user_name?.charAt(0)?.toUpperCase() || '?'}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                                      {session.user_name}
                                    </h5>
                                    <p className="text-xs text-slate-500 truncate">{session.user_email}</p>
                                  </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  Aktif
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <span className="text-slate-600 dark:text-slate-400">Progres Pengerjaan</span>
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {session.answered_count} / {session.total_questions} Soal ({session.progress_percent}%)
                                  </span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${session.progress_percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span>
                                🕒 Mulai: {session.started_at ? new Date(session.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB
                              </span>
                              <span>
                                ⏱ Berjalan: {Math.floor(session.elapsed_seconds / 60)}m {session.elapsed_seconds % 60}s
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

