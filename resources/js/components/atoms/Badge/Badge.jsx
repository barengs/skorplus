import React from 'react';

const colors = {
  blue: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  violet: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  orange: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',
  red: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  slate: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
  gold: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
};

export default function Badge({ children, color = 'blue', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color] ?? colors.blue} ${className}`}>
      {children}
    </span>
  );
}
