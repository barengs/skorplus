<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Program;
use App\Models\Testimonial;
use App\Models\Feature;
use App\Models\Stat;
use App\Models\LandingHero;
use App\Models\LandingPromo;

class LandingPageSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Landing Hero
        LandingHero::create([
            'title' => 'Raih Impian-mu',
            'subtitle' => 'Bersama SkorPluss',
            'description' => 'Persiapan komprehensif UTBK-SNBT, Kedinasan, dan Olimpiade melalui CBT prediktif adaptif, tutor berpengalaman, dan analitik belajar berbasis data.',
            'badge_text' => 'Platform Bimbel & LMS #1 untuk UTBK-SNBT dan Kedinasan',
            'cta_primary_text' => '🚀 Mulai Belajar Gratis',
            'cta_primary_link' => '/daftar',
            'cta_secondary_text' => 'Lihat Program →',
            'cta_secondary_link' => '#program',
            'is_active' => true,
        ]);

        // 2. Landing Promo
        LandingPromo::create([
            'text' => '🎉 Promo Gelombang Emas — Diskon 40% untuk pendaftar hari ini!',
            'countdown_seconds' => 47 * 3600 + 23 * 60 + 59,
            'is_active' => true,
        ]);

        // 3. Stats
        $stats = [
            ['label' => 'Siswa Aktif', 'value' => '12.400+', 'sort_order' => 1],
            ['label' => 'Tingkat Kelulusan PTN', 'value' => '94%', 'sort_order' => 2],
            ['label' => 'Rata-rata Respons Tutor', 'value' => '14 mnt', 'sort_order' => 3],
            ['label' => 'Bank Soal Premium', 'value' => '50.000+', 'sort_order' => 4],
        ];
        foreach ($stats as $s) Stat::create($s);

        // 4. Features
        $features = [
            ['icon' => '🧠', 'title' => 'CBT Adaptif Prediktif', 'description' => 'Simulasi UTBK-SNBT dengan soal prediktif berbasis AI yang terus diperbarui mengikuti tren ujian terkini.', 'sort_order' => 1],
            ['icon' => '💬', 'title' => 'Forum Tanya Tutor', 'description' => 'Tanya langsung ke tutor alumni UI/ITB. Rata-rata dijawab dalam 14 menit, tersedia 24/7.', 'sort_order' => 2],
            ['icon' => '📊', 'title' => 'Analitik Progres', 'description' => 'Dashboard personal menampilkan skor, kelemahan materi, dan rekomendasi belajar berbasis data.', 'sort_order' => 3],
            ['icon' => '🧭', 'title' => 'Analisa RIASEC', 'description' => 'Temukan jurusan & karier yang paling cocok dengan kepribadian dan potensi akademis Anda.', 'sort_order' => 4],
            ['icon' => '🎬', 'title' => 'E-Learning Video', 'description' => 'Ribuan video modul dari tutor berpengalaman, bisa ditonton kapan saja dan di mana saja.', 'sort_order' => 5],
            ['icon' => '🏅', 'title' => 'Garansi Masuk PTN', 'description' => 'Jika tidak lolos, biaya bimbingan dikembalikan penuh. Komitmen kami untuk kesuksesan Anda.', 'sort_order' => 6],
        ];
        foreach ($features as $f) Feature::create($f);

        // 5. Testimonials
        $testimonials = [
            ['name' => 'Aditya Pratama', 'school' => 'SMAN 3 Bandung', 'university' => 'Teknik Informatika UI', 'score' => 762, 'avatar_text' => 'AP', 'avatar_color' => 'from-blue-500 to-violet-600', 'sort_order' => 1],
            ['name' => 'Salsabila Nur', 'school' => 'MAN 2 Surabaya', 'university' => 'Kedokteran UNAIR', 'score' => 741, 'avatar_text' => 'SN', 'avatar_color' => 'from-emerald-500 to-teal-600', 'sort_order' => 2],
            ['name' => 'Rizky Fadillah', 'school' => 'SMAN 1 Yogyakarta', 'university' => 'Hukum UGM', 'score' => 718, 'avatar_text' => 'RF', 'avatar_color' => 'from-orange-500 to-amber-600', 'sort_order' => 3],
            ['name' => 'Naura Azahra', 'school' => 'SMAN 8 Jakarta', 'university' => 'STAN Kedinasan', 'score' => 729, 'avatar_text' => 'NA', 'avatar_color' => 'from-violet-500 to-pink-600', 'sort_order' => 4],
        ];
        foreach ($testimonials as $t) Testimonial::create($t);

        // 6. Programs
        $programs = [
            [
                'name' => 'Mandiri', 'slug' => 'mandiri', 'icon' => '📚', 'price' => 'Rp 350.000', 'price_period' => '/bulan',
                'description' => null,
                'features' => ['10 soal forum/bulan', 'Akses bank soal dasar', 'CBT simulasi 5×/bulan', 'Progress tracking'],
                'color' => 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800',
                'ring_color' => 'ring-slate-300 dark:ring-slate-600',
                'is_popular' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Intensif', 'slug' => 'intensif', 'icon' => '🚀', 'price' => 'Rp 750.000', 'price_period' => '/bulan',
                'description' => null,
                'features' => ['Unlimited forum & tanya tutor', 'Akses bank soal premium', 'CBT simulasi unlimited', 'Live streaming 3×/minggu', 'Analisa RIASEC minat bakat'],
                'color' => 'from-blue-100 to-violet-200 dark:from-blue-700 dark:to-violet-700',
                'ring_color' => 'ring-blue-400 dark:ring-blue-500',
                'is_popular' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Garansi', 'slug' => 'garansi', 'icon' => '🏆', 'price' => 'Rp 1.200.000', 'price_period' => '/bulan',
                'description' => null,
                'features' => ['Semua fitur Intensif', '4× sesi 1-on-1/bulan', 'Garansi masuk PTN/kedinasan', 'Konsultasi jurusan & kampus', 'Materi olimpiade eksklusif'],
                'color' => 'from-amber-100 to-orange-200 dark:from-amber-700 dark:to-orange-700',
                'ring_color' => 'ring-amber-400 dark:ring-amber-500',
                'is_popular' => false,
                'sort_order' => 3,
            ]
        ];
        foreach ($programs as $p) Program::create($p);
    }
}
