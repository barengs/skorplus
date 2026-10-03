<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CbtAnswer;
use App\Models\CbtSession;
use App\Models\Exam;
use App\Models\ExamType;
use App\Models\Program;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CbtController extends Controller
{
    /**
     * List all active dynamic exam types.
     */
    public function examTypes(): JsonResponse
    {
        $types = ExamType::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json($types);
    }

    /**
     * List all available active exams and exam types.
     */
    public function availableExams(): JsonResponse
    {
        $exams = Exam::where('is_active', true)
            ->has('questions')
            ->with(['examType', 'questions.examType'])
            ->withCount('questions')
            ->latest()
            ->get()
            ->map(function ($exam) {
                $subtests = $exam->questions
                    ->map(fn ($q) => $q->examType?->name ?? $q->subtest)
                    ->filter()
                    ->unique()
                    ->values();
                $exam->subtests_list = $subtests;

                return $exam;
            });

        $examTypes = ExamType::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $user = auth('api')->user();
        $quotaInfo = null;
        if ($user && $user->program) {
            $program = Program::where('is_active', true)
                ->where(function ($q) use ($user) {
                    $q->where('slug', $user->program)
                        ->orWhereRaw('LOWER(name) = ?', [strtolower($user->program)])
                        ->orWhereRaw('LOWER(slug) = ?', [strtolower($user->program)]);
                })
                ->first();

            if ($program) {
                $quotaInfo = $program->getCbtUsageForUser($user);
                $quotaInfo['program_name'] = $program->name;
            }
        }

        return response()->json([
            'exams' => $exams,
            'exam_types' => $examTypes,
            'quota_info' => $quotaInfo,
        ]);
    }

    /**
     * List all sessions for the authenticated user.
     */
    public function sessions(): JsonResponse
    {
        $sessions = CbtSession::where('user_id', auth('api')->id())
            ->where('status', '!=', 'cancelled')
            ->latest()
            ->get();

        return response()->json(['sessions' => $sessions]);
    }

    /**
     * Start a new CBT session.
     */
    public function startSession(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        // Enforce CBT quota limit if program has limit
        if ($user && $user->program) {
            $program = Program::where('is_active', true)
                ->where(function ($q) use ($user) {
                    $q->where('slug', $user->program)
                        ->orWhereRaw('LOWER(name) = ?', [strtolower($user->program)])
                        ->orWhereRaw('LOWER(slug) = ?', [strtolower($user->program)]);
                })
                ->first();

            if ($program && $program->cbt_quota !== null && $program->cbt_quota > 0) {
                $used = CbtSession::where('user_id', $user->id)
                    ->where('status', '!=', 'cancelled')
                    ->count();
                if ($used >= $program->cbt_quota) {
                    return response()->json([
                        'message' => "Batas kuota pengerjaan CBT untuk Program {$program->name} telah tercapai ({$program->cbt_quota}x).",
                        'limit_reached' => true,
                        'quota' => $program->cbt_quota,
                        'used' => $used,
                        'program_name' => $program->name,
                    ], 403);
                }
            }
        }

        $validator = Validator::make($request->all(), [
            'exam_id' => 'nullable|exists:exams,id',
            'exam_type' => 'required_without:exam_id|string',
            'exam_title' => 'required_without:exam_id|string',
            'duration_seconds' => 'nullable|integer|min:60',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $exam = null;
        $questions = [];

        // If exam_id provided, use exam from database
        if ($request->exam_id) {
            $exam = Exam::findOrFail($request->exam_id);
            $questions = $this->getQuestionsFromExam($exam);
        } else {
            // Fallback to legacy mode (dummy questions)
            $questions = $this->getDummyQuestions($request->exam_type);
        }

        $session = CbtSession::create([
            'user_id' => auth('api')->id(),
            'exam_id' => $exam?->id,
            'exam_type' => $request->exam_type ?? ($exam ? 'REAL' : 'PPU'),
            'exam_title' => $request->exam_title ?? ($exam?->title ?? 'Ujian CBT'),
            'duration_seconds' => $request->duration_seconds ?? ($exam?->duration_minutes ?? 90) * 60,
            'started_at' => now(),
            'status' => 'ongoing',
        ]);

        // Strip correct_option before sending questions to frontend
        $clientQuestions = array_map(function ($q) {
            unset($q['correct_option']);

            return $q;
        }, $questions);

        return response()->json([
            'session' => $session,
            'questions' => $clientQuestions,
        ], 201);
    }

    /**
     * Cancel an ongoing exam session if no questions have been answered.
     */
    public function cancel(CbtSession $session): JsonResponse
    {
        if ($session->user_id !== auth('api')->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($session->status !== 'ongoing') {
            return response()->json(['message' => 'Hanya sesi ujian yang sedang berlangsung yang dapat dibatalkan.'], 422);
        }

        $answeredCount = CbtAnswer::where('cbt_session_id', $session->id)
            ->whereNotNull('selected_option')
            ->count();

        if ($answeredCount > 0) {
            return response()->json([
                'message' => 'Ujian tidak dapat dibatalkan karena Anda sudah mulai menjawab soal. Silakan lanjutkan pengerjaan atau submit ujian.',
            ], 422);
        }

        // Delete the session and any uncompleted answers
        $session->answers()->delete();
        $session->delete();

        return response()->json([
            'message' => 'Ujian berhasil dibatalkan. Kuota pengerjaan Anda tidak terpotong.',
        ]);
    }

    /**
     * Save/update an answer for a specific question.
     */
    public function saveAnswer(Request $request, CbtSession $session): JsonResponse
    {
        if ($session->user_id !== auth('api')->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($session->status !== 'ongoing') {
            return response()->json(['message' => 'Sesi sudah selesai.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'question_number' => 'required|integer|min:1',
            'selected_option' => 'nullable',
            'is_flagged' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $selectedOption = $request->selected_option;
        if (is_array($selectedOption)) {
            $selectedOption = implode(',', array_filter($selectedOption));
        } elseif ($selectedOption !== null) {
            $selectedOption = (string) $selectedOption;
        }

        CbtAnswer::updateOrCreate(
            ['cbt_session_id' => $session->id, 'question_number' => $request->question_number],
            ['selected_option' => $selectedOption, 'is_flagged' => $request->is_flagged ?? false]
        );

        return response()->json(['message' => 'Jawaban disimpan.']);
    }

    /**
     * Submit the session and calculate score.
     */
    public function submit(CbtSession $session): JsonResponse
    {
        if ($session->user_id !== auth('api')->id()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($session->status !== 'ongoing') {
            return response()->json(['message' => 'Sesi sudah disubmit.'], 422);
        }

        // Get questions from exam if available
        $questions = $session->exam_id
            ? $this->getQuestionsFromExam(Exam::find($session->exam_id))
            : [];

        $answers = CbtAnswer::where('cbt_session_id', $session->id)
            ->whereNotNull('selected_option')
            ->get()
            ->keyBy('question_number');

        $totalScore = 0;
        $correctCount = 0;
        $totalQuestions = count($questions);
        $subtestBreakdown = [];

        // Calculate score based on correct answers
        foreach ($questions as $index => $questionData) {
            $questionNumber = $index + 1;
            $userAnswer = $answers->get($questionNumber);
            $subtestName = $questionData['subtest'] ?? ($questionData['subject'] ?? 'Umum');

            if (! isset($subtestBreakdown[$subtestName])) {
                $subtestBreakdown[$subtestName] = [
                    'subtest' => $subtestName,
                    'total' => 0,
                    'correct' => 0,
                    'icon' => $questionData['exam_type']['icon'] ?? '📝',
                ];
            }
            $subtestBreakdown[$subtestName]['total']++;

            $isCorrect = false;

            if ($userAnswer && isset($questionData['correct_option'])) {
                $qType = $questionData['question_type'] ?? 'single_choice';

                if ($qType === 'multiple_choice' || $qType === 'complex_choice') {
                    $userSelected = is_array($userAnswer->selected_option)
                        ? $userAnswer->selected_option
                        : array_map('trim', explode(',', (string) $userAnswer->selected_option));

                    $correctKeys = is_array($questionData['correct_option'])
                        ? $questionData['correct_option']
                        : array_map('trim', explode(',', (string) $questionData['correct_option']));

                    sort($userSelected);
                    sort($correctKeys);

                    if (! empty($userSelected) && $userSelected === $correctKeys) {
                        $isCorrect = true;
                    }
                } elseif ($qType === 'short_answer') {
                    $cleanUser = preg_replace('/\s+/', '', strtolower(trim((string) $userAnswer->selected_option)));
                    $cleanTarget = preg_replace('/\s+/', '', strtolower(trim((string) $questionData['correct_option'])));

                    if ($cleanUser !== '' && $cleanUser === $cleanTarget) {
                        $isCorrect = true;
                    }
                } else {
                    // single_choice
                    if (trim(strtoupper((string) $userAnswer->selected_option)) === trim(strtoupper((string) $questionData['correct_option']))) {
                        $isCorrect = true;
                    }
                }
            }

            if ($isCorrect) {
                $correctCount++;
                $totalScore += $questionData['points'] ?? 1;
                $subtestBreakdown[$subtestName]['correct']++;
            }
        }

        // Normalize score to 0-100
        $maxScore = $totalQuestions; // Assuming 1 point per question for normalization
        $normalizedScore = $maxScore > 0 ? round(($correctCount / $maxScore) * 100) : 0;

        $session->update([
            'status' => 'submitted',
            'submitted_at' => now(),
            'score' => $normalizedScore,
            'total_score' => $totalScore,
        ]);

        AuditLog::record(
            'SUBMIT_EXAM',
            "Siswa {$session->user?->name} menyelesaikan sesi ujian '{$session->exam_title}' dengan skor {$normalizedScore} pts.",
            'cbt',
            $session->exam,
            ['score' => $normalizedScore, 'session_id' => $session->id]
        );

        return response()->json([
            'message' => 'Ujian berhasil diselesaikan.',
            'score' => $normalizedScore,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuestions,
            'subtest_breakdown' => array_values($subtestBreakdown),
            'session' => $session->fresh(),
        ]);
    }

    /**
     * Get questions from an exam with correct answers.
     */
    private function getQuestionsFromExam(Exam $exam): array
    {
        $questions = $exam->questions()
            ->where('is_active', true)
            ->with(['options', 'examType'])
            ->orderBy('id')
            ->get();

        $totalQuestions = $questions->count();
        $proportionalDuration = $exam->duration_minutes
            ? (int) round(($exam->duration_minutes * 60) / max(1, $totalQuestions))
            : 90;

        return $questions->map(function ($question, $index) use ($proportionalDuration) {
            $qType = $question->question_type ?? 'single_choice';
            $correctOption = null;

            if ($qType === 'multiple_choice' || $qType === 'complex_choice') {
                $correctOptions = $question->options->where('is_correct', true)->pluck('option_key')->toArray();
                sort($correctOptions);
                $correctOption = implode(',', $correctOptions);
            } elseif ($qType === 'short_answer') {
                $correctOpt = $question->options->firstWhere('is_correct', true);
                $correctOption = $correctOpt ? trim($correctOpt->option_text ?? $correctOpt->option_key) : null;
            } else {
                $correctOption = $question->options->firstWhere('is_correct', true)?->option_key;
            }

            return [
                'number' => $index + 1,
                'id' => $question->id,
                'subject' => $question->subject,
                'subtest' => $question->examType?->name ?? $question->subtest,
                'exam_type' => $question->examType ? [
                    'id' => $question->examType->id,
                    'code' => $question->examType->code,
                    'name' => $question->examType->name,
                    'icon' => $question->examType->icon,
                ] : null,
                'text' => $question->question_text,
                'options' => $question->options->pluck('option_text', 'option_key')->toArray(),
                'correct_option' => $correctOption, // Hidden from frontend, used for scoring
                'points' => $question->points,
                'duration_seconds' => $question->duration_seconds ?? $proportionalDuration,
            ];
        })->toArray();
    }

    /**
     * Get dummy questions for legacy mode.
     */
    private function getDummyQuestions(string $type): array
    {
        $questions = [];
        for ($i = 1; $i <= 20; $i++) {
            $questions[] = [
                'number' => $i,
                'subject' => $type,
                'text' => "Pertanyaan No. {$i} — {$type}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pilih jawaban yang paling tepat.",
                'duration_seconds' => 90,
                'options' => [
                    'A' => 'Pilihan A — Jawaban pertama yang memungkinkan',
                    'B' => 'Pilihan B — Jawaban kedua yang memungkinkan',
                    'C' => 'Pilihan C — Jawaban ketiga yang memungkinkan',
                    'D' => 'Pilihan D — Jawaban keempat yang memungkinkan',
                    'E' => 'Pilihan E — Jawaban kelima yang memungkinkan',
                ],
            ];
        }

        return $questions;
    }
}
