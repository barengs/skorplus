import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Avatar from '../../../atoms/Avatar';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import { updateProfile } from '../../../../features/auth/authSlice';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compressImageToFile } from '../../../../utils/imageCompressor';
import {
  faUserTie,
  faPhone,
  faUniversity,
  faBookOpen,
  faVenusMars,
  faLock,
  faCamera,
  faSave,
  faShieldAlt,
  faShareAlt,
} from '@fortawesome/free-solid-svg-icons';

export default function TutorProfileView() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('biodata');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    alma_mater: '',
    gender: '',
    address: '',
    bio: '',
    avatar: '',
    social_media: {
      instagram: '',
      linkedin: '',
      twitter: '',
      tiktok: '',
    },
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        specialization: user.specialization || '',
        alma_mater: user.alma_mater || user.school || '',
        gender: user.gender || '',
        address: user.address || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        social_media: {
          instagram: user.social_media?.instagram || '',
          linkedin: user.social_media?.linkedin || '',
          twitter: user.social_media?.twitter || '',
          tiktok: user.social_media?.tiktok || '',
        },
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const compressedFile = await compressImageToFile(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 });

      const uploadPayload = new FormData();
      uploadPayload.append('file', compressedFile);

      const { data } = await api.post('/upload/avatar', uploadPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.url) {
        setFormData((prev) => ({ ...prev, avatar: data.url }));
        await dispatch(updateProfile({ avatar: data.url })).unwrap();
        toast.success('Foto profil instruktur berhasil diperbarui!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto profil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: formData.name,
      phone: formData.phone,
      specialization: formData.specialization,
      alma_mater: formData.alma_mater,
      school: formData.alma_mater,
      gender: formData.gender,
      address: formData.address,
      bio: formData.bio,
      avatar: formData.avatar,
      social_media: formData.social_media,
    };

    if (formData.new_password) {
      if (!formData.current_password) {
        toast.error('Harap masukkan password saat ini untuk mengganti password.');
        setSaving(false);
        return;
      }
      if (formData.new_password !== formData.new_password_confirmation) {
        toast.error('Konfirmasi password baru tidak cocok.');
        setSaving(false);
        return;
      }
      payload.current_password = formData.current_password;
      payload.new_password = formData.new_password;
      payload.new_password_confirmation = formData.new_password_confirmation;
    }

    try {
      await dispatch(updateProfile(payload)).unwrap();
      toast.success('Profil instruktur berhasil disimpan!');
      setFormData((prev) => ({
        ...prev,
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      }));
    } catch (err) {
      const errorMsg = typeof err === 'object' ? Object.values(err).flat().join(', ') : err;
      toast.error(errorMsg || 'Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 text-white p-6 sm:p-8 relative">
          <div className="flex items-center justify-between gap-2 mb-6">
            <span className="text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30">
              Instruktur ID: #{user?.id || '—'}
            </span>
            <span className="text-xs text-indigo-100/80 hidden sm:inline">
              Portal Instruktur & Pengajar SkorPluss
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-white/30 rounded-full overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Avatar name={formData.name || 'Instruktur'} src={formData.avatar} size="2xl" />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg border-2 border-white"
                title="Ubah Foto Profil"
              >
                <FontAwesomeIcon icon={faCamera} className="text-xs" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formData.name || 'Nama Instruktur'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                  <span>👨‍🏫 Instruktur / Tutor</span>
                </span>
                {formData.specialization && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                    <span>{formData.specialization}</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 flex flex-wrap items-center gap-2">
                <span>{formData.email}</span>
                {formData.alma_mater && (
                  <>
                    <span>•</span>
                    <span>{formData.alma_mater}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex border-t border-slate-200 dark:border-slate-800 px-6 gap-6 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={() => setActiveTab('biodata')}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'biodata'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={faUserTie} />
            <span>Identitas & Akademik Instruktur</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sosmed')}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sosmed'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={faShareAlt} />
            <span>Media Sosial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keamanan')}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'keamanan'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={faShieldAlt} />
            <span>Keamanan & Password</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'biodata' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Alamat Email (Akun)
                </label>
                <Input value={formData.email} disabled className="bg-slate-100 dark:bg-slate-800 opacity-80 cursor-not-allowed" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faBookOpen} className="text-indigo-500" />
                  Bidang Keahlian / Subtes Pengajaran
                </label>
                <Input
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="Contoh: Penalaran Matematika & Kuantitatif"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUniversity} className="text-emerald-500" />
                  Kampus Almamater / Pendidikan
                </label>
                <Input
                  value={formData.alma_mater}
                  onChange={(e) => setFormData({ ...formData, alma_mater: e.target.value })}
                  placeholder="Contoh: Institut Teknologi Bandung (ITB)"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faPhone} className="text-blue-500" />
                  Nomor WhatsApp / HP
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812..."
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faVenusMars} className="text-purple-500" />
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                Profil Singkat & Pengalaman Mengajar
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Ceritakan pengalaman mengajar dan metode pembelajaran Anda..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm resize-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'sosmed' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                Instagram
              </label>
              <Input
                value={formData.social_media.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_media: { ...formData.social_media, instagram: e.target.value.replace('@', '') },
                  })
                }
                placeholder="username"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                LinkedIn
              </label>
              <Input
                value={formData.social_media.linkedin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_media: { ...formData.social_media, linkedin: e.target.value },
                  })
                }
                placeholder="linkedin.com/in/username"
              />
            </div>
          </div>
        )}

        {activeTab === 'keamanan' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-xl space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                Password Saat Ini
              </label>
              <Input
                type="password"
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                Password Baru
              </label>
              <Input
                type="password"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                Konfirmasi Password Baru
              </label>
              <Input
                type="password"
                value={formData.new_password_confirmation}
                onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Profil Instruktur'}
          </Button>
        </div>
      </form>
    </div>
  );
}

