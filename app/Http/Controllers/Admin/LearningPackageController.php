<?php

namespace App\Http\Controllers\Admin;

use App\Models\LearningPackage;
use App\Models\Course;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Str;

class LearningPackageController extends Controller
{
    public function index()
    {
        $packages = LearningPackage::with('courses')->paginate(15);
        return response()->json($packages);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'thumbnail' => 'nullable|string',
            'features' => 'nullable|array',
            'is_published' => 'boolean',
            'course_ids' => 'nullable|array',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $package = LearningPackage::create($validated);

        if (!empty($validated['course_ids'])) {
            $package->courses()->sync($validated['course_ids']);
        }

        return response()->json($package->load('courses'), 201);
    }

    public function show($id)
    {
        $package = LearningPackage::with('courses')->findOrFail($id);
        return response()->json($package);
    }

    public function update(Request $request, $id)
    {
        $package = LearningPackage::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'thumbnail' => 'nullable|string',
            'features' => 'nullable|array',
            'is_published' => 'boolean',
            'course_ids' => 'nullable|array',
        ]);

        if ($validated['name'] !== $package->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $package->update($validated);

        if (isset($validated['course_ids'])) {
            $package->courses()->sync($validated['course_ids']);
        }

        return response()->json($package->load('courses'));
    }

    public function destroy($id)
    {
        $package = LearningPackage::findOrFail($id);
        $package->delete();
        return response()->json(null, 204);
    }

    public function getCourses()
    {
        $courses = Course::select('id', 'title', 'slug', 'thumbnail')->get();
        return response()->json($courses);
    }
}
