<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentProgramEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'siswa', 'guard_name' => 'api']);
        Role::create(['name' => 'siswa', 'guard_name' => 'web']);
    }

    public function test_student_dashboard_returns_available_programs_with_current_flag(): void
    {
        $program1 = Program::create([
            'name' => 'Mandiri',
            'slug' => 'mandiri',
            'price' => 'Rp 350.000',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $program2 = Program::create([
            'name' => 'Intensif',
            'slug' => 'intensif',
            'price' => 'Rp 750.000',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $student = User::factory()->create([
            'program' => 'intensif',
        ]);
        $student->assignRole('siswa');

        $token = auth('api')->login($student);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('dashboard_type', 'student')
            ->assertJsonPath('available_programs.0.slug', 'mandiri')
            ->assertJsonPath('available_programs.0.is_current', false)
            ->assertJsonPath('available_programs.1.slug', 'intensif')
            ->assertJsonPath('available_programs.1.is_current', true);
    }

    public function test_student_can_enroll_or_switch_program(): void
    {
        $mandiri = Program::create([
            'name' => 'Mandiri',
            'slug' => 'mandiri',
            'price' => 'Rp 350.000',
            'is_active' => true,
        ]);

        $garansi = Program::create([
            'name' => 'Garansi',
            'slug' => 'garansi',
            'price' => 'Rp 1.200.000',
            'is_active' => true,
        ]);

        $courseGaransi = Course::create([
            'title' => 'Master Python FAANG',
            'slug' => 'master-python-faang',
            'category' => 'Python',
            'program_id' => $garansi->id,
            'program_name' => 'Program Garansi',
            'is_active' => true,
        ]);

        $student = User::factory()->create([
            'program' => 'mandiri',
        ]);
        $student->assignRole('siswa');

        $token = auth('api')->login($student);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/student/programs/enroll', [
                'program_id' => 'garansi',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.program', 'garansi')
            ->assertJsonPath('program.name', 'Garansi');

        $this->assertEquals('garansi', $student->fresh()->program);

        // Verify auto-enrolled to the course
        $this->assertDatabaseHas('course_enrollments', [
            'user_id' => $student->id,
            'course_id' => $courseGaransi->id,
        ]);
    }
}
