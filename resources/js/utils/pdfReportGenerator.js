/**
 * SkorPlus Learning Center - Lightweight High-Performance PDF Report Generator
 * 
 * Generates clean, publication-ready A4 PDF documents using a dedicated 
 * zero-overhead print document frame with official SkorPlus letterhead (kop surat),
 * proper pagination, and vector styling.
 */

const getBaseStyles = () => `
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 15mm 15mm;
  }
  @media print {
    html, body {
      width: 210mm;
      height: auto;
      background: #ffffff !important;
      color: #111827 !important;
      font-size: 11pt;
      line-height: 1.45;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .no-print {
      display: none !important;
    }
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937;
    margin: 0;
    padding: 20px;
    background-color: #f9fafb;
  }

  .doc-container {
    max-width: 210mm;
    margin: 0 auto;
    background: #ffffff;
    padding: 30px 40px;
    box-sizing: border-box;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  @media print {
    .doc-container {
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  }

  /* Official Letterhead (Kop Surat) */
  .letterhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 3px solid #1e3a8a;
    position: relative;
    margin-bottom: 2px;
  }
  .letterhead-line2 {
    border-bottom: 1px solid #1e3a8a;
    margin-bottom: 20px;
  }
  .letterhead-logo {
    width: 80px;
    height: auto;
    max-height: 80px;
    object-fit: contain;
  }
  .letterhead-text {
    flex: 1;
    text-align: center;
    padding: 0 15px;
  }
  .letterhead-text h1 {
    font-size: 18pt;
    font-weight: 900;
    margin: 0;
    color: #1e3a8a;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .letterhead-text h2 {
    font-size: 11pt;
    font-weight: 700;
    margin: 2px 0;
    color: #3b82f6;
  }
  .letterhead-text p {
    font-size: 8pt;
    color: #6b7280;
    margin: 1px 0;
    line-height: 1.3;
  }

  .doc-title {
    text-align: center;
    margin: 16px 0 20px 0;
  }
  .doc-title h3 {
    font-size: 13pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 4px 0;
    color: #111827;
  }
  .doc-title p {
    font-size: 8.5pt;
    color: #6b7280;
    margin: 0;
  }

  /* Grid & Tables */
  .info-table {
    width: 100%;
    margin-bottom: 18px;
    border-collapse: collapse;
  }
  .info-table td {
    padding: 4px 8px;
    font-size: 9pt;
    vertical-align: top;
  }
  .info-table td.label {
    width: 18%;
    font-weight: 600;
    color: #4b5563;
  }
  .info-table td.colon {
    width: 2%;
    font-weight: 600;
  }
  .info-table td.value {
    width: 30%;
    font-weight: 600;
    color: #111827;
  }

  /* Summary KPI Cards */
  .kpi-grid {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }
  .kpi-card {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    text-align: center;
  }
  .kpi-card .kpi-num {
    font-size: 16pt;
    font-weight: 800;
    color: #1e40af;
    line-height: 1.1;
  }
  .kpi-card .kpi-label {
    font-size: 7.5pt;
    font-weight: 600;
    text-transform: uppercase;
    color: #64748b;
    margin-top: 4px;
  }

  /* Content Table */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 8.5pt;
  }
  .data-table th, .data-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    text-align: left;
  }
  .data-table th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #1e293b;
    text-transform: uppercase;
    font-size: 8pt;
    letter-spacing: 0.3px;
  }
  .data-table tr:nth-child(even) {
    background-color: #f8fafc;
  }
  .text-center { text-align: center !important; }
  .text-right { text-align: right !important; }
  .font-bold { font-weight: 700 !important; }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 7.5pt;
    font-weight: 700;
  }
  .badge-emerald { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
  .badge-blue { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
  .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-rose { background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }
  .badge-slate { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }

  /* Signatures */
  .signature-section {
    display: flex;
    justify-content: space-between;
    margin-top: 35px;
    padding-top: 10px;
  }
  .signature-box {
    width: 200px;
    text-align: center;
    font-size: 8.5pt;
  }
  .signature-space {
    height: 60px;
  }

  .section-title {
    font-size: 10pt;
    font-weight: 800;
    color: #1e3a8a;
    border-left: 3.5px solid #2563eb;
    padding-left: 8px;
    margin: 18px 0 10px 0;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  /* Question Item in Detail View */
  .question-item {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    background: #ffffff;
  }
  .question-item.correct {
    border-left: 4px solid #10b981;
  }
  .question-item.wrong {
    border-left: 4px solid #f43f5e;
  }
  .question-item.empty {
    border-left: 4px solid #94a3b8;
  }
`;

