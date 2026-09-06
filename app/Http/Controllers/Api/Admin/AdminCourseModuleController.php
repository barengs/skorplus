<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use Illuminate\Http\Request;

class AdminCourseModuleController extends Controller
{
    public function index($courseId)
    {
        $course = Course::findOrFail($courseId);
        $modules = $course->modules()->with('lessons')->orderBy('sort_order')->get();
        return response()->json($modules);
    }

    public function store(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $sortOrder = $course->modules()->max('sort_order') + 1;
        $module = $course->modules()->create([
            'title' => $validated['title'],
            'sort_order' => $sortOrder
        ]);

        return response()->json($module->load('lessons'), 201);
    }

    public function update(Request $request, $courseId, $moduleId)
    {
        $module = Module::where('course_id', $courseId)->findOrFail($moduleId);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'sort_order' => 'sometimes|integer',
        ]);

        $module->update($validated);

        return response()->json($module->load('lessons'));
    }

    public function destroy($courseId, $moduleId)
    {
        $module = Module::where('course_id', $courseId)->findOrFail($moduleId);
        $module->delete();
        return response()->json(null, 204);
    }
}
