import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import StreakCard from './StreakCard';

export default function ProgressBelajarView({
  activeCourses = [],
  completedCourses = [],
  loading = false,
  streakData = {},
  initialSubTab = 'in_progress',
  onOpenCheckin,
  onViewAllStreak,
  onContinueLearning,
  onExploreCatalog,
  onOpenCertificate,
  onSelectCourse,
}) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleCourseClick = (course) => {
    if (onSelectCourse) {
      onSelectCourse(course);
    } else {
      navigate(`/kursus/${course.slug || course.id}`);
    }
  };

  const displayedCourses = activeSubTab === 'in_progress' ? activeCourses : completedCourses;

  return (
    <div className="w-full space-y-6">
      {/* Top Title Banner */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Progress Belajar
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Lanjutkan progres belajar Anda untuk menyelesaikan kelas dan mendapatkan sertifikat kelulusan.
        </p>
      </div>

      {/* Main Grid: Left Courses List, Right Streak Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Courses Tabs & List) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Flat Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
            <button
              onClick={() => setActiveSubTab('in_progress')}
              className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
                activeSubTab === 'in_progress'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <span>Kelas yang Dipelajari</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  activeSubTab === 'in_progress'
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {activeCourses.length}
              </span>
              {activeSubTab === 'in_progress' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('completed')}
              className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
                activeSubTab === 'completed'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <span>Kelas yang Diselesaikan</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  activeSubTab === 'completed'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {completedCourses.length}
              </span>
              {activeSubTab === 'completed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Courses List */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Memuat progres belajar...</p>
            </div>
          ) : displayedCourses.length === 0 ? (
            <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-2xl">
                <FontAwesomeIcon icon={['fas', activeSubTab === 'in_progress' ? 'book-reader' : 'award']} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {activeSubTab === 'in_progress'
                    ? 'Belum ada kelas yang sedang dipelajari'
                    : 'Belum ada kelas yang diselesaikan'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {activeSubTab === 'in_progress'
                    ? 'Pilih kelas favoritmu di katalog kursus dan mulai belajar sekarang juga.'
                    : 'Selesaikan seluruh materi dan kuis pada kelas yang sedang kamu pelajari untuk melihat sertifikat di sini.'}
                </p>
              </div>
              <Button
                onClick={onExploreCatalog}
                className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg"
              >
                Jelajahi Katalog Kelas →
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedCourses.map((course) => {
                const percent = course.progress_percentage || 0;
                return (
                  <div
                    key={course.id || course.course_id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between shadow-xs"
                  >
                    {/* Thumbnail & Basic Info */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1 min-w-0">
                      <div
                        onClick={() => handleCourseClick(course)}
                        title="Klik untuk melihat silabus materi & detail kursus"
                        className="w-full sm:w-36 h-24 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 relative cursor-pointer group"
                      >
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl group-hover:scale-105 transition-transform duration-300">
                            <FontAwesomeIcon icon={['fas', 'graduation-cap']} />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/70 text-white backdrop-blur-xs">
                          {course.category || 'Materi'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge color="blue" className="text-[10px] px-2 py-0.5">
                            {course.category}
                          </Badge>
                          {percent === 100 && (
                            <button
                              type="button"
                              onClick={() => handleCourseClick(course)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                              title="Lihat detail & sertifikat di halaman kursus"
                            >
                              <FontAwesomeIcon icon={['fas', 'award']} className="text-amber-500" /> Bersertifikat Resmi
                            </button>
                          )}
                          {course.last_activity_at && (
                            <span className="text-[11px] text-slate-400">
                              • Aktif {course.last_activity_at}
                            </span>
                          )}
                          {course.completed_at && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              • Selesai {course.completed_at}
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={() => handleCourseClick(course)}
                          className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                          title="Klik untuk melihat rincian silabus materi & detail kursus"
                        >
                          {course.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Tutor: <span className="font-semibold text-slate-700 dark:text-slate-300">{course.instructor_name}</span>
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {percent}% selesai
                            </span>
                            <span>
                              {course.completed_lessons || 0}/{course.total_lessons || 0} materi
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent === 100
                                  ? 'bg-emerald-500'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                      {percent === 100 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCourseClick(course)}
                            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 transition-colors cursor-pointer hidden sm:inline-flex items-center gap-1"
                          >
                            <span>Detail</span>
                            <FontAwesomeIcon icon={['fas', 'angle-right']} className="text-[10px]" />
                          </button>
                          <button
                            onClick={() => onContinueLearning(course)}
                            title="Pelajari Ulang Kelas"
                            aria-label="Pelajari Ulang Kelas"
                            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0 group/icon"
                          >
                            <FontAwesomeIcon icon={['fas', 'rotate-right']} className="text-sm group-hover/icon:rotate-45 transition-transform" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => handleCourseClick(course)}
                            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 transition-colors cursor-pointer hidden sm:inline-flex items-center gap-1"
                          >
                            <span>Detail</span>
                            <FontAwesomeIcon icon={['fas', 'angle-right']} className="text-[10px]" />
                          </button>
                          <Button
                            onClick={() => onContinueLearning(course)}
                            className="w-full sm:w-auto text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2 !bg-blue-600 hover:!bg-blue-700 text-white"
                          >
                            <span>Lanjutkan Belajar</span>
                            <FontAwesomeIcon icon={['fas', 'arrow-right']} className="text-[10px]" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Runtutan Belajar Widget */}
        <div className="lg:col-span-4 sticky top-6">
          <StreakCard
            streakData={streakData}
            onOpenCheckin={onOpenCheckin}
            onViewAllStreak={onViewAllStreak}
          />
        </div>

      </div>
    </div>
  );
}
