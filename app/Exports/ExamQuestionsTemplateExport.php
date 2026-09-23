<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ExamQuestionsTemplateExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function collection(): Collection
    {
        return collect([
            [
                'mata_pelajaran' => 'Tes Potensi Skolastik',
                'sub_test' => 'PU — Penalaran Umum',
                'pertanyaan' => '<p>Semua hewan mamalia berkembang biak dengan melahirkan. Ikan paus adalah mamalia. Kesimpulannya adalah...</p>',
                'poin' => 10,
                'penjelasan' => '<p>Karena semua mamalia melahirkan dan ikan paus mamalia, maka ikan paus melahirkan.</p>',
                'status' => 'AKTIF',
                'pilihan_a' => 'Ikan paus berkembang biak dengan melahirkan',
                'benar_a' => 'Y',
                'pilihan_b' => 'Ikan paus berkembang biak dengan bertelur',
                'benar_b' => 'N',
                'pilihan_c' => 'Sebagian paus bertelur',
                'benar_c' => 'N',
                'pilihan_d' => 'Tidak dapat disimpulkan',
                'benar_d' => 'N',
                'pilihan_e' => 'Semua salah',
                'benar_e' => 'N',
            ],
            [
                'mata_pelajaran' => 'Tes Potensi Skolastik',
                'sub_test' => 'PM — Penalaran Matematika',
                'pertanyaan' => '<p>Andi membeli sebuah buku seharga Rp 80.000 setelah mendapat diskon 20%. Harga awal buku tersebut adalah...</p>',
                'poin' => 10,
                'penjelasan' => '<p>Harga awal = 80.000 / 0.8 = Rp 100.000.</p>',
                'status' => 'AKTIF',
                'pilihan_a' => 'Rp 90.000',
                'benar_a' => 'N',
                'pilihan_b' => 'Rp 100.000',
                'benar_b' => 'Y',
                'pilihan_c' => 'Rp 110.000',
                'benar_c' => 'N',
                'pilihan_d' => 'Rp 120.000',
                'benar_d' => 'N',
                'pilihan_e' => 'Rp 150.000',
                'benar_e' => 'N',
            ],
        ]);
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
}
