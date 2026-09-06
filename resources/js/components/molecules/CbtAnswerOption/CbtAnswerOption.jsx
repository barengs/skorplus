import React from 'react';

export default function CbtAnswerOption({ letter, text, selected, flagged, onClick }) {
  const state = selected
    ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-4 p-4 rounded-md border transition-all duration-150 text-left group ${state}`}
    >
      <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm border transition-colors
        ${selected
          ? 'bg-blue-500 border-blue-400 text-white'
          : 'bg-slate-700 border-slate-600 text-slate-300 group-hover:border-slate-400'
        }`}
      >
        {letter}
      </span>
      <span className="text-sm leading-relaxed pt-0.5">{text}</span>
    </button>
  );
}
