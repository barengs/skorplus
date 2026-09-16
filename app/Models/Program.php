<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'features' => 'array',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['learning_path', 'strategic_roadmap'];

    public function courses()
    {
        return $this->hasMany(Course::class, 'program_id');
    }

    public function getLearningPathAttribute(): array
    {
        $courses = $this->relationLoaded('courses')
            ? $this->courses
            : $this->courses()
                ->where('is_active', true)
                ->with(['modules.lessons'])
                ->orderBy('sort_order')
                ->get();

        if ($courses->isNotEmpty()) {
            return $courses->values()->map(function ($course, $index) {
                $modules = $course->modules ?? collect();
                $totalLessons = $modules->sum(fn ($m) => $m->lessons ? $m->lessons->count() : 0);
                $totalSeconds = $modules->sum(fn ($m) => $m->lessons ? $m->lessons->sum('duration_seconds') : 0);
                $totalMinutes = round($totalSeconds / 60);

                $milestones = $modules->map(function ($m) {
                    $lCount = $m->lessons ? $m->lessons->count() : 0;

                    return $m->title.($lCount > 0 ? " ({$lCount} Pelajaran)" : '');
                })->values()->all();

                $detailedModules = $modules->map(function ($m) {
                    return [
                        'id' => $m->id,
                        'title' => $m->title,
                        'sort_order' => $m->sort_order,
                        'lessons_count' => $m->lessons ? $m->lessons->count() : 0,
                        'lessons' => ($m->lessons ?? collect())->map(function ($l) {
                            return [
                                'id' => $l->id,
                                'title' => $l->title,
                                'type' => $l->type,
                                'duration_seconds' => $l->duration_seconds,
                                'is_preview' => (bool) $l->is_preview,
                            ];
                        })->values()->all(),
                    ];
                })->values()->all();

                return [
                    'step_number' => $index + 1,
                    'phase' => 'Langkah '.($index + 1).' • '.($course->category ?: 'Materi Kursus'),
                    'title' => $course->title,
                    'course_id' => $course->id,
                    'course_slug' => $course->slug,
                    'category' => $course->category,
                    'instructor' => $course->display_instructor,
                    'thumbnail' => $course->thumbnail,
                    'description' => $course->description,
                    'duration' => $totalMinutes > 0 ? "~{$totalMinutes} Menit" : ($totalLessons > 0 ? "{$totalLessons} Materi" : 'Materi Terstruktur'),
                    'badge' => $course->is_popular ? 'Kursus Unggulan' : 'Materi Inti',
                    'total_modules' => $modules->count(),
                    'total_lessons' => $totalLessons,
                    'milestones' => $milestones,
                    'modules' => $detailedModules,
                ];
            })->all();
        }

        return $this->getStrategicRoadmapAttribute();
    }

    public function getStrategicRoadmapAttribute(): array
    {
        $slug = strtolower($this->slug ?? '');

        if ($slug === 'garansi') {
            return [
                [
                    'phase' => 'Fase 1',
                    'title' => 'Personal Profiling & Strategic Blueprint',
                    'duration' => 'Bulan 1',
                    'badge' => 'Fase Fondasi',
                    'description' => 'Sesi privat 1-on-1 bersama konselor senior untuk memetakan minat bakat, peluang prodi PTN impian, dan menyusun kurikulum belajar terpersonalisasi.',
                    'milestones' => [
                        'Diagnostic assessment komprehensif TPS & Literasi',
                        'Analisa minat bakat RIASEC & rasionalisasi prodi',
                        'Penyusunan target skor mingguan dan jadwal belajar privat',
                    ],
                ],
                [
                    'phase' => 'Fase 2',
                    'title' => 'Mentoring 1-on-1 & Akses Materi Eksklusif',
                    'duration' => 'Bulan 2 - 3',
                    'badge' => 'Fase Penguasaan',
                    'description' => '4x sesi bimbingan tatap muka privat setiap bulan, pembedahan materi level advance/olimpiade, dan trik pengerjaan soal super cepat.',
                    'milestones' => [
                        'Mentoring 1-on-1 tatap muka bersama tutor master alumni ITB/UI',
                        'Akses seluruh modul & video materi tanpa batas',
                        'Review tugas mingguan dan konsultasi soal tak terbatas',
                    ],
                ],
                [
                    'phase' => 'Fase 3',
                    'title' => 'Simulasi CBT Standar Tertinggi & Coaching Mental',
                    'duration' => 'Bulan 4 - 5',
                    'badge' => 'Fase Uji Coba',
                    'description' => 'Simulasi CBT berkala bersistem IRT persis SNPMB, evaluasi kelemahan spesifik per sub-tes, dan workshop ketahanan mental ujian.',
                    'milestones' => [
                        'Unlimited simulasi CBT dengan analitik IRT real-time',
                        'Coaching ketahanan mental ujian dan strategi manajemen waktu',
                        'Pembedahan soal tipe HOTS (Higher Order Thinking Skills)',
                    ],
                ],
                [
                    'phase' => 'Fase 4',
                    'title' => 'Rasionalisasi Final & Klaim Garansi Kelulusan',
                    'duration' => 'Bulan 6',
                    'badge' => 'Fase Kelulusan',
                    'description' => 'Finalisasi strategi pemilihan jurusan berdasarkan rekapitulasi data pendaftar nasional, gladi bersih ujian, dan komitmen garansi kelulusan PTN/Kedinasan.',
                    'milestones' => [
                        'Rasionalisasi final peluang lolos berdasarkan jutaan data historis',
                        'Simulasi gladi resik hari H ujian SNBT',
                        'Jaminan garansi pengembalian biaya sesuai syarat & ketentuan',
                    ],
                ],
            ];
        }

        if ($slug === 'intensif') {
            return [
                [
                    'phase' => 'Fase 1',
                    'title' => 'Pemetaan Kemampuan & Penetapan Target PTN',
                    'duration' => 'Bulan 1',
                    'badge' => 'Fase Diagnostik',
                    'description' => 'Mengikuti tes diagnostik awal untuk mengukur kemampuan dasar TPS dan literasi serta menentukan target skor PTN favorit.',
                    'milestones' => [
                        'Diagnostic Assessment Test seluruh sub-tes UTBK',
                        'Laporan analitik peta kekuatan & kelemahan materi',
                        'Workshop penetapan target dan orientasi belajar efektif',
                    ],
                ],
                [
                    'phase' => 'Fase 2',
                    'title' => 'Pendalaman Konsep & Live Streaming Tutor 3×/Minggu',
                    'duration' => 'Bulan 2 - 3',
                    'badge' => 'Fase Pemahaman',
                    'description' => 'Sesi live interaktif bersama tutor berpengalaman membahas tuntas materi esensial, konsep penalaran matematika, dan literasi kritis.',
                    'milestones' => [
                        'Live class 3x per minggu dengan rekaman tayang ulang',
                        'Akses ribuan materi video dan rangkuman intisari konsep',
                        'Tanya tutor via forum dan pembahasan tugas bertahap',
                    ],
                ],
                [
                    'phase' => 'Fase 3',
                    'title' => 'Drill Soal Harian & Unlimited CBT Simulasi',
                    'duration' => 'Bulan 4 - 5',
                    'badge' => 'Fase Latihan Intensif',
                    'description' => 'Latihan ratusan soal setiap hari dan simulasi ujian CBT berkala dengan sistem pembobotan IRT untuk mengasah kecepatan pengerjaan.',
                    'milestones' => [
                        'Akses simulasi CBT tak terbatas bersistem IRT',
                        'Bank soal update tahun terbaru dengan kunci jawaban analitis',
                        'Leaderboard dan pemeringkatan nasional berkala',
                    ],
                ],
                [
                    'phase' => 'Fase 4',
                    'title' => 'Tryout Akbar Nasional & Konsultasi Jurusan',
                    'duration' => 'Bulan 6',
                    'badge' => 'Fase Kesiapan Ujian',
                    'description' => 'Mengikuti rangkaian Tryout Akbar berskala nasional dan konsultasi rasionalisasi nilai dengan tim konselor SkorPluss.',
                    'milestones' => [
                        'Tryout Akbar Nasional berhadiah dan bersertifikat',
                        'Sesi konsultasi strategi pemilihan pilihan 1 dan pilihan 2 PTN',
                        'Review akhir rumus dan tips sukses hari H ujian',
                    ],
                ],
            ];
        }

        // Default / Mandiri
        return [
            [
                'phase' => 'Fase 1',
                'title' => 'Orientasi Mandiri & Asesmen Awal',
                'duration' => 'Minggu 1 - 2',
                'badge' => 'Fase Awal',
                'description' => 'Pengenalan format soal UTBK SNBT, asesmen mandiri, dan penyusunan target belajar individu.',
                'milestones' => [
                    'Uji coba asesmen mandiri di platform',
                    'Download silabus dan panduan materi belajar',
                    'Penyusunan jadwal belajar fleksibel',
                ],
            ],
            [
                'phase' => 'Fase 2',
                'title' => 'Eksplorasi Modul & Video Pembelajaran',
                'duration' => 'Bulan 1 - 3',
                'badge' => 'Fase Belajar Mandiri',
                'description' => 'Mempelajari modul mandiri, menonton video pembelajaran konsep dasar, dan menyelesaikan latihan soal per topik.',
                'milestones' => [
                    'Akses video modul TPS & Literasi',
                    'Pengerjaan kuis pemahaman di setiap modul',
                    '10 kuota tanya soal di forum tutor per bulan',
                ],
            ],
            [
                'phase' => 'Fase 3',
                'title' => 'Simulasi CBT Berkala (5×/Bulan)',
                'duration' => 'Bulan 4 - 5',
                'badge' => 'Fase Simulasi',
                'description' => 'Mengukur peningkatan skor melalui 5 sesi simulasi ujian CBT per bulan dengan analitik hasil otomatis.',
                'milestones' => [
                    '5x kuota simulasi CBT setiap bulan',
                    'Analisis skor per sub-tes secara mandiri',
                    'Pembahasan kunci jawaban lengkap',
                ],
            ],
            [
                'phase' => 'Fase 4',
                'title' => 'Review Progres & Kesiapan Ujian',
                'duration' => 'Bulan 6',
                'badge' => 'Fase Final',
                'description' => 'Mengevaluasi rekam jejak capaian skor dan mematangkan persiapan menjelang pelaksanaan ujian.',
                'milestones' => [
                    'Rangkuman evaluasi progress belajar',
                    'Latihan simulasi penutup',
                    'Kesiapan mental dan strategi pengerjaan soal',
                ],
            ],
        ];
    }
}
