<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RiasecQuestion;

class RiasecSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            ['question' => 'Saya suka merakit, memperbaiki, atau mengutak-atik mesin/peralatan elektronik.', 'dimension' => 'R'],
            ['question' => 'Saya lebih suka bekerja di luar ruangan dan beraktivitas fisik yang mengandalkan tenaga.', 'dimension' => 'R'],
            ['question' => 'Saya suka memecahkan masalah matematika yang rumit atau teka-teki logika.', 'dimension' => 'I'],
            ['question' => 'Saya menikmati melakukan observasi dan eksperimen ilmiah di laboratorium.', 'dimension' => 'I'],
            ['question' => 'Saya merasa nyaman mengekspresikan diri melalui seni, musik, atau tulisan kreatif.', 'dimension' => 'A'],
            ['question' => 'Saya lebih suka lingkungan kerja yang bebas dari aturan ketat dan mengandalkan imajinasi.', 'dimension' => 'A'],
            ['question' => 'Saya senang mengajar, melatih, atau membantu orang lain memahami suatu konsep.', 'dimension' => 'S'],
            ['question' => 'Saya merasa puas saat bisa menjadi pendengar yang baik untuk masalah teman/orang lain.', 'dimension' => 'S'],
            ['question' => 'Saya menikmati peran sebagai pemimpin atau mengambil inisiatif dalam kerja kelompok.', 'dimension' => 'E'],
            ['question' => 'Saya suka bernegosiasi, berdebat, atau memengaruhi orang lain untuk setuju dengan saya.', 'dimension' => 'E'],
            ['question' => 'Saya sangat teliti dengan angka, data, dan menyukai segala sesuatu yang terorganisir.', 'dimension' => 'C'],
            ['question' => 'Saya lebih suka bekerja dengan panduan dan prosedur operasi standar yang sudah jelas.', 'dimension' => 'C'],
        ];

        foreach ($questions as $index => $q) {
            RiasecQuestion::create([
                'question' => $q['question'],
                'dimension' => $q['dimension'],
                'sort_order' => $index + 1
            ]);
        }
    }
}
