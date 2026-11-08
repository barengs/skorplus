import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { exportToCsv } from '../../../../utils/exportCsv';
import { printSchoolStudentsPDF } from '../../../../utils/pdfReportGenerator';
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
  const [statusFilter, setStatusFilter] = useState('all');
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
    if (statusFilter === 'all') return students;
    if (statusFilter === 'perlu_tindak_lanjut') {
      return students.filter((s) => s.follow_up?.status_key === 'perlu_tindak_lanjut' || (s.last_cbt_score !== null && Number(s.last_cbt_score) < 55));
    }
    if (statusFilter === 'mastered') {
      return students.filter((s) => s.follow_up?.status_key === 'mastered' || (s.irt?.predicted_utbk_score && s.irt.predicted_utbk_score >= 680));
    }
    return students.filter((s) => s.follow_up?.status_key === statusFilter);
  }, [students, statusFilter]);

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
      <div className="w-full pb-16 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/reports')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-sm font-semibold flex items-center gap-1.5"
              title="Kembali ke Laporan & Analitik"
            >
              <FontAwesomeIcon icon={['fas', 'arrow-left']} className="text-slate-500" />
              <span>Kembali</span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base shadow-sm">
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
              onClick={() => printSchoolStudentsPDF(school, students)}
              disabled={students.length === 0}
              title="Cetak rekapitulasi data siswa & hasil CBT sekolah ini (PDF)"
            >
              <FontAwesomeIcon icon={['fas', 'file-pdf']} className="mr-1.5 text-rose-600" /> Cetak PDF
            </Button>
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
              <FontAwesomeIcon icon={['fas', 'file-arrow-down']} className="mr-1.5 text-emerald-600" /> Ekspor CSV
            </Button>
            <Button variant="outline" onClick={() => fetchStudents(search.trim())} disabled={loading}>
              <FontAwesomeIcon icon={['fas', 'rotate-right']} className={`text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Total Siswa</div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{students.length}</div>
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
            <Button variant="primary" onClick={handleSearch} disabled={loading}>
              <FontAwesomeIcon icon={['fas', 'search']} className="mr-1.5 text-white" /> Cari
            </Button>
          </div>
        </div>

        {/* Students table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs overflow-x-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                <span>Daftar Siswa & Rencana Tindak Lanjut</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full">
                  {filteredStudents.length} Siswa
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengelompokan siswa berdasarkan estimasi kemampuan laten (IRT) dan penguasaan materi (BKT) untuk menentukan intervensi belajar.
              </p>
            </div>

            {/* Filter Klasifikasi Kelompok Siswa */}
            <div className="flex flex-wrap gap-1.5 no-print">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
              >
                Semua ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('perlu_tindak_lanjut')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'perlu_tindak_lanjut' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100'}`}
              >
                🚨 Butuh Pendampingan ({counts.perlu_tindak_lanjut})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('butuh_penguatan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'butuh_penguatan' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100'}`}
              >
                ⚠️ Butuh Penguatan ({counts.butuh_penguatan})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('mastered')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'mastered' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'}`}
              >
                🏆 Rekomendasi Lanjut ({counts.mastered})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('kompetitif')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'kompetitif' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100'}`}
              >
                🎯 Kompetitif ({counts.kompetitif})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold">Memuat data siswa...</p>
            </div>
          ) : filteredStudents.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa & Identitas</th>
                  <th className="p-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-center">Prediksi UTBK (IRT)</th>
                  <th className="p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-center">Penguasaan (BKT)</th>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Klasifikasi & Tindak Lanjut</th>
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((student) => {
                  const irtScore = student.irt?.predicted_utbk_score || (student.last_cbt_score !== null && student.last_cbt_score !== undefined ? Math.round(500 + ((Number(student.last_cbt_score) - 50) * 8)) : null);
                  const bktMastery = student.bkt?.mastery_percentage;
                  const followUp = student.follow_up || {};

                  return (
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
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>NISN: {student.nisn || '-'}</span>
                          <span>•</span>
                          <span className="uppercase text-[11px] font-semibold text-slate-500">{student.program || 'Reguler'}</span>
                          {student.class_level && student.class_level !== '-' && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] font-semibold text-slate-500">Kls {student.class_level}</span>
                            </>
                          )}
                          {!student.is_active && (
                            <span className="text-rose-500 font-semibold">• Nonaktif</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {irtScore ? (
                          <div>
                            <div className="font-black text-base text-indigo-600 dark:text-indigo-400">
                              {irtScore} pts
                            </div>
                            <div className="text-[10px] text-slate-400">
                              CBT: {student.last_cbt_score ?? '-'} pts {student.irt?.theta !== null && student.irt?.theta !== undefined ? `(θ ${student.irt.theta > 0 ? '+' : ''}${student.irt.theta})` : ''}
                            </div>
                            {student.irt?.weak_subtest && (
                              <div className="text-[10px] text-rose-500 truncate max-w-[160px] mx-auto font-medium mt-0.5" title={`Subtes Lemah: ${student.irt.weak_subtest}`}>
                                ⚠️ {student.irt.weak_subtest}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada ujian</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {bktMastery !== null && bktMastery !== undefined ? (
                          <div>
                            <div className={`font-black text-base ${bktMastery >= 80 ? 'text-emerald-600 dark:text-emerald-400' : (bktMastery >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400')}`}>
                              {bktMastery}%
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {student.bkt?.status_label || 'Terekam'}
                            </div>
                            {student.bkt?.weak_topic && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 truncate max-w-[160px] mx-auto font-medium mt-0.5" title={`Topik Lemah: ${student.bkt.weak_topic}`}>
                                ⚠️ {student.bkt.weak_topic}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada kuis</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1 max-w-[280px]">
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
                      </td>
                      <td className="p-3 text-right no-print">
                        <div className="flex items-center justify-end gap-1.5">
                          {followUp.whatsapp_url && (
                            <a
                              href={followUp.whatsapp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-all"
                              title="Hubungi Siswa via WhatsApp untuk tindak lanjut"
                            >
                              <FontAwesomeIcon icon={['fab', 'whatsapp']} className="text-sm" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRapor(student.id);
                            }}
                            className="group-hover:border-blue-500 group-hover:text-blue-600 text-xs px-2.5 font-bold flex items-center justify-center whitespace-nowrap"
                          >
                            <FontAwesomeIcon icon={['fas', 'chart-pie']} className="mr-1.5 text-blue-600 text-xs" />
                            Rapor
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-3xl mb-2 block">🎓</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {search ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Belum ada data siswa terdaftar pada kelompok ini.'}
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
