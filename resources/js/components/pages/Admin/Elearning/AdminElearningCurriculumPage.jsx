import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import Badge from '../../../atoms/Badge';
import FormField from '../../../molecules/FormField';
import DocumentPreviewModal from '../../../molecules/DocumentPreviewModal';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toEmbedUrl } from '../../../../utils/videoHelper';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminElearningCurriculumPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: '' });
  const [previewLesson, setPreviewLesson] = useState(null);

  // Document preview state
  const [previewDocModal, setPreviewDocModal] = useState({
    isOpen: false,
    fileUrl: '',
    fileName: '',
  });

  // Assignment Submissions Management Modal state
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedAssignmentLesson, setSelectedAssignmentLesson] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', feedback: '', grade: 100 });

  const [activeModuleId, setActiveModuleId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '', type: 'video', video_url: '', content: '', is_preview: false, duration_seconds: 0,
    attachment_doc: '', attachment_name: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, modulesRes] = await Promise.all([
        api.get(`/admin/elearning/courses/${courseId}`),
        api.get(`/admin/elearning/courses/${courseId}/modules`)
      ]);
      setCourse(courseRes.data);
      setModules(modulesRes.data);
    } catch (err) {
      toast.error('Gagal memuat kurikulum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // MODULE HANDLERS
  const openModuleModal = (mod = null, defaultTitle = '') => {
    if (mod) {
      setModuleForm({ title: mod.title });
      setEditingModuleId(mod.id);
    } else {
      setModuleForm({ title: defaultTitle || '' });
      setEditingModuleId(null);
    }
    setModuleModalOpen(true);
  };

  const saveModule = async (e) => {
    e.preventDefault();
    try {
      if (editingModuleId) {
        await api.put(`/admin/elearning/courses/${courseId}/modules/${editingModuleId}`, moduleForm);
        toast.success('Kelompok materi diperbarui');
      } else {
        await api.post(`/admin/elearning/courses/${courseId}/modules`, moduleForm);
        toast.success('Kelompok materi ditambahkan');
      }
      setModuleModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan kelompok materi');
    }
  };

  const deleteModule = async (id) => {
    if (confirm('Yakin ingin menghapus kelompok materi ini dan semua isinya?')) {
      try {
        await api.delete(`/admin/elearning/courses/${courseId}/modules/${id}`);
        toast.success('Kelompok materi dihapus');
        fetchData();
      } catch (err) {
        toast.error('Gagal menghapus');
      }
    }
  };

  // LESSON HANDLERS
  const openLessonModal = (moduleId, lesson = null, defaultType = 'video') => {
    setActiveModuleId(moduleId);
    if (lesson) {
      setLessonForm({
        title: lesson.title,
        type: lesson.type || 'video',
        video_url: lesson.video_url || '',
        content: lesson.content || '',
        is_preview: lesson.is_preview || false,
        duration_seconds: lesson.duration_seconds || 0,
        attachment_doc: lesson.attachment_doc || '',
        attachment_name: lesson.attachment_name || '',
        min_pass_score: lesson.min_pass_score !== undefined && lesson.min_pass_score !== null ? lesson.min_pass_score : 60,
        quiz_questions: Array.isArray(lesson.quiz_questions) && lesson.quiz_questions.length > 0
          ? lesson.quiz_questions
          : (lesson.type === 'quiz' ? [{ question: '', options: ['', ''], correct_index: 0, explanation: '' }] : [])
      });
      setEditingLessonId(lesson.id);
    } else {
      setLessonForm({
        title: defaultType === 'quiz' ? 'Kuis Akhir Kelompok Materi' : (defaultType === 'assignment' ? 'Tugas Akhir Modul' : ''),
        type: defaultType,
        video_url: '',
        content: '',
        is_preview: false,
        duration_seconds: defaultType === 'quiz' ? 600 : (defaultType === 'assignment' ? 3600 : 0),
        attachment_doc: '',
        attachment_name: '',
        min_pass_score: 60,
        quiz_questions: defaultType === 'quiz' ? [{ question: '', options: ['', ''], correct_index: 0, explanation: '' }] : []
      });
      setEditingLessonId(null);
    }
    setLessonModalOpen(true);
  };

  const handleDocumentUpload = async (e) => {
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

    const formData = new FormData();
    formData.append('file', file);

    setUploadingDoc(true);
    try {
      const res = await api.post('/admin/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLessonForm(prev => ({
        ...prev,
        attachment_doc: res.data.url,
        attachment_name: res.data.original_name || file.name,
      }));
      toast.success('Dokumen berhasil diunggah!');
    } catch (err) {
      toast.error('Gagal mengunggah dokumen.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const openSubmissionsModal = async (moduleId, lesson) => {
    setSelectedAssignmentLesson(lesson);
    setActiveModuleId(moduleId);
    setSubmissionsModalOpen(true);
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/admin/elearning/modules/${moduleId}/lessons/${lesson.id}/submissions`);
      setAssignmentSubmissions(res.data.submissions || []);
    } catch (err) {
      toast.error('Gagal memuat daftar pengumpulan tugas');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const startReviewSubmission = (sub) => {
    setReviewingSubmissionId(sub.id);
    setReviewForm({
      status: sub.status === 'revision_needed' ? 'revision_needed' : 'approved',
      feedback: sub.feedback || '',
      grade: sub.grade || 100,
    });
  };

  const submitReview = async (submissionId) => {
    try {
      const res = await api.post(`/admin/elearning/submissions/${submissionId}/review`, reviewForm);
      toast.success(res.data.message || 'Review berhasil disimpan');
      setReviewingSubmissionId(null);
      // Refresh list
      const updated = assignmentSubmissions.map(s => s.id === submissionId ? res.data.submission : s);
      setAssignmentSubmissions(updated);
    } catch (err) {
      toast.error('Gagal menyimpan review tugas');
    }
  };

  // QUIZ BUILDER HELPERS
  const addQuizQuestion = () => {
    setLessonForm({
      ...lessonForm,
      quiz_questions: [
        ...(lessonForm.quiz_questions || []),
        { question: '', options: ['', ''], correct_index: 0, explanation: '' }
      ]
    });
  };

  const removeQuizQuestion = (qIndex) => {
    setLessonForm({
      ...lessonForm,
      quiz_questions: (lessonForm.quiz_questions || []).filter((_, i) => i !== qIndex)
    });
  };

  const updateQuizQuestion = (qIndex, field, value) => {
    const updated = [...(lessonForm.quiz_questions || [])];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    setLessonForm({ ...lessonForm, quiz_questions: updated });
  };

  const addQuizOption = (qIndex) => {
    const updated = [...(lessonForm.quiz_questions || [])];
    const currentOptions = updated[qIndex].options || [];
    updated[qIndex] = {
      ...updated[qIndex],
      options: [...currentOptions, '']
    };
    setLessonForm({ ...lessonForm, quiz_questions: updated });
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
      correct_index: newCorrect
    };
    setLessonForm({ ...lessonForm, quiz_questions: updated });
  };

  const updateQuizOptionText = (qIndex, optIndex, text) => {
    const updated = [...(lessonForm.quiz_questions || [])];
    const currentOptions = [...(updated[qIndex].options || [])];
    currentOptions[optIndex] = text;
    updated[qIndex] = { ...updated[qIndex], options: currentOptions };
    setLessonForm({ ...lessonForm, quiz_questions: updated });
  };

  const saveLesson = async (e) => {
    e.preventDefault();
    // Validate quiz if type is quiz
    if (lessonForm.type === 'quiz') {
      if (!lessonForm.quiz_questions || lessonForm.quiz_questions.length === 0) {
        toast.error('Harap tambahkan minimal 1 soal kuis.');
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
            toast.error(`Pilihan ${j + 1} pada pertanyaan nomor ${i + 1} belum diisi.`);
            return;
          }
        }
      }
    }

    try {
      if (editingLessonId) {
        await api.put(`/admin/elearning/modules/${activeModuleId}/lessons/${editingLessonId}`, lessonForm);
        toast.success('Materi diperbarui');
      } else {
        await api.post(`/admin/elearning/modules/${activeModuleId}/lessons`, lessonForm);
        toast.success('Materi ditambahkan');
      }
      setLessonModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan materi');
    }
  };

  const deleteLesson = async (moduleId, lessonId) => {
    if (confirm('Yakin ingin menghapus materi ini?')) {
      try {
        await api.delete(`/admin/elearning/modules/${moduleId}/lessons/${lessonId}`);
        toast.success('Materi dihapus');
        fetchData();
      } catch (err) {
        toast.error('Gagal menghapus materi');
      }
    }
  };

  return (
    <AppLayout title="Silabus & Kurikulum">
      <div className="max-w-4xl mx-auto pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/elearning">
              <Button variant="ghost" size="sm">← Kembali</Button>
            </Link>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Silabus: {course?.title || 'Memuat...'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => openModuleModal()}>+ Tambah Kelompok Materi (Section)</Button>
            {!modules.some(m => m.title.toLowerCase().includes('tugas akhir') || m.lessons?.some(l => l.type === 'assignment')) && (
              <Button
                onClick={() => openModuleModal(null, 'Tugas Akhir')}
                className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-sm"
              >
                <FontAwesomeIcon icon={['fas', 'file-lines']} className="mr-1.5" />
                + Tambah Section Tugas Akhir
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : modules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500">
            Belum ada silabus. Mulai dengan membuat Kelompok Materi (Section).
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map((mod, idx) => (
              <div key={mod.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                {/* Module Header */}
                <div className={`p-4 border-b flex justify-between items-center ${
                  mod.title.toLowerCase().includes('tugas akhir') || mod.lessons?.some(l => l.type === 'assignment')
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-lg">Section {idx + 1}: {mod.title}</h3>
                    {(mod.title.toLowerCase().includes('tugas akhir') || mod.lessons?.some(l => l.type === 'assignment')) && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <FontAwesomeIcon icon={['fas', 'graduation-cap']} className="mr-1" />
                        Section Tugas Akhir
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openModuleModal(mod)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteModule(mod.id)}>Hapus</Button>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="p-4">
                  {mod.lessons?.length === 0 ? (
                    <p className="text-sm text-slate-500 italic mb-4">Belum ada materi di section ini.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {mod.lessons.map((lesson, lIdx) => (
                        <div key={lesson.id} className="group flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer" onClick={() => openLessonModal(mod.id, lesson)}>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono text-sm">{idx + 1}.{lIdx + 1}</span>
                            <span className="text-lg w-6 text-center text-slate-500">
                              {lesson.type === 'video' ? <FontAwesomeIcon icon={['fas', 'video']} /> : 
                               lesson.type === 'quiz' ? <FontAwesomeIcon icon={['fas', 'circle-question']} /> : 
                               lesson.type === 'assignment' ? <FontAwesomeIcon icon={['fas', 'pen-to-square']} /> : 
                               <FontAwesomeIcon icon={['fas', 'book-open']} />}
                            </span>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                {lesson.title}
                                {lesson.is_preview && <Badge color="gold" className="text-[10px]">Preview</Badge>}
                                {lesson.attachment_doc && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50">
                                    <FontAwesomeIcon icon={['fas', 'paperclip']} className="text-[10px]" />
                                    {lesson.attachment_name || 'Dokumen Panduan'}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 capitalize">{lesson.type} • {lesson.duration_seconds > 0 ? Math.round(lesson.duration_seconds/60) + ' mnt' : '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            {lesson.attachment_doc && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewDocModal({
                                    isOpen: true,
                                    fileUrl: lesson.attachment_doc,
                                    fileName: lesson.attachment_name || 'Panduan Tugas.pdf',
                                  });
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded flex items-center gap-1.5"
                                title="Baca Dokumen Panduan"
                              >
                                <FontAwesomeIcon icon={['fas', 'file-pdf']} />
                                Baca Dokumen
                              </button>
                            )}

                            {lesson.type === 'assignment' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); openSubmissionsModal(mod.id, lesson); }}
                                className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 rounded flex items-center gap-1.5"
                                title="Lihat & Nilai Tugas Siswa"
                              >
                                <FontAwesomeIcon icon={['fas', 'users-viewfinder']} />
                                Periksa Tugas Siswa
                              </button>
                            )}

                            {lesson.type === 'video' && lesson.video_url && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setPreviewLesson(lesson); }}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded flex items-center justify-center w-8 h-8"
                                title="Preview Video"
                              >
                                <FontAwesomeIcon icon={['fas', 'play']} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); openLessonModal(mod.id, lesson); }}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded flex items-center justify-center w-8 h-8"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={['fas', 'pen-to-square']} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteLesson(mod.id, lesson.id); }}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded flex items-center justify-center w-8 h-8"
                              title="Hapus"
                            >
                              <FontAwesomeIcon icon={['fas', 'trash-can']} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const isAssignmentSection = mod.title.toLowerCase().includes('tugas akhir') || mod.lessons?.some(l => l.type === 'assignment');

                    if (isAssignmentSection) {
                      return (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 dark:text-purple-400 flex-1 border border-dashed border-purple-300 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            onClick={() => openLessonModal(mod.id, null, 'assignment')}
                          >
                            <FontAwesomeIcon icon={['fas', 'file-lines']} className="mr-1" /> + Tambah Tugas Akhir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 flex-1 border border-dashed border-blue-200 dark:border-blue-900"
                            onClick={() => openLessonModal(mod.id, null, 'reading')}
                          >
                            + Tambah Panduan / Artikel
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 flex-1 border border-dashed border-blue-200 dark:border-blue-900"
                          onClick={() => openLessonModal(mod.id, null, 'video')}
                        >
                          + Tambah Materi
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 dark:text-amber-400 flex-1 border border-dashed border-amber-300 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          onClick={() => openLessonModal(mod.id, null, 'quiz')}
                        >
                          <FontAwesomeIcon icon={['fas', 'clipboard-question']} className="mr-1" /> + Tambah Kuis Akhir Section
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Module */}
        {moduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-md w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">{editingModuleId ? 'Edit Section' : 'Tambah Section Baru'}</h3>
              <form onSubmit={saveModule} className="space-y-4">
                <FormField label="Judul Section (Kelompok Materi)">
                  <Input value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} required placeholder="Misal: Pengantar Aljabar" />
                </FormField>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setModuleModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Lesson */}
        {lessonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className={`bg-white dark:bg-slate-900 rounded-xl w-full ${lessonForm.type === 'quiz' ? 'max-w-3xl' : 'max-w-xl'} p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingLessonId ? (lessonForm.type === 'quiz' ? 'Edit Kuis Akhir Section' : 'Edit Materi') : (lessonForm.type === 'quiz' ? 'Tambah Kuis Akhir Section' : 'Tambah Materi Baru')}
                </h3>
                <button onClick={() => setLessonModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <FontAwesomeIcon icon={['fas', 'xmark']} className="text-lg" />
                </button>
              </div>

              <form onSubmit={saveLesson} className="space-y-4">
                <FormField label="Judul Materi / Kuis" required>
                  <Input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required placeholder="Contoh: Kuis Akhir Pemahaman Silogisme" />
                </FormField>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Tipe Materi">
                    <select value={lessonForm.type} onChange={e => setLessonForm({...lessonForm, type: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent text-sm">
                      <option value="video">Video Pembelajaran</option>
                      <option value="reading">Artikel / Teks</option>
                      <option value="quiz">Kuis Pilihan Ganda (Dinamis)</option>
                      <option value="assignment">Tugas Akhir / Proyek</option>
                    </select>
                  </FormField>
                  <FormField label="Durasi Estimasi (Menit)">
                    <Input type="number" min="0" value={Math.round(lessonForm.duration_seconds/60)} onChange={e => setLessonForm({...lessonForm, duration_seconds: parseInt(e.target.value || 0)*60})} />
                  </FormField>
                </div>

                {lessonForm.type === 'video' && (
                  <FormField label="URL Video (Youtube/Vimeo Embed URL)">
                    <Input value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} placeholder="https://www.youtube.com/embed/..." />
                  </FormField>
                )}

                {(lessonForm.type === 'reading' || lessonForm.type === 'assignment') && (
                  <>
                    <FormField label="Konten / Instruksi Materi">
                      <div className="bg-white text-slate-900 rounded-md overflow-hidden border border-slate-300">
                        <ReactQuill 
                          theme="snow" 
                          value={lessonForm.content || ''} 
                          onChange={val => setLessonForm({...lessonForm, content: val})} 
                          className="h-48 pb-10"
                          placeholder="Ketik materi atau instruksi tugas di sini..." 
                        />
                      </div>
                    </FormField>

                    {/* Document attachment (PDF/DOCX) upload for Assignment or Reading */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <FontAwesomeIcon icon={['fas', 'file-arrow-up']} className="text-indigo-600 dark:text-indigo-400" />
                            Dokumen / Lembar Panduan Tugas (PDF / DOCX)
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Unggah berkas soal atau format panduan agar siswa dan instruktur dapat langsung membacanya.
                          </p>
                        </div>
                        {lessonForm.attachment_doc && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocModal({
                              isOpen: true,
                              fileUrl: lessonForm.attachment_doc,
                              fileName: lessonForm.attachment_name || 'Dokumen Panduan',
                            })}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded flex items-center gap-1"
                          >
                            <FontAwesomeIcon icon={['fas', 'eye']} />
                            Preview Dokumen
                          </button>
                        )}
                      </div>

                      {lessonForm.attachment_doc ? (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                              <FontAwesomeIcon icon={['fas', 'file-pdf']} />
                            </span>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {lessonForm.attachment_name || 'Dokumen terlampir'}
                              </p>
                              <a
                                href={lessonForm.attachment_doc}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                              >
                                {lessonForm.attachment_doc}
                              </a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLessonForm({ ...lessonForm, attachment_doc: '', attachment_name: '' })}
                            className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Hapus Berkas
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-indigo-500 cursor-pointer transition-colors bg-white dark:bg-slate-900">
                            <FontAwesomeIcon icon={['fas', 'cloud-arrow-up']} className="text-2xl text-slate-400 mb-1" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {uploadingDoc ? 'Mengunggah...' : 'Klik untuk mengunggah dokumen PDF atau Word (DOCX)'}
                            </span>
                            <span className="text-[10px] text-slate-400">Maks. ukuran 20MB</span>
                            <input
                              type="file"
                              accept=".pdf,.docx,.doc"
                              className="hidden"
                              onChange={handleDocumentUpload}
                              disabled={uploadingDoc}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* DYNAMIC QUIZ BUILDER */}
                {lessonForm.type === 'quiz' && (
                  <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <FontAwesomeIcon icon={['fas', 'circle-info']} className="mt-0.5 shrink-0" />
                      <div>
                        <strong>Aturan Kelulusan:</strong> Siswa harus mencapai minimal persentase nilai kelulusan agar kelompok materi berikutnya terbuka. Pilihan jawaban berupa opsi langsung (tanpa kode A/B/C) dan jumlahnya dinamis.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Nilai Minimum Kelulusan (%)" required>
                        <Input
                          type="number"
                          min="10"
                          max="100"
                          value={lessonForm.min_pass_score || 60}
                          onChange={e => setLessonForm({...lessonForm, min_pass_score: parseInt(e.target.value || 60)})}
                        />
                      </FormField>
                    </div>

                    {/* Question List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Daftar Soal Kuis ({(lessonForm.quiz_questions || []).length})
                        </span>
                        <Button type="button" size="sm" variant="ghost" className="text-blue-600 border border-blue-300 dark:border-blue-700" onClick={addQuizQuestion}>
                          <FontAwesomeIcon icon={['fas', 'plus']} className="mr-1" /> Tambah Soal
                        </Button>
                      </div>

                      {(lessonForm.quiz_questions || []).length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-400 text-xs">
                          Belum ada soal. Klik "+ Tambah Soal" di atas untuk menambahkan pertanyaan kuis.
                        </div>
                      ) : (
                        lessonForm.quiz_questions.map((q, qIdx) => (
                          <div key={qIdx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                                  {qIdx + 1}
                                </span>
                                Soal Nomor {qIdx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeQuizQuestion(qIdx)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <FontAwesomeIcon icon={['fas', 'trash-can']} /> Hapus Soal
                              </button>
                            </div>

                            <FormField label="Teks Pertanyaan">
                              <textarea
                                rows={2}
                                value={q.question || ''}
                                onChange={e => updateQuizQuestion(qIdx, 'question', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-1 focus:ring-blue-500"
                                placeholder="Ketik pertanyaan kuis di sini..."
                                required
                              />
                            </FormField>

                            {/* Dynamic Answer Options */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  Pilihan Jawaban (Tandai lingkaran untuk Kunci Jawaban yang benar):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addQuizOption(qIdx)}
                                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  + Tambah Opsi Jawaban
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(q.options || []).map((opt, optIdx) => {
                                  const isCorrect = (q.correct_index === optIdx);
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                        isCorrect
                                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                      }`}
                                    >
                                      <label className="cursor-pointer flex items-center gap-1.5 shrink-0 px-1" title="Tandai sebagai jawaban yang benar">
                                        <input
                                          type="radio"
                                          name={`correct_${qIdx}`}
                                          checked={isCorrect}
                                          onChange={() => updateQuizQuestion(qIdx, 'correct_index', optIdx)}
                                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <span className={`text-xs font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                                          {isCorrect ? 'Benar' : 'Pilihan'}
                                        </span>
                                      </label>

                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={e => updateQuizOptionText(qIdx, optIdx, e.target.value)}
                                        placeholder={`Ketik pilihan jawaban ${optIdx + 1}...`}
                                        className="flex-1 p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                      />

                                      {(q.options || []).length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => removeQuizOption(qIdx, optIdx)}
                                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                                          title="Hapus pilihan ini"
                                        >
                                          <FontAwesomeIcon icon={['fas', 'xmark']} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <FormField label="Pembahasan / Penjelasan Jawaban (Opsional)">
                              <input
                                type="text"
                                value={q.explanation || ''}
                                onChange={e => updateQuizQuestion(qIdx, 'explanation', e.target.value)}
                                placeholder="Penjelasan kenapa jawaban tersebut benar..."
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm"
                              />
                            </FormField>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <FormField label="Hak Akses">
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
                    <input type="checkbox" checked={lessonForm.is_preview} onChange={e => setLessonForm({...lessonForm, is_preview: e.target.checked})} className="w-4 h-4 text-gold-500" />
                    <span>Jadikan Preview (Bisa diakses gratis tanpa enroll)</span>
                  </label>
                </FormField>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setLessonModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan {lessonForm.type === 'quiz' ? 'Kuis' : 'Materi'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Video Preview Modal */}
        {previewLesson && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewLesson(null)}>
            <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{previewLesson.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Preview Video</p>
                  </div>
                  <button
                    onClick={() => setPreviewLesson(null)}
                    className="w-8 h-8 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-900 dark:text-slate-100"
                  >
                    <FontAwesomeIcon icon={['fas', 'xmark']} />
                  </button>
                </div>
                <div className="aspect-video bg-slate-900">
                  <iframe
                    width="100%"
                    height="100%"
                    src={toEmbedUrl(previewLesson.video_url)}
                    title={previewLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Assignment Submissions Review Modal */}
        {submissionsModalOpen && selectedAssignmentLesson && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FontAwesomeIcon icon={['fas', 'users-viewfinder']} className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Pemeriksaan Tugas: {selectedAssignmentLesson.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tinjau dokumen yang dikumpulkan oleh siswa, berikan catatan revisi, atau setujui kelulusan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSubmissionsModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <FontAwesomeIcon icon={['fas', 'xmark']} />
                </button>
              </div>

              {/* Submissions List Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingSubmissions ? (
                  <div className="text-center py-12 text-slate-400">
                    <FontAwesomeIcon icon={['fas', 'spinner']} spin className="text-2xl mb-2 text-purple-600" />
                    <p className="text-sm">Memuat pengumpulan tugas siswa...</p>
                  </div>
                ) : assignmentSubmissions.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <FontAwesomeIcon icon={['fas', 'inbox']} className="text-4xl text-slate-300 dark:text-slate-600 mb-3" />
                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Pengumpulan</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Belum ada siswa yang mengumpulkan tugas untuk materi ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignmentSubmissions.map((sub) => {
                      const isReviewingThis = reviewingSubmissionId === sub.id;
                      const isPdf = sub.file_url.toLowerCase().includes('.pdf') || sub.filename?.toLowerCase().endsWith('.pdf');

                      return (
                        <div
                          key={sub.id}
                          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-xs hover:border-purple-300 dark:hover:border-purple-800/60 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm">
                                {sub.user?.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                    {sub.user?.name || 'Siswa'}
                                  </h4>
                                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                                    Versi {sub.version || 1}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  {sub.user?.email} • Dikumpulkan {new Date(sub.created_at).toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {sub.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <FontAwesomeIcon icon={['fas', 'circle-check']} />
                                  Disetujui {sub.grade !== null && `(Nilai: ${sub.grade})`}
                                </span>
                              ) : sub.status === 'revision_needed' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} />
                                  Perlu Revisi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <FontAwesomeIcon icon={['fas', 'clock']} />
                                  Menunggu Review
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Body info: file & notes */}
                          <div className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
                                isPdf ? 'bg-red-50 text-red-600 dark:bg-red-950/40' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'
                              }`}>
                                <FontAwesomeIcon icon={['fas', isPdf ? 'file-pdf' : 'file-word']} />
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {sub.filename}
                                </p>
                                {sub.notes && (
                                  <p className="text-xs text-slate-500 italic mt-0.5">
                                    Catatan Siswa: "{sub.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Read Document Modal Trigger */}
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({
                                  isOpen: true,
                                  fileUrl: sub.file_url,
                                  fileName: sub.filename,
                                })}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <FontAwesomeIcon icon={['fas', 'book-open-reader']} />
                                Baca Dokumen Siswa
                              </button>

                              {!isReviewingThis && (
                                <button
                                  type="button"
                                  onClick={() => startReviewSubmission(sub)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                                >
                                  <FontAwesomeIcon icon={['fas', 'pen-to-square']} />
                                  {sub.status === 'submitted' ? 'Beri Penilaian / Catatan' : 'Ubah Hasil Review'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Existing feedback if reviewed */}
                          {sub.feedback && !isReviewingThis && (
                            <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Catatan / Feedback Instruktur ({sub.reviewer?.name || 'Instruktur'}):
                              </span>
                              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{sub.feedback}</p>
                            </div>
                          )}

                          {/* Review Input Box */}
                          {isReviewingThis && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-xl">
                              <h5 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                Form Penilaian & Keputusan Instruktur
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Keputusan Review
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })}
                                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                                        reviewForm.status === 'approved'
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <FontAwesomeIcon icon={['fas', 'check']} />
                                      Setujui Tugas (Lulus)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setReviewForm({ ...reviewForm, status: 'revision_needed' })}
                                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                                        reviewForm.status === 'revision_needed'
                                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <FontAwesomeIcon icon={['fas', 'rotate-left']} />
                                      Tolak & Minta Revisi
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Nilai Tugas (0 - 100)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={reviewForm.grade}
                                    onChange={(e) => setReviewForm({ ...reviewForm, grade: parseInt(e.target.value || 0) })}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Catatan / Umpan Balik Perbaikan untuk Siswa (Wajib diisi bila meminta revisi)
                                </label>
                                <textarea
                                  rows="3"
                                  value={reviewForm.feedback}
                                  onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                                  placeholder="Contoh: Perlu penjelasan lebih mendalam pada bab analisis, data perbandingan belum lengkap..."
                                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setReviewingSubmissionId(null)}
                                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => submitReview(sub.id)}
                                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                                >
                                  Simpan Keputusan Review
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Document Preview Modal */}
        <DocumentPreviewModal
          isOpen={previewDocModal.isOpen}
          onClose={() => setPreviewDocModal({ ...previewDocModal, isOpen: false })}
          fileUrl={previewDocModal.fileUrl}
          fileName={previewDocModal.fileName}
        />
      </div>
    </AppLayout>
  );
}
