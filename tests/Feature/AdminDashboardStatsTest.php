<?php

namespace Tests\Feature;

use App\Models\CbtSession;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminDashboardStatsTest extends TestCase
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

    public function test_admin_dashboard_returns_course_and_cbt_stats(): void
    {
        $admin = User::factory()->create(['name' => 'Admin Test', 'email' => 'admin.test@skorpluss.com']);
        $admin->assignRole('admin');

        $student = User::factory()->create(['name' => 'Siswa Test', 'email' => 'siswa.test@skorpluss.com']);
        $student->assignRole('siswa');

        // Setup Course and Lessons
        $course = Course::create([
            'title' => 'Mastering AI & Data Science',
            'slug' => 'mastering-ai-data-science',
            'category' => 'AI & Otomasi',
            'is_active' => true,
        ]);
        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Pengenalan AI',
            'sort_order' => 1,
        ]);
        Lesson::create([
            'module_id' => $module->id,
            'title' => 'Dasar Algoritma Machine Learning',
            'content_type' => 'text',
            'sort_order' => 1,
        ]);
        CourseEnrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'progress_percentage' => 100,
            'completed_lessons' => 1,
            'total_lessons' => 1,
        ]);

        // Setup CBT Exam & Sessions
        $exam = Exam::create([
            'title' => 'Tryout Akbar SNBT 2026',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);
        $question = Question::create([
            'question_text' => 'Berapakah 2 + 2?',
            'points' => 1,
            'subtest' => 'Penalaran Matematika',
        ]);
        $exam->questions()->attach($question->id);

        CbtSession::create([
            'user_id' => $student->id,
            'exam_id' => $exam->id,
            'exam_title' => $exam->title,
            'exam_type' => 'REAL',
            'score' => 85,
            'status' => 'submitted',
            'started_at' => now()->subHour(),
            'submitted_at' => now()->subMinutes(30),
        ]);

        CbtSession::create([
            'user_id' => $student->id,
            'exam_id' => $exam->id,
            'exam_title' => $exam->title,
            'exam_type' => 'REAL',
            'score' => null,
            'status' => 'ongoing',
            'started_at' => now()->subMinutes(10),
        ]);

        $token = auth('api')->login($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('dashboard_type', 'admin')
            ->assertJsonPath('admin_stats.total_courses', 1)
            ->assertJsonPath('admin_stats.total_exams', 1)
            ->assertJsonPath('admin_stats.total_cbt_sessions', 2)
            ->assertJsonPath('course_stats.total_courses', 1)
            ->assertJsonPath('course_stats.total_enrollments', 1)
            ->assertJsonPath('course_stats.completed_enrollments', 1)
            ->assertJsonPath('course_stats.total_lessons', 1)
            ->assertJsonPath('cbt_stats.total_exams', 1)
            ->assertJsonPath('cbt_stats.total_sessions', 2)
            ->assertJsonPath('cbt_stats.completed_sessions', 1)
            ->assertJsonPath('cbt_stats.ongoing_sessions', 1)
            ->assertJsonPath('cbt_stats.highest_score', 85)
            ->assertJsonPath('cbt_stats.pass_rate', 100);
    }
}
