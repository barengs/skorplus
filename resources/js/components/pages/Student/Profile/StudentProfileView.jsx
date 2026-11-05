import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  faUser,
  faPhone,
  faSchool,
  faIdCard,
  faGraduationCap,
  faMapMarkerAlt,
  faVenusMars,
  faCalendarAlt,
  faLock,
  faCamera,
  faSave,
  faShieldAlt,
  faShareAlt,
  faBullseye,
} from '@fortawesome/free-solid-svg-icons';

const PROGRAM_INFO = {
  intensif: {
    name: 'Intensif',
    fullName: 'Program Intensif (Bimbel UTBK & Kedinasan)',
    badgeClass: 'bg-amber-400 text-slate-950 font-black',
    icon: '🚀',
    description:
      'Bimbingan intensif persiapan UTBK-SNBT & Kedinasan dengan akses penuh seluruh modul e-learning, tanya tutor 24/7 tanpa batas, simulasi CBT tak terbatas, dan live streaming 3×/minggu.',
  },
  mandiri: {
    name: 'Mandiri',
    fullName: 'Program Mandiri',
    badgeClass: 'bg-blue-300 text-slate-950 font-black',
    icon: '📚',
    description:
      'Paket belajar mandiri fleksibel dengan akses bank soal dasar, 5× simulasi CBT per bulan, dan pelacakan progres belajar mandiri.',
  },
  garansi: {
    name: 'Garansi',
    fullName: 'Program Garansi PTN',
    badgeClass: 'bg-emerald-400 text-slate-950 font-black',
    icon: '🏆',
    description:
      'Program eksklusif bergaransi kelulusan PTN/Kedinasan dengan mentor privat, analisis peluang rasionalisasi SNBP/SNBT, dan pendampingan penuh hingga pengumuman.',
  },
};

