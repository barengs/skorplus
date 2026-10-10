<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CbtSession;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminStudentReportController extends Controller
{
    /**
     * Rapor siswa: ringkasan akademik, riwayat ujian CBT,
     * dan kemajuan belajar (E-Learning) untuk satu siswa.
     */
    public function show(Request $request, User $user): JsonResponse
    {
        $sessions = CbtSession::with(['exam:id,title,passing_score,total_questions'])
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->orderByDesc('submitted_at')
            ->get();

        $enrollments = CourseEnrollment::with(['course:id,title,category'])
            ->where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->get();

        $gradedSessions = $sessions->filter(fn ($s) => $s->score !== null);
        $avgScore = $gradedSessions->count() > 0 ? round($gradedSessions->avg('score'), 1) : 0;

        $passCount = $gradedSessions->filter(function ($s) {
            return $s->score >= ($s->exam?->passing_score ?? 70);
        })->count();

        $totalLessons = $enrollments->sum('total_lessons');
        $completedLessons = $enrollments->sum('completed_lessons');
        $avgProgress = $enrollments->count() > 0 ? round($enrollments->avg('progress_percentage'), 1) : 0;

        // Predikat rapor berdasarkan rata-rata skor CBT & progres belajar
        $predicated = 'Belum Ada Data';
        $predicatedColor = 'slate';
        if ($gradedSessions->count() > 0) {
            if ($avgScore >= 90 && $avgProgress >= 80) {
                $predicated = 'A (Sangat Baik)';
                $predicatedColor = 'emerald';
            } elseif ($avgScore >= 80) {
                $predicated = 'B (Baik)';
                $predicatedColor = 'blue';
            } elseif ($avgScore >= 70) {
                $predicated = 'C (Cukup)';
                $predicatedColor = 'amber';
            } else {
                $predicated = 'D (Perlu Bimbingan)';
                $predicatedColor = 'rose';
            }
        }

        // Agregat per mapel/subtest dari sesi terakhir (subtest_scores: {subtest: {correct, total}})
        $subtestStats = [];
        foreach ($sessions as $session) {
            foreach ($session->subtest_scores ?? [] as $name => $val) {
                if (! isset($subtestStats[$name])) {
                    $subtestStats[$name] = ['subtest' => $name, 'correct' => 0, 'total' => 0];
                }
                $subtestStats[$name]['correct'] += $val['correct'] ?? 0;
                $subtestStats[$name]['total'] += $val['total'] ?? 0;
            }
        }
        $subtestStats = collect($subtestStats)->map(function ($st) {
            $st['accuracy'] = $st['total'] > 0 ? round(($st['correct'] / $st['total']) * 100, 1) : 0;

            return $st;
        })->values();

        return response()->json([
            'student' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'nisn' => $user->nisn,
                'school' => $user->schoolEntity?->name ?? $user->school,
                'program' => $user->program,
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'summary' => [
                'predicated' => $predicated,
                'predicated_color' => $predicatedColor,
                'avg_cbt_score' => $avgScore,
                'exams_taken' => $gradedSessions->count(),
                'exams_passed' => $passCount,
                'pass_rate' => $gradedSessions->count() > 0 ? round(($passCount / $gradedSessions->count()) * 100, 1) : 0,
                'courses_enrolled' => $enrollments->count(),
                'courses_completed' => $enrollments->where('progress_percentage', '>=', 100)->count(),
                'avg_progress' => $avgProgress,
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
            ],
            'subtest_stats' => $subtestStats,
            'exam_history' => $sessions->map(function ($s) {
                $passing = $s->exam?->passing_score ?? 70;

                return [
                    'id' => $s->id,
                    'exam_id' => $s->exam_id,
                    'title' => $s->exam?->title ?? $s->exam_title ?? 'Ujian CBT',
                    'score' => $s->score,
                    'passing_score' => $passing,
                    'is_pass' => $s->score >= $passing,
                    'duration_seconds' => $s->duration_seconds,
                    'submitted_at' => $s->submitted_at?->toIso8601String(),
                    'correct_subtests' => $s->strengths ?? [],
                    'weak_subtests' => $s->weaknesses ?? [],
                ];
            }),
            'learning_progress' => $enrollments->map(function ($enr) {
                return [
                    'id' => $enr->id,
                    'course_title' => $enr->course?->title ?? 'Kursus',
                    'category' => $enr->course?->category ?? 'Umum',
                    'progress_percentage' => $enr->progress_percentage ?? 0,
                    'completed_lessons' => $enr->completed_lessons ?? 0,
                    'total_lessons' => $enr->total_lessons ?? 0,
                    'updated_at' => $enr->updated_at?->toIso8601String(),
                ];
            }),
        ]);
    }

    /**
     * Detail pengerjaan soal per sesi CBT:
     * menampilkan setiap nomor soal beserta jawaban siswa,
     * jawaban yang benar, dan status benar/salah.
     */
    public function sessionDetail(Request $request, CbtSession $session): JsonResponse
    {
        if ($session->status !== 'submitted') {
            return response()->json(['message' => 'Sesi ujian belum disubmit.'], 422);
        }

        $exam = $session->exam_id ? Exam::with(['questions.options'])->find($session->exam_id) : null;
        $questions = $session->question_order;

        // Fallback: bangun layout soal dari exam bila question_order kosong
        if (empty($questions) && $exam) {
            $questions = $exam->questions->map(function ($q, $idx) {
                return [
                    'number' => $idx + 1,
                    'id' => $q->id,
                    'question_type' => $q->question_type ?? 'single_choice',
                    'subtest' => $q->subtest ?? ($q->subject ?? 'Umum'),
                    'question_text' => $q->question_text,
                    'options' => $q->options->pluck('option_text', 'option_key')->toArray(),
                    'correct_option' => $q->options->firstWhere('is_correct', true)?->option_key,
                    'points' => $q->points ?? 1,
                ];
            })->toArray();
        }

        $questions = collect($questions ?: []);
        $answers = $session->answers()
            ->whereNotNull('selected_option')
            ->get()
            ->keyBy('question_number');

        $items = $questions->map(function ($questionData, $index) use ($answers) {
            $questionNumber = $index + 1;
            $userAnswer = $answers->get($questionNumber);
            $correctOption = $questionData['correct_option'] ?? null;
            $selected = $userAnswer?->selected_option;
            $qType = $questionData['question_type'] ?? 'single_choice';
            $isCorrect = false;

            if ($userAnswer && $correctOption !== null) {
                if ($qType === 'multiple_choice' || $qType === 'complex_choice') {
                    $userSelected = is_array($selected)
                        ? $selected
                        : array_map('trim', explode(',', (string) $selected));
                    $correctKeys = is_array($correctOption)
                        ? $correctOption
                        : array_map('trim', explode(',', (string) $correctOption));
                    sort($userSelected);
                    sort($correctKeys);
                    $isCorrect = ! empty($userSelected) && $userSelected === $correctKeys;
                } elseif ($qType === 'short_answer') {
                    $cleanUser = preg_replace('/\s+/', '', strtolower(trim((string) $selected)));
                    $cleanTarget = preg_replace('/\s+/', '', strtolower(trim((string) $correctOption)));
                    $isCorrect = $cleanUser !== '' && $cleanUser === $cleanTarget;
                } else {
                    $isCorrect = trim(strtoupper((string) $selected)) === trim(strtoupper((string) $correctOption));
                }
            }

            return [
                'number' => $questionNumber,
                'question_id' => $questionData['id'] ?? null,
                'subtest' => $questionData['subtest'] ?? ($questionData['subject'] ?? 'Umum'),
                'question_type' => $qType,
                'question_text' => $questionData['question_text'] ?? null,
                'options' => $questionData['options'] ?? [],
                'selected_option' => $selected,
                'correct_option' => $correctOption,
                'is_correct' => $isCorrect,
                'is_answered' => $selected !== null && $selected !== '',
                'is_flagged' => (bool) $userAnswer?->is_flagged,
                'points' => $questionData['points'] ?? 1,
            ];
        });

        return response()->json([
            'session' => [
                'id' => $session->id,
                'student_name' => $session->user?->name ?? 'Siswa',
                'exam_title' => $session->exam?->title ?? $session->exam_title,
                'exam_id' => $session->exam_id,
                'score' => $session->score,
                'passing_score' => $session->exam?->passing_score ?? 70,
                'started_at' => $session->started_at?->toIso8601String(),
                'submitted_at' => $session->submitted_at?->toIso8601String(),
                'duration_seconds' => $session->duration_seconds,
                'correct_count' => $items->where('is_correct', true)->count(),
                'wrong_count' => $items->where('is_correct', false)->where('is_answered', true)->count(),
                'empty_count' => $items->where('is_answered', false)->count(),
                'total_questions' => $items->count(),
            ],
            'items' => $items->values(),
        ]);
    }
}
