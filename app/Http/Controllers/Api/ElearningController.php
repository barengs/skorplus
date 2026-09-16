<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LessonProgress;
use Illuminate\Http\Request;

class ElearningController extends Controller
{
    public function courses(Request $request)
    {
        $user = auth('api')->user();

        $query = Course::with(['instructor', 'program'])
            ->withCount('enrollments')
            ->where('is_active', true);

        if ($user) {
            $query->with(['enrollments' => function ($eq) use ($user) {
                $eq->where('user_id', $user->id);
            }]);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%")
                    ->orWhere('instructor_name', 'like', "%{$s}%");
            });
        }

        $courses = $query->orderBy('sort_order')->get();

        $courses = $courses->map(function ($c) {
            $c->participants = $c->enrollments_count ?? 0;
            $c->is_enrolled = $c->enrollments && $c->enrollments->count() > 0;

            return $c;
        });

        return response()->json($courses);
    }

    public function catalog(Request $request)
    {
        $user = auth('api')->user();

        $query = Course::with(['instructor', 'program'])
            ->withCount('enrollments')
            ->where('is_active', true);

        if ($user) {
            $query->with(['enrollments' => function ($eq) use ($user) {
                $eq->where('user_id', $user->id);
            }]);
        }

        $allCourses = $query->orderBy('sort_order')->get()->map(function ($c) {
            $c->participants = $c->enrollments_count ?? 0;
            $c->is_enrolled = $c->enrollments && $c->enrollments->count() > 0;

            return $c;
        });

        $popularCourses = $allCourses->where('is_popular', true)->values();
        if ($popularCourses->isEmpty()) {
            $popularCourses = $allCourses->sortByDesc('rating')->take(6)->values();
        }

        $categories = $allCourses->pluck('category')->filter()->unique()->values();

        return response()->json([
            'popular_courses' => $popularCourses,
            'courses' => $allCourses,
            'categories' => $categories,
        ]);
    }

    public function courseDetail($slug)
    {
        $user = auth('api')->user();

        $course = Course::with([
            'instructor',
            'program',
            'learningPackages',
            'modules' => function ($mq) {
                $mq->orderBy('sort_order');
            },
            'modules.lessons' => function ($lq) {
                $lq->orderBy('sort_order');
            },
        ])->where('slug', $slug)->firstOrFail();

        $course->is_enrolled = $user
            ? $course->enrollments()->where('user_id', $user->id)->exists()
            : false;

        $totalLessons = $course->modules->sum(fn ($m) => $m->lessons->count());
        $totalDurationSeconds = $course->modules->sum(fn ($m) => $m->lessons->sum('duration_seconds'));

        $course->stats = [
            'total_sections' => $course->modules->count(),
            'total_lessons' => $totalLessons,
            'total_duration_minutes' => round($totalDurationSeconds / 60),
            'has_preview' => $course->modules->some(fn ($m) => $m->lessons->some('is_preview')),
        ];

        return response()->json($course);
    }

    public function markComplete($lessonId)
    {
        $user = auth()->user();

        $progress = LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lessonId],
            ['is_completed' => true]
        );

        return response()->json(['message' => 'Lesson marked as complete', 'progress' => $progress]);
    }
}
