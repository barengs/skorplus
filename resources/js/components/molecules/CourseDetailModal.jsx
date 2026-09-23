import React, { useState } from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toEmbedUrl } from '../../utils/videoHelper';

export default function CourseDetailModal({ course, modules = [], enrollment = null, progress = {}, onEnroll, onStartLearning, onClose, onOpenCertificate }) {
  const [previewLesson, setPreviewLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  React.useEffect(() => {
    if (modules && modules.length > 0) {
      const initial = {};
      modules.forEach(m => initial[m.id] = true);
      setExpandedModules(initial);
    }
  }, [modules]);

  const toggleModule = (id) => {
    setExpandedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(Number(rating) || 0) ? 'text-yellow-400' : 'text-slate-300'}>
          ★
        </span>
      );
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

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedLessonsCount = modules.reduce((sum, m) => {
    return sum + (m.lessons || []).filter(l => progress[l.id]).length;
  }, 0);
  const totalDurationSec = modules.reduce((sum, m) => {
    return sum + (m.lessons || []).reduce((lSum, l) => lSum + (Number(l.duration_seconds) || 0), 0);
  }, 0);

  const isCompleted = Boolean(
    enrollment?.completed_at ||
    (enrollment?.progress_percentage !== undefined && Number(enrollment?.progress_percentage) >= 100) ||
    course?.completed_at ||
    (course?.progress_percentage !== undefined && Number(course?.progress_percentage) >= 100) ||
    (totalLessons > 0 && completedLessonsCount >= totalLessons)
  );

  const formatTotalDuration = (sec) => {
    if (!sec) return '1 Jam';
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}j ${minutes}m`;
    if (hours > 0) return `${hours} Jam`;
    return `${minutes} Menit`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl my-8 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="relative">
          <div className="h-44 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden flex items-center justify-center">
            {course.thumbnail && (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-35" />
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-slate-900 font-bold shadow-md transition-colors"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                {course.category || 'Materi Belajar'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs flex items-center gap-1.5">
                <FontAwesomeIcon icon={['fas', 'award']} /> Sertifikat Resmi
              </span>
            </div>
          </div>

          {/* Course Info */}
          <div className="px-6 pt-5">
            <div className="mb-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{course.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tutor: <strong className="text-slate-700 dark:text-slate-200">{course.display_instructor || course.instructor_name || 'Tim Pengajar SkorPluss'}</strong>
              </p>
            </div>

            {/* Dedicated Specifications Box (Dicoding Style) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Program</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {course.display_program || course.program_name || 'Reguler'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Level</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {course.level || 'Pemula'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Durasi</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {formatTotalDuration(totalDurationSec)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peserta</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {(course.participants || 0).toLocaleString('id-ID')} Siswa
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: course.description }} />
            </div>

            {/* Progress Bar / Completion Status */}
            {isCompleted ? (
              <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-amber-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500 text-sm" />
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                      Selamat! Kelas Telah Selesai (100%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Kamu telah menyelesaikan seluruh materi. Sertifikat kelulusan resmi siap diunduh.
                  </p>
                </div>
                {onOpenCertificate && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCertificate(course);
                      onClose();
                    }}
                    className="shrink-0 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-200" />
                    <span>Ambil Sertifikat</span>
                  </button>
                )}
              </div>
            ) : enrollment ? (
              <div className="mb-4 p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-blue-900 dark:text-blue-200">Progres Belajarmu</span>
                  <span className="text-blue-700 dark:text-blue-400">{enrollment.progress_percentage || 0}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${enrollment.progress_percentage || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {enrollment.completed_lessons || 0} dari {enrollment.total_lessons || totalLessons} materi selesai
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Curriculum Section (Collapse Model with Zero Gaps) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'graduation-cap']} className="text-blue-600" />
              <span>Silabus ({modules.length} Section • {totalLessons} Materi)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Model Collapse</span>
          </div>
          
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {modules.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada materi dalam kursus ini.</p>
            ) : (
              modules.map((module, moduleIdx) => {
                const isExpanded = !!expandedModules[module.id];
                const quizCount = module.lessons?.filter(l => l.type === 'quiz').length || 0;

                return (
                  <div key={module.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {/* Collapsible Header */}
                    <div
                      onClick={() => toggleModule(module.id)}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-slate-400 text-xs w-4">
                          <FontAwesomeIcon icon={['fas', isExpanded ? 'chevron-down' : 'chevron-right']} />
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 block truncate">
                            Section {moduleIdx + 1}: {module.title}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {module.lessons?.length || 0} Materi
                            </span>
                            {quizCount > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                • {quizCount} Kuis
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {isExpanded ? 'Tutup' : 'Buka'}
                      </span>
                    </div>

                    {/* Zero-Gap Lesson List */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {module.lessons?.map((lesson, lessonIdx) => (
                          <div key={lesson.id} className="flex items-center justify-between gap-3 text-xs py-2.5 px-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-slate-400 font-mono text-[11px] w-5 shrink-0">
                                {moduleIdx + 1}.{lessonIdx + 1}
                              </span>
                              <span className="text-sm shrink-0">{getLessonTypeIcon(lesson.type)}</span>
                              <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                                {lesson.title}
                              </span>
                              {progress[lesson.id] && (
                                <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500 shrink-0" />
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Badge color="gray" size="sm" className="text-[10px]">{getLessonTypeLabel(lesson.type)}</Badge>
                              {lesson.type === 'video' && lesson.video_url && lesson.is_preview && (
                                <button
                                  onClick={() => setPreviewLesson(lesson)}
                                  className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                >
                                  <FontAwesomeIcon icon={['fas', 'play']} /> Preview
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-500" />
                Sertifikat Siap Diambil
              </span>
            )}
          </div>
          <div className="flex gap-2.5 items-center w-full sm:w-auto justify-end">
            <Button variant="ghost" onClick={onClose} className="text-xs">
              Tutup
            </Button>
            {!enrollment ? (
              <Button onClick={() => { onEnroll(); onClose(); }} color="blue" size="md" className="flex items-center gap-2 text-xs font-bold">
                <FontAwesomeIcon icon={['fas', 'rocket']} /> Mulai Belajar Gratis
              </Button>
            ) : isCompleted ? (
              <>
                <Button
                  onClick={onStartLearning}
                  variant="outline"
                  size="md"
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FontAwesomeIcon icon={['fas', 'rotate-right']} /> Pelajari Ulang
                </Button>
                {onOpenCertificate && (
                  <Button
                    onClick={() => {
                      onOpenCertificate(course);
                      onClose();
                    }}
                    className="!bg-gradient-to-r !from-amber-500 !to-amber-600 hover:!from-amber-600 hover:!to-amber-700 text-white font-bold text-xs shadow-md flex items-center gap-2 px-4 py-2.5 rounded-lg border-0"
                  >
                    <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-200 text-sm" />
                    <span>Ambil Sertifikat</span>
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={onStartLearning} color="blue" size="md" className="flex items-center gap-2 text-xs font-bold">
                <FontAwesomeIcon icon={['fas', 'play']} /> Lanjutkan Belajar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewLesson(null)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{previewLesson.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Preview Gratis</p>
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
    </div>
  );
}
