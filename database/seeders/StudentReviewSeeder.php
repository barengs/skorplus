<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Program;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class StudentReviewSeeder extends Seeder
{
    public function run(): void
    {
        $studentsData = [
            [
                'name' => 'Salsabila Nur',
                'email' => 'salsabila@skorpluss.com',
                'school' => 'MAN 2 Kota Malang',
                'program' => 'intensif',
                'course_slug' => 'penalaran-umum-pu-sma',
                'rating' => 5,
                'comment' => 'Penjelasan tutornya sangat mendalam dan mudah dimengerti. Latihan kuis silogisme dan modulnya benar-benar membantu persiapan UTBK SNBT saya!',
            ],
            [
                'name' => 'Rizky Fadillah',
                'email' => 'rizky@skorpluss.com',
                'school' => 'SMAN 1 Malang',
                'program' => 'garansi',
                'program_slug' => 'garansi',
                'rating' => 5,
                'comment' => 'Simulasi CBT dengan analisis waktu dan jenis soal SNBT 2027 sangat mirip dengan UTBK sesungguhnya. Bikin belajar jadi terarah!',
            ],
            [
                'name' => 'Naura Azahra',
                'email' => 'naura@skorpluss.com',
                'school' => 'SMAN 5 Surabaya',
                'program' => 'intensif',
                'program_slug' => 'intensif',
                'rating' => 5,
                'comment' => 'Fitur forum diskusi dan bimbingan live class mingguan sangat interaktif. Tutor senior alumni PTN selalu cepat tanggap menjawab pertanyaan sulit.',
            ],
            [
                'name' => 'Aditya Pratama',
                'email' => 'aditya@skorpluss.com',
                'school' => 'SMA Katolik St. Louis 1 Surabaya',
                'program' => 'mandiri',
                'course_slug' => 'penalaran-matematika-pm-sma',
                'rating' => 5,
                'comment' => 'Materi Penalaran Matematika disajikan dengan pemodelan kasus nyata. Trik cepatnya sangat aplikatif untuk menghemat waktu saat ujian.',
            ],
            [
                'name' => 'Nadhira Putri',
                'email' => 'nadhira@skorpluss.com',
                'school' => 'SMAN 1 Sidoarjo',
                'program' => 'intensif',
                'course_slug' => 'literasi-bahasa-indonesia-sma',
                'rating' => 5,
                'comment' => 'Modul Literasi Bahasa Indonesia super lengkap! Dari ide pokok wacana panjang hingga kaidah EYD V dibahas tuntas dan sistematis.',
            ],
        ];

        foreach ($studentsData as $item) {
            $user = User::firstOrCreate(
                ['email' => $item['email']],
                [
                    'name' => $item['name'],
                    'password' => Hash::make('password123'),
                    'school' => $item['school'],
                    'program' => $item['program'],
                    'is_active' => true,
                ]
            );

            $role = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
            if (! $user->hasRole($role)) {
                $user->assignRole($role);
            }

            if (! empty($item['course_slug'])) {
                $course = Course::where('slug', $item['course_slug'])->first();
                if ($course) {
                    Review::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'reviewable_type' => Course::class,
                            'reviewable_id' => $course->id,
                        ],
                        [
                            'rating' => $item['rating'],
                            'comment' => $item['comment'],
                            'is_published' => true,
                        ]
                    );
                    Review::recalculateFor($course);
                }
            } elseif (! empty($item['program_slug'])) {
                $program = Program::where('slug', $item['program_slug'])->first();
                if ($program) {
                    Review::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'reviewable_type' => Program::class,
                            'reviewable_id' => $program->id,
                        ],
                        [
                            'rating' => $item['rating'],
                            'comment' => $item['comment'],
                            'is_published' => true,
                        ]
                    );
                    Review::recalculateFor($program);
                }
            }
        }
    }
}
