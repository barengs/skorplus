import React, { useState, useEffect } from 'react';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function SchoolAdminPackagesTab({ school }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Contact Modal
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/school-admin/packages');
      setPackages(res.data.packages || []);
      setTotalStudents(res.data.total_students || 0);
    } catch {
      toast.error('Gagal memuat paket sekolah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openHistoryModal = async (pkg) => {
    setSelectedPackage(pkg);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/school-admin/packages/${pkg.id}/history`);
      setHistoryList(res.data.renewals || []);
    } catch {
      toast.error('Gagal memuat riwayat kontrak');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleContactAdmin = (pkg) => {
    setSelectedPackage(pkg);
    setContactModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2">
              <FontAwesomeIcon icon={['fas', 'shield-halved']} /> Layanan Kerja Sama Resmi SkorPluss
            </div>
            <h3 className="text-2xl font-black">{school?.name || 'Sekolah'}</h3>
            <p className="text-sm text-blue-200/90 mt-1 max-w-xl">
              Berikut adalah paket program pembelajaran bimbel, fasilitas modul, dan tryout CBT yang dapat diakses oleh seluruh siswa Anda.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[100px] border border-white/10">
              <div className="text-xs text-blue-200">Paket Aktif</div>
              <div className="text-2xl font-black">{packages.filter(p => !p.is_expired).length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[100px] border border-white/10">
              <div className="text-xs text-blue-200">Siswa Terdaftar</div>
              <div className="text-2xl font-black">{totalStudents}</div>
            </div>
          </div>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <FontAwesomeIcon icon={['fas', 'file-contract']} className="text-5xl text-slate-300 dark:text-slate-600 mb-3" />
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Belum Ada Paket Belajar</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Sekolah Anda saat ini belum memiliki paket program aktif. Silakan hubungi tim SkorPluss untuk mengaktifkan paket belajar bagi siswa Anda.
          </p>
          <Button onClick={() => setContactModalOpen(true)}>
            <FontAwesomeIcon icon={['fas', 'headset']} className="mr-2" /> Hubungi Admin SkorPluss
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Daftar Paket & Rincian Kontrak
          </h4>

          <div className="grid md:grid-cols-2 gap-5">
            {packages.map((pkg) => {
              const isExpiringSoon = !pkg.is_expired && pkg.days_remaining <= 30;
              const quotaPercent = pkg.max_students ? Math.min(100, Math.round((totalStudents / pkg.max_students) * 100)) : 0;

              return (
                <div
                  key={pkg.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Status Alert Banner if Expiring */}
                    {isExpiringSoon && (
                      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                        <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="text-amber-600 mt-0.5" />
                        <div>
                          <strong>Perhatian:</strong> Masa aktif paket ini tersisa <strong>{pkg.days_remaining} hari lagi</strong>. Segera ajukan perpanjangan agar akses materi siswa tidak terputus.
                        </div>
                      </div>
                    )}

                    {pkg.is_expired && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
                        <FontAwesomeIcon icon={['fas', 'circle-exclamation']} className="text-red-600 mt-0.5" />
                        <div>
                          <strong>Masa Aktif Berakhir:</strong> Paket ini telah kedaluwarsa. Silakan lakukan perpanjangan kontrak untuk mengaktifkan kembali akses siswa.
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {pkg.thumbnail ? (
                          <img src={pkg.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover border" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center text-2xl font-black">
                            <FontAwesomeIcon icon={['fas', 'cube']} />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{pkg.package_name}</h4>
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded text-slate-700 dark:text-slate-300 inline-block mt-0.5">
                            No. Kontrak: {pkg.current_contract_number || '-'}
                          </span>
                        </div>
                      </div>
                      {pkg.is_expired ? (
                        <Badge color="red">Kedaluwarsa</Badge>
                      ) : isExpiringSoon ? (
                        <Badge color="amber">Segera Berakhir</Badge>
                      ) : (
                        <Badge color="emerald">✓ Aktif</Badge>
                      )}
                    </div>

                    {pkg.package_description && (
                      <p className="text-xs text-slate-500 mb-4">{pkg.package_description}</p>
                    )}

                    {/* Contract Details Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 mb-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Masa Kontrak:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {pkg.start_date} s/d {pkg.end_date}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sisa Masa Aktif:</span>
                        <span className={`font-bold ${pkg.is_expired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {pkg.is_expired ? 'Kedaluwarsa' : `${pkg.days_remaining} Hari lagi`}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-slate-500">Penggunaan Kuota Siswa:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {totalStudents} / {pkg.max_students ? `${pkg.max_students} Siswa` : 'Unlimited'}
                          </span>
                        </div>
                        {pkg.max_students && (
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                quotaPercent > 90 ? 'bg-red-500' : quotaPercent > 75 ? 'bg-amber-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${quotaPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Included Materials List */}
                    {pkg.courses && pkg.courses.length > 0 && (
                      <div className="mb-4">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                          Materi Pembelajaran yang Didapat Siswa ({pkg.courses.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pkg.courses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                            >
                              <FontAwesomeIcon icon={['fas', 'book-open']} className="text-blue-500 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{course.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openHistoryModal(pkg)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <FontAwesomeIcon icon={['fas', 'clock-rotate-left']} /> Riwayat Addendum ({pkg.renewals_count})
                    </button>

                    <Button
                      size="sm"
                      onClick={() => handleContactAdmin(pkg)}
                      className="text-xs"
                    >
                      <FontAwesomeIcon icon={['fas', 'phone']} className="mr-1" /> Ajukan Perpanjangan
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Riwayat Kontrak & Addendum */}
      {historyModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'clock-rotate-left']} className="text-blue-500" />
                  Riwayat Kontrak & Addendum
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paket: <strong>{selectedPackage.package_name}</strong>
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setHistoryModalOpen(false)}>
                ✕
              </Button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : historyList.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">Belum ada riwayat perpanjangan.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {historyList.map((hist) => (
                  <div
                    key={hist.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {hist.contract_number}
                      </span>
                      <Badge color={hist.renewal_type === 'initial' ? 'blue' : 'emerald'}>
                        {hist.renewal_type === 'initial' ? 'Kontrak Awal' : 'Perpanjangan (Addendum)'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 mt-2">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Berlaku Sampai:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {hist.new_end_date}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Batas Kuota Siswa:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {hist.quota_students ? `${hist.quota_students} Siswa` : 'Unlimited'}
                        </span>
                      </div>
                    </div>

                    {hist.notes && (
                      <p className="italic text-slate-500 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        "{hist.notes}"
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 mt-2">
                      Tanggal Surat: {hist.renewal_date || hist.created_at?.split('T')[0]}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <Button variant="ghost" onClick={() => setHistoryModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajukan Perpanjangan Kontrak */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mx-auto mb-4">
              <FontAwesomeIcon icon={['fas', 'headset']} />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Ajukan Perpanjangan Kontrak
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Untuk memperpanjang masa berlaku paket atau menambah kuota siswa, silakan hubungi tim kemitraan SkorPluss melalui kontak di bawah ini:
            </p>

            <div className="space-y-3 mb-6 text-left">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <FontAwesomeIcon icon={['fas', 'phone']} className="text-emerald-500 text-lg" />
                <div>
                  <div className="text-xs text-slate-400">WhatsApp Hotline Kemitraan:</div>
                  <a
                    href="https://wa.me/6281234567890?text=Halo%20Admin%20SkorPluss,%20kami%20dari%20pihak%20sekolah%20ingin%20mengajukan%20perpanjangan%20kontrak%20paket%20pembelajaran."
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    +62 812-3456-7890 (Klik untuk WhatsApp)
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <FontAwesomeIcon icon={['fas', 'envelope']} className="text-blue-500 text-lg" />
                <div>
                  <div className="text-xs text-slate-400">Email Resmi Kemitraan:</div>
                  <a
                    href="mailto:partnership@skorpluss.com?subject=Permohonan%20Perpanjangan%20Kontrak%20Sekolah"
                    className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    partnership@skorpluss.com
                  </a>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setContactModalOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
