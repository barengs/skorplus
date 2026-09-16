<?php

namespace App\Exports;

use App\Models\Exam;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ExamQuestionsExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(
        protected Exam $exam
    ) {}

    public function collection(): Collection
    {
        return $this->exam->questions()
            ->with('options')
            ->orderBy('id')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Mata Pelajaran',
            'Sub Test',
            'Pertanyaan',
            'Poin',
            'Penjelasan',
            'Status',
            'Pilihan A',
            'Benar A',
            'Pilihan B',
            'Benar B',
            'Pilihan C',
            'Benar C',
            'Pilihan D',
            'Benar D',
            'Pilihan E',
            'Benar E',
        ];
    }

    /**
     * @param  \App\Models\Question  $question
     */
    public function map($question): array
    {
        $options = $question->options->keyBy('option_key');

        $optA = $options->get('A');
        $optB = $options->get('B');
        $optC = $options->get('C');
        $optD = $options->get('D');
        $optE = $options->get('E');

        return [
            $question->subject ?? '',
            $question->subtest ?? '',
            $question->question_text,
            $question->points,
            $question->explanation_text ?? '',
            $question->is_active ? 'AKTIF' : 'NONAKTIF',
            $optA?->option_text ?? '',
            $optA?->is_correct ? 'Y' : 'N',
            $optB?->option_text ?? '',
            $optB?->is_correct ? 'Y' : 'N',
            $optC?->option_text ?? '',
            $optC?->is_correct ? 'Y' : 'N',
            $optD?->option_text ?? '',
            $optD?->is_correct ? 'Y' : 'N',
            $optE?->option_text ?? '',
            $optE?->is_correct ? 'Y' : 'N',
        ];
    }
}
