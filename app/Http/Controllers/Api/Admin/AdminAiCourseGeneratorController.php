<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Ai\AiCourseGenerationException;
use App\Services\Ai\AiCourseGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAiCourseGeneratorController extends Controller
{
    public function __construct(private AiCourseGeneratorService $generator) {}

    /**
     * Mengunggah dokumen dan mengembalikan draf kursus hasil AI untuk ditinjau (belum disimpan).
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,docx,txt,md|max:20480',
            'category' => 'nullable|string|max:255',
            'module_count' => 'nullable|integer|min:1|max:12',
            'questions_per_quiz' => 'nullable|integer|min:3|max:15',
            'additional_instructions' => 'nullable|string|max:1000',
        ]);

        @set_time_limit(300);

        try {
            $draft = $this->generator->generateDraft($request->file('document'), $validated);
        } catch (AiCourseGenerationException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'draft' => $draft,
            'source_document' => $request->file('document')->getClientOriginalName(),
        ]);
    }

    /**
     * Menyimpan draf yang sudah ditinjau/diedit tutor menjadi kursus, modul, materi,
     * dan opsional menyinkronkan kuis ke Bank Soal & Paket Ujian CBT.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'sync_to_cbt' => 'boolean',
            'cbt_exam_id' => 'nullable|integer|exists:exams,id',
            'cbt_exam_title' => 'nullable|string|max:255',
            'exam_type_id' => 'nullable|integer|exists:exam_types,id',
            'draft.course.title' => 'required|string|max:255',
            'draft.course.category' => 'required|string|max:255',
            'draft.course.description' => 'nullable|string',
            'draft.modules' => 'required|array|min:1',
            'draft.modules.*.title' => 'required|string|max:255',
            'draft.modules.*.knowledge_component' => 'nullable|string|max:255',
            'draft.modules.*.lessons' => 'required|array|min:1',
            'draft.modules.*.lessons.*.title' => 'required|string|max:255',
            'draft.modules.*.lessons.*.type' => 'required|in:reading,quiz',
            'draft.modules.*.lessons.*.summary' => 'nullable|string',
            'draft.modules.*.lessons.*.content' => 'nullable|string',
            'draft.modules.*.lessons.*.duration_minutes' => 'nullable|integer|min:1|max:240',
            'draft.modules.*.lessons.*.quiz_questions' => 'nullable|array',
            'draft.modules.*.lessons.*.quiz_questions.*.question' => 'required|string',
            'draft.modules.*.lessons.*.quiz_questions.*.options' => 'required|array|min:2',
            'draft.modules.*.lessons.*.quiz_questions.*.options.*' => 'required|string',
            'draft.modules.*.lessons.*.quiz_questions.*.correct_index' => 'required|integer|min:0',
            'draft.modules.*.lessons.*.quiz_questions.*.explanation' => 'nullable|string',
            'draft.modules.*.lessons.*.quiz_questions.*.knowledge_component' => 'nullable|string|max:255',
        ]);

        try {
            $course = $this->generator->persistDraft(
                $validated['draft'],
                $validated['is_active'] ?? false,
                [
                    'sync_to_cbt' => $validated['sync_to_cbt'] ?? false,
                    'cbt_exam_id' => $validated['cbt_exam_id'] ?? null,
                    'cbt_exam_title' => $validated['cbt_exam_title'] ?? null,
                    'exam_type_id' => $validated['exam_type_id'] ?? null,
                ]
            );
        } catch (AiCourseGenerationException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json($course, 201);
    }
}
