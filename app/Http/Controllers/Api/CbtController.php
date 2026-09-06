<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtAnswer;
use App\Models\CbtSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CbtController extends Controller
{
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
            'exam_type'        => 'required|string',
            'exam_title'       => 'required|string',
            'duration_seconds' => 'nullable|integer|min:60',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session = CbtSession::create([
            'user_id'          => auth('api')->id(),
            'exam_type'        => $request->exam_type,
            'exam_title'       => $request->exam_title,
            'duration_seconds' => $request->duration_seconds ?? 5400,
            'started_at'       => now(),
            'status'           => 'ongoing',
        ]);

        // Return dummy questions for now
        $questions = $this->getDummyQuestions($request->exam_type);

        return response()->json([
            'session'   => $session,
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
            'is_flagged'      => 'boolean',
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

        // ponytail: dummy scoring — replace with real answer key when available
        $answered = CbtAnswer::where('cbt_session_id', $session->id)
            ->whereNotNull('selected_option')
            ->count();
        $score = min(100, (int) ($answered / 20 * 100));

        $session->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
            'score'        => $score,
        ]);

        return response()->json([
            'message' => 'Ujian berhasil diselesaikan.',
            'score'   => $score,
            'session' => $session->fresh(),
        ]);
    }

    private function getDummyQuestions(string $type): array
    {
        $questions = [];
        for ($i = 1; $i <= 20; $i++) {
            $questions[] = [
                'number'  => $i,
                'subject' => $type,
                'text'    => "Pertanyaan No. {$i} — {$type}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pilih jawaban yang paling tepat.",
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
