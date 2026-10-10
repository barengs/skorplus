<?php

namespace Tests\Feature;

use App\Models\CbtSession;
use App\Models\Exam;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminReportFilterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
    }

    public function test_admin_can_filter_exam_reports_by_school_string_or_entity(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $school = School::create([
            'name' => 'SMA Jaya',
            'npsn' => '12345678',
        ]);

        $exam = Exam::create([
            'title' => 'Tryout 1',
            'duration_minutes' => 60,
            'passing_score' => 70,
            'is_active' => true,
        ]);

        // Student 1: has school string but no school_id
        $student1 = User::factory()->create(['school' => 'SMA Jaya']);
        $student1->assignRole('siswa');
        CbtSession::create([
            'user_id' => $student1->id,
            'exam_id' => $exam->id,
            'exam_type' => 'utbk',
            'exam_title' => $exam->title,
            'status' => 'submitted',
            'score' => 80,
            'started_at' => now()->subHour(),
            'submitted_at' => now(),
        ]);

        // Student 2: has school_id but no school string
        $student2 = User::factory()->create(['school_id' => $school->id]);
        $student2->assignRole('siswa');
        CbtSession::create([
            'user_id' => $student2->id,
            'exam_id' => $exam->id,
            'exam_type' => 'utbk',
            'exam_title' => $exam->title,
            'status' => 'submitted',
            'score' => 65,
            'started_at' => now()->subHour(),
            'submitted_at' => now(),
        ]);

        // Student 3: totally different school
        $student3 = User::factory()->create(['school' => 'SMA Lain']);
        $student3->assignRole('siswa');
        CbtSession::create([
            'user_id' => $student3->id,
            'exam_id' => $exam->id,
            'exam_type' => 'utbk',
            'exam_title' => $exam->title,
            'status' => 'submitted',
            'score' => 90,
            'started_at' => now()->subHour(),
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'api')
            ->getJson('/api/admin/reports/exams?school=SMA Jaya');

        $response->assertStatus(200);

        // Should return Student 1 (school string matches) and Student 2 (school entity name matches)
        $this->assertCount(2, $response->json('reports.data'));

        $ids = collect($response->json('reports.data'))->pluck('user_id');
        $this->assertTrue($ids->contains($student1->id));
        $this->assertTrue($ids->contains($student2->id));
        $this->assertFalse($ids->contains($student3->id));

        // Metrics should reflect the two students
        $this->assertEquals(2, $response->json('metrics.total_sessions'));
        $this->assertEquals(72.5, $response->json('metrics.avg_score')); // (80 + 65) / 2
        $this->assertEquals(80, $response->json('metrics.highest_score'));
    }
}
