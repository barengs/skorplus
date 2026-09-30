import React, { useState, useEffect } from 'react';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import Badge from '../../../atoms/Badge';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function SchoolAdminProfilePage() {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school-admin/profile');
      setSchool(res.data.school);
      setFormData({
        name: res.data.school?.name || '',
        phone: res.data.school?.phone || '',
        email: res.data.school?.email || '',
        address: res.data.school?.address || '',
      });
    } catch {
      toast.error('Gagal memuat profil sekolah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/school-admin/profile', formData);
      setSchool(res.data.school);
      toast.success('Profil sekolah berhasil diperbarui!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Profil Sekolah">
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profil Sekolah">
      <div className="max-w-3xl pb-16 space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/25">
              <FontAwesomeIcon icon={['fas', 'school']} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {school?.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {school?.npsn && (
                  <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono px-2 py-0.5 rounded">
                    NPSN: {school?.npsn}
                  </span>
                )}
                <Badge color="emerald">Mitra Sekolah Aktif</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI count */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500">Total Siswa Terdaftar</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{school?.students_count || 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500">Admin Sekolah Terdaftar</div>
            <div className="text-2xl font-black text-purple-600 mt-1">{school?.admins_count || 0}</div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-4">
            Informasi Sekolah
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nama Sekolah <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Resmi Sekolah
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  No. Telepon / Kantor
                </label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Alamat Sekolah
              </label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Perbarui Profil Sekolah'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
