<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SchoolManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    private function assignRoleTo(User $user, string $roleName): void
    {
        $role = Role::where('name', $roleName)->where('guard_name', 'api')->firstOrFail();
        $user->assignRole($role);
    }

    public function test_super_admin_can_create_school(): void
    {
        $admin = User::factory()->create();
        $this->assignRoleTo($admin, 'admin');

        $response = $this->actingAs($admin, 'api')
            ->postJson('/api/admin/schools', [
                'name' => 'SMAN 1 Test',
                'npsn' => '12345678',
                'email' => 'sman1@test.sch.id',
                'phone' => '021-123456',
                'address' => 'Jl. Test No. 1',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'SMAN 1 Test']);

        $this->assertDatabaseHas('schools', [
            'name' => 'SMAN 1 Test',
            'npsn' => '12345678',
        ]);
    }

    public function test_super_admin_can_create_school_with_admin_account(): void
    {
        $admin = User::factory()->create();
        $this->assignRoleTo($admin, 'admin');

        $response = $this->actingAs($admin, 'api')
            ->postJson('/api/admin/schools', [
                'name' => 'SMAN 2 Test',
                'npsn' => '87654321',
                'admin_name' => 'Pak Kepala Sekolah',
                'admin_email' => 'kepala@test.sch.id',
                'admin_password' => 'secret123',
            ]);

        $response->assertStatus(201);

        $school = School::where('npsn', '87654321')->first();
        $this->assertNotNull($school);

        $schoolAdmin = User::where('email', 'kepala@test.sch.id')->first();
        $this->assertNotNull($schoolAdmin);
        $this->assertTrue($schoolAdmin->hasRole('admin_sekolah', 'api'));
        $this->assertEquals($school->id, $schoolAdmin->school_id);
    }

    public function test_school_admin_can_create_student(): void
    {
        $school = School::create([
            'name' => 'SMAN 3 Test',
            'npsn' => '11111111',
        ]);

        $schoolAdmin = User::factory()->create([
            'school_id' => $school->id,
            'school' => $school->name,
        ]);
        $this->assignRoleTo($schoolAdmin, 'admin_sekolah');

        $response = $this->actingAs($schoolAdmin, 'api')
            ->postJson('/api/school-admin/students', [
                'name' => 'Budi Siswa',
                'email' => 'budi@test.sch.id',
                'nisn' => '0091234567',
                'program' => 'intensif',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'Budi Siswa']);

        $this->assertDatabaseHas('users', [
            'email' => 'budi@test.sch.id',
            'school_id' => $school->id,
        ]);
    }

    public function test_school_admin_cannot_create_student_for_other_school(): void
    {
        $school1 = School::create(['name' => 'Sekolah A', 'npsn' => '22222222']);
        $school2 = School::create(['name' => 'Sekolah B', 'npsn' => '33333333']);

        $schoolAdmin = User::factory()->create([
            'school_id' => $school1->id,
            'school' => $school1->name,
        ]);
        $this->assignRoleTo($schoolAdmin, 'admin_sekolah');

        // Create student in school2 directly
        $otherStudent = User::factory()->create([
            'school_id' => $school2->id,
            'school' => $school2->name,
        ]);
        $this->assignRoleTo($otherStudent, 'siswa');

        // School admin from school1 tries to update student from school2
        $response = $this->actingAs($schoolAdmin, 'api')
            ->putJson("/api/school-admin/students/{$otherStudent->id}", [
                'name' => 'Hacked Name',
            ]);

        $response->assertStatus(403);
    }

    public function test_school_admin_can_view_own_students(): void
    {
        $school = School::create(['name' => 'SMAN 4 Test', 'npsn' => '44444444']);

        $schoolAdmin = User::factory()->create([
            'school_id' => $school->id,
            'school' => $school->name,
        ]);
        $this->assignRoleTo($schoolAdmin, 'admin_sekolah');

        // Create students for this school
        $students1 = User::factory()->count(3)->create([
            'school_id' => $school->id,
            'school' => $school->name,
        ]);
        foreach ($students1 as $s) {
            $this->assignRoleTo($s, 'siswa');
        }

        // Create students for another school
        $otherSchool = School::create(['name' => 'Sekolah Lain', 'npsn' => '55555555']);
        $students2 = User::factory()->count(2)->create([
            'school_id' => $otherSchool->id,
            'school' => $otherSchool->name,
        ]);
        foreach ($students2 as $s) {
            $this->assignRoleTo($s, 'siswa');
        }

        $response = $this->actingAs($schoolAdmin, 'api')
            ->getJson('/api/school-admin/students');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('students'));
    }

    public function test_school_admin_dashboard_returns_school_stats(): void
    {
        $school = School::create(['name' => 'SMAN 5 Test', 'npsn' => '66666666']);

        $schoolAdmin = User::factory()->create([
            'school_id' => $school->id,
            'school' => $school->name,
        ]);
        $this->assignRoleTo($schoolAdmin, 'admin_sekolah');

        $students = User::factory()->count(5)->create([
            'school_id' => $school->id,
            'school' => $school->name,
        ]);
        foreach ($students as $s) {
            $this->assignRoleTo($s, 'siswa');
        }

        $response = $this->actingAs($schoolAdmin, 'api')
            ->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonFragment(['dashboard_type' => 'admin_sekolah'])
            ->assertJsonFragment(['total_students' => 5]);
    }

    public function test_batch_import_students(): void
    {
        $school = School::create(['name' => 'SMAN 6 Test', 'npsn' => '77777777']);

        $schoolAdmin = User::factory()->create([
            'school_id' => $school->id,
            'school' => $school->name,
        ]);
        $this->assignRoleTo($schoolAdmin, 'admin_sekolah');

        $response = $this->actingAs($schoolAdmin, 'api')
            ->postJson('/api/school-admin/students/batch', [
                'students' => [
                    ['name' => 'Siswa 1', 'email' => 'siswa1@test.sch.id', 'nisn' => '001'],
                    ['name' => 'Siswa 2', 'email' => 'siswa2@test.sch.id', 'nisn' => '002'],
                    ['name' => 'Siswa 3', 'email' => 'siswa3@test.sch.id', 'nisn' => '003'],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['created_count' => 3]);

        $this->assertDatabaseHas('users', ['email' => 'siswa1@test.sch.id', 'school_id' => $school->id]);
        $this->assertDatabaseHas('users', ['email' => 'siswa2@test.sch.id', 'school_id' => $school->id]);
        $this->assertDatabaseHas('users', ['email' => 'siswa3@test.sch.id', 'school_id' => $school->id]);
    }
}
