<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_endpoint_returns_popular_courses_all_courses_and_categories(): void
    {
        $program = Program::create([
            'name' => 'Intensif',
            'slug' => 'intensif',
            'price' => 'Rp 750.000',
            'is_active' => true,
        ]);

        Course::create([
            'title' => 'Python Pemula',
            'slug' => 'python-pemula',
            'category' => 'Python',
            'program_id' => $program->id,
            'program_name' => 'Program Intensif',
            'instructor_name' => 'Programmer Zaman Now',
            'rating' => 4.8,
            'total_reviews' => 100,
            'is_popular' => true,
            'is_bestseller' => true,
            'is_active' => true,
        ]);

        Course::create([
            'title' => 'SEO Marketing',
            'slug' => 'seo-marketing',
            'category' => 'Pemasaran Digital',
            'program_id' => $program->id,
            'program_name' => 'Program Intensif',
            'instructor_name' => 'Growth Academy',
            'rating' => 4.6,
            'total_reviews' => 50,
            'is_popular' => false,
            'is_bestseller' => false,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/elearning/catalog');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'popular_courses',
                'courses',
                'categories',
            ]);

        $data = $response->json();
        $this->assertCount(1, $data['popular_courses']);
        $this->assertEquals('Python Pemula', $data['popular_courses'][0]['title']);
        $this->assertCount(2, $data['courses']);
        $this->assertContains('Python', $data['categories']);
        $this->assertContains('Pemasaran Digital', $data['categories']);
    }

    public function test_courses_endpoint_can_filter_by_category_and_search(): void
    {
        $program = Program::create([
            'name' => 'Mandiri',
            'slug' => 'mandiri',
            'price' => 'Rp 350.000',
            'is_active' => true,
        ]);

        Course::create([
            'title' => 'Dasar Pemrograman Python',
            'slug' => 'dasar-pemrograman-python',
            'category' => 'Python',
            'program_id' => $program->id,
            'program_name' => 'Program Mandiri',
            'is_active' => true,
        ]);

        Course::create([
            'title' => 'Manajemen Proyek Agile',
            'slug' => 'manajemen-proyek-agile',
            'category' => 'Perencanaan Proyek',
            'program_id' => $program->id,
            'program_name' => 'Program Mandiri',
            'is_active' => true,
        ]);

        // Filter by category
        $resCategory = $this->getJson('/api/elearning/courses?category=Python');
        $resCategory->assertStatus(200);
        $this->assertCount(1, $resCategory->json());
        $this->assertEquals('Dasar Pemrograman Python', $resCategory->json()[0]['title']);

        // Search by query
        $resSearch = $this->getJson('/api/elearning/courses?search=Agile');
        $resSearch->assertStatus(200);
        $this->assertCount(1, $resSearch->json());
        $this->assertEquals('Manajemen Proyek Agile', $resSearch->json()[0]['title']);
    }

    public function test_program_detail_endpoint_returns_program_courses_and_learning_path(): void
    {
        $program = Program::create([
            'name' => 'Intensif',
            'slug' => 'intensif',
            'price' => 'Rp 750.000',
            'is_active' => true,
        ]);

        Course::create([
            'title' => 'TPS Intensif',
            'slug' => 'tps-intensif',
            'category' => 'TPS',
            'program_id' => $program->id,
            'program_name' => 'Program Intensif',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/programs/intensif');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'program' => [
                    'id',
                    'name',
                    'slug',
                    'learning_path',
                ],
                'courses',
                'all_programs',
            ]);

        $data = $response->json();
        $this->assertEquals('Intensif', $data['program']['name']);
        $this->assertNotEmpty($data['program']['learning_path']);
        $this->assertCount(1, $data['courses']);
        $this->assertEquals('TPS Intensif', $data['courses'][0]['title']);
    }
}
