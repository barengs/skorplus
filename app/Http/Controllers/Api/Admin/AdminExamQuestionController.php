<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminExamQuestionController extends Controller
{
    public function index($examId)
    {
        $exam = Exam::with('examType')->findOrFail($examId);
        $questions = $exam->questions()
            ->with(['options', 'examType'])
            ->orderBy('exam_questions.sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'exam' => $exam,
            'questions' => $questions,
        ]);
    }

    public function store(Request $request, $examId)
    {
        $exam = Exam::findOrFail($examId);

        $minOptions = ($request->input('question_type') === 'short_answer') ? 1 : 2;

        $validated = $request->validate([
            'exam_type_id' => 'nullable|exists:exam_types,id',
            'question_type' => 'nullable|string|in:single_choice,multiple_choice,short_answer',
            'subject' => 'nullable|string|max:255',
            'subtest' => 'nullable|string|max:255',
            'question_text' => 'required|string',
            'explanation_text' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'duration_seconds' => 'nullable|integer|min:10|max:3600',
            'is_active' => 'boolean',
            'options' => "required|array|min:{$minOptions}",
            'options.*.option_key' => 'required|string|max:10',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $question = Question::create([
                'exam_type_id' => $validated['exam_type_id'] ?? null,
                'question_type' => $validated['question_type'] ?? 'single_choice',
                'subject' => $validated['subject'] ?? null,
                'subtest' => $validated['subtest'] ?? null,
                'question_text' => $validated['question_text'],
                'explanation_text' => $validated['explanation_text'] ?? null,
                'points' => $validated['points'],
                'duration_seconds' => $validated['duration_seconds'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Link to exam
            $exam->questions()->attach($question->id, ['sort_order' => $exam->questions()->count() + 1]);

            // Create options
            foreach ($validated['options'] as $opt) {
                $question->options()->create([
                    'option_key' => $opt['option_key'],
                    'option_text' => $opt['option_text'],
                    'is_correct' => $opt['is_correct'] ?? false,
                ]);
            }

            // Update exam total_questions
            $exam->update(['total_questions' => $exam->questions()->count()]);

            DB::commit();

            return response()->json($question->load(['options', 'examType']), 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Gagal menyimpan soal', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $examId, $questionId)
    {
        $exam = Exam::findOrFail($examId);
        $question = $exam->questions()->findOrFail($questionId);

        $minOptions = ($request->input('question_type', $question->question_type) === 'short_answer') ? 1 : 2;

        $validated = $request->validate([
            'exam_type_id' => 'nullable|exists:exam_types,id',
            'question_type' => 'nullable|string|in:single_choice,multiple_choice,short_answer',
            'subject' => 'nullable|string|max:255',
            'subtest' => 'nullable|string|max:255',
            'question_text' => 'required|string',
            'explanation_text' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'duration_seconds' => 'nullable|integer|min:10|max:3600',
            'is_active' => 'boolean',
            'options' => "required|array|min:{$minOptions}",
            'options.*.id' => 'nullable|exists:question_options,id',
            'options.*.option_key' => 'required|string|max:10',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $question->update([
                'exam_type_id' => $validated['exam_type_id'] ?? null,
                'question_type' => $validated['question_type'] ?? $question->question_type,
                'subject' => $validated['subject'] ?? null,
                'subtest' => $validated['subtest'] ?? null,
                'question_text' => $validated['question_text'],
                'explanation_text' => $validated['explanation_text'] ?? null,
                'points' => $validated['points'],
                'duration_seconds' => $validated['duration_seconds'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Update options
            $existingOptionIds = [];
            foreach ($validated['options'] as $opt) {
                if (isset($opt['id'])) {
                    $option = $question->options()->find($opt['id']);
                    if ($option) {
                        $option->update([
                            'option_key' => $opt['option_key'],
                            'option_text' => $opt['option_text'],
                            'is_correct' => $opt['is_correct'] ?? false,
                        ]);
                        $existingOptionIds[] = $option->id;
                    }
                } else {
                    $newOption = $question->options()->create([
                        'option_key' => $opt['option_key'],
                        'option_text' => $opt['option_text'],
                        'is_correct' => $opt['is_correct'] ?? false,
                    ]);
                    $existingOptionIds[] = $newOption->id;
                }
            }

            // Delete removed options
            $question->options()->whereNotIn('id', $existingOptionIds)->delete();

            DB::commit();

            return response()->json($question->load(['options', 'examType']));
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Gagal memperbarui soal', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($examId, $questionId)
    {
        $exam = Exam::findOrFail($examId);
        $question = $exam->questions()->findOrFail($questionId);

        $exam->questions()->detach($questionId);
        $question->delete(); // this will cascade delete options

        $exam->update(['total_questions' => $exam->questions()->count()]);

        return response()->json(null, 204);
    }
}
