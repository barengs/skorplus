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
import { exportToCsv } from '../../../../utils/exportCsv';
import StudentReportModal from './StudentReportModal';

export default function AdminReportPage() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'schools', 'cbt', 'elearning', 'logs'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // States for sub-tables in "Riwayat & Detail (Logs)" tab
  const [learningReports, setLearningReports] = useState([]);
  const [learningMetrics, setLearningMetrics] = useState(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [searchLearning, setSearchLearning] = useState('');
  const [statusLearning, setStatusLearning] = useState('');

  const [examReports, setExamReports] = useState([]);
  const [examMetrics, setExamMetrics] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [searchExam, setSearchExam] = useState('');
  const [schoolExamFilter, setSchoolExamFilter] = useState('');
  const [schoolsList, setSchoolsList] = useState([]);

  // Modal Rapor Siswa (per individu)
  const [reportStudentId, setReportStudentId] = useState(null);

  // Fetch Dashboard aggregate stats
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/dashboard');
      setDashboardData(res.data);
      if (res.data.schools_stats?.schools_list) {
        setSchoolsList(res.data.schools_stats.schools_list.map(s => s.name));
      }
    } catch {
      toast.error('Gagal memuat dashboard analitik statistik.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tabular Learning Reports
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
      toast.error('Gagal memuat detail laporan pembelajaran');
    } finally {
      setLearningLoading(false);
    }
  };

  // Fetch tabular Exam Reports
  const fetchExamReports = async (overrideParams = {}) => {
    setExamLoading(true);
    try {
      const params = {};
      const search = overrideParams.search !== undefined ? overrideParams.search : searchExam;
      const school = overrideParams.school !== undefined ? overrideParams.school : schoolExamFilter;

      if (search) params.search = search;
      if (school) params.school = school;

      const res = await api.get('/admin/reports/exams', { params });
      setExamReports(res.data.reports?.data || []);
      setExamMetrics(res.data.metrics);
    } catch {
      toast.error('Gagal memuat detail riwayat ujian');
    } finally {
      setExamLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLearningReports();
      fetchExamReports();
    }
  }, [activeTab]);

  // Tabular Columns definition for Logs
  const learningColumns = useMemo(() => [
    {
      accessorKey: 'user.name',
      header: 'Nama Siswa',
      cell: (info) => (
        <button
          type="button"
          onClick={() => info.row.original.user?.id && setReportStudentId(info.row.original.user.id)}
          className="text-left group cursor-pointer"
          title="Lihat Rapor Siswa"
        >
          <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline">{info.getValue() || 'Siswa'} 📋</div>
          <div className="text-xs text-slate-400">{info.row.original.user?.school || 'Umum'}</div>
        </button>
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

  const examColumns = useMemo(() => [
    {
      accessorKey: 'user.name',
      header: 'Peserta Ujian',
      cell: (info) => (
        <button
          type="button"
          onClick={() => info.row.original.user?.id && setReportStudentId(info.row.original.user.id)}
          className="text-left group cursor-pointer"
          title="Lihat Rapor Siswa"
        >
          <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline">{info.getValue() || 'Peserta'} 📋</div>
          <div className="text-xs text-slate-400">{info.row.original.user?.school || 'Umum'}</div>
        </button>
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

  // Dashboard Data Extractor
  const summary = dashboardData?.summary || {};
  const schoolsData = dashboardData?.schools_stats || {};
  const cbtData = dashboardData?.cbt_stats || {};
  const materialsData = dashboardData?.materials_stats || {};

  return (
    <AppLayout title="Laporan & Analitik">
      <div className="w-full pb-16 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center text-base shadow-md shadow-purple-500/20">
                <FontAwesomeIcon icon={['fas', 'chart-pie']} />
              </span>
              Laporan Analitik Komprehensif
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Metrik tingkat lanjut untuk evaluasi sekolah, analisis efektivitas CBT, dan statistik penyelesaian E-Learning siswa.
            </p>
          </div>
          <div className="flex gap-2 no-print">
             <Button variant="outline" onClick={() => window.print()} title="Cetak laporan (PDF)">
                <FontAwesomeIcon icon={['fas', 'print']} className="mr-2" /> Cetak
             </Button>
             <Button variant="outline" onClick={() => fetchDashboardStats()} disabled={loading}>
                <FontAwesomeIcon icon={['fas', 'rotate-right']} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Segarkan Data
             </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'border-all']} /> Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('schools')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'schools'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'school']} /> Analitik Sekolah
          </button>
          <button
            onClick={() => setActiveTab('cbt')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'cbt'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'file-signature']} /> Analitik Ujian CBT
          </button>
          <button
            onClick={() => setActiveTab('elearning')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'elearning'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'book-open-reader']} /> Analitik Materi
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-slate-800 text-slate-800 dark:border-slate-300 dark:text-slate-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'table-list']} /> Riwayat & Detail (Logs)
          </button>
        </div>

        {/* LOADING STATE */}
        {loading && activeTab !== 'logs' ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
             <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
             <p className="font-semibold">Menganalisis data laporan statistik...</p>
          </div>
        ) : (
          <>
            {/* TAB: DASHBOARD RINGKASAN */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in-up">
                 {/* Top KPI row */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Mitra Sekolah" value={summary.total_schools ?? 0} icon={<FontAwesomeIcon icon={['fas', 'school']} />} color="blue" />
                    <StatCard label="Total Siswa (Sekolah)" value={summary.total_students_partner ?? 0} icon={<FontAwesomeIcon icon={['fas', 'user-graduate']} />} color="blue" />
                    <StatCard label="Penyelesaian CBT" value={summary.total_cbt_sessions ?? 0} icon={<FontAwesomeIcon icon={['fas', 'check-double']} />} color="amber" />
                    <StatCard label="Progres Belajar Avg." value={`${summary.avg_course_progress ?? 0}%`} icon={<FontAwesomeIcon icon={['fas', 'chart-line']} />} color="emerald" />
                 </div>

                 {/* Dua kolom untuk widget summary sekolah top vs cbt top */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Sekolah Performance */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">
                               🏆 Sekolah dengan Kinerja Terbaik
                            </h3>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded font-semibold uppercase tracking-wider">
                               Berdasarkan Nilai CBT
                            </span>
                        </div>
                        <div className="space-y-3">
                           {schoolsData.top_by_performance && schoolsData.top_by_performance.length > 0 ? (
                               schoolsData.top_by_performance.map((school, i) => (
                                   <div key={school.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                       <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center shrink-0">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{school.name}</div>
                                                <div className="text-xs text-slate-500">{school.students_count} Siswa Terdaftar</div>
                                            </div>
                                       </div>
                                       <div className="text-right">
                                            <div className="font-black text-emerald-600 dark:text-emerald-400 text-base">{school.avg_cbt_score}</div>
                                            <div className="text-[10px] text-slate-400">Rata-rata Skor CBT</div>
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="text-center py-6 text-sm text-slate-400">Belum ada data pengerjaan CBT dari sekolah</div>
                           )}
                        </div>
                    </div>

                    {/* Top Package Ujian Paling Menantang (Lowest Score Exam) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">
                               🔥 Analisis Tantangan CBT
                            </h3>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded font-semibold uppercase tracking-wider">
                               Berdasarkan Skor Rata-rata
                            </span>
                        </div>
                        <div className="space-y-3">
                           {cbtData.exams_ranking && cbtData.exams_ranking.length > 0 ? (
                               cbtData.exams_ranking.slice(0, 5).sort((a,b) => a.avg_score - b.avg_score).map((exam) => (
                                   <div key={exam.id} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 gap-2">
                                       <div className="flex justify-between items-start">
                                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{exam.title}</div>
                                            <div className="text-right shrink-0">
                                                <Badge color={exam.difficulty_color}>{exam.difficulty_label}</Badge>
                                            </div>
                                       </div>
                                       <div className="flex justify-between items-end">
                                            <div className="text-xs text-slate-500">
                                                Dikerjakan oleh {exam.participants_count} Siswa • KKM: {exam.passing_score}
                                            </div>
                                            <div className="text-right font-black text-slate-700 dark:text-slate-300">
                                                Avg: {exam.avg_score} pts
                                            </div>
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="text-center py-6 text-sm text-slate-400">Belum ada data evaluasi CBT</div>
                           )}
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {/* TAB: STATISTIK SEKOLAH */}
            {activeTab === 'schools' && (
              <div className="space-y-6 animate-fade-in-up">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2 opacity-90">
                            <FontAwesomeIcon icon={['fas', 'school']} className="text-2xl" />
                            <h4 className="font-bold">Total Mitra Sekolah</h4>
                        </div>
                        <div className="text-4xl font-black">{schoolsData.total_schools}</div>
                        <div className="text-sm opacity-80 mt-1">{schoolsData.active_schools} Sekolah Aktif</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                        <div className="text-slate-500 font-semibold mb-1">Total Siswa Sekolah</div>
                        <div className="text-4xl font-black text-slate-900 dark:text-slate-100">{schoolsData.total_students_partner}</div>
                        <div className="text-sm text-slate-400 mt-1">Siswa terdaftar via mitra</div>
                    </div>
                 </div>

                 {/* Tabel Breakdown Tiap Sekolah */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs overflow-x-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                       <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Analisis Komprehensif per Sekolah</h3>
                       <Button
                          variant="outline"
                          size="sm"
                          className="no-print self-start"
                          onClick={() => {
                             const cols = [
                                { key: 'name', label: 'Nama Sekolah' },
                                { key: 'npsn', label: 'NPSN' },
                                { key: 'package_name', label: 'Paket Belajar' },
                                { key: 'students_count', label: 'Jumlah Siswa' },
                                { key: 'avg_cbt_score', label: 'Rata-rata Skor CBT' },
                                { key: 'cbt_pass_rate', label: 'Tingkat Kelulusan CBT (%)' },
                                { key: 'avg_progress', label: 'Rata-rata Progres Belajar (%)' },
                             ];
                             exportToCsv(schoolsData.schools_list || [], cols, 'laporan-kinerja-sekolah');
                          }}
                       >
                          <FontAwesomeIcon icon={['fas', 'file-arrow-down']} className="mr-1.5" /> Ekspor CSV Sekolah
                       </Button>
                    </div>
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                                <th className="p-3 text-sm font-bold text-slate-600 dark:text-slate-300">Mitra Sekolah</th>
                                <th className="p-3 text-sm font-bold text-slate-600 dark:text-slate-300">Jml Siswa</th>
                                <th className="p-3 text-sm font-bold text-slate-600 dark:text-slate-300 text-center bg-blue-50/50 dark:bg-blue-900/10">Avg. Skor CBT</th>
                                <th className="p-3 text-sm font-bold text-slate-600 dark:text-slate-300 text-center bg-blue-50/50 dark:bg-blue-900/10">Lulus CBT (%)</th>
                                <th className="p-3 text-sm font-bold text-slate-600 dark:text-slate-300 text-center bg-emerald-50/50 dark:bg-emerald-900/10">Avg. Progres Belajar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schoolsData.schools_list?.length > 0 ? (
                                schoolsData.schools_list.map(school => (
                                    <tr key={school.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-3">
                                            <div className="font-bold text-slate-900 dark:text-slate-100">{school.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">Paket: {school.package_name}</div>
                                        </td>
                                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                                            {school.students_count} <FontAwesomeIcon icon={['fas', 'user']} className="text-slate-400 text-xs ml-1" />
                                        </td>
                                        <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-900/5">
                                            <div className="font-black text-blue-600 dark:text-blue-400">{school.avg_cbt_score} pts</div>
                                            <div className="text-[10px] text-slate-400">{school.cbt_sessions_count} sesi</div>
                                        </td>
                                        <td className="p-3 text-center bg-blue-50/30 dark:bg-blue-900/5">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${school.cbt_pass_rate >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'}`}>
                                                {school.cbt_pass_rate}%
                                            </span>
                                        </td>
                                        <td className="p-3 bg-emerald-50/30 dark:bg-emerald-900/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full rounded-full" style={{width: `${Math.min(school.avg_progress, 100)}%`}}></div>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-8">{school.avg_progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-slate-500 text-sm">Tidak ada data mitra sekolah ditemukan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
              </div>
            )}

            {/* TAB: STATISTIK CBT */}
            {activeTab === 'cbt' && (
              <div className="space-y-6 animate-fade-in-up">
                 {/* Top Metrics Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                     <StatCard label="Total CBT Tersedia" value={cbtData.total_exams} icon={<FontAwesomeIcon icon={['fas', 'boxes-stacked']} />} color="blue" />
                     <StatCard label="Pengerjaan CBT" value={cbtData.total_sessions_submitted} icon={<FontAwesomeIcon icon={['fas', 'file-signature']} />} color="purple" />
                     <StatCard label="Skor Rata-Rata Global" value={cbtData.avg_score} icon={<FontAwesomeIcon icon={['fas', 'gauge-high']} />} color="emerald" />
                     <StatCard label="Skor Tertinggi Global" value={cbtData.highest_score} icon={<FontAwesomeIcon icon={['fas', 'trophy']} />} color="gold" />
                     <div className="p-5 rounded-xl bg-slate-800 text-white flex flex-col justify-center relative overflow-hidden">
                         <div className="relative z-10 text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">Persentase Kelulusan</div>
                         <div className="relative z-10 text-3xl font-black">{cbtData.overall_pass_rate}%</div>
                         <FontAwesomeIcon icon={['fas', 'percent']} className="absolute -right-2 -bottom-2 text-6xl text-white/5 opacity-50" />
                     </div>
                 </div>

                 {/* Layout: Chart Kinerja Soal & Distribusi Skor */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-lg">Analisis Kinerja Paket Ujian</h3>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {cbtData.exams_ranking?.length > 0 ? (
                                 cbtData.exams_ranking.map((exam, i) => (
                                     <div key={exam.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                         <div className="flex-1">
                                             <div className="font-bold text-slate-800 dark:text-slate-200 text-base">{exam.title}</div>
                                             <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span><FontAwesomeIcon icon={['fas', 'users']} className="mr-1" /> {exam.participants_count} Siswa</span>
                                                <span><FontAwesomeIcon icon={['fas', 'clock']} className="mr-1" /> {exam.duration_minutes} mnt</span>
                                                <span><FontAwesomeIcon icon={['fas', 'list-ol']} className="mr-1" /> {exam.total_questions} Soal</span>
                                             </div>
                                         </div>
                                         <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
                                             <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
                                                 <div className="text-[10px] uppercase font-semibold text-slate-400">Avg Score</div>
                                                 <div className="font-black text-purple-600 dark:text-purple-400">{exam.avg_score}</div>
                                             </div>
                                             <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
                                                 <div className="text-[10px] uppercase font-semibold text-slate-400">Lulus</div>
                                                 <div className={`font-black ${exam.pass_rate >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>{exam.pass_rate}%</div>
                                             </div>
                                             <div className="text-center min-w-[100px]">
                                                 <Badge color={exam.difficulty_color}>{exam.difficulty_label}</Badge>
                                             </div>
                                         </div>
                                     </div>
                                 ))
                             ) : (
                                 <div className="text-center py-6 text-slate-400 text-sm">Tidak ada paket ujian dikerjakan.</div>
                             )}
                         </div>
                     </div>
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-lg">Distribusi Nilai CBT</h3>
                         <div className="flex-1 flex flex-col justify-center space-y-5">
                             {/* Bucket: < 50 */}
                             <div>
                                 <div className="flex justify-between text-xs mb-1 font-semibold">
                                     <span className="text-rose-500 dark:text-rose-400">Kurang Sekali (&lt; 50)</span>
                                     <span className="text-slate-600 dark:text-slate-300">{cbtData.score_distribution?.under_50 ?? 0}</span>
                                 </div>
                                 <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden w-full">
                                     <div className="h-full bg-rose-500" style={{ width: `${(cbtData.score_distribution?.under_50 / (cbtData.total_sessions_submitted || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                             {/* Bucket: 50 - 69 */}
                             <div>
                                 <div className="flex justify-between text-xs mb-1 font-semibold">
                                     <span className="text-amber-500 dark:text-amber-400">Cukup (50 - 69)</span>
                                     <span className="text-slate-600 dark:text-slate-300">{cbtData.score_distribution?.range_50_69 ?? 0}</span>
                                 </div>
                                 <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden w-full">
                                     <div className="h-full bg-amber-500" style={{ width: `${(cbtData.score_distribution?.range_50_69 / (cbtData.total_sessions_submitted || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                             {/* Bucket: 70 - 84 */}
                             <div>
                                 <div className="flex justify-between text-xs mb-1 font-semibold">
                                     <span className="text-blue-500 dark:text-blue-400">Baik (70 - 84)</span>
                                     <span className="text-slate-600 dark:text-slate-300">{cbtData.score_distribution?.range_70_84 ?? 0}</span>
                                 </div>
                                 <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden w-full">
                                     <div className="h-full bg-blue-500" style={{ width: `${(cbtData.score_distribution?.range_70_84 / (cbtData.total_sessions_submitted || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                             {/* Bucket: 85 - 100 */}
                             <div>
                                 <div className="flex justify-between text-xs mb-1 font-semibold">
                                     <span className="text-emerald-500 dark:text-emerald-400">Sangat Baik (85 - 100)</span>
                                     <span className="text-slate-600 dark:text-slate-300">{cbtData.score_distribution?.range_85_100 ?? 0}</span>
                                 </div>
                                 <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden w-full">
                                     <div className="h-full bg-emerald-500" style={{ width: `${(cbtData.score_distribution?.range_85_100 / (cbtData.total_sessions_submitted || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
              </div>
            )}

            {/* TAB: STATISTIK MATERI */}
            {activeTab === 'elearning' && (
              <div className="space-y-6 animate-fade-in-up">
                 {/* Top Metrics Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-between">
                         <div>
                            <div className="text-sm font-semibold opacity-90 mb-1">Materi / Kursus Aktif</div>
                            <div className="text-3xl font-black">{materialsData.active_courses} <span className="text-base font-normal opacity-70">/ {materialsData.total_courses}</span></div>
                         </div>
                         <FontAwesomeIcon icon={['fas', 'book']} className="text-4xl opacity-30" />
                     </div>
                     <StatCard label="Total Modul & Bab" value={materialsData.total_modules} icon={<FontAwesomeIcon icon={['fas', 'folder-tree']} />} color="blue" />
                     <StatCard label="Total Sesi Pembelajaran" value={materialsData.total_lessons} icon={<FontAwesomeIcon icon={['fas', 'chalkboard']} />} color="purple" />
                     <StatCard label="Avg. Penyelesaian (Progress)" value={`${materialsData.avg_progress}%`} icon={<FontAwesomeIcon icon={['fas', 'ranking-star']} />} color="emerald" />
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-lg">Distribusi Kategori Materi</h3>
                         <div className="space-y-4">
                             {materialsData.category_breakdown && Object.keys(materialsData.category_breakdown).length > 0 ? (
                                 Object.entries(materialsData.category_breakdown).map(([cat, count], idx) => (
                                     <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                         <span className="font-semibold text-slate-700 dark:text-slate-300">{cat || 'Umum'}</span>
                                         <Badge color="blue">{count} Kursus</Badge>
                                     </div>
                                 ))
                             ) : (
                                 <div className="text-center py-6 text-sm text-slate-400">Tidak ada kategori.</div>
                             )}
                         </div>

                         <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 mt-8 text-lg">Komposisi Lesson</h3>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="p-3 text-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                                 <FontAwesomeIcon icon={['fas', 'video']} className="text-blue-500 text-xl mb-2" />
                                 <div className="font-black text-slate-800 dark:text-slate-200">{materialsData.lesson_types?.video ?? 0}</div>
                                 <div className="text-[10px] text-slate-500 uppercase">Video Belajar</div>
                             </div>
                             <div className="p-3 text-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                                 <FontAwesomeIcon icon={['fas', 'file-pdf']} className="text-rose-500 text-xl mb-2" />
                                 <div className="font-black text-slate-800 dark:text-slate-200">{materialsData.lesson_types?.text ?? 0}</div>
                                 <div className="text-[10px] text-slate-500 uppercase">Modul Teks/PDF</div>
                             </div>
                             <div className="p-3 text-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                                 <FontAwesomeIcon icon={['fas', 'list-check']} className="text-purple-500 text-xl mb-2" />
                                 <div className="font-black text-slate-800 dark:text-slate-200">{materialsData.lesson_types?.quiz ?? 0}</div>
                                 <div className="text-[10px] text-slate-500 uppercase">Kuis (Latihan)</div>
                             </div>
                             <div className="p-3 text-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                                 <FontAwesomeIcon icon={['fas', 'upload']} className="text-amber-500 text-xl mb-2" />
                                 <div className="font-black text-slate-800 dark:text-slate-200">{materialsData.lesson_types?.assignment ?? 0}</div>
                                 <div className="text-[10px] text-slate-500 uppercase">Tugas Upload</div>
                             </div>
                         </div>
                     </div>

                     <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-lg">Materi Terpopuler</h3>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {materialsData.courses_ranking?.length > 0 ? (
                                 materialsData.courses_ranking.map((course, i) => (
                                     <div key={course.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                         <div className="flex-1 flex gap-3 items-center">
                                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black shrink-0">
                                                 #{i+1}
                                             </div>
                                             <div>
                                                 <div className="font-bold text-slate-800 dark:text-slate-200 text-base line-clamp-1">{course.title}</div>
                                                 <div className="text-xs text-slate-500 mt-0.5">{course.category} • {course.total_lessons} Lessons</div>
                                             </div>
                                         </div>
                                         <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
                                             <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
                                                 <div className="text-[10px] uppercase font-semibold text-slate-400">Total Siswa</div>
                                                 <div className="font-black text-slate-800 dark:text-slate-200">{course.enrollments_count}</div>
                                             </div>
                                             <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
                                                 <div className="text-[10px] uppercase font-semibold text-slate-400">Avg Progres</div>
                                                 <div className="font-black text-blue-600 dark:text-blue-400">{course.avg_progress}%</div>
                                             </div>
                                             <div className="text-center min-w-[70px]">
                                                 <div className="text-[10px] uppercase font-semibold text-slate-400">Lulus (100%)</div>
                                                 <div className="font-black text-emerald-500">{course.completion_rate}%</div>
                                             </div>
                                         </div>
                                     </div>
                                 ))
                             ) : (
                                 <div className="text-center py-6 text-slate-400 text-sm">Tidak ada data materi.</div>
                             )}
                         </div>
                     </div>
                 </div>
              </div>
            )}

            {/* TAB: LOGS / TABULAR DATA */}
            {activeTab === 'logs' && (
              <div className="space-y-8 animate-fade-in-up">
                 {/* Laporan Pembelajaran Section */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                                <FontAwesomeIcon icon={['fas', 'book-open']} className="text-blue-500" /> Riwayat Pembelajaran Siswa
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Detail progres per individu siswa pada tiap materi kursus.</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Input placeholder="Cari siswa atau kursus..." value={searchLearning} onChange={e => setSearchLearning(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchLearningReports()} />
                            <select
                                value={statusLearning}
                                onChange={e => { setStatusLearning(e.target.value); fetchLearningReports(); }}
                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                            >
                                <option value="">Semua Status</option>
                                <option value="ongoing">Sedang Belajar (&lt;100%)</option>
                                <option value="completed">Selesai (100%)</option>
                            </select>
                            <Button onClick={fetchLearningReports}><FontAwesomeIcon icon={['fas','search']} /></Button>
                            <Button
                               variant="outline"
                               onClick={() => {
                                  exportToCsv(
                                     learningReports,
                                     [
                                        { key: 'user.name', label: 'Nama Siswa' },
                                        { key: 'user.school', label: 'Sekolah' },
                                        { key: 'course.title', label: 'Kursus' },
                                        { key: 'progress_percentage', label: 'Progres (%)' },
                                        { key: 'completed_lessons', label: 'Materi Selesai' },
                                        { key: 'total_lessons', label: 'Total Materi' },
                                     ],
                                     'laporan-pembelajaran-siswa'
                                  );
                               }}
                            >
                               <FontAwesomeIcon icon={['fas', 'file-arrow-down']} /> Ekspor CSV
                            </Button>
                        </div>
                    </div>
                    <DataTable columns={learningColumns} data={learningReports} loading={learningLoading} />
                 </div>

                 {/* Laporan Ujian CBT Section */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                                <FontAwesomeIcon icon={['fas', 'file-signature']} className="text-purple-500" /> Riwayat Ujian CBT Siswa
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Detail pengerjaan ujian per individu dan evaluasi hasilnya.</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Input placeholder="Cari peserta atau ujian..." value={searchExam} onChange={e => setSearchExam(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchExamReports()} />
                            <select
                                value={schoolExamFilter}
                                onChange={e => { setSchoolExamFilter(e.target.value); fetchExamReports({ school: e.target.value }); }}
                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm max-w-[150px]"
                            >
                                <option value="">Semua Sekolah</option>
                                {schoolsList.map(sch => (
                                    <option key={sch} value={sch}>{sch}</option>
                                ))}
                            </select>
                            <Button onClick={() => fetchExamReports()}><FontAwesomeIcon icon={['fas','search']} /></Button>
                            <Button
                               variant="outline"
                               onClick={() => {
                                  exportToCsv(
                                     examReports,
                                     [
                                        { key: 'user.name', label: 'Nama Peserta' },
                                        { key: 'user.school', label: 'Sekolah' },
                                        { key: 'exam_title', label: 'Paket Ujian' },
                                        { key: 'score', label: 'Skor' },
                                        { key: 'exam.passing_score', label: 'KKM' },
                                        { key: 'submitted_at', label: 'Waktu Submit' },
                                     ],
                                     'laporan-ujian-siswa'
                                  );
                               }}
                            >
                               <FontAwesomeIcon icon={['fas', 'file-arrow-down']} /> Ekspor CSV
                            </Button>
                        </div>
                    </div>
                    <DataTable columns={examColumns} data={examReports} loading={examLoading} />
                 </div>
              </div>
            )}
          </>
        )}
      </div>

      {reportStudentId && (
        <StudentReportModal userId={reportStudentId} onClose={() => setReportStudentId(null)} />
      )}
    </AppLayout>
  );
}
