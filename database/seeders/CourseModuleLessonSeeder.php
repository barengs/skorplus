<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Module;
use App\Models\Lesson;
use App\Models\LearningPackage;
use Illuminate\Support\Str;

class CourseModuleLessonSeeder extends Seeder
{
    public function run(): void
    {
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Course::truncate();
        Module::truncate();
        Lesson::truncate();
        LearningPackage::truncate();
        \Illuminate\Support\Facades\DB::table('learning_package_course')->truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Create Course 1: Penalaran Umum (TPS)
        $course1 = Course::create([
            'title' => 'Penalaran Umum (TPS)',
            'slug' => Str::slug('Penalaran Umum TPS'),
            'description' => 'Materi lengkap Penalaran Umum untuk persiapan UTBK SNBT.',
            'category' => 'TPS',
            'is_active' => true,
            'thumbnail' => 'https://dummyimage.com/600x400/4f46e5/fff.png&text=Penalaran+Umum',
            'has_certificate' => true,
            'rating' => 4.8,
            'total_reviews' => 125,
            'instructor_id' => 2 // tutor role
        ]);

        $c1m1 = Module::create(['course_id' => $course1->id, 'title' => 'Bab 1: Silogisme & Logika Posisi', 'sort_order' => 1]);
        Lesson::create(['module_id' => $c1m1->id, 'title' => 'Pengantar Silogisme', 'type' => 'video', 'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'duration_seconds' => 15 * 60, 'sort_order' => 1, 'is_preview' => true]);
        Lesson::create(['module_id' => $c1m1->id, 'title' => 'Latihan Soal Silogisme', 'type' => 'quiz', 'duration_seconds' => 20 * 60, 'sort_order' => 2]);
        Lesson::create(['module_id' => $c1m1->id, 'title' => 'Rangkuman Silogisme', 'type' => 'reading', 'content' => '<p>Silogisme adalah penarikan kesimpulan...</p>', 'duration_seconds' => 10 * 60, 'sort_order' => 3]);

        $c1m2 = Module::create(['course_id' => $course1->id, 'title' => 'Bab 2: Penalaran Kuantitatif', 'sort_order' => 2]);
        Lesson::create(['module_id' => $c1m2->id, 'title' => 'Pola Bilangan', 'type' => 'video', 'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'duration_seconds' => 25 * 60, 'sort_order' => 1]);
        Lesson::create(['module_id' => $c1m2->id, 'title' => 'Deret Aritmatika & Geometri', 'type' => 'reading', 'content' => '<p>Materi rumus deret...</p>', 'duration_seconds' => 15 * 60, 'sort_order' => 2]);

        // 2. Create Course 2: Penalaran Matematika
        $course2 = Course::create([
            'title' => 'Penalaran Matematika (PM)',
            'slug' => Str::slug('Penalaran Matematika PM'),
            'description' => 'Persiapan Penalaran Matematika dengan trik cepat.',
            'category' => 'Matematika',
            'is_active' => true,
            'thumbnail' => 'https://dummyimage.com/600x400/0ea5e9/fff.png&text=Penalaran+MTK',
            'has_certificate' => true,
            'rating' => 4.9,
            'total_reviews' => 320,
            'instructor_id' => 2
        ]);

        $c2m1 = Module::create(['course_id' => $course2->id, 'title' => 'Aljabar Lanjut', 'sort_order' => 1]);
        Lesson::create(['module_id' => $c2m1->id, 'title' => 'Fungsi Kuadrat', 'type' => 'video', 'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'duration_seconds' => 30 * 60, 'sort_order' => 1, 'is_preview' => true]);

        // 3. Create Learning Package
        $package = LearningPackage::create([
            'name' => 'Paket Intensif UTBK 2026',
            'slug' => Str::slug('Paket Intensif UTBK 2026'),
            'description' => 'Bundling lengkap TPS, Literasi, dan Penalaran Matematika + Tryout Eksklusif.',
            'price' => 450000,
            'discount_price' => 299000,
            'thumbnail' => 'https://dummyimage.com/800x600/f59e0b/fff.png&text=UTBK+Intensif',
            'features' => ['Akses 12 Bulan', 'Tryout CBT Premium 10x', 'Forum Diskusi Tanya Tutor', 'PDF Modul Super Lengkap'],
            'is_published' => true
        ]);
        
        $package->courses()->sync([$course1->id, $course2->id]);
        
        $package2 = LearningPackage::create([
            'name' => 'Paket Literasi Bahasa',
            'slug' => Str::slug('Paket Literasi Bahasa'),
            'description' => 'Fokus maksimalkan skor Literasi Bahasa Indonesia & Bahasa Inggris.',
            'price' => 250000,
            'discount_price' => 150000,
            'thumbnail' => 'https://dummyimage.com/800x600/10b981/fff.png&text=Paket+Literasi',
            'features' => ['Akses 6 Bulan', 'Bedah Soal Harian', 'Bank Soal Update'],
            'is_published' => true
        ]);

        $package3 = LearningPackage::create([
            'name' => 'Paket Literasi Digital',
            'slug' => Str::slug('Paket Literasi Digital'),
            'description' => 'Fokus maksimalkan skor Literasi Digital & Pemahaman Umum.',
            'price' => 350000,
            'discount_price' => 250000,
            'thumbnail' => 'https://dummyimage.com/800x600/10b981/fff.png&text=Paket+Literasi',
            'features' => ['Akses 6 Bulan', 'Bedah Soal Harian', 'Bank Soal Update'],
            'is_published' => true
        ]);
    }
}
