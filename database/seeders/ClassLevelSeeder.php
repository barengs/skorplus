<?php

namespace Database\Seeders;

use App\Models\ClassLevel;
use Illuminate\Database\Seeder;

class ClassLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            [
                'slug' => 'kelas-10',
                'name' => 'Kelas 10 (X)',
                'category' => 'SMA/MA/SMK',
                'description' => 'Siswa tingkat awal SMA/MA/SMK sederajat',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'slug' => 'kelas-11',
                'name' => 'Kelas 11 (XI)',
                'category' => 'SMA/MA/SMK',
                'description' => 'Siswa tingkat menengah SMA/MA/SMK sederajat',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'slug' => 'kelas-12',
                'name' => 'Kelas 12 (XII)',
                'category' => 'SMA/MA/SMK',
                'description' => 'Siswa tingkat akhir SMA/MA/SMK persiapan UTBK-SNBT & Kedinasan',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'slug' => 'alumni-gap-year',
                'name' => 'Alumni / Gap Year',
                'category' => 'Umum',
                'description' => 'Lulusan SMA/MA/SMK yang mengikuti seleksi PTN/Kedinasan tahun berjalan',
                'sort_order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($levels as $level) {
            ClassLevel::updateOrCreate(
                ['slug' => $level['slug']],
                $level
            );
        }

        $this->command?->info('Class levels seeded.');
    }
}

