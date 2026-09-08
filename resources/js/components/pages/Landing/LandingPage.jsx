import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Logo from '../../atoms/Logo';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';
import ThemeToggle from '../../atoms/ThemeToggle';
import { formatRupiah } from '../../../utils/currencyHelper';
import PackageDetailModal from '../../molecules/PackageDetailModal';

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
function LandingNav({ promo }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-50 dark:bg-slate-950/95 backdrop-blur shadow-lg shadow-black/20 border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'}`}>
      {/* Promo bar */}
      {promo && promo.is_active && (
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-center py-2 text-xs font-semibold flex items-center justify-center gap-3">
          <span>{promo.text}</span>
          {promo.countdown_seconds > 0 && <PromoCountdown seconds={promo.countdown_seconds} />}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo href="/" />

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {[['#program', 'Program'], ['#fitur', 'Fitur'], ['#testimoni', 'Testimoni'], ['#about', 'Tentang']].map(([href, label]) => (
            <a key={href} href={href} className="px-4 py-2 rounded-md text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              {label}
            </a>
          ))}
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
          {[['#program', 'Program'], ['#fitur', 'Fitur'], ['#testimoni', 'Testimoni']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)} className="py-2 text-slate-700 dark:text-slate-300 text-sm">{label}</a>
          ))}
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

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState({ app_name: 'SkorPluss', tagline: '' });
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    Promise.all([
      axios.get('/api/landing'),
      axios.get('/api/settings'),
      axios.get('/api/learning-packages')
    ])
      .then(([resLanding, resSettings, resPackages]) => {
        const landingData = resLanding.data;
        
        // Transform learning_packages to programs format
        const packagesData = (resPackages.data || []).map((pkg, idx) => ({
          id: pkg.id,
          name: pkg.name,
          icon: idx === 1 ? '🚀' : idx === 2 ? '🏆' : '📚',
          color: idx === 1 ? 'from-blue-700 to-violet-700' : idx === 2 ? 'from-yellow-500 to-orange-600' : 'from-slate-700 to-slate-800',
          price: formatRupiah(pkg.price),
          price_period: '/paket',
          features: pkg.features || [],
          is_popular: idx === 1,
          is_active: pkg.is_published,
          originalData: pkg
        }));
        
        setData({
          ...landingData,
          programs: packagesData
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
      <section className="relative flex flex-col items-center justify-center overflow-hidden pt-32 pb-10">
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

        <div className="relative max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-8">
          {hero?.badge_text && (
            <Badge color="blue" className="px-4 py-2 text-sm gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse inline-block" />
              {hero.badge_text}
            </Badge>
          )}

          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
            {hero?.title || 'Raih Impian'}
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {hero?.subtitle || 'Bersama SkorPluss'}
            </span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {hero?.description || 'Persiapan komprehensif UTBK-SNBT, Kedinasan, dan Olimpiade.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
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

          {/* Stats strip */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 w-full max-w-3xl">
              {stats.map((s) => (
                <div key={s.id} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center hover:border-slate-700 transition-colors">
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-0.5">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
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

            <div className="grid md:grid-cols-3 gap-6">
              {programs.map((p) => (
                <div
                  key={p.id}
                  className={`relative bg-gradient-to-b ${p.color} rounded-md p-[1px] ${p.is_popular ? 'scale-105 shadow-2xl shadow-blue-500/20' : ''}`}
                >
                  {p.is_popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/40">
                        ⭐ PALING POPULER
                      </span>
                    </div>
                  )}
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-md p-7 h-full flex flex-col">
                    <div className="text-3xl mb-3">{p.icon}</div>
                    <div className="font-black text-xl text-slate-900 dark:text-slate-100 mb-1">{p.name}</div>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{p.price}</span>
                      <span className="text-slate-500 text-sm">{p.price_period}</span>
                    </div>
                    <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                      {(p.features || []).map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                          <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                      <Button 
                        variant={p.is_popular ? 'primary' : 'ghost'} 
                        className="w-full"
                        onClick={() => setSelectedPackage(p.originalData)}
                      >
                        Pilih {p.name}
                      </Button>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      {features && features.length > 0 && (
        <section id="fitur" className="py-24 px-6 bg-white dark:bg-slate-900/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <Badge color="emerald" className="mb-4">Fitur Unggulan</Badge>
              <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3">Teknologi Belajar Terdepan</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Setiap fitur dirancang untuk memaksimalkan hasil belajar dan meningkatkan peluang masuk PTN impian.</p>
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
                  <div key={t.id} className="w-[300px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatar_color} flex items-center justify-center font-bold text-white text-sm`}>
                        {t.avatar_text}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.school}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Badge color="emerald" className="mb-2 text-xs">✓ Diterima di</Badge>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.university}</p>
                    </div>
                    {t.score && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-500">Skor UTBK</span>
                        <span className="font-black text-blue-400">{t.score}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-5 animate-marquee shrink-0 pr-5 hover:[animation-play-state:paused]" aria-hidden="true">
                {testimonials.map((t) => (
                  <div key={`${t.id}-dup`} className="w-[300px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatar_color} flex items-center justify-center font-bold text-white text-sm`}>
                        {t.avatar_text}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.school}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Badge color="emerald" className="mb-2 text-xs">✓ Diterima di</Badge>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.university}</p>
                    </div>
                    {t.score && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-500">Skor UTBK</span>
                        <span className="font-black text-blue-400">{t.score}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

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

      {/* Package Detail Modal */}
      {selectedPackage && (
        <PackageDetailModal pkg={selectedPackage} onClose={() => setSelectedPackage(null)} />
      )}
    </div>
  );
}
