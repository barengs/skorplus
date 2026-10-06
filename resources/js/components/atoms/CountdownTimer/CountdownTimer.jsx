import React, { useEffect, useState } from 'react';

export default function CountdownTimer({ durationSeconds = 0, onExpire, className = '' }) {
  const parseSeconds = (s) => (Number.isFinite(Number(s)) && Number(s) >= 0 ? Math.floor(Number(s)) : 0);
  const [remaining, setRemaining] = useState(() => parseSeconds(durationSeconds));

  useEffect(() => {
    setRemaining(parseSeconds(durationSeconds));
  }, [durationSeconds]);

  useEffect(() => {
    if (parseSeconds(durationSeconds) > 0 && remaining <= 0) {
      onExpire?.();
      return;
    }
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining, durationSeconds]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const fmt = (n) => String(n).padStart(2, '0');

  const danger = remaining > 0 && remaining < 300; // < 5 min

  return (
    <span className={`font-mono font-bold tabular-nums tracking-wide inline-block ${
      danger ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-900 dark:text-slate-100'
    } ${className}`}>
      {h > 0 ? `${fmt(h)}:${fmt(m)}:${fmt(s)}` : `${fmt(m)}:${fmt(s)}`}
    </span>
  );
}
