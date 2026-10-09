<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\LearningPackage;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class LearningPackageExamRestrictionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
    }

    public function test_admin_can_fetch_exams_list_for_package_form(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = JWTAuth::fromUser($admin);

        Exam::create([
            'title' => 'Simulasi SNBT Paket A',
            'duration_minutes' => 90,
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/learning-packages/exams');

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Simulasi SNBT Paket A');
    }

    public function test_admin_can_create_and_update_package_with_selected_exams(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = JWTAuth::fromUser($admin);

        $exam1 = Exam::create(['title' => 'Exam 1', 'duration_minutes' => 60, 'is_active' => true]);
        $exam2 = Exam::create(['title' => 'Exam 2', 'duration_minutes' => 60, 'is_active' => true]);

        // Create package with exam1
        $createResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/learning-packages', [
                'name' => 'Paket Belajar Khusus SNBT',
                'price' => 300000,
                'is_published' => true,
                'exam_ids' => [$exam1->id],
            ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('name', 'Paket Belajar Khusus SNBT')
            ->assertJsonCount(1, 'exams')
            ->assertJsonPath('exams.0.id', $exam1->id);

        $packageId = $createResponse->json('id');

        // Update package to include exam1 and exam2
        $updateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/admin/learning-packages/{$packageId}", [
                'name' => 'Paket Belajar Khusus SNBT Updated',
                'price' => 350000,
                'is_published' => true,
                'exam_ids' => [$exam1->id, $exam2->id],
            ]);

        $updateResponse->assertOk()
            ->assertJsonCount(2, 'exams');

        // Show package detail
        $showResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/admin/learning-packages/{$packageId}");

        $showResponse->assertOk()
            ->assertJsonCount(2, 'exams');
    }

    public function test_student_in_package_can_only_access_assigned_exams(): void
    {
        $examAllowed = Exam::create([
            'title' => 'Ujian Terbuka Untuk Paket',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);
        $q1 = Question::create([
            'question_text' => 'Soal 1',
            'option_a' => 'A',
            'option_b' => 'B',
            'correct_option' => 'A',
        ]);
        $examAllowed->questions()->attach($q1->id);

        $examRestricted = Exam::create([
            'title' => 'Ujian Terkunci Paket Lain',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);
        $q2 = Question::create([
            'question_text' => 'Soal 2',
            'option_a' => 'A',
            'option_b' => 'B',
            'correct_option' => 'A',
        ]);
        $examRestricted->questions()->attach($q2->id);

        $package = LearningPackage::create([
            'name' => 'Paket Mandiri Emas',
            'slug' => 'paket-mandiri-emas',
            'price' => 500000,
            'is_published' => true,
        ]);
        $package->exams()->attach($examAllowed->id);

        $student = User::factory()->create([
            'program' => 'paket-mandiri-emas',
        ]);
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        // 1. Available exams query: should only include examAllowed
        $resAvailable = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/cbt/available-exams');

        $resAvailable->assertOk();
        $this->assertCount(1, $resAvailable->json('exams'));
        $this->assertEquals($examAllowed->id, $resAvailable->json('exams.0.id'));

        // 2. Start session on allowed exam: should succeed
        $resStartAllowed = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $examAllowed->id,
            ]);

        $resStartAllowed->assertStatus(201)
            ->assertJsonPath('session.exam_id', $examAllowed->id);

        // 3. Start session on restricted exam: should be forbidden (403)
        $resStartRestricted = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $examRestricted->id,
            ]);

        $resStartRestricted->assertStatus(403)
            ->assertJsonPath('not_in_package', true);
    }

    public function test_student_in_package_with_no_exams_selected_cannot_access_any_exams(): void
    {
        $exam = Exam::create([
            'title' => 'Ujian Umum',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);
        $q = Question::create([
            'question_text' => 'Soal Umum',
            'option_a' => 'A',
            'option_b' => 'B',
            'correct_option' => 'A',
        ]);
        $exam->questions()->attach($q->id);

        // Package with NO exams assigned
        $package = LearningPackage::create([
            'name' => 'Paket Tanpa Ujian',
            'slug' => 'paket-tanpa-ujian',
            'price' => 100000,
            'is_published' => true,
        ]);

        $student = User::factory()->create([
            'program' => 'paket-tanpa-ujian',
        ]);
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        // Available exams should be empty
        $resAvailable = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/cbt/available-exams');

        $resAvailable->assertOk();
        $this->assertCount(0, $resAvailable->json('exams'));

        // Attempting to start any exam should be 403
        $resStart = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $exam->id,
            ]);

        $resStart->assertStatus(403)
            ->assertJsonPath('not_in_package', true);
    }
}
