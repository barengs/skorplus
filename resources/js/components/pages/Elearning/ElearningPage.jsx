import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../templates/AppLayout';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import DocumentPreviewModal from '../../molecules/DocumentPreviewModal';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CourseDetailModal from '../../molecules/CourseDetailModal';
import { toEmbedUrl } from '../../../utils/videoHelper';

export default function ElearningPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  // Progress state
  const [progress, setProgress] = useState({});
  const [enrollment, setEnrollment] = useState(null);
  const [lessonScores, setLessonScores] = useState({});
  const [quizAttempts, setQuizAttempts] = useState({});
  const [assignmentSubmissions, setAssignmentSubmissions] = useState({});
  const [lockedModuleIds, setLockedModuleIds] = useState([]);
  const [lockedByModuleTitle, setLockedByModuleTitle] = useState('');
  const [quizBenchmark, setQuizBenchmark] = useState(null);

  // Active Quiz Runner state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [activeQuizQuestionIndex, setActiveQuizQuestionIndex] = useState(0);
  const [isRetakingQuiz, setIsRetakingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showQuizReview, setShowQuizReview] = useState(false);

  // Assignment Submission state
  const [uploadingAssignmentDoc, setUploadingAssignmentDoc] = useState(false);
  const [assignmentUploadedFile, setAssignmentUploadedFile] = useState(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loadingAssignmentHistory, setLoadingAssignmentHistory] = useState(false);

  // Document preview modal state
  const [previewDocModal, setPreviewDocModal] = useState({
    isOpen: false,
    fileUrl: '',
    fileName: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('catalog');
  const [previewLesson, setPreviewLesson] = useState(null);

  // Modal State for Course Detail
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCourse, setModalCourse] = useState(null);
  const [modalModules, setModalModules] = useState([]);
  const [modalEnrollment, setModalEnrollment] = useState(null);
  const [modalProgress, setModalProgress] = useState({});

  const { courseSlug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      if (courseSlug) {
        const course = courses.find(c => c.slug === courseSlug);
        if (course && (!selectedCourse || selectedCourse.slug !== courseSlug)) {
          openCourseModal(course, true);
        }
      } else {
        setView('catalog');
        setSelectedCourse(null);
      }
    }
  }, [courseSlug, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/elearning/courses');
      setCourses(res.data || []);
    } catch (err) {
      toast.error('Gagal memuat katalog kursus');
    } finally {
      setLoading(false);
    }
  };

  // Open modal on card click
  const syncCourseProgress = async (courseId) => {
    try {
      const progRes = await api.get(`/elearning/courses/${courseId}/progress`);
      const enr = progRes.data.enrollment || null;
      setEnrollment(enr);
      const completedIds = progRes.data.completed_lesson_ids || [];
      const progMap = {};
      completedIds.forEach(id => progMap[id] = true);
      setProgress(progMap);
      setLessonScores(progRes.data.lesson_scores || {});
      setQuizAttempts(progRes.data.quiz_attempts || {});
      setAssignmentSubmissions(progRes.data.assignment_submissions || {});
      setLockedModuleIds(progRes.data.locked_module_ids || []);
      setLockedByModuleTitle(progRes.data.locked_by_module_title || '');
      setQuizBenchmark(progRes.data.quiz_benchmark || null);
      return progRes.data;
    } catch (err) {
      console.error('Gagal sinkronisasi progres', err);
      return null;
    }
  };

  // Open modal on card click
  const openCourseModal = async (course) => {
    setModalCourse(course);
    setModalOpen(true);
    try {
      const res = await api.get(`/elearning/courses/${course.slug}`);
      const fetchedModules = res.data.modules || [];
      setModalModules(fetchedModules);
      
      try {
        const progRes = await api.get(`/elearning/courses/${course.id}/progress`);
        const enr = progRes.data.enrollment || null;
        setModalEnrollment(enr);
        const completedIds = progRes.data.completed_lesson_ids || [];
        const progMap = {};
        completedIds.forEach(id => progMap[id] = true);
        setModalProgress(progMap);
      } catch (e) {
        setModalEnrollment(null);
        setModalProgress({});
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat detail modul');
    }
  };

  const handleModalEnroll = async () => {
    if (!modalCourse) return;
    try {
      const res = await api.post(`/elearning/courses/${modalCourse.id}/enroll`);
      setModalEnrollment(res.data.enrollment);
      toast.success('Berhasil mendaftar ke pelajaran ini!');
    } catch (e) {
      toast.error('Gagal mendaftar');
    }
  };

  const findLastLesson = (mods, prog) => {
    const flat = [];
    mods.forEach(m => {
      if (m.lessons) {
        m.lessons.forEach(l => flat.push({ ...l, moduleId: m.id }));
      }
    });
    
    for (let i = 0; i < flat.length; i++) {
      if (!prog[flat[i].id]) {
        return flat[i];
      }
    }
    return flat[0] || null;
  };

  const handleStartLearning = async () => {
    setView('course');
    setSelectedCourse(modalCourse);
    setModules(modalModules);
    setEnrollment(modalEnrollment);
    setProgress(modalProgress);
    setModalOpen(false);

    // Sync full progress with quiz benchmarks & locks
    if (modalCourse) {
      await syncCourseProgress(modalCourse.id);
    }

    const resumeLesson = findLastLesson(modalModules, modalProgress);
    if (resumeLesson) {
      const parentModule = modalModules.find(m => m.id === resumeLesson.moduleId);
      if (parentModule) {
        setSelectedModule(parentModule);
        setLessons(parentModule.lessons || []);
        setSelectedLesson(resumeLesson);
      }
    } else if (modalModules.length > 0) {
      selectModule(modalModules[0]);
    }
  };

  const selectModule = (module) => {
    if (lockedModuleIds.includes(module.id)) {
      toast.warning(`Kelompok materi "${module.title}" masih terkunci. Anda harus menyelesaikan kuis kelompok materi sebelumnya dengan skor minimal 60%!`);
      return;
    }
    setSelectedModule(module);
    setLessons(module.lessons || []);
    if (module.lessons && module.lessons.length > 0) {
      selectLesson(module.lessons[0]);
    }
  };

  const selectLesson = (lesson) => {
    if (lockedModuleIds.includes(lesson.module_id || selectedModule?.id)) {
      toast.warning('Kelompok materi ini masih terkunci. Anda harus menyelesaikan kuis kelompok materi sebelumnya dengan skor minimal 60%!');
      return;
    }
    setSelectedLesson(lesson);
    setQuizAnswers({});
    setActiveQuizQuestionIndex(0);
    setIsRetakingQuiz(false);
    setShowQuizReview(false);

    // Reset assignment state and fetch history if assignment
    setAssignmentUploadedFile(null);
    setAssignmentNotes('');
    if (lesson.type === 'assignment') {
      fetchAssignmentHistory(lesson.id);
    }
  };

  const fetchAssignmentHistory = async (lessonId) => {
    try {
      setLoadingAssignmentHistory(true);
      const res = await api.get(`/elearning/lessons/${lessonId}/assignment/history`);
      setAssignmentHistory(res.data.submissions || []);
    } catch (err) {
      console.error('Gagal mengambil riwayat tugas', err);
    } finally {
      setLoadingAssignmentHistory(false);
    }
  };

  const handleUploadAssignmentDocument = async (e) => {
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

    setUploadingAssignmentDoc(true);
    try {
      const res = await api.post('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAssignmentUploadedFile({
        url: res.data.url,
        filename: res.data.original_name || file.name,
      });
      toast.success('Berkas tugas berhasil diunggah!');
    } catch (err) {
      toast.error('Gagal mengunggah berkas.');
    } finally {
      setUploadingAssignmentDoc(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedLesson || !assignmentUploadedFile) {
      toast.warning('Silakan unggah dokumen tugas terlebih dahulu.');
      return;
    }

    try {
      setSubmittingAssignment(true);
      const res = await api.post(`/elearning/lessons/${selectedLesson.id}/assignment/submit`, {
        file_url: assignmentUploadedFile.url,
        filename: assignmentUploadedFile.filename,
        notes: assignmentNotes,
      });

      toast.success(res.data.message || 'Tugas akhir berhasil dikirim!');
      setAssignmentUploadedFile(null);
      setAssignmentNotes('');
      fetchAssignmentHistory(selectedLesson.id);

      if (selectedCourse) {
        await syncCourseProgress(selectedCourse.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengumpulkan tugas akhir');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleSelectQuizOption = (qIdx, optIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleStartQuizOrRetake = () => {
    setQuizAnswers({});
    setActiveQuizQuestionIndex(0);
    setIsRetakingQuiz(true);
    setShowQuizReview(false);
  };

  const handleSubmitQuiz = async () => {
    if (!selectedLesson) return;
    const questions = selectedLesson.quiz_questions || [];
    const answeredCount = Object.keys(quizAnswers).length;

    if (questions.length > 0 && answeredCount < questions.length) {
      if (!confirm(`Anda baru menjawab ${answeredCount} dari ${questions.length} soal kuis. Yakin ingin mengumpulkan sekarang?`)) {
        return;
      }
    }

    try {
      setSubmittingQuiz(true);
      const res = await api.post(`/elearning/lessons/${selectedLesson.id}/quiz/submit`, {
        answers: quizAnswers
      });

      if (res.data.is_passed) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }

      setIsRetakingQuiz(false);
      setShowQuizReview(true);

      if (selectedCourse) {
        await syncCourseProgress(selectedCourse.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengumpulkan kuis');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const flatLessons = useMemo(() => {
    const flat = [];
    modules.forEach(m => {
      if (m.lessons) {
        m.lessons.forEach(l => flat.push({ ...l, moduleId: m.id }));
      }
    });
    return flat;
  }, [modules]);

  const currentIndex = selectedLesson ? flatLessons.findIndex(l => l.id === selectedLesson.id) : -1;
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const navigateToLesson = (lesson) => {
    if (!lesson) return;
    const parentModule = modules.find(m => m.id === lesson.moduleId);
    if (parentModule) setSelectedModule(parentModule);
    setSelectedLesson(lesson);
  };

  const markLessonComplete = async (lessonId) => {
    if (!enrollment) {
      toast.error('Anda harus mendaftar (Enroll) terlebih dahulu');
      return;
    }
    
    try {
      if (!progress[lessonId]) {
        await api.post(`/elearning/lessons/${lessonId}/complete`);
        setProgress({ ...progress, [lessonId]: true });
        
        if (enrollment) {
          const newCompleted = (enrollment.completed_lessons || 0) + 1;
          const total = enrollment.total_lessons || 1;
          setEnrollment({
            ...enrollment,
            completed_lessons: newCompleted,
            progress_percentage: Math.round((newCompleted / total) * 100)
          });
        }
      }

      // Refresh enrollment from server to ensure sync
      try {
        const progRes = await api.get(`/elearning/courses/${selectedCourse.id}/progress`);
        const enr = progRes.data.enrollment || null;
        const completedIds = progRes.data.completed_lesson_ids || [];
        const progMap = {};
        completedIds.forEach(id => progMap[id] = true);
        setEnrollment(enr);
        setProgress(progMap);
      } catch (e) {
        // ignore, keep local state
      }

      if (nextLesson) {
        navigateToLesson(nextLesson);
      } else {
        toast.success('Selamat! Anda telah menyelesaikan seluruh materi.');
      }
    } catch (err) {
      toast.error('Gagal menandai materi');
    }
  };

  const downloadCertificate = () => {
    toast.info('Sertifikat sedang disiapkan untuk diunduh...');
    setTimeout(() => {
       window.open('https://dummyimage.com/800x600/0f172a/fff.png&text=Sertifikat+Penyelesaian', '_blank');
    }, 1500);
  };

  const renderStars = (rating) => {
    const stars = [];
    const num = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      if (num >= i) {
        stars.push(<FontAwesomeIcon key={i} icon={['fas', 'star']} className="text-yellow-400" />);
      } else if (num >= i - 0.5) {
        stars.push(<FontAwesomeIcon key={i} icon={['fas', 'star-half-stroke']} className="text-yellow-400" />);
      } else {
        stars.push(<FontAwesomeIcon key={i} icon={['fas', 'star']} className="text-slate-300 dark:text-slate-600" />);
      }
    }
    return stars;
  };

  const getLessonTypeIcon = (type) => {
    switch(type) {
      case 'video': return <FontAwesomeIcon icon={['fas', 'video']} className="text-blue-500" />;
      case 'reading': return <FontAwesomeIcon icon={['fas', 'book-open']} className="text-emerald-500" />;
      case 'quiz': return <FontAwesomeIcon icon={['fas', 'circle-question']} className="text-amber-500" />;
      case 'assignment': return <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="text-purple-500" />;
      default: return <FontAwesomeIcon icon={['fas', 'file']} className="text-slate-400" />;
    }
  };

  const getLessonTypeLabel = (type) => {
    const labels = { video: 'Video', reading: 'Bacaan', quiz: 'Kuis', assignment: 'Tugas' };
    return labels[type] || 'Materi';
  };

  const [filterTab, setFilterTab] = useState('all');

  if (view === 'catalog' && !selectedCourse) {
    const filteredCourses = courses.filter(c => filterTab === 'all' || (filterTab === 'enrolled' && c.is_enrolled));

    return (
      <AppLayout title="E-Learning">
        <div className="max-w-7xl mx-auto pb-16">
          <div className="mb-12">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Perpustakaan Pembelajaran</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Tingkatkan kemampuanmu dengan ribuan materi dari tutor berpengalaman</p>
          </div>

          <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setFilterTab('all')}
              className={`pb-3 font-semibold text-sm transition-colors ${filterTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              Semua Kursus
            </button>
            <button
              onClick={() => setFilterTab('enrolled')}
              className={`pb-3 font-semibold text-sm transition-colors ${filterTab === 'enrolled' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              Kursus Saya
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-600 dark:text-slate-400">Belum ada kursus tersedia di kategori ini.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/elearning/${course.slug}`)}
                  className="text-left group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-video">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
                        <FontAwesomeIcon icon={['fas', 'graduation-cap']} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <FontAwesomeIcon icon={['fas', 'award']} /> Sertifikat
                    </div>
                  </div>

                  <div className="p-4">
                    <Badge color="blue" className="mb-2">{course.category}</Badge>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2">{course.title}</h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3" dangerouslySetInnerHTML={{ __html: course.description }} />

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-0.5 text-sm">{renderStars(course.rating)}</div>
                      <span className="text-xs text-slate-500">
                        {(Number(course.rating) || 0).toFixed(1)} ({course.participants || 0} peserta)
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-blue-600">
                      <span>Lihat Detail Kurikulum</span>
                      <span>→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Modal Course Detail */}
          {modalOpen && modalCourse && (
            <CourseDetailModal
              course={modalCourse}
              modules={modalModules}
              enrollment={modalEnrollment}
              progress={modalProgress}
              onEnroll={handleModalEnroll}
              onStartLearning={handleStartLearning}
              onClose={() => { setModalOpen(false); navigate('/elearning'); }}
            />
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={selectedCourse?.title || 'E-Learning'}>
      <div className="max-w-7xl mx-auto pb-16">
        <button
          onClick={() => navigate('/elearning')}
          className="mb-6 text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-2"
        >
          ← Kembali ke Katalog
        </button>

        {selectedCourse && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white relative overflow-hidden">
              <div className="relative z-10 grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  {selectedCourse.thumbnail ? (
                    <img src={selectedCourse.thumbnail} alt={selectedCourse.title} className="w-full rounded-lg object-cover aspect-video shadow-xl" />
                  ) : (
                    <div className="w-full rounded-lg bg-blue-800 flex items-center justify-center aspect-video text-6xl shadow-xl">🎓</div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h1 className="text-3xl font-black mb-2">{selectedCourse.title}</h1>
                    <div className="text-blue-100 mb-4 line-clamp-3 text-sm" dangerouslySetInnerHTML={{ __html: selectedCourse.description }} />
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5 text-xl">{renderStars(selectedCourse.rating)}</div>
                      <span className="text-blue-100">{(Number(selectedCourse.rating) || 0).toFixed(1)} · {selectedCourse.participants || 0} peserta</span>
                    </div>
                    
                    {enrollment && (
                      <div className="flex-1 max-w-sm">
                        <div className="flex justify-between text-sm mb-1 font-semibold">
                          <span>Progres Belajar</span>
                          <span>{enrollment.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-2.5">
                          <div className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${enrollment.progress_percentage || 0}%` }}></div>
                        </div>
                        {enrollment.progress_percentage === 100 && (
                          <Button onClick={downloadCertificate} size="sm" color="emerald" className="mt-3">Unduh Sertifikat 🏆</Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Curriculum Sidebar */}
              <div className="lg:col-span-1 space-y-2 h-fit">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 px-2">Kurikulum</h3>
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                  {modules.map((module) => {
                    const isLocked = lockedModuleIds.includes(module.id);
                    return (
                      <div key={module.id} className="space-y-1">
                        <button
                          onClick={() => selectModule(module)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-all text-sm font-semibold flex items-center justify-between ${
                            isLocked
                              ? 'opacity-60 bg-slate-100 dark:bg-slate-800/60 text-slate-500 cursor-not-allowed'
                              : selectedModule?.id === module.id
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          <span className="truncate pr-2">{module.title}</span>
                          {isLocked && (
                            <FontAwesomeIcon
                              icon={['fas', 'lock']}
                              className="text-amber-500 text-xs shrink-0"
                              title="Terkunci: Selesaikan kuis sebelumnya dengan skor minimal 60%"
                            />
                          )}
                        </button>
                        {selectedModule?.id === module.id && (
                          <div className="space-y-1 ml-2">
                            {(module.lessons || []).map((lesson) => {
                              const quizScore = lessonScores[lesson.id];
                              const minPass = lesson.min_pass_score || 60;
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => selectLesson(lesson)}
                                  className={`w-full text-left px-3 py-2 rounded-md transition-all text-xs flex items-center gap-2 ${
                                    selectedLesson?.id === lesson.id
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <span className="text-sm">{getLessonTypeIcon(lesson.type)}</span>
                                  <span className="truncate flex-1">{lesson.title}</span>
                                  {lesson.type === 'quiz' && quizScore !== undefined && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                        quizScore >= minPass
                                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                      }`}
                                      title={quizScore >= minPass ? 'Lulus Kuis' : 'Belum Lulus (Min 60%)'}
                                    >
                                      {quizScore}%
                                    </span>
                                  )}
                                  {progress[lesson.id] && (
                                    <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lesson Content Viewer */}
              <div className="lg:col-span-3 space-y-6">
                {selectedLesson ? (
                  <>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getLessonTypeIcon(selectedLesson.type)}</span>
                            <Badge color="blue">{getLessonTypeLabel(selectedLesson.type)}</Badge>
                          </div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{selectedLesson.title}</h2>
                        </div>
                        {progress[selectedLesson.id] && <Badge color="emerald" className="flex items-center gap-1.5"><FontAwesomeIcon icon={['fas', 'circle-check']} /> Selesai</Badge>}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                      {selectedLesson.type === 'video' && selectedLesson.video_url ? (
                        <div className="aspect-video bg-slate-900">
                          <iframe width="100%" height="100%" src={toEmbedUrl(selectedLesson.video_url)} title={selectedLesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                        </div>
                      ) : selectedLesson.type === 'reading' ? (
                        <div className="p-8 prose dark:prose-invert max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: selectedLesson.content || 'Materi tidak tersedia' }} />
                        </div>
                      ) : selectedLesson.type === 'assignment' ? (
                        <div className="p-6 sm:p-8 space-y-6">
                          {/* Tolak Ukur Kesiapan Tugas Akhir Widget */}
                          <div className="rounded-xl border p-5 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                              <div>
                                <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
                                  <FontAwesomeIcon icon={['fas', 'chart-pie']} className="text-blue-600 dark:text-blue-400" />
                                  Tolak Ukur Kesiapan Tugas Akhir
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Evaluasi penguasaan materi dari kuis-kuis kelompok materi sebelumnya.
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-slate-500">Rata-rata Skor Kuis:</span>
                                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                  {quizBenchmark?.average_score || 0}%
                                </div>
                              </div>
                            </div>

                            {/* Eligibility Banner */}
                            {quizBenchmark?.is_eligible_for_assignment ? (
                              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                                <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-600 dark:text-emerald-400 mt-0.5 text-sm shrink-0" />
                                <div>
                                  <strong>Memenuhi Syarat!</strong> Seluruh kuis kelompok materi telah diselesaikan dengan skor di atas 60%. Anda telah siap untuk menyelesaikan dan mengumpulkan tugas akhir ini.
                                </div>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                                <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="text-amber-600 dark:text-amber-400 mt-0.5 text-sm shrink-0" />
                                <div>
                                  <strong>Perhatian:</strong> Masih terdapat kuis kelompok materi yang belum mencapai skor minimal 60%. Siswa disarankan menyelesaikan kuis sebelumnya sebagai tolak ukur penguasaan materi.
                                </div>
                              </div>
                            )}

                            {/* Breakdown table */}
                            {quizBenchmark?.quizzes && quizBenchmark.quizzes.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Rincian Nilai Kuis Kelompok Materi:
                                </div>
                                <div className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                                  {quizBenchmark.quizzes.map((q, qIdx) => (
                                    <div key={qIdx} className="p-2.5 flex items-center justify-between">
                                      <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {q.title}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-500">
                                          Skor: <strong className={q.is_passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                            {q.score_percentage !== null ? `${q.score_percentage}%` : 'Belum'}
                                          </strong>
                                        </span>
                                        <Badge color={q.is_passed ? 'emerald' : 'red'} size="sm">
                                          {q.is_passed ? 'Lulus' : 'Belum Lulus'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Instructor Guide Document Banner (PDF / DOCX) */}
                          {selectedLesson.attachment_doc && (
                            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center text-lg shrink-0">
                                  <FontAwesomeIcon icon={['fas', 'file-pdf']} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                    {selectedLesson.attachment_name || 'Lembar Soal / Panduan Tugas Akhir'}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Dokumen panduan resmi dari instruktur. Baca dokumen sebelum mengerjakan.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocModal({
                                    isOpen: true,
                                    fileUrl: selectedLesson.attachment_doc,
                                    fileName: selectedLesson.attachment_name || 'Panduan Tugas Akhir',
                                  })}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                                >
                                  <FontAwesomeIcon icon={['fas', 'book-open-reader']} />
                                  Baca Dokumen Panduan
                                </button>
                                <a
                                  href={selectedLesson.attachment_doc}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs"
                                  title="Download File"
                                >
                                  <FontAwesomeIcon icon={['fas', 'download']} />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Assignment Instructions (Quill text) */}
                          <div className="prose dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: selectedLesson.content || 'Instruksi tugas akhir sedang disiapkan.' }} />
                          </div>

                          {/* Latest Submission Status Banner */}
                          {(() => {
                            const latestSub = assignmentHistory && assignmentHistory.length > 0 ? assignmentHistory[0] : null;

                            if (!latestSub) return null;

                            return (
                              <div className={`p-5 rounded-xl border ${
                                latestSub.status === 'approved'
                                  ? 'border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100'
                                  : latestSub.status === 'revision_needed'
                                  ? 'border-rose-300 bg-rose-50/70 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100'
                                  : 'border-amber-300 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100'
                              }`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-sm uppercase tracking-wider">
                                        Status Tugas Anda (Versi {latestSub.version}):
                                      </span>
                                      <Badge color={latestSub.status === 'approved' ? 'emerald' : latestSub.status === 'revision_needed' ? 'red' : 'amber'}>
                                        {latestSub.status === 'approved' ? 'DISETUJUI / LULUS' : latestSub.status === 'revision_needed' ? 'PERLU REVISI' : 'MENUNGGU TINJAUAN'}
                                      </Badge>
                                    </div>
                                    <p className="text-xs mt-1 opacity-80">
                                      Dikumpulkan pada: {new Date(latestSub.created_at).toLocaleString('id-ID')}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setPreviewDocModal({
                                      isOpen: true,
                                      fileUrl: latestSub.file_url,
                                      fileName: latestSub.filename,
                                    })}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xs flex items-center gap-1.5"
                                  >
                                    <FontAwesomeIcon icon={['fas', 'eye']} />
                                    Lihat Berkas Versi {latestSub.version}
                                  </button>
                                </div>

                                {latestSub.feedback && (
                                  <div className="mt-3 p-3.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
                                    <span className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                                      Catatan Instruktur ({latestSub.reviewer?.name || 'Tutor'}):
                                    </span>
                                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{latestSub.feedback}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* SUBMIT / REVISE ASSIGNMENT FORM */}
                          {(() => {
                            const latestSub = assignmentHistory && assignmentHistory.length > 0 ? assignmentHistory[0] : null;
                            const isApproved = latestSub && latestSub.status === 'approved';
                            const isRevision = latestSub && latestSub.status === 'revision_needed';
                            const isWaiting = latestSub && latestSub.status === 'submitted';

                            if (isApproved) {
                              return (
                                <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                                  <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-3xl text-emerald-600 dark:text-emerald-400" />
                                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Selamat! Tugas Anda Telah Lulus</h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                                    Instruktur telah menyetujui tugas akhir ini. Anda tidak perlu mengirimkan revisi lagi.
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-4">
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    <FontAwesomeIcon icon={['fas', 'upload']} className="text-indigo-600 dark:text-indigo-400" />
                                    {isRevision ? 'Kumpulkan Revisi Tugas Akhir' : isWaiting ? 'Perbarui Berkas Tugas' : 'Unggah & Kumpulkan Tugas Akhir'}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Unggah dokumen hasil kerja Anda dalam format PDF atau Word (DOCX). Ukuran maksimal 20 MB.
                                  </p>
                                </div>

                                {/* Upload zone */}
                                {assignmentUploadedFile ? (
                                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                                        <FontAwesomeIcon icon={['fas', 'file-lines']} />
                                      </div>
                                      <div>
                                        <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                          {assignmentUploadedFile.filename}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => setPreviewDocModal({
                                            isOpen: true,
                                            fileUrl: assignmentUploadedFile.url,
                                            fileName: assignmentUploadedFile.filename,
                                          })}
                                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                                        >
                                          <FontAwesomeIcon icon={['fas', 'eye']} />
                                          Pratinjau Dokumen Ini
                                        </button>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setAssignmentUploadedFile(null)}
                                      className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold"
                                    >
                                      Ganti File
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-indigo-500 cursor-pointer bg-white dark:bg-slate-900 transition-colors">
                                    <FontAwesomeIcon icon={['fas', 'cloud-arrow-up']} className="text-3xl text-slate-400 mb-2" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                      {uploadingAssignmentDoc ? 'Mengunggah...' : 'Pilih Berkas Tugas (PDF / DOCX)'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-1">Maksimal 20 MB</span>
                                    <input
                                      type="file"
                                      accept=".pdf,.docx,.doc"
                                      className="hidden"
                                      onChange={handleUploadAssignmentDocument}
                                      disabled={uploadingAssignmentDoc}
                                    />
                                  </label>
                                )}

                                {/* Notes input */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Catatan untuk Instruktur (Opsional)
                                  </label>
                                  <textarea
                                    rows="2"
                                    value={assignmentNotes}
                                    onChange={(e) => setAssignmentNotes(e.target.value)}
                                    placeholder={isRevision ? "Jelaskan perbaikan apa saja yang telah Anda lakukan sesuai masukan instruktur..." : "Tambahkan keterangan tambahan jika ada..."}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                                  />
                                </div>

                                <div className="flex justify-end pt-2">
                                  <Button
                                    onClick={handleSubmitAssignment}
                                    disabled={!assignmentUploadedFile || submittingAssignment}
                                    loading={submittingAssignment}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-xs px-5 py-2.5"
                                  >
                                    <FontAwesomeIcon icon={['fas', 'paper-plane']} className="mr-1.5" />
                                    {isRevision ? 'Kirim Revisi Tugas' : 'Kumpulkan Tugas Akhir'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* FULL REVISION HISTORY TABLE */}
                          {assignmentHistory && assignmentHistory.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FontAwesomeIcon icon={['fas', 'clock-rotate-left']} className="text-purple-600" />
                                Riwayat Pengumpulan & Revisi Tugas ({assignmentHistory.length} Versi)
                              </h4>

                              <div className="space-y-2.5">
                                {assignmentHistory.map((sub, sIdx) => {
                                  return (
                                    <div
                                      key={sub.id}
                                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                                          v{sub.version}
                                        </span>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                              {sub.filename}
                                            </span>
                                            <Badge color={sub.status === 'approved' ? 'emerald' : sub.status === 'revision_needed' ? 'red' : 'amber'} size="sm">
                                              {sub.status === 'approved' ? 'Disetujui' : sub.status === 'revision_needed' ? 'Perlu Revisi' : 'Menunggu'}
                                            </Badge>
                                          </div>
                                          <p className="text-slate-400 text-[11px] mt-0.5">
                                            Dikirim: {new Date(sub.created_at).toLocaleString('id-ID')}
                                            {sub.notes && ` • Catatan: "${sub.notes}"`}
                                          </p>
                                          {sub.feedback && (
                                            <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1 font-medium">
                                              Feedback ({sub.reviewer?.name || 'Instruktur'}): {sub.feedback}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setPreviewDocModal({
                                          isOpen: true,
                                          fileUrl: sub.file_url,
                                          fileName: sub.filename,
                                        })}
                                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 self-start sm:self-center shrink-0"
                                      >
                                        <FontAwesomeIcon icon={['fas', 'eye']} />
                                        Baca Dokumen
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : selectedLesson.type === 'quiz' ? (
                        <div className="p-6 sm:p-8">
                          {(!selectedLesson.quiz_questions || selectedLesson.quiz_questions.length === 0) ? (
                            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                              <div className="text-5xl mb-4 text-amber-500"><FontAwesomeIcon icon={['fas', 'clipboard-question']} /></div>
                              <p className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">Kuis Belum Tersedia</p>
                              <p className="text-slate-500 text-sm">Tutor sedang menyiapkan soal kuis untuk kelompok materi ini.</p>
                            </div>
                          ) : quizAttempts[selectedLesson.id] && !isRetakingQuiz ? (
                            /* QUIZ RESULT & SCORECARD */
                            <div className="space-y-6">
                              {(() => {
                                const attempt = quizAttempts[selectedLesson.id];
                                const isPassed = attempt.is_passed;
                                const score = attempt.score_percentage;
                                const minPass = attempt.min_pass_score || selectedLesson.min_pass_score || 60;

                                return (
                                  <>
                                    <div className={`p-6 sm:p-8 rounded-2xl border text-center space-y-4 ${
                                      isPassed
                                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                                        : 'bg-red-50/70 dark:bg-red-950/20 border-red-300 dark:border-red-800/60'
                                    }`}>
                                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-black shadow-lg ${
                                        isPassed
                                          ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                                          : 'bg-red-600 text-white shadow-red-500/25'
                                      }`}>
                                        {score}%
                                      </div>

                                      <div>
                                        <Badge color={isPassed ? 'emerald' : 'red'} className="px-3 py-1 text-sm font-bold">
                                          {isPassed ? 'LULUS / MEMENUHI SYARAT' : 'BELUM MEMENUHI SYARAT (SKOR < 60%)'}
                                        </Badge>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                                          {isPassed
                                            ? 'Selamat! Anda Berhasil Menyelesaikan Kuis Kelompok Materi'
                                            : 'Kuis Belum Mencapai Batas Kelulusan 60%'}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-1">
                                          {isPassed
                                            ? `Skor Anda ${score}% telah memenuhi batas minimal (${minPass}%). Kelompok materi selanjutnya kini dapat Anda akses!`
                                            : `Skor Anda ${score}%. Anda harus mencapai minimal 60% agar kelompok materi berikutnya terbuka. Silakan ulangi kuis untuk melanjutkan.`}
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                          <div className="text-xs text-slate-400">Jawaban Benar</div>
                                          <div className="text-lg font-black text-emerald-600">{attempt.correct_count} / {attempt.total_questions}</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                          <div className="text-xs text-slate-400">Persentase</div>
                                          <div className="text-lg font-black text-blue-600">{score}%</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                          <div className="text-xs text-slate-400">Batas Lulus</div>
                                          <div className="text-lg font-black text-slate-700 dark:text-slate-300">{minPass}%</div>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                        <Button onClick={handleStartQuizOrRetake} variant="ghost" className="border-slate-300 dark:border-slate-600">
                                          <FontAwesomeIcon icon={['fas', 'rotate-right']} className="mr-1.5" /> Ulangi Kuis
                                        </Button>
                                        <Button variant="ghost" onClick={() => setShowQuizReview(!showQuizReview)}>
                                          <FontAwesomeIcon icon={['fas', showQuizReview ? 'eye-slash' : 'list-check']} className="mr-1.5" />
                                          {showQuizReview ? 'Tutup Pembahasan' : 'Lihat Kunci & Pembahasan'}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Detailed Review */}
                                    {showQuizReview && attempt.evaluations && (
                                      <div className="space-y-4 pt-2">
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                                          <FontAwesomeIcon icon={['fas', 'clipboard-check']} className="text-blue-500" />
                                          Pembahasan Soal Kuis
                                        </h4>
                                        <div className="space-y-4">
                                          {attempt.evaluations.map((ev, eIdx) => (
                                            <div
                                              key={eIdx}
                                              className={`p-4 rounded-xl border ${
                                                ev.is_correct
                                                  ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20'
                                                  : 'border-red-200 bg-red-50/40 dark:bg-red-950/20'
                                              }`}
                                            >
                                              <div className="flex items-start justify-between gap-2 mb-2">
                                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                                  {eIdx + 1}. {ev.question}
                                                </span>
                                                <Badge color={ev.is_correct ? 'emerald' : 'red'} size="sm">
                                                  {ev.is_correct ? 'Benar' : 'Salah'}
                                                </Badge>
                                              </div>

                                              <div className="space-y-1.5 my-2">
                                                {(ev.options || []).map((opt, oIdx) => {
                                                  const isUserChoice = (ev.user_selected_index === oIdx);
                                                  const isCorrectChoice = (ev.correct_index === oIdx);

                                                  return (
                                                    <div
                                                      key={oIdx}
                                                      className={`p-2.5 rounded-lg text-xs font-medium flex items-center justify-between border ${
                                                        isCorrectChoice
                                                          ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                                                          : isUserChoice
                                                          ? 'bg-red-100 dark:bg-red-900/40 border-red-400 text-red-900 dark:text-red-200'
                                                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                      }`}
                                                    >
                                                      <span>{opt}</span>
                                                      {isCorrectChoice ? (
                                                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                          <FontAwesomeIcon icon={['fas', 'check']} /> Kunci Jawaban
                                                        </span>
                                                      ) : isUserChoice ? (
                                                        <span className="font-bold text-red-600 flex items-center gap-1">
                                                          <FontAwesomeIcon icon={['fas', 'xmark']} /> Jawaban Anda
                                                        </span>
                                                      ) : null}
                                                    </div>
                                                  );
                                                })}
                                              </div>

                                              {ev.explanation && (
                                                <div className="mt-2 p-2.5 rounded bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-800 dark:text-blue-300">
                                                  <strong>Pembahasan:</strong> {ev.explanation}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            /* DYNAMIC QUIZ RUNNER (TAKING QUIZ) */
                            <div className="space-y-6">
                              {(() => {
                                const questions = selectedLesson.quiz_questions || [];
                                const total = questions.length;
                                const q = questions[activeQuizQuestionIndex] || questions[0];
                                const minPass = selectedLesson.min_pass_score || 60;
                                const isSelected = (optIdx) => quizAnswers[activeQuizQuestionIndex] === optIdx;

                                return (
                                  <>
                                    {/* Quiz Runner Header */}
                                    <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                                        <span>Soal {activeQuizQuestionIndex + 1} dari {total}</span>
                                        <Badge color="amber">
                                          Syarat Lulus: Min. {minPass}%
                                        </Badge>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div
                                          className="bg-blue-600 h-full transition-all duration-300"
                                          style={{ width: `${((activeQuizQuestionIndex + 1) / total) * 100}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Question Card */}
                                    <div className="space-y-2">
                                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                        Pertanyaan:
                                      </div>
                                      <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                                        {q.question}
                                      </p>
                                    </div>

                                    {/* Dynamic Answer Options (Direct click without A/B/C) */}
                                    <div className="space-y-3 pt-2">
                                      <div className="text-xs font-semibold text-slate-500">
                                        Pilih jawaban langsung di bawah ini:
                                      </div>
                                      {(q.options || []).map((optText, optIdx) => {
                                        const selected = isSelected(optIdx);
                                        return (
                                          <div
                                            key={optIdx}
                                            onClick={() => handleSelectQuizOption(activeQuizQuestionIndex, optIdx)}
                                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between text-left ${
                                              selected
                                                ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-sm ring-1 ring-blue-500'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                          >
                                            <span className="text-sm sm:text-base font-medium leading-relaxed pr-3">
                                              {optText}
                                            </span>
                                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                              selected
                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                : 'border-slate-300 dark:border-slate-600 text-transparent'
                                            }`}>
                                              <FontAwesomeIcon icon={['fas', 'check']} className="text-xs" />
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Question Dots & Navigation */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {questions.map((_, dotIdx) => {
                                          const isAnswered = quizAnswers[dotIdx] !== undefined;
                                          const isCurrent = dotIdx === activeQuizQuestionIndex;
                                          return (
                                            <button
                                              key={dotIdx}
                                              onClick={() => setActiveQuizQuestionIndex(dotIdx)}
                                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                isCurrent
                                                  ? 'bg-blue-600 text-white shadow'
                                                  : isAnswered
                                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                              }`}
                                            >
                                              {dotIdx + 1}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={activeQuizQuestionIndex === 0}
                                          onClick={() => setActiveQuizQuestionIndex(prev => Math.max(0, prev - 1))}
                                        >
                                          Sebelumnya
                                        </Button>

                                        {activeQuizQuestionIndex < total - 1 ? (
                                          <Button
                                            size="sm"
                                            onClick={() => setActiveQuizQuestionIndex(prev => Math.min(total - 1, prev + 1))}
                                          >
                                            Berikutnya
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            loading={submittingQuiz}
                                            onClick={handleSubmitQuiz}
                                            className="bg-emerald-600 hover:bg-emerald-500"
                                          >
                                            Kumpulkan Kuis
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                          Konten sedang disiapkan
                        </div>
                      )}

                      <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                        {selectedLesson.summary && (
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Ringkasan Materi</h3>
                            <div className="text-sm text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: selectedLesson.summary }} />
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-4 w-full">
                          <div>
                            {prevLesson && (
                              <Button onClick={() => navigateToLesson(prevLesson)} color="slate" className="flex items-center gap-2">
                                <FontAwesomeIcon icon={['fas', 'arrow-left']} /> Sebelumnya
                              </Button>
                            )}
                          </div>
                          <div>
                            {selectedLesson.type === 'quiz' ? (
                              quizAttempts[selectedLesson.id]?.is_passed ? (
                                nextLesson ? (
                                  <Button onClick={() => navigateToLesson(nextLesson)} className="flex items-center gap-2">
                                    Lanjut ke Materi Berikutnya <FontAwesomeIcon icon={['fas', 'arrow-right']} />
                                  </Button>
                                ) : (
                                  <Badge color="emerald" className="px-3 py-1.5 text-xs font-bold">
                                    <FontAwesomeIcon icon={['fas', 'circle-check']} className="mr-1" /> Kuis Selesai
                                  </Badge>
                                )
                              ) : (
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                  Harus lulus kuis (min 60%) untuk lanjut
                                </span>
                              )
                            ) : (
                              <Button onClick={() => markLessonComplete(selectedLesson.id)} className="flex items-center gap-2">
                                {!nextLesson ? (
                                  <><FontAwesomeIcon icon={['fas', 'check-double']} /> Selesai</>
                                ) : progress[selectedLesson.id] ? (
                                  <>Lanjut <FontAwesomeIcon icon={['fas', 'arrow-right']} /></>
                                ) : (
                                  <><FontAwesomeIcon icon={['fas', 'check']} /> Lanjut</>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center shadow-sm">
                    <p className="text-slate-600 dark:text-slate-400">Pilih materi pada kurikulum untuk memulai pembelajaran</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewLesson(null)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{previewLesson.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Materi Video</p>
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

      {/* Global Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDocModal.isOpen}
        onClose={() => setPreviewDocModal({ ...previewDocModal, isOpen: false })}
        fileUrl={previewDocModal.fileUrl}
        fileName={previewDocModal.fileName}
      />
    </AppLayout>
  );
}
