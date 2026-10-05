<?php

namespace Database\Seeders;

use App\Models\ExamType;
use Illuminate\Database\Seeder;

class ExamTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'code' => 'tps',
                'name' => 'TPS — Tes Potensi Skolastik',
                'description' => 'Tes komprehensif mengukur kemampuan kognitif, logika analitik, dan pemecahan masalah dasar.',
                'icon' => '🧠',
                'duration_seconds' => 5400,
                'total_questions' => 30,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'pu',
                'name' => 'PU — Penalaran Umum',
                'description' => 'Penalaran induktif, deduktif, dan pemahaman logika kuantitatif untuk SNBT 2027.',
                'icon' => '💡',
                'duration_seconds' => 1800,
                'total_questions' => 15,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'ppu',
                'name' => 'PPU — Pengetahuan & Pemahaman Umum',
                'description' => 'Pengujian makna konteks kalimat, fungsi kata, dan struktur wacana ilmiah.',
                'icon' => '🌐',
                'duration_seconds' => 1500,
                'total_questions' => 15,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'code' => 'pbm',
                'name' => 'PBM — Pemahaman Bacaan & Menulis',
                'description' => 'Kemampuan memahami inti bacaan, ejaan PUEBI/EYD, kepaduan dan keefektifan kalimat.',
                'icon' => '📖',
                'duration_seconds' => 1500,
                'total_questions' => 15,
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'code' => 'pk',
                'name' => 'PK — Pengetahuan Kuantitatif',
                'description' => 'Perhitungan matematika dasar, aljabar, geometri, dan logika himpunan angka.',
                'icon' => '🔢',
                'duration_seconds' => 1800,
                'total_questions' => 15,
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'code' => 'lbi',
                'name' => 'LBI — Literasi dalam Bahasa Indonesia',
                'description' => 'Analisis mendalam teks wacana sains, sosial, narasi, dan argumentasi tingkat SMA.',
                'icon' => '🇮🇩',
                'duration_seconds' => 2700,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'code' => 'lbe',
                'name' => 'LBE — Literasi dalam Bahasa Inggris',
                'description' => 'In-depth reading comprehension, inference, tone, author perspective, and contextual vocabulary.',
                'icon' => '🇬🇧',
                'duration_seconds' => 2700,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'code' => 'pm',
                'name' => 'PM — Penalaran Matematika',
                'description' => 'Pemodelan matematika, penalaran kuantitatif real-world, interpretasi data grafik/tabel kompleks.',
                'icon' => '📐',
                'duration_seconds' => 2700,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 8,
            ],
            [
                'code' => 'tpa-if',
                'name' => 'TPA — Informatika',
                'description' => 'Tes Potensi Akademik masuk jurusan Informatika mencakup logika proposisi, sistem bilangan, dan algoritma.',
                'icon' => '💻',
                'duration_seconds' => 5400,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 9,
            ],
        ];

        foreach ($types as $type) {
            ExamType::updateOrCreate(
                ['code' => $type['code']],
                $type
            );
        }
    }
}
