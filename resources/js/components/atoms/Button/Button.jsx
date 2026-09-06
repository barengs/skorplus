import React from 'react';

// ponytail: cva installed if needed — using manual variant map for zero deps
const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants = {
  primary: 'bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25 focus-visible:ring-blue-500',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-slate-100 focus-visible:ring-slate-500',
  ghost: 'border border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-100 focus-visible:ring-slate-500',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 focus-visible:ring-red-500',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-500',
  link: 'text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline',
};

const sizes = {
  sm: 'h-8 px-3 text-sm rounded gap-1.5',
  md: 'h-10 px-4 text-sm rounded-md gap-2',
  lg: 'h-12 px-6 text-base rounded-md gap-2',
  xl: 'h-14 px-8 text-lg rounded-md gap-2.5',
  icon: 'h-10 w-10 rounded-md',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
