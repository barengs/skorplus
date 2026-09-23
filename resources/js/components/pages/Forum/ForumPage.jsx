import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { createPost, fetchForumCourses } from '../../../features/forum/forumSlice';
import AppLayout from '../../templates/AppLayout';
import ForumList from '../../organisms/ForumList';
import Button from '../../atoms/Button';
import Input from '../../atoms/Input';

export default function ForumPage() {
  const dispatch = useDispatch();
  const { courses = [], loadingCourses, submitting } = useSelector((s) => s.forum);

  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showAsk, setShowAsk] = useState(false);
  const [form, setForm] = useState({ subject: '', course_id: null, title: '', content: '' });

  const checkScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  useEffect(() => {
    dispatch(fetchForumCourses());
  }, [dispatch]);

  // Set default subject when courses arrive
  useEffect(() => {
    if (courses.length > 0 && !form.subject) {
      setForm((prev) => ({
        ...prev,
        subject: courses[0].title,
        course_id: courses[0].id,
      }));
    }
  }, [courses]);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    checkScroll();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        checkScroll();
      });
      ro.observe(el);
    }

    const onScroll = () => checkScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const t1 = setTimeout(checkScroll, 50);
    const t2 = setTimeout(checkScroll, 250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [courses]);

  const scroll = (direction) => {
    if (!sliderRef.current) return;
    const scrollAmount = 280;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleAsk = async () => {
    if (!form.subject) {
      toast.warn('Pilih mata pelajaran / kursus terlebih dahulu.');
      return;
    }
    if (!form.title || form.content.length < 10) {
      toast.warn('Isi judul dan deskripsi minimal 10 karakter.');
      return;
    }
    const result = await dispatch(createPost(form));
    if (createPost.fulfilled.match(result)) {
      toast.success('Pertanyaan berhasil dikirim! Tutor akan segera menjawab.');
      setShowAsk(false);
      setForm({
        subject: courses[0]?.title || '',
        course_id: courses[0]?.id || null,
        title: '',
        content: '',
      });
    } else {
      toast.error('Gagal mengirim pertanyaan.');
    }
  };

  return (
    <AppLayout title="Forum Tanya Jawab">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Diskusi & Tanya Jawab</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Tanya tutor alumni UI/ITB — rata-rata jawab dalam 14 menit</p>
          </div>
          <Button onClick={() => setShowAsk(!showAsk)} variant={showAsk ? 'ghost' : 'primary'}>
            {showAsk ? 'Batal' : '✏️ Ajukan Pertanyaan'}
          </Button>
        </div>

        {/* Ask form */}
        {showAsk && (
          <div className="bg-white dark:bg-slate-900 border border-blue-500/20 rounded-lg p-5 flex flex-col gap-4 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Pertanyaan Baru</h3>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
                Mata Pelajaran / Kursus
              </label>
              <select
                value={form.subject}
                onChange={(e) => {
                  const selected = courses.find((c) => c.title === e.target.value);
                  setForm({
                    ...form,
                    subject: e.target.value,
                    course_id: selected?.id || null,
                  });
                }}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
              >
                {courses.length === 0 ? (
                  <option value="">{loadingCourses ? 'Memuat daftar kursus...' : 'Belum ada kursus tersedia'}</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>
            <Input
              label="Judul Pertanyaan"
              placeholder="Singkat & jelas — contoh: Cara mencari nilai limit?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Deskripsi Lengkap</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="Jelaskan soal atau materi yang membingungkan..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none resize-none"
              />
            </div>
            <Button onClick={handleAsk} loading={submitting} className="self-end">Kirim Pertanyaan →</Button>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Cari soal atau topik..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            prefix="🔍"
            className="flex-1"
          />
          <Button type="submit" variant="ghost">Cari</Button>
        </form>

        {/* Course / Subject filters (Horizontal Slider with Drop Shadow Arrow & Gradient Fade) */}
        <div className="relative w-full group">
          {/* Left Gradient Shadow & Arrow Button */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 flex items-center justify-start pl-0.5 z-10 pointer-events-none transition-all duration-250 ${
              canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={() => scroll('left')}
              className="pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
              title="Geser ke kiri"
              aria-label="Geser ke kiri"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Slider track */}
          <div
            ref={sliderRef}
            className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-1 w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-nowrap"
          >
            <button
              onClick={(e) => {
                setFilter('semua');
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                filter === 'semua'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semua Kursus
            </button>
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={(e) => {
                  setFilter(c.title);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  filter === c.title
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>

          {/* Right Gradient Shadow & Arrow Button */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 flex items-center justify-end pr-0.5 z-10 pointer-events-none transition-all duration-250 ${
              canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={() => scroll('right')}
              className="pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 animate-pulse hover:animate-none"
              title="Geser ke kanan untuk melihat kursus lainnya"
              aria-label="Geser ke kanan"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Forum list */}
        <ForumList filter={filter} search={search} />
      </div>
    </AppLayout>
  );
}
