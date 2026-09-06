import React from 'react';

export default function StatCard({ label, value, icon, trend, trendLabel, color = 'blue' }) {
  const colors = {
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
    gold: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
  };
  const iconColors = {
    blue: 'bg-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/20 text-violet-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/20 text-orange-400',
    gold: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color] ?? colors.blue} border rounded-lg p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-md ${iconColors[color] ?? iconColors.blue} flex items-center justify-center text-lg`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-0.5">{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      {trendLabel && <div className="text-xs text-slate-500 mt-1">{trendLabel}</div>}
    </div>
  );
}
