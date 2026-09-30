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
        $school = School::firstOrCreate(
            ['npsn' => '20101234'],
            [
                'name' => 'SMAN 1 Bintang Harapan',
                'email' => 'info@sman1bintang.sch.id',
                'phone' => '021-88997766',
                'address' => 'Jl. Pendidikan No. 45, Jakarta Selatan',
                'is_active' => true,
            ]
        );

        // Assign school to demoAdminSekolah
        $adminSekolah = User::where('email', 'admin.sekolah@skorpluss.com')->first();
        if ($adminSekolah) {
            $adminSekolah->update([
                'school_id' => $school->id,
                'school' => $school->name,
            ]);
        }

        // Create sample students for this school
        $siswaRole = Role::where('name', 'siswa')->first();
        $student1 = User::firstOrCreate(
            ['email' => 'budi.santoso@siswa.sch.id'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password'),
                'nisn' => '0081234561',
                'school' => $school->name,
                'school_id' => $school->id,
                'program' => 'intensif',
                'phone' => '081298765432',
                'is_active' => true,
            ]
        );
        $student1->assignRole($siswaRole);

        $student2 = User::firstOrCreate(
            ['email' => 'siti.nurhaliza@siswa.sch.id'],
            [
                'name' => 'Siti Nurhaliza',
                'password' => Hash::make('password'),
                'nisn' => '0081234562',
                'school' => $school->name,
                'school_id' => $school->id,
                'program' => 'mandiri',
                'phone' => '081298765433',
                'is_active' => true,
            ]
        );
        $student2->assignRole($siswaRole);
    }
}
