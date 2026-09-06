import React from 'react';
import Input from '../../atoms/Input';

export default function FormField({ label, error, hint, children, className = '', ...props }) {
  // If children provided, wrap them; otherwise render Input
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {children ? (
        <>
          {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
          {children}
          {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </>
      ) : (
        <Input label={label} error={error} {...props} />
      )}
    </div>
  );
}
