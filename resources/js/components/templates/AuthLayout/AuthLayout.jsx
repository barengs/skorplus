import React from 'react';
import Logo from '../../atoms/Logo';
import ThemeToggle from '../../atoms/ThemeToggle';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-md p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1.5">{title}</h1>}
              {subtitle && <p className="text-slate-600 dark:text-slate-400 text-sm">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>

        {/* Back link */}
        <p className="text-center mt-4 text-xs text-slate-600">
          © {new Date().getFullYear()} SkorPluss Learning Center
        </p>
      </div>
    </div>
  );
}
