import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../../templates/AppLayout';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import DocumentPreviewModal from '../../molecules/DocumentPreviewModal';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toEmbedUrl } from '../../../utils/videoHelper';
import DailyCheckinModal from './DailyCheckinModal';
import AcademySidebar from './AcademySidebar';
import ProgressBelajarView from './ProgressBelajarView';
import RuntutanBelajarView from './RuntutanBelajarView';
import CourseCatalogView from './CourseCatalogView';
import ReviewModal from '../../molecules/ReviewModal';
import CertificateModal from '../../molecules/CertificateModal';
import CourseDetailView from './CourseDetailView';

export default function ElearningPage() {
  const user = useSelector((s) => s.auth.user);
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

  // In-Dashboard Course Detail State
  const [detailCourse, setDetailCourse] = useState(null);
  const [detailModules, setDetailModules] = useState([]);
  const [detailProgress, setDetailProgress] = useState({});
  const [detailEnrollment, setDetailEnrollment] = useState(null);

  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dicoding Academy Flat UI State
  const initialTab = searchParams.get('tab');
  const [academyTab, setAcademyTab] = useState(
    initialTab && ['progress', 'streak', 'catalog'].includes(initialTab) ? initialTab : 'progress'
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['progress', 'streak', 'catalog'].includes(tabParam)) {
      setAcademyTab(tabParam);
    }
  }, [searchParams]);

  const [myProgressData, setMyProgressData] = useState({ active_courses: [], completed_courses: [], stats: {} });
  const [streakData, setStreakData] = useState({});
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Student Course Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [userCourseReview, setUserCourseReview] = useState(null);

  // Student Certificate Modal State
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certCourse, setCertCourse] = useState(null);

  useEffect(() => {
    if (searchParams.get('action') === 'certificate' && myProgressData.completed_courses?.length > 0) {
      setCertCourse(myProgressData.completed_courses[0]);
      setCertModalOpen(true);
    }
  }, [searchParams, myProgressData.completed_courses]);

  const fetchUserCourseReview = async (courseId) => {
    try {
      const res = await api.get(`/courses/${courseId}/reviews`);
      if (res.data?.user_review) {
        setUserCourseReview(res.data.user_review);
      } else {
        setUserCourseReview(null);
      }
    } catch (e) {
      console.error('Gagal mengambil ulasan kursus', e);
    }
  };

  useEffect(() => {
    if (selectedCourse?.id) {
      fetchUserCourseReview(selectedCourse.id);
    }
  }, [selectedCourse?.id]);

  useEffect(() => {
    fetchCourses();
    fetchMyProgress();
    fetchStreakData(new Date());
  }, []);

  const fetchMyProgress = async () => {
    try {
      setLoadingProgress(true);
      const res = await api.get('/elearning/my-progress');
      setMyProgressData(res.data || { active_courses: [], completed_courses: [], stats: {} });
    } catch (err) {
      console.error('Gagal memuat progress belajar', err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const fetchStreakData = async (dateObj = currentCalendarMonth) => {
    try {
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const res = await api.get(`/elearning/streak-and-checkin?year=${year}&month=${month}`);
      setStreakData(res.data || {});
    } catch (err) {
      console.error('Gagal memuat runtutan belajar', err);
    }
  };

  const handleCheckinSuccess = () => {
    fetchStreakData(currentCalendarMonth);
    fetchMyProgress();
  };

  const handleMonthChange = (newDate) => {
    setCurrentCalendarMonth(newDate);
    fetchStreakData(newDate);
  };

  const handleContinueLearning = async (courseSummary) => {
    try {
      setLoading(true);
      const res = await api.get(`/elearning/courses/${courseSummary.slug}`);
      const fullCourse = res.data;
      const fetchedModules = fullCourse.modules || [];

      const progData = await syncCourseProgress(fullCourse.id);
      const completedMap = {};
      (progData?.completed_lesson_ids || []).forEach(id => completedMap[id] = true);

      setSelectedCourse(fullCourse);
      setModules(fetchedModules);
      setDetailCourse(null);
      setView('course');

      const resumeLesson = findLastLesson(fetchedModules, completedMap);
      if (resumeLesson) {
        const parentModule = fetchedModules.find(m => m.id === resumeLesson.moduleId);
        if (parentModule) {
          setSelectedModule(parentModule);
          setLessons(parentModule.lessons || []);
          setSelectedLesson(resumeLesson);
        }
      } else if (fetchedModules.length > 0) {
        selectModule(fetchedModules[0]);
      }
    } catch (err) {
      console.error('Gagal membuka kelas', err);
      toast.error('Gagal membuka kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCourseDetail = async (courseSummary) => {
    try {
      setLoading(true);
      const res = await api.get(`/elearning/courses/${courseSummary.slug || courseSummary.id}`);
      const fullCourse = res.data;
      const fetchedModules = fullCourse.modules || [];

      let progMap = {};
      let enr = null;
      try {
        const progRes = await api.get(`/elearning/courses/${fullCourse.id}/progress`);
        enr = progRes.data.enrollment || null;
        const completedIds = progRes.data.completed_lesson_ids || [];
        completedIds.forEach(id => { progMap[id] = true; });
      } catch (e) {
        // Not enrolled or no progress yet
      }

      setDetailCourse(fullCourse);
      setDetailModules(fetchedModules);
      setDetailEnrollment(enr);
      setDetailProgress(progMap);
      setView('detail');

      if (fullCourse.id) {
        fetchUserCourseReview(fullCourse.id);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Gagal membuka detil kelas', err);
      toast.error('Gagal memuat detil kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courses.length > 0) {
      if (courseSlug) {
        const course = courses.find(c => c.slug === courseSlug);
        if (course && (!selectedCourse || selectedCourse.slug !== courseSlug)) {
          handleContinueLearning(course);
        }
      } else {
        if (view !== 'detail') {
          setView('catalog');
        }
        setSelectedCourse(null);
      }
    }
  }, [courseSlug, courses]);

  useEffect(() => {
    const detailSlug = searchParams.get('detail');
    if (detailSlug && courses.length > 0 && view !== 'course') {
      const course = courses.find(c => c.slug === detailSlug || String(c.id) === String(detailSlug));
      if (course && (!detailCourse || detailCourse.slug !== detailSlug)) {
        handleOpenCourseDetail(course);
      }
    }
  }, [searchParams, courses]);

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

      if (!nextLesson) {
        setTimeout(() => {
          setReviewModalOpen(true);
        }, 800);
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
        if (!nextLesson) {
          setTimeout(() => {
            setReviewModalOpen(true);
          }, 800);
        }
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
        setTimeout(() => {
          setReviewModalOpen(true);
        }, 800);
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

  if ((view === 'catalog' || view === 'detail') && !selectedCourse) {
    return (
      <AppLayout title={view === 'detail' && detailCourse ? detailCourse.title : "Academy E-Learning"}>
        <div className="w-full pb-16 space-y-6">
          {view === 'detail' && detailCourse ? (
            <CourseDetailView
              course={detailCourse}
              modules={detailModules}
              enrollment={detailEnrollment}
              progress={detailProgress}
              onBack={() => {
                setView('catalog');
                setDetailCourse(null);
                if (searchParams.get('detail')) {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('detail');
                  setSearchParams(newParams);
                }
                fetchMyProgress();
              }}
              onStartLearning={handleContinueLearning}
              onOpenCertificate={(c) => {
                setCertCourse(c);
                setCertModalOpen(true);
              }}
              onOpenReview={() => setReviewModalOpen(true)}
              userReview={userCourseReview}
              renderStars={renderStars}
            />
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Dicoding Flat Academy Sidebar */}
              <AcademySidebar
                activeTab={academyTab}
                onTabChange={setAcademyTab}
                currentStreak={streakData.current_streak || 0}
                activeCoursesCount={(myProgressData.active_courses?.length || 0) + (myProgressData.completed_courses?.length || 0)}
              />

              {/* Main Academy View Area */}
              <div className="flex-1 min-w-0">
                {academyTab === 'progress' && (
                  <ProgressBelajarView
                    activeCourses={myProgressData.active_courses || []}
                    completedCourses={myProgressData.completed_courses || []}
                    loading={loadingProgress}
                    streakData={streakData}
                    initialSubTab={searchParams.get('status') || 'in_progress'}
                    onOpenCheckin={() => setCheckinModalOpen(true)}
                    onViewAllStreak={() => setAcademyTab('streak')}
                    onContinueLearning={handleContinueLearning}
                    onExploreCatalog={() => setAcademyTab('catalog')}
                    onOpenCertificate={(c) => {
                      setCertCourse(c);
                      setCertModalOpen(true);
                    }}
                    onSelectCourse={handleOpenCourseDetail}
                  />
                )}

                {academyTab === 'streak' && (
                  <RuntutanBelajarView
                    streakData={streakData}
                    currentMonthDate={currentCalendarMonth}
                    onMonthChange={handleMonthChange}
                    onOpenCheckin={() => setCheckinModalOpen(true)}
                    loading={loading}
                  />
                )}

                {academyTab === 'catalog' && (
                  <CourseCatalogView
                    courses={courses}
                    loading={loading}
                    onSelectCourse={handleOpenCourseDetail}
                    renderStars={renderStars}
                  />
                )}
              </div>
            </div>
          )}

          {/* Daily Check-in Modal */}
          <DailyCheckinModal
            isOpen={checkinModalOpen}
            onClose={() => setCheckinModalOpen(false)}
            onCheckinSuccess={handleCheckinSuccess}
            currentStreak={streakData.current_streak || 0}
          />

          {/* Modal Sertifikat Kelulusan */}
          <CertificateModal
            isOpen={certModalOpen}
            onClose={() => setCertModalOpen(false)}
            course={certCourse}
            user={user}
          />

          {/* Review Modal untuk Kursus */}
          <ReviewModal
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            targetType="course"
            targetId={detailCourse?.id || selectedCourse?.id}
            targetTitle={detailCourse?.title || selectedCourse?.title}
            initialReview={userCourseReview}
            onSuccess={(data) => {
              setUserCourseReview(data.review);
              if (detailCourse) {
                setDetailCourse({
                  ...detailCourse,
                  rating: data.rating,
                  total_reviews: data.total_reviews,
                });
              }
            }}
          />
        </div>
      </AppLayout>
    );
  }

  // ===== WORKSPACE VIEW =====
  const currentTab = view === 'catatan' ? 'catatan' : 'modul';

  const courseTotalLessons = flatLessons.length;
  const courseCompletedCount = flatLessons.filter(l => progress[l.id]).length;
  const progressPercent = courseTotalLessons ? Math.round((courseCompletedCount / courseTotalLessons) * 100) : 0;
  const completedCount = courseCompletedCount;
  const totalLessons = courseTotalLessons;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
      {/* ── TOP NAV ── */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20 relative shadow-sm">
        <button
          onClick={() => {
            setView('catalog');
            setSelectedCourse(null);
            setDetailCourse(null);
            fetchMyProgress();
            fetchStreakData(currentCalendarMonth);
          }}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <FontAwesomeIcon icon={['fas', 'arrow-left']} /> Kembali ke Dashboard Belajar
        </button>
        <div className="flex items-center gap-3">
          {progressPercent === 100 && (
            <button
              onClick={() => {
                setCertCourse(selectedCourse);
                setCertModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-200" />
              <span>Ambil Sertifikat</span>
            </button>
          )}
          <Badge color="blue" className="hidden sm:flex">Mode Belajar Fokus</Badge>
        </div>
      </div>

      {/* ── SPLIT LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-[320px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col h-full overflow-hidden z-10 shadow-sm hidden md:flex">
          
          {/* Course Info Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3 line-clamp-2">
              {selectedCourse.title}
            </h2>
            
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <Badge color="blue" className="text-[9px] px-2 py-0.5 mb-2 font-bold">{getLessonTypeLabel(selectedLesson?.type).toUpperCase()}</Badge>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 mb-4">
                {selectedLesson?.title || 'Pilih Materi'}
              </h3>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Progress Belajar</span>
                  <span className="text-slate-900 dark:text-white">{completedCount} / {totalLessons} modul</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {progressPercent}% Selesai
                </div>
              </div>

              {/* Tombol Ambil Sertifikat jika kelas selesai */}
              {progressPercent === 100 && (
                <button
                  onClick={() => {
                    setCertCourse(selectedCourse);
                    setCertModalOpen(true);
                  }}
                  className="w-full mt-3 py-2 px-3 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-200" />
                  <span>Ambil Sertifikat Kelulusan</span>
                </button>
              )}

              {/* Tombol Beri / Edit Testimoni Kursus */}
              <button
                onClick={() => setReviewModalOpen(true)}
                className="w-full mt-2.5 py-2 px-3 text-xs font-bold rounded-lg border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <FontAwesomeIcon icon={['fas', 'star']} className="text-amber-500" />
                <span>{userCourseReview ? `Ubah Testimoni (${userCourseReview.rating}★)` : 'Beri Testimoni Kursus'}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 px-2">
            <button
              onClick={() => setView('workspace')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${currentTab === 'modul' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Daftar Modul
            </button>
            <button
              onClick={() => setView('catatan')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${currentTab === 'catatan' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Catatan Belajar
            </button>
          </div>

          {/* Curriculum List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentTab === 'modul' ? modules.map((module, mIdx) => {
              const moduleLessons = module.lessons || [];
              const modCompleted = moduleLessons.filter(l => progress[l.id]).length;
              const isLocked = lockedModuleIds.includes(module.id);
              
              return (
                <div key={module.id} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-2">
                    <span className="uppercase tracking-wider truncate mr-2">{module.title}</span>
                    <span className="shrink-0">{modCompleted}/{moduleLessons.length}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {moduleLessons.map((lesson, lIdx) => {
                      const isActive = selectedLesson?.id === lesson.id;
                      const isCompleted = progress[lesson.id];
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (!isLocked) {
                              selectModule(module);
                              selectLesson(lesson);
                            }
                          }}
                          disabled={isLocked}
                          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors ${
                            isLocked 
                              ? 'opacity-50 cursor-not-allowed'
                              : isActive 
                                ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">
                                <FontAwesomeIcon icon={['fas', 'check']} />
                              </div>
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[8px] border border-blue-200 dark:border-blue-800">
                                <FontAwesomeIcon icon={['fas', 'play']} className="ml-0.5" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold truncate leading-tight mb-1 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                              <span>{mIdx + 1}.{lIdx + 1}</span>
                              <span>·</span>
                              <span>{lesson.is_preview ? 'Gratis' : getLessonTypeLabel(lesson.type)}</span>
                              {isLocked && (
                                <>
                                  <span>·</span>
                                  <FontAwesomeIcon icon={['fas', 'lock']} className="text-amber-500" />
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <div className="p-4 text-center text-slate-500 text-sm">
                Catatan Anda untuk kursus ini akan tampil di sini.
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col h-full relative overflow-hidden">

          {selectedLesson ? (
            <div className="flex-1 overflow-y-auto pb-32 scroll-smooth">
              <div className="max-w-4xl mx-auto px-6 sm:px-12 py-10 sm:py-16">
                
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-10 leading-tight">
                  {selectedLesson.title}
                </h1>
                
                <div className="content-wrapper">
                  {selectedLesson.type === 'video' && selectedLesson.video_url ? (
                        <div className="aspect-video bg-slate-900">
                          <iframe width="100%" height="100%" src={toEmbedUrl(selectedLesson.video_url)} title={selectedLesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                        </div>
                      ) : selectedLesson.type === 'reading' ? (
                        <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed text-slate-800 dark:text-slate-200">
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
                      </div>

                      {/* Course Completion & Testimonial Box */}
                      {(!nextLesson || progressPercent === 100) && (
                        <div className="mt-8 p-5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
                              <FontAwesomeIcon icon={['fas', 'trophy']} />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {userCourseReview ? 'Terima Kasih Atas Testimoni Anda!' : 'Selamat! Anda Telah Menyelesaikan Kursus Ini'}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                {userCourseReview
                                  ? `Rating Anda: ${userCourseReview.rating} dari 5 bintang. Ulasan Anda membantu siswa lain dan tutor SkorPluss.`
                                  : 'Bagikan testimoni dan rating pengalaman belajar Anda untuk membantu teman-teman lainnya.'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setReviewModalOpen(true)}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                          >
                            <FontAwesomeIcon icon={['fas', 'star']} />
                            <span>{userCourseReview ? 'Edit Testimoni' : 'Beri Testimoni & Rating'}</span>
                          </button>
                        </div>
                      )}

                  {/* Bottom Navigation */}
                  <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      {prevLesson && (
                        <Button onClick={() => navigateToLesson(prevLesson)} variant="ghost" className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold px-6 py-2.5 rounded-xl">
                          ← Sebelumnya
                        </Button>
                      )}
                    </div>
                    <div>
                      {selectedLesson.type === 'quiz' ? (
                        quizAttempts[selectedLesson.id]?.is_passed ? (
                          nextLesson ? (
                            <Button onClick={() => navigateToLesson(nextLesson)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md">
                              Selanjutnya →
                            </Button>
                          ) : (
                            <Badge color="emerald" className="px-4 py-2 font-bold rounded-xl text-sm">
                              <FontAwesomeIcon icon={['fas', 'circle-check']} className="mr-1.5" /> Kuis Selesai
                            </Badge>
                          )
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-4">
                            Harus lulus kuis (min 60%) untuk lanjut
                          </span>
                        )
                      ) : (
                        <Button onClick={() => markLessonComplete(selectedLesson.id)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md">
                          {!nextLesson ? (
                            <><FontAwesomeIcon icon={['fas', 'check-double']} className="mr-2" /> Tandai Selesai</>
                          ) : progress[selectedLesson.id] ? (
                            <>Selanjutnya →</>
                          ) : (
                            <>Tandai Selesai & Lanjut →</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl">
                🎓
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Selamat Datang di {selectedCourse?.title}</h2>
              <p className="max-w-md mx-auto">Pilih materi pada daftar modul di sebelah kiri untuk memulai proses pembelajaran Anda.</p>
            </div>
          )}

          {/* Floating AI Helper Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105">
              <FontAwesomeIcon icon={['fas', 'robot']} />
              Tanya Dibby AI tentang materi ini
            </button>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
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

      {/* Review Modal untuk Kursus */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        targetType="course"
        targetId={selectedCourse?.id}
        targetTitle={selectedCourse?.title}
        initialReview={userCourseReview}
        onSuccess={(data) => {
          setUserCourseReview(data.review);
          if (selectedCourse) {
            setSelectedCourse({
              ...selectedCourse,
              rating: data.rating,
              total_reviews: data.total_reviews,
            });
          }
        }}
      />
    </div>
  );
}
