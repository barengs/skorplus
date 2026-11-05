<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $siswa = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        $tutor = Role::firstOrCreate(['name' => 'tutor', 'guard_name' => 'api']);
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $adminSekolah = Role::firstOrCreate(['name' => 'admin_sekolah', 'guard_name' => 'api']);

        // Create demo users
        $demoSiswa = User::firstOrCreate(
            ['email' => 'siswa@skorpluss.com'],
            [
                'name' => 'Fathur Rahman',
                'password' => Hash::make('password'),
                'nisn' => '0064821901',
                'school' => 'SMAN 5 Surabaya',
                'program' => 'intensif',
                'phone' => '08123456789',
                'is_active' => true,
            ]
        );
        $demoSiswa->assignRole($siswa);
        $demoSiswa->syncRoleProfile([
            'role' => 'siswa',
            'phone' => '08123456789',
            'gender' => 'laki-laki',
            'birth_year' => 2008,
            'class_level' => 'Kelas 12 (XII)',
            'target_campus' => 'Institut Teknologi Sepuluh Nopember (ITS)',
            'address' => 'Jl. Kusuma Bangsa No. 21, Surabaya',
            'bio' => 'Fokus persiapan UTBK-SNBT Teknik Informatika ITS.',
        ]);

        $demoTutor = User::firstOrCreate(
            ['email' => 'tutor@skorpluss.com'],
            [
                'name' => 'Dr. Ahmad Fadli',
                'password' => Hash::make('password'),
                'school' => 'Alumni ITB Fisika',
                'program' => 'mandiri',
                'is_active' => true,
            ]
        );
        $demoTutor->assignRole($tutor);
        $demoTutor->syncRoleProfile([
            'role' => 'tutor',
            'specialization' => 'Penalaran Matematika & Kuantitatif',
            'alma_mater' => 'Institut Teknologi Bandung (ITB) - Fisika',
            'phone' => '081290001122',
            'gender' => 'laki-laki',
            'bio' => 'Instruktur senior persiapan UTBK-SNBT & Sains dengan pengalaman mengajar lebih dari 10 tahun.',
        ]);

        $demoAdmin = User::firstOrCreate(
            ['email' => 'admin@skorpluss.com'],
            [
                'name' => 'Admin SkorPluss',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $demoAdmin->assignRole($admin);
        $demoAdmin->syncRoleProfile([
            'role' => 'admin',
            'position' => 'Super Administrator',
            'department' => 'Manajemen Operasional & Akademik',
            'phone' => '08113000999',
            'bio' => 'Pengelola utama platform SkorPluss Learning Center.',
        ]);

        $demoAdminSekolah = User::firstOrCreate(
            ['email' => 'admin.sekolah@skorpluss.com'],
            [
                'name' => 'Admin Sekolah Demo',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $demoAdminSekolah->assignRole($adminSekolah);
        $demoAdminSekolah->syncRoleProfile([
            'role' => 'admin_sekolah',
            'position' => 'Wakasek Bidang Kurikulum & UTBK',
            'nip' => '198405122010011008',
            'phone' => '081331002200',
            'gender' => 'laki-laki',
            'bio' => 'Koordinator program pendampingan UTBK-SNBT sekolah mitra.',
        ]);

        $this->command->info('Roles & demo users seeded:');
        $this->command->info('  siswa@skorpluss.com / password');
        $this->command->info('  tutor@skorpluss.com / password');
        $this->command->info('  admin@skorpluss.com / password');
        $this->command->info('  admin.sekolah@skorpluss.com / password');
    }
}
