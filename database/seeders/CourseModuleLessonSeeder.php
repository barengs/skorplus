<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\LearningPackage;
use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Database\Seeder;

class CourseModuleLessonSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Course: Penalaran Umum (PU) untuk SMA
        $course1 = Course::updateOrCreate(
            ['slug' => 'penalaran-umum-pu-sma'],
            [
                'title' => 'Penalaran Umum (PU) SMA',
                'slug' => 'penalaran-umum-pu-sma',
                'description' => 'Materi lengkap Penalaran Umum untuk persiapan UTBK SNBT 2027 tingkat SMA.',
                'category' => 'TPS UTBK-SNBT',
                'is_active' => true,
                'thumbnail' => 'https://dummyimage.com/600x400/4f46e5/fff.png&text=Penalaran+Umum',
                'has_certificate' => true,
                'rating' => 4.8,
                'total_reviews' => 125,
                'instructor_id' => 2,
                'sort_order' => 1,
            ]
        );

        $c1m1 = Module::updateOrCreate(
            ['course_id' => $course1->id, 'title' => 'Bab 1: Silogisme & Logika Posisi'],
            ['sort_order' => 1]
        );
        Lesson::updateOrCreate(
            ['module_id' => $c1m1->id, 'title' => 'Pengantar Silogisme'],
            ['type' => 'video', 'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'duration_seconds' => 15 * 60, 'sort_order' => 1, 'is_preview' => true]
        );
        Lesson::updateOrCreate(
            ['module_id' => $c1m1->id, 'title' => 'Latihan Soal Silogisme'],
            ['type' => 'quiz', 'duration_seconds' => 20 * 60, 'sort_order' => 2, 'min_pass_score' => 60]
        );
        Lesson::updateOrCreate(
            ['module_id' => $c1m1->id, 'title' => 'Rangkuman Silogisme'],
            ['type' => 'reading', 'content' => '<p>Silogisme adalah penarikan kesimpulan dari dua premis. Pelajari modus ponens, tollens, dan silogisme kategoris.</p>', 'duration_seconds' => 10 * 60, 'sort_order' => 3]
        );

        $c1m2 = Module::updateOrCreate(
            ['course_id' => $course1->id, 'title' => 'Bab 2: Penalaran Kuantitatif'],
            ['sort_order' => 2]
        );
        Lesson::updateOrCreate(
            ['module_id' => $c1m2->id, 'title' => 'Pola Bilangan'],
            ['type' => 'video', 'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'duration_seconds' => 25 * 60, 'sort_order' => 1]
        );
        Lesson::updateOrCreate(
            ['module_id' => $c1m2->id, 'title' => 'Deret Aritmatika & Geometri'],
            ['type' => 'reading', 'content' => '<p>Materi rumus deret aritmatika dan geometri untuk SNBT 2027.</p>', 'duration_seconds' => 15 * 60, 'sort_order' => 2]
        );

        // 2. Course: Penalaran Matematika (PM) untuk SMA
        $course2 = Course::updateOrCreate(
            ['slug' => 'penalaran-matematika-pm-sma'],
            [
                'title' => 'Penalaran Matematika (PM) SMA',
                'slug' => 'penalaran-matematika-pm-sma',
                'description' => 'Persiapan Penalaran Matematika SNBT 2027 dengan trik cepat untuk siswa SMA.',
                'category' => 'Matematika',
                'is_active' => true,
                'thumbnail' => 'https://dummyimage.com/600x400/0ea5e9/fff.png&text=Penalaran+MTK',
                'has_certificate' => true,
                'rating' => 4.9,
                'total_reviews' => 320,
                'instructor_id' => 2,
                'sort_order' => 2,
            ]
        );

        $c2m1 = Module::updateOrCreate(
            ['course_id' => $course2->id, 'title' => 'Aljabar Lanjut'],
            ['sort_order' => 1]
        );
        Lesson::updateOrCreate(
            ['module_id' => $c2m1->id, 'title' => 'Fungsi Kuadrat'],
            ['type' => 'video', 'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'duration_seconds' => 30 * 60, 'sort_order' => 1, 'is_preview' => true]
        );

        // 3. Course: Literasi Bahasa Indonesia untuk SMA
        $course3 = Course::updateOrCreate(
            ['slug' => 'literasi-bahasa-indonesia-sma'],
            [
                'title' => 'Literasi Bahasa Indonesia SMA',
                'slug' => 'literasi-bahasa-indonesia-sma',
                'description' => 'Pemahaman bacaan dan menulis untuk SNBT 2027.',
                'category' => 'Literasi',
                'is_active' => true,
                'thumbnail' => 'https://dummyimage.com/600x400/10b981/fff.png&text=Literasi+BI',
                'has_certificate' => true,
                'rating' => 4.7,
                'total_reviews' => 210,
                'instructor_id' => 2,
                'sort_order' => 3,
            ]
        );

        $c3m1 = Module::updateOrCreate(
            ['course_id' => $course3->id, 'title' => 'Pemahaman Bacaan'],
            ['sort_order' => 1]
        );
        Lesson::updateOrCreate(
            ['module_id' => $c3m1->id, 'title' => 'Ide Pokok & Gagasan Utama'],
            ['type' => 'video', 'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'duration_seconds' => 20 * 60, 'sort_order' => 1, 'is_preview' => true]
        );

        // 4. Course: Pengetahuan Kuantitatif untuk SMA
        $course4 = Course::updateOrCreate(
            ['slug' => 'pengetahuan-kuantitatif-sma'],
            [
                'title' => 'Pengetahuan Kuantitatif SMA',
                'slug' => 'pengetahuan-kuantitatif-sma',
                'description' => 'Matematika dasar dan kuantitatif untuk SNBT 2027.',
                'category' => 'Matematika',
                'is_active' => true,
                'thumbnail' => 'https://dummyimage.com/600x400/f59e0b/fff.png&text=PK',
                'has_certificate' => true,
                'rating' => 4.6,
                'total_reviews' => 180,
                'instructor_id' => 2,
                'sort_order' => 4,
            ]
        );

        $c4m1 = Module::updateOrCreate(
            ['course_id' => $course4->id, 'title' => 'Aritmetika Sosial'],
            ['sort_order' => 1]
        );
        Lesson::updateOrCreate(
            ['module_id' => $c4m1->id, 'title' => 'Persentase & Perbandingan'],
            ['type' => 'video', 'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'duration_seconds' => 18 * 60, 'sort_order' => 1, 'is_preview' => true]
        );

        // 5. Learning Packages untuk SNBT 2027
        $package = LearningPackage::updateOrCreate(
            ['slug' => 'paket-intensif-utbk-2027'],
            [
                'name' => 'Paket Intensif UTBK 2027',
                'slug' => 'paket-intensif-utbk-2027',
                'description' => 'Bundling lengkap TPS, Literasi, dan Penalaran Matematika + Tryout Eksklusif untuk SNBT 2027.',
                'price' => 450000,
                'discount_price' => 299000,
                'thumbnail' => 'https://dummyimage.com/800x600/f59e0b/fff.png&text=UTBK+2027',
                'features' => ['Akses 12 Bulan', 'Tryout CBT Premium 10x', 'Forum Diskusi Tanya Tutor', 'PDF Modul Super Lengkap'],
                'is_published' => true,
            ]
        );
        $package->courses()->sync([$course1->id, $course2->id, $course3->id, $course4->id]);

        $package2 = LearningPackage::updateOrCreate(
            ['slug' => 'paket-literasi-bahasa-2027'],
            [
                'name' => 'Paket Literasi Bahasa 2027',
                'slug' => 'paket-literasi-bahasa-2027',
                'description' => 'Fokus maksimalkan skor Literasi Bahasa Indonesia & Bahasa Inggris untuk SNBT 2027.',
                'price' => 250000,
                'discount_price' => 150000,
                'thumbnail' => 'https://dummyimage.com/800x600/10b981/fff.png&text=Paket+Literasi',
                'features' => ['Akses 6 Bulan', 'Bedah Soal Harian', 'Bank Soal Update'],
                'is_published' => true,
            ]
        );

        $package3 = LearningPackage::updateOrCreate(
            ['slug' => 'paket-mandiri-snbt-2027'],
            [
                'name' => 'Paket Mandiri SNBT 2027',
                'slug' => 'paket-mandiri-snbt-2027',
                'description' => 'Belajar mandiri dengan modul lengkap dan tryout untuk SNBT 2027.',
                'price' => 150000,
                'discount_price' => 99000,
                'thumbnail' => 'https://dummyimage.com/800x600/6366f1/fff.png&text=Paket+Mandiri',
                'features' => ['Akses 6 Bulan', 'Modul PDF Lengkap', 'Tryout 5x'],
                'is_published' => true,
            ]
        );
    }
}
