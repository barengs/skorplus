<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
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
                'total_lessons' => $course->modules()->withCount('lessons')->get()->sum('lessons_count'),
            ]
        );

        return response()->json(['message' => 'Berhasil mendaftar', 'enrollment' => $enrollment]);
    }

    public function markComplete(Request $request, $lessonId)
    {
        $user = $request->user();
        $lesson = Lesson::with('module.course.modules.lessons')->findOrFail($lessonId);
        $course = $lesson->module->course;

        // Check prerequisite: if any previous module has a quiz that has not passed (>= 60%), lock this lesson!
        $allModules = $course->modules()->orderBy('sort_order')->with('lessons')->get();
        $currentModuleIndex = $allModules->search(fn ($m) => $m->id === $lesson->module_id);

        if ($currentModuleIndex > 0) {
            for ($i = 0; $i < $currentModuleIndex; $i++) {
                $prevModule = $allModules[$i];
                $quizLessons = $prevModule->lessons->where('type', 'quiz');
                foreach ($quizLessons as $ql) {
                    $qlProgress = LessonProgress::where('user_id', $user->id)
                        ->where('lesson_id', $ql->id)
                        ->first();
                    $minPass = $ql->min_pass_score ?? 60;
                    if (! $qlProgress || ($qlProgress->score_percentage ?? 0) < $minPass) {
                        return response()->json([
                            'message' => 'Kelompok materi ini terkunci. Selesaikan kuis pada "'.$prevModule->title.'" dengan skor minimal '.$minPass.'% terlebih dahulu.',
                            'locked' => true,
                            'locked_by_module' => $prevModule->title,
                        ], 403);
                    }
                }
            }
        }

        $progress = LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lessonId],
            ['is_completed' => true]
        );

        // Update Course Enrollment Progress
        $courseId = $course->id;
        $enrollment = CourseEnrollment::where('user_id', $user->id)->where('course_id', $courseId)->first();
        if ($enrollment) {
            $completedLessons = LessonProgress::where('user_id', $user->id)
                ->whereHas('lesson.module', function ($q) use ($courseId) {
                    $q->where('course_id', $courseId);
                })
                ->where('is_completed', true)
                ->count();

            $enrollment->completed_lessons = $completedLessons;
            $enrollment->progress_percentage = $enrollment->total_lessons > 0 ? (int) round(($completedLessons / $enrollment->total_lessons) * 100) : 0;

            if ($enrollment->progress_percentage === 100 && ! $enrollment->completed_at) {
                $enrollment->completed_at = now();
            }
            $enrollment->save();
        }

        return response()->json(['message' => 'Materi berhasil diselesaikan', 'progress' => $progress]);
    }

    public function submitQuiz(Request $request, $lessonId)
    {
        $user = $request->user();
        $lesson = Lesson::with('module.course.modules.lessons')->findOrFail($lessonId);

        if ($lesson->type !== 'quiz') {
            return response()->json(['message' => 'Materi ini bukan kuis.'], 422);
        }

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $quizQuestions = $lesson->quiz_questions ?? [];
        $totalQuestions = count($quizQuestions);

        if ($totalQuestions === 0) {
            return response()->json(['message' => 'Kuis belum memiliki pertanyaan.'], 422);
        }

        $userAnswers = $validated['answers'];
        $answerMap = [];
        foreach ($userAnswers as $key => $val) {
            if (is_array($val) && isset($val['question_index'])) {
                $answerMap[(int) $val['question_index']] = isset($val['selected_option_index']) ? (int) $val['selected_option_index'] : null;
            } else {
                $answerMap[(int) $key] = $val !== null ? (int) $val : null;
            }
        }

        $correctCount = 0;
        $evaluations = [];

        foreach ($quizQuestions as $index => $q) {
            $userSelectedIndex = $answerMap[$index] ?? null;
            $correctIndex = isset($q['correct_index']) ? (int) $q['correct_index'] : 0;
            $isCorrect = ($userSelectedIndex !== null && $userSelectedIndex === $correctIndex);

            if ($isCorrect) {
                $correctCount++;
            }

            $evaluations[] = [
                'question_index' => $index,
                'question' => $q['question'] ?? '',
                'options' => $q['options'] ?? [],
                'user_selected_index' => $userSelectedIndex,
                'correct_index' => $correctIndex,
                'is_correct' => $isCorrect,
                'explanation' => $q['explanation'] ?? null,
            ];
        }

        $scorePercentage = (int) round(($correctCount / $totalQuestions) * 100);
        $minPassScore = $lesson->min_pass_score ?? 60;
        $isPassed = ($scorePercentage >= $minPassScore);

        $attemptData = [
            'score_percentage' => $scorePercentage,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuestions,
            'min_pass_score' => $minPassScore,
            'is_passed' => $isPassed,
            'evaluations' => $evaluations,
            'attempted_at' => now()->toIso8601String(),
        ];

        $progress = LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'is_completed' => $isPassed,
                'score_percentage' => $scorePercentage,
                'quiz_attempt_data' => $attemptData,
            ]
        );

        // Update Course Enrollment Progress if passed
        $courseId = $lesson->module->course_id;
        $enrollment = CourseEnrollment::where('user_id', $user->id)->where('course_id', $courseId)->first();
        if ($enrollment) {
            $completedLessons = LessonProgress::where('user_id', $user->id)
                ->whereHas('lesson.module', function ($q) use ($courseId) {
                    $q->where('course_id', $courseId);
                })
                ->where('is_completed', true)
                ->count();

            $enrollment->completed_lessons = $completedLessons;
            $enrollment->progress_percentage = $enrollment->total_lessons > 0 ? (int) round(($completedLessons / $enrollment->total_lessons) * 100) : 0;

            if ($enrollment->progress_percentage === 100 && ! $enrollment->completed_at) {
                $enrollment->completed_at = now();
            }
            $enrollment->save();
        }

        return response()->json([
            'message' => $isPassed
                ? 'Selamat! Anda berhasil lulus kuis dengan skor '.$scorePercentage.'%'
                : 'Skor Anda '.$scorePercentage.'%. Nilai minimal untuk membuka kelompok materi berikutnya adalah '.$minPassScore.'%. Silakan ulangi kuis untuk melanjutkan.',
            'is_passed' => $isPassed,
            'score_percentage' => $scorePercentage,
            'min_pass_score' => $minPassScore,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuestions,
            'evaluations' => $evaluations,
            'progress' => $progress,
        ]);
    }

    public function getProgress(Request $request, $courseId)
    {
        $user = $request->user();
        $course = Course::with(['modules.lessons'])->findOrFail($courseId);
        $enrollment = CourseEnrollment::where('user_id', $user->id)->where('course_id', $courseId)->first();

        $allProgress = LessonProgress::where('user_id', $user->id)
            ->whereHas('lesson.module', function ($q) use ($courseId) {
                $q->where('course_id', $courseId);
            })
            ->get();

        $completedLessonIds = $allProgress->where('is_completed', true)->pluck('lesson_id')->values();
        $lessonScores = [];
        $quizAttempts = [];

        foreach ($allProgress as $prog) {
            if ($prog->score_percentage !== null) {
                $lessonScores[$prog->lesson_id] = $prog->score_percentage;
            }
            if ($prog->quiz_attempt_data !== null) {
                $quizAttempts[$prog->lesson_id] = $prog->quiz_attempt_data;
            }
        }

        // Calculate module locks: if a previous module has a quiz that user did not pass with >= 60%, lock next modules
        $lockedModuleIds = [];
        $hasFailedQuiz = false;
        $failedModuleTitle = '';
        $modules = $course->modules->sortBy('sort_order')->values();

        foreach ($modules as $index => $mod) {
            if ($hasFailedQuiz) {
                $lockedModuleIds[] = $mod->id;

                continue;
            }

            // Check if this module has a quiz
            $quizzes = $mod->lessons->where('type', 'quiz');
            foreach ($quizzes as $q) {
                $qScore = $lessonScores[$q->id] ?? null;
                $minPass = $q->min_pass_score ?? 60;
                if ($qScore === null || $qScore < $minPass) {
                    $hasFailedQuiz = true;
                    $failedModuleTitle = $mod->title;
                    break;
                }
            }
        }

        // Calculate quiz benchmark for course / final assignment
        $allQuizLessons = $course->modules->flatMap->lessons->where('type', 'quiz')->values();
        $quizCount = $allQuizLessons->count();
        $totalScores = 0;
        $passedQuizCount = 0;
        $quizSummaries = [];

        foreach ($allQuizLessons as $ql) {
            $score = $lessonScores[$ql->id] ?? null;
            $minPass = $ql->min_pass_score ?? 60;
            $passed = ($score !== null && $score >= $minPass);
            if ($passed) {
                $passedQuizCount++;
            }
            if ($score !== null) {
                $totalScores += $score;
            }

            $quizSummaries[] = [
                'lesson_id' => $ql->id,
                'title' => $ql->title,
                'module_id' => $ql->module_id,
                'score_percentage' => $score,
                'min_pass_score' => $minPass,
                'is_passed' => $passed,
            ];
        }

        $averageQuizScore = $quizCount > 0 && $allProgress->whereIn('lesson_id', $allQuizLessons->pluck('id'))->count() > 0
            ? (int) round($totalScores / max(1, $allProgress->whereIn('lesson_id', $allQuizLessons->pluck('id'))->whereNotNull('score_percentage')->count()))
            : 0;

        $isEligibleForAssignment = ($quizCount === 0) || ($passedQuizCount === $quizCount);

        // Fetch user's assignment submissions for this course's assignment lessons
        $assignmentLessonIds = $course->modules->flatMap->lessons->where('type', 'assignment')->pluck('id');
        $assignmentSubmissions = AssignmentSubmission::where('user_id', $user->id)
            ->whereIn('lesson_id', $assignmentLessonIds)
            ->with('reviewer')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('lesson_id');

        return response()->json([
            'enrollment' => $enrollment,
            'completed_lesson_ids' => $completedLessonIds,
            'lesson_scores' => $lessonScores,
            'quiz_attempts' => $quizAttempts,
            'assignment_submissions' => $assignmentSubmissions,
            'locked_module_ids' => $lockedModuleIds,
            'locked_by_module_title' => $failedModuleTitle,
            'quiz_benchmark' => [
                'total_quizzes' => $quizCount,
                'passed_quizzes' => $passedQuizCount,
                'average_score' => $averageQuizScore,
                'is_eligible_for_assignment' => $isEligibleForAssignment,
                'quizzes' => $quizSummaries,
            ],
        ]);
    }

    public function submitAssignment(Request $request, $lessonId)
    {
        $user = $request->user();
        $lesson = Lesson::with('module.course.modules.lessons')->findOrFail($lessonId);

        if ($lesson->type !== 'assignment') {
            return response()->json(['message' => 'Materi ini bukan tugas akhir.'], 422);
        }

        // Validate quiz prerequisites before allowing assignment submission
        $allModules = $lesson->module->course->modules()->orderBy('sort_order')->with('lessons')->get();
        foreach ($allModules as $m) {
            foreach ($m->lessons->where('type', 'quiz') as $ql) {
                $lp = LessonProgress::where('user_id', $user->id)->where('lesson_id', $ql->id)->first();
                $minPass = $ql->min_pass_score ?? 60;
                if (! $lp || ($lp->score_percentage ?? 0) < $minPass) {
                    return response()->json([
                        'message' => 'Anda belum memenuhi syarat tolak ukur kuis (minimal '.$minPass.'%) untuk mengumpulkan tugas akhir.',
                    ], 403);
                }
            }
        }

        $validated = $request->validate([
            'file_url' => 'required|string',
            'filename' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        // Determine current version count
        $lastSubmission = AssignmentSubmission::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->orderBy('version', 'desc')
            ->first();

        $nextVersion = $lastSubmission ? ($lastSubmission->version + 1) : 1;

        $submission = AssignmentSubmission::create([
            'user_id' => $user->id,
            'lesson_id' => $lessonId,
            'file_url' => $validated['file_url'],
            'filename' => $validated['filename'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'submitted',
            'version' => $nextVersion,
        ]);

        return response()->json([
            'message' => $nextVersion > 1 ? "Revisi tugas akhir (Versi {$nextVersion}) berhasil dikirim." : 'Tugas akhir berhasil dikumpulkan.',
            'submission' => $submission,
        ], 201);
    }

    public function getAssignmentHistory(Request $request, $lessonId)
    {
        $user = $request->user();
        $lesson = Lesson::findOrFail($lessonId);

        $submissions = AssignmentSubmission::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->with('reviewer')
            ->orderBy('version', 'desc')
            ->get();

        return response()->json([
            'lesson' => $lesson,
            'submissions' => $submissions,
            'latest_submission' => $submissions->first(),
        ]);
    }
}
