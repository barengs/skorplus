<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\LandingHero;
use App\Models\LandingPromo;
use App\Models\Program;
use App\Models\Stat;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class LandingPageSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Landing Hero
        LandingHero::updateOrCreate(
            ['id' => 1],
            [
                'title' => 'Raih Impian-mu',
                'subtitle' => 'Bersama SkorPluss',
                'description' => 'Persiapan komprehensif UTBK-SNBT 2027, Ujian Sekolah SMA, dan Kedinasan melalui CBT prediktif adaptif, tutor berpengalaman alumni PTN terkemuka, dan analitik belajar berbasis data.',
                'badge_text' => 'Platform Bimbel & LMS #1 untuk SMA & UTBK-SNBT 2027',
                'cta_primary_text' => '🚀 Mulai Belajar Gratis',
                'cta_primary_link' => '/daftar',
                'cta_secondary_text' => 'Lihat Program SMA →',
                'cta_secondary_link' => '#program',
                'is_active' => true,
            ]
        );

        // 2. Landing Promo
        LandingPromo::updateOrCreate(
            ['id' => 1],
            [
                'text' => '🎉 Promo Gelombang Emas SNBT 2027 — Diskon 40% untuk pendaftaran hari ini!',
                'countdown_seconds' => 47 * 3600 + 23 * 60 + 59,
                'is_active' => true,
            ]
        );

        // 3. Stats
        Stat::truncate();
        $stats = [
            ['label' => 'Siswa Aktif SMA', 'value' => '15.800+', 'sort_order' => 1],
            ['label' => 'Tingkat Lolos PTN Favorit', 'value' => '95.4%', 'sort_order' => 2],
            ['label' => 'Rata-rata Respons Tutor', 'value' => '12 mnt', 'sort_order' => 3],
            ['label' => 'Bank Soal SNBT 2027', 'value' => '65.000+', 'sort_order' => 4],
        ];
        foreach ($stats as $s) {
            Stat::create($s);
        }

        // 4. Features
        Feature::truncate();
        $features = [
            ['icon' => '🧠', 'title' => 'CBT Adaptif SNBT 2027', 'description' => 'Simulasi UTBK lengkap dengan format Pilihan Ganda Tunggal, Pilihan Ganda Kompleks, dan Isian Singkat.', 'sort_order' => 1],
            ['icon' => '💬', 'title' => 'Forum Tanya Tutor 24/7', 'description' => 'Tanya langsung ke tutor senior alumni UI, ITB, ITS, dan UNAIR. Respons cepat dan penjelasan mendalam.', 'sort_order' => 2],
            ['icon' => '📊', 'title' => 'Analitik Progres Belajar', 'description' => 'Dashboard personal menampilkan skor subtes, diagnosis kelemahan materi, dan rekomendasi target jurusan.', 'sort_order' => 3],
            ['icon' => '🧭', 'title' => 'Rekomendasi Jurusan PTN', 'description' => 'Temukan program studi PTN yang paling realistis dengan minat, bakat, dan proyeksi skor tryout Anda.', 'sort_order' => 4],
            ['icon' => '🎬', 'title' => 'Video Modul Kurikulum Merdeka', 'description' => 'Ribuan modul video pembelajaran konsep esensial SMA dan trik cepat menjawab soal penalaran.', 'sort_order' => 5],
            ['icon' => '🏅', 'title' => 'Garansi Lolos PTN Impian', 'description' => 'Program intensif bergaransi dengan pendampingan personal hingga pengumuman kelulusan SNBT.', 'sort_order' => 6],
        ];
        foreach ($features as $f) {
            Feature::create($f);
        }

        // 5. Testimonials (Alumni Sekolah Jawa Timur)
        Testimonial::truncate();
        $testimonials = [
            ['name' => 'Aditya Pratama', 'school' => 'SMAN 5 Surabaya', 'university' => 'Teknik Elektro ITS', 'score' => 762, 'avatar_text' => 'AP', 'avatar_color' => 'from-blue-500 to-violet-600', 'sort_order' => 1],
            ['name' => 'Salsabila Nur', 'school' => 'SMAN 1 Malang', 'university' => 'Kedokteran UNAIR', 'score' => 741, 'avatar_text' => 'SN', 'avatar_color' => 'from-emerald-500 to-teal-600', 'sort_order' => 2],
            ['name' => 'Rizky Fadillah', 'school' => 'SMA Katolik St. Louis 1 Surabaya', 'university' => 'STEI ITB', 'score' => 758, 'avatar_text' => 'RF', 'avatar_color' => 'from-orange-500 to-amber-600', 'sort_order' => 3],
            ['name' => 'Naura Azahra', 'school' => 'SMAN 1 Sidoarjo', 'university' => 'Farmasi UNAIR', 'score' => 730, 'avatar_text' => 'NA', 'avatar_color' => 'from-violet-500 to-pink-600', 'sort_order' => 4],
            ['name' => 'Bima Prasetya', 'school' => 'MAN 2 Kota Malang', 'university' => 'Aktuaria UGM', 'score' => 745, 'avatar_text' => 'BP', 'avatar_color' => 'from-emerald-600 to-cyan-600', 'sort_order' => 5],
        ];
        foreach ($testimonials as $t) {
            Testimonial::create($t);
        }

        // 6. Programs
        $programs = [
            [
                'name' => 'Mandiri', 'slug' => 'mandiri', 'icon' => '📚', 'price' => 'Rp 350.000', 'price_period' => '/bulan',
                'description' => 'Paket belajar mandiri modul lengkap SMA dan latihan soal UTBK.',
                'features' => ['10 soal forum/bulan', 'Akses bank soal dasar', 'CBT simulasi 5×/bulan', 'Progress tracking'],
                'color' => 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800',
                'ring_color' => 'ring-slate-300 dark:ring-slate-600',
                'is_popular' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Intensif', 'slug' => 'intensif', 'icon' => '🚀', 'price' => 'Rp 750.000', 'price_period' => '/bulan',
                'description' => 'Paket terpopuler persiapan UTBK SNBT 2027 dengan live streaming interaktif.',
                'features' => ['Unlimited forum & tanya tutor', 'Akses bank soal premium', 'CBT simulasi unlimited', 'Live streaming 3×/minggu', 'Analisa rekomendasi jurusan'],
                'color' => 'from-blue-100 to-violet-200 dark:from-blue-700 dark:to-violet-700',
                'ring_color' => 'ring-blue-400 dark:ring-blue-500',
                'is_popular' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Garansi', 'slug' => 'garansi', 'icon' => '🏆', 'price' => 'Rp 1.200.000', 'price_period' => '/bulan',
                'description' => 'Pendampingan 1-on-1 privat hingga lolos PTN impian Anda.',
                'features' => ['Semua fitur Intensif', '4× sesi 1-on-1/bulan', 'Garansi masuk PTN/kedinasan', 'Konsultasi jurusan & kampus', 'Modul eksklusif olimpiade'],
                'color' => 'from-amber-100 to-orange-200 dark:from-amber-700 dark:to-orange-700',
                'ring_color' => 'ring-amber-400 dark:ring-amber-500',
                'is_popular' => false,
                'sort_order' => 3,
            ],
        ];
        foreach ($programs as $p) {
            Program::updateOrCreate(['slug' => $p['slug']], $p);
        }
    }
}
