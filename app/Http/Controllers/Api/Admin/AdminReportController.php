<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CbtSession;
use App\Models\CourseEnrollment;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    /**
     * Get learning progress reports (E-Learning).
     */
    public function learningReports(Request $request): JsonResponse
    {
        $query = CourseEnrollment::with(['user:id,name,email,school,program', 'course:id,title,category'])
            ->select('course_enrollments.*');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('school', 'like', "%{$search}%");
            })->orWhereHas('course', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'completed') {
                $query->where('progress_percentage', '>=', 100);
            } elseif ($request->status === 'ongoing') {
                $query->where('progress_percentage', '<', 100);
            }
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        // Analytics metrics for the top header
        $totalEnrollments = CourseEnrollment::count();
        $completedEnrollments = CourseEnrollment::where('progress_percentage', '>=', 100)->count();
        $avgProgress = CourseEnrollment::avg('progress_percentage') ?? 0;

        $reports = $query->latest('updated_at')->paginate($request->input('per_page', 20));

        return response()->json([
            'metrics' => [
                'total_enrollments' => $totalEnrollments,
                'completed_enrollments' => $completedEnrollments,
                'avg_progress' => round($avgProgress, 1),
            ],
            'reports' => $reports,
        ]);
    }

    /**
     * Get exam reports (CBT).
     */
    public function examReports(Request $request): JsonResponse
    {
        $query = CbtSession::with(['user:id,name,email,school,program', 'exam:id,title,passing_score'])
            ->where('status', 'submitted');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($u) use ($search) {
                    $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('school', 'like', "%{$search}%");
                })->orWhereHas('exam', function ($e) use ($search) {
                    $e->where('title', 'like', "%{$search}%");
                })->orWhere('exam_title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('exam_id')) {
            $query->where('exam_id', $request->exam_id);
        }

        if ($request->filled('school')) {
            $school = trim($request->school);
            $schoolLower = strtolower($school);
            $query->whereHas('user', function ($q) use ($school, $schoolLower) {
                $q->where(function ($sq) use ($school, $schoolLower) {
                    $sq->where('school', $school)
                        ->orWhereRaw('LOWER(school) LIKE ?', ['%'.$schoolLower.'%'])
                        ->orWhereHas('schoolEntity', function ($rel) use ($school, $schoolLower) {
                            $rel->where('name', $school)
                                ->orWhereRaw('LOWER(name) LIKE ?', ['%'.$schoolLower.'%']);
                        });
                });
            });
        }

        // Metrics for CBT reports
        $totalSessions = (clone $query)->count();
        $avgScore = (clone $query)->avg('score') ?? 0;
        $highestScore = (clone $query)->max('score') ?? 0;

        $reports = $query->latest('submitted_at')->paginate($request->input('per_page', 20));

        $schools = $this->availableSchools();

        return response()->json([
            'metrics' => [
                'total_sessions' => $totalSessions,
                'avg_score' => round($avgScore, 2),
                'highest_score' => round($highestScore, 2),
            ],
            'reports' => $reports,
            'schools' => $schools,
        ]);
    }

    /**
     * Merged list of school names for report filters:
     * from the schools table plus any distinct school strings present on users.
     */
    protected function availableSchools(): array
    {
        $fromSchools = School::pluck('name');
        $fromUsers = User::whereNotNull('school')
            ->where('school', '!=', '')
            ->distinct()
            ->pluck('school');

        return $fromSchools
            ->merge($fromUsers)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();
    }
}
