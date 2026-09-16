import React from 'react';

export default function CbtAnswerOption({ letter, text, selected, flagged, onClick }) {
  const state = selected
    ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-900 dark:text-blue-300 ring-1 ring-blue-500/50'
    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all duration-150 text-left group shadow-sm hover:shadow-md ${state}`}
    >
      <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm border transition-colors
        ${selected
          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:border-slate-400 dark:group-hover:border-slate-500'
        }`}
      >
        {letter}
      </span>
      <div 
        className="text-sm leading-relaxed pt-1.5 prose-sm prose-slate dark:prose-invert max-w-none flex-1"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </button>
  );
}
