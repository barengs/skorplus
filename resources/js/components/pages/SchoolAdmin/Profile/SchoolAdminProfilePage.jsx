import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import Badge from '../../../atoms/Badge';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SchoolAdminPackagesTab from './SchoolAdminPackagesTab';

export default function SchoolAdminProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', logo: '', photo: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const logoInputRef = useRef(null);
  const photoInputRef = useRef(null);

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
        logo: res.data.school?.logo || '',
        photo: res.data.school?.photo || '',
      });
    } catch {
      toast.error('Gagal memuat profil sekolah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleFileUpload = async (file, type = 'thumbnail') => {
    if (!file) return null;
    const form = new FormData();
    form.append('file', file);
    const endpoint = type === 'thumbnail' ? '/admin/upload/thumbnail' : '/upload/avatar';
    const res = await api.post(endpoint, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  };

  const onLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await handleFileUpload(file, 'thumbnail');
      if (url) {
        setFormData(prev => ({ ...prev, logo: url }));
        toast.success('Logo sekolah berhasil diunggah!');
      }
    } catch {
      toast.error('Gagal mengunggah logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const onPhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await handleFileUpload(file, 'thumbnail');
      if (url) {
        setFormData(prev => ({ ...prev, photo: url }));
        toast.success('Foto gedung sekolah berhasil diunggah!');
      }
    } catch {
      toast.error('Gagal mengunggah foto sekolah');
    } finally {
      setUploadingPhoto(false);
    }
  };

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
    <AppLayout title="Profil & Kemitraan Sekolah">
      <div className="w-full max-w-4xl pb-16 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'school']} className="mr-1.5" /> Profil Sekolah
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'packages'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'cubes']} className="mr-1.5" /> Paket & Kontrak Berlangganan
          </button>
        </div>

        {activeTab === 'packages' ? (
          <SchoolAdminPackagesTab school={school} />
        ) : (
          <>
        {/* Header Banner with Photo Cover */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Cover Photo */}
          <div className="h-48 sm:h-56 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 relative">
            {formData.photo ? (
              <img src={formData.photo} alt="Foto Sekolah" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FontAwesomeIcon icon={['fas', 'school']} className="text-6xl text-slate-300 dark:text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          {/* Logo Badge */}
          <div className="absolute -bottom-8 left-6">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center overflow-hidden">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo Sekolah" className="w-full h-full object-contain" />
              ) : (
                <FontAwesomeIcon icon={['fas', 'school']} className="text-3xl text-slate-400" />
              )}
            </div>
          </div>
          {/* School Info */}
          <div className="bg-white dark:bg-slate-900 p-6 pt-12">
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

            {/* Logo Upload */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Logo Sekolah
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : (
                    <FontAwesomeIcon icon={['fas', 'school']} className="text-2xl text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={onLogoFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Mengunggah...' : 'Pilih File Logo'}
                  </Button>
                  <Input
                    placeholder="Atau masukkan URL logo..."
                    value={formData.logo}
                    onChange={e => setFormData({ ...formData, logo: e.target.value })}
                    className="mt-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Foto Gedung / Lingkungan Sekolah
              </label>
              <div className="w-full h-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden mb-3 flex items-center justify-center">
                {formData.photo ? (
                  <img src={formData.photo} alt="Building preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                    <FontAwesomeIcon icon={['fas', 'image']} className="text-2xl" />
                    <span>Belum ada foto gedung</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={photoInputRef}
                onChange={onPhotoFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Mengunggah...' : 'Pilih Foto Gedung'}
              </Button>
              <Input
                placeholder="Atau masukkan URL foto gedung..."
                value={formData.photo}
                onChange={e => setFormData({ ...formData, photo: e.target.value })}
                className="mt-2 text-xs"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={saving || uploadingLogo || uploadingPhoto}>
                {saving ? 'Menyimpan...' : 'Perbarui Profil Sekolah'}
              </Button>
            </div>
          </form>
        </div>
        </>
        )}
      </div>
    </AppLayout>
  );
}
