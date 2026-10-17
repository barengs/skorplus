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
 * Helper to render SkorPlus official letterhead (Kop Surat)
 */
const renderLetterheadHtml = (docSubtitle = 'Laporan Eksekutif Analitik & Evaluasi Akademik') => `
  <div class="letterhead">
    <img src="/assets/skorpluss_logo.png" alt="SkorPlus" class="letterhead-logo" onerror="this.style.display='none'" />
    <div class="letterhead-text">
      <h1>SKORPLUS LEARNING CENTER</h1>
      <h2>${docSubtitle}</h2>
      <p>Jalan Pendidikan No. 45, Indonesia · Website: https://skorplus.id · Email: info@skorplus.id</p>
    </div>
  </div>
  <div class="letterhead-line2"></div>
`;

/**
 * Helper to render official signature block
 */
const renderSignaturesHtml = (
  leftTitle = 'Disusun oleh,',
  leftRole = 'Tim Penjamin Mutu Akademik',
  leftDept = 'Divisi Asesmen & Litbang',
  rightTitle = 'Mengetahui & Menyetujui,',
  rightRole = 'Direktur Utama / Pimpinan',
  rightDept = 'SkorPlus Learning Center'
) => {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div class="signature-section avoid-break">
      <div class="signature-box">
        <p>${leftTitle}<br><strong>${leftRole}</strong></p>
        <div class="signature-space"></div>
        <p><strong>${leftDept}</strong></p>
      </div>
      <div class="signature-box">
        <p>${rightTitle}<br><strong>${rightRole}</strong></p>
        <div class="signature-space"></div>
        <p><strong>${rightDept}</strong><br><span style="font-size: 7.5pt; color: #64748b;">Tanggal: ${printDate}</span></p>
      </div>
    </div>
  `;
};

/**
 * Generate Executive Summary Report PDF (Tab: Ringkasan)
 */
export const printExecutiveSummaryPDF = (dashboardData) => {
  if (!dashboardData) return;

  const { summary = {}, schools_stats = {}, cbt_stats = {}, materials_stats = {} } = dashboardData;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const topSchools = schools_stats.top_by_performance || [];
  const challengingExams = (cbt_stats.exams_ranking || []).slice(0, 5).sort((a, b) => a.avg_score - b.avg_score);

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Ringkasan Eksekutif - SkorPlus</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="doc-container">
        ${renderLetterheadHtml('Ringkasan Eksekutif & Key Performance Indicators (KPI)')}

        <div class="doc-title">
          <h3>Laporan Ringkasan Eksekutif Akademik</h3>
          <p>Periode Evaluasi: Keseluruhan Data Aktif · Diterbitkan: ${printDate}</p>
        </div>

        <!-- 4 Pilar KPI Cards -->
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num">${summary.total_schools ?? 0}</div>
            <div class="kpi-label">Mitra Sekolah</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${summary.total_students_partner ?? 0}</div>
            <div class="kpi-label">Siswa Mitra Aktif</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #2563eb;">${summary.total_cbt_sessions ?? 0}</div>
            <div class="kpi-label">Penyelesaian CBT</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #059669;">${summary.avg_cbt_score ?? 0} pts</div>
            <div class="kpi-label">Rata-rata Skor CBT</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #d97706;">${summary.avg_course_progress ?? 0}%</div>
            <div class="kpi-label">Avg. Progres Belajar</div>
          </div>
        </div>

        <!-- Top Sekolah -->
        <div class="section-title">I. Peringkat Sekolah dengan Kinerja CBT Terbaik</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 8%;" class="text-center">Rank</th>
              <th style="width: 47%;">Nama Lembaga / Sekolah Mitra</th>
              <th style="width: 20%;" class="text-center">Siswa Terdaftar</th>
              <th style="width: 25%;" class="text-center">Rata-rata Skor CBT</th>
            </tr>
          </thead>
          <tbody>
            ${topSchools.length > 0 ? topSchools.map((sch, i) => `
              <tr>
                <td class="text-center font-bold">${i + 1}</td>
                <td class="font-bold">${sch.name || '-'}</td>
                <td class="text-center">${sch.students_count ?? 0} Siswa</td>
                <td class="text-center font-bold" style="color: #059669;">${sch.avg_cbt_score ?? 0} pts</td>
              </tr>
            `).join('') : `
              <tr><td colspan="4" class="text-center text-slate-400">Belum ada data capaian sekolah.</td></tr>
            `}
          </tbody>
        </table>

        <!-- Tantangan CBT Terberat -->
        <div class="section-title">II. Paket Soal CBT Paling Menantang (Skor Terendah)</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 8%;" class="text-center">No</th>
              <th style="width: 42%;">Nama Paket Ujian</th>
              <th style="width: 15%;" class="text-center">Peserta</th>
              <th style="width: 15%;" class="text-center">KKM</th>
              <th style="width: 20%;" class="text-center">Rata-rata Skor</th>
            </tr>
          </thead>
          <tbody>
            ${challengingExams.length > 0 ? challengingExams.map((ex, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td class="font-bold">${ex.title || '-'}</td>
                <td class="text-center">${ex.participants_count ?? 0} Siswa</td>
                <td class="text-center">${ex.passing_score ?? 70}</td>
                <td class="text-center font-bold" style="color: #dc2626;">${ex.avg_score ?? 0} pts</td>
              </tr>
            `).join('') : `
              <tr><td colspan="5" class="text-center text-slate-400">Belum ada data evaluasi CBT.</td></tr>
            `}
          </tbody>
        </table>

        <!-- E-learning & Kurikulum Highlights -->
        <div class="section-title">III. Ringkasan Eksekutif Pembelajaran (E-Learning)</div>
        <table class="info-table avoid-break">
          <tr>
            <td class="label">Total Kursus Aktif</td>
            <td class="colon">:</td>
            <td class="value">${materials_stats.active_courses ?? 0} dari ${materials_stats.total_courses ?? 0} Kursus</td>
            <td class="label">Total Modul & Bab</td>
            <td class="colon">:</td>
            <td class="value">${materials_stats.total_modules ?? 0} Modul (${materials_stats.total_lessons ?? 0} Materi)</td>
          </tr>
          <tr>
            <td class="label">Total Siswa Terdaftar</td>
            <td class="colon">:</td>
            <td class="value">${materials_stats.total_enrollments ?? 0} Pendaftaran</td>
            <td class="label">Tingkat Kelulusan Kursus</td>
            <td class="colon">:</td>
            <td class="value font-bold" style="color: #059669;">${materials_stats.completion_rate ?? 0}% Selesai 100%</td>
          </tr>
        </table>

        ${renderSignaturesHtml()}
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};

