import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import { toEmbedUrl } from '../../../utils/videoHelper';

export default function CourseDetailView({
  course,
  modules = [],
  enrollment = null,
  progress = {},
  onBack,
  onStartLearning,
  onOpenCertificate,
  onOpenReview,
  userReview = null,
  renderStars,
}) {
  const [expandedModules, setExpandedModules] = useState({});
  const [previewLesson, setPreviewLesson] = useState(null);

  useEffect(() => {
    if (modules && modules.length > 0) {
      const initial = {};
      modules.forEach((m) => {
        initial[m.id] = true;
      });
      setExpandedModules(initial);
    }
  }, [modules]);

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllModules = (expand) => {
    if (!modules) return;
    const newState = {};
    modules.forEach((m) => {
      newState[m.id] = expand;
    });
    setExpandedModules(newState);
  };

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedLessonsCount = modules.reduce((sum, m) => {
    return sum + (m.lessons || []).filter((l) => progress[l.id]).length;
  }, 0);
  const totalDurationSec = modules.reduce((sum, m) => {
    return sum + (m.lessons || []).reduce((lSum, l) => lSum + (Number(l.duration_seconds) || 0), 0);
  }, 0);

  const formatTotalDuration = (sec) => {
    if (!sec) return '1 Jam';
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}j ${minutes}m`;
    if (hours > 0) return `${hours} Jam`;
    return `${minutes} Menit`;
  };

  const formatLessonDuration = (sec) => {
    if (!sec || sec <= 0) return '5 mnt';
    const mins = Math.round(sec / 60);
    return `${mins} mnt`;
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <FontAwesomeIcon icon={['fas', 'video']} className="text-blue-500" />;
      case 'reading':
        return <FontAwesomeIcon icon={['fas', 'book-open']} className="text-emerald-500" />;
      case 'quiz':
        return <FontAwesomeIcon icon={['fas', 'circle-question']} className="text-amber-500" />;
      case 'assignment':
        return <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="text-purple-500" />;
      default:
        return <FontAwesomeIcon icon={['fas', 'file']} className="text-slate-400" />;
    }
  };

  const getLessonTypeLabel = (type) => {
    const labels = { video: 'Video', reading: 'Bacaan', quiz: 'Kuis', assignment: 'Tugas Akhir' };
    return labels[type] || 'Materi';
  };

  const isCompleted = Boolean(
    enrollment?.completed_at ||
    (enrollment?.progress_percentage !== undefined && Number(enrollment?.progress_percentage) >= 100) ||
    course?.completed_at ||
    (course?.progress_percentage !== undefined && Number(course?.progress_percentage) >= 100) ||
    (totalLessons > 0 && completedLessonsCount >= totalLessons)
  );

  const progressPercent = enrollment?.progress_percentage || (totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0);
  const allExpanded = modules.length > 0 && modules.every((m) => expandedModules[m.id]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Top Back Navigation Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FontAwesomeIcon icon={['fas', 'arrow-left']} className="text-[11px]" />
            <span>Kembali ke Daftar Kelas</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>›</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{course.category || 'Materi'}</span>
            <span>›</span>
            <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{course.title}</span>
          </div>
        </div>

        {/* Quick actions in top bar */}
        <div className="flex items-center gap-2">
          {isCompleted && onOpenCertificate && (
            <button
              onClick={() => onOpenCertificate(course)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-200" />
              <span>Ambil Sertifikat</span>
            </button>
          )}

          <Button
            onClick={() => onStartLearning(course)}
            className="!bg-blue-600 hover:!bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={['fas', isCompleted ? 'rotate-right' : 'play']} />
            <span>{isCompleted ? 'Pelajari Ulang' : 'Lanjutkan Belajar'}</span>
          </Button>
        </div>
      </div>

      {/* ── Main Layout: Left Content, Right Sticky Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN (8 cols): Course Info & Full Syllabus ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Course Hero Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="blue" className="text-xs px-2.5 py-0.5">
                {course.category || 'Materi'}
              </Badge>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                  <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-500" /> Kelas Telah Selesai (100%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  Sedang Dipelajari
                </span>
              )}
              <span className="text-xs text-slate-400">
                • {course.level || 'Level Pemula'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {course.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div>
                Tutor: <strong className="text-slate-700 dark:text-slate-200">{course.display_instructor || course.instructor_name || 'Tim Pengajar SkorPluss'}</strong>
              </div>
              <span>•</span>
              <div>
                Program: <strong className="text-blue-600 dark:text-blue-400">{course.display_program || course.program_name || 'Reguler'}</strong>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <strong className="text-slate-700 dark:text-slate-200">{(Number(course.rating) || 5).toFixed(1)}</strong>
                <span>({course.total_reviews || 0} ulasan)</span>
              </div>
            </div>

            {/* Description */}
            {course.description && (
              <div
                className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            )}

            {/* Completion / Progress Notice Card */}
            {isCompleted ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/40 border border-emerald-300/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500 text-sm" />
                    <span>Selamat! Kamu telah menyelesaikan seluruh materi pada kelas ini (100%).</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Sertifikat resmi kelulusan telah diterbitkan dan siap disimpan atau dicetak kapan pun.
                  </p>
                </div>
                {onOpenCertificate && (
                  <button
                    onClick={() => onOpenCertificate(course)}
                    className="shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-200" />
                    <span>Ambil Sertifikat</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-blue-900 dark:text-blue-200">Progres Belajarmu</span>
                  <span className="text-blue-700 dark:text-blue-400">{progressPercent}% Selesai</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>{completedLessonsCount} dari {totalLessons} materi diselesaikan</span>
                  <span>{totalLessons - completedLessonsCount} materi tersisa</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Syllabus / Curriculum Section ── */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'graduation-cap']} className="text-blue-600" />
                  <span>Silabus & Seluruh Materi Kelas</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {modules.length} Section • {totalLessons} Materi Pembelajaran • {formatTotalDuration(totalDurationSec)} Total Durasi
                </p>
              </div>

              <button
                onClick={() => toggleAllModules(!allExpanded)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline self-start sm:self-auto cursor-pointer"
              >
                {allExpanded ? 'Tutup Semua Section' : 'Buka Semua Section'}
              </button>
            </div>

            {/* Modules List */}
            {modules.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Materi silabus belum tersedia untuk kelas ini.
              </p>
            ) : (
              <div className="space-y-3">
                {modules.map((mod, modIdx) => {
                  const isExpanded = !!expandedModules[mod.id];
                  const modLessons = mod.lessons || [];
                  const modCompletedCount = modLessons.filter((l) => progress[l.id]).length;
                  const isModComplete = modLessons.length > 0 && modCompletedCount >= modLessons.length;
                  const isAssignmentSection =
                    mod.title.toLowerCase().includes('tugas akhir') ||
                    modLessons.some((l) => l.type === 'assignment');

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
                              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                                Section {modIdx + 1}: {mod.title}
                              </h3>
                              {isAssignmentSection && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                  Tugas Akhir
                                </span>
                              )}
                              {isModComplete && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                  Selesai ✓
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{modLessons.length} Materi</span>
                              <span>•</span>
                              <span>{modCompletedCount}/{modLessons.length} diselesaikan</span>
                              {modLessons.filter((l) => l.type === 'quiz').length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                    {modLessons.filter((l) => l.type === 'quiz').length} Kuis
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden sm:inline">
                          {isExpanded ? 'Tutup' : 'Buka'}
                        </span>
                      </div>

                      {/* Lessons List inside Module */}
                      {isExpanded && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {modLessons.map((lesson, lessonIdx) => {
                            const isDone = !!progress[lesson.id];
                            return (
                              <div
                                key={lesson.id}
                                className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-slate-400 font-mono text-xs w-7 shrink-0">
                                    {modIdx + 1}.{lessonIdx + 1}
                                  </span>
                                  <span className="text-sm shrink-0">{getLessonTypeIcon(lesson.type)}</span>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`text-xs sm:text-sm font-medium truncate ${isDone ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {lesson.title}
                                      </span>
                                      {isDone && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                          <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500" /> Selesai
                                        </span>
                                      )}
                                      {lesson.is_preview && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewLesson(lesson)}
                                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                                        >
                                          Preview 👁️
                                        </button>
                                      )}
                                      {lesson.attachment_doc && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 shrink-0">
                                          📎 Dokumen
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                                      {getLessonTypeLabel(lesson.type)} • {formatLessonDuration(lesson.duration_seconds)}
                                    </p>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                  {lesson.type === 'video' && lesson.video_url && lesson.is_preview && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLesson(lesson)}
                                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                                    >
                                      Pratinjau
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (4 cols): Sticky Action & Specifications Card ── */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            {/* Thumbnail */}
            <div className="relative aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-800">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">
                  <FontAwesomeIcon icon={['fas', 'graduation-cap']} />
                </div>
              )}
              <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-950/80 text-white backdrop-blur-xs">
                {course.category || 'Materi'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {isCompleted ? (
                <>
                  {onOpenCertificate && (
                    <button
                      onClick={() => onOpenCertificate(course)}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-200 text-sm" />
                      <span>Ambil Sertifikat Kelulusan</span>
                    </button>
                  )}

                  <Button
                    onClick={() => onStartLearning(course)}
                    variant="outline"
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={['fas', 'rotate-right']} />
                    <span>Pelajari Ulang Materi</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => onStartLearning(course)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs !bg-blue-600 hover:!bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <span>Lanjutkan Belajar</span>
                  <FontAwesomeIcon icon={['fas', 'arrow-right']} className="text-[11px]" />
                </Button>
              )}

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-center block transition-colors cursor-pointer"
              >
                ← Kembali ke Daftar Kelas Lainnya
              </button>
            </div>

            {/* Specifications Box */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">
                Spesifikasi Kursus
              </span>

              <div className="space-y-2 text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Total Durasi</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatTotalDuration(totalDurationSec)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span>📚</span>
                    <span>Total Materi</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {modules.length} Section ({totalLessons} Materi)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span>👨‍🏫</span>
                    <span>Tutor</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {course.display_instructor || course.instructor_name || 'Tim Pengajar'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span>🎓</span>
                    <span>Sertifikat</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Resmi Kelulusan
                  </span>
                </div>
              </div>
            </div>

            {/* Review Button */}
            {onOpenReview && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={onOpenReview}
                  className="w-full py-2 px-3 text-xs font-bold rounded-lg border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <FontAwesomeIcon icon={['fas', 'star']} className="text-amber-500" />
                  <span>{userReview ? `Ubah Ulasan (${userReview.rating}★)` : 'Beri Ulasan Kelas'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Video Preview Modal */}
      {previewLesson && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewLesson(null)}
        >
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
