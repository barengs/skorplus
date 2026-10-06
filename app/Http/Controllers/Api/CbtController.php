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
        $user = auth('api')->user();

        // Auto-submit any expired sessions first so they don't linger
        CbtSession::autoSubmitExpiredSessions();

        $userSubmittedSessions = $user ? CbtSession::where('user_id', $user->id)
            ->where('status', 'submitted')
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->get()
            ->keyBy('exam_id') : collect();

        $exams = Exam::where('is_active', true)
            ->has('questions')
            ->with(['examType', 'questions.examType'])
            ->withCount('questions')
            ->latest()
            ->get()
            ->map(function ($exam) use ($userSubmittedSessions) {
                $subtests = $exam->questions
                    ->map(fn ($q) => $q->examType?->name ?? $q->subtest)
                    ->filter()
                    ->unique()
                    ->values();
                $exam->subtests_list = $subtests;

                $lastSession = $userSubmittedSessions->get($exam->id);
                if ($lastSession && $lastSession->submitted_at) {
                    $cooldownMinutes = ($exam->interval_hours !== null && $exam->interval_hours > 0)
                        ? ($exam->interval_hours * 60)
                        : 30;

                    if ($cooldownMinutes > 0) {
                        $allowedAt = $lastSession->submitted_at->copy()->addMinutes($cooldownMinutes);
                        if (now()->lt($allowedAt)) {
                            $diffSeconds = now()->diffInSeconds($allowedAt);
                            $exam->cooldown_info = [
                                'in_cooldown' => true,
                                'cooldown_minutes' => $cooldownMinutes,
                                'remaining_minutes' => (int) ceil($diffSeconds / 60),
                                'retry_at' => $allowedAt->format('Y-m-d H:i:s'),
                                'retry_at_time' => $allowedAt->format('H:i'),
                            ];
                        }
                    }
                }

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
        CbtSession::autoSubmitExpiredSessions();

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

            if (! $exam->isAvailableNow()) {
                $status = $exam->schedule_status;
                $desc = $exam->schedule_description;

                if ($status === 'upcoming') {
                    return response()->json([
                        'message' => "Ujian ini belum dapat dimulai. Jadwal ujian: {$desc}.",
                        'schedule_status' => 'upcoming',
                    ], 422);
                } elseif ($status === 'expired') {
                    return response()->json([
                        'message' => "Jadwal pengerjaan ujian ini telah berakhir ({$desc}).",
                        'schedule_status' => 'expired',
                    ], 422);
                }

                return response()->json([
                    'message' => "Ujian sedang di luar jadwal pelaksanaan ({$desc}).",
                    'schedule_status' => $status,
                ], 422);
            }

            $questions = $this->getQuestionsFromExam($exam);
        } else {
            // Fallback to legacy mode (dummy questions)
            $questions = $this->getDummyQuestions($request->exam_type);
        }

        $userId = auth('api')->id();

        // 1. Auto-submit any expired ongoing sessions so they don't linger
        CbtSession::autoSubmitExpiredSessions();

        // 2. Cooldown check: cegah siswa mengulang ujian secara beruntun (estafet) tanpa jeda waktu
        $lastSubmitted = CbtSession::where('user_id', $userId)
            ->where('status', 'submitted')
            ->whereNotNull('submitted_at')
            ->where(function ($q) use ($request, $exam) {
                if ($exam) {
                    $q->where('exam_id', $exam->id);
                } else {
                    $q->where('exam_type', $request->exam_type);
                }
            })
            ->latest('submitted_at')
            ->first();

        if ($lastSubmitted && $lastSubmitted->submitted_at) {
            $cooldownMinutes = ($exam && $exam->interval_hours !== null && $exam->interval_hours > 0)
                ? ($exam->interval_hours * 60)
                : 30;

            if ($cooldownMinutes > 0) {
                $allowedAt = $lastSubmitted->submitted_at->copy()->addMinutes($cooldownMinutes);
                if (now()->lt($allowedAt)) {
                    $diffSeconds = now()->diffInSeconds($allowedAt);
                    $remainingMinutes = (int) ceil($diffSeconds / 60);
                    $allowedAtTime = $allowedAt->format('H:i');

                    return response()->json([
                        'message' => "Terdapat pembatasan jeda waktu ujian selama {$cooldownMinutes} menit agar Anda dapat beristirahat dan tidak mengulang ujian secara beruntun (estafet). Anda dapat mengulang kembali ujian ini pada pukul {$allowedAtTime} WIB (sisa waktu: {$remainingMinutes} menit).",
                        'cooldown' => true,
                        'cooldown_minutes' => $cooldownMinutes,
                        'remaining_minutes' => $remainingMinutes,
                        'retry_at' => $allowedAt->format('Y-m-d H:i:s'),
                    ], 422);
                }
            }
        }

        $session = CbtSession::create([
            'user_id' => auth('api')->id(),
            'exam_id' => $exam?->id,
            'exam_type' => $request->exam_type ?? ($exam ? 'REAL' : 'PPU'),
            'exam_title' => $request->exam_title ?? ($exam?->title ?? 'Ujian CBT'),
            'duration_seconds' => $request->duration_seconds ?? ($exam?->duration_minutes ?? 90) * 60,
            'started_at' => now(),
            'status' => 'ongoing',
            'question_order' => $questions,
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

        // Cek jika durasi ujian telah habis -> lembar soal dibekukan (read-only)
        $durationSeconds = (int) ($session->duration_seconds ?: 5400);
        if ($session->started_at && $session->started_at->copy()->addSeconds($durationSeconds)->isPast()) {
            return response()->json([
                'message' => 'Waktu pengerjaan ujian telah habis. Lembar soal telah dibekukan dan jawaban tidak dapat diubah lagi.',
                'is_frozen' => true,
            ], 422);
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

        // Get questions from stored session question layout if available, or fallback
        $questions = $session->question_order;
        if (empty($questions) && $session->exam_id) {
            $exam = Exam::find($session->exam_id);
            $questions = $exam ? $this->getQuestionsFromExam($exam) : [];
        }
        if (empty($questions)) {
            $questions = [];
        }

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
     * Get questions from an exam with randomized question order and randomized options (> 2 choices).
     */
    private function getQuestionsFromExam(Exam $exam): array
    {
        $questions = $exam->questions()
            ->where('is_active', true)
            ->with(['options', 'examType'])
            ->get();

        // Acak urutan butir soal agar tiap kali siswa mengerjakan/mengulang ujian mendapatkan urutan beda
        $shuffledQuestions = $questions->shuffle()->values();

        $totalQuestions = $shuffledQuestions->count();
        $proportionalDuration = $exam->duration_minutes
            ? (int) round(($exam->duration_minutes * 60) / max(1, $totalQuestions))
            : 90;

        return $shuffledQuestions->map(function ($question, $index) use ($proportionalDuration) {
            $qType = $question->question_type ?? 'single_choice';
            $optionsCollection = $question->options;
            $optionsCount = $optionsCollection->count();

            // Acak posisi pilihan jika memiliki lebih dari 2 pilihan, jangan acak jika <= 2 (misal Benar/Salah)
            if ($optionsCount > 2) {
                $orderedOptions = $optionsCollection->shuffle()->values();
            } else {
                $orderedOptions = $optionsCollection->sortBy('option_key')->values();
            }

            $letters = range('A', 'Z');
            $mappedOptions = [];
            $correctOptionKeys = [];

            foreach ($orderedOptions as $optIndex => $opt) {
                $newKey = $letters[$optIndex] ?? (string) ($optIndex + 1);
                $mappedOptions[$newKey] = $opt->option_text;

                if ($opt->is_correct) {
                    $correctOptionKeys[] = $newKey;
                }
            }

            $correctOption = null;
            if ($qType === 'multiple_choice' || $qType === 'complex_choice') {
                sort($correctOptionKeys);
                $correctOption = implode(',', $correctOptionKeys);
            } elseif ($qType === 'short_answer') {
                $correctOpt = $question->options->firstWhere('is_correct', true);
                $correctOption = $correctOpt ? trim($correctOpt->option_text ?? $correctOpt->option_key) : null;
            } else {
                $correctOption = $correctOptionKeys[0] ?? null;
            }

            return [
                'number' => $index + 1,
                'id' => $question->id,
                'subject' => $question->subject,
                'subtest' => $question->examType?->name ?? $question->subtest,
                'question_type' => $qType,
                'exam_type' => $question->examType ? [
                    'id' => $question->examType->id,
                    'code' => $question->examType->code,
                    'name' => $question->examType->name,
                    'icon' => $question->examType->icon,
                ] : null,
                'text' => $question->question_text,
                'options' => $mappedOptions,
                'correct_option' => $correctOption, // Hidden from frontend, used for scoring
                'points' => $question->points ?? 1,
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
        $letters = range('A', 'E');
        for ($i = 1; $i <= 20; $i++) {
            $baseOptions = [
                'Pilihan A — Jawaban pertama yang memungkinkan',
                'Pilihan B — Jawaban kedua yang memungkinkan',
                'Pilihan C — Jawaban ketiga yang memungkinkan',
                'Pilihan D — Jawaban keempat yang memungkinkan',
                'Pilihan E — Jawaban kelima yang memungkinkan',
            ];
            shuffle($baseOptions);
            $options = [];
            foreach ($baseOptions as $idx => $optText) {
                $options[$letters[$idx]] = $optText;
            }

            $questions[] = [
                'number' => $i,
                'subject' => $type,
                'question_type' => 'single_choice',
                'text' => "Pertanyaan No. {$i} — {$type}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pilih jawaban yang paling tepat.",
                'duration_seconds' => 90,
                'options' => $options,
                'correct_option' => 'A',
                'points' => 1,
            ];
        }

        shuffle($questions);
        foreach ($questions as $idx => &$q) {
            $q['number'] = $idx + 1;
        }

        return $questions;
    }
}
