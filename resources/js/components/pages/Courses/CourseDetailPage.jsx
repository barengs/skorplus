import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LandingNav } from '../Landing/LandingPage';
import Logo from '../../atoms/Logo';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import { toEmbedUrl } from '../../../utils/videoHelper';
import ReviewModal from '../../molecules/ReviewModal';
import CertificateModal from '../../molecules/CertificateModal';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [previewLesson, setPreviewLesson] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState({});
  const [certModalOpen, setCertModalOpen] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/elearning/courses/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data;
      setCourse(data);

      // Expand all modules by default
      if (data.modules) {
        const initialExpanded = {};
        data.modules.forEach((m) => {
          initialExpanded[m.id] = true;
        });
        setExpandedModules(initialExpanded);
      }

      if (data.id) {
        fetchCourseReviews(data.id);
        if (token) {
          fetchCourseProgress(data.id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat rincian kursus');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseProgress = async (courseId) => {
    try {
      const res = await axios.get(`/api/elearning/courses/${courseId}/progress`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data) {
        setEnrollment(res.data.enrollment || null);
        const map = {};
        (res.data.completed_lesson_ids || []).forEach((id) => {
          map[id] = true;
        });
        setProgress(map);
      }
    } catch (e) {
      console.error('Gagal memuat progres kursus', e);
    }
  };

  const fetchCourseReviews = async (courseId) => {
    try {
      const res = await axios.get(`/api/courses/${courseId}/reviews`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setReviews(res.data.reviews || []);
      setUserReview(res.data.user_review || null);
    } catch (err) {
      console.error('Gagal memuat review kursus', err);
    }
  };

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllModules = (expand) => {
    if (!course?.modules) return;
    const newState = {};
    course.modules.forEach((m) => {
      newState[m.id] = expand;
    });
    setExpandedModules(newState);
  };

  const handleEnroll = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      await axios.post(
        `/api/elearning/courses/${course.id}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Berhasil mendaftar pada kursus ini!');
      navigate(`/elearning/${course.slug}`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mendaftar kursus. Silakan coba lagi.');
    } finally {
      setEnrolling(false);
    }
  };

  const formatRating = (val) => {
    if (!val || Number(val) === 0) return '0,0';
    return String(Number(val).toFixed(1)).replace('.', ',');
  };

  const formatReviews = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '5 mnt';
    const mins = Math.round(seconds / 60);
    return `${mins} mnt`;
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return <FontAwesomeIcon icon={['fas', 'video']} className="text-blue-500" />;
      case 'quiz':
        return <FontAwesomeIcon icon={['fas', 'circle-question']} className="text-amber-500" />;
      case 'assignment':
        return <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="text-purple-500" />;
      case 'reading':
      default:
        return <FontAwesomeIcon icon={['fas', 'book-open']} className="text-emerald-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
        <LandingNav />
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat detail silabus kursus...</p>
        </div>
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
          SkorPluss Learning Center
        </footer>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
        <LandingNav />
        <div className="max-w-md mx-auto py-40 text-center px-6">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold">Kursus Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-2">Kursus yang Anda tuju tidak tersedia atau telah dipindahkan.</p>
          <Link to="/kursus" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm">
            Kembali ke Katalog Kursus
          </Link>
        </div>
      </div>
    );
  }

  const allModulesExpanded = course.modules?.every((m) => expandedModules[m.id]);
  const totalLessonsCount = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessonsCount = Object.keys(progress).length;
  const isCompleted = Boolean(
    enrollment?.completed_at ||
    (enrollment?.progress_percentage !== undefined && Number(enrollment?.progress_percentage) >= 100) ||
    course?.completed_at ||
    (course?.progress_percentage !== undefined && Number(course?.progress_percentage) >= 100) ||
    (totalLessonsCount > 0 && completedLessonsCount >= totalLessonsCount)
  );

  const totalDurationMinutes = Math.round(
    (course.modules?.reduce(
      (acc, m) => acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.duration_seconds || 0), 0) || 0),
      0
    ) || 0) / 60
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* ── Top Navbar ── */}
      <LandingNav />

      {/* ── Dark Hero Banner Header ── */}
      <section className="pt-28 pb-12 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb Navigation */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <span>›</span>
            {token ? (
              <>
                <Link to="/elearning" className="hover:text-white transition-colors">E-Learning</Link>
                <span>›</span>
              </>
            ) : null}
            <Link to="/kursus" className="hover:text-white transition-colors">Katalog Kursus</Link>
            <span>›</span>
            <span className="text-blue-400">{course.category || 'Materi'}</span>
            <span>›</span>
            <span className="text-slate-200 truncate max-w-xs">{course.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {course.category}
                </span>
                {isCompleted && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-400" /> Kelas Telah Selesai (100%)
                  </span>
                )}
                {course.is_bestseller && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Terlaris
                  </span>
                )}
                {course.has_certificate && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-400" /> Sertifikat Resmi
                  </span>
                )}
              </div>

              {/* Course Title */}
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                {course.title}
              </h1>

              {/* Short Description */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {course.description ||
                  'Pelajari materi terstruktur dan komprehensif ini untuk menguasai kompetensi dari dasar hingga mahir dengan kurikulum yang telah teruji.'}
              </p>

              {/* Meta information row */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">★ {formatRating(course.rating)}</span>
                  <span className="text-slate-400 underline">({formatReviews(course.total_reviews)} ulasan)</span>
                </div>
                <span>•</span>
                <div>
                  Instruktur: <span className="font-semibold text-white">{course.display_instructor}</span>
                </div>
                <span>•</span>
                <div>
                  Akses Program: <span className="font-semibold text-blue-400">{course.display_program}</span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/80">
                  📁 {course.modules?.length || 0} Section Materi
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/80">
                  📖 {totalLessonsCount} Materi Total
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/80">
                  ⏱️ {totalDurationMinutes} Menit Pembelajaran
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/80">
                  🌐 Bahasa Indonesia
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* ── LEFT / MAIN COLUMN (2/3) ── */}
          <div className="lg:col-span-2 space-y-10">
            {/* 1. Program Access Information Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/70 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md shadow-blue-500/20">
                  🏷️
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Akses Berdasarkan Program
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Termasuk dalam paket {course.display_program}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Kursus ini disediakan khusus untuk siswa dengan keanggotaan aktif{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{course.display_program}</span>.
                    Anda mendapatkan akses tak terbatas ke seluruh video materi, dokumen panduan, kuis interaktif, dan evaluasi tugas akhir.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Yang Akan Anda Pelajari */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎯</span>
                <span>Yang Akan Anda Pelajari</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold text-base">✓</span>
                  <span>Penguasaan konsep mendalam dari level pemula hingga studi kasus lanjutan.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold text-base">✓</span>
                  <span>Latihan soal terarah dan metodologi pemecahan masalah yang efisien.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold text-base">✓</span>
                  <span>Evaluasi pemahaman di setiap modul melalui kuis interaktif berstandar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold text-base">✓</span>
                  <span>Proyek tugas akhir portofolio dan sertifikat resmi kelulusan.</span>
                </div>
              </div>
            </div>

            {/* 3. Kurikulum & Silabus Materi (Accordion persis seperti halaman admin) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📚</span>
                    <span>Silabus & Daftar Materi Kursus</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {course.modules?.length || 0} Section • {totalLessonsCount} Materi Pembelajaran • {totalDurationMinutes} Menit Total Durasi
                  </p>
                </div>

                <button
                  onClick={() => toggleAllModules(!allModulesExpanded)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline self-start sm:self-auto"
                >
                  {allModulesExpanded ? 'Tutup Semua Section' : 'Buka Semua Section'}
                </button>
              </div>

              {/* Sections List */}
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((mod, modIdx) => {
                    const isExpanded = !!expandedModules[mod.id];
                    const isAssignmentSection =
                      mod.title.toLowerCase().includes('tugas akhir') ||
                      mod.lessons?.some((l) => l.type === 'assignment');

                    return (
                      <div
                        key={mod.id}
                        className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
                      >
                        {/* Section Header */}
                        <div
                          onClick={() => toggleModule(mod.id)}
                          className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
                            isAssignmentSection
                              ? 'bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-950/50'
                              : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 text-xs shrink-0">
                              <FontAwesomeIcon icon={['fas', isExpanded ? 'chevron-down' : 'chevron-right']} />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                                  Section {modIdx + 1}: {mod.title}
                                </h4>
                                {isAssignmentSection && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                    Tugas Akhir
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="px-2 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                  {mod.lessons?.length || 0} Materi
                                </span>
                                {mod.lessons?.filter((l) => l.type === 'quiz').length > 0 && (
                                  <span className="px-2 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 font-semibold text-amber-800 dark:text-amber-300">
                                    {mod.lessons?.filter((l) => l.type === 'quiz').length} Kuis
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lessons inside Section */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                            {mod.lessons && mod.lessons.length > 0 ? (
                              mod.lessons.map((lesson, lessonIdx) => (
                                <div
                                  key={lesson.id}
                                  className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400 font-mono text-xs w-7">
                                      {modIdx + 1}.{lessonIdx + 1}
                                    </span>
                                    <span className="text-sm w-5 text-center">
                                      {getLessonIcon(lesson.type)}
                                    </span>
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                                          {lesson.title}
                                        </span>
                                        {progress[lesson.id] && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500" /> Selesai
                                          </span>
                                        )}
                                        {lesson.is_preview && (
                                          <button
                                            onClick={() => setPreviewLesson(lesson)}
                                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                                          >
                                            Gratis Preview 👁️
                                          </button>
                                        )}
                                        {lesson.attachment_doc && (
                                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60">
                                            📎 Dokumen Panduan
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                                        {lesson.type} • {formatDuration(lesson.duration_seconds)}
                                      </p>
                                    </div>
                                  </div>

                                  {lesson.is_preview && (
                                    <button
                                      onClick={() => setPreviewLesson(lesson)}
                                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                                    >
                                      Pratinjau
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic p-4">
                                Belum ada materi pada section ini.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Silabus sedang disiapkan oleh tutor.
                </div>
              )}
            </div>

            {/* 4. Deskripsi Lengkap Kursus */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Deskripsi Lengkap Kursus
              </h3>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                <p>
                  {course.description ||
                    'Kursus ini dirancang oleh tutor berpengalaman untuk memberikan pemahaman menyeluruh terhadap konsep penting yang sering diujikan dan dibutuhkan di dunia akademik maupun industri.'}
                </p>
                <p>
                  Setiap materi disusun secara bertahap dari pemahaman konsep dasar, visualisasi materi, pembahasan soal, hingga latihan kuis dan tugas mandiri. Siswa dapat belajar dengan fleksibel sesuai dengan ritme masing-masing.
                </p>
              </div>
            </div>

            {/* 5. Profil Instruktur */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Tentang Instruktur
              </h3>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xl shrink-0">
                  👨‍🏫
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {course.display_instructor}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tutor Ahli • Tim Pengajar SkorPluss Learning Center
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
                    Berpengalaman dalam membimbing ribuan siswa meraih target kelulusan PTN dan sertifikasi keahlian digital dengan metode pembelajaran yang sistematis dan mudah dipahami.
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Ulasan & Testimoni Siswa */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Ulasan & Testimoni Siswa
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pengalaman nyata dari siswa yang telah mengikuti kursus ini
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-3 py-1.5 rounded-lg">
                    <span className="text-amber-500 font-bold text-base">★</span>
                    <span className="font-black text-amber-700 dark:text-amber-300 text-sm">
                      {formatRating(course.rating)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({formatReviews(course.total_reviews)})
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (!token) {
                        toast.info('Silakan login terlebih dahulu untuk menulis ulasan');
                        navigate('/login');
                        return;
                      }
                      setReviewModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={['fas', 'pen-to-square']} />
                    <span>{userReview ? 'Ubah Ulasan' : 'Tulis Ulasan'}</span>
                  </button>
                </div>
              </div>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center">
                            {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                                {rev.user?.name || 'Siswa SkorPluss'}
                              </h5>
                              {rev.user?.id === user?.id && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold">
                                  Ulasan Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex text-amber-400 text-xs">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FontAwesomeIcon
                                    key={star}
                                    icon={['fas', 'star']}
                                    className={star <= rev.rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rev.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-12">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-3xl">⭐</div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Belum Ada Ulasan
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Jadilah siswa pertama yang memberikan ulasan dan rating untuk kursus ini setelah mempelajari materinya!
                  </p>
                  <button
                    onClick={() => {
                      if (!token) {
                        toast.info('Silakan login terlebih dahulu untuk menulis ulasan');
                        navigate('/login');
                        return;
                      }
                      setReviewModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer"
                  >
                    <FontAwesomeIcon icon={['fas', 'pen-to-square']} />
                    <span>Tulis Ulasan Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: STICKY SIDEBAR (1/3) ── */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              {/* Thumbnail with Play Overlay */}
              <div className="relative aspect-video bg-slate-800 overflow-hidden group">
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center font-bold shadow-lg pl-1 group-hover:scale-110 transition-transform">
                    ▶
                  </span>
                </div>
              </div>

              {/* Sidebar Info & Action Button */}
              <div className="p-6 space-y-5">
                {/* Program & Level Highlights */}
                <div className="bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px]">
                      Program Belajar
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {course.display_program}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/50 dark:border-blue-900/40">
                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px]">
                      Tingkat Level
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {course.level || 'Level Pemula'}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div>
                  {isCompleted ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/40 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                          <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500" />
                          <span>Selamat! Kelas Telah Selesai (100%)</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Kamu telah menyelesaikan seluruh materi dan berhak mendapatkan sertifikat resmi.
                        </p>
                      </div>

                      <button
                        onClick={() => setCertModalOpen(true)}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-200 text-base" />
                        <span>Ambil Sertifikat Kelulusan</span>
                      </button>

                      <button
                        onClick={() => navigate(`/elearning/${course.slug}`)}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={['fas', 'rotate-right']} />
                        <span>Pelajari Ulang Materi</span>
                      </button>
                    </div>
                  ) : (course.is_enrolled || enrollment) ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-blue-900 dark:text-blue-200">Progres Belajar</span>
                          <span className="text-blue-700 dark:text-blue-400">{enrollment?.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${enrollment?.progress_percentage || 0}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {enrollment?.completed_lessons || completedLessonsCount || 0} dari {totalLessonsCount} materi selesai
                        </p>
                      </div>

                      <button
                        onClick={() => navigate(`/elearning/${course.slug}`)}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <span>Lanjutkan Belajar</span>
                        <FontAwesomeIcon icon={['fas', 'arrow-right']} className="text-xs" />
                      </button>
                    </div>
                  ) : token ? (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>{enrolling ? 'Mendaftarkan...' : 'Daftar & Ambil Kursus Ini'}</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/daftar"
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all text-center block"
                      >
                        Daftar Untuk Akses Kursus
                      </Link>
                      <Link
                        to="/login"
                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-center block transition-colors"
                      >
                        Sudah punya akun? Masuk
                      </Link>
                    </div>
                  )}
                </div>

                {/* Spesifikasi & Detil Materi Kursus (Ruang Khusus Dicoding Style) */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">
                    Spesifikasi Kursus
                  </span>

                  <div className="space-y-2 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">⏱️</span>
                        <span>Total Durasi</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {totalDurationMinutes > 60
                          ? `${Math.floor(totalDurationMinutes / 60)} Jam ${totalDurationMinutes % 60} Menit`
                          : `${totalDurationMinutes} Menit`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-2">
                        <span className="text-purple-500 font-bold">👥</span>
                        <span>Jumlah Peserta</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {(course.participants || 0).toLocaleString('id-ID')} Siswa
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-2">
                        <span className="text-blue-500 font-bold">📚</span>
                        <span>Detil Materi</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {course.modules?.length || 0} Modul ({totalLessonsCount} Materi)
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold">👨‍🏫</span>
                        <span>Tutor Pengajar</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {course.display_instructor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checklist Features */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">
                    Fasilitas Kursus Ini:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span>Akses penuh materi modul & video pembelajaran</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span>Latihan soal & kuis evaluasi materi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span>Tugas akhir portofolio dinilai tutor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span>Sertifikat resmi kelulusan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span>Akses di perangkat desktop & mobile</span>
                  </div>
                </div>

                {/* Back to Catalog Link */}
                <div className="pt-2 text-center">
                  <Link
                    to="/kursus"
                    className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    ← Kembali ke Semua Kursus
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Lesson Preview Modal (Untuk materi dengan is_preview) ── */}
      {previewLesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPreviewLesson(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Gratis Preview
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {previewLesson.title}
                </h4>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {previewLesson.type === 'video' && previewLesson.video_url ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={toEmbedUrl(previewLesson.video_url)}
                    title={previewLesson.title}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : previewLesson.content ? (
                <div
                  className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewLesson.content }}
                />
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Pratinjau materi pengantar kursus.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Durasi: {formatDuration(previewLesson.duration_seconds)}
              </span>
              <button
                onClick={() => setPreviewLesson(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6 mt-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} SkorPluss Learning Center. Seluruh hak cipta dilindungi undang-undang.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/kursus" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Semua Kursus</Link>
            <Link to="/#program" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Program Belajar</Link>
            <Link to="/#fitur" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Fitur</Link>
          </div>
        </div>
      </footer>

      {/* ── Modal Ulasan / Testimoni Kursus ── */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        targetType="course"
        targetId={course?.id}
        targetTitle={course?.title}
        initialReview={userReview}
        onSuccess={(data) => {
          setUserReview(data.review);
          setCourse((prev) => ({
            ...prev,
            rating: data.rating,
            total_reviews: data.total_reviews,
          }));
          if (course?.id) {
            fetchCourseReviews(course.id);
          }
        }}
      />

      {/* ── Modal Sertifikat Kelulusan Resmi ── */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        course={course}
        user={user}
      />
    </div>
  );
}
