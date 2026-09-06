import React from 'react';

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };

export default function Avatar({ name = '', src = null, size = 'md', className = '' }) {
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-slate-700 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white ring-2 ring-slate-700 ${className}`}
      title={name}
    >
      {initials || '?'}
    </div>
  );
}
