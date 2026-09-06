<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Lesson;
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
            'summary' => 'nullable|string',
            'content' => 'nullable|string',
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
            'summary' => 'nullable|string',
            'content' => 'nullable|string',
            'is_preview' => 'boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $lesson->update($validated);

        return response()->json($lesson);
    }

    public function destroy($moduleId, $lessonId)
    {
        $lesson = Lesson::where('module_id', $moduleId)->findOrFail($lessonId);
        $lesson->delete();
        return response()->json(null, 204);
    }
}
