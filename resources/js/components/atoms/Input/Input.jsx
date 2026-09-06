import React, { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  error,
  prefix,
  suffix,
  className = '',
  inputClassName = '',
  ...props
}, ref) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor={props.id}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-slate-600 dark:text-slate-400 text-sm">{prefix}</span>}
        <input
          ref={ref}
          className={`
            w-full bg-slate-100 dark:bg-slate-800/80 border rounded-md px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100
            placeholder:text-slate-500 outline-none transition-all duration-200
            focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-700'}
            ${prefix ? 'pl-9' : ''}
            ${suffix ? 'pr-9' : ''}
            ${inputClassName}
          `}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-slate-600 dark:text-slate-400 text-sm">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export default Input;
