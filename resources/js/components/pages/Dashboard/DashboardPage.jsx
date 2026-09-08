import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../../../features/dashboard/dashboardSlice';
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
        <div className="bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
            Halo, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Program: <span className="text-blue-500 dark:text-blue-400 font-semibold capitalize">{user?.program ?? 'mandiri'}</span>
            {user?.school && ` · ${user.school}`}
          </p>
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
      </div>
    </AppLayout>
  );
}
