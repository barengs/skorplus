import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../../templates/AppLayout';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import api from '../../../services/api';
import { toast } from 'react-toastify';

export default function ElearningPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('catalog'); // 'catalog' or 'course'

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/elearning/courses');
      setCourses(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat kursus');
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setView('course');
    try {
      const res = await api.get(`/elearning/courses/${course.slug}`);
      setModules(res.data.modules || []);
      if (res.data.modules && res.data.modules.length > 0) {
        selectModule(res.data.modules[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat modul');
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

  const markLessonComplete = async (lessonId) => {
    try {
      await api.post(`/elearning/lessons/${lessonId}/complete`);
      setProgress({ ...progress, [lessonId]: true });
      toast.success('Materi ditandai selesai!');
    } catch (err) {
      toast.error('Gagal menandai materi');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const getLessonTypeIcon = (type) => {
    const icons = {
      video: '🎬',
      reading: '📖',
      quiz: '❓',
      assignment: '✏️',
    };
    return icons[type] || '📄';
  };

  const getLessonTypeLabel = (type) => {
    const labels = {
      video: 'Video',
      reading: 'Bacaan',
      quiz: 'Kuis',
      assignment: 'Tugas',
    };
    return labels[type] || 'Materi';
  };

  // Catalog View
  if (view === 'catalog' && !selectedCourse) {
    return (
      <AppLayout title="E-Learning">
        <div className="max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Perpustakaan Pembelajaran</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Tingkatkan kemampuanmu dengan ribuan materi dari tutor berpengalaman</p>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-600 dark:text-slate-400">Belum ada kursus tersedia</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => selectCourse(course)}
                  className="text-left group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-video">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎓</div>
                    )}
                    {course.has_certificate && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        🏆 Sertifikat
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <Badge color="blue" className="mb-2">
                      {course.category}
                    </Badge>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{course.description}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-0.5 text-sm">{renderStars(course.rating || 0)}</div>
                      <span className="text-xs text-slate-500">
                        {course.rating ? course.rating.toFixed(1) : '0.0'} ({course.total_reviews || 0})
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500">{course.is_active ? '✅ Tersedia' : '🔒 Locked'}</span>
                      <Button size="sm" variant="ghost" className="text-blue-600">
                        Lihat Kursus →
                      </Button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // Course View
  return (
    <AppLayout title={selectedCourse?.title || 'E-Learning'}>
      <div className="max-w-7xl mx-auto pb-16">
        {/* Back Button */}
        <button
          onClick={() => {
            setView('catalog');
            setSelectedCourse(null);
          }}
          className="mb-6 text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-2"
        >
          ← Kembali ke Katalog
        </button>

        {selectedCourse && (
          <div className="space-y-8">
            {/* Course Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Thumbnail */}
                <div className="md:col-span-1">
                  {selectedCourse.thumbnail ? (
                    <img
                      src={selectedCourse.thumbnail}
                      alt={selectedCourse.title}
                      className="w-full rounded-lg object-cover aspect-video"
                    />
                  ) : (
                    <div className="w-full rounded-lg bg-blue-800 flex items-center justify-center aspect-video text-6xl">🎓</div>
                  )}
                </div>

                {/* Course Info */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h1 className="text-3xl font-black mb-2">{selectedCourse.title}</h1>
                    <p className="text-blue-100 mb-4">{selectedCourse.description}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5 text-xl">{renderStars(selectedCourse.rating || 0)}</div>
                    <span className="text-blue-100">
                      {selectedCourse.rating ? selectedCourse.rating.toFixed(1) : '0.0'} · {selectedCourse.total_reviews || 0} ulasan
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-500/30">
                    <div>
                      <div className="text-2xl font-bold">{modules.length}</div>
                      <div className="text-sm text-blue-100">Modul</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{lessons.length}</div>
                      <div className="text-sm text-blue-100">Materi</div>
                    </div>
                    {selectedCourse.has_certificate && (
                      <div>
                        <div className="text-2xl">🏆</div>
                        <div className="text-sm text-blue-100">Sertifikat</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Sidebar: Curriculum */}
              <div className="lg:col-span-1 space-y-2 h-fit">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 px-2">Kurikulum</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {modules.map((module) => (
                    <div key={module.id} className="space-y-1">
                      <button
                        onClick={() => selectModule(module)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-all text-sm font-semibold ${
                          selectedModule?.id === module.id
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
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
                              className={`w-full text-left px-3 py-1.5 rounded-md transition-all text-xs flex items-center gap-2 ${
                                selectedLesson?.id === lesson.id
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <span>{getLessonTypeIcon(lesson.type)}</span>
                              <span className="truncate flex-1">{lesson.title}</span>
                              {progress[lesson.id] && <span className="text-emerald-500">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {selectedLesson ? (
                  <>
                    {/* Lesson Header */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getLessonTypeIcon(selectedLesson.type)}</span>
                            <Badge color="blue">{getLessonTypeLabel(selectedLesson.type)}</Badge>
                          </div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{selectedLesson.title}</h2>
                        </div>
                        {progress[selectedLesson.id] && (
                          <Badge color="emerald" className="flex items-center gap-1">
                            ✓ Selesai
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Lesson Content */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      {selectedLesson.type === 'video' && selectedLesson.video_url ? (
                        <div className="aspect-video bg-slate-900">
                          <iframe
                            width="100%"
                            height="100%"
                            src={selectedLesson.video_url}
                            title={selectedLesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : selectedLesson.type === 'reading' ? (
                        <div className="p-8 prose dark:prose-invert max-w-none">
                          <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedLesson.content || 'Materi tidak tersedia'}</div>
                        </div>
                      ) : selectedLesson.type === 'quiz' ? (
                        <div className="p-8">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                            <div className="text-4xl mb-4">❓</div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Kuis Interaktif</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Uji pemahamanmu tentang materi ini</p>
                            <Button className="">Mulai Kuis</Button>
                          </div>
                        </div>
                      ) : selectedLesson.type === 'assignment' ? (
                        <div className="p-8">
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 text-center">
                            <div className="text-4xl mb-4">✏️</div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Tugas Praktik</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Praktikkan apa yang telah kamu pelajari</p>
                            <Button className="">Lihat Tugas</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video flex items-center justify-center text-slate-400">
                          Konten tidak tersedia
                        </div>
                      )}

                      {/* Lesson Meta */}
                      <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                        {selectedLesson.summary && (
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Ringkasan Materi</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedLesson.summary}</p>
                          </div>
                        )}

                        {selectedLesson.duration_seconds && (
                          <p className="text-xs text-slate-500">⏱️ Durasi: {Math.floor(selectedLesson.duration_seconds / 60)} menit</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                          {!progress[selectedLesson.id] && (
                            <Button onClick={() => markLessonComplete(selectedLesson.id)} size="md">
                              ✓ Tandai Selesai
                            </Button>
                          )}
                          {selectedLesson.attachment_pdf && (
                            <Button variant="ghost" size="md">
                              📥 Download Materi
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400">Pilih materi untuk memulai pembelajaran</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
