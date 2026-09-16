import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
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
  const { data, loading } = useSelector((s) => s.dashboard);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const stats = data?.stats;
  const elearningStats = data?.elearning_stats;
  const adminStats = data?.admin_stats;
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

  if (data?.dashboard_type && data?.dashboard_type !== 'student') {
    const isTutor = data?.dashboard_type === 'tutor';
    return (
      <AppLayout title={isTutor ? "Tutor Dashboard" : "Dashboard Pengelola"}>
        <div className="flex flex-col gap-8 max-w-6xl">
          <div className={`bg-gradient-to-r ${isTutor ? 'from-emerald-600/20 to-teal-600/20 border-emerald-500/20' : 'from-violet-600/20 to-purple-600/20 border-violet-500/20'} border rounded-lg p-6`}>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
              Halo, {isTutor ? 'Tutor' : 'Admin'} {user?.name} 👋
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {isTutor ? 'Kelola kelas, materi pengajaran, dan diskusi siswa.' : 'Ringkasan performa platform SkorPluss hari ini.'}
            </p>
          </div>

          {isTutor ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Kursus Diampu" value={loading ? '—' : tutorStats?.my_courses ?? 0} icon={<FontAwesomeIcon icon={['fas', 'book-open-reader']} className="text-blue-500" />} color="blue" />
              <StatCard label="Total Seluruh Siswa" value={loading ? '—' : tutorStats?.total_students ?? 0} icon={<FontAwesomeIcon icon={['fas', 'users']} className="text-emerald-500" />} color="emerald" />
              <StatCard label="Bank Soal / Ujian" value={loading ? '—' : tutorStats?.active_exams ?? 0} icon={<FontAwesomeIcon icon={['fas', 'file-signature']} className="text-purple-500" />} color="purple" />
              <StatCard label="Diskusi Belum Dijawab" value={loading ? '—' : tutorStats?.forum_unanswered ?? 0} icon={<FontAwesomeIcon icon={['fas', 'comments']} className="text-amber-500" />} color="gold" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Siswa" value={loading ? '—' : adminStats?.total_siswa ?? 0} icon={<FontAwesomeIcon icon={['fas', 'users']} className="text-blue-500" />} color="blue" />
              <StatCard label="Total Kursus" value={loading ? '—' : adminStats?.total_courses ?? 0} icon={<FontAwesomeIcon icon={['fas', 'book-open-reader']} className="text-emerald-500" />} color="emerald" />
              <StatCard label="Total Ujian CBT" value={loading ? '—' : adminStats?.total_exams ?? 0} icon={<FontAwesomeIcon icon={['fas', 'file-signature']} className="text-purple-500" />} color="purple" />
              <StatCard label="Sesi Ujian Selesai" value={loading ? '—' : adminStats?.total_cbt_sessions ?? 0} icon={<FontAwesomeIcon icon={['fas', 'check-double']} className="text-amber-500" />} color="gold" />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!isTutor && <Link to="/admin/users"><Button size="md" className="flex items-center gap-2"><FontAwesomeIcon icon={['fas', 'users']} /> Kelola Siswa</Button></Link>}
            <Link to="/admin/elearning"><Button color="emerald" size="md" className="flex items-center gap-2"><FontAwesomeIcon icon={['fas', 'book']} /> Kelola Kursus</Button></Link>
            {!isTutor && <Link to="/admin/cbt"><Button color="purple" size="md" className="flex items-center gap-2"><FontAwesomeIcon icon={['fas', 'file-signature']} /> Kelola CBT</Button></Link>}
            {isTutor && <Link to="/forum"><Button size="md" className="flex items-center gap-2"><FontAwesomeIcon icon={['fas', 'comments']} /> Jawab Forum Diskusi</Button></Link>}
          </div>
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
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={['fas', 'book-open-reader']} className="text-blue-500" /> Capaian Belajar
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Kursus Diikuti"
              value={loading ? '—' : elearningStats?.enrolled_courses ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'play-circle']} className="text-blue-500" />}
              color="blue"
            />
            <StatCard
              label="Materi Selesai"
              value={loading ? '—' : elearningStats?.completed_lessons ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'list-check']} className="text-emerald-500" />}
              color="emerald"
            />
            <StatCard
              label="Kursus Selesai"
              value={loading ? '—' : elearningStats?.completed_courses ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'graduation-cap']} className="text-purple-500" />}
              color="purple"
            />
            <StatCard
              label="Sertifikat"
              value={loading ? '—' : elearningStats?.certificates ?? 0}
              icon={<FontAwesomeIcon icon={['fas', 'award']} className="text-amber-500" />}
              color="gold"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mt-4 border-t border-slate-200 dark:border-slate-800 pt-6">
          {/* CBT Chart */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
               <FontAwesomeIcon icon={['fas', 'chart-line']} className="text-blue-500" /> Tren Skor CBT
            </h3>
            <div className="h-48 flex items-end gap-2 mt-4 relative pt-6">
              {recentSessions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Belum ada data ujian</div>
              ) : (
                recentSessions.slice().reverse().map((session, i) => (
                  <div key={session.id} className="relative flex-1 group flex justify-center">
                     <div 
                        className={`w-full max-w-12 rounded-t-sm transition-all duration-500 ${session.score >= 80 ? 'bg-emerald-400' : session.score >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`} 
                        style={{ height: `${session.score || 0}%` }}
                     ></div>
                     <span className="absolute -top-6 text-xs font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{session.score || 0}</span>
                     <div className="absolute -bottom-6 w-max text-[10px] text-slate-500 truncate px-1">{new Date(session.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-8 text-xs text-center text-slate-500">Berdasarkan 5 ujian terakhir</div>
          </div>

          {/* Elearning/Tugas Akhir Chart */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
               <FontAwesomeIcon icon={['fas', 'chart-column']} className="text-purple-500" /> Progres Kursus / Tugas Akhir
            </h3>
            <div className="h-48 flex items-end gap-2 mt-4 relative pt-6">
              {recentCourses.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Belum ada kursus aktif</div>
              ) : (
                recentCourses.map((enr, i) => (
                  <div key={enr.id} className="relative flex-1 group flex justify-center">
                     <div 
                        className="w-full max-w-12 bg-purple-500/80 rounded-t-sm transition-all duration-500" 
                        style={{ height: `${enr.progress_percentage || 0}%` }}
                     ></div>
                     <span className="absolute -top-6 text-xs font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{enr.progress_percentage || 0}%</span>
                     <div className="absolute -bottom-6 w-full text-center text-[10px] text-slate-500 truncate px-1" title={enr.course?.title}>{enr.course?.title?.substring(0, 10)}...</div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-8 text-xs text-center text-slate-500">Persentase capaian belajar terkini</div>
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
                    className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-gradient-to-b from-blue-50/90 to-white dark:from-blue-950/30 dark:to-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
                    }`}
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
