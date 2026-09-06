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
        $courses = Course::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

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
