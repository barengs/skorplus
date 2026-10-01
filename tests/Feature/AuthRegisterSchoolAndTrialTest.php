<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthRegisterSchoolAndTrialTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'web']);
    }

    public function test_registration_fails_if_school_id_missing(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Siswa Baru',
            'email' => 'siswa.baru@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'program' => 'intensif',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['school_id']);
    }

    public function test_registration_fails_if_school_id_does_not_exist(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Siswa Baru',
            'email' => 'siswa.baru@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'school_id' => 999999,
            'program' => 'intensif',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['school_id']);
    }

    public function test_registration_succeeds_with_valid_school_and_gets_free_trial(): void
    {
        $school = School::create([
            'name' => 'SMAN 1 Teladan',
            'npsn' => '12345678',
            'is_active' => true,
        ]);

        Setting::updateOrCreate(['key' => 'trial_enabled'], ['value' => 'true']);
        Setting::updateOrCreate(['key' => 'trial_days'], ['value' => '7']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ahmad Dahlan',
            'email' => 'ahmad@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'school_id' => $school->id,
            'program' => 'intensif',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.school_id', $school->id)
            ->assertJsonPath('user.school', 'SMAN 1 Teladan')
            ->assertJsonPath('user.trial.is_on_trial', true)
            ->assertJsonPath('user.trial.days_remaining', 7);

        $user = User::where('email', 'ahmad@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals($school->id, $user->school_id);
        $this->assertTrue($user->isOnTrial());
        $this->assertEquals(7, $user->trialDaysRemaining());
    }

    public function test_public_schools_endpoint_returns_only_active_schools(): void
    {
        School::create(['name' => 'SMA Aktif', 'is_active' => true]);
        School::create(['name' => 'SMA Nonaktif', 'is_active' => false]);

        $response = $this->getJson('/api/schools/public');

        $response->assertOk()
            ->assertJsonFragment(['name' => 'SMA Aktif'])
            ->assertJsonMissing(['name' => 'SMA Nonaktif']);
    }
}
