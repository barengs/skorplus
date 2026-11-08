import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AdminGuidePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  const guideCategories = [
    { id: 'all', label: 'Semua Panduan', icon: 'fa-layer-group' },
    { id: 'ml', label: 'Machine Learning (BKT & IRT)', icon: 'fa-brain' },
    { id: 'monitoring', label: 'Pemantauan & Intervensi Siswa', icon: 'fa-user-graduate' },
    { id: 'reports', label: 'Laporan & Analitik', icon: 'fa-chart-pie' },
    { id: 'schools', label: 'Kelola Sekolah Mitra', icon: 'fa-school' },
    { id: 'cbt', label: 'Ujian & Soal (CBT)', icon: 'fa-list-check' },
    { id: 'elearning', label: 'E-Learning & Kursus', icon: 'fa-book-open-reader' },
    { id: 'users', label: 'Kelola Pengguna', icon: 'fa-users' },
    { id: 'packages', label: 'Program & Paket', icon: 'fa-cubes' },
    { id: 'landing', label: 'Landing Page & Testimoni', icon: 'fa-palette' },
    { id: 'forum', label: 'Forum Tanya Jawab', icon: 'fa-comments' },
    { id: 'roles', label: 'Role, Akses & Menu', icon: 'fa-user-shield' },
    { id: 'settings', label: 'Pengaturan & Audit', icon: 'fa-gear' },
  ];

  const guides = [
    {
      id: 'ml',
      category: 'ml',
      title: 'Analisis Machine Learning: Tingkat Penguasaan & Kemampuan Siswa',
      description: 'Panduan teknis operasional pemodelan kecerdasan buatan probabilistik Bayesian Knowledge Tracing (BKT) untuk materi belajar dan Item Response Theory (IRT Rasch Model) untuk evaluasi simulasi CBT UTBK.',
      route: '/admin/reports',
      badge: 'AI & Machine Learning Engine',
      steps: [
        {
          action: 'Konsep & Cara Kerja Bayesian Knowledge Tracing (BKT)',
          tag: 'Metode BKT',
          tagColor: 'emerald',
          icon: 'fa-microchip',
          items: [
            'BKT adalah model Hidden Markov Model (HMM) probabilistik yang memantau tingkat penguasaan konsep belajar siswa secara berkelanjutan.',
            'Model menggunakan 4 parameter utama: Pengetahuan Awal P(L0), Peluang Transisi Belajar P(T), Peluang Keliru/Slip P(S), dan Peluang Menebak P(G).',
            'Tiap kali siswa menyelesaikan kuis atau materi, probabilitas penguasaan P(Lt) otomatis diperbarui secara dinamis tanpa perlu proses training ulang yang lambat.',
            'Ambang batas penguasaan materi (Mastery Threshold) ditetapkan pada 80% untuk menyatakan siswa telah tuntas menguasai konsep dasar.',
            'Kategori Penguasaan BKT: Mastered (≥ 80%), Kompeten (60% - 79%), Berkembang (40% - 59%), dan Remedial Alert (< 40%).'
          ]
        },
        {
          action: 'Peringatan Dini Topik Remedial (Remedial Early Warning Alert)',
          tag: 'Early Warning',
          tagColor: 'amber',
          icon: 'fa-triangle-exclamation',
          items: [
            'Sistem secara otomatis mengagregasi data penguasaan seluruh siswa dan mendeteksi topik/bab yang memiliki tingkat kelulusan terendah.',
            'Daftar "Remedial Alert" muncul langsung pada panel analitik admin untuk materi dengan mastery terendah.',
            'Admin dan tutor dapat segera menyusun modul pengayaan atau mengadakan sesi pemantapan materi untuk topik-topik kritis tersebut.'
          ]
        },
        {
          action: 'Konsep & Cara Kerja Item Response Theory (IRT Rasch Model)',
          tag: 'Metode IRT',
          tagColor: 'blue',
          icon: 'fa-chart-line',
          items: [
            'Berbeda dengan penilaian persentase konvensional (CBT klasik), IRT Rasch Model memperhitungkan tingkat kesulitan butir soal (Beta) dan estimasi kemampuan laten siswa (Theta).',
            'Siswa yang mampu menjawab benar butir soal berbobot sulit akan memperoleh skor kemampuan (Theta) yang jauh lebih tinggi dibandingkan hanya menjawab soal mudah.',
            'Nilai Theta siswa dikonversikan secara matematis ke estimasi skor UTBK SNBT skala riil (200 - 1000 poin) dengan rata-rata nasional 500 dan standar deviasi 100.',
            'Model ini mengeliminasi distorsi penilaian keberuntungan dan memberikan prediksi peluang kelulusan PTN yang jauh lebih akurat.'
          ]
        },
        {
          action: 'Distribusi Kemampuan Siswa (Skala UTBK SNBT)',
          tag: 'Tingkat Kesiapan',
          tagColor: 'indigo',
          icon: 'fa-ranking-star',
          items: [
            'Sangat Siap / Top PTN (≥ 700 pts): Siswa memiliki daya saing tinggi untuk lolos program studi favorit di PTN peringkat teratas (UI, ITB, UGM, Unair, ITS).',
            'Tinggi / Kompetitif (600 - 699 pts): Siswa memiliki kesiapan matang untuk mayoritas program studi pilihan pertama di PTN.',
            'Rata-rata Nasional (500 - 599 pts): Siswa berada pada batas aman passing grade umum, butuh penguatan strategi pengerjaan soal HOTS.',
            'Perlu Bimbingan Tambahan (< 500 pts): Siswa memerlukan intervensi bimbingan intensif dan pembenahan pemahaman konsep dasar.'
          ]
        }
      ]
    },
    {
      id: 'monitoring',
      category: 'monitoring',
      title: 'Pemantauan Siswa & Rekomendasi Tindak Lanjut Belajar',
      description: 'Panduan pelacakan kemajuan belajar tiap siswa di sekolah mitra, pengelompokan status kesiapan, pemberian rekomendasi tindak lanjut, intervensi via WhatsApp, serta penerbitan rapor akademik siswa.',
      route: '/admin/reports',
      badge: 'Monitoring & Intervensi',
      steps: [
        {
          action: 'Mengakses Tab Pemantauan Siswa Lintas Sekolah',
          tag: 'Navigasi',
          tagColor: 'blue',
          icon: 'fa-user-graduate',
          items: [
            'Buka menu Sistem > Laporan & Statistik di sidebar navigasi kiri.',
            'Klik tab kedua: "Pemantauan Siswa" (dilengkapi badge jumlah siswa aktif yang dimonitor).',
            'Halaman ini menggabungkan panel metrik Machine Learning (IRT & BKT) di atas dan tabel rekapitulasi individual siswa di bawah.'
          ]
        },
        {
          action: 'Filter Sekolah Mitra, Pencarian Siswa & Filter Status Kesiapan',
          tag: 'Filter & Pencarian',
          tagColor: 'purple',
          icon: 'fa-filter',
          items: [
            'Filter Sekolah: Gunakan dropdown sekolah mitra untuk memfokuskan pemantauan pada siswa dari sekolah tertentu, atau pilih "Semua Sekolah Mitra".',
            'Pencarian Instan: Masukkan nama siswa, alamat email, atau NISN pada kolom pencarian lalu klik tombol "Cari".',
            'Filter Status Kesiapan: Klik tombol pill status untuk memfilter:',
            '• Semua Siswa: Melihat seluruh peserta didik terdaftar.',
            '• 🚨 Butuh Pendampingan: Siswa berisiko tinggi (skor CBT < 55 atau BKT < 50%) yang memerlukan bimbingan remedial segera.',
            '• ⚠️ Butuh Penguatan: Siswa yang tuntas materi dasar namun memerlukan pendalaman pada subtes tertentu.',
            '• 🏆 Rekomendasi Lanjut: Siswa berprestasi tinggi (prediksi UTBK ≥ 680) yang direkomendasikan latihan soal tingkat lanjut.',
            '• Kompetitif: Siswa dengan performa stabil pada rata-rata nasional.'
          ]
        },
        {
          action: 'Intervensi Personal Langsung via WhatsApp',
          tag: 'Kontak WhatsApp',
          tagColor: 'emerald',
          icon: 'fa-brands fa-whatsapp',
          items: [
            'Pada kolom Aksi di baris siswa terkait, klik tombol WhatsApp berwarna hijau.',
            'Sistem secara otomatis menyusun teks pesan intervensi yang sopan dan terpersonalisasi, mencantumkan nama siswa, hasil evaluasi, dan rekomendasi langkah belajar.',
            'Admin atau guru BK sekolah dapat langsung mengirimkannya ke nomor WhatsApp siswa atau orang tua tanpa perlu mengetik manual.'
          ]
        },
        {
          action: 'Melihat & Mencetak Rapor Akademik Siswa (Modal Interaktif)',
          tag: 'Rapor Siswa',
          tagColor: 'indigo',
          icon: 'fa-id-card',
          items: [
            'Klik tombol "Rapor" pada baris siswa di tabel.',
            'Modal Rapor Akademik Siswa akan terbuka, memuat:',
            '1. Identitas Lengkap: Nama, NISN, Kelas, Program Bimbel, Sekolah Asal, dan Predikat Kelulusan.',
            '2. Ringkasan KPI Siswa: Rata-rata Skor CBT, Prediksi UTBK IRT, Penguasaan BKT, Kelulusan CBT, dan Progres Kursus.',
            '3. Diagnosis AI Machine Learning: Analisis subtes terlemah pada IRT dan topik yang butuh pendalaman pada BKT.',
            '4. Riwayat Ujian CBT: Daftar seluruh simulasi tryout yang pernah dikerjakan siswa beserta skor dan status kelulusan.',
            '5. Riwayat Kursus E-Learning: Modul pelajaran yang sedang diikuti dan persentase penyelesaian materi.',
            'Klik tombol "Cetak Rapor PDF" di pojok kanan atas modal untuk mengunduh dokumen resmi rapor akademik siswa.'
          ]
        },
        {
          action: 'Melihat & Mencetak Evaluasi Detail Pengerjaan Soal Ujian',
          tag: 'Evaluasi Soal',
          tagColor: 'amber',
          icon: 'fa-file-lines',
          items: [
            'Di dalam modal rapor siswa pada tabel Riwayat Ujian CBT, klik tombol "Detail" pada ujian yang ingin diperiksa.',
            'Sistem akan menampilkan rekapitulasi lembar pengerjaan: jumlah soal benar, salah, dan kosong, serta daftar seluruh butir soal.',
            'Tiap butir soal menampilkan pilihan jawaban siswa, kunci jawaban resmi, dan pembahasan komprehensif.',
            'Klik tombol "Cetak PDF" pada modal detail untuk mencetak lembar evaluasi pengerjaan soal siswa.'
          ]
        },
        {
          action: 'Ekspor Data Rekapitulasi Pemantauan ke File CSV / Excel',
          tag: 'Ekspor CSV',
          tagColor: 'emerald',
          icon: 'fa-file-arrow-down',
          items: [
            'Di pojok kanan atas tabel pemantauan siswa, klik tombol "Ekspor CSV".',
            'File spreadsheet berisi nama siswa, NISN, sekolah, estimasi skor UTBK IRT, penguasaan BKT, status kesiapan, dan rencana tindak lanjut akan terunduh otomatis.',
            'Berkas ini siap dicetak atau digunakan dalam rapat koordinasi berkala bersama pihak sekolah mitra.'
          ]
        }
      ]
    },
    {
      id: 'reports',
      category: 'reports',
      title: 'Laporan Analitik Komprehensif & Dokumen Cetak PDF Resmi',
      description: 'Panduan membaca dashboard evaluasi mitra sekolah, analitik Computer-Based Testing (CBT), efektivitas materi e-learning, serta mencetak dokumen resmi Laporan Analitik Komprehensif (PDF Master 5 Bab).',
      route: '/admin/reports',
      badge: 'Laporan & Eksekutif',
      steps: [
        {
          action: 'Membaca Ringkasan Eksekutif & KPI Dashboard',
          tag: 'Dashboard KPI',
          tagColor: 'blue',
          icon: 'fa-chart-pie',
          items: [
            'Buka menu Sistem > Laporan & Statistik tab "Ringkasan".',
            'Pantau 4 kartu KPI utama: Jumlah Mitra Sekolah Terdaftar, Total Siswa Sekolah, Penyelesaian Sesi CBT, dan Rata-rata Progres Belajar.',
            'Pantau kartu "Sekolah dengan Kinerja Terbaik" untuk melihat peringkat mitra sekolah berdasarkan capaian rata-rata nilai CBT siswa.',
            'Pantau kartu "Analisis Tantangan CBT" untuk mengetahui paket ujian dengan tingkat kesulitan tertinggi yang membutuhkan pendampingan ekstra.'
          ]
        },
        {
          action: 'Mencetak Laporan Analitik Komprehensif (PDF Master 5 Bab)',
          tag: 'Cetak Laporan Lengkap',
          tagColor: 'rose',
          icon: 'fa-file-pdf',
          items: [
            'Klik tombol "Cetak Laporan Lengkap" di bagian header atas halaman laporan.',
            'Sistem otomatis membuat dokumen cetak berstandar resmi A4 dengan kop surat resmi SkorPluss Learning Center.',
            'Dokumen terdiri dari 5 Bab Analitik Terpadu:',
            '• Bab I: Ringkasan Eksekutif & Key Performance Indicators (KPI).',
            '• Bab II: Pemantauan Siswa & Rekomendasi Tindak Lanjut Belajar (Analisis Machine Learning IRT & BKT lengkap dengan tabel rekapitulasi siswa).',
            '• Bab III: Evaluasi Kinerja Mitra Sekolah (peringkat sekolah, jumlah siswa aktif, sesi CBT, dan rata-rata skor).',
            '• Bab IV: Analisis Computer-Based Testing & Distribusi Skor (sebaran rentang nilai, proporsi kelulusan, dan tingkat kesulitan paket soal).',
            '• Bab V: Analisis Kurikulum & Efektivitas E-Learning (kursus terpopuler, sebaran jenis lesson, dan progres belajar).',
            'Dokumen ditutup dengan lembar tanda tangan pengesahan pimpinan akademik resmi.'
          ]
        },
        {
          action: 'Mencetak Dokumen Laporan Spesifik per Bagian / Tab',
          tag: 'Cetak Parsial',
          tagColor: 'purple',
          icon: 'fa-print',
          items: [
            'Tombol kedua di header adalah tombol cetak kontekstual yang otomatis menyesuaikan tab yang sedang Anda buka:',
            '• Pada Tab Ringkasan: Mencetak Ringkasan Eksekutif & KPI.',
            '• Pada Tab Pemantauan Siswa: Mencetak Laporan Pembelajaran & Rekomendasi Tindak Lanjut Siswa.',
            '• Pada Tab Analitik Sekolah: Mencetak Evaluasi Kinerja Sekolah Mitra.',
            '• Pada Tab Analitik CBT: Mencetak Laporan Lengkap Distribusi Skor dan Soal CBT.',
            '• Pada Tab Analitik Materi: Mencetak Laporan Kurikulum & Silabus E-Learning.'
          ]
        },
        {
          action: 'Drill-Down Detail Siswa per Sekolah Mitra',
          tag: 'Drill-Down Sekolah',
          tagColor: 'indigo',
          icon: 'fa-school',
          items: [
            'Di tab "Analitik Sekolah", klik baris salah satu nama sekolah mitra pada tabel.',
            'Halaman khusus sekolah tersebut akan terbuka, menampilkan seluruh siswa dari sekolah bersangkutan, riwayat tryout CBT, dan aktivitas belajar terakhir.',
            'Tersedia tombol "Cetak PDF" khusus sekolah tersebut dan tombol "Ekspor CSV" data siswa mitra.'
          ]
        },
        {
          action: 'Riwayat Detail & Audit Log Pembelajaran Siswa',
          tag: 'Riwayat & Detail',
          tagColor: 'amber',
          icon: 'fa-clock-rotate-left',
          items: [
            'Buka tab "Riwayat & Detail (Logs)".',
            'Pantau rekapitulasi data pengerjaan e-learning per siswa dengan filter status pembelajaran (sedang belajar atau selesai 100%).',
            'Pantau riwayat pengerjaan ujian CBT per individu lengkap dengan skor, KKM kelulusan, dan waktu submit.',
            'Kedua tabel riwayat ini dapat diekspor ke file CSV secara mandiri.'
          ]
        }
      ]
    },
    {
      id: 'schools',
      category: 'schools',
      title: 'Manajemen Sekolah Mitra',
      description: 'Panduan lengkap pengelolaan data instansi/sekolah mitra bimbel SkorPluss, penambahan kuota siswa, upload profil, serta approval perpanjangan masa aktif kontrak.',
      route: '/admin/schools',
      badge: 'Sekolah & Kemitraan',
      steps: [
        {
          action: 'Tambah Sekolah Baru',
          tag: 'Tambah',
          tagColor: 'emerald',
          icon: 'fa-plus',
          items: [
            'Buka menu Sistem > Kelola Sekolah di sidebar kiri.',
            'Klik tombol "+ Tambah Sekolah" di pojok kanan atas tabel.',
            'Isi data wajib: Nama Lengkap Sekolah (contoh: SMAN 5 Surabaya), Jenjang Pendidikan (SMA/SMK/MA), Alamat Lengkap, Kota/Kabupaten, Provinsi, No. Telepon, dan Email Resmi Sekolah.',
            'Tentukan PIC / Penanggung Jawab dari pihak sekolah berserta kontak WhatsApp yang valid.',
            'Tentukan Kuota Siswa awal (misal: 100 siswa) dan Tanggal Berakhir Kontrak Kerjasama.',
            'Klik tombol "Simpan Sekolah". Sistem otomatis mencatat log penambahan data.'
          ]
        },
        {
          action: 'Upload Foto Gedung & Logo Sekolah',
          tag: 'Upload',
          tagColor: 'purple',
          icon: 'fa-image',
          items: [
            'Pada halaman Detail Sekolah atau saat Form Edit dibuka, temukan bagian "Foto / Logo Sekolah".',
            'Pilih berkas gambar (format didukung: JPG, PNG, WEBP). Disarankan rasio 1:1 untuk logo dan rasio 16:9 untuk foto tampak depan gedung sekolah.',
            'Sistem dilengkapi fitur kompresi otomatis di sisi browser (klien). Gambar besar akan diperkecil ukurannya sebelum dikirim ke server untuk menghindari error batas file.',
            'Tunggu hingga preview foto muncul sempurna, lalu klik "Simpan Perubahan".'
          ]
        },
        {
          action: 'Edit Data & Kuota Sekolah',
          tag: 'Edit',
          tagColor: 'blue',
          icon: 'fa-pen-to-square',
          items: [
            'Cari nama sekolah pada kolom pencarian tabel Sekolah.',
            'Klik tombol ikon "Edit" (ikon pensil) pada kolom Aksi.',
            'Ubah informasi yang diperlukan seperti Nama Kontak PIC, No. Telepon, atau Kuota Maksimal Siswa.',
            'Klik "Perbarui Data" untuk menyimpan perubahan secara permanen.'
          ]
        },
        {
          action: 'Aktivasi, Penonaktifan & Approval Perpanjangan Kontrak',
          tag: 'Aktivasi & Approval',
          tagColor: 'amber',
          icon: 'fa-toggle-on',
          items: [
            'Aktivasi Status: Di kolom Status tabel sekolah, Anda dapat mengubah status sekolah menjadi "Aktif" atau "Nonaktif". Sekolah yang nonaktif akan membatasi login siswa yang terdaftar di bawah sekolah tersebut.',
            'Approval Perpanjangan Kontrak: Jika masa kontrak sekolah mendekati kedaluwarsa, buka tab "Riwayat Kontrak / Renewal" di halaman Detail Sekolah.',
            'Klik tombol "Setujui / Perpanjang Kontrak", masukkan durasi perpanjangan baru (misal: +12 Bulan), dan konfirmasi persetujuan (Approval).',
            'Siswa dari sekolah tersebut akan kembali memiliki hak akses aktif hingga tanggal jatuh tempo yang baru.'
          ]
        },
        {
          action: 'Hapus Sekolah Mitra',
          tag: 'Hapus',
          tagColor: 'rose',
          icon: 'fa-trash-can',
          items: [
            'Klik tombol ikon "Hapus" pada baris sekolah yang ingin dihapus.',
            'PERHATIAN: Pastikan sekolah tersebut tidak memiliki data siswa aktif atau riwayat ujian penting.',
            'Ketik konfirmasi atau klik "Ya, Hapus Sekolah" pada modal dialog konfirmasi.'
          ]
        }
      ]
    },
    {
      id: 'cbt',
      category: 'cbt',
      title: 'Kelola Ujian & Bank Soal CBT (SNBT 2027)',
      description: 'Pembuatan simulasi tryout online, konfigurasi subtes SNBT, durasi pengerjaan, passing grade, serta manajemen soal pilihan ganda tunggal, pilihan majemuk (kompleks), dan isian singkat.',
      route: '/admin/cbt',
      badge: 'Evaluasi & Ujian',
      steps: [
        {
          action: 'Membuat Ujian Tryout Baru',
          tag: 'Tambah Ujian',
          tagColor: 'emerald',
          icon: 'fa-file-circle-plus',
          items: [
            'Buka menu Sistem > Kelola Ujian & Soal.',
            'Klik "+ Tambah Ujian Baru".',
            'Isi Judul Ujian (misal: "Tryout Akbar SNBT 2027 - Subtes Penalaran Matematika").',
            'Pilih Tipe Ujian / Subtes SNBT: Penalaran Matematika, Penalaran Umum, Literasi Bahasa Indonesia, Literasi Bahasa Inggris, Pemahaman Bacaan & Menulis, Kemampuan Memahami Bacaan Umum, atau Pengetahuan Kuantitatif.',
            'Tentukan Durasi Pengerjaan (dalam menit, misal: 30 menit).',
            'Tentukan Skor Minimum Kelulusan (Passing Score) dan Maksimal Percobaan per siswa.',
            'Klik "Simpan Data Ujian".'
          ]
        },
        {
          action: 'Mengisi Butir Soal (Pilihan Tunggal, Majemuk, & Isian)',
          tag: 'Tambah Soal',
          tagColor: 'emerald',
          icon: 'fa-list-ol',
          items: [
            'Klik tombol "Kelola Soal" pada ujian yang baru saja dibuat.',
            'Klik "+ Tambah Soal".',
            'Pilih Tipe Soal yang sesuai dengan format SNBT terkini:',
            '1. Pilihan Ganda Biasa (Single Choice): Siswa memilih 1 dari 5 pilihan (A, B, C, D, E). Tandai 1 jawaban yang benar.',
            '2. Pilihan Ganda Kompleks (Multiple Choice): Siswa dapat memilih lebih dari satu pernyataan yang benar. Tandai semua pilihan yang valid.',
            '3. Isian Singkat (Short Answer): Siswa mengetikkan angka atau kata jawaban pasti (contoh: 42 atau 1500). Masukkan kunci jawaban eksak pada kolom kunci.',
            'Isi Pembahasan Lengkap agar siswa dapat melakukan evaluasi mandiri setelah hasil ujian keluar.'
          ]
        },
        {
          action: 'Upload Gambar Soal, Grafik, & Rumus',
          tag: 'Upload Gambar',
          tagColor: 'purple',
          icon: 'fa-file-image',
          items: [
            'Jika soal memuat stimulus bacaan tabel, diagram batang, grafik fungsi, atau geometri, klik tombol "Upload Gambar Stimulus".',
            'Pilih gambar grafik/rumus dari komputer Anda.',
            'Gambar akan otomatis teroptimasi dan tampil di sisi stimulus soal di layar ujian siswa.',
            'Pastikan gambar kontras dan terbaca jelas pada mode terang (light mode) maupun gelap (dark mode).'
          ]
        },
        {
          action: 'Aktivasi Jadwal Ujian & Publikasi',
          tag: 'Aktivasi',
          tagColor: 'amber',
          icon: 'fa-calendar-check',
          items: [
            'Ubah status ujian menjadi "Aktif / Terbuka".',
            'Ujian yang aktif akan muncul di dashboard ujian siswa (/cbt). Siswa yang memiliki kuota tryout dapat langsung memulai pengerjaan.',
            'Jika periode tryout serentak telah usai, ubah status menjadi "Selesai / Ditutup" agar tidak ada siswa yang memulai sesi susulan tanpa izin.'
          ]
        },
        {
          action: 'Edit & Hapus Butir Soal',
          tag: 'Edit & Hapus',
          tagColor: 'rose',
          icon: 'fa-file-pen',
          items: [
            'Anda dapat mengedit redaksi soal, opsi pilihan, bobot nilai, atau pembahasan kapan saja.',
            'Klik tombol tempat sampah untuk menghapus butir soal yang keliru.'
          ]
        }
      ]
    },
    {
      id: 'elearning',
      category: 'elearning',
      title: 'Kelola E-Learning, Modul & Materi',
      description: 'Penyusunan kurikulum materi pelajaran SMA, pembuatan bab/modul pembelajaran, penambahan materi artikel, video YouTube, file PDF rangkuman, kuis bab, dan tugas siswa.',
      route: '/admin/elearning',
      badge: 'Kurikulum & Materi',
      steps: [
        {
          action: 'Membuat Kursus / Mata Pelajaran Baru',
          tag: 'Tambah Kursus',
          tagColor: 'emerald',
          icon: 'fa-graduation-cap',
          items: [
            'Buka menu Sistem > Kelola E-Learning.',
            'Klik "+ Tambah Kursus Baru".',
            'Masukkan Judul Kursus (contoh: "Mastering Penalaran Matematika SNBT"), Kategori Pelajaran, dan Deskripsi Silabus.',
            'Tentukan Tingkat Kesulitan (Dasar, Menengah, Lanjutan) dan Estimasi Total Jam Belajar.',
            'Pilih Tutor Pengampu yang bertanggung jawab atas materi tersebut.',
            'Upload Thumbnail Sampul Kursus (gambar otomatis dikompresi agar ringan diakses siswa).'
          ]
        },
        {
          action: 'Menyusun Bab Modul & Rangkaian Materi',
          tag: 'Tambah Materi',
          tagColor: 'emerald',
          icon: 'fa-folder-tree',
          items: [
            'Buka halaman Detail Kursus, lalu klik "+ Tambah Modul Baru" (contoh: "Bab 1: Eksponen & Logaritma").',
            'Di dalam setiap modul, klik "+ Tambah Materi / Lesson".',
            'Pilih Tipe Materi: Video (masukkan URL video YouTube materi penjelasan), Artikel Bacaan (teks format kaya dan rumus), atau Dokumen PDF.',
            'Lampirkan File PDF Rangkuman Materi jika tersedia pada kolom attachment.',
            'Masukkan durasi estimasi baca/tonton dalam menit.'
          ]
        },
        {
          action: 'Aktivasi Pratinjau Gratis (Free Preview) & Approval Kursus',
          tag: 'Aktivasi',
          tagColor: 'amber',
          icon: 'fa-eye',
          items: [
            'Free Preview: Anda dapat mengaktifkan toggle "Akses Gratis (Preview)" pada video bab pertama agar calon siswa di landing page dapat mencicipi kualitas pembelajaran sebelum mendaftar.',
            'Status Publikasi Kursus: Ubah status kursus menjadi "Published" agar tampil di katalog E-Learning siswa.'
          ]
        },
        {
          action: 'Edit Urutan & Hapus Materi',
          tag: 'Edit & Hapus',
          tagColor: 'blue',
          icon: 'fa-arrow-down-up-across-line',
          items: [
            'Atur Nomor Urutan (Sort Order) untuk memastikan alur belajar siswa runut dari topik termudah hingga topik tersulit.',
            'Gunakan tombol "Hapus" jika ada materi yang usang.'
          ]
        }
      ]
    },
    {
      id: 'users',
      category: 'users',
      title: 'Manajemen Pengguna (Siswa, Tutor, Admin)',
      description: 'Pengelolaan akun pengguna platform, penugasan role (hak akses), verifikasi pendaftaran mandiri, reset kata sandi, dan suspensi akun.',
      route: '/admin/users',
      badge: 'Akun & Autentikasi',
      steps: [
        {
          action: 'Pendaftaran Akun Baru oleh Admin',
          tag: 'Tambah',
          tagColor: 'emerald',
          icon: 'fa-user-plus',
          items: [
            'Masuk ke menu Sistem > Kelola Pengguna.',
            'Klik tombol "+ Tambah Pengguna".',
            'Isi Nama Lengkap, Alamat Email yang valid, dan Password awal pengguna.',
            'Pilih Role Pengguna: "siswa" (akses CBT & E-Learning), "tutor" (kelola modul & nilai), "admin_sekolah" (monitor siswa sekolahnya), atau "admin" (super admin).',
            'Jika role yang dipilih adalah siswa atau admin_sekolah, pilih nama Sekolah Asal yang sudah terdaftar di sistem.',
            'Centang opsi "Status Aktif" lalu klik "Simpan Pengguna".'
          ]
        },
        {
          action: 'Edit Profil & Ubah Role Pengguna',
          tag: 'Edit',
          tagColor: 'blue',
          icon: 'fa-user-pen',
          items: [
            'Gunakan kolom pencarian atau filter per-role untuk menemukan user yang dituju.',
            'Klik tombol "Edit" pada baris pengguna.',
            'Anda dapat memperbarui Nama, Email, Nomor WhatsApp, dan mengganti Role pengguna.',
            'Jika pengguna lupa password, kolom "Password Baru" dapat diisi untuk mereset password mereka secara langsung tanpa perlu konfirmasi email.',
            'Klik "Simpan Perubahan".'
          ]
        },
        {
          action: 'Aktivasi, Blokir Akun & Approval Siswa Baru',
          tag: 'Aktivasi',
          tagColor: 'amber',
          icon: 'fa-user-check',
          items: [
            'Aktivasi / Blokir: Geser toggle switch pada kolom status akun pengguna. User yang dinonaktifkan tidak akan bisa login dan sesinya akan langsung ditutup.',
            'Validasi Siswa Sekolah: Untuk siswa yang mendaftar mandiri memilih sekolah mitra, admin dapat memverifikasi kesesuaian NISN/data siswa di menu pengguna sebelum memberikan paket bimbel gratis yang didanai sekolah.'
          ]
        },
        {
          action: 'Hapus Akun Pengguna',
          tag: 'Hapus',
          tagColor: 'rose',
          icon: 'fa-user-xmark',
          items: [
            'Klik tombol "Hapus" pada pengguna yang tidak aktif atau duplikat.',
            'Sistem akan mencatat aksi penghapusan ini ke dalam Audit Log untuk keamanan data.'
          ]
        }
      ]
    },
    {
      id: 'packages',
      category: 'packages',
      title: 'Manajemen Program & Paket Belajar',
      description: 'Pengaturan paket langganan bimbel SNBT 2027 (seperti Paket Intensif, Literasi, Mandiri), penetapan kuota pengerjaan tryout CBT, bundling kursus, serta penentuan harga diskon.',
      route: '/admin/learning-packages',
      badge: 'Katalog & Penjualan',
      steps: [
        {
          action: 'Membuat Paket Belajar Baru',
          tag: 'Tambah',
          tagColor: 'emerald',
          icon: 'fa-box-archive',
          items: [
            'Buka menu Sistem > Kelola Program/Paket.',
            'Klik tombol "+ Tambah Paket Belajar" di pojok kanan atas.',
            'Masukkan Nama Paket (contoh: "Paket Intensif UTBK 2027"), Deskripsi singkat keunggulan paket, dan Tipe Program.',
            'Tentukan Harga Normal (Rp) dan Harga Promo/Diskon (opsional). Jika harga diskon diisi, landing page otomatis menampilkan badge harga coret yang menarik.',
            'Atur Kuota Sesi CBT (misal: isi 5 untuk 5x tryout, atau 999 untuk Tryout Unlimited Tanpa Batas).',
            'Pilih Kursus yang Di-bundling: Centang modul-modul kursus yang otomatis didapatkan siswa ketika membeli/mengaktifkan paket ini.',
            'Tuliskan Poin Fitur Unggulan (satu baris per poin, misal: "Akses 14 Subtes UTBK", "Bank Soal Pembahasan Lengkap", "Analisis Peluang PTN").'
          ]
        },
        {
          action: 'Upload Thumbnail Sampul Paket',
          tag: 'Upload',
          tagColor: 'purple',
          icon: 'fa-cloud-arrow-up',
          items: [
            'Pada bagian "Thumbnail Paket", klik area upload atau seret file gambar banner paket Anda.',
            'Gunakan gambar beresolusi tajam (rekomendasi: 1200 x 630 pixel atau rasio 16:9).',
            'Sistem secara otomatis mengompresi gambar di browser agar proses unggah instan dan andal.',
            'Thumbnail ini akan tampil pada katalog paket di landing page dan dashboard siswa.'
          ]
        },
        {
          action: 'Edit Konfigurasi Paket & Kuota CBT',
          tag: 'Edit',
          tagColor: 'blue',
          icon: 'fa-sliders',
          items: [
            'Klik tombol "Edit" pada kartu paket yang ingin diperbarui.',
            'Anda dapat memperbarui harga diskon sewaktu-waktu selama periode promo berlangsung.',
            'Anda dapat menambah atau mengurangi kursus yang terhubung dalam paket tanpa mengganggu kemajuan belajar siswa yang sudah terdaftar.'
          ]
        },
        {
          action: 'Publish (Aktivasi) & Status Tampil di Landing Page',
          tag: 'Aktivasi',
          tagColor: 'amber',
          icon: 'fa-bullhorn',
          items: [
            'Tandai status "Publish": Paket yang diset Published akan langsung otomatis muncul di Landing Page depan website pada seksi "Pilih Paket yang Tepat".',
            'Jika paket diset "Draft / Nonaktif", paket hanya disimpan di sistem admin dan tidak dapat diakses atau dibeli oleh publik.'
          ]
        },
        {
          action: 'Hapus Paket Belajar',
          tag: 'Hapus',
          tagColor: 'rose',
          icon: 'fa-trash',
          items: [
            'Klik tombol "Hapus" pada paket.',
            'Perhatian: Menghapus paket tidak menghapus materi kursus yang ada di dalamnya, melainkan hanya menghapus skema paket pendaftaran.'
          ]
        }
      ]
    },
    {
      id: 'landing',
      category: 'landing',
      title: 'Kelola Konten Landing Page & Testimoni',
      description: 'Pengaturan visual dan konten halaman depan SkorPluss tanpa perlu menyentuh kode pemrograman, meliputi banner promo, hero section, keunggulan fitur, dan testimoni siswa lolos PTN.',
      route: '/admin/landing',
      badge: 'Tampilan Depan',
      steps: [
        {
          action: 'Mengubah Banner Pengumuman & Hero Promo',
          tag: 'Edit',
          tagColor: 'blue',
          icon: 'fa-bullhorn',
          items: [
            'Buka menu Sistem > Kelola Landing Page.',
            'Pilih Tab "Hero Section" untuk mengubah Judul Utama, Subjudul, dan Tombol CTA pendaftaran.',
            'Pilih Tab "Promo Banner" untuk mengaktifkan running text promo diskon di bagian paling atas halaman.',
            'Klik "Simpan" untuk menerapkan perubahan secara langsung ke website.'
          ]
        },
        {
          action: 'Menambah & Mengelola Testimoni Siswa Lolos PTN',
          tag: 'Tambah & Upload',
          tagColor: 'emerald',
          icon: 'fa-comments-dollar',
          items: [
            'Buka Tab "Testimoni".',
            'Klik "+ Tambah Testimoni".',
            'Masukkan Nama Siswa, Sekolah Asal (contoh: SMAN 1 Malang), Universitas Tujuan Lolos (contoh: Kedokteran UNAIR / STEI ITB), Nilai UTBK (contoh: 742), dan Kalimat Ulasan mereka.',
            'Upload Foto Avatar Siswa (disarankan rasio 1:1 persegi). Sistem akan otomatis memperkecil ukuran foto agar loading landing page tetap cepat.',
            'Aktifkan status "Tampilkan" dan klik Simpan.'
          ]
        },
        {
          action: 'Sinkronisasi Paket Belajar di Landing Page',
          tag: 'Aktivasi',
          tagColor: 'purple',
          icon: 'fa-arrows-rotate',
          items: [
            'Paket yang tampil di landing page depan secara otomatis terhubung langsung dengan menu "Kelola Program/Paket" (/admin/learning-packages).',
            'Cukup ubah atau tambah paket di Manajemen Paket, maka tampilan kartu harga di halaman depan otomatis terupdate.'
          ]
        }
      ]
    },
    {
      id: 'forum',
      category: 'forum',
      title: 'Forum Tanya Jawab & Komunitas Belajar Siswa',
      description: 'Panduan penggunaan forum diskusi interaktif untuk siswa dan tutor: mengajukan pertanyaan seputar soal tryout/materi, menjawab, memberikan solusi terverifikasi, dan moderasi konten.',
      route: '/forum',
      badge: 'Komunitas & Interaksi',
      steps: [
        {
          action: 'Mengajukan Pertanyaan Baru di Forum',
          tag: 'Buat Diskusi',
          tagColor: 'emerald',
          icon: 'fa-circle-question',
          items: [
            'Buka menu Utama > Forum Tanya Jawab di sidebar kiri.',
            'Klik tombol biru "+ Ajukan Pertanyaan".',
            'Pilih Kategori Pelajaran (contoh: Penalaran Matematika, Literasi Bahasa Indonesia, Pengetahuan Kuantitatif, Info SNBT/PTN).',
            'Tuliskan Judul Pertanyaan secara ringkas dan spesifik (contoh: "Bagaimana cara cepat menentukan asimtot fungsi eksponen ini?").',
            'Tuliskan penjelasan soal pada editor teks. Jika terdapat gambar soal atau grafik rumus, lampirkan berkas gambar pendukung.',
            'Klik "Kirim Pertanyaan" untuk mempublikasikannya ke komunitas.'
          ]
        },
        {
          action: 'Menjawab & Berdiskusi',
          tag: 'Diskusi',
          tagColor: 'blue',
          icon: 'fa-reply',
          items: [
            'Buka salah satu topik pertanyaan di forum.',
            'Baca pertanyaan dan uraian kendala yang dialami rekan siswa.',
            'Tuliskan langkah-langkah pembahasan pada kolom jawaban di bawah.',
            'Tutor dan siswa lain dapat saling melengkapi jawaban untuk memperkaya pemahaman konsep bersama.'
          ]
        },
        {
          action: 'Menandai Jawaban Terverifikasi (Best Answer)',
          tag: 'Verifikasi Solusi',
          tagColor: 'amber',
          icon: 'fa-check-double',
          items: [
            'Pembuat pertanyaan atau tutor dapat menandai salah satu jawaban sebagai "Solusi Terbaik / Terverifikasi".',
            'Jawaban yang ditandai akan disematkan di posisi paling atas dengan lencana hijau khusus agar siswa lain langsung menemukan jawaban yang valid.'
          ]
        }
      ]
    },
    {
      id: 'roles',
      category: 'roles',
      title: 'Kelola Role, Hak Akses & Matriks Menu',
      description: 'Pengendalian hak akses dan keamanan sistem per-role pengguna (Admin, Tutor, Admin Sekolah, Siswa) menggunakan matriks hak akses menu sidebar.',
      route: '/admin/roles',
      badge: 'Keamanan & Otorisasi',
      steps: [
        {
          action: 'Memahami Role Pengguna di SkorPluss',
          tag: 'Konsep',
          tagColor: 'indigo',
          icon: 'fa-shield',
          items: [
            '1. Admin: Memiliki akses menyeluruh ke semua modul sistem termasuk konfigurasi server, sekolah, keuangan paket, dan audit log.',
            '2. Admin Sekolah: Dibatasi hanya dapat melihat data siswa dari sekolahnya sendiri, laporan nilai tryout siswa sekolahnya, dan profil sekolah.',
            '3. Tutor: Memiliki akses ke Kelola CBT, Kelola E-Learning, dan Forum Diskusi untuk menjawab pertanyaan siswa.',
            '4. Siswa: Mengakses fitur belajar, latihan soal CBT, silabus kursus, dan forum diskusi.'
          ]
        },
        {
          action: 'Mengatur Visibilitas Menu via Matriks Akses',
          tag: 'Approval & Setting',
          tagColor: 'amber',
          icon: 'fa-table-cells',
          items: [
            'Buka menu Sistem > Kelola Role & Menu.',
            'Anda akan melihat tabel matriks: Baris menampilkan daftar Menu Sidebar dan Kolom menampilkan Role Pengguna.',
            'Cukup klik kotak centang (checkbox) untuk mengaktifkan atau mencabut izin akses menu untuk role tertentu.',
            'Perubahan tersimpan seketika secara real-time via API. Saat pengguna terkait merefresh browser, menu yang diizinkan akan otomatis disesuaikan.'
          ]
        }
      ]
    },
    {
      id: 'settings',
      category: 'settings',
      title: 'Pengaturan Global, Promo Trial & Audit Log',
      description: 'Konfigurasi identitas aplikasi SkorPluss, aktivasi masa uji coba gratis pendaftar baru (Free Trial), dan pemantauan riwayat aktivitas admin di Audit Log.',
      route: '/admin/settings',
      badge: 'Sistem & Regulasi',
      steps: [
        {
          action: 'Mengubah Nama Aplikasi & Logo Resmi',
          tag: 'Edit & Upload',
          tagColor: 'blue',
          icon: 'fa-sliders',
          items: [
            'Buka menu Sistem > Pengaturan.',
            'Ganti Nama Aplikasi (App Name) dan Tagline resmi platform.',
            'Klik tombol "Unggah Logo" untuk mengganti lambang resmi SkorPluss di navbar dan halaman login. Foto akan dikompresi otomatis.',
            'Klik "Simpan Pengaturan".'
          ]
        },
        {
          action: 'Aktivasi Promo Pendaftaran Gratis (Free Trial)',
          tag: 'Aktivasi',
          tagColor: 'emerald',
          icon: 'fa-gift',
          items: [
            'Pada bagian "Promo & Masa Uji Coba Gratis (Free Trial)":',
            'Pilih status "🟢 Aktif" jika ingin setiap siswa yang baru mendaftar langsung mendapatkan akses gratis selama masa promosi.',
            'Tentukan Durasi Masa Trial (misal: 7 hari atau 14 hari).',
            'Pilih status "🔴 Nonaktif" saat periode promosi telah berakhir agar pendaftar baru diwajibkan membeli paket atau diverifikasi sekolah mitra.'
          ]
        },
        {
          action: 'Mengecek Riwayat Aktivitas di Audit Log',
          tag: 'Monitoring',
          tagColor: 'indigo',
          icon: 'fa-clock-rotate-left',
          items: [
            'Buka menu Sistem > Audit & Laporan (/admin/audit).',
            'Lihat seluruh catatan aktivitas admin: siapa yang melakukan penambahan soal, pengubahan paket, penghapusan data sekolah, maupun reset password.',
            'Gunakan fitur pencarian untuk mengaudit aktivitas berdasarkan nama admin atau jenis tindakan jika terjadi ketidaksesuaian data.'
          ]
        }
      ]
    }
  ];

  const filteredGuides = guides.filter((g) => {
    const matchCategory = activeCategory === 'all' || g.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchCategory;
    
    const matchTitle = g.title.toLowerCase().includes(query);
    const matchDesc = g.description.toLowerCase().includes(query);
    const matchStep = g.steps.some(s => 
      s.action.toLowerCase().includes(query) || 
      s.items.some(it => it.toLowerCase().includes(query))
    );

    return matchCategory && (matchTitle || matchDesc || matchStep);
  });

  return (
    <AppLayout title="Buku Panduan Administrasi" subtitle="Petunjuk teknis operasional fitur sistem SkorPluss langkah demi langkah">
      <div className="w-full space-y-6 pb-12">
        {/* Header Hero Banner (Clean Solid Blue, No AI Gradients) */}
        <div className="relative overflow-hidden rounded-2xl bg-blue-700 text-white p-6 md:p-8 shadow-xs border border-blue-800">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-600/60">
              <FontAwesomeIcon icon={['fas', 'book-bookmark']} /> Panduan Standar Operasional (SOP)
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Buku Panduan Lengkap Pengelolaan SkorPluss
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-6">
              Dokumentasi teknis operasional lengkap untuk tim administrasi dan pengelola. Memandu pelaksanaan Machine Learning (IRT & BKT), Pemantauan Siswa, Laporan Cetak PDF, Ujian CBT, Kurikulum E-Learning, hingga Pengaturan Hak Akses.
            </p>

            {/* Live Search Bar */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FontAwesomeIcon icon={['fas', 'magnifying-glass']} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari panduan... (contoh: machine learning, irt, cetak rapor, kuota cbt, whatsapp)"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-xs border border-blue-600/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <FontAwesomeIcon icon={['fas', 'xmark']} />
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:block absolute right-8 bottom-4 opacity-15 text-[150px] pointer-events-none">
            <FontAwesomeIcon icon={['fas', 'book-open']} />
          </div>
        </div>

        {/* Quick Highlights SOP Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-base shadow-xs">
              <FontAwesomeIcon icon={['fas', 'brain']} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-blue-950 dark:text-blue-200">AI & Machine Learning</h4>
              <p className="text-xs text-blue-700/90 dark:text-blue-300/80 mt-1">
                Prediksi skor UTBK adaptif dengan IRT Rasch Model dan estimasi penguasaan materi probabilistik dengan BKT HMM.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-base shadow-xs">
              <FontAwesomeIcon icon={['fas', 'user-check']} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">Intervensi & Rapor Siswa</h4>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-300/80 mt-1">
                Klasifikasi kesiapan siswa (Butuh Pendampingan, Penguatan, Lanjut), kontak WhatsApp, dan penerbitan Rapor PDF.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/40 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 text-base shadow-xs">
              <FontAwesomeIcon icon={['fas', 'file-pdf']} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-purple-950 dark:text-purple-200">Laporan Resmi 5 Bab</h4>
              <p className="text-xs text-purple-700/90 dark:text-purple-300/80 mt-1">
                Pencetakan dokumen master PDF komprehensif berstandar A4 dengan kop surat resmi untuk evaluasi berkala sekolah.
              </p>
            </div>
          </div>
        </div>

        {/* MAIN 2-COLUMN LAYOUT: DAFTAR ISI DI SAMPING KIRI & KONTEN DI KANAN */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* DAFTAR ISI DI SAMPING KIRI (STICKY SIDEBAR) */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                    <FontAwesomeIcon icon={['fas', 'list-check']} />
                  </span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Daftar Isi Panduan
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {guides.length} Bab
                </span>
              </div>

              <nav className="space-y-1">
                {guideCategories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const count = cat.id === 'all'
                    ? guides.length
                    : guides.filter(g => g.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        if (window.innerWidth < 1024) {
                          document.getElementById('guide-content')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-l-4 border-blue-600 shadow-2xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <FontAwesomeIcon
                          icon={['fas', cat.icon.replace('fa-', '')]}
                          className={`text-xs shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        />
                        <span className="truncate">{cat.label}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <p>💡 Pilih bab pada daftar isi di atas untuk langsung membaca petunjuk teknis SOP fitur bersangkutan.</p>
              </div>
            </div>
          </div>

          {/* KONTEN PANDUAN DI SAMPING KANAN */}
          <div id="guide-content" className="lg:col-span-3 space-y-6">
            {filteredGuides.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-2xl">
                  <FontAwesomeIcon icon={['fas', 'magnifying-glass']} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada panduan yang cocok</h3>
                <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian lain atau pilih Semua Panduan dari daftar isi.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="mt-4"
                >
                  <FontAwesomeIcon icon={['fas', 'rotate-right']} className="mr-1.5 text-slate-500" /> Reset Pencarian
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
                  >
                    {/* Module Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/30">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                            {guide.badge}
                          </span>
                          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                            {guide.title}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                          {guide.description}
                        </p>
                      </div>

                      {guide.route && (
                        <Link to={guide.route} className="shrink-0">
                          <Button size="sm" variant="outline" className="text-xs flex items-center gap-2 group">
                            <span>Buka Fitur</span>
                            <FontAwesomeIcon icon={['fas', 'arrow-right']} className="text-[10px] group-hover:translate-x-0.5 transition-transform text-blue-600" />
                          </Button>
                        </Link>
                      )}
                    </div>

                    {/* Steps Accordion / List */}
                    <div className="p-6 space-y-4">
                      {guide.steps.map((step, idx) => {
                        const stepId = `${guide.id}-${idx}`;
                        const isExpanded = expandedSection === null || expandedSection === stepId;

                        const colorMap = {
                          emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                          blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                          purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                          amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                          rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                          indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                        };

                        const isBrandIcon = step.icon.includes('whatsapp');

                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/40 overflow-hidden"
                          >
                            <div
                              onClick={() => setExpandedSection(isExpanded && expandedSection === stepId ? 'closed' : stepId)}
                              className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${colorMap[step.tagColor] || colorMap.blue}`}>
                                  <FontAwesomeIcon
                                    icon={[isBrandIcon ? 'fab' : 'fas', step.icon.replace('fa-brands ', '').replace('fa-', '')]}
                                  />
                                </span>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>{step.action}</span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorMap[step.tagColor] || colorMap.blue}`}>
                                      {step.tag}
                                    </span>
                                  </h3>
                                </div>
                              </div>

                              <FontAwesomeIcon
                                icon={['fas', isExpanded ? 'chevron-up' : 'chevron-down']}
                                className="text-xs text-slate-400 shrink-0"
                              />
                            </div>

                            {isExpanded && (
                              <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                                <ol className="space-y-2.5 mt-2">
                                  {step.items.map((item, itemIdx) => (
                                    <li key={itemIdx} className="flex items-start gap-3 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                        {itemIdx + 1}
                                      </span>
                                      <span className="flex-1">{item}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Support Card */}
        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl shrink-0">
              <FontAwesomeIcon icon={['fas', 'headset']} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Butuh Bantuan Lebih Lanjut?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Jika Anda menemui kendala teknis atau bugs sistem, hubungi tim pengembang internal SkorPluss atau konsultasikan di forum komunitas.
              </p>
            </div>
          </div>
          <Link to="/forum">
            <Button size="sm" variant="outline" className="whitespace-nowrap flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'comments']} className="text-blue-600" />
              <span>Forum Tanya Jawab</span>
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
