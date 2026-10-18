<?php

namespace Database\Seeders;

use App\Models\LearningPackage;
use App\Models\School;
use App\Models\SchoolContractRenewal;
use App\Models\SchoolLearningPackage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        // Daftar 3 Sekolah Unggulan Mitra Jawa Timur untuk Uji Coba
        $schoolsData = [
            [
                'npsn' => '20532252',
                'name' => 'SMAN 5 Surabaya',
                'email' => 'info@sman5surabaya.sch.id',
                'phone' => '031-5345155',
                'address' => 'Jl. Kusuma Bangsa No. 21, Genteng, Kota Surabaya, Jawa Timur 60272',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20533660',
                'name' => 'SMAN 1 Malang',
                'email' => 'info@sman1malang.sch.id',
                'phone' => '0341-366454',
                'address' => 'Jl. Tugu No. 1, Klojen, Kota Malang, Jawa Timur 65111',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20533662',
                'name' => 'SMAN 3 Malang',
                'email' => 'info@sman3malang.sch.id',
                'phone' => '0341-362621',
                'address' => 'Jl. Sultan Agung No. 7, Klojen, Kota Malang, Jawa Timur 65111',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
        ];

        $schools = [];
        foreach ($schoolsData as $index => $item) {
            $created = School::updateOrCreate(
                ['npsn' => $item['npsn']],
                $item
            );
            $schools[] = $created;
        }

        $primarySchool = $schools[0] ?? null;
        $secondSchool = $schools[1] ?? null;
        $thirdSchool = $schools[2] ?? null;

        // Assign school primer (SMAN 5 Surabaya) to demoAdminSekolah
        $adminSekolah = User::where('email', 'admin.sekolah@skorpluss.com')->first();
        if ($adminSekolah && $primarySchool) {
            $adminSekolah->update([
                'school_id' => $primarySchool->id,
                'school' => $primarySchool->name,
                'avatar' => '/storage/avatars/admin_sekolah.jpg',
            ]);
        }

        // Create sample students for SMAN 5 Surabaya
        $siswaRole = Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        if ($primarySchool) {
            $student1 = User::updateOrCreate(
                ['email' => 'budi.santoso@siswa.sch.id'],
                [
                    'name' => 'Budi Santoso',
                    'password' => Hash::make('password'),
                    'nisn' => '0081234561',
                    'school' => $primarySchool->name,
                    'school_id' => $primarySchool->id,
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
                    'school' => $primarySchool->name,
                    'school_id' => $primarySchool->id,
                    'program' => 'mandiri',
                    'phone' => '081298765433',
                    'avatar' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
                    'is_active' => true,
                ]
            );
            $student2->assignRole($siswaRole);
        }

        // Assign learning packages to the 3 schools
        $packages = LearningPackage::all();
        $pkg1 = $packages->get(0);
        $pkg2 = $packages->get(1);
        $pkg3 = $packages->get(2);

        // School 1 (SMAN 5 Surabaya) -> Package 1
        if ($primarySchool && $pkg1) {
            $schoolPackage1 = SchoolLearningPackage::updateOrCreate(
                [
                    'school_id' => $primarySchool->id,
                    'learning_package_id' => $pkg1->id,
                ],
                [
                    'current_contract_number' => 'KTR/2026/01/SMAN5-SBY-001',
                    'start_date' => now()->subMonths(2)->toDateString(),
                    'end_date' => now()->addMonths(10)->toDateString(),
                    'max_students' => 150,
                    'status' => 'active',
                ]
            );

            SchoolContractRenewal::firstOrCreate(
                [
                    'school_learning_package_id' => $schoolPackage1->id,
                    'contract_number' => 'KTR/2026/01/SMAN5-SBY-001',
                ],
                [
                    'renewal_type' => 'initial',
                    'previous_end_date' => null,
                    'new_end_date' => now()->addMonths(10)->toDateString(),
                    'quota_students' => 150,
                    'renewed_by' => 1,
                    'renewal_date' => now()->subMonths(2)->toDateString(),
                    'notes' => 'Kontrak kemitraan bimbel persiapan UTBK-SNBT 2027 untuk SMAN 5 Surabaya.',
                ]
            );
        }

        // School 2 (SMAN 1 Malang) -> Package 2 + Student 3
        if ($secondSchool) {
            $student3 = User::updateOrCreate(
                ['email' => 'achmad.fauzi@siswa.sch.id'],
                [
                    'name' => 'Achmad Fauzi',
                    'password' => Hash::make('password'),
                    'nisn' => '0087654321',
                    'school' => $secondSchool->name,
                    'school_id' => $secondSchool->id,
                    'program' => 'intensif',
                    'phone' => '082334567890',
                    'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                    'is_active' => true,
                ]
            );
            $student3->assignRole($siswaRole);

            if ($pkg2) {
                $schoolPackage2 = SchoolLearningPackage::updateOrCreate(
                    [
                        'school_id' => $secondSchool->id,
                        'learning_package_id' => $pkg2->id,
                    ],
                    [
                        'current_contract_number' => 'KTR/2026/01/SMAN1-MLG-001',
                        'start_date' => now()->subMonth()->toDateString(),
                        'end_date' => now()->addYear()->toDateString(),
                        'max_students' => 120,
                        'status' => 'active',
                    ]
                );

                SchoolContractRenewal::firstOrCreate(
                    [
                        'school_learning_package_id' => $schoolPackage2->id,
                        'contract_number' => 'KTR/2026/01/SMAN1-MLG-001',
                    ],
                    [
                        'renewal_type' => 'initial',
                        'previous_end_date' => null,
                        'new_end_date' => now()->addYear()->toDateString(),
                        'quota_students' => 120,
                        'renewed_by' => 1,
                        'renewal_date' => now()->subMonth()->toDateString(),
                        'notes' => 'Kemitraan pelatihan literasi dan CBT untuk SMAN 1 Malang.',
                    ]
                );
            }
        }

        // School 3 (SMAN 3 Malang) -> Package 3
        if ($thirdSchool && $pkg3) {
            $schoolPackage3 = SchoolLearningPackage::updateOrCreate(
                [
                    'school_id' => $thirdSchool->id,
                    'learning_package_id' => $pkg3->id,
                ],
                [
                    'current_contract_number' => 'KTR/2026/01/SMAN3-MLG-001',
                    'start_date' => now()->subMonth()->toDateString(),
                    'end_date' => now()->addYear()->toDateString(),
                    'max_students' => 100,
                    'status' => 'active',
                ]
            );

            SchoolContractRenewal::firstOrCreate(
                [
                    'school_learning_package_id' => $schoolPackage3->id,
                    'contract_number' => 'KTR/2026/01/SMAN3-MLG-001',
                ],
                [
                    'renewal_type' => 'initial',
                    'previous_end_date' => null,
                    'new_end_date' => now()->addYear()->toDateString(),
                    'quota_students' => 100,
                    'renewed_by' => 1,
                    'renewal_date' => now()->subMonth()->toDateString(),
                    'notes' => 'Kemitraan paket mandiri UTBK untuk SMAN 3 Malang.',
                ]
            );
        }
    }
}
