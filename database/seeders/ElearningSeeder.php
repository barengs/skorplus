<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Module;
use App\Models\Lesson;

class ElearningSeeder extends Seeder
{
    public function run(): void
    {
        $course1 = Course::create([
            'title' => 'Penalaran Umum (TPS)',
            'slug' => 'penalaran-umum-tps',
            'category' => 'TPS UTBK-SNBT',
            'description' => 'Persiapan komprehensif menguasai Penalaran Umum untuk UTBK-SNBT.',
            'sort_order' => 1
        ]);

        $course2 = Course::create([
            'title' => 'Pengetahuan Kuantitatif',
            'slug' => 'pengetahuan-kuantitatif',
            'category' => 'TPS UTBK-SNBT',
            'description' => 'Strategi cepat dan tepat menjawab soal matematika dasar.',
            'sort_order' => 2
        ]);

        $module1 = Module::create(['course_id' => $course1->id, 'title' => 'Bab 1: Silogisme & Logika Posisi', 'sort_order' => 1]);
        $module2 = Module::create(['course_id' => $course1->id, 'title' => 'Bab 2: Analitik Geometri', 'sort_order' => 2]);

        Lesson::create([
            'module_id' => $module1->id,
            'title' => 'Pengantar Silogisme',
            'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Dummy video
            'duration_seconds' => 900,
            'summary' => 'Dasar penarikan kesimpulan modus ponens, tollens, dan silogisme.',
            'sort_order' => 1
        ]);

        Lesson::create([
            'module_id' => $module1->id,
            'title' => 'Latihan Soal Silogisme',
            'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            'duration_seconds' => 1200,
            'summary' => 'Penerapan pada soal-soal UTBK tahun sebelumnya.',
            'sort_order' => 2
        ]);
        
        $this->command->info('E-Learning data seeded.');
    }
}
