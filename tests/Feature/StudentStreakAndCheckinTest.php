<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class StudentStreakAndCheckinTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'siswa', 'guard_name' => 'api']);
        Role::create(['name' => 'siswa', 'guard_name' => 'web']);
    }

    public function test_student_can_checkin_and_retrieve_streak_data(): void
    {
        $student = User::factory()->create(['name' => 'Budi Siswa']);
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        // 1. Check streak before checkin
        $initialRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/elearning/streak-and-checkin');

        $initialRes->assertOk()
            ->assertJsonPath('has_checked_in_today', false);

        // 2. Perform daily checkin
        $checkinRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/elearning/checkin', [
                'notes' => 'Belajar Silogisme dan Penalaran Kuantitatif',
            ]);

        $checkinRes->assertOk()
            ->assertJsonPath('checkin.notes', 'Belajar Silogisme dan Penalaran Kuantitatif');

        $this->assertDatabaseHas('daily_checkins', [
            'user_id' => $student->id,
        ]);
        $this->assertStringStartsWith(now()->toDateString(), $checkinRes->json('checkin.checkin_date'));

        // 3. Check streak after checkin
        $updatedRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/elearning/streak-and-checkin');

        $updatedRes->assertOk()
            ->assertJsonPath('has_checked_in_today', true)
            ->assertJsonPath('current_streak', 1)
            ->assertJsonStructure([
                'current_streak',
                'longest_streak',
                'weekly_tracker',
                'monthly_checkins',
                'leaderboard',
            ]);
    }

    public function test_student_my_progress_returns_active_and_completed_courses(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = JWTAuth::fromUser($student);

        $course1 = Course::create(['title' => 'TPS Silogisme', 'slug' => 'tps-silogisme']);
        $course2 = Course::create(['title' => 'Matematika Dasar', 'slug' => 'matematika-dasar']);

        // Course 1 is active (50%)
        CourseEnrollment::create([
            'user_id' => $student->id,
            'course_id' => $course1->id,
            'completed_lessons' => 5,
            'total_lessons' => 10,
            'progress_percentage' => 50,
        ]);

        // Course 2 is completed (100%)
        CourseEnrollment::create([
            'user_id' => $student->id,
            'course_id' => $course2->id,
            'completed_lessons' => 8,
            'total_lessons' => 8,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/elearning/my-progress');

        $response->assertOk()
            ->assertJsonPath('stats.total_enrolled', 2)
            ->assertJsonPath('stats.total_active', 1)
            ->assertJsonPath('stats.total_completed', 1)
            ->assertJsonPath('active_courses.0.title', 'TPS Silogisme')
            ->assertJsonPath('completed_courses.0.title', 'Matematika Dasar');
    }
}
