import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import Badge from '../../../atoms/Badge';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const LESSON_TYPES = [
  {
    id: 'video',
    label: 'Video Pembelajaran',
    icon: ['fas', 'video'],
    color: 'blue',
    desc: 'Video interaktif dari YouTube atau Vimeo embed',
  },
  {
    id: 'reading',
    label: 'Artikel / Bacaan',
    icon: ['fas', 'book-open'],
    color: 'emerald',
    desc: 'Teks artikel materi lengkap, teori, rumus, dan gambar',
  },
  {
    id: 'quiz',
    label: 'Kuis Evaluasi',
    icon: ['fas', 'clipboard-question'],
    color: 'amber',
    desc: 'Soal pilihan ganda dengan KKM untuk syarat lanjut section',
  },
  {
    id: 'assignment',
    label: 'Tugas Akhir Proyek',
    icon: ['fas', 'file-lines'],
    color: 'purple',
    desc: 'Pengumpulan berkas tugas mandiri dengan review tutor',
  },
];

export default function AdminLessonFormPage() {
  const { courseId, moduleId, lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEditing = Boolean(lessonId);
  const initialType = searchParams.get('type') || 'video';

  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: initialType,
    video_url: '',
    content: '',
    is_preview: false,
    duration_seconds: initialType === 'quiz' ? 600 : (initialType === 'assignment' ? 3600 : 900),
    min_pass_score: 60,
    quiz_questions: initialType === 'quiz'
      ? [
          {
            question: '',
            options: ['', '', '', ''],
            correct_index: 0,
            explanation: '',
          },
        ]
      : [],
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

      const parsedQuestions = Array.isArray(l.quiz_questions) && l.quiz_questions.length > 0
        ? l.quiz_questions
        : (l.type === 'quiz' ? [{ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }] : []);

      setLessonForm({
        title: l.title || '',
        type: l.type || 'video',
        video_url: l.video_url || '',
        content: l.content || l.summary || '',
        is_preview: Boolean(l.is_preview),
        duration_seconds: l.duration_seconds || 0,
        min_pass_score: l.min_pass_score !== undefined && l.min_pass_score !== null ? l.min_pass_score : 60,
        quiz_questions: parsedQuestions,
      });

      const docUrl = l.attachment_doc || l.attachment_pdf || l.attachment_url;
      if (docUrl) {
        setDocFile({ name: l.attachment_name || 'Lampiran Dokumen', url: docUrl });
      }
    } catch (err) {
      toast.error('Gagal memuat data materi.');
      navigate(`/admin/elearning/courses/${courseId}/curriculum`);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType) => {
    setLessonForm(prev => {
      const isQuiz = newType === 'quiz';
      const hasQuestions = Array.isArray(prev.quiz_questions) && prev.quiz_questions.length > 0;

      return {
        ...prev,
        type: newType,
        quiz_questions: isQuiz && !hasQuestions
          ? [{ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }]
          : prev.quiz_questions,
      };
    });
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['pdf', 'docx', 'doc'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error('Format berkas harus PDF, DOCX, atau DOC.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ukuran berkas maksimal 20 MB.');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      setUploadingDoc(true);
      const res = await api.post('/admin/upload/document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocFile({ name: res.data.original_name || file.name, url: res.data.url });
      toast.success('Dokumen berhasil diunggah!');
    } catch (err) {
      toast.error('Gagal mengunggah dokumen.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = () => {
    setDocFile(null);
  };

  // QUIZ BUILDER FUNCTIONS
  const addQuizQuestion = () => {
    setLessonForm(prev => ({
      ...prev,
      quiz_questions: [
        ...(prev.quiz_questions || []),
        { question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' },
      ],
    }));
  };

  const removeQuizQuestion = (qIndex) => {
    if ((lessonForm.quiz_questions || []).length <= 1) {
      toast.warning('Kuis harus memiliki minimal 1 soal.');
      return;
    }
    setLessonForm(prev => ({
      ...prev,
      quiz_questions: (prev.quiz_questions || []).filter((_, i) => i !== qIndex),
    }));
  };

  const updateQuizQuestion = (qIndex, field, value) => {
    const updated = [...(lessonForm.quiz_questions || [])];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    setLessonForm(prev => ({ ...prev, quiz_questions: updated }));
  };

  const addQuizOption = (qIndex) => {
    const updated = [...(lessonForm.quiz_questions || [])];
    const currentOptions = updated[qIndex].options || [];
    if (currentOptions.length >= 6) {
      toast.warning('Maksimal 6 pilihan jawaban.');
      return;
    }
    updated[qIndex] = {
      ...updated[qIndex],
      options: [...currentOptions, ''],
    };
    setLessonForm(prev => ({ ...prev, quiz_questions: updated }));
  };

  const removeQuizOption = (qIndex, optIndex) => {
    const updated = [...(lessonForm.quiz_questions || [])];
    const currentOptions = updated[qIndex].options || [];
    if (currentOptions.length <= 2) {
      toast.warning('Minimal harus ada 2 pilihan jawaban.');
      return;
    }
    const filtered = currentOptions.filter((_, i) => i !== optIndex);
    let newCorrect = updated[qIndex].correct_index || 0;
    if (newCorrect >= filtered.length) {
      newCorrect = filtered.length - 1;
    }
    updated[qIndex] = {
      ...updated[qIndex],
      options: filtered,
      correct_index: newCorrect,
    };
    setLessonForm(prev => ({ ...prev, quiz_questions: updated }));
  };

  const updateQuizOptionText = (qIndex, optIndex, text) => {
    const updated = [...(lessonForm.quiz_questions || [])];
    const currentOptions = [...(updated[qIndex].options || [])];
    currentOptions[optIndex] = text;
    updated[qIndex] = { ...updated[qIndex], options: currentOptions };
    setLessonForm(prev => ({ ...prev, quiz_questions: updated }));
  };

  const setCorrectOption = (qIndex, optIndex) => {
    const updated = [...(lessonForm.quiz_questions || [])];
    updated[qIndex] = { ...updated[qIndex], correct_index: optIndex };
    setLessonForm(prev => ({ ...prev, quiz_questions: updated }));
  };

  // FORM SUBMISSION
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lessonForm.title.trim()) {
      toast.error('Judul materi / kuis harus diisi!');
      return;
    }

    if (lessonForm.type === 'quiz') {
      if (!lessonForm.quiz_questions || lessonForm.quiz_questions.length === 0) {
        toast.error('Harap tambahkan minimal 1 pertanyaan kuis.');
        return;
      }
      for (let i = 0; i < lessonForm.quiz_questions.length; i++) {
        const q = lessonForm.quiz_questions[i];
        if (!q.question.trim()) {
          toast.error(`Pertanyaan nomor ${i + 1} belum diisi.`);
          return;
        }
        if (!q.options || q.options.length < 2) {
          toast.error(`Pertanyaan nomor ${i + 1} harus memiliki minimal 2 pilihan jawaban.`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            toast.error(`Pilihan ${OPTION_LETTERS[j] || j + 1} pada pertanyaan nomor ${i + 1} belum diisi.`);
            return;
          }
        }
      }
    }

    const payload = {
      title: lessonForm.title,
      type: lessonForm.type,
      video_url: lessonForm.type === 'video' ? lessonForm.video_url : null,
      content: lessonForm.content,
      summary: lessonForm.content,
      is_preview: Boolean(lessonForm.is_preview),
      duration_seconds: parseInt(lessonForm.duration_seconds || 0),
      min_pass_score: lessonForm.type === 'quiz' ? parseInt(lessonForm.min_pass_score || 60) : null,
      quiz_questions: lessonForm.type === 'quiz' ? lessonForm.quiz_questions : null,
      attachment_doc: docFile ? docFile.url : null,
      attachment_name: docFile ? docFile.name : null,
    };

    try {
      setSaving(true);
      if (isEditing) {
        await api.put(`/admin/elearning/modules/${moduleId}/lessons/${lessonId}`, payload);
        toast.success('Materi berhasil diperbarui!');
      } else {
        await api.post(`/admin/elearning/modules/${moduleId}/lessons`, payload);
        toast.success(lessonForm.type === 'quiz' ? 'Kuis berhasil ditambahkan!' : 'Materi berhasil ditambahkan!');
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
        <div className="flex justify-center items-center py-24">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const pageTitle = isEditing
    ? `Edit ${lessonForm.type === 'quiz' ? 'Kuis' : 'Materi'}`
    : (lessonForm.type === 'quiz' ? 'Tambah Kuis Baru' : (lessonForm.type === 'assignment' ? 'Tambah Tugas Akhir' : 'Tambah Materi Baru'));

  return (
    <AppLayout title={pageTitle}>
      <div className="w-full pb-20 space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <Link
              to={backUrl}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kembali ke Silabus"
            >
              <FontAwesomeIcon icon={['fas', 'arrow-left']} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  color={
                    lessonForm.type === 'quiz'
                      ? 'amber'
                      : lessonForm.type === 'assignment'
                      ? 'purple'
                      : lessonForm.type === 'reading'
                      ? 'emerald'
                      : 'blue'
                  }
                >
                  {LESSON_TYPES.find(t => t.id === lessonForm.type)?.label || lessonForm.type}
                </Badge>
                {isEditing && <span className="text-xs text-slate-400">Mode Edit</span>}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {isEditing ? (lessonForm.title || 'Edit Materi') : pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
              className="shadow-md shadow-blue-500/20 px-5"
            >
              <FontAwesomeIcon icon={['fas', 'floppy-disk']} className="mr-2" />
              {isEditing ? 'Simpan Perubahan' : 'Simpan ke Silabus'}
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <form id="lesson-form" onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Pilih Tipe Materi */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pilih Format & Tipe Materi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tentukan bagaimana materi ini disampaikan kepada siswa</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {LESSON_TYPES.map((lt) => {
                const isSelected = lessonForm.type === lt.id;
                return (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => handleTypeChange(lt.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <FontAwesomeIcon icon={lt.icon} />
                      </div>
                      <h3 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">{lt.label}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">{lt.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-blue-600 dark:text-blue-400">
                        <FontAwesomeIcon icon={['fas', 'circle-check']} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Informasi Utama Materi */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Informasi Umum
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <FormField label="Judul Materi / Kuis" required>
                  <Input
                    value={lessonForm.title}
                    onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                    required
                    placeholder={
                      lessonForm.type === 'quiz'
                        ? 'Contoh: Kuis Akhir Bab 1 - Silogisme & Logika Posisi'
                        : (lessonForm.type === 'assignment' ? 'Contoh: Tugas Akhir Proyek Analisis Kasus' : 'Contoh: Pengantar Silogisme & Logika')
                    }
                    className="text-base font-medium"
                  />
                </FormField>
              </div>

              <FormField label="Durasi Estimasi Pengerjaan (Menit)">
                <Input
                  type="number"
                  min="0"
                  value={Math.round(lessonForm.duration_seconds / 60)}
                  onChange={e => setLessonForm({ ...lessonForm, duration_seconds: parseInt(e.target.value || 0) * 60 })}
                  placeholder="Durasi dalam menit"
                />
              </FormField>

              <FormField label="Akses Gratis / Pratinjau">
                <div className="flex items-center h-10 mt-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={lessonForm.is_preview}
                      onChange={e => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                        Preview Gratis
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Dapat dilihat siswa tanpa perlu mendaftar/membeli
                      </span>
                    </div>
                  </label>
                </div>
              </FormField>
            </div>

            {/* Video Input if type is video */}
            {lessonForm.type === 'video' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <FormField label="URL Video Embed (YouTube / Vimeo)" required>
                  <Input
                    value={lessonForm.video_url}
                    onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    placeholder="Contoh: https://www.youtube.com/embed/dQw4w9WgXcQ"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gunakan format embed (contoh: <code>https://www.youtube.com/embed/VIDEO_ID</code>) agar pemutar video berjalan lancar.
                  </p>
                </FormField>

                {lessonForm.video_url && lessonForm.video_url.includes('http') && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video max-w-lg">
                    <iframe
                      src={lessonForm.video_url}
                      title="Pratinjau Video"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. KHUSUS KUIS: Quiz Questions Builder */}
          {lessonForm.type === 'quiz' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Penyusun Butir Soal Kuis</h2>
                    <Badge color="amber">
                      {lessonForm.quiz_questions?.length || 0} Soal
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Susun pertanyaan kuis pilihan ganda, tentukan opsi dan kunci jawaban yang benar.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">KKM Lulus:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={lessonForm.min_pass_score}
                      onChange={e => setLessonForm({ ...lessonForm, min_pass_score: Math.max(0, Math.min(100, parseInt(e.target.value || 0))) })}
                      className="w-16 px-2 py-0.5 text-center text-sm font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg"
                    />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">%</span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={addQuizQuestion}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <FontAwesomeIcon icon={['fas', 'plus']} className="mr-1.5" /> Tambah Soal
                  </Button>
                </div>
              </div>

              {/* Notice KKM Prerequisite */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                <FontAwesomeIcon icon={['fas', 'circle-info']} className="mt-0.5 shrink-0 text-blue-500" />
                <span>
                  <strong>Syarat Kelulusan Section:</strong> Siswa harus mendapatkan nilai kuis minimal sebesar KKM ({lessonForm.min_pass_score}%) untuk dapat membuka dan melanjutkan materi pada section/bab berikutnya.
                </span>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {(lessonForm.quiz_questions || []).map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 space-y-4 hover:border-amber-300 dark:hover:border-amber-900/50 transition-colors"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-600 text-white text-xs font-black flex items-center justify-center">
                          {qIndex + 1}
                        </span>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          Pertanyaan Nomor {qIndex + 1}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuizQuestion(qIndex)}
                        className="text-xs text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1 font-medium"
                        title="Hapus Soal"
                      >
                        <FontAwesomeIcon icon={['fas', 'trash-can']} />
                        <span>Hapus Soal</span>
                      </button>
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Teks Pertanyaan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={q.question}
                        onChange={e => updateQuizQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Tuliskan butir soal atau kasus di sini..."
                        className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
                        required
                      />
                    </div>

                    {/* Options List */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Pilihan Jawaban & Kunci Jawaban
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Pilih radio button untuk menentukan kunci jawaban yang benar
                        </span>
                      </div>

                      <div className="space-y-2">
                        {(q.options || []).map((opt, optIndex) => {
                          const isCorrect = q.correct_index === optIndex;
                          const letter = OPTION_LETTERS[optIndex] || String.fromCharCode(65 + optIndex);

                          return (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800'
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              {/* Correct Radio Selector */}
                              <button
                                type="button"
                                onClick={() => setCorrectOption(qIndex, optIndex)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-700'
                                }`}
                                title={isCorrect ? 'Kunci Jawaban Benar' : 'Jadikan Kunci Jawaban'}
                              >
                                {letter}
                              </button>

                              {/* Option Input */}
                              <input
                                type="text"
                                value={opt}
                                onChange={e => updateQuizOptionText(qIndex, optIndex, e.target.value)}
                                placeholder={`Isi pilihan ${letter}...`}
                                className="flex-1 px-3 py-1.5 bg-transparent border-0 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden"
                                required
                              />

                              {isCorrect && (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full shrink-0">
                                  ✓ Kunci Benar
                                </span>
                              )}

                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeQuizOption(qIndex, optIndex)}
                                  className="text-slate-400 hover:text-red-500 p-1.5 transition-colors shrink-0"
                                  title="Hapus Opsi"
                                >
                                  <FontAwesomeIcon icon={['fas', 'xmark']} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.options?.length < 6 && (
                        <button
                          type="button"
                          onClick={() => addQuizOption(qIndex)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 py-1.5 flex items-center gap-1.5"
                        >
                          <FontAwesomeIcon icon={['fas', 'plus']} /> Tambah Pilihan Jawaban
                        </button>
                      )}
                    </div>

                    {/* Explanation */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Pembahasan & Penjelasan Jawaban (Opsional)
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={e => updateQuizQuestion(qIndex, 'explanation', e.target.value)}
                        placeholder="Penjelasan pembahasan yang akan ditampilkan setelah siswa menyelesaikan kuis..."
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Question Button at bottom */}
              <button
                type="button"
                onClick={addQuizQuestion}
                className="w-full py-4 border-2 border-dashed border-amber-300 dark:border-amber-800/60 rounded-2xl text-amber-700 dark:text-amber-400 font-bold text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={['fas', 'plus']} /> Tambah Soal Kuis Berikutnya
              </button>
            </div>
          )}

          {/* 4. Rich Text Content (Untuk Artikel, Catatan Video, atau Instruksi Tugas Akhir) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lessonForm.type === 'reading'
                  ? 'Isi Artikel & Materi Lengkap'
                  : (lessonForm.type === 'assignment' ? 'Panduan & Rubrik Penilaian Tugas' : 'Catatan / Rangkuman Materi')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lessonForm.type === 'reading'
                  ? 'Tulis materi komprehensif, konsep dasar, teori, dan contoh pemecahan masalah'
                  : 'Tulis ringkasan, instruksi pengerjaan, poin penting, atau tautan pendukung'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
              <ReactQuill
                theme="snow"
                value={lessonForm.content}
                onChange={content => setLessonForm({ ...lessonForm, content })}
                className="h-72 mb-12"
                placeholder="Tulis materi, instruksi langkah-langkah, rumus, code snippet, atau catatan di sini..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, 4, false] }],
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

          {/* 5. Lampiran Dokumen (PDF / DOCX) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Lampiran Dokumen Tambahan (Opsional)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lessonForm.type === 'assignment'
                  ? 'Unggah berkas lembar kerja soal / template pengerjaan proyek (PDF atau DOCX)'
                  : 'Unggah berkas modul pendukung, e-book, atau slide presentasi (PDF atau DOCX)'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleDocUpload}
                id="doc-upload"
                className="hidden"
              />
              <label
                htmlFor="doc-upload"
                className={`px-4 py-2.5 border text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-2 ${
                  uploadingDoc
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FontAwesomeIcon icon={uploadingDoc ? ['fas', 'spinner'] : ['fas', 'upload']} spin={uploadingDoc} />
                <span>{uploadingDoc ? 'Mengunggah Dokumen...' : 'Pilih Berkas Dokumen (PDF / DOCX)'}</span>
              </label>

              {docFile && (
                <div className="flex items-center gap-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <FontAwesomeIcon icon={['fas', 'file-pdf']} className="text-base text-emerald-600" />
                  <a
                    href={docFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline max-w-xs truncate"
                  >
                    {docFile.name}
                  </a>
                  <button
                    type="button"
                    onClick={handleRemoveDoc}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Hapus Lampiran"
                  >
                    <FontAwesomeIcon icon={['fas', 'xmark']} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => navigate(backUrl)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={saving || uploadingDoc}
              size="lg"
              className="shadow-lg shadow-blue-500/25 px-8"
            >
              <FontAwesomeIcon icon={['fas', 'floppy-disk']} className="mr-2" />
              {isEditing ? 'Simpan Perubahan' : 'Simpan Materi / Kuis'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
