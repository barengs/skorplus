import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ collapsed = false, href = '/' }) {
  return (
    <Link to={href} className="flex items-center gap-2.5 group no-underline">
      <img 
        src="/assets/skorpluss_logo.png" 
        alt="SkorPluss Logo" 
        className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" 
      />
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="font-black text-base text-slate-100">
            <span className="text-blue-400">Skor</span>
            <span className="text-violet-400">Pluss</span>
          </span>
          <small className="text-slate-500 text-[10px] font-medium tracking-wide">Learning Center</small>
        </div>
      )}
    </Link>
  );
}
