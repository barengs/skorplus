import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';

export default function CourseCatalogView({
  courses = [],
  loading = false,
  onSelectCourse,
  renderStars,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))];

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Katalog Kelas
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Eksplorasi kelas terbaik sesuai kurikulum terbaru, dibimbing mentor berpengalaman.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <input
            type="text"
            placeholder="Cari materi atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <FontAwesomeIcon
            icon={['fas', 'search']}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Memuat katalog kelas...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Tidak ada kelas yang sesuai dengan pencarian.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-xs"
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => {
                if (onSelectCourse) {
                  onSelectCourse(course);
                } else {
                  navigate(`/kursus/${course.slug || course.id}`);
                }
              }}
              className="group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-3xl">
                      <FontAwesomeIcon icon={['fas', 'graduation-cap']} />
                    </div>
                  )}

                  {course.is_enrolled && (
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-xs flex items-center gap-1">
                      <FontAwesomeIcon icon={['fas', 'check']} /> Terdaftar
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge color="blue" className="text-[10px] px-2 py-0.5">
                      {course.category || 'Materi'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description ? course.description.replace(/<[^>]*>?/gm, '') : 'Belum ada deskripsi singkat.'}
                  </p>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  {renderStars ? renderStars(course.rating) : '⭐'}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {(Number(course.rating) || 0).toFixed(1)}
                  </span>
                  <span>({course.participants || 0} siswa)</span>
                </div>

                <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs">
                  <span>Lihat Kelas</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
