<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\LearningPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LearningPackageController extends Controller
{
    public function index()
    {
        $packages = LearningPackage::with(['courses', 'exams'])->paginate(15);

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
            'cbt_quota' => 'nullable|integer|min:0',
            'course_ids' => 'nullable|array',
            'exam_ids' => 'nullable|array',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $package = LearningPackage::create($validated);

        if (! empty($validated['course_ids'])) {
            $package->courses()->sync($validated['course_ids']);
        }

        if (! empty($validated['exam_ids'])) {
            $package->exams()->sync($validated['exam_ids']);
        }

        return response()->json($package->load(['courses', 'exams']), 201);
    }

    public function show($id)
    {
        $package = LearningPackage::with([
            'courses' => function ($query) {
                $query->withCount(['modules', 'enrollments'])
                    ->with(['instructor', 'modules.lessons']);
            },
            'exams' => function ($query) {
                $query->with('examType:id,name,code')->withCount('questions');
            },
        ])->findOrFail($id);

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
            'cbt_quota' => 'nullable|integer|min:0',
            'course_ids' => 'nullable|array',
            'exam_ids' => 'nullable|array',
        ]);

        if ($validated['name'] !== $package->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $package->update($validated);

        if (isset($validated['course_ids'])) {
            $package->courses()->sync($validated['course_ids']);
        }

        if (isset($validated['exam_ids'])) {
            $package->exams()->sync($validated['exam_ids']);
        }

        return response()->json($package->load(['courses', 'exams']));
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

    public function getExams()
    {
        $exams = Exam::with('examType:id,name,code')
            ->withCount('questions')
            ->select('id', 'title', 'exam_type_id', 'duration_minutes', 'is_active', 'start_time', 'end_time', 'schedule_type')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($exams);
    }
}
