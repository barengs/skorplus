<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtSession;
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

        $enrollments = \App\Models\CourseEnrollment::where('user_id', $user->id)->with('course')->latest('updated_at')->get();
        
        $elearningStats = [
            'enrolled_courses' => $enrollments->count(),
            'completed_courses' => $enrollments->where('progress_percentage', 100)->count(),
            'completed_lessons' => $enrollments->sum('completed_lessons'),
            'certificates' => $enrollments->whereNotNull('completed_at')->count(),
        ];

        return response()->json([
            'dashboard_type' => 'student',
            'user'           => [
                'name'    => $user->name,
                'program' => $user->program,
                'nisn'    => $user->nisn,
                'school'  => $user->school,
            ],
            'stats' => [
                'total_sessions' => $totalSessions,
                'best_score'     => $bestScore,
                'completed'      => CbtSession::where('user_id', $user->id)->where('status', 'submitted')->count(),
            ],
            'elearning_stats' => $elearningStats,
            'recent_sessions' => $recentSessions,
            'recent_courses' => $enrollments->take(4),
        ]);
    }

    private function tutorDashboard($user): JsonResponse
    {
        // Tutor specific metrics
        $tutorStats = [
            'my_courses' => \App\Models\Course::where('instructor_id', $user->id)->count(),
            'total_students' => \App\Models\User::role('siswa')->count(),
            'active_exams' => \App\Models\Exam::count(),
            'forum_unanswered' => \App\Models\ForumPost::doesntHave('replies')->count(),
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
            'total_users' => \App\Models\User::count(),
            'total_siswa' => \App\Models\User::role('siswa')->count(),
            'total_courses' => \App\Models\Course::count(),
            'total_exams' => \App\Models\Exam::count(),
            'total_cbt_sessions' => \App\Models\CbtSession::count(),
            'recent_users' => \App\Models\User::latest()->take(5)->get(['id', 'name', 'email', 'created_at']),
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
