import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import FormField from '../../../molecules/FormField';
import Input from '../../../atoms/Input';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatRupiah } from '../../../../utils/currencyHelper';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { compressImageToFile } from '../../../../utils/imageCompressor';

export default function AdminLearningPackageFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    discount_price: null,
    thumbnail: '',
    features: [],
    is_published: false,
    cbt_quota: null, // null = unlimited
    course_ids: []
  });

  const [cbtMode, setCbtMode] = useState('unlimited'); // 'unlimited', '2', '5', '10', 'custom'

  useEffect(() => {
    fetchCourses();
    if (isEdit) {
      fetchPackage();
    }
  }, [id]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/admin/learning-packages/courses');
      setCourses(res.data || []);
    } catch (err) {
      console.error('Gagal memuat daftar kursus', err);
    }
  };

  const fetchPackage = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/learning-packages/${id}`);
      const pkg = res.data;
      
      const quota = pkg.cbt_quota;
      if (quota === null || quota === undefined || quota === 0) {
        setCbtMode('unlimited');
      } else if (quota === 2) {
        setCbtMode('2');
      } else if (quota === 5) {
        setCbtMode('5');
      } else if (quota === 10) {
        setCbtMode('10');
      } else {
        setCbtMode('custom');
      }

      setForm({
        name: pkg.name || '',
        description: pkg.description || '',
        price: pkg.price || 0,
        discount_price: pkg.discount_price || null,
        thumbnail: pkg.thumbnail || '',
        features: pkg.features || [],
        is_published: !!pkg.is_published,
        cbt_quota: quota,
        course_ids: pkg.courses?.map(c => c.id) || []
      });
    } catch (err) {
      toast.error('Gagal memuat data paket belajar');
      navigate('/admin/learning-packages');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setThumbnailUploading(true);
      const compressedFile = await compressImageToFile(file, { maxWidth: 1280, maxHeight: 720, quality: 0.8 });
      
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await api.post('/admin/upload/thumbnail', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, thumbnail: res.data.url }));
      toast.success('Thumbnail berhasil diunggah');
    } catch (err) {
      toast.error('Gagal mengunggah thumbnail');
    } finally {
      setThumbnailUploading(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const removeFeature = (idx) => {
    setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  const toggleCourse = (courseId) => {
    setForm(prev => {
      const exists = prev.course_ids.includes(courseId);
      return {
        ...prev,
        course_ids: exists
          ? prev.course_ids.filter(cid => cid !== courseId)
          : [...prev.course_ids, courseId]
      };
    });
  };

  const selectAllCourses = () => {
    const allIds = filteredCourses.map(c => c.id);
    setForm(prev => ({
      ...prev,
      course_ids: Array.from(new Set([...prev.course_ids, ...allIds]))
    }));
  };

  const unselectAllCourses = () => {
    const filteredIds = new Set(filteredCourses.map(c => c.id));
    setForm(prev => ({
      ...prev,
      course_ids: prev.course_ids.filter(id => !filteredIds.has(id))
    }));
  };

  const handleCbtModeChange = (mode) => {
    setCbtMode(mode);
    if (mode === 'unlimited') {
      setForm(prev => ({ ...prev, cbt_quota: null }));
    } else if (mode === '2') {
      setForm(prev => ({ ...prev, cbt_quota: 2 }));
    } else if (mode === '5') {
      setForm(prev => ({ ...prev, cbt_quota: 5 }));
    } else if (mode === '10') {
      setForm(prev => ({ ...prev, cbt_quota: 10 }));
    } else if (mode === 'custom') {
      if (!form.cbt_quota || [2, 5, 10].includes(form.cbt_quota)) {
        setForm(prev => ({ ...prev, cbt_quota: 3 }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nama paket belajar wajib diisi');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        cbt_quota: cbtMode === 'unlimited' ? null : (parseInt(form.cbt_quota) || null)
      };

      if (isEdit) {
        await api.put(`/admin/learning-packages/${id}`, payload);
        toast.success('Paket belajar berhasil diperbarui');
      } else {
        const res = await api.post('/admin/learning-packages', payload);
        toast.success('Paket belajar baru berhasil ditambahkan');
      }
      navigate('/admin/learning-packages');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan paket belajar');
    } finally {
      setSaving(false);
    }
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout title={isEdit ? 'Edit Paket Belajar' : 'Tambah Paket Belajar'}>
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Memuat formulir paket belajar...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEdit ? 'Edit Paket Belajar' : 'Tambah Paket Belajar'}>
      <div className="w-full pb-20 space-y-6">
        
        {/* Navigation & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link to="/admin/learning-packages">
              <Button
                variant="ghost"
                type="button"
                className="h-10 px-4 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                ← Kembali
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Manajemen Paket Belajar
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-500">Formulir Laman Penuh</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {isEdit ? `Edit Paket: ${form.name || 'Memuat...'}` : 'Tambah Paket Belajar Baru'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/learning-packages">
              <Button
                variant="ghost"
                type="button"
                disabled={saving}
                className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Batal
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="h-10 px-5 rounded-xl text-xs font-bold !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                <>
                  <FontAwesomeIcon icon={['fas', 'check']} className="mr-1.5" />
                  {isEdit ? 'Perbarui Paket Belajar' : 'Simpan Paket Belajar'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Form Container (Two Columns) */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT COLUMN: INFORMASI UTAMA & MATERI (lg:col-span-8) ── */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Informasi Dasar Paket */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FontAwesomeIcon icon={['fas', 'box-archive']} className="text-blue-600" />
                <span>Informasi Dasar Paket</span>
              </h2>

              <FormField label="Nama Paket Belajar" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Paket Intensif SNBT 2026, Paket Garansi Kedokteran"
                  required
                />
              </FormField>

              <FormField label="Deskripsi Paket">
                <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
                  <ReactQuill
                    theme="snow"
                    value={form.description}
                    onChange={(content) => setForm({ ...form, description: content })}
                    className="h-44 mb-10"
                    placeholder="Jelaskan sasaran, manfaat, dan target pencapaian dari paket belajar ini..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'clean']
                      ]
                    }}
                  />
                </div>
              </FormField>

              {/* Harga Normal & Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <FormField label="Harga Investasi (Rp)" required>
                  <Input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pratinjau: <strong>{formatRupiah(form.price)}</strong>
                  </p>
                </FormField>

                <FormField label="Harga Coret / Diskon (Rp, Opsional)">
                  <Input
                    type="number"
                    min="0"
                    value={form.discount_price || ''}
                    onChange={(e) => setForm({ ...form, discount_price: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Kosongkan jika tidak ada diskon"
                  />
                  {form.discount_price && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pratinjau Coret: <span className="line-through">{formatRupiah(form.discount_price)}</span>
                    </p>
                  )}
                </FormField>
              </div>
            </div>

            {/* 2. FITUR CBT & KUOTA PENGERJAAN (Fitur Baru) */}
            <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 text-sm">
                    <FontAwesomeIcon icon={['fas', 'file-signature']} />
                  </span>
                  <span>Fitur Simulasi CBT & Batas Penggunaan</span>
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800">
                  Integrasi CBT
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tentukan berapa kali siswa yang mengambil paket ini diizinkan untuk mengerjakan ujian CBT (Computer Based Test).
                Bila kuota tercapai, sistem akan otomatis menampilkan status batas dan memunculkan modal peringatan.
              </p>

              {/* Pilihan Kuota CBT */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {[
                  { mode: '2', label: '2x Pengerjaan', badge: '2 Ujian' },
                  { mode: '5', label: '5x Pengerjaan', badge: '5 Ujian' },
                  { mode: '10', label: '10x Pengerjaan', badge: '10 Ujian' },
                  { mode: 'custom', label: 'Kustom Angka', badge: 'Sesuai Angka' },
                  { mode: 'unlimited', label: 'Tak Terbatas', badge: 'Akses Bebas' },
                ].map((opt) => {
                  const isSelected = cbtMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => handleCbtModeChange(opt.mode)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold text-xs sm:text-sm block">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium">{opt.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Input Kustom Angka */}
              {cbtMode === 'custom' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Jumlah Maksimal Pengerjaan CBT (Kali)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      value={form.cbt_quota || ''}
                      onChange={(e) => setForm({ ...form, cbt_quota: parseInt(e.target.value) || 1 })}
                      className="max-w-[200px]"
                      placeholder="Contoh: 3, 7, 15"
                      required
                    />
                    <span className="text-xs text-slate-500">kali kesempatan ujian</span>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2.5">
                <FontAwesomeIcon icon={['fas', 'circle-info']} className="text-purple-600 text-sm mt-0.5 shrink-0" />
                <div>
                  <strong className="font-semibold block mb-0.5">Status Pengaturan Kuota:</strong>
                  {cbtMode === 'unlimited' ? (
                    <span>Siswa memiliki akses <strong>tanpa batas</strong> untuk seluruh simulasi CBT pada paket ini.</span>
                  ) : (
                    <span>
                      Siswa dibatasi maksimal <strong>{form.cbt_quota || 0} kali</strong> pengerjaan ujian CBT. Sisa kuota akan tercatat di detil program siswa dan bila habis akan menampilkan modal peringatan.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Kursus yang Tergabung dalam Paket */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FontAwesomeIcon icon={['fas', 'graduation-cap']} className="text-emerald-600" />
                    <span>Kursus Dalam Paket ({form.course_ids.length} Terpilih)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pilih kursus yang akan otomatis terbuka saat siswa terdaftar di paket ini.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllCourses}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={unselectAllCourses}
                    className="text-xs font-semibold text-slate-500 hover:underline"
                  >
                    Batal Semua
                  </button>
                </div>
              </div>

              {/* Search filter for courses */}
              <div className="relative">
                <Input
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Cari kursus berdasarkan judul..."
                  className="text-xs"
                />
              </div>

              {courses.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Belum ada kursus di sistem.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredCourses.map((course) => {
                    const isChecked = form.course_ids.includes(course.id);
                    return (
                      <label
                        key={course.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer select-none ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCourse(course.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block truncate">
                              {course.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Slug: {course.slug}
                            </span>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                            ✓ Terpilih
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: MEDIA, FITUR & PUBLIKASI (lg:col-span-4) ── */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            
            {/* Thumbnail Upload */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <FontAwesomeIcon icon={['fas', 'image']} className="text-blue-500" />
                <span>Thumbnail Paket</span>
              </h3>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative group">
                {form.thumbnail ? (
                  <>
                    <img src={form.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, thumbnail: '' })}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Hapus gambar"
                    >
                      <FontAwesomeIcon icon={['fas', 'xmark']} className="text-xs" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <FontAwesomeIcon icon={['fas', 'arrow-up-from-bracket']} className="text-2xl mb-1 text-slate-300" />
                    <p className="text-xs">Belum ada thumbnail</p>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="file"
                  id="thumbnail-upload"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={thumbnailUploading}
                  className="hidden"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="w-full h-10 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                >
                  {thumbnailUploading ? 'Mengunggah gambar...' : (form.thumbnail ? 'Ganti Thumbnail' : 'Pilih Berkas Thumbnail')}
                </label>
              </div>
            </div>

            {/* Fitur-Fitur Paket (Highlights) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'list-check']} className="text-emerald-500" />
                  <span>Poin Fitur & Fasilitas</span>
                </h3>
                <Button
                  type="button"
                  onClick={addFeature}
                  disabled={!newFeature.trim()}
                  className="h-8 px-3 rounded-lg !bg-blue-600 hover:!bg-blue-700 text-white font-bold text-xs shrink-0"
                >
                  + Tambah
                </Button>
              </div>

              <div className="w-full">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                  placeholder="Ketik poin fasilitas & tekan Enter..."
                  className="w-full text-xs"
                />
              </div>

              {form.features.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Belum ada poin fitur ditambahkan.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {form.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FontAwesomeIcon icon={['fas', 'check']} className="text-emerald-500 text-[11px] shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-red-500 hover:text-red-700 p-1 shrink-0 ml-2"
                        title="Hapus"
                      >
                        <FontAwesomeIcon icon={['fas', 'xmark']} className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Publikasi & Status */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                Pengaturan Publikasi
              </h3>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                    Publikasikan ke Siswa & Landing Page
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Jika tidak dicentang, paket berstatus draft
                  </span>
                </div>
              </label>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full h-10 rounded-xl !bg-blue-600 hover:!bg-blue-700 text-white font-bold text-xs shadow-sm"
                >
                  {saving ? 'Menyimpan Paket...' : (isEdit ? 'Simpan Perubahan Paket' : 'Buat Paket Belajar')}
                </Button>
              </div>
            </div>

          </div>
        </form>

      </div>
    </AppLayout>
  );
}
