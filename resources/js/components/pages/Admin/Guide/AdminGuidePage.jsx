import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AdminGuidePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  const guideCategories = [
    { id: 'all', label: 'Semua Panduan', icon: 'fa-layer-group' },
    { id: 'schools', label: 'Kelola Sekolah', icon: 'fa-school' },
    { id: 'users', label: 'Kelola Pengguna', icon: 'fa-users' },
    { id: 'packages', label: 'Program & Paket', icon: 'fa-cubes' },
    { id: 'cbt', label: 'Ujian & Soal (CBT)', icon: 'fa-list-check' },
    { id: 'elearning', label: 'E-Learning & Kursus', icon: 'fa-book-open-reader' },
    { id: 'landing', label: 'Landing Page', icon: 'fa-palette' },
    { id: 'roles', label: 'Role, Akses & Menu', icon: 'fa-user-shield' },
    { id: 'settings', label: 'Pengaturan & Audit', icon: 'fa-gear' },
  ];

  const guides = [
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
            'Klik tombol biru "+ Tambah Sekolah" di pojok kanan atas tabel.',
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
            'Sistem dilengkapi fitur kompresi otomatis di sisi browser (klien). Gambar besar akan diperkecil ukurannya sebelum dikirim ke server untuk menghindari error "413 Payload Too Large".',
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
            'Klik tombol ikon "Edit" (ikon pensil kuning) pada kolom Aksi.',
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
            'Klik tombol ikon "Hapus" (ikon tempat sampah merah) pada baris sekolah yang ingin dihapus.',
            'PERHATIAN: Pastikan sekolah tersebut tidak memiliki data siswa aktif atau riwayat ujian penting. Jika ada siswa terkait, sistem akan memberikan peringatan keamanan.',
            'Ketik konfirmasi atau klik "Ya, Hapus Sekolah" pada modal dialog konfirmasi.'
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
      id: 'cbt',
      category: 'cbt',
      title: 'Kelola Ujian & Bank Soal CBT (SNBT 2027)',
      description: 'Pembuatan simulasi tryout online, konfigurasi subtes SNBT, durasi pengerjaan, passing grade, serta manajemen soal pilihan ganda tunggal, pilihan majemuk (kompleks), dan isian singkat.',
      route: '/admin/cbt',
      badge: 'Evaluasi & Ujian',
      steps: [
        {
          action: 'Membuat Ujian Tryout Baru',
          tag: 'Tambah',
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
            'Pilih Tipe Soal yang sesuai dengan format SNBT 2027 terkini:',
            '1. Pilihan Ganda Biasa (Single Choice): Siswa memilih 1 dari 5 pilihan (A, B, C, D, E). Tandai 1 jawaban yang benar.',
            '2. Pilihan Ganda Kompleks (Multiple Choice): Siswa dapat memilih lebih dari satu pernyataan yang benar. Tandai semua pilihan yang valid.',
            '3. Isian Singkat (Short Answer): Siswa mengetikkan angka atau kata jawaban pasti (contoh: 42 atau 1500). Masukkan kunci jawaban eksak pada kolom kunci.',
            'Isi Pembahasan Lengkap agar siswa dapat melakukan evaluasi mandiri setelah hasil ujian keluar.'
          ]
        },
        {
          action: 'Upload Gambar Soal, Grafik, & Rumus',
          tag: 'Upload',
          tagColor: 'purple',
          icon: 'fa-file-image',
          items: [
            'Jika soal memuat stimulus bacaan tabel, diagram batang, grafik fungsi, atau geometri, klik tombol "Upload Gambar Stimulus".',
            'Pilih gambar grafik/rumus dari komputer Anda.',
            'Gambar akan otomatis teroptimasi dan tampil di sisi kiri/atas stimulus soal di layar ujian siswa.',
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
            'Klik tombol ikon tempat sampah untuk menghapus butir soal yang keliru.'
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
          tag: 'Tambah',
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
      id: 'landing',
      category: 'landing',
      title: 'Kelola Konten Landing Page',
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
            'Di tab "Program Belajar", Anda akan melihat pemberitahuan integrasi otomatis.',
            'Paket yang tampil di landing page depan secara otomatis terhubung langsung dengan menu "Kelola Program/Paket" (/admin/learning-packages).',
            'Cukup ubah atau tambah paket di Manajemen Paket, maka tampilan kartu harga di halaman depan otomatis terupdate.'
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
      <div className="space-y-6 pb-12">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 md:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
              <FontAwesomeIcon icon={['fas', 'book-bookmark']} /> Panduan Standar Operasional (SOP)
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Panduan Lengkap Pengelolaan SkorPluss
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-6">
              Dokumentasi teknis operasional untuk tim administrasi. Memandu langkah demi langkah pelaksanaan penambahan data, pengeditan, penghapusan aman, optimasi kompresi upload gambar, aktivasi status, serta persetujuan (approval) kemitraan.
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
                placeholder="Cari panduan... (contoh: upload gambar, aktivasi trial, tambah sekolah, kuota cbt)"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FontAwesomeIcon icon={['fas', 'xmark']} />
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:block absolute right-6 bottom-4 opacity-15 text-[160px] pointer-events-none">
            <FontAwesomeIcon icon={['fas', 'book-open']} />
          </div>
        </div>

        {/* Quick Rules & SOP Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 text-lg shadow-sm">
              <FontAwesomeIcon icon={['fas', 'cloud-arrow-up']} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Kompresi Gambar Otomatis</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                Seluruh upload thumbnail & logo otomatis diperkecil di browser Anda sebelum dikirim. Aman dari error batas ukuran file.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 text-lg shadow-sm">
              <FontAwesomeIcon icon={['fas', 'shield-halved']} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-blue-900 dark:text-blue-200">Perekaman Audit Log</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Aksi penting seperti penambahan, pengubahan, dan penghapusan data otomatis tercatat lengkap dengan identitas admin dan waktu eksekusi.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0 text-lg shadow-sm">
              <FontAwesomeIcon icon={['fas', 'arrows-rotate']} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">Sinkronisasi Real-Time</h4>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                Perubahan pada Manajemen Paket atau Soal CBT akan langsung tercermin seketika di sisi antarmuka landing page dan siswa.
              </p>
            </div>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {guideCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <FontAwesomeIcon icon={['fas', cat.icon.replace('fa-', '')]} className="text-xs" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Content Section */}
        {filteredGuides.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-2xl">
              <FontAwesomeIcon icon={['fas', 'magnifying-glass']} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada panduan yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian lain atau pilih kategori Semua Panduan.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-4"
            >
              Reset Pencarian
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
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
                        <FontAwesomeIcon icon={['fas', 'arrow-right']} className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
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
                              <FontAwesomeIcon icon={['fas', step.icon.replace('fa-', '')]} />
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

        {/* Footer Support Card */}
        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl shrink-0">
              <FontAwesomeIcon icon={['fas', 'headset']} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Butuh Bantuan Lebih Lanjut?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Jika Anda menemui kendala teknis atau bugs sistem, hubungi tim pengembang internal SkorPluss.
              </p>
            </div>
          </div>
          <Link to="/forum">
            <Button size="sm" className="whitespace-nowrap flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'comments']} />
              <span>Forum Tanya Jawab</span>
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
