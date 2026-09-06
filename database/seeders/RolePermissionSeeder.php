<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $siswa = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        $tutor = Role::firstOrCreate(['name' => 'tutor', 'guard_name' => 'api']);
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);

        // Create demo users
        $demoSiswa = User::firstOrCreate(
            ['email' => 'siswa@skorpluss.com'],
            [
                'name'     => 'Fathur Rahman',
                'password' => Hash::make('password'),
                'nisn'     => '0064821901',
                'school'   => 'SMAN 8 Jakarta',
                'program'  => 'intensif',
                'phone'    => '08123456789',
                'is_active' => true,
            ]
        );
        $demoSiswa->assignRole($siswa);

        $demoTutor = User::firstOrCreate(
            ['email' => 'tutor@skorpluss.com'],
            [
                'name'     => 'Dr. Ahmad Fadli',
                'password' => Hash::make('password'),
                'school'   => 'Alumni ITB Fisika',
                'program'  => 'mandiri',
                'is_active' => true,
            ]
        );
        $demoTutor->assignRole($tutor);

        $demoAdmin = User::firstOrCreate(
            ['email' => 'admin@skorpluss.com'],
            [
                'name'     => 'Admin SkorPluss',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $demoAdmin->assignRole($admin);

        $this->command->info('Roles & demo users seeded:');
        $this->command->info('  siswa@skorpluss.com / password');
        $this->command->info('  tutor@skorpluss.com / password');
        $this->command->info('  admin@skorpluss.com / password');
    }
}
