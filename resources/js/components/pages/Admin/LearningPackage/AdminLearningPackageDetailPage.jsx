import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import FormField from '../../../molecules/FormField';
import Input from '../../../atoms/Input';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatRupiah } from '../../../../utils/currencyHelper';

export default function AdminLearningPackageDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCourseIds, setExpandedCourseIds] = useState({});

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/learning-packages/${id}`);
      setPackageData(res.data);
      // Auto expand first course if available
      if (res.data?.courses?.length > 0) {
        setExpandedCourseIds({ [res.data.courses[0].id]: true });
      }
    } catch (err) {
      toast.error('Gagal memuat detail paket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackageDetail();
  }, [id]);

  const toggleCourseExpand = (courseId) => {
    setExpandedCourseIds((prev) => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const deletePackage = async () => {
    if (confirm('Yakin ingin menghapus paket ini?')) {
      try {
        await api.delete(`/admin/learning-packages/${id}`);
        toast.success('Paket berhasil dihapus');
        navigate('/admin/learning-packages');
      } catch (err) {
        toast.error('Gagal menghapus paket');
      }
    }
  };

  // Helper stats
  const totalCourses = packageData?.courses?.length || 0;
  const totalModules = packageData?.courses?.reduce((acc, c) => acc + (c.modules?.length || 0), 0) || 0;
  const totalLessons = packageData?.courses?.reduce((acc, c) => {
    return acc + (c.modules?.reduce((mAcc, m) => mAcc + (m.lessons?.length || 0), 0) || 0);
  }, 0) || 0;
  const totalDurationSeconds = packageData?.courses?.reduce((acc, c) => {
    return acc + (c.modules?.reduce((mAcc, m) => {
      return mAcc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.duration_seconds || 0), 0) || 0);
    }, 0) || 0);
  }, 0) || 0;

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0 Menit';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours} Jam ${minutes} Menit`;
    if (hours > 0) return `${hours} Jam`;
    return `${minutes} Menit`;
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return ['fas', 'circle-play'];
      case 'quiz':
        return ['fas', 'clipboard-question'];
      case 'reading':
        return ['fas', 'book-open'];
      default:
        return ['fas', 'file-lines'];
    }
  };

  return (
    <AppLayout title={packageData?.name ? `Detil: ${packageData.name}` : 'Detil Paket Belajar'}>
      <div className="w-full pb-16 space-y-6">
        {/* Top Bar / Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/learning-packages')}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm cursor-pointer"
              title="Kembali ke Daftar Paket"
            >
              <FontAwesomeIcon icon={['fas', 'arrow-left']} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Link to="/admin/learning-packages" className="hover:text-blue-600 hover:underline">
                  Kelola Program/Paket
                </Link>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Detil Paket</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {packageData?.name || 'Memuat Paket Belajar...'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/admin/learning-packages/${id}/edit`)}
              disabled={loading || !packageData}
              className="border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="mr-1.5" /> Edit Paket Belajar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deletePackage}
              disabled={loading || !packageData}
              className="border-slate-300 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <FontAwesomeIcon icon={['fas', 'trash-can']} className="mr-1.5" /> Hapus
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !packageData ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
            <FontAwesomeIcon icon={['fas', 'box-open']} className="text-4xl text-slate-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Paket Tidak Ditemukan</h3>
            <p className="text-sm text-slate-500 mb-4">Paket belajar yang Anda cari mungkin sudah dihapus atau tidak tersedia.</p>
            <Button onClick={() => navigate('/admin/learning-packages')}>Kembali ke Daftar</Button>
          </div>
        ) : (
          <>
            {/* Header Hero Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Thumbnail */}
                <div className="md:col-span-4 lg:col-span-3">
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative shadow-inner">
                    {packageData.thumbnail ? (
                      <img
                        src={packageData.thumbnail}
                        alt={packageData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900">
                        <FontAwesomeIcon icon={['fas', 'graduation-cap']} className="text-4xl text-blue-400" />
                        <span className="text-xs font-medium">Tanpa Thumbnail</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info and Pricing */}
                <div className="md:col-span-8 lg:col-span-9 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {packageData.is_published ? (
                      <Badge color="emerald" className="px-3 py-1">
                        <FontAwesomeIcon icon={['fas', 'circle-check']} className="mr-1" /> Published
                      </Badge>
                    ) : (
                      <Badge color="slate" className="px-3 py-1">
                        <FontAwesomeIcon icon={['fas', 'eye-slash']} className="mr-1" /> Draft (Belum Tayang)
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400">
                      ID Paket: #{packageData.id} • Slug: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">{packageData.slug}</code>
                    </span>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">
                      {packageData.name}
                    </h1>
                    {packageData.description ? (
                      <div
                        className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: packageData.description }}
                      />
                    ) : (
                      <p className="text-slate-400 text-sm italic">
                        Tidak ada deskripsi untuk paket ini.
                      </p>
                    )}
                  </div>

                  {/* Pricing Box */}
                  <div className="flex flex-wrap items-baseline gap-3 pt-2">
                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                      {formatRupiah(packageData.price)}
                    </span>
                    {packageData.discount_price && (
                      <>
                        <span className="text-lg text-slate-400 line-through">
                          {formatRupiah(packageData.discount_price)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold">
                          Hemat {formatRupiah(packageData.discount_price - packageData.price)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Features List */}
                  {packageData.features && packageData.features.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Fitur & Fasilitas Paket
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {packageData.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs shrink-0">
                              <FontAwesomeIcon icon={['fas', 'check']} />
                            </span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shrink-0">
                  <FontAwesomeIcon icon={['fas', 'book-bookmark']} />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">{totalCourses}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Program / Kursus</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-11 h-11 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-lg shrink-0">
                  <FontAwesomeIcon icon={['fas', 'layer-group']} />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">{totalModules}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Total Modul / Bab</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                  <FontAwesomeIcon icon={['fas', 'list-check']} />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">{totalLessons}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Pelajaran & Kuis</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                  <FontAwesomeIcon icon={['fas', 'file-signature']} />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {packageData.cbt_quota ? `${packageData.cbt_quota}x Ujian` : 'Tak Terbatas'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Batas Sesi CBT</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
                  <FontAwesomeIcon icon={['fas', 'clock']} />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">{formatDuration(totalDurationSeconds)}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Estimasi Waktu</div>
                </div>
              </div>
            </div>

            {/* Courses / Program Breakdown Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Program & Kursus di Dalam Paket ({totalCourses})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Siswa yang membeli paket ini akan otomatis mendapatkan hak akses ke kursus-kursus berikut:
                  </p>
                </div>
                {totalCourses > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/learning-packages/${id}/edit`)}>
                    <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="mr-1" /> Kelola Kursus
                  </Button>
                )}
              </div>

              {totalCourses === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-2xl">
                    <FontAwesomeIcon icon={['fas', 'folder-open']} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Belum Ada Kursus Terhubung
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Paket ini belum menyertakan program atau kursus belajar. Klik tombol di bawah untuk memilih kursus dari e-learning.
                  </p>
                  <Button onClick={() => navigate(`/admin/learning-packages/${id}/edit`)} size="sm">
                    <FontAwesomeIcon icon={['fas', 'plus']} className="mr-1.5" /> Pilih Kursus Sekarang
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {packageData.courses.map((course, index) => {
                    const isExpanded = !!expandedCourseIds[course.id];
                    const courseLessonCount = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
                    const courseDuration = course.modules?.reduce((acc, m) => {
                      return acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.duration_seconds || 0), 0) || 0);
                    }, 0) || 0;

                    return (
                      <div
                        key={course.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
                      >
                        {/* Course Card Header */}
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                              {course.thumbnail ? (
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl">
                                  <FontAwesomeIcon icon={['fas', 'book']} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                                {course.category && (
                                  <Badge color="violet" size="sm">
                                    {course.category}
                                  </Badge>
                                )}
                                {course.has_certificate ? (
                                  <Badge color="gold" size="sm">
                                    <FontAwesomeIcon icon={['fas', 'certificate']} className="mr-1" /> Bersertifikat
                                  </Badge>
                                ) : null}
                                {course.rating && (
                                  <span className="inline-flex items-center text-xs font-semibold text-amber-500 gap-1">
                                    <FontAwesomeIcon icon={['fas', 'star']} /> {course.rating}
                                    {course.total_reviews ? <span className="text-slate-400">({course.total_reviews})</span> : null}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                {course.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                {course.instructor && (
                                  <span className="flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={['fas', 'user-tie']} className="text-slate-400" />
                                    <strong className="text-slate-700 dark:text-slate-300">{course.instructor.name}</strong>
                                    {course.instructor.school && <span>({course.instructor.school})</span>}
                                  </span>
                                )}
                                <span>•</span>
                                <span>{course.modules?.length || 0} Bab</span>
                                <span>•</span>
                                <span>{courseLessonCount} Pelajaran</span>
                                {courseDuration > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{formatDuration(courseDuration)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Link
                              to={`/admin/elearning/courses/${course.id}/curriculum`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              <FontAwesomeIcon icon={['fas', 'gear']} /> Edit Silabus
                            </Link>
                            <button
                              onClick={() => toggleCourseExpand(course.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <span>{isExpanded ? 'Tutup Silabus' : 'Buka Silabus'}</span>
                              <FontAwesomeIcon icon={['fas', isExpanded ? 'chevron-up' : 'chevron-down']} />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Curriculum Tree */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Struktur Modul & Materi Kursus
                            </div>

                            {(!course.modules || course.modules.length === 0) ? (
                              <div className="text-xs text-slate-400 italic p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                Belum ada bab atau materi yang ditambahkan ke kursus ini.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {course.modules.map((module, mIdx) => (
                                  <div
                                    key={module.id}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                                  >
                                    <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                          {mIdx + 1}
                                        </span>
                                        <span>{module.title}</span>
                                      </div>
                                      <span className="text-xs font-normal text-slate-500">
                                        {module.lessons?.length || 0} materi
                                      </span>
                                    </div>

                                    {(!module.lessons || module.lessons.length === 0) ? (
                                      <div className="p-3 text-xs text-slate-400 italic">
                                        Tidak ada materi dalam bab ini.
                                      </div>
                                    ) : (
                                      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {module.lessons.map((lesson, lIdx) => (
                                          <div
                                            key={lesson.id}
                                            className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                                          >
                                            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                                              <FontAwesomeIcon
                                                icon={getLessonTypeIcon(lesson.type)}
                                                className={`text-xs ${lesson.type === 'video' ? 'text-blue-500' : lesson.type === 'quiz' ? 'text-amber-500' : 'text-emerald-500'}`}
                                              />
                                              <span className="font-medium">{lesson.title}</span>
                                              {lesson.is_preview ? (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                                                  Gratis Preview
                                                </span>
                                              ) : null}
                                            </div>

                                            <div className="flex items-center gap-3 text-slate-400 text-xs">
                                              <span className="capitalize">{lesson.type}</span>
                                              {lesson.duration_seconds > 0 && (
                                                <span>{formatDuration(lesson.duration_seconds)}</span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
