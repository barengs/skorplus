<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'tutor', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'admin_sekolah', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'web']);
    }

    public function test_auth_me_returns_profile_information(): void
    {
        $user = User::factory()->create([
            'name' => 'Andi Wijaya',
            'email' => 'andi@example.com',
            'phone' => '081234567890',
        ]);
        $user->assignRole('siswa');

        UserProfile::create([
            'user_id' => $user->id,
            'phone' => '081234567890',
            'gender' => 'laki-laki',
            'birth_year' => 2006,
            'address' => 'Jl. Merdeka No. 45, Jakarta',
            'social_media' => [
                'instagram' => '@andiwijaya',
                'linkedin' => 'linkedin.com/in/andiwijaya',
            ],
            'bio' => 'Calon mahasiswa Kedokteran UI 2026',
        ]);

        $response = $this->actingAs($user, 'api')->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'name' => 'Andi Wijaya',
                    'email' => 'andi@example.com',
                    'phone' => '081234567890',
                    'gender' => 'laki-laki',
                    'birth_year' => 2006,
                    'address' => 'Jl. Merdeka No. 45, Jakarta',
                    'bio' => 'Calon mahasiswa Kedokteran UI 2026',
                    'social_media' => [
                        'instagram' => '@andiwijaya',
                        'linkedin' => 'linkedin.com/in/andiwijaya',
                    ],
                ],
            ]);
    }

    public function test_user_can_update_profile_and_creates_profile_record(): void
    {
        $user = User::factory()->create([
            'name' => 'Siti Aminah',
            'email' => 'siti@example.com',
            'password' => Hash::make('oldpassword123'),
        ]);
        $user->assignRole('siswa');

        $payload = [
            'name' => 'Siti Aminah Nur',
            'phone' => '08987654321',
            'gender' => 'perempuan',
            'birth_year' => 2005,
            'address' => 'Jl. Kebon Jeruk No. 10, Bandung',
            'bio' => 'Semangat lolos ITB!',
            'social_media' => [
                'instagram' => '@sitiaminah',
                'twitter' => '@sitinur',
            ],
        ];

        $response = $this->actingAs($user, 'api')->putJson('/api/auth/profile', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profil berhasil diperbarui.',
                'user' => [
                    'name' => 'Siti Aminah Nur',
                    'phone' => '08987654321',
                    'gender' => 'perempuan',
                    'birth_year' => 2005,
                    'address' => 'Jl. Kebon Jeruk No. 10, Bandung',
                    'bio' => 'Semangat lolos ITB!',
                    'social_media' => [
                        'instagram' => '@sitiaminah',
                        'twitter' => '@sitinur',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Siti Aminah Nur',
        ]);

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'phone' => '08987654321',
            'gender' => 'perempuan',
            'birth_year' => 2005,
            'address' => 'Jl. Kebon Jeruk No. 10, Bandung',
            'bio' => 'Semangat lolos ITB!',
        ]);
    }

    public function test_user_can_change_password_with_valid_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);
        $user->assignRole('siswa');

        $response = $this->actingAs($user, 'api')->putJson('/api/auth/profile', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }

    public function test_user_cannot_change_password_with_invalid_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);
        $user->assignRole('siswa');

        $response = $this->actingAs($user, 'api')->putJson('/api/auth/profile', [
            'current_password' => 'wrongpassword',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_admin_can_manage_user_with_profile_fields(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')->postJson('/api/admin/users', [
            'name' => 'Budi Santoso',
            'email' => 'budi.santoso@example.com',
            'phone' => '08111222333',
            'program' => 'intensif',
            'gender' => 'laki-laki',
            'birth_year' => 2007,
            'address' => 'Surabaya, Jawa Timur',
            'role' => 'siswa',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'name' => 'Budi Santoso',
                'gender' => 'laki-laki',
                'birth_year' => 2007,
                'address' => 'Surabaya, Jawa Timur',
            ]);

        $this->assertDatabaseHas('user_profiles', [
            'gender' => 'laki-laki',
            'birth_year' => 2007,
            'address' => 'Surabaya, Jawa Timur',
        ]);
    }

    public function test_student_can_update_class_level_and_stores_in_student_profiles(): void
    {
        $student = User::factory()->create([
            'name' => 'Fathur Rahman',
            'email' => 'fathur@example.com',
        ]);
        $student->assignRole('siswa');

        $response = $this->actingAs($student, 'api')->putJson('/api/auth/profile', [
            'name' => 'Fathur Rahman',
            'class_level' => 'Kelas 12 (XII)',
            'target_campus' => 'Institut Teknologi Sepuluh Nopember (ITS)',
            'gender' => 'laki-laki',
            'birth_year' => 2008,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'name' => 'Fathur Rahman',
                    'profile_type' => 'student_profile',
                    'class_level' => 'Kelas 12 (XII)',
                    'target_campus' => 'Institut Teknologi Sepuluh Nopember (ITS)',
                ],
            ]);

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $student->id,
            'class_level' => 'Kelas 12 (XII)',
            'target_campus' => 'Institut Teknologi Sepuluh Nopember (ITS)',
        ]);
    }

    public function test_role_specific_profiles_are_stored_in_separated_tables(): void
    {
        $tutor = User::factory()->create(['name' => 'Dr. Ahmad']);
        $tutor->assignRole('tutor');

        $this->actingAs($tutor, 'api')->putJson('/api/auth/profile', [
            'specialization' => 'Penalaran Matematika',
            'alma_mater' => 'ITB Fisika',
            'phone' => '081200001111',
        ])->assertStatus(200)
            ->assertJsonPath('user.profile_type', 'tutor_profile')
            ->assertJsonPath('user.specialization', 'Penalaran Matematika');

        $this->assertDatabaseHas('tutor_profiles', [
            'user_id' => $tutor->id,
            'specialization' => 'Penalaran Matematika',
            'alma_mater' => 'ITB Fisika',
        ]);

        $schoolAdmin = User::factory()->create(['name' => 'Koordinator SMAN 5']);
        $schoolAdmin->assignRole('admin_sekolah');

        $this->actingAs($schoolAdmin, 'api')->putJson('/api/auth/profile', [
            'position' => 'Wakasek Kurikulum',
            'nip' => '198501012010011001',
        ])->assertStatus(200)
            ->assertJsonPath('user.profile_type', 'school_admin_profile')
            ->assertJsonPath('user.position', 'Wakasek Kurikulum');

        $this->assertDatabaseHas('school_admin_profiles', [
            'user_id' => $schoolAdmin->id,
            'position' => 'Wakasek Kurikulum',
            'nip' => '198501012010011001',
        ]);
    }

    public function test_admin_can_crud_master_class_levels_and_sync_student_profiles(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $createRes = $this->actingAs($admin, 'api')->postJson('/api/admin/class-levels', [
            'name' => 'Kelas 9 SMP',
            'category' => 'SMP/MTs',
            'description' => 'Persiapan masuk SMA Unggulan',
            'sort_order' => 5,
            'is_active' => true,
        ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('class_level.name', 'Kelas 9 SMP');

        $levelId = $createRes->json('class_level.id');

        $student = User::factory()->create();
        $student->assignRole('siswa');
        $student->syncRoleProfile([
            'role' => 'siswa',
            'class_level_id' => $levelId,
        ]);

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $student->id,
            'class_level_id' => $levelId,
            'class_level' => 'Kelas 9 SMP',
        ]);

        // Update class level name and verify automatic sync on student_profiles
        $this->actingAs($admin, 'api')->putJson("/api/admin/class-levels/{$levelId}", [
            'name' => 'Kelas 9 (IX) SMP/MTs',
        ])->assertStatus(200);

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $student->id,
            'class_level_id' => $levelId,
            'class_level' => 'Kelas 9 (IX) SMP/MTs',
        ]);

        // Public list includes active class levels
        $this->getJson('/api/class-levels')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Kelas 9 (IX) SMP/MTs']);
    }
}
