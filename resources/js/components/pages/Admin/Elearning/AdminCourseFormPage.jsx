import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import { createAdminCourse, updateAdminCourse } from '../../../../features/admin/adminElearningSlice';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const CATEGORIES = [
  'TPS UTBK-SNBT',
  'Literasi Bahasa Indonesia',
  'Literasi Bahasa Inggris',
  'Penalaran Matematika',
  'Kedinasan',
  'Olimpiade Sains',
  'Pengembangan Diri',
  'Teknologi & AI',
];

export default function AdminCourseFormPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isEditing = Boolean(courseId);

  const [formData, setFormData] = useState({
    title: '',
    category: 'TPS UTBK-SNBT',
    description: '',
    is_active: true,
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/elearning/courses/${courseId}`);
      const c = res.data;
      setFormData({
        title: c.title || '',
        category: c.category || 'TPS UTBK-SNBT',
        description: c.description || '',
        is_active: Boolean(c.is_active),
      });
      setPreviewImg(c.thumbnail || null);
    } catch (err) {
      toast.error('Gagal memuat data kursus.');
      navigate('/admin/elearning');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setThumbnailFile(file);
    setPreviewImg(URL.createObjectURL(file));

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      setUploading(true);
      const res = await api.post('/admin/upload/thumbnail', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
      toast.success('Thumbnail berhasil diunggah!');
    } catch (err) {
      toast.error('Gagal mengunggah thumbnail');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Judul kursus wajib diisi');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await dispatch(updateAdminCourse({ id: courseId, data: formData })).unwrap();
        toast.success('Kursus berhasil diperbarui!');
      } else {
        const created = await dispatch(createAdminCourse(formData)).unwrap();
        toast.success('Kursus berhasil dibuat!');
        navigate(`/admin/elearning/courses/${created.id}/curriculum`);
        return;
      }
      navigate('/admin/elearning');
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan kursus');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title={isEditing ? 'Edit Kursus' : 'Tambah Kursus'}>
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditing ? 'Edit Kursus' : 'Tambah Kursus Baru'}>
      <div className="w-full pb-16 space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/elearning"
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FontAwesomeIcon icon={['fas', 'arrow-left']} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {isEditing ? 'Edit Kursus' : 'Buat Kursus Baru'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing ? 'Perbarui informasi umum dan deskripsi kursus ini.' : 'Isi formulir di bawah ini untuk menambahkan materi kursus baru.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => navigate('/admin/elearning')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="course-form"
              loading={saving || uploading}
              className="shadow-md shadow-blue-500/20"
            >
              <FontAwesomeIcon icon={['fas', 'floppy-disk']} className="mr-1.5" />
              {isEditing ? 'Simpan Perubahan' : 'Lanjut ke Kurikulum →'}
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <form id="course-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Informasi Umum Kursus
            </h2>

            {/* Judul Kursus */}
            <FormField label="Judul Kursus" required>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Contoh: Penguasaan Penalaran Logika & Silogisme TPS"
                className="text-base"
              />
            </FormField>

            {/* Kategori & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="Kategori Pembelajaran" required>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status Publikasi">
                <div className="flex items-center h-10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Publikasikan Kursus (Dapat diakses peserta)
                    </span>
                  </label>
                </div>
              </FormField>
            </div>

            {/* Thumbnail Upload */}
            <FormField label="Foto Sampul / Thumbnail Kursus">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="w-48 h-28 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 dark:border-slate-700 shadow-inner">
                  {previewImg ? (
                    <img src={previewImg} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={['fas', 'image']} className="text-3xl opacity-40" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="thumbnail-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
                  >
                    <FontAwesomeIcon icon={['fas', 'cloud-arrow-up']} />
                    {uploading ? 'Mengunggah...' : 'Pilih Gambar Sampul'}
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Format disarankan: JPG, PNG, atau WebP (Rasio 16:9, min. 1280x720 px).
                  </p>
                </div>
              </div>
            </FormField>

            {/* Rich Text Deskripsi Kursus */}
            <FormField label="Deskripsi & Ringkasan Kursus">
              <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  className="h-44 mb-10"
                  placeholder="Jelaskan ringkasan materi, silabus utama, dan target kompetensi yang akan dicapai peserta..."
                />
              </div>
            </FormField>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => navigate('/admin/elearning')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={saving || uploading}
              className="px-6 py-2.5 shadow-md shadow-blue-500/20"
            >
              <FontAwesomeIcon icon={['fas', 'floppy-disk']} className="mr-1.5" />
              {isEditing ? 'Simpan Perubahan' : 'Lanjut ke Kurikulum →'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
