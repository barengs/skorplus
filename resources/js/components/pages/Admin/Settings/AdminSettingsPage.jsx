import React, { useState, useEffect } from 'react';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import FormField from '../../../molecules/FormField';
import Input from '../../../atoms/Input';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState({
    app_name: 'SkorPluss',
    tagline: 'Platform Pembelajaran & Ujian Online Terdepan',
    logo_url: '',
    default_language: 'id',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setFormData(res.data);
      if (res.data.logo_url) setLogoPreview(res.data.logo_url);
    } catch (err) {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post('/admin/upload/thumbnail', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormData({ ...formData, logo_url: res.data.url });
        setLogoPreview(res.data.url);
        toast.success('Logo berhasil diunggah');
      } catch (err) {
        toast.error('Gagal mengunggah logo');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', formData);
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Pengaturan">
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Pengaturan Sistem">
      <div className="max-w-2xl mx-auto pb-16">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Pengaturan Sistem</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Konfigurasi nama, logo, dan preferensi bahasa aplikasi</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8">
          {/* Logo Section */}
          <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Logo Aplikasi</h3>
            <div className="flex gap-8">
              {/* Logo Preview */}
              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center text-slate-400">
                    <div className="text-3xl mb-1"><FontAwesomeIcon icon={['fas', 'image']} /></div>
                    <p className="text-xs">Belum ada logo</p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1 flex flex-col justify-center">
                <label className="block mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </label>
                <p className="text-xs text-slate-500">Format: JPG, PNG, WebP. Maksimal 5MB</p>
              </div>
            </div>
          </div>

          {/* App Name */}
          <FormField label="Nama Aplikasi">
            <Input
              value={formData.app_name}
              onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
              placeholder="Contoh: SkorPluss"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Nama yang ditampilkan di navbar dan halaman login</p>
          </FormField>

          {/* Tagline */}
          <FormField label="Tagline / Deskripsi Singkat">
            <textarea
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Contoh: Platform Pembelajaran & Ujian Online Terdepan"
              rows={3}
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">Ditampilkan di landing page dan marketing materials</p>
          </FormField>

          {/* Default Language */}
          <FormField label="Bahasa Default">
            <select
              value={formData.default_language}
              onChange={(e) => setFormData({ ...formData, default_language: e.target.value })}
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
            >
              <option value="id">🇮🇩 Bahasa Indonesia</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Bahasa yang digunakan saat pengguna pertama kali membuka aplikasi</p>
          </FormField>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={fetchSettings}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              {saving ? 'Menyimpan...' : <><FontAwesomeIcon icon={['fas', 'floppy-disk']} /> Simpan Pengaturan</>}
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2">
            <FontAwesomeIcon icon={['fas', 'lightbulb']} className="mt-0.5 text-amber-500" />
            <span><strong>Tips:</strong> Perubahan pengaturan akan langsung terlihat setelah halaman di-refresh. Nama aplikasi akan muncul di navbar semua halaman.</span>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
