import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { exportToCsv } from '../../../../utils/exportCsv';
import StudentReportModal from './StudentReportModal';

export default function AdminSchoolStudentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const schoolFromState = location.state?.school || null;

  const [school, setSchool] = useState(schoolFromState);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  // Modal Rapor Siswa (per individu)
  const [reportStudentId, setReportStudentId] = useState(null);

  const fetchStudents = async (query = '') => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.search = query;
      const res = await api.get(`/admin/reports/schools/${id}/students`, { params });
      setStudents(res.data.students || []);
      setSchool((prev) => prev || res.data.school);
    } catch {
      toast.error('Gagal memuat data siswa sekolah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSearch = () => {
    fetchStudents(search.trim());
  };

  const handleOpenRapor = (studentId) => {
    setReportStudentId(studentId);
  };

  const totalWithScore = students.filter(
    (s) => s.last_cbt_score !== null && s.last_cbt_score !== undefined
  ).length;
  const avgScore =
    totalWithScore > 0
      ? Math.round(
          (students.reduce(
            (sum, s) => sum + (Number(s.last_cbt_score) || 0),
            0
          ) /
            totalWithScore) *
            10
        ) / 10
      : 0;

  if (loading && students.length === 0) {
    return (
      <AppLayout title="Data Siswa Sekolah">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-semibold">Memuat data siswa sekolah...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Data Siswa — ${school?.name || 'Sekolah'}`}>
      <div className="w-full pb-16 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/reports')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kembali ke Laporan & Analitik"
            >
              ← Kembali
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base shadow-md shadow-blue-500/20">
                  <FontAwesomeIcon icon={['fas', 'user-graduate']} />
                </span>
                Data Siswa Mitra
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Daftar siswa dari{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {school?.name || 'sekolah'}
                </span>{' '}
                beserta skor CBT terakhir dan aktivitas terakhirnya.
              </p>
            </div>
          </div>

          <div className="flex gap-2 no-print">
            <Button
              variant="outline"
              onClick={() =>
                exportToCsv(
                  students,
                  [
                    { key: 'name', label: 'Nama Siswa' },
                    { key: 'nisn', label: 'NISN' },
                    { key: 'email', label: 'Email' },
                    { key: 'program', label: 'Program' },
                    { key: 'last_cbt_score', label: 'Skor CBT Terakhir' },
                    { key: 'last_cbt_title', label: 'Ujian CBT Terakhir' },
                    { key: 'last_activity', label: 'Aktivitas Terakhir' },
                  ],
                  `data-siswa-${(school?.name || 'sekolah').toLowerCase().replace(/\s+/g, '-')}`
                )
              }
              disabled={students.length === 0}
            >
              <FontAwesomeIcon icon={['fas', 'file-arrow-down']} className="mr-1.5" /> Ekspor CSV
            </Button>
            <Button variant="outline" onClick={() => fetchStudents(search.trim())} disabled={loading}>
              <FontAwesomeIcon icon={['fas', 'rotate-right']} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90 mb-1">Total Siswa</div>
            <div className="text-3xl font-black">{students.length}</div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Pernah Ujian CBT</div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalWithScore}</div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Rata-rata Skor CBT</div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{avgScore}</div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Aktifitas</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {students.filter((s) => s.is_active).length}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <Input
                ref={searchRef}
                placeholder="Cari nama, email, atau NISN siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <FontAwesomeIcon icon={['fas', 'search']} className="mr-1.5" /> Cari
            </Button>
          </div>
        </div>

        {/* Students table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
              Daftar Siswa
              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full ml-2 align-middle">
                {students.length} Siswa
              </span>
            </h3>
            <span className="text-xs text-slate-400 hidden md:block">
              Klik baris siswa untuk membuka Rapor Siswa
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold">Memuat data siswa...</p>
            </div>
          ) : students.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Skor CBT Terakhir</th>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas Terakhir</th>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => handleOpenRapor(student.id)}
                    className="hover:bg-blue-50/60 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group"
                    title="Klik untuk membuka Rapor Siswa"
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-2">
                        <span>{student.name}</span>
                        <span className="text-xs opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">
                          <FontAwesomeIcon icon={['fas', 'arrow-up-right-from-square']} />
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>NISN: {student.nisn || '-'}</span>
                        {student.program && (
                          <>
                            <span>•</span>
                            <span className="uppercase text-[11px] font-semibold text-slate-500">{student.program}</span>
                          </>
                        )}
                        {!student.is_active && (
                          <span className="text-rose-500 font-semibold">• Nonaktif</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {student.last_cbt_score !== null && student.last_cbt_score !== undefined ? (
                        <div>
                          <div
                            className={`font-black text-base ${
                              Number(student.last_cbt_score) >= 70
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {student.last_cbt_score} pts
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[220px] mx-auto" title={student.last_cbt_title}>
                            {student.last_cbt_title || 'Ujian CBT'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada ujian</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{student.last_activity}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {student.last_activity_at
                          ? new Date(student.last_activity_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </div>
                    </td>
                    <td className="p-3 text-right no-print">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRapor(student.id);
                        }}
                        className="group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs px-3 font-bold flex items-center justify-center whitespace-nowrap w-fit ml-auto"
                      >
                        <FontAwesomeIcon icon={['fas', 'id-card']} className="mr-2 text-blue-600 dark:text-blue-400 text-sm" />
                        Rapor
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-3xl mb-2 block">🎓</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {search ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Belum ada data siswa terdaftar pada sekolah ini.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {reportStudentId && (
        <StudentReportModal userId={reportStudentId} onClose={() => setReportStudentId(null)} />
      )}
    </AppLayout>
  );
}
