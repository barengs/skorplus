import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LandingNav } from '../Landing/LandingPage';
import Logo from '../../atoms/Logo';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/elearning/catalog', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data || {};
      setCourses(data.courses || []);
      setPopularCourses(data.popular_courses || []);
      setCategories(['Semua', ...(data.categories || [])]);
    } catch (err) {
      console.error('Failed to load courses catalog', err);
      toast.error('Gagal memuat katalog kursus');
    } finally {
      setLoading(false);
    }
  };

  // Scroll horizontal carousel
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filtered courses for categorized bottom section
  const filteredCategoryCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchCategory =
        selectedCategory === 'Semua' || c.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.display_instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [courses, selectedCategory, searchQuery]);

  // Open course full detail page
  const handleOpenDetail = (course) => {
    navigate(`/kursus/${course.slug}`);
  };

  // Handle direct action on course
  const handleCourseAction = (e, course) => {
    e.stopPropagation();
    if (course.is_enrolled) {
      navigate(`/elearning/${course.slug}`);
    } else {
      navigate(`/kursus/${course.slug}`);
    }
  };

  // Format rating comma (e.g. 4,9)
  const formatRating = (val) => {
    if (!val || Number(val) === 0) return '0,0';
    return String(Number(val).toFixed(1)).replace('.', ',');
  };

  // Format review count (e.g. 435.765 peringkat)
  const formatReviews = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Helper badge color based on program name
  const getProgramBadgeStyle = (programName) => {
    const p = (programName || '').toLowerCase();
    if (p.includes('garansi')) {
      return 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
    }
    if (p.includes('intensif')) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* ── Top Navbar ── */}
      <LandingNav />

      {/* ── Hero & Search Header ── */}
      <header className="pt-32 pb-10 px-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 mb-3">
                <span>🎓</span>
                <span>Katalog Lengkap Pelajaran SkorPluss</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Pilihan Kursus & Materi Belajar
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
                Tingkatkan kompetensi UTBK, pemrograman, kecerdasan buatan (AI), dan digital skills sesuai program belajar aktifmu.
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                placeholder="Cari kursus, topik, atau tutor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
              <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat katalog kursus...</p>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════════════
                SECTION 1: KURSUS POPULER (TOP SECTION)
                ══════════════════════════════════════════════════════════════ */}
            <section className="relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Kursus Populer
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Materi paling diminati dan mendapatkan ulasan tertinggi dari para siswa.
                  </p>
                </div>

                {/* Carousel Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollCarousel('left')}
                    aria-label="Scroll left"
                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    aria-label="Scroll right"
                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Horizontal Carousel Container */}
              <div
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {popularCourses.length > 0 ? (
                  popularCourses.map((course) => (
                    <div
                      key={`pop-${course.id}`}
                      onClick={() => handleOpenDetail(course)}
                      className="w-72 sm:w-80 shrink-0 snap-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
                    >
                      <div>
                        {/* Course Thumbnail */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3.5">
                          <img
                            src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {course.has_certificate && (
                            <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              Sertifikat
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h3>

                        {/* Instructor */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {course.display_instructor}
                        </p>

                        {/* Ratings & Reviews */}
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded">
                            <span>★</span>
                            <span>{formatRating(course.rating)}</span>
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                            {formatReviews(course.total_reviews)} peringkat
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Program Info & Action Button */}
                      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            Akses Program
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${getProgramBadgeStyle(
                              course.display_program
                            )}`}
                          >
                            {course.display_program}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleCourseAction(e, course)}
                          className="border border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors shrink-0"
                        >
                          {course.is_enrolled ? 'Mulai Belajar' : 'Pilih Kursus'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-6">Belum ada kursus populer saat ini.</p>
                )}
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 2: SEMUA KURSUS DENGAN KATEGORI (BOTTOM SECTION)
                ══════════════════════════════════════════════════════════════ */}
            <section className="pt-6">
              {/* Category Tabs Bar */}
              <div className="border-b border-slate-200 dark:border-slate-800 mb-8">
                <div
                  className="flex items-center gap-6 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categories.map((cat) => {
                    const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
                          isActive
                            ? 'text-slate-900 dark:text-white font-bold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {cat}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categorized Courses Grid */}
              {filteredCategoryCourses.length > 0 ? (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredCategoryCourses.map((course) => (
                      <div
                        key={`cat-${course.id}`}
                        onClick={() => handleOpenDetail(course)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
                      >
                        <div>
                          {/* Course Thumbnail */}
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3.5">
                            <img
                              src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {course.has_certificate && (
                              <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                Sertifikat
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {course.title}
                          </h3>

                          {/* Instructor */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {course.display_instructor}
                          </p>

                          {/* Badges: Terlaris + Rating + Reviews */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {course.is_bestseller && (
                              <span className="bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 font-bold text-[11px] px-2 py-0.5 rounded">
                                Terlaris
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded">
                              <span>★</span>
                              <span>{formatRating(course.rating)}</span>
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                              {formatReviews(course.total_reviews)} peringkat
                            </span>
                          </div>
                        </div>

                        {/* Card Footer: Program Info & Action Button */}
                        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                              Akses Program
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${getProgramBadgeStyle(
                                course.display_program
                              )}`}
                            >
                              {course.display_program}
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleCourseAction(e, course)}
                            className="border border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors shrink-0"
                          >
                            {course.is_enrolled ? 'Mulai Belajar' : 'Pilih Kursus'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* "Tampilkan semua kursus [Kategori] ->" Bottom Link */}
                  {selectedCategory !== 'Semua' && (
                    <div className="mt-8">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className="text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 font-bold text-sm inline-flex items-center gap-1.5 group cursor-pointer"
                      >
                        <span>Tampilkan semua kursus {selectedCategory}</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                  <div className="text-4xl mb-3">🔍</div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tidak ada kursus ditemukan</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    {searchQuery
                      ? `Tidak ditemukan kursus yang cocok dengan pencarian "${searchQuery}" pada kategori ${selectedCategory}.`
                      : `Belum ada kursus yang terdaftar pada kategori ${selectedCategory}.`}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('Semua');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Tampilkan Semua Kursus
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} SkorPluss Learning Center. Seluruh hak cipta dilindungi undang-undang.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/#program" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Program Belajar</Link>
            <Link to="/#fitur" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Fitur</Link>
            <Link to="/#testimoni" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Testimoni</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
