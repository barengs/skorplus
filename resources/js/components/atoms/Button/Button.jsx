import React from 'react';

// ponytail: cva installed if needed — using manual variant map for zero deps
const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants = {
  // Bootstrap Primary (solid clean blue, no gradients)
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:ring-blue-500 active:bg-blue-800',
  // Bootstrap Secondary
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400',
  // Bootstrap Outline Default
  outline: 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs focus-visible:ring-slate-400',
  // Bootstrap Outline Primary
  'outline-primary': 'bg-white hover:bg-blue-50 text-blue-600 dark:bg-slate-900 dark:hover:bg-blue-950/40 dark:text-blue-400 border border-blue-400 dark:border-blue-700 shadow-xs focus-visible:ring-blue-500',
  // Bootstrap Soft Primary (Soft background, colored text)
  soft: 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 focus-visible:ring-blue-400',
  'soft-secondary': 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400',
  'soft-success': 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 focus-visible:ring-emerald-400',
  'soft-danger': 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 focus-visible:ring-rose-400',
  'soft-warning': 'bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 focus-visible:ring-amber-400',
  ghost: 'border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white focus-visible:ring-slate-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs focus-visible:ring-red-500 active:bg-red-800',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-emerald-500 active:bg-emerald-800',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs focus-visible:ring-amber-500 active:bg-amber-700',
  link: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 underline-offset-4 hover:underline',
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
