import React from 'react';
import { NavLink } from 'react-router-dom';

export default function NavItem({ to, icon, label, collapsed = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group
        ${isActive
          ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800'
        }`
      }
      title={collapsed ? label : undefined}
    >
      <span className="text-base shrink-0 w-5 text-center">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}
