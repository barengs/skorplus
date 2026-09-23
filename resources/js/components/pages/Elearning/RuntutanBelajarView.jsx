import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../atoms/Button';

export default function RuntutanBelajarView({
  streakData = {},
  currentMonthDate = new Date(),
  onMonthChange,
  onOpenCheckin,
  loading = false,
}) {
  const {
    current_streak = 0,
    longest_streak = 0,
    has_checked_in_today = false,
    monthly_checkins = {},
    weekly_tracker = [],
    leaderboard = [],
  } = streakData;

  const [hoveredDay, setHoveredDay] = useState(null);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Calculate calendar days
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    onMonthChange(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    onMonthChange(next);
  };

  const handleCurrentMonth = () => {
    onMonthChange(new Date());
  };

  // Build grid cells
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ empty: true, key: `empty-${i}` });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const checkin = monthly_checkins[dateStr] || null;
    const isToday = dateStr === todayStr;
    const isFuture = new Date(dateStr) > new Date(todayStr);

    calendarCells.push({
      empty: false,
      day: d,
      dateStr,
      checkin,
      isToday,
      isFuture,
      key: dateStr,
    });
  }

  const activeDaysCount = Object.keys(monthly_checkins).length;

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <span>Runtutan Belajar</span>
          <span className="text-amber-500">⚡</span>
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Bangun konsistensi belajar setiap hari. Semakin rutin kamu belajar, semakin mudah menguasai materi ujian!
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Streak Saat Ini */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Streak Saat Ini
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {current_streak}
              </span>
              <span className="text-sm font-bold text-slate-500">Hari Beruntun</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {has_checked_in_today ? '✓ Sudah aktif hari ini' : 'Belum ada aktivitas hari ini'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50 flex items-center justify-center text-2xl">
            ⚡
          </div>
        </div>

        {/* Card 2: Streak Terlama */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Rekor Streak Terlama
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {longest_streak}
              </span>
              <span className="text-sm font-bold text-slate-500">Hari</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Rekor komitmen belajarmu
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/50 dark:border-orange-900/50 flex items-center justify-center text-2xl">
            🔥
          </div>
        </div>

        {/* Card 3: Total Hari Aktif Bulan Ini */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Aktif Bulan {monthNames[month]}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {activeDaysCount}
              </span>
              <span className="text-sm font-bold text-slate-500">Hari Aktif</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dari {daysInMonth} hari bulan ini
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 flex items-center justify-center text-2xl">
            📅
          </div>
        </div>
      </div>

      {/* Main Content: Left Calendar + Checkin Box, Right Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left (Calendar & Log) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Calendar Card */}
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
            
            {/* Calendar Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Kalender Aktivitas</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                    {monthNames[month]} {year}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hari yang berwarna hijau menandakan kamu aktif belajar atau melakukan check-in.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors"
                  title="Bulan Sebelumnya"
                >
                  <FontAwesomeIcon icon={['fas', 'chevron-left']} />
                </button>
                <button
                  onClick={handleCurrentMonth}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Hari Ini
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors"
                  title="Bulan Berikutnya"
                >
                  <FontAwesomeIcon icon={['fas', 'chevron-right']} />
                </button>
              </div>
            </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {dayNames.map((d, i) => (
                <div key={i} className="text-xs font-bold text-slate-400 dark:text-slate-500 py-1 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell) => {
                if (cell.empty) {
                  return <div key={cell.key} className="h-14 rounded-lg bg-transparent" />;
                }

                const hasCheckin = Boolean(cell.checkin);
                const isHovered = hoveredDay === cell.dateStr;

                return (
                  <div
                    key={cell.key}
                    onMouseEnter={() => setHoveredDay(cell.dateStr)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => {
                      if (cell.isToday && !has_checked_in_today) {
                        onOpenCheckin();
                      }
                    }}
                    className={`h-14 sm:h-16 rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between transition-all relative select-none ${
                      cell.isToday && !hasCheckin
                        ? 'border-dashed border-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40'
                        : hasCheckin
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/30'
                        : cell.isFuture
                        ? 'border-transparent text-slate-300 dark:text-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          cell.isToday
                            ? 'text-blue-600 dark:text-blue-400 font-black'
                            : hasCheckin
                            ? 'text-emerald-800 dark:text-emerald-300 font-black'
                            : cell.isFuture
                            ? 'text-slate-300 dark:text-slate-600'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cell.day}
                      </span>

                      {hasCheckin && (
                        <span className="text-xs">🔥</span>
                      )}

                      {cell.isToday && !hasCheckin && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          +
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {hasCheckin ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 truncate">
                          Aktif ✓
                        </span>
                      ) : cell.isToday ? (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate">
                          Check-in
                        </span>
                      ) : null}
                    </div>

                    {/* Tooltip on hover */}
                    {isHovered && hasCheckin && cell.checkin.notes && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-slate-900 text-white text-[11px] shadow-xl z-30 pointer-events-none animate-fadeIn">
                        <p className="font-bold text-amber-400 mb-0.5">Catatan Belajar:</p>
                        <p className="line-clamp-3 text-slate-200">{cell.checkin.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
                <span>Aktif Belajar / Check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded border-2 border-dashed border-blue-500 bg-blue-50 inline-block" />
                <span>Hari Ini</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 inline-block" />
                <span>Belum Aktif</span>
              </div>
            </div>

          </div>

          {/* Quick Check-in CTA Banner */}
          <div className="p-6 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{has_checked_in_today ? 'Kamu Hebat! Check-in Hari Ini Berhasil' : 'Jangan Lupa Check-in Hari Ini!'}</span>
                <span>{has_checked_in_today ? '🎉' : '⏰'}</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                {has_checked_in_today
                  ? 'Catatan belajarmu hari ini sudah tercatat. Terus jaga konsistensi belajarmu besok!'
                  : 'Catat waktu belajarmu hari ini untuk mempertahankan streak dan meningkatkan peringkatmu.'}
              </p>
            </div>

            {!has_checked_in_today ? (
              <Button
                onClick={onOpenCheckin}
                className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs shrink-0"
              >
                Isi Check-in Sekarang →
              </Button>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0 flex items-center gap-1.5">
                <FontAwesomeIcon icon={['fas', 'check-circle']} />
                <span>Tercatat Hari Ini</span>
              </div>
            )}
          </div>

        </div>

        {/* Right (Leaderboard & Motivation) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Leaderboard Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Papan Peringkat Siswa
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Top Disiplin
              </span>
            </div>

            <div className="space-y-2.5">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      idx === 0
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40'
                        : idx === 1
                        ? 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800'
                        : idx === 2
                        ? 'bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base font-black w-5 text-center shrink-0">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.school || 'Siswa SkorPluss'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="font-black text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1">
                        <span>⚡</span>
                        <span>{item.streak} hari</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  Belum ada data peringkat.
                </p>
              )}
            </div>
          </div>

          {/* Motivational Tip Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>💡</span>
              <span>Kunci Konsistensi</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Belajar 20 menit setiap hari jauh lebih membekas di memori jangka panjang dibanding belajar sistem kebut semalam.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              #BangunKebiasaanHebat
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
