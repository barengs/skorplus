import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../atoms/Button';
import api from '../../../services/api';
import { toast } from 'react-toastify';

export default function DailyCheckinModal({ isOpen, onClose, onCheckinSuccess, currentStreak = 0 }) {
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const durationOptions = [
    { label: '15 Menit', value: 15 },
    { label: '30 Menit', value: 30 },
    { label: '45 Menit', value: 45 },
    { label: '60 Menit', value: 60 },
    { label: '90 Menit', value: 90 },
    { label: '120+ Menit', value: 120 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/elearning/checkin', {
        notes: notes ? `[${duration} menit] ${notes}` : `Belajar mandiri selama ${duration} menit`,
      });
      toast.success(res.data.message || 'Check-in hari ini berhasil dicatat! Pertahankan streak-mu!');
      if (onCheckinSuccess) {
        onCheckinSuccess(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal melakukan check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl font-black">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Check-in Belajar Harian
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Catat belajarmu hari ini untuk mempertahankan streak!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FontAwesomeIcon icon={['fas', 'times']} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Streak summary alert */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">Streak Kamu Saat Ini</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {currentStreak} Hari Beruntun
                </p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              +{1} Hari setelah check-in
            </span>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Durasi Belajar Hari Ini
            </label>
            <div className="grid grid-cols-3 gap-2">
              {durationOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                    duration === opt.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Apa yang kamu pelajari hari ini? <span className="font-normal text-slate-400 lowercase">(opsional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Belajar materi Penalaran Umum dan menyelesaikan kuis Modul 1..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Batal
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={['fas', 'check']} />
                  <span>Konfirmasi Check-in</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
