<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
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
        ]);

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
        ]);

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
}
