import React, { useState, useEffect } from 'react';
import Button from '../atoms/Button';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const RATING_LABELS = {
  1: 'Kurang Memuaskan',
  2: 'Cukup',
  3: 'Bagus',
  4: 'Sangat Bagus',
  5: 'Luar Biasa!',
};

export default function ReviewModal({
  isOpen,
  onClose,
  targetType = 'course', // 'course' | 'program'
  targetId, // course id or program slug/id
  targetTitle,
  initialReview = null,
  onSuccess,
}) {
  const [rating, setRating] = useState(initialReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating || 5);
      setComment(initialReview.comment || '');
    } else {
      setRating(5);
      setComment('');
    }
  }, [initialReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Silakan pilih rating bintang 1 sampai 5');
      return;
    }

    try {
      setSubmitting(true);
      const url = targetType === 'program'
        ? `/programs/${targetId}/reviews`
        : `/courses/${targetId}/reviews`;

      const res = await api.post(url, {
        rating,
        comment: comment.trim(),
      });

      toast.success(res.data?.message || 'Testimoni Anda berhasil disimpan! ⭐');
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan ulasan.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarCount = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">
              Testimoni & Ulasan Siswa
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {initialReview ? 'Perbarui Ulasan Anda' : 'Beri Rating & Testimoni'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
              {targetTitle || 'Pengalaman Belajar'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Star Selection */}
          <div className="text-center py-2 space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              Bagaimana kepuasan Anda terhadap {targetType === 'program' ? 'program' : 'kursus'} ini?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-3xl sm:text-4xl transition-all hover:scale-110 focus:outline-none cursor-pointer"
                  title={`${star} Bintang`}
                >
                  <span className={star <= activeStarCount ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 h-4">
              {RATING_LABELS[activeStarCount] || ''}
            </p>
          </div>

          {/* Testimonial text input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Pengalaman & Ulasan Anda</span>
              <span className="text-[11px] text-slate-400 font-normal">Maks. 1000 karakter</span>
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan materi yang paling berkesan, gaya mengajar tutor, peningkatan pemahaman, atau tips bagi siswa lain..."
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Notice info */}
          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            💡 Ulasan dan rating Anda akan membantu siswa lain menentukan pilihan belajar dan berkontribusi langsung pada skor bintang publik kursus ini.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={submitting}
              className="h-10 px-4 rounded-lg"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="md"
              disabled={submitting}
              className="h-10 px-5 rounded-lg !bg-blue-600 hover:!bg-blue-700 text-white font-bold text-xs shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                <>
                  <FontAwesomeIcon icon={['fas', 'star']} className="mr-1.5 text-amber-300" />
                  {initialReview ? 'Perbarui Testimoni' : 'Kirim Testimoni'}
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
