import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AcademySidebar({
  activeTab,
  onTabChange,
  currentStreak = 0,
  activeCoursesCount = 0,
  collapsed = false,
  onToggleCollapse,
}) {
  const menuItems = [
    {
      id: 'progress',
      label: 'Progress Belajar',
      icon: ['fas', 'graduation-cap'],
      badge: activeCoursesCount > 0 ? activeCoursesCount : null,
    },
    {
      id: 'streak',
      label: 'Runtutan Belajar',
      icon: ['fas', 'fire'],
      badge: currentStreak > 0 ? `${currentStreak}d` : null,
      badgeColor: 'amber',
    },
    {
      id: 'catalog',
      label: 'Katalog Kelas',
      icon: ['fas', 'compass'],
    },
  ];

  return (
    <div className="w-full md:w-60 shrink-0 self-start">
      {/* Mobile Horizontal Tabs */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-xs" />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor === 'amber'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Vertical Card Sidebar */}
      <div className="hidden md:flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              A
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                Academy
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">SkorPluss E-Learning</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-2.5 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/60'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 flex items-center justify-center ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="text-xs" />
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      item.badgeColor === 'amber'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Motivation Card */}
        <div className="p-3.5 m-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[11px]">
            <span>⚡</span>
            <span>Runtutan Belajar</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            {currentStreak > 0
              ? `Hebat! Streak belajarmu ${currentStreak} hari beruntun.`
              : 'Mulai bangun streak belajarmu hari ini!'}
          </p>
        </div>
      </div>
    </div>
  );
}
