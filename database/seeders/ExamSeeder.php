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
     */
    public function run(): void
    {
        $typeTps = ExamType::where('code', 'tps')->first();
        $typePu = ExamType::where('code', 'pu')->first();
        $typePpu = ExamType::where('code', 'ppu')->first();
        $typePbm = ExamType::where('code', 'pbm')->first();
        $typePk = ExamType::where('code', 'pk')->first();
        $typeLbi = ExamType::where('code', 'lbi')->first();
        $typeLbe = ExamType::where('code', 'lbe')->first();
        $typePm = ExamType::where('code', 'pm')->first();

        // 1. Ujian Utama: Tryout Akbar CBT Uji Kompetensi SNBT 2027
        $examMain = Exam::updateOrCreate(
            ['title' => 'Simulasi Akbar CBT Uji Kompetensi SNBT 2027'],
            [
                'exam_type_id' => $typeTps?->id,
                'title' => 'Simulasi Akbar CBT Uji Kompetensi SNBT 2027',
                'description' => 'Simulasi resmi prediktif SNBT 2027 mencakup 7 Subtes UTBK lengkap dengan format Pilihan Ganda Tunggal, Pilihan Ganda Kompleks, dan Isian Singkat.',
                'duration_minutes' => 60,
                'total_questions' => 12,
                'passing_score' => 65,
                'is_active' => true,
            ]
        );

        $questionsData = [
            // 1. PU - Pilihan Ganda Tunggal (Deduksi Silogisme)
            [
                'exam_type_id' => $typePu?->id,
                'subject' => 'Penalaran Umum (PU)',
                'subtest' => 'Penalaran Deduktif',
                'question_type' => 'single_choice',
                'question_text' => '<p>Semua siswa SMA yang mengikuti bimbingan intensif memiliki jadwal belajar teratur. Sebagian siswa yang memiliki jadwal belajar teratur berhasil lolos seleksi PTN favorit tahun lalu.</p><p>Kesimpulan yang <strong>pasti benar</strong> berdasarkan informasi di atas adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Premis 1: Siswa Bimbel Intensif &sub; Siswa Jadwal Teratur.<br>Premis 2: Sebagian Siswa Jadwal Teratur lolos PTN favorit.<br>Maka dapat disimpulkan bahwa sebagian siswa yang memiliki jadwal belajar teratur atau siswa bimbel intensif ada yang lolos seleksi PTN favorit.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Semua siswa yang lolos seleksi PTN favorit mengikuti bimbingan intensif', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Sebagian siswa yang memiliki jadwal belajar teratur adalah siswa yang mengikuti bimbingan intensif', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Siswa yang tidak mengikuti bimbingan intensif dipastikan tidak lolos PTN', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Semua siswa yang mengikuti bimbingan intensif pasti lolos seleksi PTN favorit', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Tidak ada siswa bimbel intensif yang gagal seleksi PTN', 'is_correct' => false],
                ],
            ],

            // 2. PU - Pilihan Ganda Kompleks (Logika Analitik Multi Jawaban)
            [
                'exam_type_id' => $typePu?->id,
                'subject' => 'Penalaran Umum (PU)',
                'subtest' => 'Logika Analitik & Posisi',
                'question_type' => 'multiple_choice',
                'question_text' => '<p>Lima siswa SMA di Jawa Timur (Adit, Bima, Citra, Dinda, dan Eko) duduk berjajar di laboratorium komputer:</p><ul><li>Bima duduk tepat di sebelah kanan Adit.</li><li>Citra tidak mau duduk di ujung barisan.</li><li>Dinda duduk di antara Citra dan Eko.</li><li>Adit duduk di ujung paling kiri barisan.</li></ul><p>Pilihlah <strong>SEMUA pernyataan yang BENAR</strong> terkait posisi duduk mereka!</p>',
                'points' => 15,
                'duration_seconds' => 150,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Adit di ujung kiri (Posisi 1).<br>Bima tepat di kanan Adit (Posisi 2).<br>Tersisa posisi 3, 4, 5 untuk Citra, Dinda, Eko.<br>Dinda duduk di antara Citra dan Eko, dan Citra bukan di ujung, maka: Citra (3), Dinda (4), Eko (5).<br>Urutan lengkap: Adit (1), Bima (2), Citra (3), Dinda (4), Eko (5).<br>Pernyataan B (Citra duduk di posisi ke-3) dan C (Eko duduk di ujung paling kanan) adalah BENAR.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Dinda duduk tepat di sebelah kanan Bima', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Citra duduk di nomor urut ke-3 dari kiri', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Eko duduk di posisi ujung paling kanan barisan', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => 'Bima duduk di antara Adit dan Dinda', 'is_correct' => false],
                ],
            ],

            // 3. PPU - Pilihan Ganda Tunggal (Makna Kata & Konteks Wacana)
            [
                'exam_type_id' => $typePpu?->id,
                'subject' => 'Pengetahuan & Pemahaman Umum (PPU)',
                'subtest' => 'Semantik & Makna Kontekstual',
                'question_type' => 'single_choice',
                'question_text' => '<p>Perhatikan kutipan berikut:</p><blockquote>"Pemerintah provinsi Jawa Timur berkomitmen memperkuat <em>hilirisasi</em> sektor agroindustri guna meningkatkan nilai tambah komoditas lokal."</blockquote><p>Kata <strong>hilirisasi</strong> pada kalimat di atas paling tepat dimaknai sebagai...</p>',
                'points' => 10,
                'duration_seconds' => 90,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Dalam konteks ekonomi industri, <em>hilirisasi</em> adalah proses pengolahan bahan baku mentah menjadi barang jadi atau setengah jadi yang bernilai tambah tinggi sebelum dipasarkan.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Penggalian potensi sumber daya alam dari hulu sungai', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Pengolahan bahan mentah menjadi produk jadi bernilai jual lebih tinggi', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Penyaluran bantuan pupuk subsidi bagi petani pedesaan', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Penetapan harga pagu komoditas oleh kementerian perdagangan', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Pengurangan kuota ekspor bahan olahan ke pasar global', 'is_correct' => false],
                ],
            ],

            // 4. PBM - Pilihan Ganda Tunggal (Keefektifan Kalimat & Ejaan EYD)
            [
                'exam_type_id' => $typePbm?->id,
                'subject' => 'Pemahaman Bacaan & Menulis (PBM)',
                'subtest' => 'Kalimat Efektif & Tata Tulis',
                'question_type' => 'single_choice',
                'question_text' => '<p>Kalimat berikut yang merupakan <strong>kalimat efektif</strong> dan sesuai dengan kaidah EYD V adalah...</p>',
                'points' => 10,
                'duration_seconds' => 90,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Opsi C memenuhi syarat subjek-predikat yang utuh tanpa pleonasme dan menggunakan konjungsi intrakalimat secara presisi. Opsi lain mengalami kesalahan seperti subjek ganda, konjungsi bertumpuk, atau ejaan tidak baku.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Bagi para siswa-siswa yang akan mengikuti tryout diharapkan hadir tepat waktu.', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Meskipun soal ujian itu sangat rumit, namun ia tetap dapat menyelesaikannya.', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => 'Penelitian ini bertujuan untuk menganalisis pengaruh jam belajar terhadap skor UTBK siswa.', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => 'Di dalam rapat dewan guru tersebut memutuskan jadwal simulasi akbar.', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Siswa berprestasi itu mendapatkan beasiswa penuh daripada pihak yayasan sekolah.', 'is_correct' => false],
                ],
            ],

            // 5. PK - Pilihan Ganda Tunggal (Aljabar & Fungsi Kuadrat)
            [
                'exam_type_id' => $typePk?->id,
                'subject' => 'Pengetahuan Kuantitatif (PK)',
                'subtest' => 'Aljabar & Persamaan Kuadrat',
                'question_type' => 'single_choice',
                'question_text' => '<p>Jika x₁ dan x₂ adalah akar-akar dari persamaan kuadrat <strong>2x² - 6x + 3 = 0</strong>, maka nilai dari <strong>(x₁/x₂) + (x₂/x₁)</strong> adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>x₁ + x₂ = -b/a = -(-6)/2 = 3<br>x₁ · x₂ = c/a = 3/2<br>(x₁/x₂) + (x₂/x₁) = (x₁² + x₂²) / (x₁ · x₂)<br>x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂ = 3² - 2(3/2) = 9 - 3 = 6<br>Maka nilai = 6 / (3/2) = 6 · (2/3) = 4.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '2', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '3', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '4', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => '6', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '9', 'is_correct' => false],
                ],
            ],

            // 6. PK - Isian Singkat (Aritmetika & Eksponen)
            [
                'exam_type_id' => $typePk?->id,
                'subject' => 'Pengetahuan Kuantitatif (PK)',
                'subtest' => 'Eksponen & Manipulasi Aljabar',
                'question_type' => 'short_answer',
                'question_text' => '<p>Jika diketahui <strong>2^(x+1) + 2^(x+2) = 48</strong>, berapakah nilai dari <strong>2^(2x)</strong>?</p><p><em>Tuliskan jawaban akhir Anda dalam bentuk bilangan bulat positif tanpa spasi.</em></p>',
                'points' => 15,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>2^(x+1) + 2^(x+2) = 48<br>2 · 2^x + 4 · 2^x = 48<br>6 · 2^x = 48<br>2^x = 8<br>Karena 2^x = 8 = 2³, maka x = 3.<br>Nilai dari 2^(2x) = 2^(2 · 3) = 2^6 = <strong>64</strong>.</p>',
                'options' => [
                    ['option_key' => 'ANS', 'option_text' => '64', 'is_correct' => true],
                ],
            ],

            // 7. LBI - Pilihan Ganda Tunggal (Literasi Membaca Kritis)
            [
                'exam_type_id' => $typeLbi?->id,
                'subject' => 'Literasi Bahasa Indonesia',
                'subtest' => 'Analisis Wacana Ilmiah Populer',
                'question_type' => 'single_choice',
                'question_text' => '<p>Bacalah kutipan wacana berikut:</p><blockquote>"Transisi energi baru terbarukan di Indonesia menghadapi dilema pembiayaan infrastruktur awal dan ketergantungan historis terhadap batu bara. Meski demikian, potensi energi surya di daerah tropis seperti Jawa Timur dapat menghasilkan daya hingga 4,8 kWh/m² per hari jika didukung oleh insentif regulasi panel surya atap bagi sektor industri dan residensial."</blockquote><p>Simpulan yang paling relevan dengan isi bacaan di atas adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Teks menekankan bahwa hambatan pembiayaan dan batu bara dapat diimbangi dengan potensi energi surya tropis di Jawa Timur apabila didukung regulasi insentif yang memadai.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Indonesia sebaiknya sepenuhnya menutup tambang batu bara sebelum tahun depan', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Optimalisasi potensi energi surya di Jawa Timur membutuhkan dukungan insentif dan regulasi', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Biaya energi terbarukan di daerah tropis lebih mahal dibanding energi fosil konvensional', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Panel surya atap hanya dapat dipasang pada fasilitas milik instansi pemerintah', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Hambatan ketergantungan batu bara mustahil dipecahkan oleh sektor industri residensial', 'is_correct' => false],
                ],
            ],

            // 8. LBI - Pilihan Ganda Kompleks (Verifikasi Fakta & Opini Wacana)
            [
                'exam_type_id' => $typeLbi?->id,
                'subject' => 'Literasi Bahasa Indonesia',
                'subtest' => 'Evaluasi Argumen & Fakta Teks',
                'question_type' => 'multiple_choice',
                'question_text' => '<p>Berdasarkan wacana tentang transisi energi surya di Jawa Timur sebelumnya, tentukan <strong>SEMUA pernyataan yang SESUAI</strong> dengan informasi teks tersebut!</p>',
                'points' => 15,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Pernyataan A (Potensi daya surya mencapai 4,8 kWh/m² per hari) dan C (Terdapat tantangan berupa biaya awal infrastruktur dan ketergantungan batu bara) secara eksplisit disebutkan di dalam teks bacaan.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Potensi energi surya di daerah tropis Jawa Timur dapat mencapai hingga 4,8 kWh/m² per hari', 'is_correct' => true],
                    ['option_key' => 'B', 'option_text' => 'Pemerintah sudah melarang total penggunaan batu bara di wilayah Jawa Timur', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => 'Tantangan transisi meliputi pendanaan infrastruktur awal dan ketergantungan masa lalu pada batu bara', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => 'Sektor residensial dilarang menggunakan instalasi panel surya atap', 'is_correct' => false],
                ],
            ],

            // 9. LBE - Pilihan Ganda Tunggal (Literasi Bahasa Inggris: Main Idea)
            [
                'exam_type_id' => $typeLbe?->id,
                'subject' => 'Literasi Bahasa Inggris',
                'subtest' => 'Main Idea & Author Purpose',
                'question_type' => 'single_choice',
                'question_text' => '<p>Read the passage carefully:</p><blockquote>"Adaptive learning platforms utilize artificial intelligence algorithms to tailor educational content to individual students\' learning speeds. By diagnosing specific knowledge gaps in real-time, these systems provide targeted remedial exercises, thereby transforming traditional passive studying into an interactive, high-retention mastery experience."</blockquote><p>What is the primary topic of the passage?</p>',
                'points' => 10,
                'duration_seconds' => 90,
                'explanation_text' => '<p><strong>Explanation:</strong><br>The paragraph centers on how AI-driven adaptive learning systems identify students\' knowledge gaps and tailor educational materials to accelerate learning mastery.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'The complete replacement of high school teachers by AI robotics', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'How adaptive AI platforms enhance personalized learning outcomes', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'The financial cost of maintaining digital classroom servers', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Why traditional lectures remain superior to computer exercises', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Recent governmental bans on educational algorithms in schools', 'is_correct' => false],
                ],
            ],

            // 10. LBE - Pilihan Ganda Kompleks (Inference & Tone)
            [
                'exam_type_id' => $typeLbe?->id,
                'subject' => 'Literasi Bahasa Inggris',
                'subtest' => 'Contextual Vocabulary & Inferences',
                'question_type' => 'multiple_choice',
                'question_text' => '<p>Based on the English passage above, select <strong>ALL statements that can be logically inferred</strong>:</p>',
                'points' => 15,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Explanation:</strong><br>Option A (Students do not all learn at the identical pace) and Option D (Immediate diagnostic feedback helps bridge student learning deficiencies) are direct logical inferences from the passage.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Students inherently learn at different paces and possess varied comprehension rates', 'is_correct' => true],
                    ['option_key' => 'B', 'option_text' => 'Adaptive learning algorithms prevent students from ever making mistakes', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => 'Traditional lecture methods are strictly forbidden when using AI software', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Real-time diagnostic feedback can bridge understanding gaps effectively', 'is_correct' => true],
                ],
            ],

            // 11. PM - Pilihan Ganda Tunggal (Penalaran Matematika Geometri & Optimasi)
            [
                'exam_type_id' => $typePm?->id,
                'subject' => 'Penalaran Matematika (PM)',
                'subtest' => 'Geometri & Optimasi Kontekstual',
                'question_type' => 'single_choice',
                'question_text' => '<p>Sebuah aula serbaguna di SMAN 5 Surabaya berbentuk persegi panjang dengan keliling 80 meter. Panitia ingin memasang karpet di seluruh lantai aula tersebut. Berapakah luas lantai maksimum aula yang mungkin tercapai?</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Keliling = 2(p + l) = 80 &rArr; p + l = 40 meter.<br>Luas L(p) = p · l = p · (40 - p) = 40p - p².<br>Luas mencapai nilai maksimum ketika bentuk persegi (p = l = 20 meter), atau turunan L\'(p) = 40 - 2p = 0 &rArr; p = 20 meter.<br>Luas maksimum = 20 × 20 = <strong>400 m²</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '300 m²', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '360 m²', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '400 m²', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => '440 m²', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '800 m²', 'is_correct' => false],
                ],
            ],

            // 12. PM - Isian Singkat (Statistika & Interpretasi Data Rata-Rata)
            [
                'exam_type_id' => $typePm?->id,
                'subject' => 'Penalaran Matematika (PM)',
                'subtest' => 'Statistika Deskriptif & Pemodelan Data',
                'question_type' => 'short_answer',
                'question_text' => '<p>Nilai rata-rata tes Penalaran Matematika dari suatu kelompok yang terdiri dari 9 siswa SMA adalah 72. Jika seorang siswa baru bernama Fathur bergabung ke dalam kelompok tersebut, nilai rata-rata kelompok menjadi 74.</p><p>Berapakah nilai tes yang diperoleh Fathur?</p><p><em>Ketikkan jawaban berupa angka pasti tanpa tanda desimal/titik.</em></p>',
                'points' => 15,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Jumlah nilai 9 siswa = 9 × 72 = 648.<br>Setelah Fathur masuk, jumlah siswa = 10 dan rata-rata = 74.<br>Jumlah total nilai 10 siswa = 10 × 74 = 740.<br>Nilai Fathur = 740 - 648 = <strong>92</strong>.</p>',
                'options' => [
                    ['option_key' => 'ANS', 'option_text' => '92', 'is_correct' => true],
                ],
            ],
        ];

        // Attach questions to Main Exam (delete old questions to prevent duplicates on re-seeding)
        foreach ($examMain->questions as $oldQ) {
            $oldQ->options()->delete();
            $oldQ->delete();
        }
        $examMain->questions()->detach();

        foreach ($questionsData as $index => $qData) {
            $options = $qData['options'];
            unset($qData['options']);
            $qData['is_active'] = true;

            $question = Question::create($qData);

            foreach ($options as $opt) {
                $question->options()->create($opt);
            }

            $examMain->questions()->attach($question->id, ['sort_order' => $index + 1]);
        }
        $examMain->update(['total_questions' => count($questionsData)]);

        // 2. Paket Latihan Spesifik 1: Tryout Penalaran Matematika & Kuantitatif 2027
        $examPm = Exam::updateOrCreate(
            ['title' => 'Tryout Spesialis Penalaran Matematika (PM) 2027'],
            [
                'exam_type_id' => $typePm?->id,
                'title' => 'Tryout Spesialis Penalaran Matematika (PM) 2027',
                'description' => 'Latihan intensif pemodelan matematika, kalkulus dasar, dan interpretasi grafik persiapan SNBT 2027.',
                'duration_minutes' => 30,
                'total_questions' => 5,
                'passing_score' => 70,
                'is_active' => true,
            ]
        );

        $pmQuestions = [
            [
                'exam_type_id' => $typePm?->id,
                'subject' => 'Penalaran Matematika (PM)',
                'subtest' => 'Peluang & Kombinatorika',
                'question_type' => 'single_choice',
                'question_text' => '<p>Dari 7 siswa putra dan 5 siswa putri SMAN 1 Malang akan dibentuk tim delegasi olimpiade sains yang beranggotakan 3 orang. Banyaknya cara memilih delegasi yang beranggotakan <strong>tepat 2 putra dan 1 putri</strong> adalah...</p>',
                'points' => 20,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Pilih 2 putra dari 7: C(7,2) = 7! / (2! · 5!) = (7 × 6) / 2 = 21 cara.<br>Pilih 1 putri dari 5: C(5,1) = 5 cara.<br>Total kombinasi = 21 × 5 = <strong>105 cara</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '35', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '70', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '105', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => '210', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '220', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typePm?->id,
                'subject' => 'Penalaran Matematika (PM)',
                'subtest' => 'Aritmetika Sosial & Bunga Majemuk',
                'question_type' => 'short_answer',
                'question_text' => '<p>Seseorang menabung uang sebesar Rp 10.000.000,00 di bank dengan bunga tunggal 6% per tahun. Berapakah total bunga yang diperoleh setelah menabung selama <strong>3 tahun</strong> (dalam ribuan rupiah, ketikkan hanya angkanya saja tanpa titik, contoh jika Rp 1.800.000 maka ketik 1800)?</p>',
                'points' => 20,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Bunga per tahun = 6% × 10.000.000 = Rp 600.000.<br>Dalam 3 tahun = 3 × 600.000 = Rp 1.800.000. Dalam ribuan = 1800.</p>',
                'options' => [
                    ['option_key' => 'ANS', 'option_text' => '1800', 'is_correct' => true],
                ],
            ],
        ];

        // Delete old questions to prevent duplicates on re-seeding
        foreach ($examPm->questions as $oldQ) {
            $oldQ->options()->delete();
            $oldQ->delete();
        }
        $examPm->questions()->detach();

        foreach ($pmQuestions as $index => $qData) {
            $options = $qData['options'];
            unset($qData['options']);
            $qData['is_active'] = true;
            $question = Question::create($qData);
            foreach ($options as $opt) {
                $question->options()->create($opt);
            }
            $examPm->questions()->attach($question->id, ['sort_order' => $index + 1]);
        }
        $examPm->update(['total_questions' => count($pmQuestions)]);

        // 3. Ujian Masuk Informatika: Tes Potensi Akademik UIM Pamekasan
        $typeTpaIf = ExamType::where('code', 'tpa-if')->first();
        $examTpaIf = Exam::updateOrCreate(
            ['title' => 'Tes Potensi Akademik (TPA) Masuk Jurusan Informatika - UIM Pamekasan'],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'title' => 'Tes Potensi Akademik (TPA) Masuk Jurusan Informatika - UIM Pamekasan',
                'description' => 'Ujian seleksi masuk Jurusan Informatika Universitas Islam Madura Pamekasan. Menguji logika proposisi, sistem bilangan, algoritma, dan penalaran analitik.',
                'duration_minutes' => 60,
                'total_questions' => 12,
                'passing_score' => 65,
                'is_active' => true,
            ]
        );

        $tpaIfQuestions = [
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Logika Proposisi',
                'subtest' => 'Modus Ponens & Modus Tollens',
                'question_type' => 'single_choice',
                'question_text' => '<p>Diberikan premis:</p><p>Jika sebuah bilangan habis dibagi 4, maka bilangan tersebut adalah bilangan genap.</p><p>Angka 28 habis dibagi 4.</p><p>Kesimpulan yang sah berdasarkan modus ponens adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Modus ponens: Jika P maka Q. P benar. Maka Q benar.<br>P = habis dibagi 4, Q = bilangan genap.<br>Karena 28 habis dibagi 4, maka 28 adalah bilangan genap.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '28 adalah bilangan ganjil', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '28 adalah bilangan genap', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Semua bilangan genap habis dibagi 4', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => '28 tidak habis dibagi 4', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Bilangan yang tidak habis dibagi 4 adalah ganjil', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Logika Proposisi',
                'subtest' => 'Silogisme & Kontrapositif',
                'question_type' => 'single_choice',
                'question_text' => '<p>Semua programmer yang mahir algoritma lulus ujian TPA dengan nilai tinggi. Andi tidak lulus ujian TPA dengan nilai tinggi.</p><p>Kesimpulan yang paling tepat adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Premis: Mahir algoritma → Nilai tinggi. Andi tidak bernilai tinggi.<br>Kontrapositif: Tidak nilai tinggi → Tidak mahir algoritma.<br>Jadi Andi bukan programmer yang mahir algoritma.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Andi adalah programmer yang mahir algoritma', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Andi bukan programmer yang mahir algoritma', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Semua programmer mahir algoritma', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Andi lulus ujian TPA', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Tidak ada programmer yang mahir algoritma', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Sistem Bilangan',
                'subtest' => 'Konversi Biner ke Desimal',
                'question_type' => 'single_choice',
                'question_text' => '<p>Berapakah nilai desimal dari bilangan biner <strong>101101</strong>?</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>101101₂ = 1×2⁵ + 0×2⁴ + 1×2³ + 1×2² + 0×2¹ + 1×2⁰<br>= 32 + 0 + 8 + 4 + 0 + 1 = <strong>45</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '43', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '45', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => '47', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => '53', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '55', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Sistem Bilangan',
                'subtest' => 'Konversi Heksadesimal ke Desimal',
                'question_type' => 'single_choice',
                'question_text' => '<p>Berapakah nilai desimal dari bilangan heksadesimal <strong>1F3</strong>?</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>1F3₁₆ = 1×16² + 15×16¹ + 3×16⁰<br>= 256 + 240 + 3 = <strong>499</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '483', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '499', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => '513', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => '529', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '547', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Sistem Bilangan',
                'subtest' => 'Operasi Bitwise',
                'question_type' => 'single_choice',
                'question_text' => '<p>Jika A = 12 (1100₂) dan B = 10 (1010₂), berapakah hasil dari operasi <strong>A AND B</strong>?</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>1100 AND 1010 = 1000₂ = <strong>8</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '8', 'is_correct' => true],
                    ['option_key' => 'B', 'option_text' => '10', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '12', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => '14', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '15', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Sistem Bilangan',
                'subtest' => 'Operasi Bitwise XOR',
                'question_type' => 'single_choice',
                'question_text' => '<p>Berapakah hasil dari operasi <strong>13 XOR 7</strong>?</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>13 = 1101₂, 7 = 0111₂<br>1101 XOR 0111 = 1010₂ = <strong>10</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '6', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '8', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '10', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => '12', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '14', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Algoritma & Pseudocode',
                'subtest' => 'Trace Loop & Akumulator',
                'question_type' => 'single_choice',
                'question_text' => '<p>Perhatikan pseudocode berikut:</p><pre>sum = 0\nfor i = 1 to 5 do\n    sum = sum + i\nend for\nprint sum</pre><p>Output yang dihasilkan adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Loop menjumlahkan 1+2+3+4+5 = <strong>15</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '10', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '12', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '15', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => '20', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '25', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Algoritma & Pseudocode',
                'subtest' => 'Trace Nested Loop',
                'question_type' => 'single_choice',
                'question_text' => '<p>Perhatikan pseudocode berikut:</p><pre>count = 0\nfor i = 1 to 3 do\n    for j = 1 to 2 do\n        count = count + 1\n    end for\nend for\nprint count</pre><p>Output yang dihasilkan adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Nested loop: 3 × 2 = <strong>6</strong> iterasi.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '3', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '5', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '6', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => '8', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '9', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Algoritma & Pseudocode',
                'subtest' => 'Trace Recursive Function',
                'question_type' => 'single_choice',
                'question_text' => '<p>Perhatikan fungsi rekursif berikut:</p><pre>function f(n):\n    if n <= 1 then return 1\n    return n * f(n-1)\nprint f(5)</pre><p>Output yang dihasilkan adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>f(5) = 5 × 4 × 3 × 2 × 1 = <strong>120</strong> (faktorial).</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '24', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '60', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '100', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => '120', 'is_correct' => true],
                    ['option_key' => 'E', 'option_text' => '720', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Algoritma & Pseudocode',
                'subtest' => 'Trace Conditional Logic',
                'question_type' => 'single_choice',
                'question_text' => '<p>Perhatikan pseudocode berikut:</p><pre>x = 7\nif x > 5 then\n    print "A"\nelse if x > 3 then\n    print "B"\nelse\n    print "C"\nend if</pre><p>Output yang dihasilkan adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>x = 7 > 5, maka kondisi pertama terpenuhi dan output adalah <strong>"A"</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'A', 'is_correct' => true],
                    ['option_key' => 'B', 'option_text' => 'B', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => 'C', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'A dan B', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Tidak ada output', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Penalaran Analitik',
                'subtest' => 'Analisis Pola Deret',
                'question_type' => 'single_choice',
                'question_text' => '<p>Perhatikan deret berikut: 2, 6, 12, 20, 30, ...</p><p>Angka berikutnya dalam deret tersebut adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Selisih: 4, 6, 8, 10, ... (selisih bertambah 2).<br>Selisih berikutnya = 12, jadi 30 + 12 = <strong>42</strong>.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => '36', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => '40', 'is_correct' => false],
                    ['option_key' => 'C', 'option_text' => '42', 'is_correct' => true],
                    ['option_key' => 'D', 'option_text' => '44', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => '48', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Penalaran Analitik',
                'subtest' => 'Analisis Hubungan Sebab Akibat',
                'question_type' => 'single_choice',
                'question_text' => '<p>Jika semua server di laboratorium informatika mati, maka semua komputer tidak dapat mengakses internet. Beberapa komputer di laboratorium informatika dapat mengakses internet.</p><p>Kesimpulan yang pasti benar adalah...</p>',
                'points' => 10,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>Premis: Server mati → Tidak ada internet.<br>Beberapa komputer ada internet → Server tidak semua mati.</p>',
                'options' => [
                    ['option_key' => 'A', 'option_text' => 'Semua server di laboratorium informatika mati', 'is_correct' => false],
                    ['option_key' => 'B', 'option_text' => 'Tidak semua server di laboratorium informatika mati', 'is_correct' => true],
                    ['option_key' => 'C', 'option_text' => 'Semua komputer tidak dapat mengakses internet', 'is_correct' => false],
                    ['option_key' => 'D', 'option_text' => 'Server tidak berpengaruh pada akses internet', 'is_correct' => false],
                    ['option_key' => 'E', 'option_text' => 'Komputer yang tidak mengakses internet adalah yang rusak', 'is_correct' => false],
                ],
            ],
            [
                'exam_type_id' => $typeTpaIf?->id,
                'subject' => 'Penalaran Analitik',
                'subtest' => 'Isian Singkat - Konversi Biner',
                'question_type' => 'short_answer',
                'question_text' => '<p>Ubahlah bilangan desimal <strong>25</strong> ke dalam bilangan biner.</p><p><em>Tuliskan jawaban Anda dalam bentuk bilangan biner tanpa spasi (contoh: 1010).</em></p>',
                'points' => 15,
                'duration_seconds' => 120,
                'explanation_text' => '<p><strong>Pembahasan:</strong><br>25 ÷ 2 = 12 sisa 1<br>12 ÷ 2 = 6 sisa 0<br>6 ÷ 2 = 3 sisa 0<br>3 ÷ 2 = 1 sisa 1<br>1 ÷ 2 = 0 sisa 1<br>Dibaca dari bawah: <strong>11001</strong>.</p>',
                'options' => [
                    ['option_key' => 'ANS', 'option_text' => '11001', 'is_correct' => true],
                ],
            ],
        ];

        // Delete old questions to prevent duplicates on re-seeding
        foreach ($examTpaIf->questions as $oldQ) {
            $oldQ->options()->delete();
            $oldQ->delete();
        }
        $examTpaIf->questions()->detach();

        foreach ($tpaIfQuestions as $index => $qData) {
            $options = $qData['options'];
            unset($qData['options']);
            $qData['is_active'] = true;
            $question = Question::create($qData);
            foreach ($options as $opt) {
                $question->options()->create($opt);
            }
            $examTpaIf->questions()->attach($question->id, ['sort_order' => $index + 1]);
        }
        $examTpaIf->update(['total_questions' => count($tpaIfQuestions)]);
    }
}
