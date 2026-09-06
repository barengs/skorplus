import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentQuestion, toggleFlag } from '../../../features/cbt/cbtSlice';
import { saveAnswer } from '../../../features/cbt/cbtSlice';

export default function CbtNavigator({ sessionId }) {
  const dispatch = useDispatch();
  const { questions, answers, currentQuestion } = useSelector((s) => s.cbt);

  const getState = (num) => {
    const ans = answers[num];
    if (ans?.is_flagged) return 'flagged';
    if (ans?.selected_option) return 'answered';
    return 'unanswered';
  };

  const stateClass = {
    answered: 'bg-blue-500 border-blue-400 text-white',
    flagged: 'bg-orange-500 border-orange-400 text-white',
    unanswered: 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500',
    current: 'bg-blue-600 border-blue-500 text-white ring-2 ring-blue-400/50',
  };

  const answered = Object.values(answers).filter((a) => a.selected_option).length;
  const flagged = Object.values(answers).filter((a) => a.is_flagged).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Navigasi Soal</div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-blue-500/10 rounded-lg p-2">
          <div className="text-blue-400 font-bold text-sm">{answered}</div>
          <div className="text-[10px] text-slate-500">Dijawab</div>
        </div>
        <div className="bg-orange-500/10 rounded-lg p-2">
          <div className="text-orange-400 font-bold text-sm">{flagged}</div>
          <div className="text-[10px] text-slate-500">Ragu</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-slate-400 font-bold text-sm">{questions.length - answered}</div>
          <div className="text-[10px] text-slate-500">Belum</div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q) => {
          const state = q.number === currentQuestion ? 'current' : getState(q.number);
          return (
            <button
              key={q.number}
              onClick={() => dispatch(setCurrentQuestion(q.number))}
              className={`h-9 w-full rounded-lg border text-xs font-bold transition-all duration-150 ${stateClass[state]}`}
            >
              {q.number}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Dijawab</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" /> Ragu-ragu</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" /> Belum</span>
      </div>
    </div>
  );
}
