<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtSession;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\ForumPost;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Module;
use App\Models\Program;
use App\Models\Question;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth('api')->user();

        // Check user primary role / group
        if ($user->hasRole('siswa')) {
            return $this->studentDashboard($user);
        }

        if ($user->hasRole('tutor')) {
            return $this->tutorDashboard($user);
        }

        // Default to Admin / Management Staff
        return $this->adminDashboard($user);
    }

    private function studentDashboard($user): JsonResponse
    {
        // Auto-enroll/sync active courses under student's program if assigned
        if (! empty($user->program)) {
            $program = Program::where('is_active', true)
                ->where(function ($q) use ($user) {
                    $q->where('slug', $user->program)
                        ->orWhere('name', $user->program)
                        ->orWhereRaw('LOWER(name) = ?', [strtolower($user->program)])
                        ->orWhereRaw('LOWER(slug) = ?', [strtolower($user->program)]);
                })
                ->first();

            if ($program) {
                $courses = Course::where('is_active', true)
                    ->where(function ($q) use ($program) {
                        $q->where('program_id', $program->id)
                            ->orWhere('program_name', $program->name)
                            ->orWhereRaw('LOWER(program_name) = ?', [strtolower($program->slug)]);
                    })
                    ->get();

                foreach ($courses as $course) {
                    /** @var Course $course */
                    $totalLessons = $course->modules()->withCount('lessons')->get()->sum('lessons_count');
                    CourseEnrollment::firstOrCreate(
                        ['user_id' => $user->id, 'course_id' => $course->id],
                        [
                            'total_lessons' => $totalLessons,
                            'progress_percentage' => 0,
                            'completed_lessons' => 0,
                        ]
                    );
                }
            }
        }

        $totalSessions = CbtSession::where('user_id', $user->id)->count();
        $bestScore = CbtSession::where('user_id', $user->id)
            ->where('status', 'submitted')
            ->max('score') ?? 0;
        $recentSessions = CbtSession::where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get(['id', 'exam_title', 'exam_type', 'score', 'status', 'submitted_at', 'created_at']);

        $enrollments = CourseEnrollment::where('user_id', $user->id)->with('course')->latest('updated_at')->get();

        $completedLessonsCount = LessonProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->count();

        $elearningStats = [
            'enrolled_courses' => $enrollments->count(),
            'completed_courses' => $enrollments->where('progress_percentage', '>=', 100)->count(),
            'completed_lessons' => max($completedLessonsCount, (int) $enrollments->sum('completed_lessons')),
            'certificates' => $enrollments->whereNotNull('completed_at')->count(),
        ];

        $availablePrograms = Program::where('is_active', true)
            ->withCount(['courses' => function ($q) {
                $q->where('is_active', true);
            }])
            ->orderBy('sort_order')
            ->get()
            ->map(function ($p) use ($user) {
                $p->is_current = strtolower($user->program ?? '') === strtolower($p->slug)
                    || strtolower($user->program ?? '') === strtolower($p->name);

                return $p;
            });

        // Prioritize courses with active progress (> 0%)
        $activeWithProgress = $enrollments->filter(fn ($enr) => ($enr->progress_percentage ?? 0) > 0)->sortByDesc('progress_percentage')->values();
        $recentCourses = $activeWithProgress->isNotEmpty()
            ? $activeWithProgress->take(5)
            : $enrollments->take(5)->values();

        return response()->json([
            'dashboard_type' => 'student',
            'user' => [
                'name' => $user->name,
                'program' => $user->program,
                'nisn' => $user->nisn,
                'school' => $user->school,
            ],
            'available_programs' => $availablePrograms,
            'stats' => [
                'total_sessions' => $totalSessions,
                'best_score' => $bestScore,
                'completed' => CbtSession::where('user_id', $user->id)->where('status', 'submitted')->count(),
            ],
            'elearning_stats' => $elearningStats,
            'recent_sessions' => $recentSessions,
            'recent_courses' => $recentCourses,
        ]);
    }

    public function enrollProgram(Request $request): JsonResponse
    {
        $request->validate([
            'program_id' => 'required',
        ]);

        $user = auth('api')->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $program = Program::where('is_active', true)
            ->where(function ($q) use ($request) {
                $q->where('id', $request->program_id)
                    ->orWhere('slug', $request->program_id);
            })
            ->firstOrFail();

        // Update user program
        $user->program = strtolower($program->slug ?: $program->name);
        $user->save();

        // Auto-enroll student into all active courses under this program
        $courses = Course::where('is_active', true)
            ->where(function ($q) use ($program) {
                $q->where('program_id', $program->id)
                    ->orWhere('program_name', $program->name)
                    ->orWhereRaw('LOWER(program_name) = ?', [strtolower($program->slug)]);
            })
            ->get();

        $enrolledCount = 0;
        foreach ($courses as $course) {
            $totalLessons = $course->modules()->withCount('lessons')->get()->sum('lessons_count');
            CourseEnrollment::firstOrCreate(
                ['user_id' => $user->id, 'course_id' => $course->id],
                ['total_lessons' => $totalLessons]
            );
            $enrolledCount++;
        }

        return response()->json([
            'message' => "Selamat! Anda berhasil mengambil Program {$program->name}.",
            'program' => $program,
            'enrolled_courses_count' => $enrolledCount,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name,
                'program' => $user->program,
                'nisn' => $user->nisn,
                'school' => $user->school,
            ],
        ]);
    }

    private function tutorDashboard($user): JsonResponse
    {
        // Tutor specific metrics
        $tutorStats = [
            'my_courses' => Course::where('instructor_id', $user->id)->count(),
            'total_students' => User::role('siswa', 'api')->count(),
            'active_exams' => Exam::count(),
            'forum_unanswered' => ForumPost::doesntHave('replies')->count(),
        ];

        return response()->json([
            'dashboard_type' => 'tutor',
            'user' => [
                'name' => $user->name,
                'roles' => $user->getRoleNames(),
            ],
            'tutor_stats' => $tutorStats,
        ]);
    }

    private function adminDashboard($user): JsonResponse
    {
        $totalSiswa = User::role('siswa', 'api')->count();
        $totalCourses = Course::count();
        $totalExams = Exam::count();
        $totalCbtSessions = CbtSession::count();
        $completedSessionsCount = CbtSession::where('status', 'submitted')->count();
        $ongoingSessionsCount = CbtSession::where('status', 'ongoing')->count();

        $adminStats = [
            'total_users' => User::count(),
            'total_siswa' => $totalSiswa,
            'total_courses' => $totalCourses,
            'total_exams' => $totalExams,
            'total_cbt_sessions' => $totalCbtSessions,
            'completed_cbt_sessions' => $completedSessionsCount,
            'ongoing_cbt_sessions' => $ongoingSessionsCount,
            'recent_users' => User::latest()->take(5)->get(['id', 'name', 'email', 'created_at']),
        ];

        // 1. Course Statistics
        $totalEnrollments = CourseEnrollment::count();
        $completedEnrollments = CourseEnrollment::where('progress_percentage', '>=', 100)->count();
        $avgCourseProgress = round(CourseEnrollment::avg('progress_percentage') ?? 0, 1);
        $totalLessons = Lesson::count();
        $totalModules = Module::count();

        $topCourses = Course::withCount('enrollments')
            ->withAvg('enrollments as avg_progress', 'progress_percentage')
            ->orderByDesc('enrollments_count')
            ->take(5)
            ->get(['id', 'title', 'category', 'program_name', 'is_active', 'rating', 'total_reviews', 'thumbnail']);

        $recentEnrollments = CourseEnrollment::with([
            'user:id,name,email',
            'course:id,title,category',
        ])
            ->latest('updated_at')
            ->take(5)
            ->get(['id', 'user_id', 'course_id', 'progress_percentage', 'completed_lessons', 'total_lessons', 'updated_at']);

        $courseCategories = Course::select('category', DB::raw('count(*) as count'))
            ->whereNotNull('category')
            ->groupBy('category')
            ->orderByDesc('count')
            ->take(6)
            ->get();

        $courseStats = [
            'total_courses' => $totalCourses,
            'active_courses' => Course::where('is_active', true)->count(),
            'total_enrollments' => $totalEnrollments,
            'completed_enrollments' => $completedEnrollments,
            'avg_progress' => $avgCourseProgress,
            'total_lessons' => $totalLessons,
            'total_modules' => $totalModules,
            'top_courses' => $topCourses,
            'recent_enrollments' => $recentEnrollments,
            'categories' => $courseCategories,
        ];

        // 2. CBT Exam Statistics
        $avgScore = round(CbtSession::where('status', 'submitted')->avg('score') ?? 0, 1);
        $maxScore = CbtSession::where('status', 'submitted')->max('score') ?? 0;
        $minScore = CbtSession::where('status', 'submitted')->min('score') ?? 0;
        $passCount = CbtSession::where('status', 'submitted')->where('score', '>=', 70)->count();
        $passRate = $completedSessionsCount > 0 ? round(($passCount / $completedSessionsCount) * 100, 1) : 0;

        $recentCbtSessions = CbtSession::with(['user:id,name,email', 'exam:id,title'])
            ->latest()
            ->take(6)
            ->get(['id', 'user_id', 'exam_id', 'exam_title', 'exam_type', 'score', 'status', 'started_at', 'submitted_at', 'created_at']);

        $examsPerformance = Exam::with(['examType:id,name,code'])
            ->withCount([
                'questions',
                'sessions as total_sessions_count',
                'sessions as completed_sessions_count' => function ($q) {
                    $q->where('status', 'submitted');
                },
            ])
            ->withAvg(['sessions as avg_score' => function ($q) {
                $q->where('status', 'submitted');
            }], 'score')
            ->withMax(['sessions as max_score' => function ($q) {
                $q->where('status', 'submitted');
            }], 'score')
            ->take(5)
            ->get(['id', 'title', 'duration_minutes', 'is_active', 'exam_type_id']);

        $cbtStats = [
            'total_exams' => $totalExams,
            'active_exams' => Exam::where('is_active', true)->count(),
            'total_questions' => Question::count(),
            'total_sessions' => $totalCbtSessions,
            'completed_sessions' => $completedSessionsCount,
            'ongoing_sessions' => $ongoingSessionsCount,
            'avg_score' => $avgScore,
            'highest_score' => $maxScore,
            'lowest_score' => $minScore,
            'pass_rate' => $passRate,
            'recent_sessions' => $recentCbtSessions,
            'exams_performance' => $examsPerformance,
        ];

        return response()->json([
            'dashboard_type' => 'admin',
            'user' => [
                'name' => $user->name,
                'roles' => $user->getRoleNames(),
            ],
            'admin_stats' => $adminStats,
            'course_stats' => $courseStats,
            'cbt_stats' => $cbtStats,
        ]);
    }
}
