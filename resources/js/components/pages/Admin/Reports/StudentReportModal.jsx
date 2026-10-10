import React, { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Badge from '../../../atoms/Badge';
import Button from '../../../atoms/Button';

export default function StudentReportModal({ userId, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // For Detail CBT Session
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchReport();
    }
  }, [userId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}/report`);
      setReport(res.data);
    } catch {
      toast.error('Gagal memuat rapor siswa.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetail = async (sessionId) => {
    setDetailLoading(true);
    setSelectedSessionId(sessionId);
    try {
      const res = await api.get(`/admin/cbt/sessions/${sessionId}/detail`);
      setSessionDetail(res.data);
    } catch {
      toast.error('Gagal memuat detail pengerjaan soal.');
      setSelectedSessionId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-600 dark:text-slate-300 font-semibold">Memuat Rapor Siswa...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const { student, summary, subtest_stats, exam_history, learning_progress } = report;

  // Render detail pengerjaan ujian CBT
  if (selectedSessionId && sessionDetail) {
    const { session, items } = sessionDetail;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto pt-10 pb-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden print-area flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h2 className="font-black text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FontAwesomeIcon icon={['fas', 'file-lines']} className="text-purple-500" /> Detail Pengerjaan Ujian
              </h2>
              <p className="text-xs text-slate-500 mt-1">{session.exam_title} • {session.student_name}</p>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={() => setSelectedSessionId(null)}>← Kembali</Button>
              <Button size="sm" onClick={handlePrint}><FontAwesomeIcon icon={['fas', 'print']} /> Cetak</Button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 text-center">
                   <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{session.correct_count}</div>
                   <div className="text-[10px] uppercase font-bold text-emerald-700/70 dark:text-emerald-500">Benar</div>
                </div>
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 text-center">
                   <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{session.wrong_count}</div>
                   <div className="text-[10px] uppercase font-bold text-rose-700/70 dark:text-rose-500">Salah</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/50 text-center">
                   <div className="text-2xl font-black text-slate-600 dark:text-slate-400">{session.empty_count}</div>
                   <div className="text-[10px] uppercase font-bold text-slate-500">Kosong</div>
                </div>
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-center">
                   <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{session.score}</div>
                   <div className="text-[10px] uppercase font-bold text-blue-700/70 dark:text-blue-500">Skor Akhir</div>
                </div>
             </div>

             <div className="space-y-4">
               {items.map((q, idx) => (
                 <div key={idx} className={`p-4 rounded-xl border ${q.is_correct ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-900/10' : (q.is_answered ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-900/10' : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30')}`}>
                    <div className="flex gap-4">
                       <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg font-black text-sm ${q.is_correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400' : (q.is_answered ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400')}`}>
                         {q.number}
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                             <Badge color="slate">{q.subtest}</Badge>
                             {q.is_correct ? <Badge color="emerald">Benar</Badge> : (q.is_answered ? <Badge color="rose">Salah</Badge> : <Badge color="slate">Kosong</Badge>)}
                          </div>
                          
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3" dangerouslySetInnerHTML={{__html: q.question_text}} />
                          
                          <div className="grid sm:grid-cols-2 gap-4 mt-4">
                             <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Jawaban Siswa:</span>
                                <div className={`px-3 py-2 rounded border text-sm font-semibold ${q.is_correct ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : (q.is_answered ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400' : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800')}`}>
                                  {q.is_answered ? (
                                     q.question_type === 'single_choice' ? (q.options[q.selected_option] || q.selected_option) : JSON.stringify(q.selected_option)
                                  ) : 'Tidak Menjawab'}
                                </div>
                             </div>
                             <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Kunci Jawaban:</span>
                                <div className="px-3 py-2 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm font-semibold">
                                  {q.question_type === 'single_choice' ? (q.options[q.correct_option] || q.correct_option) : JSON.stringify(q.correct_option)}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Rapor Siswa Utama
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto pt-10 pb-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden print-area flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h2 className="font-black text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'id-card']} className="text-blue-500" /> Rapor Akademik Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">Laporan komprehensif performa tryout & kemajuan belajar</p>
          </div>
          <div className="flex gap-2 no-print">
             <Button variant="outline" size="sm" onClick={onClose}>Batal / Tutup</Button>
             <Button size="sm" onClick={handlePrint}><FontAwesomeIcon icon={['fas', 'print']} /> Cetak PDF</Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 bg-slate-50/30 dark:bg-slate-950/50">
           
           {/* Section 1: Identitas & Overview KPI */}
           <div className="flex flex-col lg:flex-row gap-6">
              {/* Identitas Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1 shadow-sm">
                 <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                       <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Identitas Peserta Didik</div>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{student.name}</h3>
                       <div className="text-sm text-slate-500">{student.school}</div>
                    </div>
                    <Badge color={summary.predicated_color} className="text-sm px-3 py-1.5 shadow-sm">
                       Predikat: {summary.predicated}
                    </Badge>
                 </div>
                 <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div>
                       <span className="block text-[11px] text-slate-400 font-semibold mb-0.5">NISN / ID</span>
                       <span className="font-medium text-slate-800 dark:text-slate-200">{student.nisn || student.id}</span>
                    </div>
                    <div>
                       <span className="block text-[11px] text-slate-400 font-semibold mb-0.5">Program</span>
                       <span className="font-medium text-slate-800 dark:text-slate-200 uppercase">{student.program || 'Umum'}</span>
                    </div>
                    <div>
                       <span className="block text-[11px] text-slate-400 font-semibold mb-0.5">Status Akun</span>
                       <span className="font-medium text-emerald-600 dark:text-emerald-400">Aktif</span>
                    </div>
                    <div>
                       <span className="block text-[11px] text-slate-400 font-semibold mb-0.5">Tanggal Terdaftar</span>
                       <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(student.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                 </div>
              </div>

              {/* KPI Mini */}
              <div className="grid grid-cols-2 gap-4 lg:w-96 shrink-0">
                 <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md flex flex-col justify-center">
                    <FontAwesomeIcon icon={['fas', 'gauge-high']} className="text-2xl opacity-80 mb-2" />
                    <div className="text-3xl font-black">{summary.avg_cbt_score}</div>
                    <div className="text-xs font-medium opacity-90 mt-1">Rata-rata Skor CBT</div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                    <FontAwesomeIcon icon={['fas', 'check-double']} className="text-emerald-500 text-2xl mb-2" />
                    <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{summary.pass_rate}%</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">Tingkat Kelulusan</div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                    <FontAwesomeIcon icon={['fas', 'book-open-reader']} className="text-purple-500 text-2xl mb-2" />
                    <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{summary.courses_enrolled}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">Total Kursus Diikuti</div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                    <FontAwesomeIcon icon={['fas', 'bars-progress']} className="text-amber-500 text-2xl mb-2" />
                    <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{summary.avg_progress}%</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">Progres E-Learning</div>
                 </div>
              </div>
           </div>

           {/* Section 2: Kompetensi & Akurasi Subtest */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-lg">Analisis Kompetensi & Akurasi Subtest</h3>
              {subtest_stats.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {subtest_stats.map((st, i) => (
                       <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                          <div className="text-xs font-bold text-slate-500 uppercase truncate mb-2">{st.subtest}</div>
                          <div className="flex items-end justify-between">
                             <div>
                                <span className={`text-xl font-black ${st.accuracy >= 70 ? 'text-emerald-500' : (st.accuracy >= 40 ? 'text-amber-500' : 'text-rose-500')}`}>
                                   {st.accuracy}%
                                </span>
                             </div>
                             <div className="text-[10px] font-semibold text-slate-400 text-right">
                                {st.correct} / {st.total} Benar
                             </div>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className={`h-full rounded-full ${st.accuracy >= 70 ? 'bg-emerald-500' : (st.accuracy >= 40 ? 'bg-amber-500' : 'bg-rose-500')}`} style={{width: `${st.accuracy}%`}}></div>
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl">Siswa belum mengerjakan soal CBT apapun.</div>
              )}
           </div>

           {/* Section 3: Riwayat CBT */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-lg">Riwayat Ujian (CBT Tryout)</h3>
              {exam_history.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                       <thead>
                          <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                             <th className="py-3 px-2 font-bold text-slate-600 dark:text-slate-300">Tanggal</th>
                             <th className="py-3 px-2 font-bold text-slate-600 dark:text-slate-300">Paket Ujian / Tryout</th>
                             <th className="py-3 px-2 font-bold text-slate-600 dark:text-slate-300 text-center">Skor</th>
                             <th className="py-3 px-2 font-bold text-slate-600 dark:text-slate-300 text-center">Status</th>
                             <th className="py-3 px-2 font-bold text-slate-600 dark:text-slate-300 text-right no-print">Aksi</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {exam_history.map(ex => (
                             <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="py-3 px-2 text-slate-500 text-xs">{new Date(ex.submitted_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</td>
                                <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200">{ex.title}</td>
                                <td className="py-3 px-2 text-center font-black text-slate-900 dark:text-slate-100">{ex.score}</td>
                                <td className="py-3 px-2 text-center">
                                   <Badge color={ex.is_pass ? 'emerald' : 'rose'}>{ex.is_pass ? 'Lulus' : 'Remedial'}</Badge>
                                </td>
                                <td className="py-3 px-2 text-right no-print">
                                   <Button variant="ghost" size="sm" onClick={() => fetchSessionDetail(ex.id)}>Lihat Detail Soal</Button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              ) : (
                 <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl">Belum ada riwayat ujian.</div>
              )}
           </div>

           {/* Section 4: Laporan E-Learning */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-lg">Progres Kelas & E-Learning</h3>
              {learning_progress.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {learning_progress.map(lp => (
                       <div key={lp.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div>
                             <div className="font-bold text-slate-800 dark:text-slate-200">{lp.course_title}</div>
                             <div className="text-xs text-slate-500 mt-1">{lp.completed_lessons} / {lp.total_lessons} Materi Selesai</div>
                          </div>
                          <div className="text-right shrink-0">
                             <div className={`text-xl font-black ${lp.progress_percentage >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>{lp.progress_percentage}%</div>
                             <div className="text-[10px] text-slate-400 mt-0.5">Tuntas</div>
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl">Belum ada kelas E-Learning yang diikuti.</div>
              )}
           </div>

        </div>
      </div>
    </div>
  );
}
