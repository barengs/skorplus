<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AssignmentDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_upload_succeeds_for_pdf_and_docx()
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $pdfFile = UploadedFile::fake()->create('tugas.pdf', 500, 'application/pdf');

        $response = $this->actingAs($user, 'api')->postJson('/api/upload/document', [
            'file' => $pdfFile,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'original_name' => 'tugas.pdf',
                'extension' => 'pdf',
            ]);

        $docxFile = UploadedFile::fake()->create('laporan.docx', 500, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $responseDocx = $this->actingAs($user, 'api')->postJson('/api/upload/document', [
            'file' => $docxFile,
        ]);

        $responseDocx->assertStatus(201)
            ->assertJson([
                'success' => true,
                'original_name' => 'laporan.docx',
                'extension' => 'docx',
            ]);
    }

    public function test_assignment_submission_and_revision_flow_with_instructor_review()
    {
        $student = User::factory()->create(['name' => 'Budi Santoso']);
        $studentToken = JWTAuth::fromUser($student);

        $instructor = User::factory()->create(['name' => 'Pak Guru']);
        $instructorToken = JWTAuth::fromUser($instructor);

        $course = Course::create(['title' => 'TPS', 'slug' => 'tps']);
        $module = Module::create(['course_id' => $course->id, 'title' => 'Bab 1', 'sort_order' => 1]);

        $assignment = Lesson::create([
            'module_id' => $module->id,
            'title' => 'Tugas Akhir Proyek',
            'type' => 'assignment',
            'sort_order' => 1,
            'attachment_doc' => 'https://example.com/soal-panduan.pdf',
            'attachment_name' => 'Panduan Tugas Akhir.pdf',
        ]);

        CourseEnrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'total_lessons' => 1,
        ]);

        // 1. Initial submission by student (version 1)
        $sub1Response = $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->postJson("/api/elearning/lessons/{$assignment->id}/assignment/submit", [
                'file_url' => 'https://example.com/tugas_v1.pdf',
                'filename' => 'tugas_budi_v1.pdf',
                'notes' => 'Pengumpulan tugas awal',
            ]);

        $sub1Response->assertStatus(201)
            ->assertJson([
                'submission' => [
                    'version' => 1,
                    'status' => 'submitted',
                ],
            ]);

        $sub1Id = $sub1Response->json('submission.id');

        // 2. Instructor reviews and requests revision
        $review1 = $this->withHeader('Authorization', "Bearer {$instructorToken}")
            ->postJson("/api/admin/elearning/submissions/{$sub1Id}/review", [
                'status' => 'revision_needed',
                'feedback' => 'Tolong tambahkan kesimpulan dan daftar pustaka di bab 4.',
            ]);

        $review1->assertStatus(200)
            ->assertJson([
                'submission' => [
                    'status' => 'revision_needed',
                    'feedback' => 'Tolong tambahkan kesimpulan dan daftar pustaka di bab 4.',
                ],
            ]);

        // 3. Student submits revision (version 2)
        $sub2Response = $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->postJson("/api/elearning/lessons/{$assignment->id}/assignment/submit", [
                'file_url' => 'https://example.com/tugas_v2.docx',
                'filename' => 'tugas_budi_v2.docx',
                'notes' => 'Sudah ditambahkan kesimpulan & daftar pustaka sesuai catatan',
            ]);

        $sub2Response->assertStatus(201)
            ->assertJson([
                'submission' => [
                    'version' => 2,
                    'status' => 'submitted',
                ],
            ]);

        $sub2Id = $sub2Response->json('submission.id');

        // 4. Check history for student - both versions exist
        $historyResponse = $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->getJson("/api/elearning/lessons/{$assignment->id}/assignment/history");
        $historyResponse->assertStatus(200);
        $this->assertCount(2, $historyResponse->json('submissions'));
        $this->assertEquals(2, $historyResponse->json('latest_submission.version'));

        // 5. Instructor approves revision
        $review2 = $this->withHeader('Authorization', "Bearer {$instructorToken}")
            ->postJson("/api/admin/elearning/submissions/{$sub2Id}/review", [
                'status' => 'approved',
                'feedback' => 'Sangat bagus, revisi telah sesuai spesifikasi!',
                'grade' => 95,
            ]);

        $review2->assertStatus(200)
            ->assertJson([
                'submission' => [
                    'status' => 'approved',
                    'grade' => 95,
                ],
            ]);

        // Lesson progress is marked as completed
        $progress = LessonProgress::where('user_id', $student->id)->where('lesson_id', $assignment->id)->first();
        $this->assertNotNull($progress);
        $this->assertTrue((bool) $progress->is_completed);

        // 6. Instructor checks submissions list
        $adminList = $this->withHeader('Authorization', "Bearer {$instructorToken}")
            ->getJson("/api/admin/elearning/modules/{$module->id}/lessons/{$assignment->id}/submissions");
        $adminList->assertStatus(200);
        $this->assertCount(2, $adminList->json('submissions'));
    }
}
