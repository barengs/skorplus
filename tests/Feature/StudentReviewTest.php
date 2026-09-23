<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Program;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class StudentReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'web']);
    }

    private function authenticateUser(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        auth('api')->setUser($user);

        return ['Authorization' => 'Bearer '.$token];
    }

    public function test_student_can_review_course_and_rating_recalculates(): void
    {
        $student1 = User::factory()->create();
        $student1->assignRole('siswa');

        $student2 = User::factory()->create();
        $student2->assignRole('siswa');

        $course = Course::create([
            'title' => 'TPS Penalaran Logika',
            'slug' => 'tps-penalaran-logika',
            'category' => 'TPS UTBK-SNBT',
            'rating' => 0.0,
            'total_reviews' => 0,
        ]);

        // Student 1 reviews 5 stars
        $headers1 = $this->authenticateUser($student1);
        $res1 = $this->postJson("/api/courses/{$course->id}/reviews", [
            'rating' => 5,
            'comment' => 'Penjelasan materi sangat mudah dipahami dan aplikatif!',
        ], $headers1);

        $res1->assertStatus(200)
            ->assertJson([
                'rating' => 5.0,
                'total_reviews' => 1,
            ]);

        $course->refresh();
        $this->assertEquals(5.0, $course->rating);
        $this->assertEquals(1, $course->total_reviews);

        // Student 2 reviews 4 stars
        $headers2 = $this->authenticateUser($student2);
        $res2 = $this->postJson("/api/courses/{$course->id}/reviews", [
            'rating' => 4,
            'comment' => 'Bagus sekali, latihan soalnya menantang.',
        ], $headers2);

        $res2->assertStatus(200)
            ->assertJson([
                'rating' => 4.5,
                'total_reviews' => 2,
            ]);

        $course->refresh();
        $this->assertEquals(4.5, $course->rating);
        $this->assertEquals(2, $course->total_reviews);
    }

    public function test_student_can_update_existing_course_review(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');

        $course = Course::create([
            'title' => 'Literasi Bahasa Indonesia',
            'slug' => 'literasi-bahasa-indonesia',
            'category' => 'TPS UTBK-SNBT',
            'rating' => 0.0,
            'total_reviews' => 0,
        ]);

        $headers = $this->authenticateUser($student);

        // First review: 3 stars
        $this->postJson("/api/courses/{$course->id}/reviews", [
            'rating' => 3,
            'comment' => 'Cukup lumayan.',
        ], $headers)->assertStatus(200);

        $this->assertEquals(1, Review::count());
        $course->refresh();
        $this->assertEquals(3.0, $course->rating);

        // Update review: change to 5 stars
        $this->postJson("/api/courses/{$course->id}/reviews", [
            'rating' => 5,
            'comment' => 'Setelah modul kedua, penjelasannya jadi luar biasa!',
        ], $headers)->assertStatus(200);

        $this->assertEquals(1, Review::count());
        $course->refresh();
        $this->assertEquals(5.0, $course->rating);
        $this->assertEquals('Setelah modul kedua, penjelasannya jadi luar biasa!', Review::first()->comment);
    }

    public function test_student_can_review_program_and_rating_recalculates(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');

        $program = Program::create([
            'name' => 'Program Intensif SNBT',
            'slug' => 'intensif-snbt',
            'price' => 'Rp 500.000',
            'rating' => 0.0,
            'total_reviews' => 0,
        ]);

        $headers = $this->authenticateUser($student);
        $res = $this->postJson("/api/programs/{$program->slug}/reviews", [
            'rating' => 5,
            'comment' => 'Program belajar paling komprehensif, latihan CBT nya sangat mirip dengan UTBK asli.',
        ], $headers);

        $res->assertStatus(200)
            ->assertJson([
                'rating' => 5.0,
                'total_reviews' => 1,
            ]);

        $program->refresh();
        $this->assertEquals(5.0, $program->rating);
        $this->assertEquals(1, $program->total_reviews);

        // Public reviews endpoint returns program reviews
        $getRes = $this->getJson("/api/programs/{$program->slug}/reviews");
        $getRes->assertStatus(200)
            ->assertJsonStructure([
                'rating',
                'total_reviews',
                'reviews',
            ]);
    }

    public function test_review_validation_enforces_rating_range(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');

        $course = Course::create([
            'title' => 'Matematika Dasar',
            'slug' => 'matematika-dasar',
        ]);

        $headers = $this->authenticateUser($student);

        // Rating > 5 rejected
        $this->postJson("/api/courses/{$course->id}/reviews", [
            'rating' => 6,
        ], $headers)->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);

        // Rating < 1 rejected
        $this->postJson("/api/courses/{$course->id}/reviews", [
            'rating' => 0,
        ], $headers)->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }
}
