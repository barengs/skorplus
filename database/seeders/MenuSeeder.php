<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $siswa = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        $tutor = Role::firstOrCreate(['name' => 'tutor', 'guard_name' => 'api']);
        $adminSekolah = Role::firstOrCreate(['name' => 'admin_sekolah', 'guard_name' => 'api']);

        $menus = [
            // Main
            ['label' => 'Beranda', 'path' => '/dashboard', 'icon' => 'fa-house', 'section' => 'main', 'sort_order' => 1, 'roles' => array_values(array_filter([$admin->id, $siswa->id, $tutor->id, $adminSekolah->id]))],
            ['label' => 'Ujian CBT', 'path' => '/cbt', 'icon' => 'fa-file-signature', 'section' => 'main', 'sort_order' => 2, 'roles' => array_values(array_filter([$siswa->id]))],
            ['label' => 'Data Siswa', 'path' => '/school-admin/students', 'icon' => 'fa-user-graduate', 'section' => 'main', 'sort_order' => 3, 'roles' => array_values(array_filter([$adminSekolah->id]))],
            ['label' => 'E-Learning', 'path' => '/elearning', 'icon' => 'fa-video', 'section' => 'main', 'sort_order' => 4, 'roles' => array_values(array_filter([$siswa->id]))],
            ['label' => 'Forum Tanya Jawab', 'path' => '/forum', 'icon' => 'fa-comments', 'section' => 'main', 'sort_order' => 5, 'roles' => array_values(array_filter([$admin->id, $siswa->id, $tutor->id, $adminSekolah->id]))],

            // System
            ['label' => 'Kelola Pengguna', 'path' => '/admin/users', 'icon' => 'fa-users', 'section' => 'system', 'sort_order' => 1, 'roles' => array_values(array_filter([$admin->id]))],
            ['label' => 'Kelola Sekolah', 'path' => '/admin/schools', 'icon' => 'fa-school', 'section' => 'system', 'sort_order' => 2, 'roles' => array_values(array_filter([$admin->id]))],
            ['label' => 'Profil Sekolah', 'path' => '/school-admin/profile', 'icon' => 'fa-school', 'section' => 'system', 'sort_order' => 3, 'roles' => array_values(array_filter([$adminSekolah->id]))],
            ['label' => 'Kelola Program/Paket', 'path' => '/admin/learning-packages', 'icon' => 'fa-cubes', 'section' => 'system', 'sort_order' => 4, 'roles' => array_values(array_filter([$admin->id]))],
            ['label' => 'Kelola Ujian & Soal', 'path' => '/admin/cbt', 'icon' => 'fa-list-check', 'section' => 'system', 'sort_order' => 5, 'roles' => array_values(array_filter([$admin->id, $tutor->id]))],
            ['label' => 'Kelola E-Learning', 'path' => '/admin/elearning', 'icon' => 'fa-book-open-reader', 'section' => 'system', 'sort_order' => 6, 'roles' => array_values(array_filter([$admin->id, $tutor->id]))],
            ['label' => 'Kelola Landing Page', 'path' => '/admin/landing', 'icon' => 'fa-palette', 'section' => 'system', 'sort_order' => 7, 'roles' => array_values(array_filter([$admin->id]))],
            ['label' => 'Kelola Role & Menu', 'path' => '/admin/roles', 'icon' => 'fa-user-shield', 'section' => 'system', 'sort_order' => 8, 'roles' => array_values(array_filter([$admin->id]))],
            ['label' => 'Audit & Laporan', 'path' => '/admin/audit', 'icon' => 'fa-shield-halved', 'section' => 'system', 'sort_order' => 9, 'roles' => array_values(array_filter([$admin->id]))],
            ['label' => 'Pengaturan', 'path' => '/admin/settings', 'icon' => 'fa-gear', 'section' => 'system', 'sort_order' => 10, 'roles' => array_values(array_filter([$admin->id]))],
        ];

        foreach ($menus as $m) {
            $menu = Menu::updateOrCreate(
                ['path' => $m['path']],
                [
                    'label' => $m['label'],
                    'icon' => $m['icon'],
                    'section' => $m['section'],
                    'sort_order' => $m['sort_order'],
                    'is_active' => true,
                ]
            );
            $menu->roles()->sync($m['roles']);
        }

        $this->command->info('Menus & Matrix seeded.');
    }
}
