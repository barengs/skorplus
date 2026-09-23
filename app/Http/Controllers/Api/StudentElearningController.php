<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\DailyCheckin;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
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

    public function myProgress(Request $request): JsonResponse
    {
        $user = $request->user();

        $enrollments = CourseEnrollment::where('user_id', $user->id)
            ->with(['course' => function ($q) {
                $q->withCount(['modules', 'lessons']);
            }])
            ->latest('updated_at')
            ->get();

        $activeCourses = $enrollments->where('progress_percentage', '<', 100)->values()->map(function ($enr) {
            return [
                'id' => $enr->id,
                'course_id' => $enr->course_id,
                'title' => $enr->course?->title ?? 'Kursus',
                'slug' => $enr->course?->slug ?? '',
                'category' => $enr->course?->category ?? 'Umum',
                'thumbnail' => $enr->course?->thumbnail,
                'instructor_name' => $enr->course?->instructor_name ?? 'Tim Pengajar SkorPluss',
                'completed_lessons' => $enr->completed_lessons,
                'total_lessons' => $enr->total_lessons ?: ($enr->course?->lessons_count ?? 0),
                'progress_percentage' => (int) ($enr->progress_percentage ?? 0),
                'last_activity_at' => $enr->updated_at?->diffForHumans(),
            ];
        });

        $completedCourses = $enrollments->where('progress_percentage', '>=', 100)->values()->map(function ($enr) {
            return [
                'id' => $enr->id,
                'course_id' => $enr->course_id,
                'title' => $enr->course?->title ?? 'Kursus',
                'slug' => $enr->course?->slug ?? '',
                'category' => $enr->course?->category ?? 'Umum',
                'thumbnail' => $enr->course?->thumbnail,
                'instructor_name' => $enr->course?->instructor_name ?? 'Tim Pengajar SkorPluss',
                'completed_lessons' => $enr->completed_lessons,
                'total_lessons' => $enr->total_lessons ?: ($enr->course?->lessons_count ?? 0),
                'progress_percentage' => 100,
                'completed_at' => $enr->completed_at ? $enr->completed_at->format('d M Y') : $enr->updated_at->format('d M Y'),
            ];
        });

        return response()->json([
            'active_courses' => $activeCourses,
            'completed_courses' => $completedCourses,
            'stats' => [
                'total_enrolled' => $enrollments->count(),
                'total_active' => $activeCourses->count(),
                'total_completed' => $completedCourses->count(),
            ],
        ]);
    }

    public function streakAndCheckin(Request $request): JsonResponse
    {
        $user = $request->user();
        $year = (int) ($request->get('year') ?: now()->year);
        $month = (int) ($request->get('month') ?: now()->month);

        // Fetch check-in dates
        $checkinDates = DailyCheckin::where('user_id', $user->id)
            ->pluck('checkin_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        // Fetch lesson completion dates
        $lessonDates = LessonProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->whereNotNull('updated_at')
            ->pluck('updated_at')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        // Combine unique active dates sorted descending
        $allActiveDates = array_values(array_unique(array_merge($checkinDates, $lessonDates)));
        rsort($allActiveDates);

        // Calculate Current Streak
        $currentStreak = 0;
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        $activeSet = array_flip($allActiveDates);

        if (isset($activeSet[$today]) || isset($activeSet[$yesterday])) {
            $checkDate = isset($activeSet[$today]) ? Carbon::parse($today) : Carbon::parse($yesterday);
            while (isset($activeSet[$checkDate->toDateString()])) {
                $currentStreak++;
                $checkDate->subDay();
            }
        }

        // Calculate Longest Streak
        $longestStreak = $currentStreak;
        if (! empty($allActiveDates)) {
            $sortedAsc = $allActiveDates;
            sort($sortedAsc);
            $tempStreak = 1;
            $maxStreak = 1;
            for ($i = 1; $i < count($sortedAsc); $i++) {
                $prev = Carbon::parse($sortedAsc[$i - 1]);
                $curr = Carbon::parse($sortedAsc[$i]);
                if ($prev->diffInDays($curr) === 1) {
                    $tempStreak++;
                    if ($tempStreak > $maxStreak) {
                        $maxStreak = $tempStreak;
                    }
                } else {
                    $tempStreak = 1;
                }
            }
            $longestStreak = max($longestStreak, $maxStreak);
        }

        // Weekly tracker for the past 7 days ending today
        $dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        $weeklyTracker = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = now()->subDays($i);
            $dateStr = $d->toDateString();
            $dayOfWeek = $d->dayOfWeek;
            $weeklyTracker[] = [
                'day_name' => $dayNames[$dayOfWeek],
                'date' => $dateStr,
                'is_active' => isset($activeSet[$dateStr]),
                'is_today' => $dateStr === $today,
            ];
        }

        // Monthly check-ins for the calendar
        $monthlyCheckins = DailyCheckin::where('user_id', $user->id)
            ->whereYear('checkin_date', $year)
            ->whereMonth('checkin_date', $month)
            ->get(['checkin_date', 'notes'])
            ->keyBy(fn ($item) => Carbon::parse($item->checkin_date)->toDateString())
            ->toArray();

        // Also add dates from lesson completion in this month into active dates map
        $monthlyLessons = LessonProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->whereYear('updated_at', $year)
            ->whereMonth('updated_at', $month)
            ->get(['updated_at'])
            ->map(fn ($item) => Carbon::parse($item->updated_at)->toDateString())
            ->unique();

        foreach ($monthlyLessons as $lDate) {
            if (! isset($monthlyCheckins[$lDate])) {
                $monthlyCheckins[$lDate] = [
                    'checkin_date' => $lDate,
                    'notes' => 'Menyelesaikan materi / kuis pembelajaran',
                ];
            }
        }

        // Today's check-in
        $todayCheckin = DailyCheckin::where('user_id', $user->id)
            ->whereDate('checkin_date', $today)
            ->first();

        // Leaderboard top 10 users
        $leaderboardUsers = User::role('siswa')
            ->withCount(['dailyCheckins'])
            ->orderByDesc('daily_checkins_count')
            ->limit(10)
            ->get()
            ->map(function ($u, $idx) {
                return [
                    'rank' => $idx + 1,
                    'name' => $u->name,
                    'school' => $u->school ?: 'Siswa SkorPluss',
                    'streak' => (int) $u->daily_checkins_count,
                ];
            });

        return response()->json([
            'current_streak' => $currentStreak,
            'longest_streak' => $longestStreak,
            'weekly_tracker' => $weeklyTracker,
            'has_checked_in_today' => (bool) $todayCheckin,
            'today_checkin' => $todayCheckin,
            'monthly_checkins' => $monthlyCheckins,
            'leaderboard' => $leaderboardUsers,
            'calendar_month' => [
                'year' => $year,
                'month' => $month,
                'month_name' => Carbon::createFromDate($year, $month, 1)->translatedFormat('F Y'),
            ],
        ]);
    }

    public function storeCheckin(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $today = now()->toDateString();

        $checkin = DailyCheckin::where('user_id', $user->id)
            ->whereDate('checkin_date', $today)
            ->first();

        if ($checkin) {
            $checkin->update([
                'notes' => $validated['notes'] ?? $checkin->notes,
            ]);
        } else {
            $checkin = DailyCheckin::create([
                'user_id' => $user->id,
                'checkin_date' => $today,
                'notes' => $validated['notes'] ?? 'Check-in belajar harian',
            ]);
        }

        return response()->json([
            'message' => 'Check-in hari ini berhasil dicatat! Streak belajar Anda bertambah.',
            'checkin' => $checkin,
        ]);
    }
}