/**
 * Generate School Partner Analytics Report PDF (Tab: Analitik Sekolah)
 */
export const printSchoolAnalyticsPDF = (schoolsData, dashboardData) => {
  const schools = schoolsData?.schools_list || dashboardData?.schools_stats?.schools_list || [];
  const stats = schoolsData || dashboardData?.schools_stats || {};
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
      <title>Laporan Analitik Mitra Sekolah - SkorPlus</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="doc-container">
        ${renderLetterheadHtml('Laporan Evaluasi & Kinerja Mitra Sekolah')}

        <div class="doc-title">
          <h3>Analisis Capaian & Evaluasi Institusi Mitra</h3>
          <p>Tanggal Terbit: ${printDate} · Total Mitra Terdaftar: ${stats.total_schools ?? 0} Sekolah</p>
        </div>

        <!-- Metric KPI Cards -->
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num">${stats.total_schools ?? 0}</div>
            <div class="kpi-label">Mitra Sekolah</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #059669;">${stats.active_schools ?? 0}</div>
            <div class="kpi-label">Sekolah Aktif</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #2563eb;">${stats.total_students_partner ?? 0}</div>
            <div class="kpi-label">Total Siswa Mitra</div>
          </div>
        </div>

        <!-- Tabel Lengkap Semua Sekolah -->
        <div class="section-title">I. Matriks Evaluasi Lengkap Kinerja Sekolah Mitra</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">No</th>
              <th style="width: 30%;">Nama Sekolah & Paket</th>
              <th style="width: 10%;" class="text-center">NPSN</th>
              <th style="width: 10%;" class="text-center">Siswa</th>
              <th style="width: 15%;" class="text-center">Sesi CBT</th>
              <th style="width: 15%;" class="text-center">Rata-rata CBT</th>
              <th style="width: 15%;" class="text-center">Kelulusan (%)</th>
            </tr>
          </thead>
          <tbody>
            ${schools.length > 0 ? schools.map((sc, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td>
                  <div class="font-bold">${sc.name || '-'}</div>
                  <div style="font-size: 7.5pt; color: #64748b;">Paket: ${sc.package_name || '-'}</div>
                </td>
                <td class="text-center">${sc.npsn || '-'}</td>
                <td class="text-center font-bold">${sc.students_count ?? 0}</td>
                <td class="text-center">${sc.cbt_sessions_count ?? 0} sesi</td>
                <td class="text-center font-bold" style="color: #1e40af;">${sc.avg_cbt_score ?? 0} pts</td>
                <td class="text-center">
                  <span class="badge ${sc.cbt_pass_rate >= 70 ? 'badge-emerald' : 'badge-amber'}">
                    ${sc.cbt_pass_rate ?? 0}%
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="7" class="text-center text-slate-400">Tidak ada data mitra sekolah ditemukan.</td></tr>
            `}
          </tbody>
        </table>

        ${renderSignaturesHtml()}
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};

/**
 * Generate CBT Exam Analytics Report PDF (Tab: Analitik Ujian CBT)
 */
export const printCbtAnalyticsPDF = (cbtData, dashboardData) => {
  const cbt = cbtData || dashboardData?.cbt_stats || {};
  const exams = cbt.exams_ranking || [];
  const dist = cbt.score_distribution || {};
  const totalSub = cbt.total_sessions_submitted || 1;
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
      <title>Laporan Analitik Ujian CBT - SkorPlus</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="doc-container">
        ${renderLetterheadHtml('Laporan Evaluasi & Analitik Computer-Based Testing (CBT)')}

        <div class="doc-title">
          <h3>Evaluasi Kinerja & Analisis Butir Ujian CBT</h3>
          <p>Tanggal Evaluasi: ${printDate} · Dihasilkan Otomatis oleh Sistem Penjamin Mutu</p>
        </div>

        <!-- Metric KPI Cards -->
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num">${cbt.total_exams ?? 0}</div>
            <div class="kpi-label">Paket Ujian</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${cbt.total_sessions_submitted ?? 0}</div>
            <div class="kpi-label">Sesi CBT Selesai</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #2563eb;">${cbt.avg_score ?? 0}</div>
            <div class="kpi-label">Skor Rata-Rata</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #059669;">${cbt.highest_score ?? 0}</div>
            <div class="kpi-label">Skor Tertinggi</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #d97706;">${cbt.overall_pass_rate ?? 0}%</div>
            <div class="kpi-label">Kelulusan CBT</div>
          </div>
        </div>

        <!-- Distribusi Skor Siswa -->
        <div class="section-title">I. Distribusi Perolehan Nilai Peserta Didik</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 35%;">Kategori Rentang Nilai</th>
              <th style="width: 20%;" class="text-center">Jumlah Peserta</th>
              <th style="width: 25%;" class="text-center">Persentase</th>
              <th style="width: 20%;" class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span style="color: #dc2626; font-weight: bold;">Kurang Sekali</span> (&lt; 50)</td>
              <td class="text-center font-bold">${dist.under_50 ?? 0} Siswa</td>
              <td class="text-center">${Math.round(((dist.under_50 ?? 0) / totalSub) * 100)}%</td>
              <td class="text-center"><span class="badge badge-rose">Perlu Bimbingan</span></td>
            </tr>
            <tr>
              <td><span style="color: #d97706; font-weight: bold;">Cukup</span> (50 - 69)</td>
              <td class="text-center font-bold">${dist.range_50_69 ?? 0} Siswa</td>
              <td class="text-center">${Math.round(((dist.range_50_69 ?? 0) / totalSub) * 100)}%</td>
              <td class="text-center"><span class="badge badge-amber">Remedial</span></td>
            </tr>
            <tr>
              <td><span style="color: #2563eb; font-weight: bold;">Baik</span> (70 - 84)</td>
              <td class="text-center font-bold">${dist.range_70_84 ?? 0} Siswa</td>
              <td class="text-center">${Math.round(((dist.range_70_84 ?? 0) / totalSub) * 100)}%</td>
              <td class="text-center"><span class="badge badge-blue">Lulus Standard</span></td>
            </tr>
            <tr>
              <td><span style="color: #059669; font-weight: bold;">Sangat Baik</span> (85 - 100)</td>
              <td class="text-center font-bold">${dist.range_85_100 ?? 0} Siswa</td>
              <td class="text-center">${Math.round(((dist.range_85_100 ?? 0) / totalSub) * 100)}%</td>
              <td class="text-center"><span class="badge badge-emerald">Optimal / Unggul</span></td>
            </tr>
          </tbody>
        </table>

        <!-- Tabel Kinerja Seluruh Paket Ujian -->
        <div class="section-title">II. Analisis Kinerja Paket Ujian CBT & Tingkat Kesulitan</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">No</th>
              <th style="width: 35%;">Judul Paket Ujian</th>
              <th style="width: 15%;" class="text-center">Peserta</th>
              <th style="width: 15%;" class="text-center">Avg Skor</th>
              <th style="width: 15%;" class="text-center">Kelulusan (%)</th>
              <th style="width: 15%;" class="text-center">Klasifikasi Soal</th>
            </tr>
          </thead>
          <tbody>
            ${exams.length > 0 ? exams.map((ex, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>
                  <div class="font-bold">${ex.title || '-'}</div>
                  <div style="font-size: 7.5pt; color: #64748b;">${ex.total_questions ?? 0} Soal · ${ex.duration_minutes ?? 0} Menit · KKM: ${ex.passing_score ?? 70}</div>
                </td>
                <td class="text-center">${ex.participants_count ?? 0} Siswa</td>
                <td class="text-center font-bold" style="color: #1e40af;">${ex.avg_score ?? 0}</td>
                <td class="text-center font-bold ${ex.pass_rate >= 50 ? 'text-emerald-600' : 'text-amber-600'}">
                  ${ex.pass_rate ?? 0}%
                </td>
                <td class="text-center">
                  <span class="badge badge-${ex.difficulty_color || 'slate'}">
                    ${ex.difficulty_label || 'Standar'}
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="6" class="text-center text-slate-400">Tidak ada data ujian CBT ditemukan.</td></tr>
            `}
          </tbody>
        </table>

        ${renderSignaturesHtml()}
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};

/**
 * Generate E-Learning Materials Analytics Report PDF (Tab: Analitik Materi)
 */
export const printMaterialsAnalyticsPDF = (materialsData, dashboardData) => {
  const mat = materialsData || dashboardData?.materials_stats || {};
  const courses = mat.courses_ranking || [];
  const lessonTypes = mat.lesson_types || {};
  const catBreakdown = mat.category_breakdown || {};
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
      <title>Laporan Analitik Materi Pembelajaran - SkorPlus</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="doc-container">
        ${renderLetterheadHtml('Laporan Evaluasi Kurikulum & E-Learning Siswa')}

        <div class="doc-title">
          <h3>Analisis Kinerja Materi & Efektivitas Belajar</h3>
          <p>Tanggal Evaluasi: ${printDate} · Diterbitkan oleh SkorPlus Learning Center</p>
        </div>

        <!-- Metric KPI Cards -->
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num">${mat.active_courses ?? 0} / ${mat.total_courses ?? 0}</div>
            <div class="kpi-label">Kursus Aktif</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${mat.total_modules ?? 0}</div>
            <div class="kpi-label">Total Modul/Bab</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${mat.total_lessons ?? 0}</div>
            <div class="kpi-label">Total Sesi Pelajaran</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #2563eb;">${mat.total_enrollments ?? 0}</div>
            <div class="kpi-label">Pendaftaran Siswa</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #059669;">${mat.avg_progress ?? 0}%</div>
            <div class="kpi-label">Avg. Progres Belajar</div>
          </div>
        </div>

        <!-- Komposisi Tipe Materi & Kategori -->
        <div class="section-title">I. Komposisi Format Pembelajaran & Kategori Materi</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 25%;">Video Interaktif</th>
              <th style="width: 25%;">Modul Teks / PDF</th>
              <th style="width: 25%;">Kuis Latihan</th>
              <th style="width: 25%;">Tugas Mandiri</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center font-bold">${lessonTypes.video ?? 0} Konten</td>
              <td class="text-center font-bold">${lessonTypes.text ?? 0} Modul</td>
              <td class="text-center font-bold">${lessonTypes.quiz ?? 0} Kuis</td>
              <td class="text-center font-bold">${lessonTypes.assignment ?? 0} Tugas</td>
            </tr>
          </tbody>
        </table>

        <!-- Kursus / Materi Terpopuler -->
        <div class="section-title">II. Peringkat Efektivitas & Minat Materi Kursus</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">No</th>
              <th style="width: 40%;">Judul Kursus / Modul</th>
              <th style="width: 20%;">Kategori</th>
              <th style="width: 15%;" class="text-center">Siswa Terdaftar</th>
              <th style="width: 20%;" class="text-center">Avg. Progres Belajar</th>
            </tr>
          </thead>
          <tbody>
            ${courses.length > 0 ? courses.map((c, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td>
                  <div class="font-bold">${c.title || '-'}</div>
                  <div style="font-size: 7.5pt; color: #64748b;">${c.total_modules ?? 0} Modul · ${c.total_lessons ?? 0} Pelajaran</div>
                </td>
                <td><span class="badge badge-blue">${c.category || 'Umum'}</span></td>
                <td class="text-center font-bold">${c.enrollments_count ?? 0} Siswa</td>
                <td class="text-center">
                  <div class="font-bold" style="color: #059669;">${c.avg_progress ?? 0}%</div>
                  <div style="font-size: 7pt; color: #64748b;">${c.completion_rate ?? 0}% tuntas</div>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="5" class="text-center text-slate-400">Tidak ada data materi kursus ditemukan.</td></tr>
            `}
          </tbody>
        </table>

        ${renderSignaturesHtml()}
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};

/**
 * Generate School Students Roster PDF (Drill-down Data Siswa Sekolah Mitra)
 */
export const printSchoolStudentsPDF = (school, students = []) => {
  if (!school) return;

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalWithScore = students.filter(s => s.last_cbt_score !== null && s.last_cbt_score !== undefined).length;
  const avgScore = totalWithScore > 0
    ? Math.round((students.reduce((sum, s) => sum + (Number(s.last_cbt_score) || 0), 0) / totalWithScore) * 10) / 10
    : 0;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Data Siswa Mitra - ${school.name || 'Sekolah'}</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="doc-container">
        ${renderLetterheadHtml('Rekapitulasi Data Siswa Sekolah Mitra')}

        <div class="doc-title">
          <h3>Daftar Siswa & Evaluasi Belajar: ${school.name || '-'}</h3>
          <p>Tanggal Unduh: ${printDate} · Total Siswa Terdaftar: ${students.length} Siswa</p>
        </div>

        <!-- Ringkasan Sekolah -->
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num">${students.length}</div>
            <div class="kpi-label">Total Siswa</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #2563eb;">${totalWithScore}</div>
            <div class="kpi-label">Pernah Ujian CBT</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #059669;">${avgScore} pts</div>
            <div class="kpi-label">Rata-rata Skor CBT</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #d97706;">${students.filter(s => s.is_active).length}</div>
            <div class="kpi-label">Siswa Aktif</div>
          </div>
        </div>

        <!-- Tabel Siswa -->
        <div class="section-title">Daftar Siswa Terdaftar & Skor CBT Terakhir</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">No</th>
              <th style="width: 35%;">Nama Lengkap & NISN</th>
              <th style="width: 15%;">Program</th>
              <th style="width: 25%;" class="text-center">Skor CBT Terakhir</th>
              <th style="width: 20%;">Aktivitas Terakhir</th>
            </tr>
          </thead>
          <tbody>
            ${students.length > 0 ? students.map((st, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td>
                  <div class="font-bold">${st.name || '-'}</div>
                  <div style="font-size: 7.5pt; color: #64748b;">NISN: ${st.nisn || '-'} · ${st.email || '-'}</div>
                </td>
                <td><span class="badge badge-slate">${st.program || 'Reguler'}</span></td>
                <td class="text-center">
                  ${st.last_cbt_score !== null && st.last_cbt_score !== undefined ? `
                    <div class="font-bold" style="color: ${Number(st.last_cbt_score) >= 70 ? '#059669' : '#d97706'}; font-size: 10pt;">
                      ${st.last_cbt_score} pts
                    </div>
                    <div style="font-size: 7pt; color: #64748b;">${st.last_cbt_title || 'Ujian CBT'}</div>
                  ` : '<span style="font-size: 8pt; color: #94a3b8; font-style: italic;">Belum ada ujian</span>'}
                </td>
                <td style="font-size: 8pt; color: #475569;">
                  ${st.last_activity || '-'}
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="5" class="text-center text-slate-400">Tidak ada data siswa.</td></tr>
            `}
          </tbody>
        </table>

        ${renderSignaturesHtml(
          'Diverifikasi oleh,',
          'Koordinator Akademik Mitra',
          school.name || 'Sekolah Mitra',
          'Mengetahui,',
          'Kepala Lembaga / Direktur',
          'SkorPlus Learning Center'
        )}
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};

/**
 * Generate Comprehensive Analytics Report PDF (Master All-In-One Document)
 * Combines Executive Summary, School Performance, CBT Evaluation, and E-Learning Curriculum
 */
export const printComprehensiveAnalyticsPDF = (dashboardData) => {
  if (!dashboardData) return;

  const { summary = {}, schools_stats = {}, cbt_stats = {}, materials_stats = {} } = dashboardData;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const schools = schools_stats.schools_list || [];
  const exams = cbt_stats.exams_ranking || [];
  const dist = cbt_stats.score_distribution || {};
  const totalSub = cbt_stats.total_sessions_submitted || 1;
  const courses = materials_stats.courses_ranking || [];
  const lessonTypes = materials_stats.lesson_types || {};

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
        ${renderLetterheadHtml('Laporan Eksekutif Analitik & Evaluasi Akademik Komprehensif')}

        <!-- Title -->
        <div class="doc-title">
          <h3>Laporan Analitik Komprehensif Institusi & Akademik</h3>
          <p>Dokumen Evaluasi Lengkap: Mitra Sekolah, Computer-Based Testing (CBT), dan E-Learning · Diterbitkan: ${printDate}</p>
        </div>

        <!-- BAB I: RINGKASAN EKSEKUTIF -->
        <div class="section-title">Bab I. Ringkasan Eksekutif & Key Performance Indicators (KPI)</div>
        <div class="kpi-grid avoid-break">
          <div class="kpi-card">
            <div class="kpi-num">${summary.total_schools ?? 0}</div>
            <div class="kpi-label">Mitra Sekolah</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">${summary.total_students_partner ?? 0}</div>
            <div class="kpi-label">Total Siswa</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #2563eb;">${summary.total_cbt_sessions ?? 0}</div>
            <div class="kpi-label">Sesi CBT Selesai</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #059669;">${summary.avg_cbt_score ?? 0} pts</div>
            <div class="kpi-label">Rata-rata Skor CBT</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #d97706;">${summary.avg_course_progress ?? 0}%</div>
            <div class="kpi-label">Avg. Progres Belajar</div>
          </div>
        </div>

        <!-- BAB II: ANALISIS SEKOLAH -->
        <div class="section-title">Bab II. Evaluasi Kinerja Mitra Sekolah</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">No</th>
              <th style="width: 32%;">Lembaga / Sekolah Mitra</th>
              <th style="width: 13%;" class="text-center">Paket</th>
              <th style="width: 10%;" class="text-center">Siswa</th>
              <th style="width: 12%;" class="text-center">Sesi CBT</th>
              <th style="width: 14%;" class="text-center">Avg Skor</th>
              <th style="width: 14%;" class="text-center">Kelulusan (%)</th>
            </tr>
          </thead>
          <tbody>
            ${schools.length > 0 ? schools.map((sc, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${sc.name || '-'}</td>
                <td class="text-center" style="font-size: 7.5pt;">${sc.package_name || '-'}</td>
                <td class="text-center font-bold">${sc.students_count ?? 0}</td>
                <td class="text-center">${sc.cbt_sessions_count ?? 0}</td>
                <td class="text-center font-bold" style="color: #1e40af;">${sc.avg_cbt_score ?? 0}</td>
                <td class="text-center">
                  <span class="badge ${sc.cbt_pass_rate >= 70 ? 'badge-emerald' : 'badge-amber'}">
                    ${sc.cbt_pass_rate ?? 0}%
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="7" class="text-center text-slate-400">Belum ada data sekolah terdaftar.</td></tr>
            `}
          </tbody>
        </table>

        <!-- BAB III: ANALISIS CBT & DISTRIBUSI -->
        <div class="section-title">Bab III. Analisis Computer-Based Testing (CBT) & Distribusi Skor</div>
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 35%;">Rentang Skor Siswa</th>
              <th style="width: 20%;" class="text-center">Jumlah Peserta</th>
              <th style="width: 25%;" class="text-center">Proporsi</th>
              <th style="width: 20%;" class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Kurang Sekali (&lt; 50)</td>
              <td class="text-center font-bold">${dist.under_50 ?? 0}</td>
              <td class="text-center">${Math.round(((dist.under_50 ?? 0) / totalSub) * 100)}%</td>
              <td class="text-center"><span class="badge badge-rose">Perlu Bimbingan</span></td>
            </tr>
            <tr>
              <td>Cukup (50 - 69)</td>
              <td class="text-center font-bold">${dist.range_50_69 ?? 0}</td>
              <td class="text-center">${Math.round(((dist.range_50_69 ?? 0) / totalSub) * 100)}%</td>
              <td class="text-center"><span class="badge badge-amber">Remedial</span></td>
            </tr>
            <tr>
              <td>Baik (70 - 84)</td>
              <td class="text-center font-bold">${dist.range_70_84 ?? 0}</td>
              <td class="text-center">${Math.round(((dist.range_70_84 ?? 0) / totalSub) * 100)}%</td>
              <td class="text-center"><span class="badge badge-blue">Standard Lulus</span></td>
            </tr>
            <tr>
              <td>Sangat Baik (85 - 100)</td>
              <td class="text-center font-bold">${dist.range_85_100 ?? 0}</td>
              <td class="text-center">${Math.round(((dist.range_85_100 ?? 0) / totalSub) * 100)}%</td>
              <td class="text-center"><span class="badge badge-emerald">Optimal</span></td>
            </tr>
          </tbody>
        </table>

        <!-- Peringkat Paket Ujian -->
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">No</th>
              <th style="width: 40%;">Paket Soal CBT</th>
              <th style="width: 15%;" class="text-center">Peserta</th>
              <th style="width: 20%;" class="text-center">Rata-rata Skor</th>
              <th style="width: 20%;" class="text-center">Tingkat Kesulitan</th>
            </tr>
          </thead>
          <tbody>
            ${exams.slice(0, 8).map((ex, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${ex.title || '-'}</td>
                <td class="text-center">${ex.participants_count ?? 0} Siswa</td>
                <td class="text-center font-bold" style="color: #1e40af;">${ex.avg_score ?? 0} pts</td>
                <td class="text-center"><span class="badge badge-${ex.difficulty_color || 'slate'}">${ex.difficulty_label || 'Sedang'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- BAB IV: ANALISIS MATERI & KURIKULUM -->
        <div class="section-title">Bab IV. Analisis Kurikulum & Efektivitas E-Learning</div>
        <table class="info-table avoid-break">
          <tr>
            <td class="label">Total Kursus Aktif</td>
            <td class="colon">:</td>
            <td class="value">${materials_stats.active_courses ?? 0} dari ${materials_stats.total_courses ?? 0} Kursus</td>
            <td class="label">Total Lesson Materi</td>
            <td class="colon">:</td>
            <td class="value">${materials_stats.total_lessons ?? 0} Pelajaran (${lessonTypes.video ?? 0} Video, ${lessonTypes.text ?? 0} Teks)</td>
          </tr>
          <tr>
            <td class="label">Total Siswa Terdaftar</td>
            <td class="colon">:</td>
            <td class="value font-bold">${materials_stats.total_enrollments ?? 0} Pendaftaran</td>
            <td class="label">Rata-rata Progres Belajar</td>
            <td class="colon">:</td>
            <td class="value font-bold" style="color: #059669;">${materials_stats.avg_progress ?? 0}%</td>
          </tr>
        </table>

        <!-- Materi Terpopuler -->
        <table class="data-table avoid-break">
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">No</th>
              <th style="width: 45%;">Materi Kursus Terpopuler</th>
              <th style="width: 25%;">Kategori</th>
              <th style="width: 25%;" class="text-center">Peserta Terdaftar</th>
            </tr>
          </thead>
          <tbody>
            ${courses.slice(0, 5).map((c, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td class="font-bold">${c.title || '-'}</td>
                <td><span class="badge badge-blue">${c.category || 'Umum'}</span></td>
                <td class="text-center font-bold">${c.enrollments_count ?? 0} Siswa</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Footer Signatures -->
        ${renderSignaturesHtml()}
      </div>
    </body>
    </html>
  `;

  printDocumentHtml(html);
};

