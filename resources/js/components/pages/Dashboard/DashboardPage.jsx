import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { fetchDashboard } from '../../../features/dashboard/dashboardSlice';
import { fetchMe } from '../../../features/auth/authSlice';
import AppLayout from '../../templates/AppLayout';
import StatCard from '../../molecules/StatCard';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data, loading } = useSelector((s) => s.dashboard);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const stats = data?.stats;
  const elearningStats = data?.elearning_stats;
  const adminStats = data?.admin_stats;
  const courseStats = data?.course_stats;
  const cbtStats = data?.cbt_stats;
  const tutorStats = data?.tutor_stats;
  const recentSessions = data?.recent_sessions || [];
  const recentCourses = data?.recent_courses || [];


  const [selectedProgram, setSelectedProgram] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const availablePrograms = data?.available_programs || [];

  const handleEnrollProgram = async (prog) => {
    try {
      setEnrolling(true);
      const res = await api.post('/student/programs/enroll', {
        program_id: prog.id,
      });
      toast.success(res.data?.message || `Berhasil mengambil Program ${prog.name}!`);
      setSelectedProgram(null);
      dispatch(fetchDashboard());
      dispatch(fetchMe());
    } catch (err) {
      console.error('Failed to enroll program:', err);
      toast.error(err.response?.data?.message || 'Gagal mengambil program. Silakan coba lagi.');
    } finally {
      setEnrolling(false);
    }
  };

  if (data?.dashboard_type === 'admin_sekolah') {
    const schoolStats = data?.stats;
    const schoolInfo = data?.school;
    const recentStudents = data?.recent_students || [];
    const recentSchoolSessions = data?.recent_sessions || [];

    return (
      <AppLayout title="Dashboard Sekolah">
        <div className="flex flex-col gap-8 max-w-6xl">
          {/* Header Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-blue-500/20 shadow-xs">
            {/* Cover Photo */}
            <div className="h-40 sm:h-48 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 relative">
              {schoolInfo?.photo ? (
                <img src={schoolInfo.photo} alt="Foto Sekolah" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent dark:from-slate-900/90 dark:via-slate-900/70 dark:to-transparent" />
            </div>
            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Logo Badge */}
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                  {schoolInfo?.logo ? (
                    <img src={schoolInfo.logo} alt="Logo Sekolah" className="w-full h-full object-contain" />
                  ) : (
                    <FontAwesomeIcon icon={['fas', 'school']} className="text-2xl text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color="blue">Admin Mitra Sekolah</Badge>
                    {schoolInfo?.npsn && <span className="text-xs text-slate-500 font-mono">NPSN: {schoolInfo.npsn}</span>}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
                    {schoolInfo?.name || 'Sekolah'}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Selamat datang kembali, <strong>{user?.name}</strong>. Pantau aktivitas dan kemajuan belajar seluruh siswa Anda.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/school-admin/students">
                  <Button size="sm">
                    <FontAwesomeIcon icon={['fas', 'user-plus']} className="mr-1.5" /> Kelola Siswa
                  </Button>
                </Link>
                <Link to="/school-admin/profile">
                  <Button variant="outline" size="sm">
                    <FontAwesomeIcon icon={['fas', 'school']} className="mr-1.5" /> Profil Sekolah
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Siswa Terdaftar"
              value={loading ? '—' : schoolStats?.total_students ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'users']} className="text-blue-500" />}
              color="blue"
              to="/school-admin/students"
            />
            <StatCard
              label="Siswa Aktif"
              value={loading ? '—' : schoolStats?.active_students ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'user-check']} className="text-emerald-500" />}
              color="emerald"
            />
            <StatCard
              label="Sesi Ujian CBT"
              value={loading ? '—' : schoolStats?.total_cbt_sessions ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'file-signature']} className="text-purple-500" />}
              color="purple"
            />
            <StatCard
              label="Rata-rata Nilai CBT"
              value={loading ? '—' : `${schoolStats?.avg_score ?? 0} pts`}
              icon={<FontAwesomeIcon icon={['fas', 'chart-line']} className="text-amber-500" />}
              color="gold"
            />
          </div>

          {/* Quick Tables: Recent Students & Recent CBT Results */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Students */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'user-graduate']} className="text-blue-500" />
                  Siswa Terbaru Terdaftar
                </h3>
                <Link to="/school-admin/students" className="text-xs text-blue-600 hover:underline">
                  Lihat Semua →
                </Link>
              </div>

              {recentStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Belum ada siswa terdaftar. <Link to="/school-admin/students" className="text-blue-500 underline">Tambah siswa pertama</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentStudents.map((st) => (
                    <div key={st.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{st.name}</div>
                        <div className="text-xs text-slate-400">{st.email} {st.nisn ? `• NISN: ${st.nisn}` : ''}</div>
                      </div>
                      <Badge color="blue">{st.program || 'intensif'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent CBT Activities */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'file-circle-check']} className="text-purple-500" />
                  Aktivitas Ujian CBT Siswa
                </h3>
                <span className="text-xs text-slate-400">Hasil Terkini</span>
              </div>

              {recentSchoolSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Belum ada riwayat pengerjaan CBT dari siswa sekolah Anda.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSchoolSessions.map((ss) => (
                    <div key={ss.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {ss.user?.name || 'Siswa'}
                        </div>
                        <div className="text-xs text-slate-400">{ss.exam_title || ss.exam_type || 'Ujian CBT'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {ss.score !== null ? `${ss.score} pts` : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">{ss.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (data?.dashboard_type && data?.dashboard_type !== 'student') {
    const isTutor = data?.dashboard_type === 'tutor';
    return (
      <AppLayout title={isTutor ? "Tutor Dashboard" : "Dashboard Pengelola"}>
        <div className="flex flex-col gap-8 max-w-6xl">
          {/* Header Banner */}
          <div className={`bg-gradient-to-r ${isTutor ? 'from-emerald-600/20 to-teal-600/20 border-emerald-500/20' : 'from-violet-600/20 to-purple-600/20 border-violet-500/20'} border rounded-2xl p-6 shadow-xs`}>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
              Halo, {isTutor ? 'Tutor' : 'Admin'} {user?.name} 👋
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {isTutor ? 'Kelola kelas, materi pengajaran, dan diskusi siswa.' : 'Ringkasan performa platform SkorPluss hari ini.'}
            </p>
          </div>

          {/* Quick Primary KPI Cards */}
          {isTutor ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Kursus Diampu" value={loading ? '—' : tutorStats?.my_courses ?? 0} icon={<FontAwesomeIcon icon={['fas', 'book-open-reader']} className="text-blue-500" />} color="blue" to="/admin/elearning" />
              <StatCard label="Total Seluruh Siswa" value={loading ? '—' : tutorStats?.total_students ?? 0} icon={<FontAwesomeIcon icon={['fas', 'users']} className="text-emerald-500" />} color="emerald" />
              <StatCard label="Bank Soal / Ujian" value={loading ? '—' : tutorStats?.active_exams ?? 0} icon={<FontAwesomeIcon icon={['fas', 'file-signature']} className="text-purple-500" />} color="purple" to="/admin/cbt" />
              <StatCard label="Diskusi Belum Dijawab" value={loading ? '—' : tutorStats?.forum_unanswered ?? 0} icon={<FontAwesomeIcon icon={['fas', 'comments']} className="text-amber-500" />} color="gold" to="/forum" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Siswa" value={loading ? '—' : adminStats?.total_siswa ?? 0} icon={<FontAwesomeIcon icon={['fas', 'users']} className="text-blue-500" />} color="blue" to="/admin/users" />
              <StatCard label="Total Kursus" value={loading ? '—' : adminStats?.total_courses ?? 0} icon={<FontAwesomeIcon icon={['fas', 'book-open-reader']} className="text-emerald-500" />} color="emerald" to="/admin/elearning" />
              <StatCard label="Total Ujian CBT" value={loading ? '—' : adminStats?.total_exams ?? 0} icon={<FontAwesomeIcon icon={['fas', 'file-signature']} className="text-purple-500" />} color="purple" to="/admin/cbt" />
              <StatCard label="Sesi Ujian Selesai" value={loading ? '—' : adminStats?.total_cbt_sessions ?? 0} icon={<FontAwesomeIcon icon={['fas', 'check-double']} className="text-amber-500" />} color="gold" to="/admin/cbt" />
            </div>
          )}

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!isTutor && (
              <Link to="/admin/users">
                <Button size="md" className="flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'users']} /> Kelola Siswa
                </Button>
              </Link>
            )}
            <Link to="/admin/elearning">
              <Button color="emerald" size="md" className="flex items-center gap-2">
                <FontAwesomeIcon icon={['fas', 'book']} /> Kelola Kursus
              </Button>
            </Link>
            {!isTutor && (
              <Link to="/admin/cbt">
                <Button color="purple" size="md" className="flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'file-signature']} /> Kelola CBT
                </Button>
              </Link>
            )}
            {isTutor && (
              <Link to="/forum">
                <Button size="md" className="flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'comments']} /> Jawab Forum Diskusi
                </Button>
              </Link>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ADMIN ONLY: STATISTIK KURSUS & STATISTIK UJIAN CBT                      */}
          {/* ========================================================================= */}
          {!isTutor && (
            <>
              {/* SECTION: STATISTIK KURSUS (E-LEARNING) */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">
                        <FontAwesomeIcon icon={['fas', 'book-open-reader']} />
                      </span>
                      Statistik Kursus & E-Learning
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Metrik pendaftaran kelas, kemajuan belajar siswa, dan kursus terpopuler
                    </p>
                  </div>
                  <Link to="/admin/elearning">
                    <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                      <span>Kelola E-Learning</span>
                      <FontAwesomeIcon icon={['fas', 'arrow-right']} className="text-xs" />
                    </Button>
                  </Link>
                </div>

                {/* Kursus Mini KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span>Total Pendaftaran</span>
                      <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-md">
                        <FontAwesomeIcon icon={['fas', 'user-graduate']} />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {loading ? '—' : courseStats?.total_enrollments ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Siswa terdaftar di kelas</div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span>Kursus Selesai (100%)</span>
                      <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-md">
                        <FontAwesomeIcon icon={['fas', 'circle-check']} />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {loading ? '—' : courseStats?.completed_enrollments ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Sertifikat kelulusan tercapai</div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span>Rata-rata Progres</span>
                      <span className="text-purple-500 bg-purple-50 dark:bg-purple-900/30 p-1.5 rounded-md">
                        <FontAwesomeIcon icon={['fas', 'chart-simple']} />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      {loading ? '—' : `${courseStats?.avg_progress ?? 0}%`}
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(courseStats?.avg_progress ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span>Total Pelajaran</span>
                      <span className="text-amber-500 bg-amber-50 dark:bg-amber-900/30 p-1.5 rounded-md">
                        <FontAwesomeIcon icon={['fas', 'list-check']} />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {loading ? '—' : courseStats?.total_lessons ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Dalam {courseStats?.total_modules ?? 0} modul materi</div>
                  </div>
                </div>

                {/* Kursus Details Grid: Top Courses & Recent Learning Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Courses */}
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                          <FontAwesomeIcon icon={['fas', 'fire']} className="text-rose-500" />
                          Kursus Paling Banyak Diikuti
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">Berdasarkan pendaftar</span>
                      </div>

                      {courseStats?.top_courses?.length > 0 ? (
                        <div className="space-y-3">
                          {courseStats.top_courses.map((course, idx) => (
                            <div
                              key={course.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all border border-slate-100 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className="w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                                  #{idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {course.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                    <span className="truncate">{course.category || course.program_name || 'Umum'}</span>
                                    {course.rating > 0 && (
                                      <span>· ⭐ {parseFloat(course.rating).toFixed(1)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                                  <FontAwesomeIcon icon={['fas', 'users']} className="text-[10px]" />
                                  {course.enrollments_count ?? 0} Siswa
                                </span>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  Avg: {Math.round(course.avg_progress || 0)}% progres
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-xs">Belum ada data pendaftaran kursus</div>
                      )}
                    </div>

                    {/* Kategori chips */}
                    {courseStats?.categories?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 mr-1">Kategori Populer:</span>
                        {courseStats.categories.map((cat, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {cat.category} ({cat.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Learning Activity */}
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                          <FontAwesomeIcon icon={['fas', 'clock-rotate-left']} className="text-blue-500" />
                          Aktivitas Belajar Siswa Terkini
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">Update progres</span>
                      </div>

                      {courseStats?.recent_enrollments?.length > 0 ? (
                        <div className="space-y-3">
                          {courseStats.recent_enrollments.map((enr) => (
                            <div
                              key={enr.id}
                              className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {enr.user?.name || 'Siswa'}
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {enr.course?.title || 'Kursus'}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  enr.progress_percentage >= 100
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    : enr.progress_percentage > 0
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {enr.progress_percentage >= 100 ? '✓ Selesai 100%' : `${enr.progress_percentage}% Selesai`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                <span>{enr.completed_lessons ?? 0} dari {enr.total_lessons ?? 0} materi selesai</span>
                                <span>{new Date(enr.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    enr.progress_percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(enr.progress_percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-xs">Belum ada aktivitas pendaftaran kursus</div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
                      <Link to="/admin/elearning" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        Kelola seluruh modul dan silabus kelas →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: STATISTIK UJIAN CBT */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm">
                        <FontAwesomeIcon icon={['fas', 'file-signature']} />
                      </span>
                      Statistik & Kinerja Ujian CBT
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Performa skor siswa, sesi tryout yang berjalan, dan evaluasi hasil ujian
                    </p>
                  </div>
                  <Link to="/admin/cbt">
                    <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                      <span>Kelola CBT</span>
                      <FontAwesomeIcon icon={['fas', 'arrow-right']} className="text-xs" />
                    </Button>
                  </Link>
                </div>

                {/* CBT Mini KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span>Rata-rata Nilai</span>
                      <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-md">
                        <FontAwesomeIcon icon={['fas', 'gauge-high']} />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {loading ? '—' : (cbtStats?.avg_score ?? 0)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Dari seluruh sesi tryout selesai</div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span>Skor Tertinggi</span>
                      <span className="text-purple-500 bg-purple-50 dark:bg-purple-900/30 p-1.5 rounded-md">
                        <FontAwesomeIcon icon={['fas', 'trophy']} />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      {loading ? '—' : (cbtStats?.highest_score ?? 0)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Nilai terendah: {cbtStats?.lowest_score ?? 0}</div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span>Tingkat Kelulusan (≥70)</span>
                      <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-md">
                        <FontAwesomeIcon icon={['fas', 'percent']} />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {loading ? '—' : `${cbtStats?.pass_rate ?? 0}%`}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{cbtStats?.completed_sessions ?? 0} sesi selesai dievaluasi</div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span>Bank Soal CBT</span>
                      <span className="text-amber-500 bg-amber-50 dark:bg-amber-900/30 p-1.5 rounded-md">
                        <FontAwesomeIcon icon={['fas', 'circle-question']} />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {loading ? '—' : (cbtStats?.total_questions ?? 0)} Soal
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Tersebar di {cbtStats?.total_exams ?? 0} paket ujian aktif</div>
                  </div>
                </div>

                {/* CBT Chart & Live Feed Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CBT Score Distribution Bar Chart */}
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                          <FontAwesomeIcon icon={['fas', 'chart-column']} className="text-purple-500" />
                          Distribusi Skor Sesi Ujian Selesai
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">Tryout CBT</span>
                      </div>

                      {/* Visual Chart with Reference Gridlines */}
                      <div className="relative h-48 mt-2 pt-4 flex flex-col justify-end">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                          <div className="border-b border-dashed border-slate-200 dark:border-slate-800 flex justify-end">
                            <span className="text-[10px] text-slate-400 -mt-2.5 px-1 bg-white dark:bg-slate-900">100</span>
                          </div>
                          <div className="border-b border-dashed border-slate-200 dark:border-slate-800 flex justify-end">
                            <span className="text-[10px] text-slate-400 -mt-2.5 px-1 bg-white dark:bg-slate-900">50</span>
                          </div>
                          <div className="border-b border-slate-200 dark:border-slate-700" />
                        </div>

                        {cbtStats?.recent_sessions?.filter(s => s.status === 'submitted').length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs z-10">
                            <span>Belum ada sesi ujian yang selesai</span>
                          </div>
                        ) : (
                          <div className="relative z-10 flex items-end gap-3 h-full pb-7">
                            {cbtStats.recent_sessions
                              .filter(s => s.status === 'submitted')
                              .slice(0, 6)
                              .reverse()
                              .map((session) => (
                                <div
                                  key={session.id}
                                  className="flex-1 h-full flex flex-col justify-end items-center group/bar relative"
                                  title={`${session.user?.name || 'Siswa'} - ${session.exam_title}: Skor ${session.score}`}
                                >
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1 group-hover/bar:scale-110 transition-transform">
                                    {session.score || 0}
                                  </span>
                                  <div
                                    className={`w-full max-w-10 rounded-t-sm transition-all duration-500 hover:brightness-110 shadow-xs ${
                                      session.score >= 80 ? 'bg-emerald-500' : session.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ height: `${Math.max(session.score || 0, 8)}%` }}
                                  />
                                  <div className="absolute -bottom-6 w-full text-center text-[10px] text-slate-500 truncate px-0.5">
                                    {session.user?.name?.split(' ')[0] || `Sesi #${session.id}`}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sesi Status Breakdown */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Selesai: <strong>{cbtStats?.completed_sessions ?? 0}</strong></span>
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Sedang Berjalan: <strong>{cbtStats?.ongoing_sessions ?? 0}</strong></span>
                        </span>
                      </div>
                      <Link to="/admin/cbt" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                        Detail CBT →
                      </Link>
                    </div>
                  </div>

                  {/* Live Feed Sesi Ujian Terkini */}
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                          <FontAwesomeIcon icon={['fas', 'bolt']} className="text-amber-500" />
                          Aktivitas Sesi Ujian Terkini
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">Live Feed</span>
                      </div>

                      {cbtStats?.recent_sessions?.length > 0 ? (
                        <div className="space-y-2.5">
                          {cbtStats.recent_sessions.map((session) => (
                            <div
                              key={session.id}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {session.user?.name || 'Siswa'}
                                  </p>
                                  <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                                    ({session.user?.email})
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {session.exam_title || session.exam?.title || 'Ujian CBT'}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                {session.status === 'submitted' ? (
                                  <span className={`inline-block font-extrabold text-xs px-2 py-0.5 rounded-md ${
                                    session.score >= 80
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      : session.score >= 60
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                  }`}>
                                    Skor {session.score}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                    Mengerjakan
                                  </span>
                                )}
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-xs">Belum ada riwayat sesi ujian CBT</div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
                      <Link to="/admin/cbt" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                        Lihat seluruh sesi dan evaluasi CBT →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Ringkasan Performa Paket Ujian */}
                {cbtStats?.exams_performance?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={['fas', 'list-ol']} className="text-blue-500" />
                        Ringkasan Paket Ujian CBT
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">Performa per Paket</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                            <th className="py-2 px-3 font-semibold">Nama Paket Ujian</th>
                            <th className="py-2 px-3 font-semibold">Durasi</th>
                            <th className="py-2 px-3 font-semibold text-center">Jumlah Soal</th>
                            <th className="py-2 px-3 font-semibold text-center">Total Peserta</th>
                            <th className="py-2 px-3 font-semibold text-center">Rata-rata Skor</th>
                            <th className="py-2 px-3 font-semibold text-center">Skor Tertinggi</th>
                            <th className="py-2 px-3 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {cbtStats.exams_performance.map((exam) => (
                            <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                                {exam.title}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {exam.duration_minutes} Menit
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                                  {exam.questions_count ?? 0} Soal
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                                {exam.total_sessions_count ?? 0} Sesi
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                  {exam.avg_score ? parseFloat(exam.avg_score).toFixed(1) : '—'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-purple-600 dark:text-purple-400">
                                {exam.max_score ?? '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <Link
                                  to={`/admin/cbt/exams/${exam.id}/questions`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                                >
                                  <span>Soal</span>
                                  <FontAwesomeIcon icon={['fas', 'arrow-right']} className="text-[9px]" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout title="Dashboard">
      <div className="flex flex-col gap-8 max-w-6xl">
        {/* Greeting */}
        <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-violet-600/20 border border-blue-500/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
              Halo, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm flex flex-wrap items-center gap-2">
              <span>Program:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 capitalize border border-blue-200 dark:border-blue-800">
                Program {user?.program ?? 'mandiri'}
              </span>
              {user?.school && <span>· {user.school}</span>}
            </p>
          </div>
          <div className="shrink-0">
            <a
              href="#penawaran-program"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 shadow-sm transition-all"
            >
              <span>⭐</span>
              <span>Pilihan Program Belajar</span>
              <span>↓</span>
            </a>
          </div>
        </div>

        {/* E-Learning Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'book-open-reader']} className="text-blue-500" /> Capaian Belajar
            </h3>
            <Link
              to="/elearning?tab=progress"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              Lihat Rincian Belajar →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Kursus Diikuti"
              value={loading ? '—' : elearningStats?.enrolled_courses ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'play-circle']} className="text-blue-500" />}
              color="blue"
              trendLabel="Kelas dalam program"
              to="/elearning?tab=progress&status=in_progress"
            />
            <StatCard
              label="Kursus Selesai"
              value={loading ? '—' : elearningStats?.completed_courses ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'graduation-cap']} className="text-purple-500" />}
              color="purple"
              trendLabel="Kelas tamat 100%"
              to="/elearning?tab=progress&status=completed"
            />
            <StatCard
              label="Materi Selesai"
              value={loading ? '—' : elearningStats?.completed_lessons ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'list-check']} className="text-emerald-500" />}
              color="emerald"
              trendLabel="Pelajaran / modul selesai"
              to="/elearning?tab=progress&status=in_progress"
            />
            <StatCard
              label="Sertifikat"
              value={loading ? '—' : elearningStats?.certificates ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'award']} className="text-amber-500" />}
              color="gold"
              trendLabel="Sertifikat kelulusan"
              to="/elearning?tab=progress&status=completed&action=certificate"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mt-4 border-t border-slate-200 dark:border-slate-800 pt-6">
          {/* CBT Chart */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-400/60 dark:hover:border-blue-500/60 rounded-lg p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Link to="/cbt" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <FontAwesomeIcon icon={['fas', 'chart-line']} className="text-blue-500" /> Tren Skor CBT
                </Link>
                <Link to="/cbt" className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Lihat Riwayat CBT →
                </Link>
              </div>
              {/* Chart Body with Reference Gridlines */}
              <div className="relative h-44 mt-2 pt-4 flex flex-col justify-end">
                {/* Background Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800 flex justify-end">
                    <span className="text-[10px] text-slate-400 -mt-2.5 px-1 bg-white dark:bg-slate-900">100</span>
                  </div>
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800 flex justify-end">
                    <span className="text-[10px] text-slate-400 -mt-2.5 px-1 bg-white dark:bg-slate-900">50</span>
                  </div>
                  <div className="border-b border-slate-200 dark:border-slate-700" />
                </div>

                {/* Bars Container */}
                {recentSessions.length === 0 ? (
                  <Link to="/cbt" className="h-full flex flex-col items-center justify-center text-slate-400 text-sm hover:text-blue-500 transition-colors z-10">
                    <span>Belum ada data ujian</span>
                    <span className="text-xs text-blue-500 mt-1">Mulai Ujian Sekarang →</span>
                  </Link>
                ) : (
                  <div className="relative z-10 flex items-end gap-3 h-full pb-7">
                    {recentSessions.slice().reverse().map((session) => (
                      <Link
                        key={session.id}
                        to="/cbt"
                        className="flex-1 h-full flex flex-col justify-end items-center group/bar cursor-pointer relative"
                        title={`${session.exam_title || 'Ujian CBT'}: Skor ${session.score || 0}`}
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 group-hover/bar:scale-110 transition-transform">
                          {session.score || 0}
                        </span>
                        <div
                          className={`w-full max-w-10 rounded-t-sm transition-all duration-500 hover:brightness-110 shadow-xs ${
                            session.score >= 80 ? 'bg-emerald-500' : session.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ height: `${Math.max(session.score || 0, 8)}%` }}
                        />
                        <div className="absolute -bottom-6 w-max text-[10px] text-slate-500 truncate px-1">
                          {new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Link to="/cbt" className="mt-8 text-xs text-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 block transition-colors">
              {recentSessions.length > 1
                ? `Berdasarkan ${recentSessions.length} ujian terakhir · Klik untuk buka riwayat CBT`
                : recentSessions.length === 1
                ? 'Berdasarkan 1 ujian · Klik untuk buka ujian CBT'
                : 'Belum ada data ujian · Klik untuk mulai ujian CBT'}
            </Link>
          </div>

          {/* Elearning/Tugas Akhir Chart */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-purple-400/60 dark:hover:border-purple-500/60 rounded-lg p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Link to="/elearning?tab=progress" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                   <FontAwesomeIcon icon={['fas', 'chart-column']} className="text-purple-500" /> Progres Belajar Kursus
                </Link>
                <Link to="/elearning?tab=progress" className="text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Lihat Progres Kelas →
                </Link>
              </div>
              {/* Chart Body with Reference Gridlines */}
              <div className="relative h-44 mt-2 pt-4 flex flex-col justify-end">
                {/* Background Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800 flex justify-end">
                    <span className="text-[10px] text-slate-400 -mt-2.5 px-1 bg-white dark:bg-slate-900">100%</span>
                  </div>
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800 flex justify-end">
                    <span className="text-[10px] text-slate-400 -mt-2.5 px-1 bg-white dark:bg-slate-900">50%</span>
                  </div>
                  <div className="border-b border-slate-200 dark:border-slate-700" />
                </div>

                {/* Bars Container */}
                {recentCourses.length === 0 ? (
                  <Link to="/elearning?tab=catalog" className="h-full flex flex-col items-center justify-center text-slate-400 text-sm hover:text-blue-500 transition-colors z-10">
                    <span>Belum ada kursus aktif</span>
                    <span className="text-xs text-blue-500 mt-1">Mulai pilih kursus di katalog →</span>
                  </Link>
                ) : (
                  <div className="relative z-10 flex items-end gap-3 h-full pb-7">
                    {recentCourses.map((enr) => (
                      <Link
                        key={enr.id}
                        to={enr.course?.slug ? `/elearning/${enr.course.slug}` : '/elearning?tab=progress'}
                        className="flex-1 h-full flex flex-col justify-end items-center group/bar cursor-pointer relative"
                        title={`${enr.course?.title || 'Kursus'}: ${enr.progress_percentage || 0}%`}
                      >
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 group-hover/bar:scale-110 transition-transform">
                          {enr.progress_percentage || 0}%
                        </span>
                        <div
                          className={`w-full max-w-10 rounded-t-sm transition-all duration-500 hover:brightness-110 shadow-xs ${
                            enr.progress_percentage === 100
                              ? 'bg-emerald-500'
                              : enr.progress_percentage > 0
                              ? 'bg-purple-600'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          style={{ height: `${Math.max(enr.progress_percentage || 0, 6)}%` }}
                        />
                        <div className="absolute -bottom-6 w-full text-center text-[10px] text-slate-500 truncate px-1" title={enr.course?.title}>
                          {enr.course?.title ? (enr.course.title.length > 12 ? enr.course.title.substring(0, 10) + '...' : enr.course.title) : 'Kursus'}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Link to="/elearning?tab=progress" className="mt-8 text-xs text-center text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 block transition-colors">
              {recentCourses.length > 0
                ? `Berdasarkan ${recentCourses.length} kursus aktif dipelajari · Klik kursus untuk buka materi`
                : 'Belum ada kursus aktif · Mulai belajar di katalog'}
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/cbt">
            <Button size="md" className="flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'pen-to-square']} /> Mulai Ujian CBT
            </Button>
          </Link>
          <Link to="/elearning">
            <Button color="emerald" size="md" className="flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'play']} /> Lanjutkan Belajar
            </Button>
          </Link>
          <Link to="/forum">
            <Button variant="ghost" size="md" className="flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'comments']} /> Tanya Tutor
            </Button>
          </Link>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            PENAWARAN PROGRAM BELAJAR (STUDENT PROGRAM ENROLLMENT)
            ══════════════════════════════════════════════════════════════════ */}
        {availablePrograms.length > 0 && (
          <div id="penawaran-program" className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 mb-2">
                  <span>✨</span> Penawaran Program Bimbel
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Pilihan Program & Jalur Belajar
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  Tingkatkan atau ambil program belajar untuk membuka seluruh kurikulum materi, ribuan latihan simulasi CBT IRT, dan bimbingan tutor master.
                </p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                Program Saat Ini: <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">Program {user?.program || 'mandiri'}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {availablePrograms.map((prog) => {
                const isCurrent = prog.is_current || (user?.program && (
                  user.program.toLowerCase() === (prog.slug || '').toLowerCase() ||
                  user.program.toLowerCase() === (prog.name || '').toLowerCase()
                ));

                return (
                  <div
                    key={prog.id}
                    className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer group ${
                      isCurrent
                        ? 'bg-gradient-to-b from-blue-50/90 to-white dark:from-blue-950/30 dark:to-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5 hover:border-blue-600'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:scale-[1.01]'
                    }`}
                    onClick={(e) => {
                      if (!e.target.closest('button') && !e.target.closest('a')) {
                        navigate(`/program/${prog.slug || prog.id}`);
                      }
                    }}
                  >
                    {/* Top Badge */}
                    {isCurrent ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span>✓</span> PROGRAM AKTIF ANDA
                      </div>
                    ) : prog.is_popular ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span>⭐</span> PALING POPULER
                      </div>
                    ) : null}

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                          {prog.icon || '🚀'}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
                          {prog.courses_count || 0} Kursus
                        </span>
                      </div>

                      <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                        Program {prog.name}
                      </h4>

                      <div className="flex items-baseline gap-1 mb-5">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{prog.price}</span>
                        <span className="text-xs text-slate-500">{prog.price_period || '/bulan'}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Fasilitas Unggulan:
                        </p>
                        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                          {(prog.features || []).map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2">
                              <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        to={`/program/${prog.slug || prog.id}`}
                        className="block w-full py-2 px-3 text-center rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Lihat Detail & Learning Path →
                      </Link>

                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50 cursor-default flex items-center justify-center gap-2"
                        >
                          <span>✓</span> Sedang Aktif Digunakan
                        </button>
                      ) : (
                        <Button
                          variant={prog.is_popular ? 'primary' : 'outline'}
                          className="w-full text-xs font-bold cursor-pointer"
                          onClick={() => setSelectedProgram(prog)}
                        >
                          Ambil / Daftar {prog.name}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Pilihan Program */}
        {selectedProgram && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900">
                    {selectedProgram.icon || '🚀'}
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Konfirmasi Ambil Program
                    </h3>
                    <p className="text-xs text-slate-500">
                      Program {selectedProgram.name} SkorPluss
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-5 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Biaya Program</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">{selectedProgram.price}</span>
                    <span className="text-xs text-slate-400 ml-1">{selectedProgram.price_period || '/bulan'}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Dengan mengonfirmasi program ini:
                  </p>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-600 dark:text-slate-400">
                    <li>Program belajar akun Anda akan dialihkan ke <strong>Program {selectedProgram.name}</strong>.</li>
                    <li>Seluruh <strong>{selectedProgram.courses_count || 'semua'} kursus</strong> dan materi silabus terkait akan otomatis dibuka pada akun E-Learning Anda.</li>
                    <li>Akses ke simulasi CBT dan fasilitas belajar akan disesuaikan dengan paket ini.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="md"
                  disabled={enrolling}
                  onClick={() => setSelectedProgram(null)}
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={enrolling}
                  onClick={() => handleEnrollProgram(selectedProgram)}
                >
                  {enrolling ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    `Ya, Ambil Program ${selectedProgram.name}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
