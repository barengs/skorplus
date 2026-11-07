<?php

namespace Tests\Feature;

use App\Models\CbtAnswer;
use App\Models\CbtSession;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\ExamType;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Question;
use App\Models\User;
use App\Services\ItemResponseTheoryService;
use App\Services\KnowledgeTracingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class MachineLearningKnowledgeTracingTest extends TestCase
{
    use RefreshDatabase;

    public function test_bkt_service_calculates_mastery_probability_correctly(): void
    {
        $bkt = new KnowledgeTracingService;

        // Prior starting at 0.20
        $p1 = $bkt->updateStep(0.20, true);
        $this->assertGreaterThan(0.20, $p1);

        $p2 = $bkt->updateStep($p1, true);
        $this->assertGreaterThan($p1, $p2);

        // Wrong response reduces probability
        $p3 = $bkt->updateStep($p2, false);
        $this->assertLessThan($p2, $p3);

        // Sequence of correct answers reaches mastery
        $result = $bkt->evaluateResponses([true, true, true, true, true]);
        $this->assertGreaterThanOrEqual(75, $result['mastery_percentage']);
        $this->assertEquals('mastered', $result['status']);
    }

    public function test_irt_service_estimates_theta_and_utbk_score(): void
    {
        $irt = new ItemResponseTheoryService;

        // Responses on 5 items with varying difficulties
        $responsesHigh = [
            ['is_correct' => true, 'difficulty' => -1.0],
            ['is_correct' => true, 'difficulty' => 0.0],
            ['is_correct' => true, 'difficulty' => 0.5],
            ['is_correct' => true, 'difficulty' => 1.0],
            ['is_correct' => true, 'difficulty' => 1.5],
        ];

        $estHigh = $irt->estimateTheta($responsesHigh);
        $utbkHigh = $irt->thetaToUtbkScore($estHigh['theta']);

        $this->assertGreaterThan(0.5, $estHigh['theta']);
        $this->assertGreaterThan(550, $utbkHigh);

        $responsesLow = [
            ['is_correct' => false, 'difficulty' => -1.0],
            ['is_correct' => false, 'difficulty' => 0.0],
            ['is_correct' => false, 'difficulty' => 0.5],
            ['is_correct' => true, 'difficulty' => 1.0],
            ['is_correct' => false, 'difficulty' => 1.5],
        ];

        $estLow = $irt->estimateTheta($responsesLow);
        $utbkLow = $irt->thetaToUtbkScore($estLow['theta']);

        $this->assertLessThan(0.0, $estLow['theta']);
        $this->assertLessThan(500, $utbkLow);
    }

    public function test_cbt_submit_calculates_and_stores_irt_metrics(): void
    {
        $student = User::factory()->create();
        $token = JWTAuth::fromUser($student);

        $examType = ExamType::create(['name' => 'Penalaran Umum', 'code' => 'PU', 'slug' => 'pu']);
        $exam = Exam::create(['title' => 'Tryout UTBK SNBT 2027', 'slug' => 'tryout-snbt-2027', 'passing_score' => 60]);

        $q1 = Question::create([
            'exam_type_id' => $examType->id,
            'question_type' => 'single_choice',
            'question_text' => 'Soal 1',
            'points' => 1,
            'is_active' => true,
        ]);
        $q1->options()->createMany([
            ['option_key' => 'A', 'option_text' => 'Pilihan A', 'is_correct' => true],
            ['option_key' => 'B', 'option_text' => 'Pilihan B', 'is_correct' => false],
        ]);
        $exam->questions()->attach($q1->id);

        $session = CbtSession::create([
            'user_id' => $student->id,
            'exam_id' => $exam->id,
            'exam_type' => 'tryout',
            'exam_title' => $exam->title,
            'status' => 'ongoing',
            'question_order' => [
                [
                    'id' => $q1->id,
                    'number' => 1,
                    'question_type' => 'single_choice',
                    'subtest' => 'Penalaran Umum',
                    'question_text' => 'Soal 1',
                    'options' => ['A' => 'Pilihan A', 'B' => 'Pilihan B'],
                    'correct_option' => 'A',
                    'points' => 1,
                ],
            ],
        ]);

        CbtAnswer::create([
            'cbt_session_id' => $session->id,
            'question_number' => 1,
            'selected_option' => 'A',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/cbt/sessions/{$session->id}/submit");

        $response->assertOk()
            ->assertJsonStructure([
                'score',
                'predicted_score',
                'irt_result' => [
                    'theta',
                    'predicted_utbk_score',
                    'ability_tier',
                    'subtest_breakdown',
                ],
            ]);

        $session->refresh();
        $this->assertEquals('submitted', $session->status);
        $this->assertNotNull($session->predicted_score);
        $this->assertNotEmpty($session->subtest_scores);
    }

    public function test_elearning_quiz_submit_returns_bkt_mastery(): void
    {
        $student = User::factory()->create();
        $token = JWTAuth::fromUser($student);

        $course = Course::create(['title' => 'TPS SNBT', 'slug' => 'tps-snbt']);
        $module = Module::create(['course_id' => $course->id, 'title' => 'Bab Silogisme', 'sort_order' => 1]);
        CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'total_lessons' => 1]);

        $lesson = Lesson::create([
            'module_id' => $module->id,
            'title' => 'Kuis Silogisme',
            'type' => 'quiz',
            'min_pass_score' => 60,
            'quiz_questions' => [
                ['question' => 'Q1', 'options' => ['A', 'B'], 'correct_index' => 0],
                ['question' => 'Q2', 'options' => ['A', 'B'], 'correct_index' => 1],
            ],
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/elearning/lessons/{$lesson->id}/quiz/submit", [
                'answers' => [
                    0 => 0, // correct
                    1 => 1, // correct
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('is_passed', true)
            ->assertJsonStructure([
                'score_percentage',
                'bkt_mastery' => [
                    'probability',
                    'mastery_percentage',
                    'status',
                    'status_label',
                ],
            ]);
    }

    public function test_admin_report_contains_ml_analytics(): void
    {
        $admin = User::factory()->create();
        $token = JWTAuth::fromUser($admin);

        $student = User::factory()->create(['name' => 'Fathur Rahman']);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/admin/users/{$student->id}/report");

        $response->assertOk()
            ->assertJsonStructure([
                'student',
                'summary' => [
                    'predicted_utbk_score',
                    'avg_theta',
                    'bkt_mastery_percentage',
                ],
                'bkt_analytics',
                'irt_analytics',
            ]);

        $dashboardResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/reports/dashboard');

        $dashboardResponse->assertOk()
            ->assertJsonStructure([
                'summary',
                'schools_stats',
                'cbt_stats' => ['irt_summary'],
                'materials_stats' => ['bkt_summary'],
                'ml_analytics' => ['bkt', 'irt'],
            ]);
    }
}