/**
 * Executes lightweight native printing in a hidden iframe to prevent memory spike.
 */
const printDocumentHtml = (htmlContent) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 400);
};

/**
 * Generate Student Academic Progress Report (Rapor Akademik Siswa)
 */
export const printStudentReportPDF = (report) => {
  if (!report) return;

  const { student = {}, summary = {}, subtest_stats = [], exam_history = [], learning_progress = [] } = report;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rapor Akademik - ${student.name || 'Siswa'}</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="doc-container">
        <!-- Letterhead -->
        <div class="letterhead">
          <img src="/assets/skorpluss_logo.png" alt="SkorPlus" class="letterhead-logo" onerror="this.style.display='none'" />
          <div class="letterhead-text">
            <h1>SKORPLUS LEARNING CENTER</h1>
            <h2>Bimbingan Belajar & Konsultasi Akademik Kedinasan, UTBK-SNBT & Olimpiade</h2>
            <p>Jalan Pendidikan No. 45, Indonesia · Website: https://skorplus.id · Email: info@skorplus.id</p>
          </div>
        </div>
        <div class="letterhead-line2"></div>

        <!-- Title -->
        <div class="doc-title">
          <h3>Laporan Capaian Akademik Peserta Didik</h3>
          <p>Dokumen Resmi Hasil Evaluasi Pembelajaran & Computer-Based Testing (CBT)</p>
        </div>

        <!-- Student Biodata -->
        <table class="info-table">
          <tr>
            <td class="label">Nama Lengkap</td>
            <td class="colon">:</td>
            <td class="value font-bold">${student.name || '-'}</td>
            <td class="label">Program Belajar</td>
            <td class="colon">:</td>
            <td class="value uppercase">${student.program || 'Reguler'}</td>
          </tr>
          <tr>
            <td class="label">NISN / No. ID</td>
            <td class="colon">:</td>
            <td class="value">${student.nisn || student.id || '-'}</td>
            <td class="label">Asal Sekolah</td>
            <td class="colon">:</td>
            <td class="value">${student.school || '-'}</td>
          </tr>
          <tr>
            <td class="label">Email Terdaftar</td>
            <td class="colon">:</td>
            <td class="value">${student.email || '-'}</td>
            <td class="label">Tanggal Cetak</td>
            <td class="colon">:</td>
            <td class="value">${printDate}</td>
          </tr>
        </table>

        <!-- Executive Summary Cards -->
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num">${summary.avg_cbt_score || 0}</div>
            <div class="kpi-label">Rata-rata Skor CBT</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${summary.pass_rate || 0}%</div>
            <div class="kpi-label">Tingkat Kelulusan</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${summary.exams_taken || 0} Sesi</div>
            <div class="kpi-label">Total Ujian Selesai</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${summary.avg_progress || 0}%</div>
            <div class="kpi-label">Progres E-Learning</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #059669;">${summary.predicated || '-'}</div>
            <div class="kpi-label">Predikat Kelulusan</div>
          </div>
        </div>

        <!-- Subtest Competency Breakdown -->
        <div class="section-title">I. Analisis Penguasaan Subtes / Mata Pelajaran</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 45%;">Subtes / Kompetensi Materi</th>
              <th style="width: 15%;" class="text-center">Jumlah Soal</th>
              <th style="width: 15%;" class="text-center">Jawaban Benar</th>
              <th style="width: 20%;" class="text-center">Tingkat Akurasi</th>
            </tr>
          </thead>
          <tbody>
            ${subtest_stats.length > 0 ? subtest_stats.map((st, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${st.subtest}</td>
                <td class="text-center">${st.total}</td>
                <td class="text-center">${st.correct}</td>
                <td class="text-center">
                  <span class="badge ${st.accuracy >= 70 ? 'badge-emerald' : (st.accuracy >= 50 ? 'badge-amber' : 'badge-rose')}">
                    ${st.accuracy}%
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" class="text-center text-slate-400">Belum ada data evaluasi subtes.</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- CBT Exam History -->
        <div class="section-title">II. Riwayat Ujian Komputer (CBT)</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 45%;">Nama Paket Ujian</th>
              <th style="width: 20%;">Tanggal Selesai</th>
              <th style="width: 15%;" class="text-center">Skor Akhir</th>
              <th style="width: 15%;" class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${exam_history.length > 0 ? exam_history.map((ex, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${ex.title}</td>
                <td>${ex.submitted_at ? new Date(ex.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td class="text-center font-bold" style="font-size: 10pt; color: #1e3a8a;">${ex.score ?? '-'}</td>
                <td class="text-center">
                  <span class="badge ${ex.is_pass ? 'badge-emerald' : 'badge-rose'}">
                    ${ex.is_pass ? 'Lulus' : 'Remedial'}
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" class="text-center text-slate-400">Belum ada riwayat ujian CBT.</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- E-Learning Progress -->
        <div class="section-title">III. Partisipasi Modul & Kursus E-Learning</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 45%;">Judul Kursus</th>
              <th style="width: 25%;">Kategori</th>
              <th style="width: 10%;" class="text-center">Modul</th>
              <th style="width: 15%;" class="text-center">Progres</th>
            </tr>
          </thead>
          <tbody>
            ${learning_progress.length > 0 ? learning_progress.map((lp, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${lp.course_title}</td>
                <td>${lp.category}</td>
                <td class="text-center">${lp.completed_lessons} / ${lp.total_lessons}</td>
                <td class="text-center">
                  <span class="badge ${lp.progress_percentage >= 100 ? 'badge-emerald' : 'badge-blue'}">
                    ${lp.progress_percentage}%
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" class="text-center text-slate-400">Belum ada data kursus e-learning.</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="signature-section avoid-break">
          <div class="signature-box">
            <p>Mengetahui,<br><strong>Orang Tua / Wali Siswa</strong></p>
            <div class="signature-space"></div>
            <p>( ..................................................... )</p>
          </div>
          <div class="signature-box">
            <p>Diterbitkan pada: ${printDate}<br><strong>Kepala Program Akademik</strong></p>
            <div class="signature-space"></div>
            <p><strong>SkorPlus Learning Center</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};

/**
 * Generate CBT Exam Session Question-by-Question Detailed Review PDF
 */
export const printCbtSessionDetailPDF = (sessionDetail) => {
  if (!sessionDetail) return;

  const { session = {}, items = [] } = sessionDetail;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Hasil Ujian CBT - ${session.exam_title || 'Ujian'} - ${session.student_name || 'Siswa'}</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="doc-container">
        <!-- Letterhead -->
        <div class="letterhead">
          <img src="/assets/skorpluss_logo.png" alt="SkorPlus" class="letterhead-logo" onerror="this.style.display='none'" />
          <div class="letterhead-text">
            <h1>SKORPLUS LEARNING CENTER</h1>
            <h2>Lembar Evaluasi & Analisis Jawaban CBT</h2>
            <p>Platform Bimbingan & Tryout CBT UTBK SNBT Mandiri · https://skorplus.id</p>
          </div>
        </div>
        <div class="letterhead-line2"></div>

        <!-- Title -->
        <div class="doc-title">
          <h3>Lembar Hasil & Pembahasan Ujian CBT</h3>
          <p>Paket Ujian: <strong>${session.exam_title || 'Ujian CBT'}</strong></p>
        </div>

        <!-- Exam & Student Biodata -->
        <table class="info-table avoid-break">
          <tr>
            <td class="label">Nama Siswa</td>
            <td class="colon">:</td>
            <td class="value font-bold">${session.student_name || '-'}</td>
            <td class="label">Waktu Pengerjaan</td>
            <td class="colon">:</td>
            <td class="value">${session.duration_seconds ? Math.floor(session.duration_seconds / 60) : 0} Menit</td>
          </tr>
          <tr>
            <td class="label">Tanggal Selesai</td>
            <td class="colon">:</td>
            <td class="value">${session.submitted_at ? new Date(session.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
            <td class="label">Status Kelulusan</td>
            <td class="colon">:</td>
            <td class="value">
              <span class="badge ${session.score >= (session.passing_score ?? 70) ? 'badge-emerald' : 'badge-rose'}">
                ${session.score >= (session.passing_score ?? 70) ? 'LULUS AMAN' : 'BELUM MEMENUHI PASSING GRADE'}
              </span>
            </td>
          </tr>
        </table>

        <!-- Result KPI -->
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num" style="color: #10b981;">${session.correct_count ?? 0}</div>
            <div class="kpi-label">Jawaban Benar</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #f43f5e;">${session.wrong_count ?? 0}</div>
            <div class="kpi-label">Jawaban Salah</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #64748b;">${session.empty_count ?? 0}</div>
            <div class="kpi-label">Tidak Dijawab</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #1e3a8a; font-size: 20pt;">${session.score ?? 0}</div>
            <div class="kpi-label">Skor Akhir (Skala 100)</div>
          </div>
        </div>

        <div class="section-title">Daftar Analisis Butir Soal & Kunci Jawaban</div>

        <!-- Question Items -->
        <div class="question-list">
          ${items.map((q) => {
            const statusClass = q.is_correct ? 'correct' : (q.is_answered ? 'wrong' : 'empty');
            const statusBadge = q.is_correct 
              ? '<span class="badge badge-emerald">Benar ✓</span>' 
              : (q.is_answered ? '<span class="badge badge-rose">Salah ✗</span>' : '<span class="badge badge-slate">Kosong -</span>');

            const renderOptionText = (val) => {
              if (val === null || val === undefined || val === '') return 'Tidak Menjawab';
              if (q.options && q.options[val]) return `(${val}) ${q.options[val]}`;
              return String(val);
            };

            return `
              <div class="question-item ${statusClass} avoid-break">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div>
                    <strong style="font-size: 9.5pt; color: #1e3a8a;">Soal No. ${q.number}</strong>
                    <span style="font-size: 8pt; color: #64748b; margin-left: 8px;">[${q.subtest || 'Umum'}]</span>
                  </div>
                  <div>${statusBadge}</div>
                </div>

                <div style="font-size: 9pt; line-height: 1.4; color: #1e293b; margin-bottom: 10px;">
                  ${q.question_text || ''}
                </div>

                <div style="display: flex; gap: 15px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; font-size: 8.5pt;">
                  <div style="flex: 1;">
                    <span style="color: #64748b; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 2px;">Jawaban Siswa:</span>
                    <strong style="color: ${q.is_correct ? '#059669' : (q.is_answered ? '#e11d48' : '#64748b')};">
                      ${renderOptionText(q.selected_option)}
                    </strong>
                  </div>
                  <div style="flex: 1;">
                    <span style="color: #64748b; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 2px;">Kunci Jawaban Resmi:</span>
                    <strong style="color: #059669;">
                      ${renderOptionText(q.correct_option)}
                    </strong>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer Signatures -->
        <div class="signature-section avoid-break">
          <div class="signature-box">
            <p>Peserta Didik</p>
            <div class="signature-space"></div>
            <p>( ${session.student_name || '...............................'} )</p>
          </div>
          <div class="signature-box">
            <p>Dicetak pada: ${printDate}<br><strong>Admin / Penguji CBT</strong></p>
            <div class="signature-space"></div>
            <p><strong>SkorPlus Learning Center</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};

/**
 * Generate Comprehensive Analytics & Institutional School Report PDF
 */
export const printComprehensiveAnalyticsPDF = (dashboardData) => {
  if (!dashboardData) return;

  const { schools_stats = {}, cbt_analytics = {}, elearning_analytics = {} } = dashboardData;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const schools = schools_stats.schools_list || [];

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Analitik Komprehensif - SkorPlus Learning Center</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="doc-container">
        <!-- Letterhead -->
        <div class="letterhead">
          <img src="/assets/skorpluss_logo.png" alt="SkorPlus" class="letterhead-logo" onerror="this.style.display='none'" />
          <div class="letterhead-text">
            <h1>SKORPLUS LEARNING CENTER</h1>
            <h2>Laporan Eksekutif Analitik & Evaluasi Akademik</h2>
            <p>Jalan Pendidikan No. 45, Indonesia · Website: https://skorplus.id · Email: info@skorplus.id</p>
          </div>
        </div>
        <div class="letterhead-line2"></div>

        <!-- Title -->
        <div class="doc-title">
          <h3>Laporan Eksekutif Performa Mitra Sekolah & CBT</h3>
          <p>Tanggal Terbit: ${printDate}</p>
        </div>

        <!-- Global Metric Cards -->
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num">${schools_stats.total_schools ?? 0}</div>
            <div class="kpi-label">Mitra Sekolah</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${schools_stats.total_students ?? 0}</div>
            <div class="kpi-label">Total Peserta Didik</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${cbt_analytics.total_sessions_completed ?? 0}</div>
            <div class="kpi-label">Sesi CBT Selesai</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #2563eb;">${cbt_analytics.overall_avg_score ?? 0}</div>
            <div class="kpi-label">Rata-rata Skor CBT</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #059669;">${cbt_analytics.overall_pass_rate ?? 0}%</div>
            <div class="kpi-label">Tingkat Kelulusan</div>
          </div>
        </div>

        <!-- School Performance Table -->
        <div class="section-title">I. Evaluasi Capaian Mitra Sekolah</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 40%;">Nama Lembaga / Sekolah</th>
              <th style="width: 15%;" class="text-center">Total Siswa</th>
              <th style="width: 20%;" class="text-center">Rata-rata Skor CBT</th>
              <th style="width: 20%;" class="text-center">Kelulusan (%)</th>
            </tr>
          </thead>
          <tbody>
            ${schools.length > 0 ? schools.map((sc, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${sc.name || '-'}</td>
                <td class="text-center">${sc.students_count ?? 0} Siswa</td>
                <td class="text-center font-bold" style="color: #1e3a8a;">${sc.avg_cbt_score ?? 0}</td>
                <td class="text-center">
                  <span class="badge ${sc.pass_rate >= 70 ? 'badge-emerald' : 'badge-amber'}">
                    ${sc.pass_rate ?? 0}%
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" class="text-center text-slate-400">Belum ada data sekolah terdaftar.</td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- E-learning & CBT Subtest Highlights -->
        <div class="section-title">II. Ringkasan Kinerja CBT & Pembelajaran</div>
        <table class="info-table avoid-break">
          <tr>
            <td class="label">Total Kursus Aktif</td>
            <td class="colon">:</td>
            <td class="value">${elearning_analytics.total_active_courses ?? 0} Kursus</td>
            <td class="label">Total Pendaftaran Kursus</td>
            <td class="colon">:</td>
            <td class="value">${elearning_analytics.total_enrollments ?? 0} Siswa Terdaftar</td>
          </tr>
          <tr>
            <td class="label">Rata-rata Progres Belajar</td>
            <td class="colon">:</td>
            <td class="value font-bold">${elearning_analytics.avg_completion_rate ?? 0}%</td>
            <td class="label">Paket Ujian CBT Tersedia</td>
            <td class="colon">:</td>
            <td class="value">${cbt_analytics.total_active_exams ?? 0} Paket Tryout</td>
          </tr>
        </table>

        <!-- Footer Signatures -->
        <div class="signature-section avoid-break">
          <div class="signature-box">
            <p>Disusun oleh,<br><strong>Tim Penjamin Mutu Akademik</strong></p>
            <div class="signature-space"></div>
            <p><strong>Divisi Asesmen & Litbang</strong></p>
          </div>
          <div class="signature-box">
            <p>Mengetahui & Menyetujui,<br><strong>Direktur Utama</strong></p>
            <div class="signature-space"></div>
            <p><strong>SkorPlus Learning Center</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};
