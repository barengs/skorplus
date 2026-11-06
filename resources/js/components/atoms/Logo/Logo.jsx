import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ collapsed = false, href = '/', size = 'md' }) {
  const isLg = size === 'lg';

  return (
    <Link to={href} className={`flex items-center ${isLg ? 'gap-3' : 'gap-2.5'} group no-underline`}>
      <img 
        src="/assets/skorpluss_logo.png" 
        alt="SkorPluss Logo" 
        className={`${isLg ? 'w-12 h-12' : 'w-10 h-10'} object-contain group-hover:scale-105 transition-transform`} 
      />
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className={`font-black ${isLg ? 'text-xl tracking-tight' : 'text-base'} text-slate-100`}>
            <span className="text-blue-500 dark:text-blue-400">Skor</span>
            <span className="text-violet-500 dark:text-violet-400">Pluss</span>
          </span>
          <small className={`text-slate-500 dark:text-slate-400 ${isLg ? 'text-xs mt-0.5' : 'text-[10px]'} font-medium tracking-wide`}>
            Learning Center
          </small>
        </div>
      )}
    </Link>
  );
}
