<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtAnswer;
use App\Models\CbtSession;
use App\Models\Exam;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CbtController extends Controller
{
    /**
     * List all available active exams.
     */
    public function availableExams(): JsonResponse
    {
        $exams = Exam::where('is_active', true)
            ->withCount('questions')
            ->having('questions_count', '>', 0)
            ->latest()
            ->get();

        return response()->json(['exams' => $exams]);
    }

    /**
     * List all sessions for the authenticated user.
     */
    public function sessions(): JsonResponse
    {
        $sessions = CbtSession::where('user_id', auth('api')->id())
            ->latest()
            ->get();

        return response()->json(['sessions' => $sessions]);
    }

    /**
     * Start a new CBT session.
     */
    public function startSession(Request $request): JsonResponse
    {
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
            'exam_type' => $request->exam_type,
            'exam_title' => $request->exam_title,
            'duration_seconds' => $request->duration_seconds ?? ($exam?->duration_minutes ?? 90) * 60,
            'started_at' => now(),
            'status' => 'ongoing',
        ]);

        return response()->json([
            'session' => $session,
            'questions' => $questions,
        ], 201);
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
            'selected_option' => 'nullable|in:A,B,C,D,E',
            'is_flagged' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        CbtAnswer::updateOrCreate(
            ['cbt_session_id' => $session->id, 'question_number' => $request->question_number],
            ['selected_option' => $request->selected_option, 'is_flagged' => $request->is_flagged ?? false]
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

        // Calculate score based on correct answers
        foreach ($questions as $index => $questionData) {
            $questionNumber = $index + 1;
            $userAnswer = $answers->get($questionNumber);

            if ($userAnswer && isset($questionData['correct_option'])) {
                if ($userAnswer->selected_option === $questionData['correct_option']) {
                    $correctCount++;
                    $totalScore += $questionData['points'] ?? 1;
                }
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

        return response()->json([
            'message' => 'Ujian berhasil diselesaikan.',
            'score' => $normalizedScore,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuestions,
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
            ->with('options')
            ->orderBy('id')
            ->get();

        return $questions->map(function ($question, $index) {
            $correctOption = $question->options->firstWhere('is_correct', true);

            return [
                'number' => $index + 1,
                'id' => $question->id,
                'subject' => $question->subject,
                'text' => $question->question_text,
                'options' => $question->options->pluck('option_text', 'option_key')->toArray(),
                'correct_option' => $correctOption?->option_key, // Hidden from frontend, used for scoring
                'points' => $question->points,
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
