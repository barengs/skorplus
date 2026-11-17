<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\Question;
use App\Models\User;
use App\Services\Ai\AiCourseGeneratorService;
use App\Services\KnowledgeTracingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AiCourseGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.model' => 'gemini-2.5-flash',
        ]);

        $this->token = JWTAuth::fromUser(User::factory()->create());
    }

    /**
     * @return array<string, mixed>
     */
    private function fakeAiDraft(): array
    {
        return [
            'course' => [
                'title' => 'Dasar Logika Proposisi',
                'description' => '<p>Kursus logika.</p><script>alert(1)</script>',
                'category' => 'TPS UTBK-SNBT',
            ],
            'modules' => [
                [
                    'title' => 'Pernyataan dan Negasi',
                    'knowledge_component' => 'Logika Proposisi Dasar',
                    'lessons' => [
                        [
                            'title' => 'Mengenal Pernyataan',
                            'type' => 'reading',
                            'summary' => 'Pernyataan bernilai benar atau salah.',
                            'content' => '<p onclick="steal()">Pernyataan adalah kalimat.</p>',
                            'duration_minutes' => 12,
                        ],
                        [
                            'title' => 'Kuis Modul 1',
                            'type' => 'quiz',
                            'summary' => 'Evaluasi modul 1.',
                            'content' => '',
                            'duration_minutes' => 10,
                            'quiz_questions' => [
                                [
                                    'question' => 'Negasi dari "p" adalah?',
                                    'options' => ['~p', 'p', 'q', 'p ∧ q'],
                                    'correct_index' => 9,
                                    'explanation' => 'Negasi ditulis ~p.',
                                    'knowledge_component' => 'Operasi Negasi',
                                ],
                                [
                                    'question' => 'Jika P maka Q, dan P benar, kesimpulannya?',
                                    'options' => ['Q benar', 'Q salah', 'P salah', 'Tidak dapat disimpulkan'],
                                    'correct_index' => 0,
                                    'explanation' => 'Aturan Modus Ponens.',
                                    'knowledge_component' => 'Modus Ponens',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    private function fakeGeminiSuccess(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    ['content' => ['parts' => [['text' => json_encode($this->fakeAiDraft())]]]],
                ],
            ]),
        ]);
    }

    public function test_admin_can_generate_sanitized_draft_from_text_document(): void
    {
        $this->fakeGeminiSuccess();

        $document = UploadedFile::fake()->createWithContent('materi.txt', str_repeat('Logika proposisi membahas pernyataan. ', 20));

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->post('/api/admin/elearning/ai-generator/generate', [
                'document' => $document,
                'module_count' => 3,
                'questions_per_quiz' => 5,
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('draft.course.title', 'Dasar Logika Proposisi')
            ->assertJsonPath('draft.course.description', '<p>Kursus logika.</p>')
            ->assertJsonPath('draft.modules.0.knowledge_component', 'Logika Proposisi Dasar')
            ->assertJsonPath('draft.modules.0.lessons.0.content', '<p>Pernyataan adalah kalimat.</p>')
            ->assertJsonPath('draft.modules.0.lessons.1.quiz_questions.0.correct_index', 3)
            ->assertJsonPath('draft.modules.0.lessons.1.quiz_questions.0.knowledge_component', 'Operasi Negasi');

        $this->assertSame(0, Course::count());

        Http::assertSent(function (HttpRequest $request): bool {
            return str_contains($request->url(), 'models/gemini-2.5-flash:generateContent')
                && $request->hasHeader('x-goog-api-key', 'test-key')
                && $request['generationConfig']['responseMimeType'] === 'application/json'
                && str_contains($request['contents'][0]['parts'][1]['text'], 'tepat 3 modul');
        });
    }

    public function test_pdf_document_is_sent_as_inline_data(): void
    {
        $this->fakeGeminiSuccess();

        $document = UploadedFile::fake()->createWithContent('modul.pdf', '%PDF-1.4 fake pdf content');

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->post('/api/admin/elearning/ai-generator/generate', ['document' => $document], ['Accept' => 'application/json'])
            ->assertOk();

        Http::assertSent(fn (HttpRequest $request): bool => ($request['contents'][0]['parts'][0]['inline_data']['mime_type'] ?? null) === 'application/pdf');
    }

    public function test_generate_returns_error_when_api_key_missing(): void
    {
        config(['services.gemini.key' => null]);
        Http::fake();

        $document = UploadedFile::fake()->createWithContent('materi.txt', str_repeat('Isi materi. ', 50));

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->post('/api/admin/elearning/ai-generator/generate', ['document' => $document], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'GEMINI_API_KEY belum dikonfigurasi pada server.');

        Http::assertNothingSent();
    }

    public function test_generate_rejects_unsupported_file_type(): void
    {
        Http::fake();

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->post('/api/admin/elearning/ai-generator/generate', [
                'document' => UploadedFile::fake()->create('virus.exe', 10),
            ], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('document');
    }

    public function test_generate_returns_error_when_ai_service_fails(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(['error' => ['message' => 'Quota exceeded']], 429),
        ]);

        $document = UploadedFile::fake()->createWithContent('materi.txt', str_repeat('Isi materi. ', 50));

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->post('/api/admin/elearning/ai-generator/generate', ['document' => $document], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Quota exceeded');
    }

    public function test_admin_can_store_reviewed_draft_as_course_modules_and_lessons(): void
    {
        $draft = $this->fakeAiDraft();
        $draft['modules'][0]['lessons'][1]['quiz_questions'][0]['correct_index'] = 0;

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/admin/elearning/ai-generator/store', [
                'is_active' => false,
                'draft' => $draft,
            ]);

        $response->assertCreated()->assertJsonPath('title', 'Dasar Logika Proposisi');

        $course = Course::with('modules.lessons')->firstOrFail();
        $this->assertFalse($course->is_active);
        $this->assertCount(1, $course->modules);

        $lessons = $course->modules->first()->lessons;
        $this->assertCount(2, $lessons);
        $this->assertSame('reading', $lessons[0]->type);
        $this->assertSame(720, $lessons[0]->duration_seconds);
        $this->assertSame('quiz', $lessons[1]->type);
        $this->assertSame(60, $lessons[1]->min_pass_score);
        $this->assertSame('~p', $lessons[1]->quiz_questions[0]['options'][0]);
        $this->assertSame('Operasi Negasi', $lessons[1]->quiz_questions[0]['knowledge_component']);
    }

    public function test_admin_can_sync_quiz_questions_to_new_cbt_exam_with_knowledge_component_tags(): void
    {
        $draft = $this->fakeAiDraft();
        $draft['modules'][0]['lessons'][1]['quiz_questions'][0]['correct_index'] = 0;

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/admin/elearning/ai-generator/store', [
                'is_active' => true,
                'sync_to_cbt' => true,
                'cbt_exam_title' => 'Tryout Evaluasi Logika AI',
                'draft' => $draft,
            ]);

        $response->assertCreated()
            ->assertJsonPath('synced_cbt_exam.title', 'Tryout Evaluasi Logika AI')
            ->assertJsonPath('synced_cbt_exam.questions_synced_count', 2)
            ->assertJsonPath('synced_cbt_exam.total_questions', 2);

        $exam = Exam::with('questions.options')->firstOrFail();
        $this->assertSame('Tryout Evaluasi Logika AI', $exam->title);
        $this->assertSame(2, $exam->total_questions);
        $this->assertCount(2, $exam->questions);

        $firstQuestion = $exam->questions->firstWhere('knowledge_component', 'Operasi Negasi');
        $this->assertNotNull($firstQuestion);
        $this->assertSame('TPS UTBK-SNBT', $firstQuestion->subject);
        $this->assertSame('Pernyataan dan Negasi', $firstQuestion->subtest);
        $this->assertCount(4, $firstQuestion->options);
        $this->assertTrue((bool) $firstQuestion->options->firstWhere('option_key', 'A')->is_correct);
    }

    public function test_admin_can_append_synced_questions_to_existing_cbt_exam(): void
    {
        $existingExam = Exam::create([
            'title' => 'Bank Soal Utama TPS',
            'duration_minutes' => 60,
            'total_questions' => 1,
            'passing_score' => 60,
            'is_active' => true,
        ]);

        $existingQuestion = Question::create([
            'question_type' => 'single_choice',
            'question_text' => 'Soal lama',
            'points' => 5,
            'is_active' => true,
        ]);
        $existingExam->questions()->attach($existingQuestion->id, ['sort_order' => 1]);

        $draft = $this->fakeAiDraft();
        $draft['modules'][0]['lessons'][1]['quiz_questions'][0]['correct_index'] = 0;

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/admin/elearning/ai-generator/store', [
                'is_active' => true,
                'sync_to_cbt' => true,
                'cbt_exam_id' => $existingExam->id,
                'draft' => $draft,
            ]);

        $response->assertCreated()
            ->assertJsonPath('synced_cbt_exam.id', $existingExam->id)
            ->assertJsonPath('synced_cbt_exam.questions_synced_count', 2)
            ->assertJsonPath('synced_cbt_exam.total_questions', 3);

        $this->assertSame(3, $existingExam->fresh()->total_questions);
    }

    public function test_bkt_service_tracks_knowledge_component_mastery_from_generated_quiz(): void
    {
        $draft = $this->fakeAiDraft();
        $draft['modules'][0]['lessons'][1]['quiz_questions'][0]['correct_index'] = 0;

        $course = app(AiCourseGeneratorService::class)->persistDraft($draft, true);
        $quizLesson = $course->modules->first()->lessons->firstWhere('type', 'quiz');

        $student = User::factory()->create();
        $studentToken = JWTAuth::fromUser($student);
        CourseEnrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'total_lessons' => 2,
        ]);

        $this->withHeader('Authorization', "Bearer {$studentToken}")
            ->postJson("/api/elearning/lessons/{$quizLesson->id}/quiz/submit", [
                'answers' => [
                    0 => 0, // Operasi Negasi -> benar
                    1 => 1, // Modus Ponens -> salah
                ],
            ])
            ->assertOk()
            ->assertJsonPath('evaluations.0.knowledge_component', 'Operasi Negasi')
            ->assertJsonPath('evaluations.1.knowledge_component', 'Modus Ponens');

        $bkt = app(KnowledgeTracingService::class);
        $mastery = $bkt->getStudentTopicMastery($student);

        $this->assertCount(2, $mastery['knowledge_components']);
        $negasiKc = collect($mastery['knowledge_components'])->firstWhere('name', 'Operasi Negasi');
        $ponensKc = collect($mastery['knowledge_components'])->firstWhere('name', 'Modus Ponens');

        $this->assertNotNull($negasiKc);
        $this->assertNotNull($ponensKc);
        $this->assertGreaterThan($ponensKc['mastery_percentage'], $negasiKc['mastery_percentage']);
    }

    public function test_store_validates_draft_structure(): void
    {
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/admin/elearning/ai-generator/store', [
                'draft' => ['course' => ['title' => 'Tanpa Modul', 'category' => 'TPS'], 'modules' => []],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('draft.modules');

        $this->assertSame(0, Course::count());
    }
}
