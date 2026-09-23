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

  const studentName = user?.name || 'Siswa SkorPluss';
  const courseTitle = course.title || 'Kursus Pembelajaran';
  const instructorName = course.instructor_name || 'Tim Pengajar SkorPluss';
  const completionDate = course.completed_at || '19 September 2026';
  const certNumber = `SKP-CERT-${String(course.id || course.course_id || 1).padStart(3, '0')}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-3xl w-full my-auto space-y-4">
        
        {/* Certificate Card Printable Container */}
        <div
          ref={certRef}
          id="printable-certificate"
          className="relative bg-gradient-to-b from-amber-50/60 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-8 border-double border-amber-500/40 dark:border-amber-500/30 rounded-2xl p-6 sm:p-12 shadow-2xl overflow-hidden text-center"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-amber-500/60 rounded-tl" />
          <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-amber-500/60 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-amber-500/60 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-amber-500/60 rounded-br" />

          {/* Watermark Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.04] pointer-events-none">
            <span className="text-9xl font-black">SKORPLUSS</span>
          </div>

          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-500 text-3xl sm:text-4xl">🎓</span>
              <span className="text-lg sm:text-xl font-black tracking-wider text-slate-900 dark:text-white uppercase">
                SkorPluss <span className="text-blue-600 dark:text-blue-400">Learning Center</span>
              </span>
            </div>
            <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-1" />
            <span className="text-[11px] uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
              Akademi Pembelajaran Mandiri & Bimbingan Belajar Nasional
            </span>
          </div>

          {/* Certificate Title */}
          <div className="my-6">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-serif">
              Sertifikat Kelulusan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 italic mt-1">
              Certificate of Course Completion & Mastery
            </p>
          </div>

          {/* Recipient */}
          <div className="my-6">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Diberikan dengan bangga kepada:
            </p>
            <h1 className="text-2xl sm:text-4xl font-black text-blue-700 dark:text-blue-400 mt-2 mb-1 tracking-tight">
              {studentName}
            </h1>
            <div className="w-48 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto" />
            {user?.school && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {user.school}
              </p>
            )}
          </div>

          {/* Statement */}
          <div className="max-w-xl mx-auto my-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Telah menyelesaikan dengan predikat <strong className="text-emerald-600 dark:text-emerald-400">Sangat Memuaskan (100%)</strong> seluruh kurikulum, modul materi, kuis evaluasi pemahaman, dan tugas terapan pada kursus:
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white my-3 tracking-tight">
              &ldquo;{courseTitle}&rdquo;
            </div>
          </div>

          {/* Signatures & Metadata Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end pt-6 border-t border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-400">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">No. Sertifikat</p>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs truncate">
                {certNumber}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-2">Tanggal Terbit</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{completionDate}</p>
            </div>

            {/* Official Stamp */}
            <div className="text-center hidden sm:flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-double border-amber-500/80 bg-amber-500/10 flex flex-col items-center justify-center p-1 text-[9px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider shadow-inner">
                <FontAwesomeIcon icon={['fas', 'award']} className="text-lg text-amber-500 mb-0.5" />
                <span>Verified</span>
                <span className="text-[7px]">SkorPluss</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tutor Pengampu</p>
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-4">
                {instructorName}
              </p>
              <p className="text-[10px] text-slate-400">Master Instructor SkorPluss</p>
            </div>
          </div>

        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sertifikat digital terverifikasi dan siap diunduh atau dicetak.</span>
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
