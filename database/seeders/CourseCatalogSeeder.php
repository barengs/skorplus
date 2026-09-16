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

        // 1. Update existing courses if present
        $existingCourse1 = Course::find(1);
        if ($existingCourse1) {
            $existingCourse1->update([
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
                'instructor_name' => 'Dr. Ahmad Fadli',
                'category' => 'TPS & UTBK',
                'is_popular' => true,
                'is_bestseller' => true,
            ]);
        }

        $existingCourse2 = Course::find(2);
        if ($existingCourse2) {
            $existingCourse2->update([
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
                'instructor_name' => 'Dr. Ahmad Fadli',
                'category' => 'Matematika',
                'is_popular' => true,
                'is_bestseller' => true,
            ]);
        }

        // 2. Define courses list matching images & categories
        $courses = [
            // Kursus Populer Top Section
            [
                'title' => 'Claude AI: Jago Kecerdasan Buatan (AI) dari Nol hingga Mahir',
                'instructor_name' => 'Jubilee Enterprise',
                'category' => 'AI & Otomasi',
                'description' => 'Pelajari konsep dan implementasi kecerdasan buatan terdepan menggunakan Claude AI untuk produktivitas dan pemrograman tingkat lanjut.',
                'thumbnail' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.9,
                'total_reviews' => 25,
                'is_popular' => true,
                'is_bestseller' => false,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'Mastering N8N dari Nol Sampai Mahir: Automation & AI',
                'instructor_name' => 'Jubilee Enterprise',
                'category' => 'AI & Otomasi',
                'description' => 'Membangun alur kerja otomatisasi skala enterprise tanpa ribet dengan mengintegrasikan N8N, webhooks, dan AI agents.',
                'thumbnail' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.7,
                'total_reviews' => 41,
                'is_popular' => true,
                'is_bestseller' => false,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'Belajar Vibe Coding untuk Programmer',
                'instructor_name' => 'Programmer Zaman Now',
                'category' => 'JavaScript',
                'description' => 'Tingkatkan kecepatan dan kenyamanan coding Anda dengan teknik modern, AI assistant, dan workflow fullstack yang efisien.',
                'thumbnail' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.9,
                'total_reviews' => 16,
                'is_popular' => true,
                'is_bestseller' => false,
                'program_id' => $mandiriId,
                'program_name' => 'Program Mandiri',
            ],
            [
                'title' => 'Pemrograman Python : Pemula sampai Mahir',
                'instructor_name' => 'Programmer Zaman Now',
                'category' => 'Python',
                'description' => 'Panduan komprehensif belajar sintaksis Python, struktur data, OOP, virtual environment, hingga membangun aplikasi backend nyata.',
                'thumbnail' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.8,
                'total_reviews' => 104,
                'is_popular' => true,
                'is_bestseller' => true,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],

            // Kategori Python
            [
                'title' => '100 Days of Code™: The Complete Python Pro Bootcamp',
                'instructor_name' => 'Dr. Angela Yu, Developer and Lead Instructor',
                'category' => 'Python',
                'description' => 'Master Python dengan membuat 100 proyek dalam 100 hari. Pelajari otomatisasi data science, web development dengan Django & Flask, dan AI.',
                'thumbnail' => 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.7,
                'total_reviews' => 435765,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $garansiId,
                'program_name' => 'Program Garansi',
            ],
            [
                'title' => 'Python for Data Science and Machine Learning Bootcamp',
                'instructor_name' => 'Jose Portilla, Pierian Training',
                'category' => 'Python',
                'description' => 'Gunakan NumPy, Pandas, Seaborn, Matplotlib, Plotly, Scikit-Learn, Machine Learning, Tensorflow, dan banyak lagi!',
                'thumbnail' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.5,
                'total_reviews' => 160681,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'Production Python for Data Engineers — FAANG-Scale',
                'instructor_name' => 'Snowbrix Academy',
                'category' => 'Python',
                'description' => 'Arsitektur pipeline data berskala besar, multiprocessing, async I/O, serta praktik terbaik standar industri FAANG.',
                'thumbnail' => 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&auto=format&fit=crop&q=80',
                'rating' => 5.0,
                'total_reviews' => 13,
                'is_popular' => false,
                'is_bestseller' => false,
                'program_id' => $garansiId,
                'program_name' => 'Program Garansi',
            ],
            [
                'title' => 'Quantitative Finance & Algorithmic Trading in Python',
                'instructor_name' => 'Holczer Balazs',
                'category' => 'Python',
                'description' => 'Penerapan algoritma kuantitatif finansial, backtesting strategi trading, analisa volatilitas pasar, dan model Black-Scholes.',
                'thumbnail' => 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.6,
                'total_reviews' => 2703,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],

            // Kategori Pemasaran Digital
            [
                'title' => 'Digital Marketing Strategist: SEO, Social Media & Ads Mastery',
                'instructor_name' => 'Growth Academy',
                'category' => 'Pemasaran Digital',
                'description' => 'Kuasai Facebook Ads, Google Ads, TikTok Marketing, dan strategi funneling organik untuk meningkatkan konversi penjualan.',
                'thumbnail' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.8,
                'total_reviews' => 1240,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],
            [
                'title' => 'Copywriting & Content Strategy untuk Meningkatkan Konversi',
                'instructor_name' => 'Bintang Pratama, Content Lead',
                'category' => 'Pemasaran Digital',
                'description' => 'Teknik menulis artikel, headline landing page, dan email broadcast yang menghipnotis audiens menjadi pembeli setia.',
                'thumbnail' => 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.7,
                'total_reviews' => 842,
                'is_popular' => false,
                'is_bestseller' => false,
                'program_id' => $mandiriId,
                'program_name' => 'Program Mandiri',
            ],

            // Kategori Ilmu Data
            [
                'title' => 'Data Analyst Bootcamp: SQL, Power BI & Visualisasi Data Interaktif',
                'instructor_name' => 'Analitika Data Indonesia',
                'category' => 'Ilmu Data',
                'description' => 'Kuasai teknik eksplorasi data, penulisan query SQL kompleks, pembuatan dashboard eksekutif, dan penyajian insight bisnis.',
                'thumbnail' => 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.9,
                'total_reviews' => 3890,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $garansiId,
                'program_name' => 'Program Garansi',
            ],

            // Kategori Microsoft Excel
            [
                'title' => 'Microsoft Excel: Dari Pemula hingga Formula Kompleks & Macro VBA',
                'instructor_name' => 'Office Expert ID',
                'category' => 'Microsoft Excel',
                'description' => 'Kuasai XLOOKUP, INDEX-MATCH, Pivot Tables, Power Query, hingga otomasi tugas rutin kantor menggunakan Macro VBA.',
                'thumbnail' => 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.8,
                'total_reviews' => 5410,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $mandiriId,
                'program_name' => 'Program Mandiri',
            ],

            // Kategori JavaScript
            [
                'title' => 'Modern Fullstack JavaScript: React 19, Next.js & Node.js',
                'instructor_name' => 'DevCamp Studio',
                'category' => 'JavaScript',
                'description' => 'Membangun aplikasi web fullstack modern berbasis React 19, RESTful API, dan database relational dengan performa optimal.',
                'thumbnail' => 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.9,
                'total_reviews' => 7620,
                'is_popular' => false,
                'is_bestseller' => true,
                'program_id' => $intensifId,
                'program_name' => 'Program Intensif',
            ],

            // Kategori Perencanaan Proyek
            [
                'title' => 'Agile & Scrum Masterclass: Panduan Manajemen Proyek Modern',
                'instructor_name' => 'PM Institute Jakarta',
                'category' => 'Perencanaan Proyek',
                'description' => 'Framework Agile, Scrum ceremonials, sprint planning, Jira management, dan sertifikasi praktis project leader.',
                'thumbnail' => 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80',
                'rating' => 4.7,
                'total_reviews' => 950,
                'is_popular' => false,
                'is_bestseller' => false,
                'program_id' => $mandiriId,
                'program_name' => 'Program Mandiri',
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
                    'title' => 'Bagian 2: Praktik Terapan & Studi Kasus Industri',
                    'sort_order' => 2,
                ]);
                $m2->lessons()->createMany([
                    [
                        'title' => 'Studi Kasus & Penerapan Praktis',
                        'type' => 'video',
                        'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                        'duration_seconds' => 1200,
                        'is_preview' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'title' => 'Kuis Evaluasi Pemahaman',
                        'type' => 'quiz',
                        'duration_seconds' => 900,
                        'min_pass_score' => 60,
                        'is_preview' => false,
                        'sort_order' => 2,
                        'quiz_questions' => [
                            [
                                'question' => 'Apa faktor terpenting dalam penguasaan materi ini?',
                                'options' => ['Konsistensi latihan dan pemahaman konsep dasar', 'Menghafal rumus tanpa praktik', 'Hanya membaca sekilas'],
                                'correct_index' => 0,
                                'explanation' => 'Pemahaman konsep dasar dan latihan konsisten adalah kunci utama keberhasilan.',
                            ],
                        ],
                    ],
                ]);

                // Section 3
                $m3 = $c->modules()->create([
                    'title' => 'Bagian 3: Proyek Portofolio & Tugas Akhir',
                    'sort_order' => 3,
                ]);
                $m3->lessons()->createMany([
                    [
                        'title' => 'Tugas Portofolio Akhir Kursus',
                        'type' => 'assignment',
                        'content' => '<p>Selesaikan tugas proyek akhir untuk membuktikan kompetensi Anda dan raih sertifikat resmi.</p>',
                        'duration_seconds' => 3600,
                        'is_preview' => false,
                        'sort_order' => 1,
                    ],
                ]);
            }
        }
    }
}
