<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Program;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CourseCatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mandiri = Program::where('slug', 'mandiri')->first();
        $intensif = Program::where('slug', 'intensif')->first();
        $garansi = Program::where('slug', 'garansi')->first();

        $mandiriId = $mandiri?->id;
        $intensifId = $intensif?->id;
        $garansiId = $garansi?->id;

        // Ensure previously seeded courses from CourseModuleLessonSeeder have program info
        Course::where('slug', 'penalaran-umum-pu-sma')->update([
            'program_id' => $intensifId,
            'program_name' => 'Program Intensif',
            'instructor_name' => 'Dr. Ahmad Fadli',
            'is_popular' => true,
            'is_bestseller' => true,
        ]);

        Course::where('slug', 'penalaran-matematika-pm-sma')->update([
            'program_id' => $intensifId,
            'program_name' => 'Program Intensif',
            'instructor_name' => 'Siti Rahmawati, M.Si.',
            'is_popular' => true,
            'is_bestseller' => true,
        ]);

        // Define full SMA / UTBK 2027 catalog
        $courses = [
            // TPS & UTBK
            [
                'title' => 'Mastery Penalaran Umum (PU) UTBK-SNBT 2027',
                'instructor_name' => 'Dr. Ahmad Fadli',
                'category' => 'TPS UTBK',
                'description' => 'Trik dan metode penalaran deduktif, induktif, dan logika kuantitatif paling jitu untuk meraih skor 700+ di PU SNBT.',
                'thumbnail' => 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.9,
                'total_reviews' => 420,
                'is_popular' => true,
                'is_bestseller' => true,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'Pengetahuan & Pemahaman Umum (PPU) Intensif SMA',
                'instructor_name' => 'Budi Santoso, S.Pd.',
                'category' => 'TPS UTBK',
                'description' => 'Strategi memahami wacana, struktur paragraf, dan analisis kata bahasa Indonesia dalam soal PPU UTBK.',
                'thumbnail' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.7,
                'total_reviews' => 315,
                'is_popular' => false,
                'is_bestseller' => false,
                'program_id' => $mandiriId,
                'program_name' => 'Program Mandiri',
            ],
            [
                'title' => 'Kemampuan Memahami Bacaan & Menulis (PBM) Sukses SNBT',
                'instructor_name' => 'Budi Santoso, S.Pd.',
                'category' => 'TPS UTBK',
                'description' => 'Kuasai ejaan PUEBI, kalimat efektif, konjungsi, dan gagasan utama untuk menaklukkan soal PBM secara akurat dan cepat.',
                'thumbnail' => 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.8,
                'total_reviews' => 280,
                'is_popular' => true,
                'is_bestseller' => false,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'Pengetahuan Kuantitatif: Trik Cepat & Logika Angka',
                'instructor_name' => 'Siti Rahmawati, M.Si.',
                'category' => 'TPS UTBK',
                'description' => 'Shortcut perhitungan aljabar, pola bilangan, geometri dasar, dan probabilitas yang sering muncul di PK SNBT.',
                'thumbnail' => 'https://images.unsplash.com/photo-1632516643720-e7f0d7e6a739?w=600&auto=format&fit=crop&q=80',
                'rating' => 5.0,
                'total_reviews' => 540,
                'is_popular' => true,
                'is_bestseller' => true,
                'program_id' => $garansiId,
                'program_name' => 'Program Garansi',
            ],

            // Literasi & Bahasa
            [
                'title' => 'Literasi Bahasa Indonesia: Analisis Teks Wacana & Informasi Kompleks',
                'instructor_name' => 'Dr. Rina Astuti',
                'category' => 'Literasi & Bahasa',
                'description' => 'Pelatihan membaca kritis teks sains, sosial humaniora, dan sastra panjang sesuai Kurikulum Merdeka untuk SNBT.',
                'thumbnail' => 'https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.8,
                'total_reviews' => 190,
                'is_popular' => false,
                'is_bestseller' => false,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'English Literacy for SNBT: Speed Reading & Context Mastery',
                'instructor_name' => 'Mark Johnson, M.A.',
                'category' => 'Literasi & Bahasa',
                'description' => 'Master reading strategies, inferences, author tones, and contextual vocabularies to ace the SNBT English Literacy subtest.',
                'thumbnail' => 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.9,
                'total_reviews' => 610,
                'is_popular' => true,
                'is_bestseller' => true,
                'program_id' => $garansiId,
                'program_name' => 'Program Garansi',
            ],

            // Sains & Teknologi (MIPA)
            [
                'title' => 'Fisika SMA Terpadu: Mekanika, Termodinamika & Gelombang',
                'instructor_name' => 'Prof. Yohanes Surya',
                'category' => 'Sains & Teknologi (MIPA)',
                'description' => 'Pemahaman konsep Fisika dari dasar hingga mahir tanpa menghafal rumus. Cocok untuk ujian sekolah dan olimpiade.',
                'thumbnail' => 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.9,
                'total_reviews' => 845,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $garansiId,
                'program_name' => 'Program Garansi',
            ],
            [
                'title' => 'Kimia SMA Komprehensif: Stoikiometri, Termokimia & Organik',
                'instructor_name' => 'Irfan Hakim, M.Sc.',
                'category' => 'Sains & Teknologi (MIPA)',
                'description' => 'Pelajari konsep inti atom, ikatan kimia, dan reaksi secara visual dan aplikatif untuk ujian sekolah SMA.',
                'thumbnail' => 'https://images.unsplash.com/photo-1603126859595-8e348984920d?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.6,
                'total_reviews' => 320,
                'is_popular' => false,
                'is_bestseller' => false,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'Biologi SMA Modern: Genetika, Bioteknologi & Fisiologi Sel',
                'instructor_name' => 'Dr. Ratna Sari',
                'category' => 'Sains & Teknologi (MIPA)',
                'description' => 'Bahas tuntas materi sel, metabolisme, evolusi, hingga sistem organ manusia dengan ilustrasi 3D menarik.',
                'thumbnail' => 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.8,
                'total_reviews' => 410,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $mandiriId,
                'program_name' => 'Program Mandiri',
            ],

            // Sosial & Humaniora (SOSHUM)
            [
                'title' => 'Sosiologi SMA: Struktur Sosial, Perubahan & Konflik Masyarakat',
                'instructor_name' => 'Dra. Endang Lestari',
                'category' => 'Sosial & Humaniora (SOSHUM)',
                'description' => 'Pahami dinamika sosial masyarakat, stratifikasi, dan teori sosiologi tokoh klasik maupun modern.',
                'thumbnail' => 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.7,
                'total_reviews' => 205,
                'is_popular' => false,
                'is_bestseller' => false,
                'program_id' => $mandiriId,
                'program_name' => 'Program Mandiri',
            ],
            [
                'title' => 'Ekonomi SMA: Mekanisme Pasar, Kebijakan Moneter & Akuntansi',
                'instructor_name' => 'Bambang Priyono, S.E., Ak.',
                'category' => 'Sosial & Humaniora (SOSHUM)',
                'description' => 'Kupas tuntas kurva permintaan-penawaran, perhitungan PDB, inflasi, indeks harga, dan dasar-dasar akuntansi.',
                'thumbnail' => 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.8,
                'total_reviews' => 330,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'Sejarah Indonesia & Dunia: Konsep Peristiwa & Analisis',
                'instructor_name' => 'Drs. Supriyanto, M.Hum.',
                'category' => 'Sosial & Humaniora (SOSHUM)',
                'description' => 'Metode kronologis dan analisis peristiwa sejarah dari masa praaksara hingga perang dingin secara menyenangkan.',
                'thumbnail' => 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.9,
                'total_reviews' => 500,
                'is_popular' => true,
                'is_bestseller' => false,
                'program_id' => $garansiId,
                'program_name' => 'Program Garansi',
            ],
        ];

        foreach ($courses as $index => $item) {
            $slug = Str::slug($item['title']);
            $c = Course::updateOrCreate(
                ['slug' => $slug],
                array_merge($item, [
                    'sort_order' => $index + 3,
                    'is_active' => true,
                    'has_certificate' => true,
                ])
            );

            if ($c->modules()->count() === 0) {
                // Section 1
                $m1 = $c->modules()->create([
                    'title' => 'Bagian 1: Fundamental & Konsep Dasar '.$c->category,
                    'sort_order' => 1,
                ]);
                $m1->lessons()->createMany([
                    [
                        'title' => 'Pengenalan & Gambaran Umum '.$c->title,
                        'type' => 'video',
                        'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                        'duration_seconds' => 720,
                        'is_preview' => true,
                        'sort_order' => 1,
                    ],
                    [
                        'title' => 'Buku Panduan & Rangkuman Materi',
                        'type' => 'reading',
                        'content' => '<p>Modul materi bacaan esensial yang merangkum prinsip utama dan terminologi penting.</p>',
                        'duration_seconds' => 600,
                        'is_preview' => true,
                        'sort_order' => 2,
                    ],
                ]);

                // Section 2
                $m2 = $c->modules()->create([
                    'title' => 'Bagian 2: Latihan Soal & Pembahasan SNBT',
                    'sort_order' => 2,
                ]);
                $m2->lessons()->createMany([
                    [
                        'title' => 'Bedah Soal Tipe UTBK/SNBT',
                        'type' => 'video',
                        'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                        'duration_seconds' => 1200,
                        'is_preview' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'title' => 'Kuis Interaktif Uji Pemahaman',
                        'type' => 'quiz',
                        'duration_seconds' => 900,
                        'min_pass_score' => 60,
                        'is_preview' => false,
                        'sort_order' => 2,
                        'quiz_questions' => [
                            [
                                'question' => 'Strategi apa yang paling efektif untuk menaklukkan soal analisis tingkat tinggi?',
                                'options' => ['Memahami konsep secara mendalam dan berlatih soal bervariasi', 'Hanya menghafalkan rumus cepat', 'Menebak jawaban secara acak tanpa membaca'],
                                'correct_index' => 0,
                                'explanation' => 'Pemahaman konsep mendalam memungkinkan Anda menganalisis berbagai variasi soal sulit.',
                            ],
                        ],
                    ],
                ]);
            }
        }
    }
}
