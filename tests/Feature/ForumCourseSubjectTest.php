<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\ForumPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ForumCourseSubjectTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'siswa', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'tutor', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'tutor', 'guard_name' => 'web']);
    }

    private function authenticateUser(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        auth('api')->setUser($user);

        return ['Authorization' => 'Bearer '.$token];
    }

    public function test_can_fetch_active_courses_for_forum(): void
    {
        $user = User::factory()->create();
        $user->assignRole('siswa');
        $headers = $this->authenticateUser($user);

        Course::create([
            'title' => 'Penalaran Matematika (PM)',
            'slug' => 'penalaran-matematika-pm',
            'category' => 'UTBK',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Course::create([
            'title' => 'Kursus Tidak Aktif',
            'slug' => 'kursus-tidak-aktif',
            'category' => 'UTBK',
            'is_active' => false,
            'sort_order' => 2,
        ]);

        $response = $this->withHeaders($headers)->getJson('/api/forum/courses');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['title' => 'Penalaran Matematika (PM)'])
            ->assertJsonMissing(['title' => 'Kursus Tidak Aktif']);
    }

    public function test_student_can_create_forum_post_with_course_subject(): void
    {
        $user = User::factory()->create();
        $user->assignRole('siswa');
        $headers = $this->authenticateUser($user);

        $course = Course::create([
            'title' => 'Penalaran Umum (TPS)',
            'slug' => 'penalaran-umum-tps',
            'category' => 'TPS',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->withHeaders($headers)->postJson('/api/forum/posts', [
            'course_id' => $course->id,
            'subject' => $course->title,
            'title' => 'Bagaimana cara cepat menyelesaikan soal silogisme?',
            'content' => 'Saya masih bingung jika premisnya menggunakan kata sebagian atau beberapa. Mohon bantuannya tutor.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('post.subject', 'Penalaran Umum (TPS)')
            ->assertJsonPath('post.course_id', $course->id)
            ->assertJsonPath('post.title', 'Bagaimana cara cepat menyelesaikan soal silogisme?');

        $this->assertDatabaseHas('forum_posts', [
            'user_id' => $user->id,
            'course_id' => $course->id,
            'subject' => 'Penalaran Umum (TPS)',
        ]);
    }

    public function test_can_filter_forum_posts_by_course_subject(): void
    {
        $user = User::factory()->create();
        $user->assignRole('siswa');
        $headers = $this->authenticateUser($user);

        $course1 = Course::create([
            'title' => 'Penalaran Umum (TPS)',
            'slug' => 'penalaran-umum-tps',
            'category' => 'TPS',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $course2 = Course::create([
            'title' => 'Pemrograman Python',
            'slug' => 'pemrograman-python',
            'category' => 'Coding',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        ForumPost::create([
            'user_id' => $user->id,
            'course_id' => $course1->id,
            'subject' => $course1->title,
            'title' => 'Pertanyaan TPS 1',
            'content' => 'Isi pertanyaan untuk mata pelajaran TPS nomor 1.',
        ]);

        ForumPost::create([
            'user_id' => $user->id,
            'course_id' => $course2->id,
            'subject' => $course2->title,
            'title' => 'Pertanyaan Python 1',
            'content' => 'Isi pertanyaan untuk mata pelajaran Python nomor 1.',
        ]);

        // Filter by course 1 title
        $response1 = $this->withHeaders($headers)->getJson('/api/forum/posts?subject='.urlencode($course1->title));
        $response1->assertStatus(200);
        $this->assertCount(1, $response1->json('data'));
        $this->assertEquals('Pertanyaan TPS 1', $response1->json('data.0.title'));

        // Filter by semua
        $responseAll = $this->withHeaders($headers)->getJson('/api/forum/posts?subject=semua');
        $responseAll->assertStatus(200);
        $this->assertCount(2, $responseAll->json('data'));
    }

    public function test_can_view_post_detail_and_reply_to_discussion(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');
        $studentHeaders = $this->authenticateUser($student);

        $tutor = User::factory()->create();
        $tutor->assignRole('siswa');
        Role::firstOrCreate(['name' => 'tutor', 'guard_name' => 'api']);
        $tutor->assignRole('tutor');
        $tutorHeaders = $this->authenticateUser($tutor);

        $post = ForumPost::create([
            'user_id' => $student->id,
            'subject' => 'Penalaran Matematika (PM)',
            'title' => 'Cara menyelesaikan persamaan kuadrat',
            'content' => 'Bagaimana menentukan akar persamaan kuadrat dengan rumus abc?',
        ]);

        // Tutor sends a reply
        $replyResponse = $this->withHeaders($tutorHeaders)->postJson("/api/forum/posts/{$post->id}/reply", [
            'content' => 'Gunakan rumus x = (-b +- sqrt(b^2 - 4ac)) / (2a).',
        ]);

        $replyResponse->assertStatus(201)
            ->assertJsonPath('reply.is_tutor_answer', true)
            ->assertJsonPath('reply.content', 'Gunakan rumus x = (-b +- sqrt(b^2 - 4ac)) / (2a).');

        $tutorReplyId = $replyResponse->json('reply.id');

        // Student replies to the tutor's reply (nested reply)
        $nestedReplyResponse = $this->withHeaders($studentHeaders)->postJson("/api/forum/posts/{$post->id}/reply", [
            'content' => 'Terima kasih banyak tutor! Sekarang saya paham.',
            'parent_id' => $tutorReplyId,
        ]);

        $nestedReplyResponse->assertStatus(201)
            ->assertJsonPath('reply.parent_id', $tutorReplyId)
            ->assertJsonPath('reply.parent.user.name', $tutor->name);

        // Fetch detail
        $showResponse = $this->withHeaders($studentHeaders)->getJson("/api/forum/posts/{$post->id}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('post.title', 'Cara menyelesaikan persamaan kuadrat')
            ->assertJsonCount(2, 'post.replies');
    }
}
