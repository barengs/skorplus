import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AppLayout from '../../templates/AppLayout';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import CbtAnswerOption from '../../molecules/CbtAnswerOption';
import CbtNavigator from '../../organisms/CbtNavigator';
import CountdownTimer from '../../atoms/CountdownTimer';
import { startSession, submitSession, setCurrentQuestion, setLocalAnswer, toggleFlag, clearSession } from '../../../features/cbt/cbtSlice';
import { saveAnswer } from '../../../features/cbt/cbtSlice';

const EXAM_TYPES = [
  { id: 'tps', label: 'TPS — Tes Potensi Skolastik', icon: '🧠', duration: 5400 },
  { id: 'pu', label: 'PU — Penalaran Umum', icon: '💡', duration: 2700 },
  { id: 'ppu', label: 'PPU — Pemahaman Bacaan', icon: '📖', duration: 2700 },
  { id: 'pm', label: 'PM — Pengetahuan Matematika', icon: '📐', duration: 1800 },
  { id: 'pk', label: 'PK — Pengetahuan dan Pemahaman Umum', icon: '🌐', duration: 1800 },
];

export default function CbtPage() {
  const dispatch = useDispatch();
  const { currentSession, questions, answers, currentQuestion, loading, submitting, result } = useSelector((s) => s.cbt);

  const [selectedType, setSelectedType] = useState(null);

  // Select screen
  if (!currentSession) {
    return (
      <AppLayout title="Ujian CBT">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">Pilih Jenis Ujian</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Pilih subtes yang ingin Anda kerjakan hari ini.</p>
          </div>

          <div className="flex flex-col gap-3">
            {EXAM_TYPES.map((et) => (
              <button
                key={et.id}
                onClick={() => setSelectedType(et)}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all
                  ${selectedType?.id === et.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-600'}`}
              >
                <span className="text-2xl">{et.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{et.label}</p>
                  <p className="text-xs text-slate-500">{Math.floor(et.duration / 60)} menit · 20 soal</p>
                </div>
                {selectedType?.id === et.id && <span className="text-blue-400 text-lg">✓</span>}
              </button>
            ))}
          </div>

          <Button
            size="lg"
            disabled={!selectedType}
            loading={loading}
            onClick={() => dispatch(startSession({
              exam_type: selectedType.id,
              exam_title: selectedType.label,
              duration_seconds: selectedType.duration,
            }))}
          >
            Mulai Ujian Sekarang
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Result screen
  if (result) {
    const score = result.score;
    const color = score >= 80 ? 'emerald' : score >= 60 ? 'orange' : 'red';
    return (
      <AppLayout title="Hasil Ujian">
        <div className="max-w-lg mx-auto text-center flex flex-col items-center gap-6 py-8">
          <div className="text-7xl">{score >= 80 ? '🏆' : score >= 60 ? '👍' : '💪'}</div>
          <div>
            <div className="text-6xl font-black text-slate-900 dark:text-slate-100 mb-2">{score}</div>
            <p className="text-slate-600 dark:text-slate-400">Skor akhir Anda</p>
          </div>
          <Badge color={color} className="text-sm px-4 py-1.5">
            {score >= 80 ? 'Sangat Baik!' : score >= 60 ? 'Cukup Baik' : 'Perlu Latihan Lagi'}
          </Badge>
          <div className="flex gap-3">
            <Button onClick={() => dispatch(clearSession())} variant="ghost">Pilih Ujian Lain</Button>
            <Button onClick={() => { dispatch(clearSession()); dispatch(startSession({ exam_type: currentSession.exam_type, exam_title: currentSession.exam_title, duration_seconds: currentSession.duration_seconds })); }}>
              Ulangi Ujian
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Exam screen
  const question = questions.find((q) => q.number === currentQuestion);
  const currentAnswers = answers[currentQuestion];

  const handleSelect = (letter) => {
    dispatch(setLocalAnswer({ question_number: currentQuestion, selected_option: letter }));
    dispatch(saveAnswer({ sessionId: currentSession.id, question_number: currentQuestion, selected_option: letter }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.length - Object.values(answers).filter((a) => a.selected_option).length;
    if (unanswered > 0) {
      const confirmed = window.confirm(`Masih ada ${unanswered} soal yang belum dijawab. Lanjutkan submit?`);
      if (!confirmed) return;
    }
    const result = await dispatch(submitSession(currentSession.id));
    if (submitSession.fulfilled.match(result)) {
      toast.success(`Ujian selesai! Skor Anda: ${result.payload.score} 🎉`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Exam main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Exam topbar */}
        <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Badge color="blue">{currentSession.exam_type?.toUpperCase()}</Badge>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">{currentSession.exam_title}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>⏱</span>
              <CountdownTimer
                durationSeconds={currentSession.duration_seconds}
                onExpire={() => { toast.error('Waktu habis! Ujian disubmit otomatis.'); dispatch(submitSession(currentSession.id)); }}
              />
            </div>
            <Button variant="danger" size="sm" onClick={handleSubmit} loading={submitting}>
              Submit Ujian
            </Button>
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-6">
          {question ? (
            <div className="max-w-2xl mx-auto flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Soal</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{question.number}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-600 dark:text-slate-400">{questions.length}</span>
                </div>
                <button
                  onClick={() => dispatch(toggleFlag(currentQuestion))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${currentAnswers?.is_flagged ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-orange-400'}`}
                >
                  🚩 {currentAnswers?.is_flagged ? 'Ragu-Ragu' : 'Tandai Ragu'}
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{question.text}</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {Object.entries(question.options).map(([letter, text]) => (
                  <CbtAnswerOption
                    key={letter}
                    letter={letter}
                    text={text}
                    selected={currentAnswers?.selected_option === letter}
                    onClick={() => handleSelect(letter)}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentQuestion <= 1}
                  onClick={() => dispatch(setCurrentQuestion(currentQuestion - 1))}
                >
                  ← Sebelumnya
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentQuestion >= questions.length}
                  onClick={() => dispatch(setCurrentQuestion(currentQuestion + 1))}
                >
                  Berikutnya →
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-20">Memuat soal...</div>
          )}
        </div>
      </div>

      {/* Navigator sidebar */}
      <div className="w-60 shrink-0 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 hidden lg:block">
        <CbtNavigator sessionId={currentSession.id} />
      </div>
    </div>
  );
}
