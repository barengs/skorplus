import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LandingNav } from '../Landing/LandingPage';
import Logo from '../../atoms/Logo';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';

export default function ProgramDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token, user } = useSelector((s) => s.auth);

  const [program, setProgram] = useState(null);
  const [courses, setCourses] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses_path'); // 'courses_path' | 'strategic_roadmap'
  const [expandedModules, setExpandedModules] = useState({});
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleModuleAccordion = (key) => {
    setExpandedModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'reading':
        return '📖';
      case 'quiz':
        return '✍️';
      case 'assignment':
        return '📁';
      default:
        return '📄';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '10-15 mnt';
    const mins = Math.round(seconds / 60);
    return mins > 0 ? `${mins} mnt` : `${seconds} dtk`;
  };

  useEffect(() => {
    fetchProgramDetail();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchProgramDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/programs/${slug}`);
      const data = res.data;
      setProgram(data.program);
      setCourses(data.courses || []);
      setAllPrograms(data.all_programs || []);
    } catch (err) {
      console.error('Failed to load program detail:', err);
      toast.error('Gagal memuat detail program');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Apakah saya bisa mengganti atau upgrade program belajar di tengah jalan?',
      a: 'Ya, Anda dapat melakukan upgrade ke program yang lebih tinggi kapan saja melalui dashboard siswa dengan menyesuaikan selisih biaya langganan.',
    },
    {
      q: 'Bagaimana cara mengakses kursus dan materi setelah mendaftar?',
      a: 'Setelah akun aktif dan terdaftar pada program, seluruh kursus yang termasuk dalam program ini akan otomatis terbuka di menu E-Learning dashboard Anda.',
    },
    {
      q: 'Apakah ada pendampingan dari tutor jika saya mengalami kesulitan soal?',
      a: 'Tentu! Siswa memiliki akses ke Forum Diskusi Tanya Tutor 24/7 dan sesi live streaming mingguan untuk program Intensif serta sesi privat 1-on-1 untuk program Garansi.',
    },
    {
      q: 'Bagaimana mekanisme simulasi CBT berstandar IRT?',
      a: 'Simulasi CBT di SkorPluss menggunakan sistem Item Response Theory (IRT) yang persis dengan standar resmi seleksi SNPMB, sehingga estimasi skor Anda sangat akurat.',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
        <LandingNav />
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat detail program & learning path...</p>
        </div>
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
          SkorPluss Learning Center
        </footer>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
        <LandingNav />
        <div className="max-w-md mx-auto py-40 text-center px-6">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold">Program Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-2">Program belajar yang Anda tuju tidak ditemukan.</p>
          <Link to="/#program" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm">
            Kembali ke Pilihan Program
          </Link>
        </div>
      </div>
    );
  }

  const learningPath = program.learning_path || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* ── Top Navbar ── */}
      <LandingNav />

      {/* ── Hero Header ── */}
      <section className="pt-28 pb-16 px-6 bg-slate-900 text-white relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <span>›</span>
            <Link to="/#program" className="hover:text-white transition-colors">Program Belajar</Link>
            <span>›</span>
            <span className="text-blue-400 font-semibold">{program.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            <div className="lg:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl p-2 bg-slate-800 rounded-2xl border border-slate-700">
                  {program.icon || '🚀'}
                </span>
                {program.is_popular && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-500 text-white shadow-lg shadow-blue-500/40">
                    ⭐ PALING POPULER & DIREKOMENDASIKAN
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Bimbel Persiapan UTBK & Skill
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Program {program.name} SkorPluss
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Alur belajar komprehensif yang dirancang secara saintifik untuk membantu Anda menguasai seluruh materi seleksi PTN dan talenta digital dengan efisien, terukur, dan didampingi mentor ahli.
              </p>

              <div className="flex flex-wrap items-baseline gap-2 pt-2">
                <span className="text-3xl sm:text-4xl font-black text-white">{program.price}</span>
                <span className="text-slate-400 text-sm">{program.price_period || '/bulan'}</span>
                <span className="ml-3 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Akses Penuh Semua Fasilitas
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                {token ? (
                  <Link
                    to="/dashboard"
                    className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 transition-all"
                  >
                    Buka Dashboard Siswa →
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/daftar"
                      className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 transition-all"
                    >
                      🚀 Daftar Program Sekarang
                    </Link>
                    <a
                      href="https://wa.me/6281234567890?text=Halo%20SkorPluss,%20saya%20ingin%20konsultasi%20mengenai%20Program"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center gap-2"
                    >
                      <span>💬 Konsultasi via WhatsApp</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="lg:col-span-1 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Ringkasan Fasilitas Program
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                {(program.features || []).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                <span>Garansi Kualitas</span>
                <span className="font-semibold text-white">100% Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <main className="max-w-7xl mx-auto px-6 py-16 space-y-20">
        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: LEARNING PATH (ALUR BELAJAR BERBASIS MATERI NYATA)
            ══════════════════════════════════════════════════════════════════ */}
        <section className="relative">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 mb-3">
              🧭 Alur Pembelajaran Nyata
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Learning Path: Urutan Materi & Silabus Belajar
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              Alur kurikulum materi terstruktur dari materi dasar, latihan konsep, kuis pemahaman, hingga tugas terapan yang disusun secara bertahap sesuai urutan pembelajaran.
            </p>

            {/* Toggle Tabs */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setActiveTab('courses_path')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'courses_path'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                📚 Alur Materi Kursus & Silabus ({learningPath.length} Langkah)
              </button>
              {(program.strategic_roadmap || []).length > 0 && (
                <button
                  onClick={() => setActiveTab('strategic_roadmap')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'strategic_roadmap'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  🎯 Roadmap Strategi Bimbingan
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: ALUR MATERI KURSUS & SILABUS NYATA */}
          {activeTab === 'courses_path' && (
            <div className="relative border-l-2 border-blue-500/30 dark:border-blue-500/20 ml-4 md:ml-24 space-y-12">
              {learningPath.map((step, idx) => (
                <div key={idx} className="relative pl-8 md:pl-10 group">
                  {/* Timeline Marker Circle */}
                  <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-4 border-blue-600 flex items-center justify-center font-black text-xs text-blue-600 dark:text-blue-400 shadow-md group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>

                  {/* Step Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900/60 transition-all">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          {step.phase || `Langkah ${idx + 1}`}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          ⏱️ {step.duration}
                        </span>
                        {step.total_modules && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            📖 {step.total_modules} Bab Modul • {step.total_lessons} Pelajaran
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {step.badge}
                      </span>
                    </div>

                    {/* Course Overview Card */}
                    <div className="flex flex-col md:flex-row gap-5 items-start mb-6">
                      {step.thumbnail && (
                        <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800">
                          <img
                            src={step.thumbnail}
                            alt={step.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                          {step.title}
                        </h3>
                        {step.instructor && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Instruktur / Tutor: <span className="font-semibold text-slate-700 dark:text-slate-300">{step.instructor}</span>
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Rangkaian Modul & Silabus Materi Nyata */}
                    {step.modules && step.modules.length > 0 ? (
                      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span>📋</span> Silabus Bab & Rangkaian Materi:
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Klik bab untuk melihat rincian pelajaran
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {step.modules.map((mod, modIdx) => {
                            const modKey = `${idx}-${mod.id || modIdx}`;
                            const isExpanded = expandedModules[modKey] ?? (modIdx === 0);

                            return (
                              <div
                                key={mod.id || modIdx}
                                className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40"
                              >
                                {/* Module Header Button */}
                                <button
                                  type="button"
                                  onClick={() => toggleModuleAccordion(modKey)}
                                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                                      {modIdx + 1}
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {mod.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                      {mod.lessons ? mod.lessons.length : (mod.lessons_count || 0)} Materi
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                      {isExpanded ? '▲' : '▼'}
                                    </span>
                                  </div>
                                </button>

                                {/* Expanded Lessons List */}
                                {isExpanded && mod.lessons && mod.lessons.length > 0 && (
                                  <div className="px-4 pb-3 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 bg-white/70 dark:bg-slate-900/70">
                                    {mod.lessons.map((lesson, lesIdx) => (
                                      <div
                                        key={lesson.id || lesIdx}
                                        className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                          <span className="text-base shrink-0">
                                            {getLessonIcon(lesson.type)}
                                          </span>
                                          <span className="truncate font-medium">
                                            {lesson.title}
                                          </span>
                                          {lesson.is_preview && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold shrink-0">
                                              Gratis Preview
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[11px]">
                                          <span className="capitalize font-mono">
                                            {lesson.type}
                                          </span>
                                          <span>•</span>
                                          <span>{formatDuration(lesson.duration_seconds)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      step.milestones && step.milestones.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Target Materi Pada Langkah Ini:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                            {step.milestones.map((m, mIdx) => (
                              <div key={mIdx} className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{m}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}

                    {/* Direct Syllabus CTA */}
                    {step.course_slug && (
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                        <Link
                          to={`/kursus/${step.course_slug}`}
                          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group/btn"
                        >
                          <span>Buka Halaman Silabus Lengkap Kursus Ini</span>
                          <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                        </Link>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Bagian dari {program.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 2: ROADMAP STRATEGI BIMBINGAN */}
          {activeTab === 'strategic_roadmap' && (
            <div className="relative border-l-2 border-blue-500/30 dark:border-blue-500/20 ml-4 md:ml-24 space-y-12">
              {(program.strategic_roadmap || []).map((step, idx) => (
                <div key={idx} className="relative pl-8 md:pl-10 group">
                  <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-4 border-blue-600 flex items-center justify-center font-black text-xs text-blue-600 dark:text-blue-400 shadow-md group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900/60 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          {step.phase}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          ⏱️ {step.duration}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        Target & Capaian Fase Ini:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        {(step.milestones || []).map((m, mIdx) => (
                          <div key={mIdx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: DAFTAR KURSUS DALAM PROGRAM INI
            ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Kurikulum Materi
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Kursus yang Termasuk dalam {program.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Seluruh materi di bawah ini dapat diakses penuh tanpa biaya tambahan oleh siswa program ini.
              </p>
            </div>

            <Link
              to="/kursus"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline self-start sm:self-auto"
            >
              Lihat Semua Katalog Kursus →
            </Link>
          </div>

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => navigate(`/kursus/${course.slug}`)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                >
                  <div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3.5">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-blue-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {course.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      Tutor: {course.display_instructor}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500">
                      <span className="text-amber-500 font-bold">★ {course.rating || '4,8'}</span>
                      <span>•</span>
                      <span>{course.total_reviews || 25} ulasan</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                      Buka Silabus Kursus →
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Gratis di {program.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl p-6">
              <p className="text-sm text-slate-500">
                Materi kursus untuk program ini dapat dilihat pada{' '}
                <Link to="/kursus" className="text-blue-600 font-semibold underline">
                  Katalog Kursus
                </Link>.
              </p>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: PERBANDINGAN PROGRAM LAINNYA
            ══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pilihan Alternatif
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Bandingkan dengan Program Lain
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Temukan tingkat bimbingan yang paling ideal untuk ritme dan target belajar Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allPrograms.map((p) => {
              const isCurrent = p.slug === program.slug;
              return (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{p.icon || '📚'}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                          Sedang Dilihat
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      Program {p.name}
                    </h3>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {p.price} <span className="text-xs font-normal text-slate-400">{p.price_period}</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                      {(p.features || []).slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                    {isCurrent ? (
                      <Link
                        to="/daftar"
                        className="w-full py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white text-center block hover:bg-blue-700 transition-colors"
                      >
                        Pilih Program Ini
                      </Link>
                    ) : (
                      <Link
                        to={`/program/${p.slug}`}
                        className="w-full py-2.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-center block hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Lihat Detail Program →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4: FAQ (PERTANYAAN UMUM)
            ══════════════════════════════════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Informasi lengkap seputar mekanisme belajar dan fasilitas di SkorPluss.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
              >
                <button
                  onClick={() => toggleFaq(fIdx)}
                  className="w-full p-4 sm:px-6 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 text-base">{activeFaq === fIdx ? '−' : '+'}</span>
                </button>
                {activeFaq === fIdx && (
                  <div className="px-4 sm:px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5: BOTTOM CTA BANNER
            ══════════════════════════════════════════════════════════════════ */}
        <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-4xl">🎓</div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Siap Memulai Perjalanan Menuju Kampus Impian?
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Daftar sekarang dan dapatkan akses penuh ke learning path {program.name}, ribuan latihan soal CBT, dan bimbingan tutor profesional.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link
                to="/daftar"
                className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-blue-600 hover:bg-slate-100 shadow-lg transition-all"
              >
                🚀 Daftar Sekarang — Mulai Belajar
              </Link>
              <Link
                to="/kursus"
                className="px-5 py-3 rounded-xl font-semibold text-sm bg-blue-700/50 hover:bg-blue-700 text-white border border-white/20 transition-all"
              >
                Eksplorasi Katalog Kursus
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6 mt-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} SkorPluss Learning Center. Seluruh hak cipta dilindungi undang-undang.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/#program" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Program Belajar</Link>
            <Link to="/kursus" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Katalog Kursus</Link>
            <Link to="/#fitur" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Fitur</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
