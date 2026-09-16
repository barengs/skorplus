<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Module;
use Illuminate\Http\Request;

class AdminModuleLessonController extends Controller
{
    public function store(Request $request, $moduleId)
    {
        $module = Module::findOrFail($moduleId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:video,reading,quiz,assignment',
            'video_url' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
            'attachment_pdf' => 'nullable|string',
            'attachment_doc' => 'nullable|string',
            'attachment_name' => 'nullable|string',
            'summary' => 'nullable|string',
            'content' => 'nullable|string',
            'quiz_questions' => 'nullable|array',
            'min_pass_score' => 'nullable|integer|min:0|max:100',
            'is_preview' => 'boolean',
        ]);

        $sortOrder = $module->lessons()->max('sort_order') + 1;
        $lesson = $module->lessons()->create(array_merge($validated, ['sort_order' => $sortOrder]));

        return response()->json($lesson, 201);
    }

    public function update(Request $request, $moduleId, $lessonId)
    {
        $lesson = Lesson::where('module_id', $moduleId)->findOrFail($lessonId);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:video,reading,quiz,assignment',
            'video_url' => 'nullable|string',
            'duration_seconds' => 'nullable|integer',
            'attachment_pdf' => 'nullable|string',
            'attachment_doc' => 'nullable|string',
            'attachment_name' => 'nullable|string',
            'summary' => 'nullable|string',
            'content' => 'nullable|string',
            'quiz_questions' => 'nullable|array',
            'min_pass_score' => 'nullable|integer|min:0|max:100',
            'is_preview' => 'boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $lesson->update($validated);

        return response()->json($lesson);
    }

    public function getAssignmentSubmissions(Request $request, $moduleId, $lessonId)
    {
        $lesson = Lesson::where('module_id', $moduleId)->findOrFail($lessonId);

        $submissions = AssignmentSubmission::where('lesson_id', $lesson->id)
            ->with(['user', 'reviewer'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'lesson' => $lesson,
            'submissions' => $submissions,
        ]);
    }

    public function reviewAssignmentSubmission(Request $request, $submissionId)
    {
        $submission = AssignmentSubmission::findOrFail($submissionId);

        $validated = $request->validate([
            'status' => 'required|in:approved,revision_needed',
            'feedback' => 'nullable|string',
            'grade' => 'nullable|integer|min:0|max:100',
        ]);

        $submission->update([
            'status' => $validated['status'],
            'feedback' => $validated['feedback'] ?? null,
            'grade' => $validated['grade'] ?? $submission->grade,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // If approved, also mark lesson progress as completed
        if ($validated['status'] === 'approved') {
            LessonProgress::updateOrCreate(
                ['user_id' => $submission->user_id, 'lesson_id' => $submission->lesson_id],
                ['is_completed' => true]
            );
        }

        return response()->json([
            'message' => $validated['status'] === 'approved' ? 'Tugas akhir disetujui.' : 'Revisi tugas akhir diminta kepada siswa.',
            'submission' => $submission->load(['user', 'reviewer']),
        ]);
    }

    public function destroy($moduleId, $lessonId)
    {
        $lesson = Lesson::where('module_id', $moduleId)->findOrFail($lessonId);
        $lesson->delete();

        return response()->json(null, 204);
    }
}
