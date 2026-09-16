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
        Role::create(['name' => 'admin', 'guard_name' => 'api']);
        Role::create(['name' => 'siswa', 'guard_name' => 'api']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'siswa', 'guard_name' => 'web']);
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
}
