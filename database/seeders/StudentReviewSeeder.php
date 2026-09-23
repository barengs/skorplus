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
                'school' => 'MAN 2 Surabaya',
                'program' => 'intensif',
                'course_slug' => 'penalaran-umum-tps',
                'rating' => 5,
                'comment' => 'Penjelasan tutornya sangat mendalam dan mudah dimengerti. Latihan kuis dan modulnya benar-benar membantu persiapan UTBK saya!',
            ],
            [
                'name' => 'Rizky Fadillah',
                'email' => 'rizky@skorpluss.com',
                'school' => 'SMAN 1 Yogyakarta',
                'program' => 'garansi',
                'program_slug' => 'garansi',
                'rating' => 5,
                'comment' => 'Simulasi CBT dengan sistem IRT-nya sangat mirip dengan UTBK asli. Analitik kelemahannya bikin belajar jadi jauh lebih terarah.',
            ],
            [
                'name' => 'Naura Azahra',
                'email' => 'naura@skorpluss.com',
                'school' => 'SMAN 8 Jakarta',
                'program' => 'intensif',
                'program_slug' => 'intensif',
                'rating' => 5,
                'comment' => 'Fitur forum diskusi dan sesi live class mingguan sangat interaktif. Tutornya selalu cepat tanggap menjawab pertanyaan-pertanyaan sulit.',
            ],
            [
                'name' => 'Aditya Pratama',
                'email' => 'aditya@skorpluss.com',
                'school' => 'SMAN 3 Bandung',
                'program' => 'mandiri',
                'course_slug' => 'claude-ai-jago-kecerdasan-buatan-ai-dari-nol-hingga-mahir',
                'rating' => 5,
                'comment' => 'Materi videonya ringkas, padat, dan to the point. Belajar mandiri jadi jauh lebih teratur dan tidak membosankan.',
            ],
            [
                'name' => 'Nadhira Putri',
                'email' => 'nadhira@skorpluss.com',
                'school' => 'SMA Labschool Jakarta',
                'program' => 'intensif',
                'course_slug' => 'mastering-n8n-dari-nol-sampai-mahir-automation-ai',
                'rating' => 5,
                'comment' => 'Sangat suka dengan silabus terstrukturnya. Dari konsep dasar sampai studi kasus langsung dipraktikkan dengan jelas.',
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
