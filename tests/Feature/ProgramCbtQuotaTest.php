<?php

namespace Tests\Feature;

use App\Models\CbtSession;
use App\Models\Exam;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ProgramCbtQuotaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'web']);
    }

    public function test_admin_can_save_learning_package_with_cbt_quota(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = JWTAuth::fromUser($admin);

        $payload = [
            'name' => 'Paket Super Intensif CBT',
            'description' => 'Paket persiapan ujian dengan latihan intensif',
            'price' => 750000,
            'discount_price' => 600000,
            'cbt_quota' => 2,
            'features' => ['Akses 2x CBT', 'Modul Lengkap'],
            'is_published' => true,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/learning-packages', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('learning_packages', [
            'name' => 'Paket Super Intensif CBT',
            'cbt_quota' => 2,
        ]);
    }

    public function test_student_cbt_quota_enforced_on_start_session(): void
    {
        $program = Program::create([
            'name' => 'Intensif',
            'slug' => 'intensif',
            'price' => 'Rp 500.000',
            'cbt_quota' => 2, // Max 2x CBT
            'is_active' => true,
        ]);

        $student = User::factory()->create([
            'program' => 'intensif',
        ]);
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Simulasi UTBK SNBT 1',
            'duration_minutes' => 90,
            'is_active' => true,
        ]);

        // Session 1: allowed
        $res1 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $exam->id,
                'exam_type' => 'REAL',
                'exam_title' => $exam->title,
                'duration_seconds' => 5400,
            ]);
        $res1->assertStatus(201);

        // Session 2: allowed
        $res2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $exam->id,
                'exam_type' => 'REAL',
                'exam_title' => $exam->title,
                'duration_seconds' => 5400,
            ]);
        $res2->assertStatus(201);

        // Session 3: rejected because quota of 2 is exhausted
        $res3 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $exam->id,
                'exam_type' => 'REAL',
                'exam_title' => $exam->title,
                'duration_seconds' => 5400,
            ]);

        $res3->assertStatus(403);
        $res3->assertJson([
            'limit_reached' => true,
            'quota' => 2,
            'used' => 2,
        ]);
    }

    public function test_student_with_unlimited_program_can_start_sessions_freely(): void
    {
        $program = Program::create([
            'name' => 'Garansi',
            'slug' => 'garansi',
            'price' => 'Rp 1.500.000',
            'cbt_quota' => null, // Unlimited
            'is_active' => true,
        ]);

        $student = User::factory()->create([
            'program' => 'garansi',
        ]);
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Simulasi UTBK SNBT Unlimited',
            'duration_minutes' => 90,
            'is_active' => true,
        ]);

        for ($i = 0; $i < 4; $i++) {
            $res = $this->withHeader('Authorization', "Bearer {$token}")
                ->postJson('/api/cbt/sessions', [
                    'exam_id' => $exam->id,
                    'exam_type' => 'REAL',
                    'exam_title' => $exam->title,
                    'duration_seconds' => 5400,
                ]);
            $res->assertStatus(201);
        }

        $this->assertEquals(4, CbtSession::where('user_id', $student->id)->count());
    }

    public function test_program_detail_returns_user_cbt_usage(): void
    {
        $program = Program::create([
            'name' => 'Mandiri',
            'slug' => 'mandiri',
            'price' => 'Rp 300.000',
            'cbt_quota' => 2,
            'is_active' => true,
        ]);

        $student = User::factory()->create([
            'program' => 'mandiri',
        ]);
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        CbtSession::create([
            'user_id' => $student->id,
            'exam_type' => 'TPS',
            'exam_title' => 'Latihan TPS 1',
            'duration_seconds' => 3600,
            'started_at' => now(),
            'status' => 'submitted',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/programs/mandiri');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'program',
            'courses',
            'all_programs',
            'user_cbt_usage' => [
                'quota',
                'used',
                'remaining',
                'is_limit_reached',
                'is_unlimited',
            ],
        ]);

        $this->assertEquals(2, $response->json('user_cbt_usage.quota'));
        $this->assertEquals(1, $response->json('user_cbt_usage.used'));
        $this->assertEquals(1, $response->json('user_cbt_usage.remaining'));
        $this->assertFalse($response->json('user_cbt_usage.is_limit_reached'));
    }
}
