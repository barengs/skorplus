<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\Question;
use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buat Paket Ujian TPS
        $exam = Exam::create([
            'title' => 'Tryout TPS - SNBT 2026',
            'description' => 'Latihan Tes Potensi Skolastik untuk persiapan SNBT',
            'duration_minutes' => 30,
            'total_questions' => 5,
            'passing_score' => 60,
            'is_active' => true,
        ]);

        $questionsData = [
            [
                'subject' => 'Penalaran Umum',
                'subtest' => 'Logika Analitik',
                'question_text' => '<p>Semua hewan mamalia berkembang biak dengan cara melahirkan. Ikan paus adalah hewan mamalia.</p><p>Kesimpulan yang tepat adalah...</p>',
                'points' => 10,
                'explanation_text' => '<p>Berdasarkan silogisme: Premis umum menyatakan semua mamalia melahirkan. Premis khusus menyatakan ikan paus adalah mamalia. Maka kesimpulannya ikan paus berkembang biak dengan cara melahirkan.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Ikan paus berkembang biak dengan bertelur', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Ikan paus berkembang biak dengan cara melahirkan', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Ikan paus adalah hewan yang hidup di laut', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Sebagian hewan mamalia bertelur', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Tidak dapat disimpulkan', 'is_correct' => false],
                ]
            ],
            [
                'subject' => 'Pengetahuan Kuantitatif',
                'subtest' => 'Aritmetika Sosial',
                'question_text' => '<p>Andi membeli sebuah buku seharga Rp 80.000,00 setelah mendapat diskon 20%. Harga awal buku tersebut sebelum didiskon adalah...</p>',
                'points' => 10,
                'explanation_text' => '<p>Harga setelah diskon = 80% dari harga awal.<br>80.000 = (80/100) x Harga Awal<br>Harga Awal = 80.000 x (100/80) = Rp 100.000,00.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Rp 90.000,00', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Rp 96.000,00', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => 'Rp 100.000,00', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => 'Rp 110.000,00', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Rp 120.000,00', 'is_correct' => false],
                ]
            ],
            [
                'subject' => 'Pengetahuan Kuantitatif',
                'subtest' => 'Pola Bilangan',
                'question_text' => '<p>Tentukan angka selanjutnya pada deret berikut: 3, 6, 12, 24, ...</p>',
                'points' => 10,
                'explanation_text' => '<p>Pola deret bilangan tersebut adalah dikalikan 2. 24 x 2 = 48.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '30', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '36', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '40', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => '48', 'is_correct' => true],
                    ['option_key' => 'E', 'option_text' => '54', 'is_correct' => false],
                ]
            ],
            [
                'subject' => 'Pemahaman Bacaan',
                'subtest' => 'Ide Pokok',
                'question_text' => '<p>Banjir bandang melanda beberapa desa di Kabupaten A. Hujan deras yang mengguyur tanpa henti selama dua hari diduga menjadi penyebab utamanya. Selain itu, drainase yang buruk juga memperparah keadaan. Akibatnya, banyak warga kehilangan tempat tinggal.</p><p>Gagasan utama paragraf tersebut adalah...</p>',
                'points' => 10,
                'explanation_text' => '<p>Gagasan utama terletak pada awal paragraf (deduktif) yaitu "Banjir bandang melanda beberapa desa di Kabupaten A".</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Penyebab banjir bandang', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Banjir bandang melanda beberapa desa di Kabupaten A', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Hujan deras mengguyur selama dua hari', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Warga kehilangan tempat tinggal', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Buruknya drainase memperparah banjir', 'is_correct' => false],
                ]
            ],
            [
                'subject' => 'Penalaran Umum',
                'subtest' => 'Analisis Wacana',
                'question_text' => '<p>Jika x = 5 dan y = -3, maka nilai dari x² - 2xy + y² adalah...</p>',
                'points' => 10,
                'explanation_text' => '<p>Ini adalah bentuk aljabar (x - y)². <br> (5 - (-3))² = (5 + 3)² = 8² = 64. <br> Bisa juga manual: 25 - (-30) + 9 = 25 + 30 + 9 = 64.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '4', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '16', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '34', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => '64', 'is_correct' => true],
                    ['option_key' => 'E', 'option_text' => '100', 'is_correct' => false],
                ]
            ],
        ];

        foreach ($questionsData as $index => $qData) {
            $options = $qData['options'];
            unset($qData['options']);
            $qData['is_active'] = true;
            
            $question = Question::create($qData);
            
            // Simpan opsi jawaban
            foreach ($options as $opt) {
                $question->options()->create($opt);
            }

            // Relasikan dengan Exam
            $exam->questions()->attach($question->id, ['sort_order' => $index + 1]);
        }
    }
}
