<?php

namespace App\Imports;

use App\Models\Exam;
use App\Models\Question;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ExamQuestionsImport implements ToCollection, WithHeadingRow
{
    protected int $importedCount = 0;

    protected array $errors = [];

    public function __construct(
        protected Exam $exam
    ) {}

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $lineNumber = $index + 2; // +2 because heading row is 1, index is 0-based

            $questionText = $row['pertanyaan'] ?? '';
            if (empty(trim($questionText))) {
                continue; // Skip empty rows
            }

            // Parse options
            $options = [];
            foreach (['A', 'B', 'C', 'D', 'E'] as $key) {
                $optionText = $row['pilihan_'.strtolower($key)] ?? '';
                $isCorrect = strtoupper(trim($row['benar_'.strtolower($key)] ?? 'N')) === 'Y';

                if (! empty(trim($optionText))) {
                    $options[] = [
                        'option_key' => $key,
                        'option_text' => trim($optionText),
                        'is_correct' => $isCorrect,
                    ];
                }
            }

            if (count($options) < 2) {
                $this->errors[] = "Baris {$lineNumber}: Minimal 2 pilihan jawaban diperlukan.";

                continue;
            }

            $correctCount = collect($options)->where('is_correct', true)->count();
            if ($correctCount !== 1) {
                $this->errors[] = "Baris {$lineNumber}: Harus tepat 1 jawaban benar (ditemukan {$correctCount}).";

                continue;
            }

            $subject = $row['mata_pelajaran'] ?? null;
            $subtest = $row['sub_test'] ?? null;
            $points = (int) ($row['poin'] ?? 1);
            $explanation = $row['penjelasan'] ?? null;
            $isActive = strtoupper(trim($row['status'] ?? 'AKTIF'));
            $isActive = $isActive === 'AKTIF' || $isActive === 'Y' || $isActive === '1';

            DB::beginTransaction();
            try {
                $question = Question::create([
                    'subject' => $subject,
                    'subtest' => $subtest,
                    'question_text' => $questionText,
                    'explanation_text' => $explanation,
                    'points' => max(1, $points),
                    'is_active' => $isActive,
                ]);

                $this->exam->questions()->attach($question->id, [
                    'sort_order' => $this->exam->questions()->count(),
                ]);

                foreach ($options as $opt) {
                    $question->options()->create($opt);
                }

                DB::commit();
                $this->importedCount++;
            } catch (\Exception $e) {
                DB::rollBack();
                $this->errors[] = "Baris {$lineNumber}: {$e->getMessage()}";
            }
        }
    }

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    /**
     * @return string[]
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
