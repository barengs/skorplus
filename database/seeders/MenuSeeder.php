<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use Spatie\Permission\Models\Role;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::where('name', 'admin')->first();
        $siswa = Role::where('name', 'siswa')->first();
        $tutor = Role::where('name', 'tutor')->first();

        $menus = [
            // Main
            ['label' => 'Beranda', 'path' => '/dashboard', 'icon' => 'fa-house', 'section' => 'main', 'sort_order' => 1, 'roles' => [$admin->id, $siswa->id, $tutor->id]],
            ['label' => 'Ujian CBT', 'path' => '/cbt', 'icon' => 'fa-file-signature', 'section' => 'main', 'sort_order' => 2, 'roles' => [$siswa->id]],
            ['label' => 'E-Learning', 'path' => '/elearning', 'icon' => 'fa-video', 'section' => 'main', 'sort_order' => 4, 'roles' => [$siswa->id]],
            ['label' => 'Forum Tanya Jawab', 'path' => '/forum', 'icon' => 'fa-comments', 'section' => 'main', 'sort_order' => 5, 'roles' => [$admin->id, $siswa->id, $tutor->id]],

            // System
            ['label' => 'Kelola Pengguna', 'path' => '/admin/users', 'icon' => 'fa-users', 'section' => 'system', 'sort_order' => 1, 'roles' => [$admin->id]],
            ['label' => 'Kelola Program/Paket', 'path' => '/admin/learning-packages', 'icon' => 'fa-cubes', 'section' => 'system', 'sort_order' => 2, 'roles' => [$admin->id]],
            ['label' => 'Kelola Ujian & Soal', 'path' => '/admin/cbt', 'icon' => 'fa-list-check', 'section' => 'system', 'sort_order' => 3, 'roles' => [$admin->id, $tutor->id]],
            ['label' => 'Kelola E-Learning', 'path' => '/admin/elearning', 'icon' => 'fa-book-open-reader', 'section' => 'system', 'sort_order' => 4, 'roles' => [$admin->id, $tutor->id]],
            ['label' => 'Kelola Landing Page', 'path' => '/admin/landing', 'icon' => 'fa-palette', 'section' => 'system', 'sort_order' => 5, 'roles' => [$admin->id]],
            ['label' => 'Kelola Role & Menu', 'path' => '/admin/roles', 'icon' => 'fa-user-shield', 'section' => 'system', 'sort_order' => 6, 'roles' => [$admin->id]],
            ['label' => 'Pengaturan', 'path' => '/admin/settings', 'icon' => 'fa-gear', 'section' => 'system', 'sort_order' => 7, 'roles' => [$admin->id]],
        ];

        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        \Illuminate\Support\Facades\DB::table('menu_role')->truncate();
        Menu::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        foreach ($menus as $m) {
            $menu = Menu::create([
                'label' => $m['label'],
                'path' => $m['path'],
                'icon' => $m['icon'],
                'section' => $m['section'],
                'sort_order' => $m['sort_order'],
            ]);
            $menu->roles()->sync($m['roles']);
        }
        
        $this->command->info('Menus & Matrix seeded.');
    }
}
