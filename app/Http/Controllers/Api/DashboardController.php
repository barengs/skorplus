<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtSession;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\ForumPost;
use App\Models\Program;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $totalSessions = CbtSession::where('user_id', $user->id)->count();
        $bestScore = CbtSession::where('user_id', $user->id)
            ->where('status', 'submitted')
            ->max('score') ?? 0;
        $recentSessions = CbtSession::where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get(['id', 'exam_title', 'exam_type', 'score', 'status', 'submitted_at', 'created_at']);

        $enrollments = CourseEnrollment::where('user_id', $user->id)->with('course')->latest('updated_at')->get();

        $elearningStats = [
            'enrolled_courses' => $enrollments->count(),
            'completed_courses' => $enrollments->where('progress_percentage', 100)->count(),
            'completed_lessons' => $enrollments->sum('completed_lessons'),
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
            'recent_courses' => $enrollments->take(4),
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
        $adminStats = [
            'total_users' => User::count(),
            'total_siswa' => User::role('siswa', 'api')->count(),
            'total_courses' => Course::count(),
            'total_exams' => Exam::count(),
            'total_cbt_sessions' => CbtSession::count(),
            'recent_users' => User::latest()->take(5)->get(['id', 'name', 'email', 'created_at']),
        ];

        return response()->json([
            'dashboard_type' => 'admin',
            'user' => [
                'name' => $user->name,
                'roles' => $user->getRoleNames(),
            ],
            'admin_stats' => $adminStats,
        ]);
    }
}
