<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CbtSession;
use App\Models\Exam;
use Illuminate\Http\Request;

class AdminCbtController extends Controller
{
    public function index()
    {
        $exams = Exam::with(['examType', 'questions.examType'])
            ->withCount('questions')
            ->orderBy('created_at', 'desc')
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

        return response()->json($exams);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'exam_type_id' => 'nullable|exists:exam_types,id',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'schedule_type' => 'nullable|string|in:always,once,daily,weekly,interval',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'start_hour' => 'nullable|string|max:10',
            'end_hour' => 'nullable|string|max:10',
            'scheduled_days' => 'nullable|array',
            'scheduled_days.*' => 'integer|between:1,7',
            'interval_hours' => 'nullable|integer|min:1',
        ]);

        $nullableFields = ['start_time', 'end_time', 'start_hour', 'end_hour', 'schedule_type', 'interval_hours'];
        foreach ($nullableFields as $field) {
            if (empty($validated[$field])) {
                $validated[$field] = null;
            }
        }
        if (empty($validated['schedule_type'])) {
            $validated['schedule_type'] = 'always';
        }

        $exam = Exam::create($validated);
        $exam->load('examType');
        $exam->total_questions = 0; // default total_questions
        $exam->subtests_list = [];

        return response()->json($exam, 201);
    }

    public function show($id)
    {
        return response()->json(Exam::with(['examType', 'questions.examType'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $exam = Exam::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'exam_type_id' => 'nullable|exists:exam_types,id',
            'description' => 'nullable|string',
            'duration_minutes' => 'sometimes|required|integer|min:1',
            'is_active' => 'boolean',
            'schedule_type' => 'nullable|string|in:always,once,daily,weekly,interval',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'start_hour' => 'nullable|string|max:10',
            'end_hour' => 'nullable|string|max:10',
            'scheduled_days' => 'nullable|array',
            'scheduled_days.*' => 'integer|between:1,7',
            'interval_hours' => 'nullable|integer|min:1',
        ]);

        $nullableFields = ['start_time', 'end_time', 'start_hour', 'end_hour', 'schedule_type', 'interval_hours'];
        foreach ($nullableFields as $field) {
            if (array_key_exists($field, $validated) && empty($validated[$field])) {
                $validated[$field] = null;
            }
        }
        if (array_key_exists('schedule_type', $validated) && empty($validated['schedule_type'])) {
            $validated['schedule_type'] = 'always';
        }

        $exam->update($validated);

        $exam = Exam::with(['examType'])->withCount('questions')->find($id);

        return response()->json($exam);
    }

    public function destroy($id)
    {
        $exam = Exam::findOrFail($id);
        $exam->questions()->detach();
        $exam->delete();

        return response()->json(['message' => 'Paket ujian berhasil dihapus'], 200);
    }

    public function activeSessions(Request $request, $examId)
    {
        $exam = Exam::findOrFail($examId);

        $query = CbtSession::with(['user:id,name,email', 'exam' => fn ($q) => $q->withCount('questions')])
            ->withCount('answers')
            ->where('exam_id', $examId);

        if ($request->filled('date')) {
            $query->whereDate('started_at', $request->date);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->status === 'submitted') {
            $query->orderByDesc('score')->orderByDesc('submitted_at');
        } else {
            $query->orderBy('started_at', 'desc');
        }

        $sessions = $query->get()
            ->map(function ($session) {
                $answeredCount = $session->answers_count ?? 0;
                $totalQuestions = $session->exam?->questions_count ?? 0;

                return [
                    'id' => $session->id,
                    'user_id' => $session->user_id,
                    'user_name' => $session->user?->name ?? 'N/A',
                    'user_email' => $session->user?->email ?? 'N/A',
                    'exam_id' => $session->exam_id,
                    'exam_title' => $session->exam_title ?: ($session->exam?->title ?? 'Ujian CBT'),
                    'started_at' => $session->started_at?->format('Y-m-d H:i:s'),
                    'submitted_at' => $session->submitted_at?->format('Y-m-d H:i:s'),
                    'duration_seconds' => $session->duration_seconds,
                    'score' => $session->score,
                    'status' => $session->status,
                    'answered_count' => $answeredCount,
                    'total_questions' => $totalQuestions,
                    'progress_percent' => $totalQuestions > 0 ? round(($answeredCount / $totalQuestions) * 100) : 0,
                    'elapsed_seconds' => $session->started_at ? now()->diffInSeconds($session->started_at) : 0,
                ];
            });

        return response()->json([
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'duration_minutes' => $exam->duration_minutes,
            ],
            'sessions' => $sessions,
            'active_sessions' => $sessions,
            'total_active' => $sessions->where('status', 'ongoing')->count(),
            'total_completed' => $sessions->where('status', 'submitted')->count(),
            'total_sessions' => $sessions->count(),
        ]);
    }

    public function monitoringSessions(Request $request)
    {
        $query = CbtSession::with(['user:id,name,email', 'exam' => fn ($q) => $q->withCount('questions')])
            ->withCount('answers');

        if ($request->filled('exam_id') && $request->exam_id !== 'all') {
            $query->where('exam_id', $request->exam_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('started_at', $request->date);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->status === 'submitted') {
            $query->orderByDesc('score')->orderByDesc('submitted_at');
        } else {
            $query->orderBy('started_at', 'desc');
        }

        $sessions = $query->get()
            ->map(function ($session) {
                $answeredCount = $session->answers_count ?? 0;
                $totalQuestions = $session->exam?->questions_count ?? 0;

                return [
                    'id' => $session->id,
                    'user_id' => $session->user_id,
                    'user_name' => $session->user?->name ?? 'N/A',
                    'user_email' => $session->user?->email ?? 'N/A',
                    'exam_id' => $session->exam_id,
                    'exam_title' => $session->exam_title ?: ($session->exam?->title ?? 'Ujian CBT'),
                    'started_at' => $session->started_at?->format('Y-m-d H:i:s'),
                    'submitted_at' => $session->submitted_at?->format('Y-m-d H:i:s'),
                    'duration_seconds' => $session->duration_seconds,
                    'score' => $session->score,
                    'status' => $session->status,
                    'answered_count' => $answeredCount,
                    'total_questions' => $totalQuestions,
                    'progress_percent' => $totalQuestions > 0 ? round(($answeredCount / $totalQuestions) * 100) : 0,
                    'elapsed_seconds' => $session->started_at ? now()->diffInSeconds($session->started_at) : 0,
                ];
            });

        return response()->json([
            'sessions' => $sessions,
            'total_active' => $sessions->where('status', 'ongoing')->count(),
            'total_completed' => $sessions->where('status', 'submitted')->count(),
            'total_sessions' => $sessions->count(),
        ]);
    }
}
