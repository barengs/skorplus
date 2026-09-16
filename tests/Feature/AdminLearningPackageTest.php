<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\LearningPackage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminLearningPackageTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_learning_package_detail(): void
    {
        $package = LearningPackage::create([
            'name' => 'Paket UTBK',
            'slug' => 'paket-utbk',
            'description' => 'Materi lengkap',
            'price' => 250000,
            'is_published' => true,
        ]);

        $response = $this->getJson("/api/admin/learning-packages/{$package->id}");

        $response->assertUnauthorized();
    }

    public function test_admin_can_view_learning_package_detail_with_courses(): void
    {
        $admin = User::factory()->create();
        $token = JWTAuth::fromUser($admin);

        $package = LearningPackage::create([
            'name' => 'Paket UTBK',
            'slug' => 'paket-utbk',
            'description' => 'Materi lengkap UTBK',
            'price' => 350000,
            'features' => ['Akses 12 Bulan', 'Bank Soal'],
            'is_published' => true,
        ]);

        $course = Course::create([
            'title' => 'Penalaran Umum',
            'slug' => 'penalaran-umum',
            'description' => 'Materi penalaran umum',
            'is_active' => true,
        ]);

        $package->courses()->attach($course->id);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/admin/learning-packages/{$package->id}");

        $response->assertOk()
            ->assertJsonPath('name', 'Paket UTBK')
            ->assertJsonPath('courses.0.title', 'Penalaran Umum');
    }

    public function test_returns_404_if_package_not_found(): void
    {
        $admin = User::factory()->create();
        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/learning-packages/999999');

        $response->assertNotFound();
    }
}
