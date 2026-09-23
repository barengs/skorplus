<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamType;
use App\Models\Program;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class CbtDynamicOptionsAndCancelTest extends TestCase
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

    public function test_admin_can_create_question_with_dynamic_options_and_duration(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = JWTAuth::fromUser($admin);

        $exam = Exam::create([
            'title' => 'Ujian TPS Saintek',
            'slug' => 'ujian-tps-saintek',
            'description' => 'Ujian TPS',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);

        // 1. Question with 2 options (Benar / Salah) and 45s duration
        $payload2Options = [
            'question_text' => '<p>Apakah matahari terbit dari timur?</p>',
            'points' => 1,
            'duration_seconds' => 45,
            'options' => [
                ['option_key' => 'A', 'option_text' => 'Benar', 'is_correct' => true],
                ['option_key' => 'B', 'option_text' => 'Salah', 'is_correct' => false],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/cbt/exams/{$exam->id}/questions", $payload2Options);

        $response->assertStatus(201);
        $this->assertDatabaseHas('questions', [
            'duration_seconds' => 45,
        ]);
        $createdQ1 = $exam->questions()->first();
        $this->assertNotNull($createdQ1);
        $this->assertEquals(45, $createdQ1->duration_seconds);
        $this->assertCount(2, $createdQ1->options);

        // 2. Question with 4 options (A-D) and 90s duration
        $payload4Options = [
            'question_text' => '<p>Berapakah hasil dari 2 + 2?</p>',
            'points' => 2,
            'duration_seconds' => 90,
            'options' => [
                ['option_key' => 'A', 'option_text' => '1', 'is_correct' => false],
                ['option_key' => 'B', 'option_text' => '2', 'is_correct' => false],
                ['option_key' => 'C', 'option_text' => '3', 'is_correct' => false],
                ['option_key' => 'D', 'option_text' => '4', 'is_correct' => true],
            ],
        ];

        $response2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/cbt/exams/{$exam->id}/questions", $payload4Options);

        $response2->assertStatus(201);
        $this->assertCount(2, $exam->questions()->get());
        $createdQ2 = $exam->questions()->orderByDesc('id')->first();
        $this->assertEquals(90, $createdQ2->duration_seconds);
        $this->assertCount(4, $createdQ2->options);
    }

    public function test_student_receives_questions_with_duration_seconds_and_without_correct_option(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Tryout Akbar SNBT',
            'slug' => 'tryout-akbar-snbt',
            'description' => 'Tryout',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);

        $q = Question::create([
            'question_text' => 'Soal 1',
            'duration_seconds' => 75,
            'is_active' => true,
        ]);
        $q->options()->createMany([
            ['option_key' => 'A', 'option_text' => 'Pilihan A', 'is_correct' => true],
            ['option_key' => 'B', 'option_text' => 'Pilihan B', 'is_correct' => false],
            ['option_key' => 'C', 'option_text' => 'Pilihan C', 'is_correct' => false],
        ]);
        $exam->questions()->attach($q->id);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $exam->id,
            ]);

        $response->assertStatus(201);
        $data = $response->json();

        $this->assertArrayHasKey('questions', $data);
        $this->assertNotEmpty($data['questions']);

        $firstQ = $data['questions'][0];
        $this->assertEquals(75, $firstQ['duration_seconds']);
        $this->assertArrayNotHasKey('correct_option', $firstQ);
        $this->assertCount(3, $firstQ['options']);
    }

    public function test_student_can_cancel_session_when_no_answers_submitted_and_quota_preserved(): void
    {
        $program = Program::create([
            'name' => 'Reguler',
            'slug' => 'reguler',
            'price' => 'Rp 200.000',
            'cbt_quota' => 1, // Only 1 attempt
            'is_active' => true,
        ]);

        $student = User::factory()->create(['program' => 'reguler']);
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Ujian Singkat',
            'slug' => 'ujian-singkat',
            'duration_minutes' => 30,
            'is_active' => true,
        ]);

        // Start session (attempt 1)
        $startRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id]);
        $startRes->assertStatus(201);
        $sessionId = $startRes->json('session.id');

        // Cancel session before answering
        $cancelRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$sessionId}/cancel");
        $cancelRes->assertStatus(200);

        // Verify session deleted from database
        $this->assertDatabaseMissing('cbt_sessions', ['id' => $sessionId]);

        // Student can start again because quota was preserved
        $startRes2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id]);
        $startRes2->assertStatus(201);
    }

    public function test_student_cannot_cancel_session_after_answering_question(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Ujian TPS',
            'slug' => 'ujian-tps',
            'duration_minutes' => 45,
            'is_active' => true,
        ]);

        $q = Question::create([
            'question_text' => 'Soal 1',
            'duration_seconds' => 60,
            'is_active' => true,
        ]);
        $q->options()->createMany([
            ['option_key' => 'A', 'option_text' => 'Option A', 'is_correct' => true],
            ['option_key' => 'B', 'option_text' => 'Option B', 'is_correct' => false],
        ]);
        $exam->questions()->attach($q->id);

        $startRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id]);
        $startRes->assertStatus(201);
        $sessionId = $startRes->json('session.id');

        // Answer question 1
        $answerRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$sessionId}/answer", [
                'question_number' => 1,
                'selected_option' => 'A',
            ]);
        $answerRes->assertStatus(200);

        // Try to cancel
        $cancelRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$sessionId}/cancel");

        $cancelRes->assertStatus(422);
        $cancelRes->assertJsonFragment([
            'message' => 'Ujian tidak dapat dibatalkan karena Anda sudah mulai menjawab soal. Silakan lanjutkan pengerjaan atau submit ujian.',
        ]);

        // Session should still exist
        $this->assertDatabaseHas('cbt_sessions', ['id' => $sessionId]);
    }

    public function test_student_and_admin_dynamic_exam_types_crud(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $adminToken = JWTAuth::fromUser($admin);

        $student = User::factory()->create();
        $student->assignRole('siswa');
        $studentToken = JWTAuth::fromUser($student);

        // 1. Admin creates a new exam type
        $createRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/admin/cbt/exam-types', [
                'name' => 'Literasi Bahasa Indonesia',
                'code' => 'lit-indo',
                'icon' => '📚',
                'duration_seconds' => 2700,
                'total_questions' => 25,
                'is_active' => true,
            ]);

        $createRes->assertStatus(201);
        $this->assertDatabaseHas('exam_types', [
            'code' => 'lit-indo',
            'name' => 'Literasi Bahasa Indonesia',
        ]);
        $typeId = $createRes->json('id');

        // 2. Student fetches active exam types
        $typesRes = $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->getJson('/api/cbt/exam-types');
        $typesRes->assertStatus(200);
        $typesRes->assertJsonFragment([
            'code' => 'lit-indo',
            'name' => 'Literasi Bahasa Indonesia',
        ]);

        // 3. Student fetches available-exams and receives exam_types
        $availableRes = $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->getJson('/api/cbt/available-exams');
        $availableRes->assertStatus(200);
        $availableRes->assertJsonFragment([
            'code' => 'lit-indo',
        ]);

        // 4. Admin updates the exam type
        $updateRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/admin/cbt/exam-types/{$typeId}", [
                'name' => 'Literasi Bahasa Indonesia & Daerah',
                'duration_seconds' => 3000,
            ]);
        $updateRes->assertStatus(200);
        $this->assertDatabaseHas('exam_types', [
            'id' => $typeId,
            'name' => 'Literasi Bahasa Indonesia & Daerah',
            'duration_seconds' => 3000,
        ]);

        // 5. Admin deletes the exam type
        $deleteRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->deleteJson("/api/admin/cbt/exam-types/{$typeId}");
        $deleteRes->assertStatus(200);
        $this->assertDatabaseMissing('exam_types', ['id' => $typeId]);
    }

    public function test_admin_can_create_and_update_exam_with_description_guidelines(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $adminToken = JWTAuth::fromUser($admin);

        // 1. Create exam with description/guidelines
        $createRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/admin/cbt/exams', [
                'title' => 'Tryout Akbar SNBT 2026',
                'description' => "Tata Tertib & Panduan:\n1. Dilarang membuka tab lain.\n2. Waktu berjalan otomatis.",
                'duration_minutes' => 90,
                'is_active' => true,
            ]);

        $createRes->assertStatus(201);
        $this->assertDatabaseHas('exams', [
            'title' => 'Tryout Akbar SNBT 2026',
            'duration_minutes' => 90,
        ]);
        $this->assertStringContainsString('Tata Tertib & Panduan', $createRes->json('description'));

        $examId = $createRes->json('id');

        // 2. Update exam description
        $updateRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/admin/cbt/exams/{$examId}", [
                'title' => 'Tryout Akbar SNBT 2026 - Revisi',
                'description' => "Panduan Diperbarui:\nHarap periksa koneksi internet sebelum memulai.",
                'duration_minutes' => 100,
                'is_active' => true,
            ]);

        $updateRes->assertStatus(200);
        $this->assertDatabaseHas('exams', [
            'id' => $examId,
            'title' => 'Tryout Akbar SNBT 2026 - Revisi',
            'description' => "Panduan Diperbarui:\nHarap periksa koneksi internet sebelum memulai.",
            'duration_minutes' => 100,
        ]);
    }

    public function test_exam_and_questions_correlation_with_exam_types(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $adminToken = JWTAuth::fromUser($admin);

        $student = User::factory()->create();
        $student->assignRole('siswa');
        $studentToken = JWTAuth::fromUser($student);

        // 1. Create master exam types
        $tpsType = ExamType::create([
            'code' => 'tps-master',
            'name' => 'TPS — Tes Potensi Skolastik',
            'icon' => '🧠',
            'duration_seconds' => 3600,
            'is_active' => true,
        ]);

        $puType = ExamType::create([
            'code' => 'pu-subtest',
            'name' => 'PU — Penalaran Umum',
            'icon' => '💡',
            'duration_seconds' => 1800,
            'is_active' => true,
        ]);

        // 2. Admin creates exam linked to master exam type
        $examRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/admin/cbt/exams', [
                'title' => 'Tryout Akbar UTBK SNBT',
                'exam_type_id' => $tpsType->id,
                'duration_minutes' => 120,
                'is_active' => true,
            ]);
        $examRes->assertStatus(201);
        $examId = $examRes->json('id');
        $this->assertEquals($tpsType->id, $examRes->json('exam_type_id'));

        // 3. Admin creates question linked to subtest exam type
        $qRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson("/api/admin/cbt/exams/{$examId}/questions", [
                'exam_type_id' => $puType->id,
                'subject' => $puType->name,
                'subtest' => 'Logika Deduktif',
                'question_text' => '<p>Semua A adalah B. C adalah A. Kesimpulannya?</p>',
                'points' => 10,
                'duration_seconds' => 60,
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'C adalah B', 'is_correct' => true],
                    ['option_key' => 'B', 'option_text' => 'C bukan B', 'is_correct' => false],
                ],
            ]);
        $qRes->assertStatus(201);
        $this->assertEquals($puType->id, $qRes->json('exam_type_id'));
        $this->assertEquals($puType->name, $qRes->json('exam_type.name'));

        // 4. Student gets available-exams and verifies subtests list & exam type
        $availableRes = $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->getJson('/api/cbt/available-exams');
        $availableRes->assertStatus(200);
        $examData = collect($availableRes->json('exams'))->firstWhere('id', $examId);
        $this->assertNotNull($examData);
        $this->assertEquals($tpsType->name, $examData['exam_type']['name']);
        $this->assertContains($puType->name, $examData['subtests_list']);

        // 5. Student starts exam and submits, receiving subtest breakdown
        $startRes = $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $examId,
            ]);
        $startRes->assertStatus(201);
        $sessionId = $startRes->json('session.id');
        $this->assertEquals($puType->name, $startRes->json('questions.0.subtest'));
        $this->assertEquals('💡', $startRes->json('questions.0.exam_type.icon'));

        // Answer question correctly
        $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->postJson("/api/cbt/sessions/{$sessionId}/answer", [
                'question_number' => 1,
                'selected_option' => 'A',
            ])->assertStatus(200);

        // Submit exam
        $submitRes = $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->postJson("/api/cbt/sessions/{$sessionId}/submit");
        $submitRes->assertStatus(200);
        $this->assertEquals(100, $submitRes->json('score'));
        $this->assertNotEmpty($submitRes->json('subtest_breakdown'));
        $this->assertEquals($puType->name, $submitRes->json('subtest_breakdown.0.subtest'));
        $this->assertEquals(1, $submitRes->json('subtest_breakdown.0.correct'));
    }

    public function test_admin_can_download_cbt_excel_template(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $adminToken = JWTAuth::fromUser($admin);

        $res = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->get('/api/admin/cbt/template-excel');

        $res->assertStatus(200);
        $res->assertHeader('content-disposition');
    }
}
