<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CbtScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
    }

    public function test_admin_can_create_and_update_exam_with_schedule(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = auth('api')->login($admin);

        $payload = [
            'title' => 'Tryout Akbar UTBK 2027',
            'description' => 'Tryout serentak nasional',
            'duration_minutes' => 90,
            'is_active' => true,
            'start_time' => now()->addDays(1)->format('Y-m-d H:i:s'),
            'end_time' => now()->addDays(2)->format('Y-m-d H:i:s'),
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/cbt/exams', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'Tryout Akbar UTBK 2027')
            ->assertJsonPath('schedule_status', 'upcoming')
            ->assertJsonPath('is_open', false);

        $examId = $response->json('id');

        // Update exam to be open right now
        $updatePayload = [
            'start_time' => now()->subHours(1)->format('Y-m-d H:i:s'),
            'end_time' => now()->addHours(2)->format('Y-m-d H:i:s'),
        ];

        $updateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/admin/cbt/exams/{$examId}", $updatePayload);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('schedule_status', 'ongoing')
            ->assertJsonPath('is_open', true);
    }

    public function test_student_cannot_start_upcoming_or_expired_scheduled_exam(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = auth('api')->login($student);

        // Upcoming exam
        $upcomingExam = Exam::create([
            'title' => 'Ujian Masa Depan',
            'duration_minutes' => 60,
            'is_active' => true,
            'start_time' => now()->addHours(3),
            'end_time' => now()->addHours(5),
        ]);

        $q1 = Question::create([
            'question_text' => 'Soal 1',
            'option_a' => 'A',
            'option_b' => 'B',
            'correct_option' => 'A',
        ]);
        $upcomingExam->questions()->attach($q1->id);

        $resUpcoming = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $upcomingExam->id,
            ]);

        $resUpcoming->assertStatus(422)
            ->assertJsonPath('schedule_status', 'upcoming');

        // Expired exam
        $expiredExam = Exam::create([
            'title' => 'Ujian Yang Telah Lewat',
            'duration_minutes' => 60,
            'is_active' => true,
            'start_time' => now()->subHours(5),
            'end_time' => now()->subHours(1),
        ]);
        $expiredExam->questions()->attach($q1->id);

        $resExpired = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $expiredExam->id,
            ]);

        $resExpired->assertStatus(422)
            ->assertJsonPath('schedule_status', 'expired');

        // Ongoing exam should succeed
        $ongoingExam = Exam::create([
            'title' => 'Ujian Sedang Berlangsung',
            'duration_minutes' => 60,
            'is_active' => true,
            'start_time' => now()->subHour(),
            'end_time' => now()->addHour(),
        ]);
        $ongoingExam->questions()->attach($q1->id);

        $resOngoing = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $ongoingExam->id,
            ]);

        $resOngoing->assertStatus(201)
            ->assertJsonPath('session.exam_id', $ongoingExam->id);
    }

    public function test_admin_can_create_exam_with_recurring_schedule(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $token = auth('api')->login($admin);

        // Daily schedule
        $dailyPayload = [
            'title' => 'Ujian Harian',
            'duration_minutes' => 60,
            'is_active' => true,
            'schedule_type' => 'daily',
            'start_hour' => '08:00',
            'end_hour' => '12:00',
        ];

        $dailyRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/cbt/exams', $dailyPayload);

        $dailyRes->assertStatus(201)
            ->assertJsonPath('schedule_type', 'daily')
            ->assertJsonPath('schedule_description', 'Setiap Hari (08:00 - 12:00 WIB)');

        // Weekly schedule
        $weeklyPayload = [
            'title' => 'Ujian Mingguan',
            'duration_minutes' => 90,
            'is_active' => true,
            'schedule_type' => 'weekly',
            'scheduled_days' => [1, 3, 5],
            'start_hour' => '14:00',
            'end_hour' => '16:00',
        ];

        $weeklyRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/cbt/exams', $weeklyPayload);

        $weeklyRes->assertStatus(201)
            ->assertJsonPath('schedule_type', 'weekly')
            ->assertJsonPath('schedule_description', 'Setiap Senin, Rabu, Jumat (14:00 - 16:00 WIB)');

        // Interval schedule
        $intervalPayload = [
            'title' => 'Ujian Interval',
            'duration_minutes' => 30,
            'is_active' => true,
            'schedule_type' => 'interval',
            'interval_hours' => 2,
            'start_hour' => '08:00',
            'end_hour' => '18:00',
        ];

        $intervalRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/cbt/exams', $intervalPayload);

        $intervalRes->assertStatus(201)
            ->assertJsonPath('schedule_type', 'interval')
            ->assertJsonPath('schedule_description', 'Setiap 2 Jam (08:00 - 18:00 WIB)');
    }

    public function test_student_can_start_exam_within_recurring_schedule(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $token = auth('api')->login($student);

        $q1 = Question::create([
            'question_text' => 'Soal 1',
            'option_a' => 'A',
            'option_b' => 'B',
            'correct_option' => 'A',
        ]);

        // Daily schedule that is currently open (00:00 - 23:59)
        $dailyOpen = Exam::create([
            'title' => 'Ujian Harian Terbuka',
            'duration_minutes' => 60,
            'is_active' => true,
            'schedule_type' => 'daily',
            'start_hour' => '00:00',
            'end_hour' => '23:59',
        ]);
        $dailyOpen->questions()->attach($q1->id);

        $resDaily = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $dailyOpen->id,
            ]);

        $resDaily->assertStatus(201);

        // Weekly schedule for today (assuming today is in scheduled_days)
        $todayDay = (int) now()->format('N');
        $weeklyOpen = Exam::create([
            'title' => 'Ujian Mingguan Terbuka',
            'duration_minutes' => 60,
            'is_active' => true,
            'schedule_type' => 'weekly',
            'scheduled_days' => [$todayDay],
            'start_hour' => '00:00',
            'end_hour' => '23:59',
        ]);
        $weeklyOpen->questions()->attach($q1->id);

        $resWeekly = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/cbt/sessions', [
                'exam_id' => $weeklyOpen->id,
            ]);

        $resWeekly->assertStatus(201);
    }
}
