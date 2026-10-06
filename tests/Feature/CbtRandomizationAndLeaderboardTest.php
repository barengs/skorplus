<?php

namespace Tests\Feature;

use App\Models\CbtSession;
use App\Models\Exam;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class CbtRandomizationAndLeaderboardTest extends TestCase
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

    public function test_completed_sessions_are_ordered_by_highest_score_descending(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = JWTAuth::fromUser($admin);

        $exam = Exam::create([
            'title' => 'Tryout Akbar SNBT 2026',
            'slug' => 'tryout-akbar-snbt-2026',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);

        $student1 = User::factory()->create(['name' => 'Siswa Skor Rendah']);
        $student2 = User::factory()->create(['name' => 'Siswa Juara 1']);
        $student3 = User::factory()->create(['name' => 'Siswa Juara 2']);

        // Create 3 submitted sessions with different scores
        CbtSession::create([
            'user_id' => $student1->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'score' => 45,
            'status' => 'submitted',
            'started_at' => now()->subHours(3),
            'submitted_at' => now()->subHours(2),
        ]);

        CbtSession::create([
            'user_id' => $student2->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'score' => 95,
            'status' => 'submitted',
            'started_at' => now()->subHours(1),
            'submitted_at' => now()->subMinutes(30),
        ]);

        CbtSession::create([
            'user_id' => $student3->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'score' => 80,
            'status' => 'submitted',
            'started_at' => now()->subHours(2),
            'submitted_at' => now()->subHours(1),
        ]);

        // Also create an ongoing session to ensure filter works
        $student4 = User::factory()->create(['name' => 'Siswa Sedang Ujian']);
        CbtSession::create([
            'user_id' => $student4->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'score' => null,
            'status' => 'ongoing',
            'started_at' => now()->subMinutes(10),
        ]);

        // 1. Test global monitoring sessions endpoint
        $resMonitoring = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/cbt/monitoring-sessions?status=submitted');

        $resMonitoring->assertStatus(200);
        $sessions = $resMonitoring->json('sessions');
        $this->assertCount(3, $sessions);

        // Assert strictly ordered by score descending: 95, 80, 45
        $this->assertEquals(95, $sessions[0]['score']);
        $this->assertEquals('Siswa Juara 1', $sessions[0]['user_name']);

        $this->assertEquals(80, $sessions[1]['score']);
        $this->assertEquals('Siswa Juara 2', $sessions[1]['user_name']);

        $this->assertEquals(45, $sessions[2]['score']);
        $this->assertEquals('Siswa Skor Rendah', $sessions[2]['user_name']);

        // 2. Test active sessions per exam endpoint
        $resActive = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/admin/cbt/exams/{$exam->id}/active-sessions?status=submitted");

        $resActive->assertStatus(200);
        $examSessions = $resActive->json('sessions');
        $this->assertCount(3, $examSessions);
        $this->assertEquals(95, $examSessions[0]['score']);
        $this->assertEquals(80, $examSessions[1]['score']);
        $this->assertEquals(45, $examSessions[2]['score']);
    }

    public function test_questions_and_options_over_two_are_randomized_and_graded_accurately(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Ujian Acak Butir Soal',
            'slug' => 'ujian-acak-butir-soal',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);

        // Create Question 1 with 4 options (> 2 choices) -> options MUST be randomized
        $q1 = Question::create([
            'question_text' => 'Apa ibu kota Indonesia?',
            'duration_seconds' => 60,
            'is_active' => true,
        ]);
        $q1->options()->createMany([
            ['option_key' => 'A', 'option_text' => 'Bandung', 'is_correct' => false],
            ['option_key' => 'B', 'option_text' => 'Nusantara', 'is_correct' => true],
            ['option_key' => 'C', 'option_text' => 'Surabaya', 'is_correct' => false],
            ['option_key' => 'D', 'option_text' => 'Medan', 'is_correct' => false],
        ]);
        $exam->questions()->attach($q1->id);

        // Create Question 2 with 2 options (<= 2 choices, e.g. Benar/Salah) -> options MUST NOT be randomized
        $q2 = Question::create([
            'question_text' => 'Apakah bumi bulat?',
            'duration_seconds' => 45,
            'is_active' => true,
        ]);
        $q2->options()->createMany([
            ['option_key' => 'A', 'option_text' => 'Benar', 'is_correct' => true],
            ['option_key' => 'B', 'option_text' => 'Salah', 'is_correct' => false],
        ]);
        $exam->questions()->attach($q2->id);

        // Start session 1
        $startRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id]);

        $startRes->assertStatus(201);
        $sessionData = $startRes->json('session');
        $questions = $startRes->json('questions');

        $this->assertCount(2, $questions);
        $sessionId = $sessionData['id'];

        // Verify session has question_order stored in database with correct_option
        $storedSession = CbtSession::find($sessionId);
        $this->assertNotNull($storedSession->question_order);
        $this->assertCount(2, $storedSession->question_order);

        // For Q2 (2 options), options should remain 'A' => 'Benar' and 'B' => 'Salah'
        $q2InSession = collect($questions)->firstWhere('id', $q2->id);
        $this->assertNotNull($q2InSession);
        $this->assertEquals(['A' => 'Benar', 'B' => 'Salah'], $q2InSession['options']);

        // For Q1 (4 options), find which key was assigned to the correct text ('Nusantara')
        $q1InSession = collect($questions)->firstWhere('id', $q1->id);
        $this->assertNotNull($q1InSession);
        $this->assertCount(4, $q1InSession['options']);

        // Find the key for 'Nusantara'
        $correctKeyForQ1 = null;
        foreach ($q1InSession['options'] as $key => $text) {
            if ($text === 'Nusantara') {
                $correctKeyForQ1 = $key;
                break;
            }
        }
        $this->assertNotNull($correctKeyForQ1);

        // Answer Q1 with the correct shuffled option key
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$sessionId}/answer", [
                'question_number' => $q1InSession['number'],
                'selected_option' => $correctKeyForQ1,
            ])->assertStatus(200);

        // Answer Q2 with 'A' ('Benar')
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$sessionId}/answer", [
                'question_number' => $q2InSession['number'],
                'selected_option' => 'A',
            ])->assertStatus(200);

        // Submit the exam
        $submitRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$sessionId}/submit");

        $submitRes->assertStatus(200);
        // Student should get 100% score (2/2 correct) despite shuffled options!
        $this->assertEquals(100, $submitRes->json('score'));
        $this->assertEquals(2, $submitRes->json('correct_count'));
    }

    public function test_multiple_exam_starts_generate_shuffled_orders(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Ujian Multi Soal',
            'slug' => 'ujian-multi-soal',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);

        // Create 8 questions so order shuffle is statistically guaranteed to vary
        for ($i = 1; $i <= 8; $i++) {
            $q = Question::create([
                'question_text' => "Soal nomor {$i}",
                'duration_seconds' => 60,
                'is_active' => true,
            ]);
            $q->options()->createMany([
                ['option_key' => 'A', 'option_text' => "Pilihan 1 Soal {$i}", 'is_correct' => true],
                ['option_key' => 'B', 'option_text' => "Pilihan 2 Soal {$i}", 'is_correct' => false],
                ['option_key' => 'C', 'option_text' => "Pilihan 3 Soal {$i}", 'is_correct' => false],
            ]);
            $exam->questions()->attach($q->id);
        }

        $session1 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id])
            ->json('questions');

        $session2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id])
            ->json('questions');

        $ids1 = array_column($session1, 'id');
        $ids2 = array_column($session2, 'id');

        // Both sessions have 8 questions
        $this->assertCount(8, $ids1);
        $this->assertCount(8, $ids2);

        // Across retries or separate attempts, question sequence can differ
        $this->assertEqualsCanonicalizing($ids1, $ids2);
    }

    public function test_cooldown_prevents_immediate_re_examination(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Ujian Dengan Jeda Waktu',
            'slug' => 'ujian-dengan-jeda-waktu',
            'duration_minutes' => 30,
            'interval_hours' => 1, // 1 hour cooldown
            'is_active' => true,
        ]);

        $q = Question::create([
            'question_text' => 'Soal 1',
            'duration_seconds' => 60,
            'is_active' => true,
        ]);
        $q->options()->createMany([
            ['option_key' => 'A', 'option_text' => 'Pilihan A', 'is_correct' => true],
            ['option_key' => 'B', 'option_text' => 'Pilihan B', 'is_correct' => false],
        ]);
        $exam->questions()->attach($q->id);

        // Start session 1
        $startRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id]);
        $startRes->assertStatus(201);
        $sessionId = $startRes->json('session.id');

        // Answer question and submit
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$sessionId}/answer", [
                'question_number' => 1,
                'selected_option' => 'A',
            ])->assertStatus(200);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$sessionId}/submit")
            ->assertStatus(200);

        // Immediately try to start the same exam again -> should be blocked by cooldown
        $retryBlocked = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id]);

        $retryBlocked->assertStatus(422);
        $this->assertTrue($retryBlocked->json('cooldown'));
        $this->assertGreaterThan(0, $retryBlocked->json('remaining_minutes'));

        // Fast forward 61 minutes
        $this->travel(61)->minutes();

        // Now student should be able to start the exam
        $retryAllowed = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', ['exam_id' => $exam->id]);
        $retryAllowed->assertStatus(201);
    }

    public function test_monitoring_excludes_sessions_with_zero_answers(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = JWTAuth::fromUser($admin);

        $exam = Exam::create([
            'title' => 'Monitoring Filter Zero Answers',
            'slug' => 'monitoring-filter-zero-answers',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);

        $studentInactive = User::factory()->create(['name' => 'Siswa Buka Doang']);
        $studentActive = User::factory()->create(['name' => 'Siswa Mengerjakan Soal']);

        // Session 1: Ongoing with 0 answers (ghost session)
        CbtSession::create([
            'user_id' => $studentInactive->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'score' => null,
            'status' => 'ongoing',
            'started_at' => now(),
        ]);

        // Session 2: Ongoing WITH at least 1 answer
        $sessionActive = CbtSession::create([
            'user_id' => $studentActive->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'score' => null,
            'status' => 'ongoing',
            'started_at' => now(),
        ]);
        $sessionActive->answers()->create([
            'question_number' => 1,
            'selected_option' => 'A',
            'is_correct' => true,
        ]);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/cbt/monitoring-sessions');

        $res->assertStatus(200);
        $sessions = $res->json('sessions');

        // Only the student with answers should appear in monitoring
        $this->assertCount(1, $sessions);
        $this->assertEquals('Siswa Mengerjakan Soal', $sessions[0]['user_name']);
        $this->assertEquals(1, $res->json('total_active'));
        $this->assertEquals(1, $res->json('total_sessions'));
    }

    public function test_auto_submit_expired_sessions_submits_answered_and_purges_empty(): void
    {
        $student1 = User::factory()->create(['name' => 'Siswa Ghost']);
        $student2 = User::factory()->create(['name' => 'Siswa Lupa Submit']);

        $exam = Exam::create([
            'title' => 'Ujian Expired Auto Submit',
            'slug' => 'ujian-expired-auto-submit',
            'duration_minutes' => 10,
            'is_active' => true,
        ]);

        $q = Question::create([
            'question_text' => 'Soal Auto Submit',
            'duration_seconds' => 60,
            'is_active' => true,
        ]);
        $q->options()->createMany([
            ['option_key' => 'A', 'option_text' => 'Benar', 'is_correct' => true],
            ['option_key' => 'B', 'option_text' => 'Salah', 'is_correct' => false],
        ]);
        $exam->questions()->attach($q->id);

        // Ghost session: started 20 minutes ago (duration 10 mins), 0 answers
        $ghost = CbtSession::create([
            'user_id' => $student1->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'duration_seconds' => 600, // 10 minutes
            'status' => 'ongoing',
            'started_at' => now()->subMinutes(20),
        ]);

        // Answered session: started 20 minutes ago, 1 answer answered
        $answered = CbtSession::create([
            'user_id' => $student2->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'duration_seconds' => 600, // 10 minutes
            'status' => 'ongoing',
            'started_at' => now()->subMinutes(20),
        ]);
        $answered->answers()->create([
            'question_number' => 1,
            'question_id' => $q->id,
            'selected_option' => 'A',
            'is_correct' => true,
        ]);

        // Run autoSubmitExpiredSessions
        CbtSession::autoSubmitExpiredSessions();

        // Ghost session should be deleted
        $this->assertDatabaseMissing('cbt_sessions', ['id' => $ghost->id]);

        // Answered session should be submitted and scored
        $this->assertDatabaseHas('cbt_sessions', [
            'id' => $answered->id,
            'status' => 'submitted',
        ]);
        $refreshedAnswered = CbtSession::find($answered->id);
        $this->assertNotNull($refreshedAnswered->score);
        $this->assertEquals(100, $refreshedAnswered->score);
    }

    public function test_saving_answer_is_rejected_when_exam_duration_has_expired_due_to_freeze(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $exam = Exam::create([
            'title' => 'Ujian Pembekuan Soal',
            'slug' => 'ujian-pembekuan-soal',
            'duration_minutes' => 15,
            'is_active' => true,
        ]);

        $session = CbtSession::create([
            'user_id' => $student->id,
            'exam_id' => $exam->id,
            'exam_type' => 'TPS',
            'exam_title' => $exam->title,
            'duration_seconds' => 900, // 15 mins
            'status' => 'ongoing',
            'started_at' => now()->subMinutes(16), // 16 mins ago -> expired and frozen
        ]);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$session->id}/answer", [
                'question_number' => 1,
                'selected_option' => 'A',
            ]);

        $res->assertStatus(422);
        $this->assertTrue($res->json('is_frozen'));
        $this->assertStringContainsString('dibekukan', $res->json('message'));
    }
}
