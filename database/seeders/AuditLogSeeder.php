<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Course;
use App\Models\Exam;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('admin', 'api')->first() ?? User::first();
        $tutor = User::role('tutor', 'api')->first();
        $siswa = User::role('siswa', 'api')->first();
        $adminSekolah = User::role('admin_sekolah', 'api')->first();

        $course = Course::first();
        $exam = Exam::first();
        $school = School::first();

        $sampleLogs = [
            [
                'user_id' => $admin?->id,
                'user_name' => $admin?->name ?? 'Admin SkorPluss',
                'user_role' => 'admin',
                'action' => 'LOGIN',
                'module' => 'auth',
                'description' => 'Admin berhasil melakukan autentikasi login ke dashboard manajemen SkorPluss.',
                'ip_address' => '127.0.0.1',
                'created_at' => now()->subDays(3)->addHours(1),
            ],
            [
                'user_id' => $admin?->id,
                'user_name' => $admin?->name ?? 'Admin SkorPluss',
                'user_role' => 'admin',
                'action' => 'CREATE_SCHOOL',
                'module' => 'school',
                'description' => 'Menambahkan mitra sekolah baru wilayah Jawa Timur: '.($school?->name ?? 'SMAN 5 Surabaya'),
                'entity_type' => 'School',
                'entity_id' => $school?->id,
                'ip_address' => '127.0.0.1',
                'created_at' => now()->subDays(2)->addHours(3),
            ],
            [
                'user_id' => $adminSekolah?->id,
                'user_name' => $adminSekolah?->name ?? 'Admin Sekolah Demo',
                'user_role' => 'admin_sekolah',
                'action' => 'IMPORT_STUDENTS',
                'module' => 'school',
                'description' => 'Mengimpor berkas Excel siswa baru sebanyak 50 data siswa persiapan SNBT 2027.',
                'entity_type' => 'School',
                'entity_id' => $school?->id,
                'metadata' => ['imported_count' => 50],
                'ip_address' => '114.122.45.67',
                'created_at' => now()->subDays(2)->addHours(4),
            ],
            [
                'user_id' => $siswa?->id,
                'user_name' => $siswa?->name ?? 'Fathur Rahman',
                'user_role' => 'siswa',
                'action' => 'LOGIN',
                'module' => 'auth',
                'description' => 'Siswa login ke aplikasi SkorPluss dari perangkat Web Browser.',
                'ip_address' => '180.241.11.89',
                'created_at' => now()->subDays(1)->addHours(2),
            ],
            [
                'user_id' => $siswa?->id,
                'user_name' => $siswa?->name ?? 'Fathur Rahman',
                'user_role' => 'siswa',
                'action' => 'ENROLL_COURSE',
                'module' => 'elearning',
                'description' => 'Mendaftar pada kursus: '.($course?->title ?? 'Penalaran Umum (PU) SMA'),
                'entity_type' => 'Course',
                'entity_id' => $course?->id,
                'ip_address' => '180.241.11.89',
                'created_at' => now()->subDays(1)->addHours(3),
            ],
            [
                'user_id' => $siswa?->id,
                'user_name' => $siswa?->name ?? 'Fathur Rahman',
                'user_role' => 'siswa',
                'action' => 'SUBMIT_EXAM',
                'module' => 'cbt',
                'description' => 'Menyelesaikan sesi ujian CBT: '.($exam?->title ?? 'Simulasi Akbar CBT Uji Kompetensi SNBT 2027').' dengan perolehan skor 88.5 pts.',
                'entity_type' => 'Exam',
                'entity_id' => $exam?->id,
                'metadata' => ['score' => 88.5, 'status' => 'submitted'],
                'ip_address' => '180.241.11.89',
                'created_at' => now()->subHours(5),
            ],
            [
                'user_id' => $tutor?->id,
                'user_name' => $tutor?->name ?? 'Dr. Ahmad Fadli',
                'user_role' => 'tutor',
                'action' => 'UPDATE_CURRICULUM',
                'module' => 'elearning',
                'description' => 'Memperbarui materi silabus dan bank soal kuis persiapan UTBK SNBT 2027.',
                'entity_type' => 'Course',
                'entity_id' => $course?->id,
                'ip_address' => '36.72.10.12',
                'created_at' => now()->subHours(2),
            ],
            [
                'user_id' => $admin?->id,
                'user_name' => $admin?->name ?? 'Admin SkorPluss',
                'user_role' => 'admin',
                'action' => 'EXPORT_STUDENTS',
                'module' => 'school',
                'description' => 'Mengekspor laporan data siswa sekolah '.($school?->name ?? 'SMAN 5 Surabaya').' ke format Excel.',
                'entity_type' => 'School',
                'entity_id' => $school?->id,
                'ip_address' => '127.0.0.1',
                'created_at' => now()->subMinutes(30),
            ],
        ];

        foreach ($sampleLogs as $log) {
            AuditLog::create($log);
        }
    }
}
