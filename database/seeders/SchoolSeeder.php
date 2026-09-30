<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::updateOrCreate(
            ['npsn' => '20101234'],
            [
                'name' => 'SMAN 1 Bintang Harapan',
                'email' => 'info@sman1bintang.sch.id',
                'phone' => '021-88997766',
                'address' => 'Jl. Pendidikan No. 45, Jakarta Selatan',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ]
        );

        // Assign school to demoAdminSekolah
        $adminSekolah = User::where('email', 'admin.sekolah@skorpluss.com')->first();
        if ($adminSekolah) {
            $adminSekolah->update([
                'school_id' => $school->id,
                'school' => $school->name,
                'avatar' => '/storage/avatars/admin_sekolah.jpg',
            ]);
        }

        // Create sample students for this school
        $siswaRole = Role::where('name', 'siswa')->first();
        $student1 = User::updateOrCreate(
            ['email' => 'budi.santoso@siswa.sch.id'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password'),
                'nisn' => '0081234561',
                'school' => $school->name,
                'school_id' => $school->id,
                'program' => 'intensif',
                'phone' => '081298765432',
                'avatar' => 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
                'is_active' => true,
            ]
        );
        $student1->assignRole($siswaRole);

        $student2 = User::updateOrCreate(
            ['email' => 'siti.nurhaliza@siswa.sch.id'],
            [
                'name' => 'Siti Nurhaliza',
                'password' => Hash::make('password'),
                'nisn' => '0081234562',
                'school' => $school->name,
                'school_id' => $school->id,
                'program' => 'mandiri',
                'phone' => '081298765433',
                'avatar' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
                'is_active' => true,
            ]
        );
        $student2->assignRole($siswaRole);
    }
}
