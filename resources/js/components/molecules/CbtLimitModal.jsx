import React from 'react';
import Button from '../atoms/Button';

export default function CbtLimitModal({ isOpen, onClose, quotaInfo, programName }) {
  if (!isOpen) return null;

  const used = quotaInfo?.used ?? 0;
  const quota = quotaInfo?.quota ?? 0;
  const name = programName || quotaInfo?.program_name || 'Program Belajar';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Batas Pengerjaan CBT Telah Tercapai
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Anda telah menggunakan seluruh kuota pengerjaan CBT (
            <strong>
              {used} dari {quota} kali
            </strong>
            ) yang dialokasikan untuk <strong>{name}</strong>.
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-left text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <span>💡</span> Solusi & Penambahan Kuota:
            </p>
            <p>1. Lakukan upgrade ke program dengan kuota lebih tinggi atau unlimited (misal: Program Garansi).</p>
            <p>2. Hubungi Admin atau Tutor SkorPluss untuk evaluasi dan permintaan penambahan sesi tryout.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <a
            href={`https://wa.me/6281234567890?text=Halo%20Admin%20SkorPluss,%20kuota%20CBT%20saya%20telah%20mencapai%20batas%20pada%20${encodeURIComponent(name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            Hubungi Admin / Upgrade
          </a>
        </div>
      </div>
    </div>
  );
}
