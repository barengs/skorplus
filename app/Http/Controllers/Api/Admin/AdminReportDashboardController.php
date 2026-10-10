<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CbtSession;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportDashboardController extends Controller
{
    /**
     * Get aggregate analytics & reports dashboard data
     * covering Schools, CBT Exams, and E-Learning Materials.
     */
    public function index(Request $request): JsonResponse
    {
        $schoolFilter = $request->input('school_id');

        // ---------------------------------------------------------
        // 1. STATISTIK MITRA SEKOLAH
        // ---------------------------------------------------------
        $totalSchools = School::count();
        $activeSchools = School::where('is_active', true)->count();

        // Ambil data detail per sekolah
        $schools = School::with([
            'learningPackages' => function ($q) {
                $q->wherePivot('status', 'active');
            },
        ])->get();

        $schoolsBreakdown = $schools->map(function ($sch) {
            $studentIds = User::role('siswa', 'api')
                ->where(function ($q) use ($sch) {
                    $q->where('school_id', $sch->id)
                        ->orWhere('school', $sch->name)
                        ->orWhereRaw('LOWER(school) = ?', [strtolower($sch->name)]);
                })
                ->pluck('id');

            $studentCount = $studentIds->count();

            // CBT metrics for this school
            $cbtQuery = CbtSession::where('status', 'submitted')
                ->whereIn('user_id', $studentIds);
            $cbtCount = (clone $cbtQuery)->count();
            $avgCbtScore = $cbtCount > 0 ? round((clone $cbtQuery)->avg('score'), 1) : 0;
            $passCount = 0;
            if ($cbtCount > 0) {
                $passCount = (clone $cbtQuery)->where('score', '>=', 70)->count();
            }

            // Elearning metrics for this school
            $enrollQuery = CourseEnrollment::whereIn('user_id', $studentIds);
            $enrollCount = (clone $enrollQuery)->count();
            $completedCount = (clone $enrollQuery)->where('progress_percentage', '>=', 100)->count();
            $avgProgress = $enrollCount > 0 ? round((clone $enrollQuery)->avg('progress_percentage'), 1) : 0;

            $activePackage = $sch->learningPackages->first();

            return [
                'id' => $sch->id,
                'name' => $sch->name,
                'npsn' => $sch->npsn,
                'address' => $sch->address,
                'phone' => $sch->phone,
                'logo' => $sch->logo,
                'is_active' => (bool) $sch->is_active,
                'package_name' => $activePackage?->name ?? 'Belum ada paket',
                'students_count' => $studentCount,
                'cbt_sessions_count' => $cbtCount,
                'avg_cbt_score' => $avgCbtScore,
                'cbt_pass_rate' => $cbtCount > 0 ? round(($passCount / $cbtCount) * 100, 1) : 0,
                'enrollments_count' => $enrollCount,
                'completed_courses_count' => $completedCount,
                'avg_progress' => $avgProgress,
            ];
        });

        // Total siswa terdaftar dari mitra sekolah
        $totalSchoolStudents = $schoolsBreakdown->sum('students_count');

        // Top 5 sekolah berdasar jumlah siswa
        $topSchoolsByStudents = $schoolsBreakdown
            ->sortByDesc('students_count')
            ->values()
            ->take(5);

        // Top 5 sekolah berdasar nilai rata-rata CBT
        $topSchoolsByPerformance = $schoolsBreakdown
            ->filter(fn ($s) => $s['cbt_sessions_count'] > 0)
            ->sortByDesc('avg_cbt_score')
            ->values()
            ->take(5);

        $schoolStats = [
            'total_schools' => $totalSchools,
            'active_schools' => $activeSchools,
            'total_students_partner' => $totalSchoolStudents,
            'schools_list' => $schoolsBreakdown->sortByDesc('students_count')->values(),
            'top_by_students' => $topSchoolsByStudents,
            'top_by_performance' => $topSchoolsByPerformance,
        ];

        // ---------------------------------------------------------
        // 2. STATISTIK UJIAN CBT
        // ---------------------------------------------------------
        $totalExams = Exam::count();
        $activeExams = Exam::where('is_active', true)->count();

        $cbtSessionsQuery = CbtSession::with(['user:id,name,school', 'exam:id,title,passing_score'])
            ->where('status', 'submitted');

        if ($schoolFilter) {
            $selectedSchool = School::find($schoolFilter);
            if ($selectedSchool) {
                $schName = $selectedSchool->name;
                $cbtSessionsQuery->whereHas('user', function ($q) use ($selectedSchool, $schName) {
                    $q->where('school_id', $selectedSchool->id)
                        ->orWhere('school', $schName);
                });
            }
        }

        $allSubmittedSessions = (clone $cbtSessionsQuery)->get();
        $totalSubmittedSessions = $allSubmittedSessions->count();
        $avgScore = $totalSubmittedSessions > 0 ? round($allSubmittedSessions->avg('score'), 1) : 0;
        $highestScore = $totalSubmittedSessions > 0 ? (int) $allSubmittedSessions->max('score') : 0;
        $lowestScore = $totalSubmittedSessions > 0 ? (int) $allSubmittedSessions->min('score') : 0;

        // Hitung kelulusan CBT (score >= passing_score or 70)
        $passedSessions = $allSubmittedSessions->filter(function ($s) {
            $passingScore = $s->exam?->passing_score ?? 70;

            return $s->score >= $passingScore;
        })->count();
        $overallPassRate = $totalSubmittedSessions > 0 ? round(($passedSessions / $totalSubmittedSessions) * 100, 1) : 0;

        // Distribusi Nilai
        $distribution = [
            'under_50' => $allSubmittedSessions->filter(fn ($s) => $s->score < 50)->count(),
            'range_50_69' => $allSubmittedSessions->filter(fn ($s) => $s->score >= 50 && $s->score < 70)->count(),
            'range_70_84' => $allSubmittedSessions->filter(fn ($s) => $s->score >= 70 && $s->score < 85)->count(),
            'range_85_100' => $allSubmittedSessions->filter(fn ($s) => $s->score >= 85)->count(),
        ];

        // Analisis Paket Ujian CBT (Tingkat Kesulitan & Efektivitas)
        $exams = Exam::withCount(['questions'])
            ->get();

        $examsPerformance = $exams->map(function ($exam) use ($schoolFilter) {
            $sessionQ = CbtSession::where('exam_id', $exam->id)
                ->where('status', 'submitted');

            if ($schoolFilter) {
                $selectedSchool = School::find($schoolFilter);
                if ($selectedSchool) {
                    $schName = $selectedSchool->name;
                    $sessionQ->whereHas('user', function ($q) use ($selectedSchool, $schName) {
                        $q->where('school_id', $selectedSchool->id)
                            ->orWhere('school', $schName);
                    });
                }
            }

            $sessions = $sessionQ->get();
            $participantCount = $sessions->count();
            $examAvgScore = $participantCount > 0 ? round($sessions->avg('score'), 1) : 0;
            $examPassCount = $sessions->filter(fn ($s) => $s->score >= ($exam->passing_score ?? 70))->count();
            $passRate = $participantCount > 0 ? round(($examPassCount / $participantCount) * 100, 1) : 0;

            // Rating Tingkat Kesulitan Paket Soal
            $difficultyLabel = 'Belum Ada Data';
            $difficultyColor = 'slate';
            if ($participantCount > 0) {
                if ($examAvgScore < 50) {
                    $difficultyLabel = 'Sangat Sulit (HOTS Tinggi)';
                    $difficultyColor = 'rose';
                } elseif ($examAvgScore < 65) {
                    $difficultyLabel = 'Menantang / Sulit';
                    $difficultyColor = 'amber';
                } elseif ($examAvgScore <= 80) {
                    $difficultyLabel = 'Sedang (Ideal)';
                    $difficultyColor = 'blue';
                } else {
                    $difficultyLabel = 'Cukup Mudah';
                    $difficultyColor = 'emerald';
                }
            }

            return [
                'id' => $exam->id,
                'title' => $exam->title,
                'duration_minutes' => $exam->duration_minutes,
                'total_questions' => $exam->questions_count,
                'passing_score' => $exam->passing_score ?? 70,
                'is_active' => (bool) $exam->is_active,
                'participants_count' => $participantCount,
                'avg_score' => $examAvgScore,
                'highest_score' => $participantCount > 0 ? (int) $sessions->max('score') : 0,
                'pass_count' => $examPassCount,
                'pass_rate' => $passRate,
                'difficulty_label' => $difficultyLabel,
                'difficulty_color' => $difficultyColor,
            ];
        });

        // 10 Aktivitas CBT Terbaru
        $recentCbtActivities = (clone $cbtSessionsQuery)
            ->latest('submitted_at')
            ->take(10)
            ->get()
            ->map(function ($s) {
                $passing = $s->exam?->passing_score ?? 70;

                return [
                    'id' => $s->id,
                    'user_name' => $s->user?->name ?? 'Siswa',
                    'school_name' => $s->user?->school ?? 'Umum',
                    'exam_title' => $s->exam?->title ?? $s->exam_title ?? 'Ujian CBT',
                    'score' => $s->score,
                    'is_pass' => $s->score >= $passing,
                    'submitted_at' => $s->submitted_at?->toIso8601String(),
                ];
            });

        $cbtStats = [
            'total_exams' => $totalExams,
            'active_exams' => $activeExams,
            'total_sessions_submitted' => $totalSubmittedSessions,
            'avg_score' => $avgScore,
            'highest_score' => $highestScore,
            'lowest_score' => $lowestScore,
            'overall_pass_rate' => $overallPassRate,
            'score_distribution' => $distribution,
            'exams_ranking' => $examsPerformance->sortByDesc('participants_count')->values(),
            'recent_sessions' => $recentCbtActivities,
        ];

        // ---------------------------------------------------------
        // 3. STATISTIK MATERI & E-LEARNING
        // ---------------------------------------------------------
        $totalCourses = Course::count();
        $activeCourses = Course::where('is_active', true)->count();
        $totalModules = Module::count();
        $totalLessons = Lesson::count();

        // Tipe materi (lesson type)
        $lessonTypes = Lesson::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        // Enrollments
        $enrollmentsQuery = CourseEnrollment::with(['user:id,name,school', 'course:id,title,category']);
        if ($schoolFilter) {
            $selectedSchool = School::find($schoolFilter);
            if ($selectedSchool) {
                $schName = $selectedSchool->name;
                $enrollmentsQuery->whereHas('user', function ($q) use ($selectedSchool, $schName) {
                    $q->where('school_id', $selectedSchool->id)
                        ->orWhere('school', $schName);
                });
            }
        }

        $allEnrollments = (clone $enrollmentsQuery)->get();
        $totalEnrollments = $allEnrollments->count();
        $completedEnrollments = $allEnrollments->where('progress_percentage', '>=', 100)->count();
        $avgProgress = $totalEnrollments > 0 ? round($allEnrollments->avg('progress_percentage'), 1) : 0;
        $completionRate = $totalEnrollments > 0 ? round(($completedEnrollments / $totalEnrollments) * 100, 1) : 0;

        // Kinerja & Popularitas Tiap Materi Kursus
        $courses = Course::withCount(['modules', 'lessons'])
            ->get();

        $coursesPopularity = $courses->map(function ($course) use ($schoolFilter) {
            $enrQuery = CourseEnrollment::where('course_id', $course->id);

            if ($schoolFilter) {
                $selectedSchool = School::find($schoolFilter);
                if ($selectedSchool) {
                    $schName = $selectedSchool->name;
                    $enrQuery->whereHas('user', function ($q) use ($selectedSchool, $schName) {
                        $q->where('school_id', $selectedSchool->id)
                            ->orWhere('school', $schName);
                    });
                }
            }

            $enrs = $enrQuery->get();
            $enrCount = $enrs->count();
            $compCount = $enrs->where('progress_percentage', '>=', 100)->count();
            $avgProg = $enrCount > 0 ? round($enrs->avg('progress_percentage'), 1) : 0;

            return [
                'id' => $course->id,
                'title' => $course->title,
                'category' => $course->category ?? 'Umum',
                'instructor' => $course->display_instructor,
                'rating' => $course->rating ?? 5.0,
                'total_modules' => $course->modules_count,
                'total_lessons' => $course->lessons_count,
                'enrollments_count' => $enrCount,
                'completed_count' => $compCount,
                'avg_progress' => $avgProg,
                'completion_rate' => $enrCount > 0 ? round(($compCount / $enrCount) * 100, 1) : 0,
            ];
        });

        // Kategori kursus
        $categoryBreakdown = Course::select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();

        // 10 Aktivitas Belajar Terbaru
        $recentEnrollments = (clone $enrollmentsQuery)
            ->latest('updated_at')
            ->take(10)
            ->get()
            ->map(function ($enr) {
                return [
                    'id' => $enr->id,
                    'user_name' => $enr->user?->name ?? 'Siswa',
                    'school_name' => $enr->user?->school ?? 'Umum',
                    'course_title' => $enr->course?->title ?? 'Kursus',
                    'progress_percentage' => $enr->progress_percentage,
                    'updated_at' => $enr->updated_at?->toIso8601String(),
                ];
            });

        $materialStats = [
            'total_courses' => $totalCourses,
            'active_courses' => $activeCourses,
            'total_modules' => $totalModules,
            'total_lessons' => $totalLessons,
            'lesson_types' => $lessonTypes,
            'total_enrollments' => $totalEnrollments,
            'completed_enrollments' => $completedEnrollments,
            'avg_progress' => $avgProgress,
            'completion_rate' => $completionRate,
            'category_breakdown' => $categoryBreakdown,
            'courses_ranking' => $coursesPopularity->sortByDesc('enrollments_count')->values(),
            'recent_learning' => $recentEnrollments,
        ];

        return response()->json([
            'summary' => [
                'total_schools' => $totalSchools,
                'total_students_partner' => $totalSchoolStudents,
                'total_exams' => $totalExams,
                'total_cbt_sessions' => $totalSubmittedSessions,
                'avg_cbt_score' => $avgScore,
                'total_courses' => $totalCourses,
                'total_enrollments' => $totalEnrollments,
                'avg_course_progress' => $avgProgress,
            ],
            'schools_stats' => $schoolStats,
            'cbt_stats' => $cbtStats,
            'materials_stats' => $materialStats,
        ]);
    }
}
