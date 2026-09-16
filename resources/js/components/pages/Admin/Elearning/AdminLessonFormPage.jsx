import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminLessonFormPage() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(lessonId);

  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video',
    video_url: '',
    content: '',
    is_preview: false,
    duration_seconds: 0,
    min_pass_score: 60,
  });

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/elearning/modules/${moduleId}/lessons/${lessonId}`);
      const l = res.data;
      setLessonForm({
        title: l.title || '',
        type: l.type || 'video',
        video_url: l.video_url || '',
        content: l.content || l.summary || '',
        is_preview: Boolean(l.is_preview),
        duration_seconds: l.duration_seconds || 0,
        min_pass_score: l.min_pass_score || 60,
      });
      if (l.attachment_url) {
        setDocFile({ name: l.attachment_name, url: l.attachment_url });
      }
    } catch (err) {
      toast.error('Gagal memuat data lesson');
      navigate(`/admin/elearning/courses/${courseId}/curriculum`);
    } finally {
      setLoading(false);
    }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('document', file);
    try {
      setUploadingDoc(true);
      const res = await api.post('/admin/upload/document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocFile({ name: file.name, url: res.data.url });
      toast.success('Dokumen berhasil diunggah!');
    } catch (err) {
      toast.error('Gagal unggah dokumen');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = () => {
    setDocFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lessonForm.title.trim()) {
      toast.error('Judul materi harus diisi!');
      return;
    }

    const payload = {
      ...lessonForm,
      summary: lessonForm.content, // Fallback for some old logic
    };

    if (docFile) {
      payload.attachment_url = docFile.url;
      payload.attachment_name = docFile.name;
    } else {
      payload.attachment_url = null;
      payload.attachment_name = null;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await api.put(`/admin/elearning/modules/${moduleId}/lessons/${lessonId}`, payload);
        toast.success('Materi berhasil diperbarui!');
      } else {
        await api.post(`/admin/elearning/modules/${moduleId}/lessons`, payload);
        toast.success('Materi berhasil ditambahkan!');
      }
      navigate(`/admin/elearning/courses/${courseId}/curriculum`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan materi');
    } finally {
      setSaving(false);
    }
  };

  const backUrl = `/admin/elearning/courses/${courseId}/curriculum`;

  if (loading) {
    return (
      <AppLayout title={isEditing ? 'Edit Materi' : 'Tambah Materi'}>
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditing ? 'Edit Materi / Lesson' : 'Tambah Materi / Lesson Baru'}>
      <div className="max-w-4xl mx-auto pb-16 space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={backUrl}
              className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FontAwesomeIcon icon={['fas', 'arrow-left']} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {isEditing ? 'Edit Konten Materi' : 'Buat Konten Materi Baru'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Silakan tulis materi pembelajaran dengan editor lengkap di bawah ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => navigate(backUrl)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="lesson-form"
              loading={saving || uploadingDoc}
              className="shadow-md shadow-blue-500/20"
            >
              <FontAwesomeIcon icon={['fas', 'floppy-disk']} className="mr-1.5" />
              {isEditing ? 'Simpan Perubahan' : 'Simpan Materi Baru'}
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <form id="lesson-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Informasi Umum Materi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="Judul Materi / Kuis" required>
                <Input
                  value={lessonForm.title}
                  onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                  required
                  placeholder="Contoh: Prasyarat Tools & Instalasi"
                  className="text-base"
                />
              </FormField>

              <FormField label="Tipe Materi">
                <select
                  value={lessonForm.type}
                  onChange={e => setLessonForm({ ...lessonForm, type: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="video">Video Pembelajaran</option>
                  <option value="reading">Artikel / Teks Bacaan</option>
                  <option value="quiz">Kuis Pilihan Ganda</option>
                  <option value="assignment">Tugas Akhir / Proyek</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField label="Durasi Estimasi (Menit)">
                <Input
                  type="number"
                  min="0"
                  value={Math.round(lessonForm.duration_seconds / 60)}
                  onChange={e => setLessonForm({ ...lessonForm, duration_seconds: parseInt(e.target.value || 0) * 60 })}
                />
              </FormField>

              {lessonForm.type === 'quiz' && (
                <FormField label="Skor Lulus Minimal (KKM)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={lessonForm.min_pass_score}
                    onChange={e => setLessonForm({ ...lessonForm, min_pass_score: parseInt(e.target.value || 0) })}
                    placeholder="Standar KKM: 60"
                  />
                </FormField>
              )}

              <FormField label="Akses Gratis / Preview">
                <div className="flex items-center h-10 mt-0.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonForm.is_preview}
                      onChange={e => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Bisa diakses tanpa harus mendaftar
                    </span>
                  </label>
                </div>
              </FormField>
            </div>

            {lessonForm.type === 'video' && (
              <FormField label="URL Video (Youtube/Vimeo Embed URL)">
                <Input
                  value={lessonForm.video_url}
                  onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                />
                <p className="text-[10px] text-slate-500 mt-1">Masukkan URL embed untuk video player yang optimal.</p>
              </FormField>
            )}
            
            {/* Form Attachment for Assignment/Reading */}
            <FormField label="Lampiran Dokumen PDF (Opsional)">
              <div className="flex items-center gap-4">
                <input type="file" accept=".pdf,.docx,.xlsx" onChange={handleDocUpload} id="doc-upload" className="hidden" />
                <label htmlFor="doc-upload" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <FontAwesomeIcon icon={['fas', 'upload']} className="mr-1.5" />
                  {uploadingDoc ? 'Mengunggah...' : 'Pilih File Dokumen'}
                </label>
                {docFile && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded border border-emerald-200 dark:border-emerald-800">
                    <FontAwesomeIcon icon={['fas', 'file-pdf']} />
                    <span>{docFile.name}</span>
                    <button type="button" onClick={handleRemoveDoc} className="text-slate-400 hover:text-red-500 ml-2">
                      <FontAwesomeIcon icon={['fas', 'xmark']} />
                    </button>
                  </div>
                )}
              </div>
            </FormField>

            {/* Rich Text Editor for Content */}
            <div className="pt-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
                <span>Konten Teks & Artikel Pembelajaran</span>
              </h2>
              
              <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                <ReactQuill
                  theme="snow"
                  value={lessonForm.content}
                  onChange={content => setLessonForm({ ...lessonForm, content })}
                  className="h-80 mb-10" // Make it very tall since it's a dedicated page
                  placeholder="Tulis instruksi, teori, artikel lengkap, code snippet, atau formula di sini..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                      ['link', 'image', 'video'],
                      ['code-block'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>
            
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
