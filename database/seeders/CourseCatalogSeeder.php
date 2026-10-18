<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Program;
use Illuminate\Database\Seeder;

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

        // 1. Penalaran Umum (PU) SMA
        Course::where('slug', 'penalaran-umum-pu-sma')->update([
            'program_id' => $intensifId,
            'program_name' => 'Program Intensif',
            'instructor_name' => 'Dr. Ahmad Fadli',
            'is_popular' => true,
            'is_bestseller' => true,
        ]);

        // 2. Penalaran Matematika (PM) SMA
        Course::where('slug', 'penalaran-matematika-pm-sma')->update([
            'program_id' => $garansiId,
            'program_name' => 'Program Garansi',
            'instructor_name' => 'Siti Rahmawati, M.Si.',
            'is_popular' => true,
            'is_bestseller' => true,
        ]);

        // 3. Literasi Bahasa Indonesia SMA
        Course::where('slug', 'literasi-bahasa-indonesia-sma')->update([
            'program_id' => $mandiriId,
            'program_name' => 'Program Mandiri',
            'instructor_name' => 'Dr. Rina Astuti',
            'is_popular' => true,
            'is_bestseller' => false,
        ]);
    }
}
