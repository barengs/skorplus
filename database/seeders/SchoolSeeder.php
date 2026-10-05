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
        // Daftar Sekolah Unggulan di Wilayah Jawa Timur
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
            [
                'npsn' => '20532250',
                'name' => 'SMAN 2 Surabaya',
                'email' => 'info@sman2surabaya.sch.id',
                'phone' => '031-5345156',
                'address' => 'Jl. Wijaya Kusuma No. 48, Genteng, Kota Surabaya, Jawa Timur 60272',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20532251',
                'name' => 'SMAN 1 Surabaya',
                'email' => 'info@sman1surabaya.sch.id',
                'phone' => '031-5345157',
                'address' => 'Jl. Wijaya Kusuma No. 48, Genteng, Kota Surabaya, Jawa Timur 60272',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20532247',
                'name' => 'SMA Katolik St. Louis 1 Surabaya',
                'email' => 'info@stlouis1eu.sch.id',
                'phone' => '031-5676522',
                'address' => 'Jl. M.H. Thamrin No. 2, Dr. Soetomo, Tegalsari, Kota Surabaya, Jawa Timur 60264',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20501712',
                'name' => 'SMAN 1 Sidoarjo',
                'email' => 'info@sman1sidoarjo.sch.id',
                'phone' => '031-8941012',
                'address' => 'Jl. Jenggolo No. 1, Pucang, Kabupaten Sidoarjo, Jawa Timur 61219',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20500473',
                'name' => 'SMAN 1 Gresik',
                'email' => 'info@sman1gresik.sch.id',
                'phone' => '031-3981881',
                'address' => 'Jl. Arif Rahman Hakim No. 1, Sidokumpul, Kabupaten Gresik, Jawa Timur 61111',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20534394',
                'name' => 'SMAN 1 Kediri',
                'email' => 'info@sman1kediri.sch.id',
                'phone' => '0354-771182',
                'address' => 'Jl. Veteran No. 1, Mojoroto, Kota Kediri, Jawa Timur 64112',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20523829',
                'name' => 'SMAN 1 Jember',
                'email' => 'info@sman1jember.sch.id',
                'phone' => '0331-488345',
                'address' => 'Jl. Letjen Panjaitan No. 55, Sumbersari, Kabupaten Jember, Jawa Timur 68121',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20534125',
                'name' => 'SMAN 2 Madiun',
                'email' => 'info@sman2madiun.sch.id',
                'phone' => '0351-462341',
                'address' => 'Jl. Biliton No. 24, Madiun Lor, Kota Madiun, Jawa Timur 63122',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20580045',
                'name' => 'MAN 2 Kota Malang',
                'email' => 'info@man2kotamalang.sch.id',
                'phone' => '0341-551357',
                'address' => 'Jl. Bandung No. 7, Penanggungan, Klojen, Kota Malang, Jawa Timur 65113',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20525586',
                'name' => 'SMAN 1 Glagah Banyuwangi',
                'email' => 'info@sman1glagah.sch.id',
                'phone' => '0333-421345',
                'address' => 'Jl. Melati No. 1, Glagah, Kabupaten Banyuwangi, Jawa Timur 68432',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '69856916',
                'name' => 'SMA TrenSains Tebuireng Jombang',
                'email' => 'info@trensains.sch.id',
                'phone' => '0321-861123',
                'address' => 'Jl. Raya Tebuireng, Cukir, Diwek, Kabupaten Jombang, Jawa Timur 61471',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '20541249',
                'name' => 'SMAN 1 Bojonegoro',
                'email' => 'info@sman1bojonegoro.sch.id',
                'phone' => '0353-881234',
                'address' => 'Jl. Panglima Polim No. 13, Sukorejo, Kabupaten Bojonegoro, Jawa Timur 62115',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
            [
                'npsn' => '071068',
                'name' => 'Universitas Islam Madura (UIM Pamekasan)',
                'email' => 'info@uim.ac.id',
                'phone' => '0324-321746',
                'address' => 'Jl. Raya Bettet No. 4, Bettet, Kec. Pamekasan, Kabupaten Pamekasan, Jawa Timur 69317',
                'logo' => '/storage/schools/logo_sman1.jpg',
                'photo' => '/storage/schools/building_sman1.jpg',
                'is_active' => true,
            ],
        ];

        $primarySchool = null;
        foreach ($schoolsData as $index => $item) {
            $created = School::updateOrCreate(
                ['npsn' => $item['npsn']],
                $item
            );
            if ($index === 0) {
                $primarySchool = $created;
            }
        }

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

        // Assign a sample learning package to SMAN 5 Surabaya
        $firstPackage = LearningPackage::first();
        if ($firstPackage && $primarySchool) {
            $schoolPackage = SchoolLearningPackage::updateOrCreate(
                [
                    'school_id' => $primarySchool->id,
                    'learning_package_id' => $firstPackage->id,
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
                    'school_learning_package_id' => $schoolPackage->id,
                    'contract_number' => 'KTR/2026/01/SMAN5-SBY-001',
                ],
                [
                    'renewal_type' => 'initial',
                    'previous_end_date' => null,
                    'new_end_date' => now()->addMonths(10)->toDateString(),
                    'quota_students' => 150,
                    'renewed_by' => 1,
                    'renewal_date' => now()->subMonths(2)->toDateString(),
                    'notes' => 'Kontrak kerja sama kemitraan bimbel persiapan UTBK-SNBT 2027 untuk SMAN 5 Surabaya.',
                ]
            );
        }

        // Create sample student and package for UIM Pamekasan
        $uimSchool = School::where('npsn', '071068')->first();
        if ($uimSchool) {
            $studentUim = User::updateOrCreate(
                ['email' => 'calon.informatika@uim.ac.id'],
                [
                    'name' => 'Achmad Fauzi (Informatika UIM)',
                    'password' => Hash::make('password'),
                    'nisn' => '0087654321',
                    'school' => $uimSchool->name,
                    'school_id' => $uimSchool->id,
                    'program' => 'intensif',
                    'phone' => '082334567890',
                    'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                    'is_active' => true,
                ]
            );
            $studentUim->assignRole($siswaRole);

            if ($firstPackage) {
                $uimPackage = SchoolLearningPackage::updateOrCreate(
                    [
                        'school_id' => $uimSchool->id,
                        'learning_package_id' => $firstPackage->id,
                    ],
                    [
                        'current_contract_number' => 'KTR/2026/01/UIM-PMK-001',
                        'start_date' => now()->subMonth()->toDateString(),
                        'end_date' => now()->addYear()->toDateString(),
                        'max_students' => 200,
                        'status' => 'active',
                    ]
                );

                SchoolContractRenewal::firstOrCreate(
                    [
                        'school_learning_package_id' => $uimPackage->id,
                        'contract_number' => 'KTR/2026/01/UIM-PMK-001',
                    ],
                    [
                        'renewal_type' => 'initial',
                        'previous_end_date' => null,
                        'new_end_date' => now()->addYear()->toDateString(),
                        'quota_students' => 200,
                        'renewed_by' => 1,
                        'renewal_date' => now()->subMonth()->toDateString(),
                        'notes' => 'Kerja sama pelaksanaan Tes Potensi Akademik dan CBT UIM Pamekasan.',
                    ]
                );
            }
        }
    }
}
