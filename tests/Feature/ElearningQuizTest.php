<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ElearningQuizTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_quiz_lesson_with_dynamic_options(): void
    {
        $admin = User::factory()->create();
        $token = JWTAuth::fromUser($admin);

        $course = Course::create(['title' => 'TPS', 'slug' => 'tps']);
        $module = Module::create(['course_id' => $course->id, 'title' => 'Bab 1', 'sort_order' => 1]);

        $quizQuestions = [
            [
                'question' => 'Manakah yang merupakan kesimpulan tepat?',
                'options' => [
                    'Semua unggas bertelur',
                    'Ayam berkokok di pagi hari',
                    'Bebek dapat berenang di air tawar',
                ],
                'correct_index' => 0,
                'explanation' => 'Pernyataan umum tentang unggas.',
            ],
            [
                'question' => 'Jika P maka Q, dan P benar, maka...',
                'options' => [
                    'Q benar',
                    'Q salah',
                ],
                'correct_index' => 0,
                'explanation' => 'Modus ponens.',
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/elearning/modules/{$module->id}/lessons", [
                'title' => 'Kuis Akhir Bab 1',
                'type' => 'quiz',
                'min_pass_score' => 60,
                'quiz_questions' => $quizQuestions,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('lessons', [
            'title' => 'Kuis Akhir Bab 1',
            'type' => 'quiz',
            'min_pass_score' => 60,
        ]);

        $lesson = Lesson::where('title', 'Kuis Akhir Bab 1')->first();
        $this->assertCount(2, $lesson->quiz_questions);
        $this->assertCount(3, $lesson->quiz_questions[0]['options']);
        $this->assertCount(2, $lesson->quiz_questions[1]['options']);
    }

    public function test_student_submit_quiz_passing_and_failing_threshold(): void
    {
        $student = User::factory()->create();
        $token = JWTAuth::fromUser($student);

        $course = Course::create(['title' => 'TPS', 'slug' => 'tps']);
        $module = Module::create(['course_id' => $course->id, 'title' => 'Bab 1', 'sort_order' => 1]);

        CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'total_lessons' => 1]);

        $quizLesson = Lesson::create([
            'module_id' => $module->id,
            'title' => 'Kuis Bab 1',
            'type' => 'quiz',
            'min_pass_score' => 60,
            'quiz_questions' => [
                ['question' => 'Soal 1', 'options' => ['Opsi A', 'Opsi B'], 'correct_index' => 0],
                ['question' => 'Soal 2', 'options' => ['Benar', 'Salah'], 'correct_index' => 0],
            ],
        ]);

        // 1. Submit with 1 correct out of 2 (50% score) -> should NOT pass (< 60%)
        $failResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/elearning/lessons/{$quizLesson->id}/quiz/submit", [
                'answers' => [
                    0 => 0, // correct
                    1 => 1, // wrong
                ],
            ]);

        $failResponse->assertOk()
            ->assertJsonPath('is_passed', false)
            ->assertJsonPath('score_percentage', 50);

        // 2. Submit with 2 correct out of 2 (100% score) -> should pass (>= 60%)
        $passResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/elearning/lessons/{$quizLesson->id}/quiz/submit", [
                'answers' => [
                    0 => 0, // correct
                    1 => 0, // correct
                ],
            ]);

        $passResponse->assertOk()
            ->assertJsonPath('is_passed', true)
            ->assertJsonPath('score_percentage', 100);
    }

    public function test_next_module_is_locked_if_previous_quiz_under_60_percent(): void
    {
        $student = User::factory()->create();
        $token = JWTAuth::fromUser($student);

        $course = Course::create(['title' => 'Matematika', 'slug' => 'matematika']);
        $module1 = Module::create(['course_id' => $course->id, 'title' => 'Bab 1', 'sort_order' => 1]);
        $module2 = Module::create(['course_id' => $course->id, 'title' => 'Bab 2', 'sort_order' => 2]);

        $quiz1 = Lesson::create([
            'module_id' => $module1->id,
            'title' => 'Kuis Bab 1',
            'type' => 'quiz',
            'min_pass_score' => 60,
            'quiz_questions' => [
                ['question' => 'Soal 1', 'options' => ['Opsi 1', 'Opsi 2'], 'correct_index' => 0],
                ['question' => 'Soal 2', 'options' => ['Opsi 1', 'Opsi 2'], 'correct_index' => 0],
            ],
        ]);

        $lessonInMod2 = Lesson::create([
            'module_id' => $module2->id,
            'title' => 'Materi Bab 2',
            'type' => 'video',
        ]);

        CourseEnrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'total_lessons' => 2]);

        // Student fails quiz1 with 50%
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/elearning/lessons/{$quiz1->id}/quiz/submit", [
                'answers' => [0 => 0, 1 => 1],
            ]);

        // Attempt to mark lesson in Module 2 completed -> must be blocked with 403
        $blockedResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/elearning/lessons/{$lessonInMod2->id}/complete");

        $blockedResponse->assertStatus(403)
            ->assertJsonPath('locked', true);

        // Check getProgress reports module2 as locked
        $progressRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/elearning/courses/{$course->id}/progress");

        $progressRes->assertOk();
        $this->assertContains($module2->id, $progressRes->json('locked_module_ids'));

        // Now student retakes quiz1 and passes with 100%
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/elearning/lessons/{$quiz1->id}/quiz/submit", [
                'answers' => [0 => 0, 1 => 0],
            ]);

        // Now lesson in Module 2 should be accessible and complete-able!
        $successResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/elearning/lessons/{$lessonInMod2->id}/complete");

        $successResponse->assertOk();
    }
}
