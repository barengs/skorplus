import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function StatCard({ label, value, icon, trend, trendLabel, color = 'blue', to, onClick }) {
  const colors = {
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:border-violet-500/40',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
    orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20 hover:border-orange-500/40',
    gold: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
  };
  const iconColors = {
    blue: 'bg-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/20 text-violet-400',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/20 text-orange-400',
    gold: 'bg-amber-500/20 text-amber-400',
  };

  const isClickable = Boolean(to || onClick);

  const cardContent = (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color] ?? colors.blue} border rounded-lg p-5 transition-all duration-300 relative ${
        isClickable
          ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg group'
          : 'hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-md ${iconColors[color] ?? iconColors.blue} flex items-center justify-center text-lg`}>
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {trend !== undefined && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
          {isClickable && (
            <span className="text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 text-xs transition-transform group-hover:translate-x-0.5">
              <FontAwesomeIcon icon={['fas', 'arrow-right']} />
            </span>
          )}
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-0.5">{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      {trendLabel && <div className="text-xs text-slate-500 mt-1">{trendLabel}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
