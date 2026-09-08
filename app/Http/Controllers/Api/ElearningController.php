<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;

class ElearningController extends Controller
{
    public function courses()
    {
        $user = auth('api')->user();
        
        $courses = Course::withCount('enrollments')
            ->where('is_active', true)
            ->when($user, function ($q) use ($user) {
                $q->with(['enrollments' => function ($eq) use ($user) {
                    $eq->where('user_id', $user->id);
                }]);
            })
            ->orderBy('sort_order')
            ->get();

        $courses = $courses->map(function ($c) {
            $c->participants = $c->enrollments_count ?? 0;
            $c->is_enrolled = $c->enrollments && $c->enrollments->count() > 0;
            return $c;
        });

        return response()->json($courses);
    }

    public function courseDetail($slug)
    {
        $course = Course::with(['modules.lessons' => function($q) {
            $q->orderBy('sort_order');
        }])->where('slug', $slug)->firstOrFail();

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
