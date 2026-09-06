<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminElearningController extends Controller
{
    public function index()
    {
        return response()->json(Course::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'thumbnail' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . time();
        $validated['sort_order'] = Course::max('sort_order') + 1;
        $validated['has_certificate'] = true; // Always true per request

        $course = Course::create($validated);
        return response()->json($course, 201);
    }

    public function show($id)
    {
        return response()->json(Course::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'thumbnail' => 'nullable|string',
        ]);

        if (isset($validated['title']) && $validated['title'] !== $course->title) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . time();
        }

        $course->update($validated);
        return response()->json($course);
    }

    public function destroy($id)
    {
        Course::destroy($id);
        return response()->json(null, 204);
    }
}
