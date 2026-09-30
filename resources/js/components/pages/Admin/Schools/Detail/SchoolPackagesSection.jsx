import React, { useState, useEffect } from 'react';
import Button from '../../../../atoms/Button';
import Badge from '../../../../atoms/Badge';
import Input from '../../../../atoms/Input';
import FormField from '../../../../molecules/FormField';
import api from '../../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function SchoolPackagesSection({ schoolId, schoolName, totalStudents = 0 }) {
  const [packages, setPackages] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Package Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    learning_package_id: '',
    contract_number: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    max_students: 100,
    notes: '',
  });
  const [assigning, setAssigning] = useState(false);

  // Renew Modal
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [renewForm, setRenewForm] = useState({
    contract_number: '',
    renewal_type: 'renewal',
    extension_months: '12',
    new_end_date: '',
    quota_students: 100,
    notes: '',
  });
  const [renewing, setRenewing] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/schools/${schoolId}/packages`);
      setPackages(res.data.packages || []);
      setAvailablePackages(res.data.available_packages || []);
    } catch {
      toast.error('Gagal memuat paket sekolah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) fetchPackages();
  }, [schoolId]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.learning_package_id) {
      toast.error('Silakan pilih paket belajar');
      return;
    }
    setAssigning(true);
    try {
      await api.post(`/admin/schools/${schoolId}/packages`, assignForm);
      toast.success('Paket berhasil ditetapkan ke sekolah!');
      setAssignModalOpen(false);
      setAssignForm({
        learning_package_id: '',
        contract_number: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        max_students: 100,
        notes: '',
      });
      fetchPackages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menetapkan paket');
    } finally {
      setAssigning(false);
    }
  };

  const openRenewModal = (pkg) => {
    setSelectedPackage(pkg);
    const currEnd = pkg.end_date ? new Date(pkg.end_date) : new Date();
    // Default +1 year from previous end date or today
    const baseDate = currEnd > new Date() ? currEnd : new Date();
    const newEnd = new Date(baseDate);
    newEnd.setFullYear(newEnd.getFullYear() + 1);

    setRenewForm({
      contract_number: `ADD-${pkg.current_contract_number || '001'}-${new Date().getFullYear()}`,
      renewal_type: 'renewal',
      extension_months: '12',
      new_end_date: newEnd.toISOString().split('T')[0],
      quota_students: pkg.max_students || 100,
      notes: '',
    });
    setRenewModalOpen(true);
  };

  const handleExtensionMonthsChange = (months) => {
    if (!selectedPackage) return;
    const currEnd = selectedPackage.end_date ? new Date(selectedPackage.end_date) : new Date();
    const baseDate = currEnd > new Date() ? currEnd : new Date();
    const newEnd = new Date(baseDate);
    newEnd.setMonth(newEnd.getMonth() + parseInt(months));
    setRenewForm({
      ...renewForm,
      extension_months: months,
      new_end_date: newEnd.toISOString().split('T')[0],
    });
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return;
    setRenewing(true);
    try {
      await api.post(`/admin/schools/${schoolId}/packages/${selectedPackage.id}/renew`, renewForm);
      toast.success('Kontrak berhasil diperpanjang!');
      setRenewModalOpen(false);
      fetchPackages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperpanjang kontrak');
    } finally {
      setRenewing(false);
    }
  };

  const openHistoryModal = async (pkg) => {
    setSelectedPackage(pkg);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/admin/schools/${schoolId}/packages/${pkg.id}/history`);
      setHistoryList(res.data.renewals || []);
    } catch {
      toast.error('Gagal memuat riwayat kontrak');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRemovePackage = async (pkg) => {
    if (confirm(`Yakin ingin mencabut paket "${pkg.package_name}" dari sekolah ini? Siswa tidak akan dapat mengakses materi paket ini lagi.`)) {
      try {
        await api.delete(`/admin/schools/${schoolId}/packages/${pkg.id}`);
        toast.success('Paket berhasil dicabut');
        fetchPackages();
      } catch {
        toast.error('Gagal mencabut paket');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={['fas', 'cubes']} className="text-amber-500" />
            Paket & Kontrak Berlangganan ({packages.length})
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Daftar paket pembelajaran aktif, kuota siswa, dan manajemen perpanjangan kontrak untuk {schoolName}.
          </p>
        </div>
        <Button size="sm" onClick={() => setAssignModalOpen(true)}>
          <FontAwesomeIcon icon={['fas', 'plus']} className="mr-1.5" /> Tetapkan Paket Baru
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <FontAwesomeIcon icon={['fas', 'file-contract']} className="text-4xl text-slate-300 dark:text-slate-600 mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Paket yang Ditetapkan</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Sekolah ini belum memiliki paket pembelajaran. Tetapkan paket agar siswa dari sekolah ini dapat mengakses materi dan ujian CBT.
          </p>
          <Button size="sm" onClick={() => setAssignModalOpen(true)}>
            <FontAwesomeIcon icon={['fas', 'plus']} className="mr-1.5" /> Tetapkan Paket Pertama
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {packages.map((pkg) => {
            const isExpiringSoon = !pkg.is_expired && pkg.days_remaining <= 30;
            const quotaPercent = pkg.max_students ? Math.min(100, Math.round((totalStudents / pkg.max_students) * 100)) : 0;

            return (
              <div
                key={pkg.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {pkg.thumbnail ? (
                        <img src={pkg.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl font-bold">
                          <FontAwesomeIcon icon={['fas', 'cube']} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{pkg.package_name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                            {pkg.current_contract_number || 'Tanpa No. Kontrak'}
                          </span>
                          <span className="text-xs text-slate-400">• {pkg.courses_count} Kursus</span>
                        </div>
                      </div>
                    </div>
                    {pkg.is_expired ? (
                      <Badge color="red">Kedaluwarsa</Badge>
                    ) : isExpiringSoon ? (
                      <Badge color="amber">Segera Berakhir</Badge>
                    ) : (
                      <Badge color="emerald">Aktif</Badge>
                    )}
                  </div>

                  {pkg.package_description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{pkg.package_description}</p>
                  )}

                  {/* Period & Quota Stats */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs mb-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Masa Berlaku</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {pkg.start_date || '-'} s/d {pkg.end_date || '-'}
                      </span>
                      <span className={`block font-semibold mt-0.5 ${pkg.is_expired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {pkg.is_expired ? `Lewat ${Math.abs(pkg.days_remaining)} hari` : `Sisa ${pkg.days_remaining} hari lagi`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Penggunaan Kuota</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {totalStudents} / {pkg.max_students ? `${pkg.max_students} Siswa` : 'Unlimited'}
                      </span>
                      {pkg.max_students && (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${quotaPercent > 90 ? 'bg-red-500' : quotaPercent > 75 ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${quotaPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Included Courses Preview */}
                  {pkg.courses && pkg.courses.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Materi Tersedia Untuk Siswa:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.courses.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded"
                          >
                            {c.title}
                          </span>
                        ))}
                        {pkg.courses.length > 3 && (
                          <span className="text-xs text-slate-400 self-center">
                            +{pkg.courses.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openHistoryModal(pkg)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <FontAwesomeIcon icon={['fas', 'clock-rotate-left']} /> Riwayat Kontrak ({pkg.renewals_count})
                  </button>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => openRenewModal(pkg)}
                    >
                      <FontAwesomeIcon icon={['fas', 'calendar-plus']} className="mr-1 text-emerald-500" /> Perpanjang
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 text-xs"
                      onClick={() => handleRemovePackage(pkg)}
                    >
                      Cabut
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tetapkan Paket Baru */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              Tetapkan Paket Pembelajaran
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pilih paket belajar yang dibeli oleh {schoolName} sesuai MoU/kontrak.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <FormField label="Pilih Paket Belajar *">
                <select
                  value={assignForm.learning_package_id}
                  onChange={(e) => setAssignForm({ ...assignForm, learning_package_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">-- Pilih Paket Pembelajaran --</option>
                  {availablePackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.price ? `- Rp ${parseInt(p.price).toLocaleString('id-ID')}` : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Nomor Kontrak / MoU *">
                <Input
                  value={assignForm.contract_number}
                  onChange={(e) => setAssignForm({ ...assignForm, contract_number: e.target.value })}
                  placeholder="Contoh: KTR/2026/09/SMAN1-001"
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tanggal Mulai *">
                  <Input
                    type="date"
                    value={assignForm.start_date}
                    onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                    required
                  />
                </FormField>
                <FormField label="Tanggal Berakhir *">
                  <Input
                    type="date"
                    value={assignForm.end_date}
                    onChange={(e) => setAssignForm({ ...assignForm, end_date: e.target.value })}
                    required
                  />
                </FormField>
              </div>

              <FormField label="Kuota Siswa (Kosongkan jika Tanpa Batas)">
                <Input
                  type="number"
                  min="1"
                  value={assignForm.max_students}
                  onChange={(e) => setAssignForm({ ...assignForm, max_students: e.target.value })}
                  placeholder="Contoh: 100"
                />
              </FormField>

              <FormField label="Catatan Kontrak / Keterangan Khusus">
                <textarea
                  rows="2"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Catatan tambahan kerja sama..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setAssignModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={assigning}>
                  {assigning ? 'Menyimpan...' : 'Tetapkan Paket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Perpanjang Kontrak */}
      {renewModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'calendar-plus']} className="text-emerald-500" />
              Perpanjang Kontrak Paket
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui masa berlaku paket <strong>{selectedPackage.package_name}</strong> untuk {schoolName}.
            </p>

            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <FormField label="Nomor Addendum / Surat Perpanjangan *">
                <Input
                  value={renewForm.contract_number}
                  onChange={(e) => setRenewForm({ ...renewForm, contract_number: e.target.value })}
                  placeholder="Contoh: ADD/2027/SMAN1-001"
                  required
                />
              </FormField>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilihan Durasi Perpanjangan:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '+3 Bulan', val: '3' },
                    { label: '+6 Bulan', val: '6' },
                    { label: '+1 Tahun', val: '12' },
                    { label: '+2 Tahun', val: '24' },
                  ].map((dur) => (
                    <button
                      type="button"
                      key={dur.val}
                      onClick={() => handleExtensionMonthsChange(dur.val)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                        renewForm.extension_months === dur.val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tanggal Berakhir Baru *">
                  <Input
                    type="date"
                    value={renewForm.new_end_date}
                    onChange={(e) => setRenewForm({ ...renewForm, new_end_date: e.target.value, extension_months: 'custom' })}
                    required
                  />
                </FormField>
                <FormField label="Perbarui Kuota Siswa">
                  <Input
                    type="number"
                    min="1"
                    value={renewForm.quota_students}
                    onChange={(e) => setRenewForm({ ...renewForm, quota_students: e.target.value })}
                    placeholder="Contoh: 150"
                  />
                </FormField>
              </div>

              <FormField label="Catatan Perpanjangan / Addendum">
                <textarea
                  rows="2"
                  value={renewForm.notes}
                  onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
                  placeholder="Catatan penyesuaian biaya, penambahan kelas, dll..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setRenewModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={renewing}>
                  {renewing ? 'Memproses...' : 'Simpan Perpanjangan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Riwayat Kontrak & Perpanjangan */}
      {historyModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'clock-rotate-left']} className="text-blue-500" />
                  Riwayat Kontrak & Addendum
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paket: <strong>{selectedPackage.package_name}</strong> • {schoolName}
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
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {historyList.map((hist, idx) => (
                  <div
                    key={hist.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 relative"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {hist.contract_number}
                      </span>
                      <Badge color={hist.renewal_type === 'initial' ? 'blue' : 'emerald'}>
                        {hist.renewal_type === 'initial' ? 'Kontrak Awal' : 'Perpanjangan (Addendum)'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Periode Akhir Baru:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {hist.new_end_date}
                        </span>
                        {hist.previous_end_date && (
                          <span className="text-[10px] text-slate-400 block">
                            (Sebelumnya: {hist.previous_end_date})
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Kuota Siswa:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {hist.quota_students ? `${hist.quota_students} Siswa` : 'Unlimited'}
                        </span>
                      </div>
                    </div>

                    {hist.notes && (
                      <p className="text-xs text-slate-500 italic mt-2 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                        "{hist.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1">
                      <span>Dibuat: {hist.renewal_date || hist.created_at?.split('T')[0]}</span>
                      {hist.renewed_by && <span>Oleh: Admin #{hist.renewed_by}</span>}
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
    </div>
  );
}
