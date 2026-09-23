import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  // Collapse State (Dicoding Accordion model)
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (modules && modules.length > 0) {
      setExpandedModules((prev) => {
        const next = { ...prev };
        modules.forEach((m) => {
          if (next[m.id] === undefined) {
            next[m.id] = true;
          }
        });
        return next;
      });
    }
  }, [modules]);

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllModules = (expand) => {
    const next = {};
    modules.forEach((m) => {
      next[m.id] = expand;
    });
    setExpandedModules(next);
  };

  const allModulesExpanded = useMemo(() => {
    if (!modules || modules.length === 0) return false;
    return modules.every((m) => expandedModules[m.id]);
  }, [modules, expandedModules]);

  const totalLessons = useMemo(() => {
    return modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  }, [modules]);

  const lessonsByType = useMemo(() => {
    const counts = { video: 0, reading: 0, quiz: 0, assignment: 0 };
    modules.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        if (counts[l.type] !== undefined) {
          counts[l.type]++;
        } else {
          counts[l.type] = 1;
        }
      });
    });
    return counts;
  }, [modules]);

  const totalDurationSeconds = useMemo(() => {
    return modules.reduce((sum, m) => {
      const modSum = (m.lessons || []).reduce((lSum, l) => lSum + (Number(l.duration_seconds) || 0), 0);
      return sum + modSum;
    }, 0);
  }, [modules]);

  const formatTotalDuration = (totalSec) => {
    if (!totalSec || totalSec <= 0) return '0 Menit';
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    if (hours > 0 && minutes > 0) {
      return `${hours} Jam ${minutes} Menit`;
    } else if (hours > 0) {
      return `${hours} Jam`;
    }
    return `${minutes} Menit`;
  };

  const formatModuleDuration = (lessons = []) => {
    const totalSec = lessons.reduce((sum, l) => sum + (Number(l.duration_seconds) || 0), 0);
    if (!totalSec || totalSec <= 0) return '15 Menit';
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}j ${minutes}m`;
    if (hours > 0) return `${hours} Jam`;
    return `${minutes} Menit`;
  };

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
      <div className="w-full pb-16 space-y-6">
        {/* Top Navigation & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link to="/admin/elearning">
              <Button variant="ghost" size="sm" className="h-9 px-3">
                ← Kembali
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Manajemen Kurikulum
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-500">
                  {course?.category || 'E-Learning'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                Silabus: {course?.title || 'Memuat...'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {modules.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleAllModules(!allModulesExpanded)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              >
                <FontAwesomeIcon icon={['fas', allModulesExpanded ? 'compress' : 'expand']} className="mr-1.5 text-slate-400" />
                {allModulesExpanded ? 'Tutup Semua Section' : 'Buka Semua Section'}
              </Button>
            )}

            <Button
              onClick={() => openModuleModal()}
              size="sm"
              className="!bg-blue-600 hover:!bg-blue-700 text-white text-xs font-bold shadow-xs"
            >
              + Tambah Section Modul
            </Button>

            {!modules.some(m => m.title.toLowerCase().includes('tugas akhir') || m.lessons?.some(l => l.type === 'assignment')) && (
              <Button
                onClick={() => openModuleModal(null, 'Tugas Akhir')}
                size="sm"
                className="!bg-purple-600 hover:!bg-purple-700 text-white text-xs font-bold border-none shadow-xs"
              >
                <FontAwesomeIcon icon={['fas', 'graduation-cap']} className="mr-1.5" />
                + Tambah Section Tugas Akhir
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Memuat kurikulum materi...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT COLUMN: COLLAPSIBLE SILABUS & MATERI (lg:col-span-8) ── */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Daftar Section & Materi Pembelajaran</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                      {modules.length} Section
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Klik judul section untuk membuka atau menutup daftar materi (model collapse).
                  </p>
                </div>
              </div>

              {modules.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-xl">
                    <FontAwesomeIcon icon={['fas', 'folder-plus']} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Belum ada silabus untuk kursus ini
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Mulai susun kurikulum dengan membuat kelompok materi pertama Anda.
                  </p>
                  <Button onClick={() => openModuleModal()} className="!bg-blue-600 text-white font-bold text-xs px-4 py-2">
                    + Buat Section Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((mod, idx) => {
                    const isExpanded = !!expandedModules[mod.id];
                    const isAssignmentSection =
                      mod.title.toLowerCase().includes('tugas akhir') ||
                      mod.lessons?.some((l) => l.type === 'assignment');
                    const modQuizCount = mod.lessons?.filter((l) => l.type === 'quiz').length || 0;
                    const modDurationText = formatModuleDuration(mod.lessons);

                    return (
                      <div
                        key={mod.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-all"
                      >
                        {/* Module Collapsible Header */}
                        <div
                          onClick={() => toggleModule(mod.id)}
                          className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors border-b ${
                            isExpanded
                              ? 'border-slate-200 dark:border-slate-800'
                              : 'border-transparent'
                          } ${
                            isAssignmentSection
                              ? 'bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-950/50'
                              : 'bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100/90 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Chevron Collapse Indicator */}
                            <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 text-xs shrink-0 transition-transform">
                              <FontAwesomeIcon icon={['fas', isExpanded ? 'chevron-down' : 'chevron-right']} />
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                                  Section {idx + 1}: {mod.title}
                                </h3>

                                {isAssignmentSection && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    <FontAwesomeIcon icon={['fas', 'graduation-cap']} className="mr-1" />
                                    Tugas Akhir
                                  </span>
                                )}
                              </div>

                              {/* Dicoding Meta Badges */}
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="px-2 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                  {mod.lessons?.length || 0} Materi
                                </span>
                                {modQuizCount > 0 && (
                                  <span className="px-2 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 font-semibold text-amber-800 dark:text-amber-300">
                                    {modQuizCount} Kuis
                                  </span>
                                )}
                                <span className="px-2 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 font-semibold text-blue-700 dark:text-blue-300">
                                  {modDurationText}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Section Action Controls */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openModuleModal(mod)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700"
                              title="Edit Judul Section"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteModule(mod.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200/60 dark:border-red-900/50"
                              title="Hapus Section"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Content: Zero-gap seamless lesson list */}
                        {isExpanded && (
                          <div className="bg-white dark:bg-slate-900">
                            {mod.lessons?.length === 0 ? (
                              <div className="p-6 text-center text-xs text-slate-400 italic">
                                Belum ada materi di section ini. Silakan tambahkan materi pertama melalui tombol di bawah.
                              </div>
                            ) : (
                              /* Zero gap / seamless table rows */
                              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {mod.lessons.map((lesson, lIdx) => (
                                  <div
                                    key={lesson.id}
                                    onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/${lesson.id}/edit`)}
                                    className="group flex items-center justify-between py-3 px-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="text-slate-400 font-mono text-xs w-6 text-center shrink-0">
                                        {idx + 1}.{lIdx + 1}
                                      </span>

                                      {/* Type Icon */}
                                      <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                          lesson.type === 'video'
                                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                                            : lesson.type === 'quiz'
                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                                            : lesson.type === 'assignment'
                                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600'
                                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                                        }`}
                                      >
                                        {lesson.type === 'video' ? <FontAwesomeIcon icon={['fas', 'video']} /> :
                                         lesson.type === 'quiz' ? <FontAwesomeIcon icon={['fas', 'circle-question']} /> :
                                         lesson.type === 'assignment' ? <FontAwesomeIcon icon={['fas', 'pen-to-square']} /> :
                                         <FontAwesomeIcon icon={['fas', 'book-open']} />}
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors truncate">
                                            {lesson.title}
                                          </p>
                                          {lesson.is_preview && (
                                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                              Gratis Preview
                                            </span>
                                          )}
                                          {lesson.attachment_doc && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2 py-0.2 rounded border border-red-200/60">
                                              <FontAwesomeIcon icon={['fas', 'paperclip']} className="text-[9px]" />
                                              {lesson.attachment_name || 'Dokumen Panduan'}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                                          {lesson.type} • {lesson.duration_seconds > 0 ? `${Math.round(lesson.duration_seconds / 60)} mnt` : 'Tanpa durasi'}
                                          {lesson.type === 'quiz' && (
                                            <span> • Min. Skor {lesson.min_pass_score || 60}%</span>
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                                      {lesson.attachment_doc && (
                                        <button
                                          onClick={() => {
                                            setPreviewDocModal({
                                              isOpen: true,
                                              fileUrl: lesson.attachment_doc,
                                              fileName: lesson.attachment_name || 'Panduan Tugas.pdf',
                                            });
                                          }}
                                          className="px-2 py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 rounded flex items-center gap-1"
                                          title="Baca Dokumen Panduan"
                                        >
                                          <FontAwesomeIcon icon={['fas', 'file-pdf']} />
                                          <span className="hidden sm:inline">Dokumen</span>
                                        </button>
                                      )}

                                      {lesson.type === 'assignment' && (
                                        <button
                                          onClick={() => openSubmissionsModal(mod.id, lesson)}
                                          className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 rounded flex items-center gap-1"
                                          title="Lihat & Nilai Tugas Siswa"
                                        >
                                          <FontAwesomeIcon icon={['fas', 'users-viewfinder']} />
                                          <span className="hidden sm:inline">Periksa Tugas</span>
                                        </button>
                                      )}

                                      {lesson.type === 'video' && lesson.video_url && (
                                        <button
                                          onClick={() => setPreviewLesson(lesson)}
                                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                                          title="Preview Video"
                                        >
                                          <FontAwesomeIcon icon={['fas', 'play']} className="text-xs" />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/${lesson.id}/edit`)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                        title="Edit Materi"
                                      >
                                        <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="text-xs" />
                                      </button>

                                      <button
                                        onClick={() => deleteLesson(mod.id, lesson.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                        title="Hapus Materi"
                                      >
                                        <FontAwesomeIcon icon={['fas', 'trash-can']} className="text-xs" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Section Quick Add Action Bar */}
                            <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                              {isAssignmentSection ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-600 dark:text-purple-400 flex-1 border border-dashed border-purple-300 dark:border-purple-900/50 hover:bg-purple-50 text-xs"
                                    onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create?type=assignment`)}
                                  >
                                    <FontAwesomeIcon icon={['fas', 'file-lines']} className="mr-1" /> + Tambah Tugas Akhir
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 flex-1 border border-dashed border-blue-200 dark:border-blue-900 text-xs"
                                    onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create?type=reading`)}
                                  >
                                    + Tambah Panduan / Artikel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 flex-1 border border-dashed border-blue-200 dark:border-blue-900 text-xs"
                                    onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create?type=video`)}
                                  >
                                    + Tambah Materi Video
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-600 flex-1 border border-dashed border-emerald-200 dark:border-emerald-900 text-xs"
                                    onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create?type=reading`)}
                                  >
                                    + Tambah Bacaan
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-600 dark:text-amber-400 flex-1 border border-dashed border-amber-300 dark:border-amber-900/50 hover:bg-amber-50 text-xs"
                                    onClick={() => navigate(`/admin/elearning/courses/${courseId}/modules/${mod.id}/lessons/create?type=quiz`)}
                                  >
                                    <FontAwesomeIcon icon={['fas', 'clipboard-question']} className="mr-1" /> + Tambah Kuis
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: RUANG KHUSUS DETIL MATERI & SPESIFIKASI KURSUS (lg:col-span-4) ── */}
            <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
              
              {/* Course Specification Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
                
                {/* Thumbnail Preview */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                  {course?.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300 dark:text-slate-600">
                      <FontAwesomeIcon icon={['fas', 'graduation-cap']} />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/75 text-white backdrop-blur-xs">
                    {course?.category || 'E-Learning'}
                  </span>
                  <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    course?.is_active !== false ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                  }`}>
                    {course?.is_active !== false ? 'Aktif' : 'Draft'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2">
                    {course?.title || 'Judul Kursus'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {course?.description ? course.description.replace(/<[^>]*>?/gm, '') : 'Kelola struktur materi pembelajaran di bawah ini.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* 5 Key Metric Rows */}
                <div className="space-y-3 text-xs">
                  
                  {/* 1. Program */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center text-xs shrink-0">
                      <FontAwesomeIcon icon={['fas', 'tag']} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Program Belajar
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                        {course?.display_program || course?.program_name || 'Program Reguler SkorPluss'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Level */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center text-xs shrink-0">
                      <FontAwesomeIcon icon={['fas', 'layer-group']} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Tingkat Level
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {course?.level || 'Level Pemula (Dasar)'}
                      </span>
                    </div>
                  </div>

                  {/* 3. Total Durasi */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center text-xs shrink-0">
                      <FontAwesomeIcon icon={['fas', 'clock']} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Estimasi Durasi
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {formatTotalDuration(totalDurationSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* 4. Jumlah Peserta */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center text-xs shrink-0">
                      <FontAwesomeIcon icon={['fas', 'users']} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Jumlah Peserta Terdaftar
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {(course?.participants || 0).toLocaleString('id-ID')} Siswa
                      </span>
                    </div>
                  </div>

                  {/* 5. Detil Materi Breakdown */}
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                      <FontAwesomeIcon icon={['fas', 'book-open']} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Detil Materi & Kuis
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {modules.length} Section • {totalLessons} Materi Total
                      </span>

                      {/* Pill Breakdown */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        <span className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>🎥</span> {lessonsByType.video} Video
                        </span>
                        <span className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>📖</span> {lessonsByType.reading} Bacaan
                        </span>
                        <span className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>❓</span> {lessonsByType.quiz} Kuis
                        </span>
                        <span className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>📝</span> {lessonsByType.assignment} Tugas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6. Tutor / Instruktur */}
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center text-xs shrink-0">
                      <FontAwesomeIcon icon={['fas', 'chalkboard-user']} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Tutor Pengajar
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                        {course?.display_instructor || course?.instructor_name || 'Tim Tutor SkorPluss'}
                      </span>
                    </div>
                  </div>

                </div>

                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* Quick Action Buttons */}
                <div className="space-y-2 pt-1">
                  {course?.slug && (
                    <Link
                      to={`/kursus/${course.slug}`}
                      target="_blank"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 font-bold text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 bg-white dark:bg-slate-900 transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <FontAwesomeIcon icon={['fas', 'arrow-up-right-from-square']} className="text-[10px]" />
                      <span>Lihat Halaman Siswa</span>
                    </Link>
                  )}

                  <Link
                    to={`/admin/elearning/courses/${courseId}/edit`}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={['fas', 'gear']} className="text-[10px]" />
                    <span>Edit Informasi Kursus</span>
                  </Link>
                </div>

              </div>

            </div>

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
