<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminExamQuestionController extends Controller
{
    public function index($examId)
    {
        $exam = Exam::findOrFail($examId);
        $questions = $exam->questions()->with('options')->get();

        return response()->json([
            'exam' => $exam,
            'questions' => $questions
        ]);
    }

    public function store(Request $request, $examId)
    {
        $exam = Exam::findOrFail($examId);

        $validated = $request->validate([
            'subject' => 'nullable|string|max:255',
            'subtest' => 'nullable|string|max:255',
            'question_text' => 'required|string',
            'explanation_text' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'options' => 'required|array|min:2',
            'options.*.option_key' => 'required|string|max:10',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $question = Question::create([
                'subject' => $validated['subject'] ?? null,
                'subtest' => $validated['subtest'] ?? null,
                'question_text' => $validated['question_text'],
                'explanation_text' => $validated['explanation_text'] ?? null,
                'points' => $validated['points'],
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

            return response()->json($question->load('options'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menyimpan soal', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $examId, $questionId)
    {
        $exam = Exam::findOrFail($examId);
        $question = $exam->questions()->findOrFail($questionId);

        $validated = $request->validate([
            'subject' => 'nullable|string|max:255',
            'subtest' => 'nullable|string|max:255',
            'question_text' => 'required|string',
            'explanation_text' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'is_active' => 'boolean',
            'options' => 'required|array|min:2',
            'options.*.id' => 'nullable|exists:question_options,id',
            'options.*.option_key' => 'required|string|max:10',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $question->update([
                'subject' => $validated['subject'] ?? null,
                'subtest' => $validated['subtest'] ?? null,
                'question_text' => $validated['question_text'],
                'explanation_text' => $validated['explanation_text'] ?? null,
                'points' => $validated['points'],
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

            return response()->json($question->load('options'));
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