export default function StudentProfileView() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('biodata');
  const [saving, setSaving] = useState(false);
  const [classLevels, setClassLevels] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    nisn: '',
    class_level: '',
    class_level_id: '',
    target_campus: '',
    gender: '',
    birth_year: '',
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
    api
      .get('/class-levels')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setClassLevels(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        school: user.school || '',
        nisn: user.nisn || '',
        class_level: user.class_level || '',
        class_level_id: user.class_level_id ? String(user.class_level_id) : '',
        target_campus: user.target_campus || '',
        gender: user.gender || '',
        birth_year: user.birth_year ? String(user.birth_year) : '',
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

  const completionPercentage = useMemo(() => {
    const fields = [
      formData.name,
      formData.phone,
      formData.gender,
      formData.birth_year,
      formData.class_level,
      formData.nisn,
      formData.address,
      formData.bio || formData.target_campus,
      formData.avatar,
    ];
    const filled = fields.filter((f) => Boolean(f && String(f).trim().length > 0)).length;
    return Math.round((filled / fields.length) * 100);
  }, [formData]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 10; y >= 1960; y--) {
      years.push(y);
    }
    return years;
  }, []);

  const handleClassLevelChange = (e) => {
    const selectedName = e.target.value;
    const found = classLevels.find((item) => item.name === selectedName);
    setFormData((prev) => ({
      ...prev,
      class_level: selectedName,
      class_level_id: found ? String(found.id) : '',
    }));
  };

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
        toast.success('Foto profil berhasil diperbarui!');
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
      school: formData.school,
      nisn: formData.nisn,
      class_level: formData.class_level || null,
      class_level_id: formData.class_level_id ? parseInt(formData.class_level_id, 10) : null,
      target_campus: formData.target_campus || null,
      gender: formData.gender,
      birth_year: formData.birth_year ? parseInt(formData.birth_year, 10) : null,
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
      toast.success('Profil siswa berhasil disimpan!');
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

  const programKey = (user?.program || 'intensif').toLowerCase();
  const currentProgram = PROGRAM_INFO[programKey] || {
    name: user?.program || 'Intensif',
    fullName: `Program ${user?.program || 'Intensif'}`,
    badgeClass: 'bg-amber-400 text-slate-950 font-black',
    icon: '🎓',
    description: 'Program bimbingan terpadu SkorPluss untuk mendukung pencapaian akademik dan kelulusan seleksi.',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Profile Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-6 sm:p-8 relative">
          <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />

          <div className="flex items-center justify-between gap-2 mb-6">
            <span className="text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 shadow-xs">
              SkorPluss ID: #{user?.id || '—'}
            </span>
            <span className="text-xs text-blue-100/80 hidden sm:inline">
              Portal Siswa SkorPluss Learning Center
            </span>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-white/30 rounded-full overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Avatar name={formData.name || 'Siswa'} src={formData.avatar} size="2xl" />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 border-2 border-white"
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
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {formData.name || 'Nama Siswa'}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm border border-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Status: Siswa Aktif</span>
                  </span>

                  {formData.class_level && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md">
                      <FontAwesomeIcon icon={faGraduationCap} />
                      <span>{formData.class_level}</span>
                    </span>
                  )}

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${currentProgram.badgeClass}`}>
                    <span>{currentProgram.icon}</span>
                    <span>Program: {currentProgram.name.toUpperCase()}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-blue-100 flex flex-wrap items-center gap-2">
                  <span>{formData.email}</span>
                  {formData.phone && (
                    <>
                      <span>•</span>
                      <span>{formData.phone}</span>
                    </>
                  )}
                  {formData.school && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-xs">{formData.school}</span>
                    </>
                  )}
                </p>

                <div className="mt-3 p-3.5 rounded-xl bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 text-xs text-blue-50 max-w-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                    <span>🎯</span>
                    <span>Maksud & Tujuan {currentProgram.fullName}:</span>
                  </div>
                  <p className="text-blue-100 text-[11px] sm:text-xs leading-relaxed">
                    {currentProgram.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-64 bg-white/15 dark:bg-black/30 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-blue-100">Kelengkapan Profil</span>
                <span className="font-black text-white text-sm">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-100 mt-2">
                {completionPercentage === 100
                  ? '✨ Profil kamu sudah 100% lengkap!'
                  : 'Lengkapi profil & tingkat kelasmu untuk pengalaman belajar optimal.'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-200 dark:border-slate-800 px-6 gap-6 bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('biodata')}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'biodata'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>Data Pribadi & Kontak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alamat_sosmed')}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'alamat_sosmed'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={faShareAlt} />
            <span>Alamat & Media Sosial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keamanan')}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'keamanan'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={faShieldAlt} />
            <span>Keamanan & Password</span>
          </button>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'biodata' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informasi Pribadi & Kontak</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Perbarui identitas akun, kontak WhatsApp/HP, jenis kelamin, tahun kelahiran, serta tingkat kelas Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nama Lengkap */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>

              {/* Email (Read only) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Alamat Email (Akun)
                </label>
                <div className="relative">
                  <Input value={formData.email} disabled className="bg-slate-100 dark:bg-slate-800 opacity-80 cursor-not-allowed" />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">Akun Terdaftar</span>
                </div>
              </div>

              {/* Nomor Handphone / WhatsApp */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faPhone} className="text-blue-500" />
                  Nomor WhatsApp / HP
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                />
                <p className="text-[11px] text-slate-400 mt-1">Digunakan untuk konfirmasi jadwal kelas dan tryout.</p>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faVenusMars} className="text-purple-500" />
                  Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'laki-laki' })}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      formData.gender === 'laki-laki'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>👨 Laki-laki</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'perempuan' })}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      formData.gender === 'perempuan'
                        ? 'bg-pink-50 dark:bg-pink-950/40 border-pink-500 text-pink-600 dark:text-pink-400 ring-2 ring-pink-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>👩 Perempuan</span>
                  </button>
                </div>
              </div>

              {/* Tahun Lahir */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-amber-500" />
                  Tahun Lahir
                </label>
                <select
                  value={formData.birth_year}
                  onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Pilih Tahun Lahir</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asal Sekolah */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faSchool} className="text-emerald-500" />
                  Asal Sekolah / Kampus
                </label>
                <Input
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="Contoh: SMAN 5 Surabaya"
                />
              </div>

              {/* NISN */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faIdCard} className="text-indigo-500" />
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <Input
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  placeholder="10 digit nomor NISN"
                />
              </div>

              {/* Tingkat Kelas (Dinamis dari Master Data) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-blue-500" />
                  Tingkat Kelas
                </label>
                <select
                  value={formData.class_level}
                  onChange={handleClassLevelChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Pilih Tingkat Kelas</option>
                  {classLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.name}>
                      {lvl.name} {lvl.category ? `— ${lvl.category}` : ''}
                    </option>
                  ))}
                  {formData.class_level &&
                    !classLevels.some((lvl) => lvl.name === formData.class_level) && (
                      <option value={formData.class_level}>{formData.class_level}</option>
                    )}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alamat_sosmed' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alamat & Target Kampus</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Alamat tempat tinggal, target perguruan tinggi impian, dan motivasi belajar Anda di SkorPluss.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faBullseye} className="text-amber-500" />
                  Target Kampus / PTN & Jurusan Impian
                </label>
                <Input
                  value={formData.target_campus}
                  onChange={(e) => setFormData({ ...formData, target_campus: e.target.value })}
                  placeholder="Contoh: Teknik Informatika - Institut Teknologi Sepuluh Nopember (ITS)"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-rose-500" />
                  Alamat Lengkap
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nama Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Bio Singkat / Motto Belajar
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tuliskan motto atau catatan target belajarmu..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Media Sosial</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tautkan akun media sosialmu agar mudah terhubung dengan sesama siswa dan mentor.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 inline-flex items-center justify-center text-[10px] text-white font-bold">
                      IG
                    </span>
                    Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">@</span>
                    <Input
                      value={formData.social_media.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          social_media: { ...formData.social_media, instagram: e.target.value.replace('@', '') },
                        })
                      }
                      className="pl-8"
                      placeholder="username_kamu"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-blue-700 inline-flex items-center justify-center text-[10px] text-white font-bold">
                      in
                    </span>
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

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 dark:bg-slate-100 inline-flex items-center justify-center text-[10px] text-white dark:text-slate-900 font-bold">
                      X
                    </span>
                    X (Twitter)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">@</span>
                    <Input
                      value={formData.social_media.twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          social_media: { ...formData.social_media, twitter: e.target.value.replace('@', '') },
                        })
                      }
                      className="pl-8"
                      placeholder="handle_x"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-red-600 inline-flex items-center justify-center text-[10px] text-white font-bold">
                      ▶
                    </span>
                    TikTok / YouTube
                  </label>
                  <Input
                    value={formData.social_media.tiktok}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_media: { ...formData.social_media, tiktok: e.target.value },
                      })
                    }
                    placeholder="@tiktok atau channel youtube"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keamanan' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ganti Password Akun</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Untuk keamanan akun, gunakan password minimal 8 karakter dengan kombinasi angka dan simbol.
              </p>
            </div>

            <div className="max-w-xl space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLock} className="text-amber-500" />
                  Password Saat Ini
                </label>
                <Input
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  placeholder="Masukkan password yang aktif saat ini"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-blue-500" />
                  Password Baru
                </label>
                <Input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  placeholder="Minimal 8 karakter"
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
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

