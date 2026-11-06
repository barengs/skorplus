import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../atoms/Button';

export default function CertificateModal({
  isOpen,
  onClose,
  course,
  user,
}) {
  const certRef = useRef(null);

  if (!isOpen || !course) return null;

  const studentName = user?.name || 'Fathur Rahman';
  const schoolName = user?.school || 'SMAN 5 Surabaya';
  const courseTitle = course.title || 'A1 – Penalaran Umum (PU) SMA';
  const instructorName = course.instructor_name || course.instructor?.name || 'Dr. Ahmad Fadli';

  const formattedDate = () => {
    if (course.completed_at) {
      try {
        const d = new Date(course.completed_at);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch (e) {
        // fallback
      }
    }
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const completionDate = formattedDate();
  const certNumber = course.certificate_number || `SKP-CERT-${String(course.id || course.course_id || 1).padStart(3, '0')}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Print Styles for Perfect Landscape Export */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 8mm; }
          body * { visibility: hidden !important; }
          #printable-certificate, #printable-certificate * { visibility: visible !important; }
          #printable-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 14px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="max-w-4xl w-full my-auto space-y-4">
        
        {/* Certificate Card Printable Container */}
        <div
          ref={certRef}
          id="printable-certificate"
          className="relative rounded-2xl p-6 sm:p-10 md:p-12 shadow-2xl overflow-hidden text-center border-2 border-amber-500/70 select-none"
          style={{
            background: 'radial-gradient(circle at 95% 75%, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.3) 30%, rgba(180, 83, 9, 0.12) 55%, transparent 75%), radial-gradient(circle at 10% 20%, rgba(30, 58, 138, 0.55) 0%, rgba(15, 23, 42, 0.7) 45%, transparent 75%), linear-gradient(135deg, #051329 0%, #071938 28%, #112240 52%, #38200e 78%, #78350f 100%)',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
          }}
        >
          {/* Subtle Top-Left Ambient Dark Blue Fluid Wave */}
          <svg className="absolute -top-16 -left-16 w-80 h-80 opacity-40 pointer-events-none" viewBox="0 0 400 400" fill="none">
            <path d="M0 0C160 50 240 140 270 400H0V0Z" fill="url(#waveNavy)" />
            <path d="M0 0C110 70 180 160 190 400H0V0Z" fill="#1E3A8A" fillOpacity="0.3" />
            <defs>
              <linearGradient id="waveNavy" x1="0" y1="0" x2="300" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E40AF" stopOpacity="0.6" />
                <stop offset="1" stopColor="#0F172A" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Double Frame Inner Margin Line */}
          <div className="absolute inset-2 sm:inset-3 border border-amber-400/25 rounded-xl pointer-events-none" />

          {/* Decorative Corner Ornaments (Gold Brackets) */}
          <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 w-6 h-6 sm:w-9 sm:h-9 border-t-2 border-l-2 border-amber-400/90 pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 w-6 h-6 sm:w-9 sm:h-9 border-t-2 border-r-2 border-amber-400/90 pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 w-6 h-6 sm:w-9 sm:h-9 border-b-2 border-l-2 border-amber-400/90 pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 w-6 h-6 sm:w-9 sm:h-9 border-b-2 border-r-2 border-amber-400/90 pointer-events-none" />

          {/* Large Watermark Text Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none overflow-hidden">
            <span className="text-6xl sm:text-8xl md:text-9xl font-black tracking-[0.16em] text-white whitespace-nowrap">
              SKORPLUSS
            </span>
          </div>

          {/* Header: SkorPluss Brand Logo & Bright Tagline */}
          <div className="flex flex-col items-center mb-5 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-1.5">
              <img
                src="/assets/skorpluss_logo.png"
                alt="SkorPluss Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow select-none"
              />
              <div className="flex flex-col items-start leading-none text-left">
                <div className="text-2xl sm:text-3xl font-black tracking-tight">
                  <span className="text-white">Skor</span>
                  <span className="text-amber-500">Pluss</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 w-full justify-center">
                  <span className="h-[1px] w-3.5 bg-amber-400/80 rounded-full" />
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
                    Learning Center
                  </span>
                  <span className="h-[1px] w-3.5 bg-amber-400/80 rounded-full" />
                </div>
              </div>
            </div>

            <div className="h-[1px] w-48 sm:w-64 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent my-2" />
            
            {/* Teks Lebih Terang untuk "Bimbingan Belajar & Konsultasi Pendidikan" */}
            <span className="text-xs sm:text-sm md:text-base font-serif font-semibold tracking-wide text-amber-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] mt-0.5">
              Bimbingan Belajar &amp; Konsultasi Pendidikan
            </span>
          </div>

          {/* Certificate Title */}
          <div className="my-5 sm:my-7 relative z-10">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-widest text-white uppercase font-serif drop-shadow-md">
              SERTIFIKAT KELULUSAN
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-amber-200/90 italic font-serif tracking-wide mt-1">
              Certificate of Course Completion &amp; Mastery
            </p>
          </div>

          {/* Recipient Section */}
          <div className="my-5 sm:my-6 relative z-10">
            <p className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-[0.25em] font-semibold">
              DIBERIKAN DENGAN BANGGA KEPADA:
            </p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mt-2 mb-1 tracking-tight drop-shadow-sm font-sans">
              {studentName}
            </h1>
            <div className="w-48 sm:w-64 h-[1.5px] bg-gradient-to-r from-transparent via-slate-300/60 to-transparent mx-auto my-1.5" />
            <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
              {schoolName}
            </p>
          </div>

          {/* English Description */}
          <div className="max-w-2xl mx-auto my-5 sm:my-6 text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-normal relative z-10">
            Has successfully completed with distinction <span className="text-amber-400 font-bold">(100%)</span> the entire curriculum, learning modules, evaluation quizzes, and applied assignments for the course:
            <div className="text-base sm:text-xl md:text-2xl font-black text-white my-3 tracking-tight drop-shadow-sm font-sans">
              &ldquo;{courseTitle}&rdquo;
            </div>
          </div>

          {/* Signatures & Metadata Footer */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-6 border-t border-amber-500/25 text-left text-xs text-slate-300 relative z-10">
            {/* Left Column: Number & Issue Date */}
            <div className="text-left space-y-2.5">
              <div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-semibold">NO. SERTIFIKAT</p>
                <p className="font-mono font-bold text-slate-100 text-[11px] sm:text-xs truncate mt-0.5">
                  {certNumber}
                </p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-semibold">TANGGAL TERBIT</p>
                <p className="font-semibold text-slate-200 text-xs sm:text-sm mt-0.5">{completionDate}</p>
              </div>
            </div>

            {/* Center Column: Official Verified Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-double border-amber-400/90 bg-gradient-to-br from-amber-500/20 via-amber-600/30 to-amber-950/70 flex flex-col items-center justify-center p-1.5 text-amber-300 font-bold uppercase tracking-wider shadow-lg shadow-amber-950/60 relative">
                <FontAwesomeIcon icon={['fas', 'award']} className="text-lg sm:text-xl text-amber-400 mb-0.5" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none">VERIFIED</span>
                <span className="text-[7px] sm:text-[8px] font-bold tracking-widest text-amber-400/90 leading-none mt-0.5">SKORPLUSS</span>
              </div>
            </div>

            {/* Right Column: Instructor / Tutor */}
            <div className="text-right">
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-semibold">TUTOR PENGAMPU</p>
              <p className="font-bold text-white text-xs sm:text-base mt-3.5 drop-shadow-xs">
                {instructorName}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Master Instructor SkorPluss</p>
            </div>
          </div>

        </div>

        {/* Action Buttons Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sertifikat digital resmi berverifikasi, siap dicetak atau disimpan sebagai PDF.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold"
            >
              Tutup
            </Button>
            <Button
              color="amber"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-bold flex items-center gap-2 !bg-amber-500 hover:!bg-amber-600 text-white"
            >
              <FontAwesomeIcon icon={['fas', 'print']} />
              Cetak / Simpan PDF
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
