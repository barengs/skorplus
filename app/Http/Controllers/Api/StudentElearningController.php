<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\LessonProgress;
use Illuminate\Http\Request;

class StudentElearningController extends Controller
{
    public function enroll(Request $request, $courseId)
    {
        $user = $request->user();
        $course = Course::findOrFail($courseId);

        $enrollment = CourseEnrollment::firstOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            [
                'total_lessons' => $course->modules()->withCount('lessons')->get()->sum('lessons_count')
            ]
        );

        return response()->json(['message' => 'Berhasil mendaftar', 'enrollment' => $enrollment]);
    }

    public function markComplete(Request $request, $lessonId)
    {
        $user = $request->user();

        $progress = LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lessonId],
            ['is_completed' => true]
        );

        // Update Course Enrollment Progress
        $lesson = \App\Models\Lesson::findOrFail($lessonId);
        $courseId = $lesson->module->course_id;

        $enrollment = CourseEnrollment::where('user_id', $user->id)->where('course_id', $courseId)->first();
        if ($enrollment) {
            // Hitung total completed
            $completedLessons = LessonProgress::where('user_id', $user->id)
                ->whereHas('lesson.module', function ($q) use ($courseId) {
                    $q->where('course_id', $courseId);
                })
                ->where('is_completed', true)
                ->count();
            
            $enrollment->completed_lessons = $completedLessons;
            $enrollment->progress_percentage = $enrollment->total_lessons > 0 ? round(($completedLessons / $enrollment->total_lessons) * 100) : 0;
            
            if ($enrollment->progress_percentage == 100 && !$enrollment->completed_at) {
                $enrollment->completed_at = now();
                // Nanti kita tambahkan generate certificate logic di sini
            }
            $enrollment->save();
        }

        return response()->json(['message' => 'Lesson marked as completed', 'progress' => $progress]);
    }

    public function getProgress(Request $request, $courseId)
    {
        $user = $request->user();
        
        $enrollment = CourseEnrollment::where('user_id', $user->id)->where('course_id', $courseId)->first();
        
        $completedLessonIds = LessonProgress::where('user_id', $user->id)
                ->whereHas('lesson.module', function ($q) use ($courseId) {
                    $q->where('course_id', $courseId);
                })
                ->where('is_completed', true)
                ->pluck('lesson_id');

        return response()->json([
            'enrollment' => $enrollment,
            'completed_lesson_ids' => $completedLessonIds
        ]);
    }
}
