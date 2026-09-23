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
                'description' => 'Tes Potensi Skolastik untuk mengukur kemampuan kognitif dasar calon mahasiswa.',
                'icon' => '🧠',
                'duration_seconds' => 5400,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'pu',
                'name' => 'PU — Penalaran Umum',
                'description' => 'Penalaran Umum untuk menguji kemampuan berpikir logis dan analitis.',
                'icon' => '💡',
                'duration_seconds' => 2700,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'ppu',
                'name' => 'PPU — Pemahaman Bacaan & Menulis',
                'description' => 'Pemahaman Bacaan dan Menulis untuk menguji kompetensi literasi teks bahasa.',
                'icon' => '📖',
                'duration_seconds' => 2700,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'code' => 'pm',
                'name' => 'PM — Penalaran Matematika',
                'description' => 'Penalaran Matematika untuk memecahkan persoalan kuantitatif dan matematis konteks nyata.',
                'icon' => '📐',
                'duration_seconds' => 1800,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'code' => 'pk',
                'name' => 'PK — Pengetahuan dan Pemahaman Umum',
                'description' => 'Pengetahuan dan Pemahaman Umum tentang konteks wacana ilmiah dan umum.',
                'icon' => '🌐',
                'duration_seconds' => 1800,
                'total_questions' => 20,
                'is_active' => true,
                'sort_order' => 5,
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
