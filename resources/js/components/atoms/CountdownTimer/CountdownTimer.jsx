import React, { useEffect, useState } from 'react';

export default function CountdownTimer({ durationSeconds = 0, onExpire, className = '' }) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const fmt = (n) => String(n).padStart(2, '0');

  const danger = remaining < 600; // < 10 min

  return (
    <div className={`font-mono font-bold tabular-nums ${danger ? 'text-red-400 animate-pulse' : 'text-slate-100'} ${className}`}>
      {fmt(h)}:{fmt(m)}:{fmt(s)}
    </div>
  );
}
