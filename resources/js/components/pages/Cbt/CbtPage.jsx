import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AppLayout from '../../templates/AppLayout';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import CbtAnswerOption from '../../molecules/CbtAnswerOption';
import CbtNavigator from '../../organisms/CbtNavigator';
import CountdownTimer from '../../atoms/CountdownTimer';
import { fetchAvailableExams, fetchSessions, startSession, submitSession, setCurrentQuestion, setLocalAnswer, toggleFlag, clearSession } from '../../../features/cbt/cbtSlice';
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
  const { availableExams, sessions, currentSession, questions, answers, currentQuestion, loading, submitting, result } = useSelector((s) => s.cbt);

  const [selectedType, setSelectedType] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    dispatch(fetchAvailableExams());
    dispatch(fetchSessions());
  }, [dispatch]);

  // Select screen
  if (!currentSession) {
    return (
      <AppLayout title="Ujian CBT">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('available')} 
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'available' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Ujian Tersedia
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Riwayat Mengerjakan
            </button>
          </div>

          {activeTab === 'available' ? (
            <>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">Pilih Jenis Ujian</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Pilih subtes yang ingin Anda kerjakan hari ini.</p>
              </div>

          {availableExams && availableExams.length > 0 ? (
            <div className="flex flex-col gap-3">
              {availableExams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => setSelectedType({
                    id: exam.id,
                    is_real: true,
                    label: exam.title,
                    duration: exam.duration_minutes * 60,
                    total_questions: exam.questions_count,
                  })}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all
                    ${selectedType?.id === exam.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-600'}`}
                >
                  <span className="text-2xl">📝</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{exam.title}</p>
                    <p className="text-xs text-slate-500">{exam.duration_minutes} menit · {exam.questions_count} soal</p>
                  </div>
                  {selectedType?.id === exam.id && <span className="text-blue-400 text-lg">✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm rounded-lg border border-orange-200 dark:border-orange-800">
                Belum ada paket ujian aktif dari admin. Menampilkan soal latihan (dummy).
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
            </>
          )}

              <Button
                size="lg"
                disabled={!selectedType}
                loading={loading}
                onClick={() => dispatch(startSession({
                  exam_id: selectedType.is_real ? selectedType.id : undefined,
                  exam_type: selectedType.is_real ? 'REAL' : selectedType.id,
                  exam_title: selectedType.label,
                  duration_seconds: selectedType.duration,
                }))}
              >
                Mulai Ujian Sekarang
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">Riwayat Mengerjakan</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Daftar ujian CBT yang sudah pernah Anda kerjakan.</p>
              
              {sessions && sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map(session => (
                    <div key={session.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm transition-all hover:shadow-md">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{session.exam_title}</h3>
                        <p className="text-sm text-slate-500 mt-1">Dikerjakan pada: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(session.started_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></p>
                        <Badge color={session.status === 'submitted' ? 'emerald' : 'orange'} className="mt-3 text-xs">
                          {session.status === 'submitted' ? 'Selesai' : 'Sedang Dikerjakan'}
                        </Badge>
                      </div>
                      <div className="text-center px-6 border-l border-slate-100 dark:border-slate-800">
                        <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{session.score !== null ? session.score : '-'}</div>
                        <p className="text-xs text-slate-500 font-semibold uppercase mt-1">Nilai Akhir</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                  <span className="text-4xl mb-4 block">📝</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Belum Ada Riwayat</h3>
                  <p className="text-slate-500">Anda belum pernah mengerjakan ujian CBT sama sekali.</p>
                </div>
              )}
            </div>
          )}
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
                <div 
                  className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: question.text }}
                />
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
