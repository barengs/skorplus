import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Logo from '../../atoms/Logo';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';
import ThemeToggle from '../../atoms/ThemeToggle';
import { formatRupiah } from '../../../utils/currencyHelper';

// ── Countdown Component ──────────────────────────────────────────────────────
function PromoCountdown({ seconds }) {
  const [time, setTime] = useState(seconds || 0);
  useEffect(() => {
    setTime(seconds || 0);
  }, [seconds]);
  
  useEffect(() => {
    if (time <= 0) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [time]);
  
  const fmt = (n) => String(n).padStart(2, '0');
  const h = Math.floor(time / 3600), m = Math.floor((time % 3600) / 60), s = time % 60;
  return (
    <span className="font-mono font-bold text-amber-400">
      {fmt(h)}:{fmt(m)}:{fmt(s)}
    </span>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
let globalPromoCache = null;

export function LandingNav({ promo: propPromo }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [promo, setPromo] = useState(propPromo || globalPromoCache);
  const location = useLocation();
  const isKursusPage = location.pathname.startsWith('/kursus');

  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (propPromo) {
      globalPromoCache = propPromo;
      setPromo(propPromo);
    } else if (!globalPromoCache) {
      axios
        .get('/api/landing/all')
        .then((res) => {
          if (res.data?.promo) {
            globalPromoCache = res.data.promo;
            setPromo(res.data.promo);
          }
        })
        .catch(() => {});
    } else {
      setPromo(globalPromoCache);
    }
  }, [propPromo]);

  const navLinks = [
    { href: isKursusPage ? '/#program' : '#program', label: 'Program', isAnchor: !isKursusPage },
    { href: isKursusPage ? '/#fasilitas' : '#fasilitas', label: 'Fasilitas', isAnchor: !isKursusPage },
    { href: '/kursus', label: 'Kursus', isRoute: true },
    { href: isKursusPage ? '/#testimoni' : '#testimoni', label: 'Testimoni', isAnchor: !isKursusPage },
    { href: isKursusPage ? '/#faq' : '#faq', label: 'FAQ', isAnchor: !isKursusPage },
    { href: isKursusPage ? '/#about' : '#about', label: 'Tentang', isAnchor: !isKursusPage },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur shadow-sm border-b border-slate-200 dark:border-slate-800'
          : 'bg-transparent'
      }`}
    >
      {/* Promo bar */}
      {promo && promo.is_active && (
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-center py-2 text-xs font-semibold flex items-center justify-center gap-3">
          <span>{promo.text}</span>
          {promo.countdown_seconds > 0 && <PromoCountdown seconds={promo.countdown_seconds} />}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Logo href="/" size="lg" />

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map((item) => {
            const isActive = item.isRoute && location.pathname === item.href;
            if (item.isRoute) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-base transition-all ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 rounded-lg text-base font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {item.label}
              </a>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {token ? (
            <Link to="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Masuk</Button>
              </Link>
              <Link to="/daftar">
                <Button size="sm">Daftar Sekarang</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-slate-700 dark:text-slate-300 text-xl">☰</button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col gap-2">
          {navLinks.map((item) => {
            if (item.isRoute) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`py-2 text-base font-semibold ${
                    location.pathname === item.href
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-slate-700 dark:text-slate-300 text-base font-semibold"
              >
                {item.label}
              </a>
            );
          })}
          <div className="flex gap-3 pt-2 items-center">
            <ThemeToggle />
            {token ? (
              <Link to="/dashboard" className="flex-1"><Button className="w-full">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login" className="flex-1"><Button variant="ghost" className="w-full">Masuk</Button></Link>
                <Link to="/daftar" className="flex-1"><Button className="w-full">Daftar</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

const DEFAULT_FAQS = [
  {
    q: 'Apa itu SkorPluss Learning Center dan siapa saja yang bisa bergabung?',
    a: 'SkorPluss adalah platform bimbingan belajar dan konsultasi pendidikan terpadu yang dirancang untuk siswa SMP, SMA/SMK, hingga alumni (gap year) dalam mempersiapkan UTBK-SNBT, Seleksi Sekolah Kedinasan, Olimpiade, dan peningkatan prestasi akademik sekolah.',
  },
  {
    q: 'Bagaimana sistem penilaian Tryout CBT di SkorPluss?',
    a: 'Seluruh simulasi ujian Computer-Based Test (CBT) di SkorPluss telah menggunakan sistem penilaian berbasis Item Response Theory (IRT) dan pembobotan terbaru yang disesuaikan dengan standar seleksi nasional UTBK-SNBT maupun SKD Kedinasan, lengkap dengan pembahasan mendalam.',
  },
  {
    q: 'Apa perbedaan antara paket program belajar yang tersedia?',
    a: 'Setiap paket belajar memiliki cakupan kursus E-Learning, kuota simulasi ujian CBT, serta fasilitas pendampingan yang berbeda. Anda dapat mulai dari akses coba gratis, memilih paket reguler/intensif, hingga paket kemitraan sekolah sesuai kebutuhan target kelulusan Anda.',
  },
  {
    q: 'Apakah saya bisa bertanya langsung kepada tutor jika ada materi atau soal yang sulit?',
    a: 'Tentu saja! Melalui fasilitas Forum Tanya Jawab yang terintegrasi di dashboard, Anda dapat mendiskusikan soal maupun materi yang belum dipahami langsung bersama Master Tutor SkorPluss.',
  },
  {
    q: 'Apakah siswa mendapatkan sertifikat setelah menyelesaikan kelas E-Learning?',
    a: 'Ya, setiap siswa yang menyelesaikan seluruh modul materi, kuis evaluasi, dan tugas pada suatu kursus hingga mencapai progres 100% berhak mengunduh Sertifikat Kelulusan resmi berverifikasi dari SkorPluss Learning Center.',
  },
  {
    q: 'Bagaimana cara mendaftarkan sekolah sebagai Mitra Resmi SkorPluss?',
    a: 'Pihak sekolah dapat menghubungi tim kemitraan SkorPluss melalui kontak layanan kami untuk mendapatkan akun Admin Mitra Sekolah, kuota paket belajar kolektif siswa, serta dashboard pemantauan progres dan nilai tryout CBT seluruh siswa sekolah secara real-time.',
  },
];

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState({ app_name: 'SkorPluss', tagline: '' });
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const { token } = useSelector((s) => s.auth);

  const programsSliderRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (programsSliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = programsSliderRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  };

  const scrollPrograms = (dir) => {
    if (programsSliderRef.current) {
      const cardWidth = 360;
      programsSliderRef.current.scrollBy({ left: dir === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [data?.programs]);

  useEffect(() => {
    Promise.all([
      axios.get('/api/landing'),
      axios.get('/api/settings'),
      axios.get('/api/learning-packages')
    ])
      .then(([resLanding, resSettings, resPackages]) => {
        const landingData = resLanding.data;
        
        // Priority: Use Learning Packages from Manajemen Paket (/admin/learning-packages)
        const pkgs = (resPackages.data && resPackages.data.length > 0)
          ? resPackages.data
          : (landingData.learning_packages && landingData.learning_packages.length > 0)
            ? landingData.learning_packages
            : null;

        const colors = [
          'from-blue-600 to-violet-700',
          'from-emerald-600 to-teal-700',
          'from-amber-500 to-orange-700',
          'from-violet-600 to-pink-700',
          'from-indigo-600 to-cyan-700',
        ];
        const icons = ['🚀', '📖', '📚', '🏆', '🎯'];

        let programsData = [];

        if (pkgs && pkgs.length > 0) {
          programsData = pkgs.map((pkg, idx) => {
            const hasDiscount = pkg.discount_price && Number(pkg.discount_price) < Number(pkg.price);
            return {
              id: pkg.id,
              name: pkg.name,
              slug: pkg.slug || String(pkg.name).toLowerCase().replace(/\s+/g, '-'),
              icon: icons[idx % icons.length],
              color: colors[idx % colors.length],
              price: hasDiscount ? formatRupiah(pkg.discount_price) : formatRupiah(pkg.price),
              strike_price: hasDiscount ? formatRupiah(pkg.price) : null,
              price_period: '/paket',
              description: pkg.description,
              features: Array.isArray(pkg.features) ? pkg.features : (pkg.features ? JSON.parse(pkg.features) : []),
              is_popular: idx === 0,
              is_active: pkg.is_published,
              cbt_quota: pkg.cbt_quota,
              courses_count: pkg.courses?.length || 0,
              thumbnail: pkg.thumbnail,
              originalData: pkg,
              is_learning_package: true,
            };
          });
        } else if (landingData.programs && landingData.programs.length > 0) {
          programsData = landingData.programs.map((p) => ({
            ...p,
            slug: p.slug || String(p.name).toLowerCase().replace(/\s+/g, '-'),
            originalData: p,
          }));
        }
        
        setData({
          ...landingData,
          programs: programsData,
        });
        setSettings(resSettings.data);
        document.title = resSettings.data.app_name || 'SkorPluss';
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load landing data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Memuat...</p>
        </div>
      </div>
    );
  }

  const { hero, promo, stats, features, testimonials, programs } = data || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <LandingNav promo={promo} />

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden pt-28 md:pt-32 pb-14">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="relative max-w-7xl w-full mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-8">
            {/* Left Column: Hero Copy & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start gap-6">
              {hero?.badge_text && (
                <Badge color="blue" className="px-4 py-2 text-sm gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse inline-block" />
                  {hero.badge_text}
                </Badge>
              )}

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black leading-tight tracking-tight">
                {hero?.title || 'Raih Impian'}
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500 dark:from-blue-400 dark:via-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {hero?.subtitle || 'Bersama SkorPluss'}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {hero?.description || 'Persiapan komprehensif UTBK-SNBT, Kedinasan, dan Olimpiade.'}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to={token ? '/dashboard' : (hero?.cta_primary_link || '/daftar')}>
                  <Button size="xl" className="shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow">
                    {token ? '🚀 Buka Dashboard' : (hero?.cta_primary_text || '🚀 Mulai Belajar Gratis')}
                  </Button>
                </Link>
                <a href={hero?.cta_secondary_link || '#program'}>
                  <Button variant="ghost" size="xl">
                    {hero?.cta_secondary_text || 'Lihat Program →'}
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: SkorPluss Mascot (SPARK) */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              {/* Decorative Aura behind Mascot */}
              <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-blue-500/20 via-indigo-500/15 to-amber-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative group flex flex-col items-center">
                <img
                  src="/assets/Maskot_SKORPLUSS.png"
                  alt="Maskot SkorPluss SPARK"
                  className="w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[410px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(37,99,235,0.28)] transition-transform duration-500 group-hover:scale-[1.03] group-hover:-translate-y-1 select-none"
                />
              </div>
            </div>
          </div>

          {/* Full-width Stats Strip Below Hero & Mascot */}
          {stats && stats.length > 0 && (
            <div className="mt-12 lg:mt-14 pt-8 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
                {stats.map((s) => (
                  <div key={s.id} className="py-6 px-6 text-center flex flex-col items-center justify-center">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-1">
                      {s.value}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ──PROGRAMS ── */}
      {programs && programs.length > 0 && (
        <section id="program" className="pt-4 pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <Badge color="violet" className="mb-4">Program Belajar</Badge>
              <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3">Pilih Paket yang Tepat</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Semua paket sudah termasuk akses CBT, forum tutor, dan dashboard analitik. Upgrade kapan saja.</p>
            </div>

            <div className="relative group max-w-[1200px] mx-auto">
              {/* Left Arrow */}
              <button
                onClick={() => scrollPrograms('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-xl transition-all duration-200 ${!canScrollLeft ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 hover:scale-110 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:border-transparent cursor-pointer'}`}
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Slider Track */}
              <div 
                ref={programsSliderRef}
                onScroll={checkScroll}
                className="flex gap-6 overflow-x-auto scroll-smooth py-6 px-4 snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {programs.map((p) => {
                  const plainDescription = p.description
                    ? p.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim()
                    : '';

                  return (
                    <div
                      key={p.id}
                      className={`w-[300px] sm:w-[350px] shrink-0 snap-start relative bg-white dark:bg-slate-900 rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-1 group shadow-lg hover:shadow-2xl ${p.is_popular ? 'shadow-xl shadow-blue-500/15' : ''}`}
                    >
                      {p.is_popular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-600/40 whitespace-nowrap">
                            ⭐ PALING POPULER
                          </span>
                        </div>
                      )}

                      {/* Full-bleed Portrait Thumbnail */}
                      {p.thumbnail && (
                        <div className="w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-t-2xl relative overflow-hidden shrink-0">
                          <img
                            src={p.thumbnail}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      {/* Card Body with Padding */}
                      <div className="p-6 sm:p-7 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-3xl">{p.icon}</div>
                            {p.cbt_quota && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                CBT {p.cbt_quota === 999 ? 'Unlimited' : p.cbt_quota + 'x'}
                              </span>
                            )}
                          </div>
                          <div className="font-black text-xl text-slate-900 dark:text-slate-100 mb-1">{p.name}</div>
                          {plainDescription && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{plainDescription}</p>
                          )}
                          <div className="flex items-baseline gap-2 mb-5">
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{p.price}</span>
                            <span className="text-slate-500 text-sm whitespace-nowrap">{p.price_period}</span>
                            {p.strike_price && (
                              <span className="text-sm text-slate-400 line-through whitespace-nowrap">{p.strike_price}</span>
                            )}
                          </div>
                          <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                            {(p.features || []).map((f, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                                <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                                {f}
                              </li>
                            ))}
                            {p.courses_count > 0 && (
                              <li className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                                <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                                {p.courses_count} Kursus SMA & SNBT
                              </li>
                            )}
                          </ul>
                          <div className="space-y-2 mt-auto">
                            <Link to={`/program/${p.slug || p.id}`} className="block">
                              <button className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                <span>Lihat Detail Program & Silabus</span>
                                <span>→</span>
                              </button>
                            </Link>
                            <Link to={token ? `/program/${p.slug || p.id}` : `/daftar?program=${p.slug || p.id}`} className="block">
                              <Button 
                                variant={p.is_popular ? 'primary' : 'ghost'} 
                                className="w-full"
                              >
                                Pilih {p.name}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                  );
                })}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => scrollPrograms('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-xl transition-all duration-200 ${!canScrollRight ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 hover:scale-110 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:border-transparent cursor-pointer'}`}
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots indicator & Hint */}
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex items-center justify-center gap-2">
                  {programs.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (programsSliderRef.current) {
                          const scrollAmount = programsSliderRef.current.clientWidth > 768 ? 380 : 320;
                          programsSliderRef.current.scrollTo({
                            left: idx * scrollAmount,
                            behavior: 'smooth',
                          });
                        }
                      }}
                      aria-label={`Lihat ${p.name}`}
                      className="h-2 rounded-full transition-all duration-300 bg-slate-300 dark:bg-slate-700 hover:bg-blue-500 w-2.5 hover:w-6 cursor-pointer"
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 md:hidden">
                  <span>←</span> Geser ke samping untuk paket lainnya <span>→</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FASILITAS (FEATURES) ── */}
      {features && features.length > 0 && (
        <section id="fasilitas" className="py-24 px-6 bg-white dark:bg-slate-900/30 scroll-mt-20">
          <div id="fitur" className="sr-only" />
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <Badge color="emerald" className="mb-4">Fasilitas Unggulan</Badge>
              <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3">Fasilitas & Teknologi Belajar Terdepan</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Setiap fasilitas dirancang untuk memaksimalkan hasil belajar dan meningkatkan peluang masuk PTN impian.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div key={f.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-700 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-500/10 flex items-center justify-center text-2xl mb-4 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {testimonials && testimonials.length > 0 && (
        <section id="testimoni" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <Badge color="gold" className="mb-4">Testimoni Siswa</Badge>
              <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3">Kisah Sukses Mereka</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Ribuan siswa telah membuktikan efektivitas SkorPluss dalam meraih PTN & sekolah kedinasan impian.</p>
            </div>

            <div className="flex overflow-hidden relative w-full group mask-image-fade">
              <div className="flex gap-5 animate-marquee shrink-0 pr-5 hover:[animation-play-state:paused]">
                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="w-[350px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left"
                  >
                    {/* Header: User Avatar, Name, School & Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {t.avatar ? (
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatar_color || 'from-blue-500 to-indigo-600'} flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs`}
                          >
                            {t.avatar_text || 'SP'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {t.school}
                          </p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400 text-xs shrink-0 pt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= (t.rating || 5) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Acceptance & Score Badges (if available) */}
                    {(t.university || t.score) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.university && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded">
                            <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="truncate max-w-[180px]">Diterima di <strong>{t.university}</strong></span>
                          </span>
                        )}
                        {t.score && (
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded shrink-0">
                            UTBK: {t.score}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Testimonial Quote / Comment */}
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic line-clamp-3">
                        "{t.comment || t.content || 'Pembelajaran di SkorPluss sangat terstruktur dan membantu saya memahami materi dengan cepat.'}"
                      </p>
                    </div>

                    {/* Footer: Target Context (Course / Program / PTN) */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 text-[11px] truncate max-w-[210px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">
                          {t.target_title ? `${t.target_type || 'Ulasan'}: ${t.target_title}` : (t.university || 'Siswa SkorPluss')}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {t.date_formatted || 'Terverifikasi'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-5 animate-marquee shrink-0 pr-5 hover:[animation-play-state:paused]" aria-hidden="true">
                {testimonials.map((t) => (
                  <div
                    key={`${t.id}-dup`}
                    className="w-[350px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left"
                  >
                    {/* Header: User Avatar, Name, School & Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {t.avatar ? (
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatar_color || 'from-blue-500 to-indigo-600'} flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs`}
                          >
                            {t.avatar_text || 'SP'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {t.school}
                          </p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400 text-xs shrink-0 pt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= (t.rating || 5) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Acceptance & Score Badges (if available) */}
                    {(t.university || t.score) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.university && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded">
                            <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="truncate max-w-[180px]">Diterima di <strong>{t.university}</strong></span>
                          </span>
                        )}
                        {t.score && (
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded shrink-0">
                            UTBK: {t.score}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Testimonial Quote / Comment */}
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic line-clamp-3">
                        "{t.comment || t.content || 'Pembelajaran di SkorPluss sangat terstruktur dan membantu saya memahami materi dengan cepat.'}"
                      </p>
                    </div>

                    {/* Footer: Target Context (Course / Program / PTN) */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 text-[11px] truncate max-w-[210px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">
                          {t.target_title ? `${t.target_type || 'Ulasan'}: ${t.target_title}` : (t.university || 'Siswa SkorPluss')}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {t.date_formatted || 'Terverifikasi'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ / TANYA JAWAB (COLLAPSIBLE) ── */}
      <section id="faq" className="py-24 px-6 bg-white dark:bg-slate-900/30 border-t border-slate-200/60 dark:border-slate-800/60 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Badge color="blue" className="mb-4">FAQ · Tanya Jawab</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 mb-3">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Temukan jawaban cepat seputar program bimbingan, fasilitas belajar, simulasi CBT, hingga kemitraan sekolah di SkorPluss.
            </p>
          </div>

          <div className="space-y-3.5">
            {(data?.faqs && data.faqs.length > 0 ? data.faqs : DEFAULT_FAQS).map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              const question = item.question || item.q;
              const answer = item.answer || item.a;

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-white dark:bg-slate-900 border-blue-500/50 dark:border-blue-500/50 shadow-md shadow-blue-500/5'
                      : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <span className={`font-bold text-base sm:text-lg transition-colors ${
                      isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {question}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isOpen
                          ? 'bg-blue-600 text-white rotate-180'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-0 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                      <div className="pt-3.5">{answer}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-indigo-600/20 border border-blue-500/20 rounded-md p-10 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-3">Siap Raih PTN Impian?</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
                Bergabung dengan 12.400+ siswa yang telah membuktikan efektivitas SkorPluss. Daftar sekarang dan dapatkan akses 7 hari gratis.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {token ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="shadow-xl shadow-blue-500/30">
                      Buka Dashboard Anda
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/daftar">
                      <Button size="lg" className="shadow-xl shadow-blue-500/30">
                        🚀 Daftar Sekarang — Gratis 7 Hari
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="ghost" size="lg">Sudah punya akun? Masuk →</Button>
                    </Link>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-6">📞 CS: 0812-3456-7890 · Senin–Sabtu 08.00–21.00 WIB</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} SkorPluss Learning Center. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Kontak</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
