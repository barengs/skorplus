<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamType;
use App\Models\Question;
use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Disediakan tepat 3 paket ujian CBT dan masing-masing 3 butir soal representatif.
     */
    public function run(): void
    {
        $typeTps = ExamType::where('code', 'tps')->first();
        $typePu = ExamType::where('code', 'pu')->first();
        $typePpu = ExamType::where('code', 'ppu')->first();
        $typePm = ExamType::where('code', 'pm')->first();
        $typeLbi = ExamType::where('code', 'lbi')->first();

        // =========================================================================
        // 1. Paket Ujian CBT 1: Simulasi Akbar CBT Uji Kompetensi SNBT 2027 (TPS)
        // =========================================================================
        $examMain = Exam::updateOrCreate(
            ['title' => 'Simulasi Akbar CBT Uji Kompetensi SNBT 2027'],
            [
                'exam_type_id' => $typeTps?->id,
                'title' => 'Simulasi Akbar CBT Uji Kompetensi SNBT 2027',
                'description' => 'Simulasi resmi prediktif SNBT 2027 mencakup Penalaran Umum, Pemahaman Umum, dan Analisis Logika.',
                'duration_minutes' => 45,
                'total_questions' => 3,
                'passing_score' => 65,
                'is_active' => true,
            ]
        );

        $questionsExam1 = [
            // Soal 1: Single Choice (Penalaran Deduktif Silogisme)
            [
                'exam_type_id' => $typePu?->id ?? $typeTps?->id,
                'subject' => 'Penalaran Umum (PU)',
                'subtest' => 'Penalaran Deduktif',
                'question_type' => 'single_choice',
                'question_text' => '<p>Semua siswa SMA yang mengikuti bimbingan intensif memiliki jadwal belajar teratur. Sebagian siswa yang memiliki jadwal belajar teratur berhasil lolos seleksi PTN favorit tahun lalu.</p><p>Kesimpulan yang <strong>pasti benar</strong> berdasarkan informasi di atas adalah...</p>',
                'points' => 30,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Premis 1: Siswa Bimbel Intensif &sub; Siswa Jadwal Teratur.<br>Premis 2: Sebagian Siswa Jadwal Teratur lolos PTN favorit.<br>Maka dapat disimpulkan bahwa sebagian siswa yang memiliki jadwal belajar teratur adalah siswa yang mengikuti bimbingan intensif.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Semua siswa yang lolos seleksi PTN favorit mengikuti bimbingan intensif', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Sebagian siswa yang memiliki jadwal belajar teratur adalah siswa yang mengikuti bimbingan intensif', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Siswa yang tidak mengikuti bimbingan intensif dipastikan tidak lolos PTN', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Semua siswa yang mengikuti bimbingan intensif pasti lolos seleksi PTN favorit', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Tidak ada siswa bimbel intensif yang gagal seleksi PTN', 'is_correct' => false],
                ],
            ],
            // Soal 2: Multiple Choice (Logika Posisi Multi Jawaban)
            [
                'exam_type_id' => $typePu?->id ?? $typeTps?->id,
                'subject' => 'Penalaran Umum (PU)',
                'subtest' => 'Logika Analitik & Posisi',
                'question_type' => 'multiple_choice',
                'question_text' => '<p>Lima siswa SMA di Jawa Timur (Adit, Bima, Citra, Dinda, dan Eko) duduk berjajar di laboratorium komputer:</p><ul><li>Bima duduk tepat di sebelah kanan Adit.</li><li>Citra tidak mau duduk di ujung barisan.</li><li>Dinda duduk di antara Citra dan Eko.</li><li>Adit duduk di ujung paling kiri barisan.</li></ul><p>Pilihlah <strong>SEMUA pernyataan yang BENAR</strong> terkait posisi duduk mereka!</p>',
                'points' => 35,
                'duration_seconds' => 150,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Adit di ujung kiri (Posisi 1). Bima tepat di kanan Adit (Posisi 2). Citra (3), Dinda (4), Eko (5).<br>Pernyataan B (Citra duduk di nomor urut ke-3 dari kiri) dan C (Eko duduk di posisi ujung paling kanan barisan) adalah BENAR.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Dinda duduk tepat di sebelah kanan Bima', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Citra duduk di nomor urut ke-3 dari kiri', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Eko duduk di posisi ujung paling kanan barisan', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => 'Bima duduk di antara Adit dan Dinda', 'is_correct' => false],
                ],
            ],
            // Soal 3: Single Choice (Semantik & Makna Konteks PPU)
            [
                'exam_type_id' => $typePpu?->id ?? $typeTps?->id,
                'subject' => 'Pengetahuan & Pemahaman Umum (PPU)',
                'subtest' => 'Semantik & Makna Kontekstual',
                'question_type' => 'single_choice',
                'question_text' => '<p>Perhatikan kutipan berikut:</p><blockquote>"Pemerintah berkomitmen memperkuat <em>hilirisasi</em> sektor agroindustri guna meningkatkan nilai tambah komoditas lokal."</blockquote><p>Kata <strong>hilirisasi</strong> pada kalimat di atas paling tepat dimaknai sebagai...</p>',
                'points' => 35,
                'duration_seconds' => 90,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Dalam konteks ekonomi industri, <em>hilirisasi</em> adalah proses pengolahan bahan mentah menjadi produk jadi atau setengah jadi bernilai jual lebih tinggi.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Penggalian potensi sumber daya alam dari hulu sungai', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Pengolahan bahan mentah menjadi produk jadi bernilai jual lebih tinggi', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Penyaluran bantuan pupuk subsidi bagi petani pedesaan', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Penetapan harga pagu komoditas oleh kementerian perdagangan', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Pengurangan kuota ekspor bahan olahan ke pasar global', 'is_correct' => false],
                ],
            ],
        ];

        foreach ($examMain->questions as $oldQ) {
            $oldQ->options()->delete();
            $oldQ->delete();
        }
        $examMain->questions()->detach();

        foreach ($questionsExam1 as $index => $qData) {
            $options = $qData['options'];
            unset($qData['options']);
            $qData['is_active'] = true;
            $question = Question::create($qData);
            foreach ($options as $opt) {
                $question->options()->create($opt);
            }
            $examMain->questions()->attach($question->id, ['sort_order' => $index + 1]);
        }
        $examMain->update(['total_questions' => count($questionsExam1)]);

        // =========================================================================
        // 2. Paket Ujian CBT 2: Tryout Spesialis Penalaran Matematika (PM) 2027
        // =========================================================================
        $examPm = Exam::updateOrCreate(
            ['title' => 'Tryout Spesialis Penalaran Matematika (PM) 2027'],
            [
                'exam_type_id' => $typePm?->id,
                'title' => 'Tryout Spesialis Penalaran Matematika (PM) 2027',
                'description' => 'Latihan intensif pemodelan matematika, kombinatorika, dan fungsi aljabar untuk SNBT 2027.',
                'duration_minutes' => 30,
                'total_questions' => 3,
                'passing_score' => 70,
                'is_active' => true,
            ]
        );

        $questionsExam2 = [
            // Soal 1: Single Choice (Kombinatorika)
            [
                'exam_type_id' => $typePm?->id,
                'subject' => 'Penalaran Matematika (PM)',
                'subtest' => 'Peluang & Kombinatorika',
                'question_type' => 'single_choice',
                'question_text' => '<p>Dari 7 siswa putra dan 5 siswa putri SMAN 1 Malang akan dibentuk tim delegasi olimpiade sains yang beranggotakan 3 orang. Banyaknya cara memilih delegasi yang beranggotakan <strong>tepat 2 putra dan 1 putri</strong> adalah...</p>',
                'points' => 30,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Pilih 2 putra dari 7: C(7,2) = 21.<br>Pilih 1 putri dari 5: C(5,1) = 5.<br>Total kombinasi = 21 × 5 = <strong>105 cara</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '35', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '70', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '105', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => '210', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '220', 'is_correct' => false],
                ],
            ],
            // Soal 2: Short Answer (Aritmetika Sosial Isian Singkat)
            [
                'exam_type_id' => $typePm?->id,
                'subject' => 'Penalaran Matematika (PM)',
                'subtest' => 'Aritmetika Sosial & Bunga Tunggal',
                'question_type' => 'short_answer',
                'question_text' => '<p>Seseorang menabung uang sebesar Rp 10.000.000,00 di bank dengan bunga tunggal 6% per tahun. Berapakah total bunga yang diperoleh setelah menabung selama <strong>3 tahun</strong> (dalam ribuan rupiah, ketikkan hanya angkanya saja tanpa titik, contoh jika Rp 1.800.000 maka ketik 1800)?</p>',
                'points' => 35,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Bunga per tahun = 6% × 10.000.000 = Rp 600.000.<br>Dalam 3 tahun = 3 × 600.000 = Rp 1.800.000. Dalam ribuan = 1800.</p>',
                'options' => [
                    ['option_key' => 'ANS', 'option_text' => '1800', 'is_correct' => true],
                ],
            ],
            // Soal 3: Single Choice (Fungsi Kuadrat & Nilai Optimum)
            [
                'exam_type_id' => $typePm?->id,
                'subject' => 'Penalaran Matematika (PM)',
                'subtest' => 'Fungsi Kuadrat & Nilai Maksimum',
                'question_type' => 'single_choice',
                'question_text' => '<p>Keuntungan sebuah toko perlengkapan sekolah ditentukan oleh fungsi keuntungan f(x) = -2x² + 40x - 50 (dalam ratusan ribu rupiah), dengan x menyatakan jumlah paket belajar yang terjual per hari. Keuntungan <strong>maksimum</strong> yang dapat dicapai toko tersebut adalah...</p>',
                'points' => 35,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>f(x) = ax² + bx + c dengan a = -2, b = 40, c = -50.<br>Sumbu simetri x = -b / (2a) = -40 / (-4) = 10.<br>Nilai maksimum: f(10) = -2(10)² + 40(10) - 50 = -200 + 400 - 50 = 150 ratusan ribu rupiah = Rp 15.000.000,00.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Rp 10.000.000,00', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Rp 12.500.000,00', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => 'Rp 15.000.000,00', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => 'Rp 17.500.000,00', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Rp 20.000.000,00', 'is_correct' => false],
                ],
            ],
        ];

        foreach ($examPm->questions as $oldQ) {
            $oldQ->options()->delete();
            $oldQ->delete();
        }
        $examPm->questions()->detach();

        foreach ($questionsExam2 as $index => $qData) {
            $options = $qData['options'];
            unset($qData['options']);
            $qData['is_active'] = true;
            $question = Question::create($qData);
            foreach ($options as $opt) {
                $question->options()->create($opt);
            }
            $examPm->questions()->attach($question->id, ['sort_order' => $index + 1]);
        }
        $examPm->update(['total_questions' => count($questionsExam2)]);

        // =========================================================================
        // 3. Paket Ujian CBT 3: Tryout Literasi Bahasa Indonesia & Pemahaman Wacana 2027
        // =========================================================================
        $examLbi = Exam::updateOrCreate(
            ['title' => 'Tryout Literasi Bahasa Indonesia & Pemahaman Wacana 2027'],
            [
                'exam_type_id' => $typeLbi?->id,
                'title' => 'Tryout Literasi Bahasa Indonesia & Pemahaman Wacana 2027',
                'description' => 'Evaluasi kemampuan memahami teks ilmiah, kaidah ejaan EYD V, dan penalaran wacana bahasa Indonesia.',
                'duration_minutes' => 30,
                'total_questions' => 3,
                'passing_score' => 65,
                'is_active' => true,
            ]
        );

        $questionsExam3 = [
            // Soal 1: Single Choice (Ide Pokok Paragraf)
            [
                'exam_type_id' => $typeLbi?->id,
                'subject' => 'Literasi Bahasa Indonesia (LBI)',
                'subtest' => 'Pemahaman Bacaan & Ide Pokok',
                'question_type' => 'single_choice',
                'question_text' => '<p>Perhatikan kutipan wacana berikut:</p><blockquote>"Pemanasan global telah memicu anomali cuaca ekstrem di berbagai belahan bumi. Kenaikan suhu rata-rata permukaan laut mengakibatkan intensitas badai tropis semakin meningkat dan sulit diprediksi. Oleh sebab itu, adaptasi mitigasi bencana berbasis teknologi satelit sangat diperlukan untuk meminimalisasi risiko kerugian ekonomi dan korban jiwa."</blockquote><p>Gagasan utama paragraf tersebut adalah...</p>',
                'points' => 30,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Paragraf membahas dampak pemanasan global terhadap cuaca ekstrem serta perlunya langkah mitigasi adaptif berbasis teknologi satelit guna menekan dampak buruknya.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Kenaikan suhu rata-rata air laut hanya terjadi di wilayah khatulistiwa', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Pemanasan global memicu cuaca ekstrem sehingga memerlukan mitigasi berbasis teknologi', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Penggunaan satelit cuaca tidak efektif dalam mendeteksi badai tropis', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Bencana alam selalu menimbulkan kerugian ekonomi yang tidak terhindarkan', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Anomali iklim dapat diselesaikan tanpa perlu adanya kerja sama global', 'is_correct' => false],
                ],
            ],
            // Soal 2: Multiple Choice (Kalimat Efektif & Kaidah EYD V)
            [
                'exam_type_id' => $typeLbi?->id,
                'subject' => 'Literasi Bahasa Indonesia (LBI)',
                'subtest' => 'Kalimat Efektif & Ejaan',
                'question_type' => 'multiple_choice',
                'question_text' => '<p>Perhatikan kalimat-kalimat berikut. Pilihlah <strong>SEMUA kalimat yang EFEKTIF dan sesuai dengan kaidah EYD V</strong>!</p>',
                'points' => 35,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Kalimat A (Penelitian ini bertujuan untuk menganalisis pengaruh jam belajar) dan C (Siswa yang lulus seleksi nasional wajib melakukan pendaftaran ulang tepat waktu) adalah kalimat efektif dengan fungsi gramatikal lengkap tanpa kerancuan konjungsi.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Penelitian ini bertujuan untuk menganalisis pengaruh jam belajar terhadap skor siswa.', 'is_correct' => true],
                    ['option_key' => 'B', 'option_text' => 'Bagi para peserta-peserta ujian harap berkumpul di aula lantai dua.', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => 'Siswa yang lulus seleksi nasional wajib melakukan pendaftaran ulang tepat waktu.', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => 'Meskipun hari hujan lebat, tetapi kegiatan praktikum laboratorium tetap berlangsung.', 'is_correct' => false],
                ],
            ],
            // Soal 3: Short Answer (Isian Makna Istilah / Frasa)
            [
                'exam_type_id' => $typeLbi?->id,
                'subject' => 'Literasi Bahasa Indonesia (LBI)',
                'subtest' => 'Makna Kosakata & Diksi',
                'question_type' => 'short_answer',
                'question_text' => '<p>Istilah serapan baku dalam bahasa Indonesia yang bermakna <em>"tindakan mengurangi dampak atau risiko bencana"</em> adalah... (ketik satu kata huruf kecil semua, contoh: mitigasi)</p>',
                'points' => 35,
                'duration_seconds' => 90,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Berdasarkan KBBI, mitigasi adalah tindakan mengurangi dampak bencana.</p>',
                'options' => [
                    ['option_key' => 'ANS', 'option_text' => 'mitigasi', 'is_correct' => true],
                ],
            ],
        ];

        foreach ($examLbi->questions as $oldQ) {
            $oldQ->options()->delete();
            $oldQ->delete();
        }
        $examLbi->questions()->detach();

        foreach ($questionsExam3 as $index => $qData) {
            $options = $qData['options'];
            unset($qData['options']);
            $qData['is_active'] = true;
            $question = Question::create($qData);
            foreach ($options as $opt) {
                $question->options()->create($opt);
            }
            $examLbi->questions()->attach($question->id, ['sort_order' => $index + 1]);
        }
        $examLbi->update(['total_questions' => count($questionsExam3)]);
    }
}
