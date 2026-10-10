import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import StatCard from '../../../molecules/StatCard';
import DataTable from '../../../organisms/DataTable/DataTable';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit', 'learning', 'exams'

  // ==========================================
  // TAB 1: AUDIT LOGS STATE
  // ==========================================
  const [logs, setLogs] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchLog, setSearchLog] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Log Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // ==========================================
  // TAB 2: LEARNING REPORTS STATE
  // ==========================================
  const [learningReports, setLearningReports] = useState([]);
  const [learningMetrics, setLearningMetrics] = useState(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [searchLearning, setSearchLearning] = useState('');
  const [statusLearning, setStatusLearning] = useState('');

  // ==========================================
  // TAB 3: EXAM REPORTS STATE
  // ==========================================
  const [examReports, setExamReports] = useState([]);
  const [examMetrics, setExamMetrics] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [searchExam, setSearchExam] = useState('');

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const params = {};
      if (moduleFilter) params.module = moduleFilter;
      if (actionFilter) params.action = actionFilter;
      if (searchLog) params.search = searchLog;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const [logsRes, statsRes] = await Promise.all([
        api.get('/admin/audit-logs', { params }),
        api.get('/admin/audit-logs/stats'),
      ]);

      setLogs(logsRes.data.data || []);
      setAuditStats(statsRes.data);
    } catch {
      toast.error('Gagal memuat log audit');
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch Learning Reports
  const fetchLearningReports = async () => {
    setLearningLoading(true);
    try {
      const params = {};
      if (searchLearning) params.search = searchLearning;
      if (statusLearning) params.status = statusLearning;

      const res = await api.get('/admin/reports/learning', { params });
      setLearningReports(res.data.reports?.data || []);
      setLearningMetrics(res.data.metrics);
    } catch {
      toast.error('Gagal memuat laporan pembelajaran');
    } finally {
      setLearningLoading(false);
    }
  };

  // Fetch Exam Reports
  const fetchExamReports = async () => {
    setExamLoading(true);
    try {
      const params = {};
      if (searchExam) params.search = searchExam;

      const res = await api.get('/admin/reports/exams', { params });
      setExamReports(res.data.reports?.data || []);
      setExamMetrics(res.data.metrics);
    } catch {
      toast.error('Gagal memuat laporan ujian');
    } finally {
      setExamLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'learning') fetchLearningReports();
    if (activeTab === 'exams') fetchExamReports();
  }, [activeTab]);

  // Tab 1 Columns (Audit Logs)
  const auditColumns = useMemo(() => [
    {
      accessorKey: 'created_at',
      header: 'Waktu',
      cell: (info) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {new Date(info.getValue()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div className="text-slate-400 font-mono">
            {new Date(info.getValue()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'user_name',
      header: 'Pengguna',
      cell: (info) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{info.getValue() || 'Sistem'}</div>
          <div className="text-xs">
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {info.row.original.user_role || 'system'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Aksi & Modul',
      cell: (info) => {
        const act = info.getValue();
        const mod = info.row.original.module;
        let color = 'blue';
        if (act.includes('LOGIN')) color = 'emerald';
        if (act.includes('SUBMIT')) color = 'purple';
        if (act.includes('DELETE')) color = 'rose';
        if (act.includes('IMPORT') || act.includes('EXPORT')) color = 'amber';

        return (
          <div className="space-y-1">
            <Badge color={color}>{act}</Badge>
            <div className="text-[11px] text-slate-400 font-mono">modul: {mod}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi Aktivitas',
      cell: (info) => (
        <div className="text-sm text-slate-700 dark:text-slate-300 max-w-md line-clamp-2">
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
      cell: (info) => (
        <span className="font-mono text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          {info.getValue() || '127.0.0.1'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Detail',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(row.original)}>
          Detail
        </Button>
      ),
    },
  ], []);

  // Tab 2 Columns (Learning Reports)
  const learningColumns = useMemo(() => [
    {
      accessorKey: 'user.name',
      header: 'Nama Siswa',
      cell: (info) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{info.getValue() || 'Siswa'}</div>
          <div className="text-xs text-slate-400">{info.row.original.user?.school || 'Umum'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'course.title',
      header: 'Kursus / Modul',
      cell: (info) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">{info.getValue() || 'Kursus'}</div>
          <div className="text-xs text-slate-400">{info.row.original.course?.category || 'Umum'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'progress_percentage',
      header: 'Progres Belajar',
      cell: (info) => {
        const val = info.getValue() || 0;
        return (
          <div className="w-36">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold">{val}%</span>
              <span className="text-slate-400">{val >= 100 ? 'Selesai' : 'Belajar'}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${val >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${Math.min(val, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'updated_at',
      header: 'Aktivitas Terakhir',
      cell: (info) => (
        <div className="text-xs text-slate-500">
          {new Date(info.getValue()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      ),
    },
  ], []);

  // Tab 3 Columns (Exam Reports)
  const examColumns = useMemo(() => [
    {
      accessorKey: 'user.name',
      header: 'Peserta Ujian',
      cell: (info) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{info.getValue() || 'Peserta'}</div>
          <div className="text-xs text-slate-400">{info.row.original.user?.school || 'Umum'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'exam_title',
      header: 'Paket Ujian CBT',
      cell: (info) => (
        <div className="font-semibold text-slate-800 dark:text-slate-200">
          {info.getValue() || info.row.original.exam?.title || 'Ujian CBT'}
        </div>
      ),
    },
    {
      accessorKey: 'score',
      header: 'Perolehan Skor',
      cell: (info) => {
        const score = info.getValue() !== null ? Number(info.getValue()) : 0;
        const passing = Number(info.row.original.exam?.passing_score ?? 70);
        const pass = score >= passing;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-base font-black ${pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {score} pts
            </span>
            <Badge color={pass ? 'emerald' : 'amber'}>{pass ? 'Lulus' : 'Remedial'}</Badge>
            <span className="text-[10px] text-slate-400 font-medium">KKM {passing}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'submitted_at',
      header: 'Waktu Submit',
      cell: (info) => (
        <div className="text-xs text-slate-500">
          {info.getValue() ? new Date(info.getValue()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
        </div>
      ),
    },
  ], []);

  return (
    <AppLayout title="Audit & Laporan Sistem">
      <div className="w-full pb-16 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base shadow-md shadow-blue-500/20">
                <FontAwesomeIcon icon={['fas', 'shield-halved']} />
              </span>
              Audit & Laporan Sistem
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Pantau rekam jejak aktivitas pengguna, evaluasi tren belajar, dan analisis performa ujian sebagai dasar pengambilan keputusan.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'list-check']} />
            Log Aktivitas (Audit)
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'learning'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'graduation-cap']} />
            Laporan Pembelajaran
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'exams'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'file-waveform']} />
            Laporan Ujian CBT
          </button>
        </div>

        {/* TAB 1: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Rekam Audit"
                value={auditStats?.total_logs ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'database']} className="text-blue-500" />}
                color="blue"
              />
              <StatCard
                label="Aktivitas Hari Ini"
                value={auditStats?.today_logs ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'clock']} className="text-emerald-500" />}
                color="emerald"
              />
              <StatCard
                label="Modul Aktif"
                value={auditStats?.module_stats?.length ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'cubes']} className="text-purple-500" />}
                color="purple"
              />
              <StatCard
                label="Pengguna Teraktif"
                value={auditStats?.recent_active_users?.[0]?.user_name ?? '—'}
                icon={<FontAwesomeIcon icon={['fas', 'user-check']} className="text-amber-500" />}
                color="gold"
              />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid sm:grid-cols-2 md:grid-cols-5 gap-3">
              <Input
                placeholder="Cari aksi, pengguna..."
                value={searchLog}
                onChange={e => setSearchLog(e.target.value)}
              />
              <select
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="">Semua Modul</option>
                <option value="auth">Autentikasi (Auth)</option>
                <option value="school">Mitra Sekolah</option>
                <option value="elearning">E-Learning</option>
                <option value="cbt">Ujian CBT</option>
                <option value="system">Sistem</option>
              </select>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                title="Dari tanggal"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                title="Sampai tanggal"
              />
              <Button onClick={fetchAuditLogs}>
                <FontAwesomeIcon icon={['fas', 'filter']} className="mr-1.5" /> Terapkan Filter
              </Button>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <DataTable columns={auditColumns} data={logs} loading={logsLoading} />
            </div>
          </div>
        )}

        {/* TAB 2: LEARNING REPORTS */}
        {activeTab === 'learning' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Siswa Belajar"
                value={learningMetrics?.total_enrollments ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'book-open-reader']} className="text-blue-500" />}
                color="blue"
              />
              <StatCard
                label="Tuntas 100% (Lulus)"
                value={learningMetrics?.completed_enrollments ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'award']} className="text-emerald-500" />}
                color="emerald"
              />
              <StatCard
                label="Rata-rata Progres"
                value={`${learningMetrics?.avg_progress ?? 0}%`}
                icon={<FontAwesomeIcon icon={['fas', 'chart-line']} className="text-purple-500" />}
                color="purple"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Cari siswa, sekolah, kursus..."
                  value={searchLearning}
                  onChange={e => setSearchLearning(e.target.value)}
                />
              </div>
              <select
                value={statusLearning}
                onChange={e => setStatusLearning(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="ongoing">Sedang Belajar (&lt;100%)</option>
                <option value="completed">Selesai (100%)</option>
              </select>
              <Button onClick={fetchLearningReports}>
                <FontAwesomeIcon icon={['fas', 'magnifying-glass']} className="mr-1.5" /> Cari
              </Button>
            </div>

            {/* Learning Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <DataTable columns={learningColumns} data={learningReports} loading={learningLoading} />
            </div>
          </div>
        )}

        {/* TAB 3: EXAM REPORTS */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Sesi Ujian Disubmit"
                value={examMetrics?.total_sessions ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'file-signature']} className="text-blue-500" />}
                color="blue"
              />
              <StatCard
                label="Rata-rata Nilai CBT"
                value={`${examMetrics?.avg_score ?? 0} pts`}
                icon={<FontAwesomeIcon icon={['fas', 'gauge-high']} className="text-amber-500" />}
                color="gold"
              />
              <StatCard
                label="Skor Tertinggi"
                value={`${examMetrics?.highest_score ?? 0} pts`}
                icon={<FontAwesomeIcon icon={['fas', 'trophy']} className="text-emerald-500" />}
                color="emerald"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Cari peserta, paket ujian, sekolah..."
                  value={searchExam}
                  onChange={e => setSearchExam(e.target.value)}
                />
              </div>
              <Button onClick={fetchExamReports}>
                <FontAwesomeIcon icon={['fas', 'magnifying-glass']} className="mr-1.5" /> Cari
              </Button>
            </div>

            {/* Exam Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <DataTable columns={examColumns} data={examReports} loading={examLoading} />
            </div>
          </div>
        )}

        {/* Selected Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'circle-info']} className="text-blue-500" />
                  Rincian Log Audit #{selectedLog.id}
                </h3>
                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Pengguna:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedLog.user_name} ({selectedLog.user_role})
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Aksi & Modul:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedLog.action} &bull; {selectedLog.module}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Deskripsi:</span>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedLog.description}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">IP Address:</span>
                    <span className="font-mono">{selectedLog.ip_address || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Waktu:</span>
                    <span>{new Date(selectedLog.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Metadata Tambahan:</span>
                    <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mt-5 flex justify-end">
                <Button onClick={() => setSelectedLog(null)}>Tutup</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
