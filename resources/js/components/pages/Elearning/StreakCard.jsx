import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../atoms/Button';

export default function StreakCard({
  streakData = {},
  onOpenCheckin,
  onViewAllStreak,
}) {
  const {
    current_streak = 0,
    longest_streak = 0,
    has_checked_in_today = false,
    weekly_tracker = [],
    leaderboard = [],
  } = streakData;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-black text-lg">⚡</span>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Runtutan Belajar
          </h3>
        </div>
        <button
          onClick={onViewAllStreak}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Lihat Detail →
        </button>
      </div>

      {/* Streak Big Counter */}
      <div className="flex items-baseline justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {current_streak}
            </span>
            <span className="text-base font-bold text-slate-500 dark:text-slate-400">
              Hari Beruntun
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>🔥</span>
            <span>Streak Terlama: <strong className="text-slate-700 dark:text-slate-300">{longest_streak} hari</strong></span>
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-center text-2xl shadow-xs">
          {current_streak > 0 ? '🔥' : '⚡'}
        </div>
      </div>

      {/* 7 Days Circular Tracker */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Aktivitas 7 Hari Terakhir
        </p>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekly_tracker.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                title={`${day.date} - ${day.is_active ? 'Aktif' : 'Tidak aktif'}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  day.is_active
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : day.is_today
                    ? 'border-2 border-dashed border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                {day.is_active ? '✓' : day.is_today ? '•' : ''}
              </div>
              <span className={`text-[10px] font-semibold ${day.is_today ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'}`}>
                {day.day_name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Checkin Button */}
      <div>
        {has_checked_in_today ? (
          <div className="w-full py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={['fas', 'check-circle']} className="text-emerald-500 text-sm" />
            <span>Sudah Check-in Hari Ini ✓</span>
          </div>
        ) : (
          <Button
            onClick={onOpenCheckin}
            className="w-full !bg-blue-600 hover:!bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Isi Check-in Hari Ini</span>
          </Button>
        )}
      </div>

      {/* Mini Leaderboard Preview */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              🏆 Top Siswa Beruntun
            </span>
            <button
              onClick={onViewAllStreak}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Semua
            </button>
          </div>
          <div className="space-y-2">
            {leaderboard.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-slate-400 text-[11px] w-4">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                  ⚡ {item.streak} hr
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
