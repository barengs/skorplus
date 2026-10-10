import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../../../../templates/AppLayout';
import Button from '../../../../atoms/Button';
import Badge from '../../../../atoms/Badge';
import Avatar from '../../../../atoms/Avatar';
import api from '../../../../../services/api';
import { toast } from 'react-toastify';
import StudentReportModal from '../../Reports/StudentReportModal';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const fetchUserDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${id}`);
      setUser(res.data);
    } catch {
      toast.error('Gagal memuat data detail siswa');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const getProgramBadgeColor = (val) => {
    const colors = { mandiri: 'slate', intensif: 'blue', garansi: 'gold' };
    return colors[val?.toLowerCase()] || 'purple';
  };

  if (loading) {
    return (
      <AppLayout title="Detail Siswa">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 text-sm">Memuat detail siswa...</p>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const isSiswa = user.roles?.includes('siswa');
  const cbtSessions = user.cbt_sessions || [];

  return (
    <AppLayout title={`Detail Siswa — ${user.name}`}>
      <div className="w-full pb-16 space-y-6 max-w-6xl mx-auto">
        {/* Top Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kembali ke Kelola Pengguna"
            >
              ← Kembali
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{user.name}</h1>
                {user.is_active ? (
                  <Badge color="emerald">✓ Aktif</Badge>
                ) : (
                  <Badge color="slate">Nonaktif</Badge>
                )}
                {user.roles?.map((r) => (
                  <Badge key={r} color="blue">{r}</Badge>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">ID Pengguna: #{user.id} • Terdaftar sejak {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.phone && (
              <a
                href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>💬 Hubungi WhatsApp</span>
              </a>
            )}
            <Link to="/admin/users">
              <Button variant="ghost" size="sm">Kelola di Tabel</Button>
            </Link>
            {isSiswa && (
              <Button size="sm" onClick={() => setShowReport(true)} className="flex items-center gap-1.5">
                📋 Rapor Siswa
              </Button>
            )}
          </div>
        </div>

        {/* Hero Card / Bio Overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar
                src={user.avatar}
                name={user.name}
                size="2xl"
                className="w-24 h-24 text-2xl border-4 border-slate-100 dark:border-slate-800 shadow-md"
              />
              <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 ${user.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{user.email}</span>
                {user.program && (
                  <Badge color={getProgramBadgeColor(user.program)}>
                    Program: {user.program.toUpperCase()}
                  </Badge>
                )}
                {user.is_on_trial && (
                  <Badge color="gold">
                    ⚡ Trial Aktif ({user.trial_days_remaining} Hari Tersisa)
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400 pt-2">
                <div>
                  <span className="font-semibold text-slate-500 block text-xs">Asal Sekolah / Kampus:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{user.school_name || user.school || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-xs">NISN:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{user.nisn || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-xs">Nomor WhatsApp / HP:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{user.phone || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-xs">Jenis Kelamin:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{user.gender || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-xs">Tahun Lahir:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{user.birth_year || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-xs">Alamat Domisili:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{user.address || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* School Partnership & Learning Package Section */}
        {user.school_entity && (
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Kemitraan Sekolah Siswa</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{user.school_entity.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">NPSN: {user.school_entity.npsn || '-'} • Alamat: {user.school_entity.address || '-'}</p>
              </div>

              {user.school_packages && user.school_packages.length > 0 ? (
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-xs text-slate-500">Paket Belajar Aktif Sekolah:</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">{user.school_packages[0].name}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">Belum ada paket belajar mitra yang diaktifkan untuk sekolah ini.</div>
              )}
            </div>
          </div>
        )}

        {/* CBT Exam Sessions History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Riwayat Ujian CBT Siswa</h3>
              <p className="text-xs text-slate-500">Daftar simulasi dan tryout ujian yang telah dikerjakan oleh siswa ini</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Total {cbtSessions.length} Sesi Ujian
            </span>
          </div>

          {cbtSessions.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-3xl mb-2 block">📝</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada riwayat ujian CBT</p>
              <p className="text-xs text-slate-500 mt-1">Siswa ini belum pernah memulai atau menyelesaikan ujian tryout CBT.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Ujian / Tryout</th>
                    <th className="px-4 py-3">Waktu Mulai</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Skor Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cbtSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {session.exam?.title || `Ujian #${session.exam_id}`}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(session.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {session.status === 'completed' ? (
                          <Badge color="emerald">Selesai</Badge>
                        ) : session.status === 'in_progress' ? (
                          <Badge color="blue">Sedang Dikerjakan</Badge>
                        ) : (
                          <Badge color="slate">{session.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-slate-100">
                        {session.total_score !== null && session.total_score !== undefined ? (
                          <span className={session.total_score >= 65 ? 'text-emerald-500' : 'text-amber-500'}>
                            {session.total_score}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showReport && isSiswa && (
          <StudentReportModal userId={user.id} onClose={() => setShowReport(false)} />
        )}
      </div>
    </AppLayout>
  );
}
