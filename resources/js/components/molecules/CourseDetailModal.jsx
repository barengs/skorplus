import React, { useState } from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toEmbedUrl } from '../../utils/videoHelper';

export default function CourseDetailModal({ course, modules = [], enrollment = null, progress = {}, onEnroll, onStartLearning, onClose }) {
  const [previewLesson, setPreviewLesson] = useState(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-2xl my-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Header */}
        <div className="relative">
          <div className="h-40 bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden">
            {course.thumbnail && (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-50" />
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-slate-900 font-bold"
            >
              ✕
            </button>
          </div>

          {/* Course Info */}
          <div className="px-6 pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Badge color="blue" className="mb-2">{course.category}</Badge>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{course.title}</h2>
              </div>
            </div>

            {/* Rating & Stats */}
            <div className="flex flex-wrap items-center gap-6 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">{renderStars(course.rating)}</div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {(Number(course.rating) || 0).toFixed(1)} ({course.participants || 0} peserta)
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-3">
                <span><FontAwesomeIcon icon={['fas', 'book']} className="text-blue-500 mr-1.5" /> {modules.length} modul</span>
                <span><FontAwesomeIcon icon={['fas', 'list-check']} className="text-emerald-500 mr-1.5" /> {totalLessons} materi</span>
              </div>
              {course.has_certificate && (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={['fas', 'award']} /> Sertifikat Gratis
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: course.description }} />
            </div>

            {/* Progress Bar */}
            {enrollment && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Progres Belajarmu</span>
                  <span className="text-slate-600 dark:text-slate-400">{enrollment.progress_percentage || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${enrollment.progress_percentage || 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {enrollment.completed_lessons || 0} dari {enrollment.total_lessons || 0} materi selesai
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Curriculum Section */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={['fas', 'graduation-cap']} className="text-blue-600" /> Kurikulum Lengkap
          </h3>
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {modules.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada materi dalam kursus ini.</p>
            ) : (
              modules.map((module, moduleIdx) => (
                <div key={module.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={['fas', 'folder-open']} className="text-slate-400" />
                    <span>Modul {moduleIdx + 1}: {module.title}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-normal">
                      {module.lessons?.length || 0} materi
                    </span>
                  </div>
                  
                  <div className="space-y-2 ml-6">
                    {module.lessons?.map((lesson, lessonIdx) => (
                      <div key={lesson.id} className="flex items-center gap-3 text-sm p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors">
                        <span className="text-base">{getLessonTypeIcon(lesson.type)}</span>
                        <span className="flex-1 text-slate-700 dark:text-slate-300">
                          {lessonIdx + 1}. {lesson.title}
                        </span>
                        <Badge color="gray" size="sm">{getLessonTypeLabel(lesson.type)}</Badge>
                        {lesson.type === 'video' && lesson.video_url && lesson.is_preview && (
                          <button
                            onClick={() => setPreviewLesson(lesson)}
                            className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                          >
                            <FontAwesomeIcon icon={['fas', 'play']} /> Preview
                          </button>
                        )}
                        {progress[lesson.id] && (
                          <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 rounded-b-lg flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          {!enrollment ? (
            <Button onClick={() => { onEnroll(); onClose(); }} color="blue" size="lg" className="flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'rocket']} /> Mulai Belajar Gratis
            </Button>
          ) : (
            <Button onClick={onStartLearning} color="blue" size="lg" className="flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'play']} /> Lanjutkan Belajar
            </Button>
          )}
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
