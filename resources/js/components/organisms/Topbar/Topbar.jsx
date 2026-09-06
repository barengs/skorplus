import React from 'react';
import { useSelector } from 'react-redux';
import Avatar from '../../atoms/Avatar';
import ThemeToggle from '../../atoms/ThemeToggle';

export default function Topbar({ title, onToggleSidebar }) {
  const user = useSelector((s) => s.auth.user);

  return (
    <header className="h-16 bg-slate-50 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 transition-all"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        {title && <h1 className="font-semibold text-slate-900 dark:text-slate-100 text-base">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {/* Notification bell — ponytail: real notifications when notification system built */}
        <button className="w-9 h-9 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 transition-all relative">
          🔔
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-slate-950" />
        </button>

        {user && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.roles?.[0] ?? 'siswa'}</p>
            </div>
            <Avatar name={user.name} src={user.avatar} size="sm" />
          </div>
        )}
      </div>
    </header>
  );
}
