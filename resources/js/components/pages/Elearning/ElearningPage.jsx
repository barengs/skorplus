import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../templates/AppLayout';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
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

  const handleStartLearning = () => {
    setView('course');
    setSelectedCourse(modalCourse);
    setModules(modalModules);
    setEnrollment(modalEnrollment);
    setProgress(modalProgress);
    setModalOpen(false);

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
    setSelectedModule(module);
    setLessons(module.lessons || []);
    if (module.lessons && module.lessons.length > 0) {
      selectLesson(module.lessons[0]);
    }
  };

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson);
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
                <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
                  {modules.map((module) => (
                    <div key={module.id} className="space-y-1">
                      <button
                        onClick={() => selectModule(module)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-all text-sm font-semibold ${
                          selectedModule?.id === module.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {module.title}
                      </button>
                      {selectedModule?.id === module.id && (
                        <div className="space-y-1 ml-2">
                          {(module.lessons || []).map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => selectLesson(lesson)}
                              className={`w-full text-left px-3 py-2 rounded-md transition-all text-xs flex items-center gap-2 ${
                                selectedLesson?.id === lesson.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <span className="text-sm">{getLessonTypeIcon(lesson.type)}</span>
                              <span className="truncate flex-1">{lesson.title}</span>
                              {progress[lesson.id] && <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
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
                      ) : selectedLesson.type === 'quiz' ? (
                        <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50">
                          <div className="text-5xl mb-4 text-amber-500"><FontAwesomeIcon icon={['fas', 'clipboard-question']} /></div>
                          <p className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">Kuis Interaktif</p>
                          <p className="text-slate-600 dark:text-slate-400 mb-6">Uji pemahamanmu tentang materi ini</p>
                          <Button>Mulai Kuis</Button>
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
                            <Button onClick={() => markLessonComplete(selectedLesson.id)} className="flex items-center gap-2">
                              {!nextLesson ? (
                                <><FontAwesomeIcon icon={['fas', 'check-double']} /> Selesai</>
                              ) : progress[selectedLesson.id] ? (
                                <>Lanjut <FontAwesomeIcon icon={['fas', 'arrow-right']} /></>
                              ) : (
                                <><FontAwesomeIcon icon={['fas', 'check']} /> Lanjut</>
                              )}
                            </Button>
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
    </AppLayout>
  );
}
