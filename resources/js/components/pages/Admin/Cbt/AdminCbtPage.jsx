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
      </div>
    </AppLayout>
  );
}
