import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AppLayout from '../../templates/AppLayout';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import CbtAnswerOption from '../../molecules/CbtAnswerOption';
import CbtNavigator from '../../organisms/CbtNavigator';
import CountdownTimer from '../../atoms/CountdownTimer';
import CbtLimitModal from '../../molecules/CbtLimitModal';
import { fetchAvailableExams, fetchExamTypes, fetchSessions, startSession, submitSession, cancelSession, setCurrentQuestion, setLocalAnswer, toggleFlag, clearSession } from '../../../features/cbt/cbtSlice';
import { saveAnswer } from '../../../features/cbt/cbtSlice';

export default function CbtPage() {
  const dispatch = useDispatch();
  const { availableExams, examTypes = [], sessions, currentSession, questions, answers, currentQuestion, loading, submitting, result, quotaInfo } = useSelector((s) => s.cbt);

  const [selectedType, setSelectedType] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(90);
  const [isFrozen, setIsFrozen] = useState(false);
  const [graceTimeLeft, setGraceTimeLeft] = useState(60);
  const [showFrozenModal, setShowFrozenModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAvailableExams());
    dispatch(fetchExamTypes());
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleStartExam = async () => {
    if (!selectedType) return;

    if (quotaInfo && !quotaInfo.is_unlimited && quotaInfo.is_limit_reached) {
      setShowLimitModal(true);
      return;
    }

    const res = await dispatch(startSession({
      exam_id: selectedType.is_real ? selectedType.id : undefined,
      exam_type: selectedType.is_real ? 'REAL' : selectedType.id,
      exam_title: selectedType.label,
      duration_seconds: selectedType.duration,
    }));

    if (startSession.rejected.match(res)) {
      if (res.payload?.limit_reached) {
        setShowLimitModal(true);
      } else if (res.payload?.cooldown) {
        toast.warning(res.payload?.message || 'Ujian dalam masa jeda waktu istirahat.');
      } else {
        toast.error(res.payload?.message || (typeof res.payload === 'string' ? res.payload : 'Gagal memulai ujian.'));
      }
    }
  };

  const handleRetryExam = async () => {
    if (quotaInfo && !quotaInfo.is_unlimited && quotaInfo.is_limit_reached) {
      setShowLimitModal(true);
      return;
    }
    const sessionData = {
      exam_id: currentSession?.exam_id,
      exam_type: currentSession?.exam_type,
      exam_title: currentSession?.exam_title,
      duration_seconds: currentSession?.duration_seconds
    };
    dispatch(clearSession());
    const res = await dispatch(startSession(sessionData));
    if (startSession.rejected.match(res)) {
      if (res.payload?.limit_reached) {
        setShowLimitModal(true);
      } else if (res.payload?.cooldown) {
        toast.warning(res.payload?.message || 'Ujian dalam masa jeda waktu istirahat.');
      } else {
        toast.error(res.payload?.message || (typeof res.payload === 'string' ? res.payload : 'Gagal memulai ujian.'));
      }
    }
  };

  // Exam screen helpers
  const question = questions.find((q) => q.number === currentQuestion);
  const currentAnswers = answers[currentQuestion];
  const answeredCount = Object.values(answers).filter((a) => a.selected_option).length;

  const parseTimestamp = (val) => {
    if (!val) return Date.now();
    if (typeof val === 'number') return val;
    const cleaned = typeof val === 'string' && val.includes(' ') && !val.includes('T') ? val.replace(' ', 'T') : val;
    const parsed = new Date(cleaned).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
  };

  const elapsedSeconds = currentSession?.started_at
    ? Math.floor((Date.now() - parseTimestamp(currentSession.started_at)) / 1000)
    : 0;
  const durationSeconds = Number(currentSession?.duration_seconds) || 5400;
  const totalRemainingSeconds = currentSession
    ? Math.max(0, durationSeconds - elapsedSeconds)
    : 0;
  const isTimeExpired = currentSession ? totalRemainingSeconds <= 0 : false;
  const isExamFrozen = isFrozen || isTimeExpired;

  // Grace Period countdown (60 detik) saat waktu ujian habis & lembar soal dibekukan
  useEffect(() => {
    if (!currentSession || !isExamFrozen) return;

    const overtime = Math.max(0, elapsedSeconds - durationSeconds);
    const initialGrace = Math.max(0, 60 - overtime);
    setGraceTimeLeft(initialGrace);
    setShowFrozenModal(true);

    if (initialGrace <= 0) {
      if (!submitting) {
        toast.info('Waktu tenggang 60 detik telah habis. Sistem menyerahkan ujian Anda secara otomatis.', { autoClose: 5000 });
        dispatch(submitSession(currentSession.id));
      }
      return;
    }

    const interval = setInterval(() => {
      setGraceTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!submitting) {
            toast.info('Waktu tenggang 60 detik telah habis. Sistem menyerahkan ujian Anda secara otomatis.', { autoClose: 5000 });
            dispatch(submitSession(currentSession.id));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession?.id, isExamFrozen]);

  // Per-Question Timer effect
  useEffect(() => {
    if (!currentSession || !question) return;
    const dur = question.duration_seconds || 90;
    setQuestionTimeLeft(dur);
  }, [currentQuestion, question?.id, currentSession?.id]);

  useEffect(() => {
    if (!currentSession || !question || questionTimeLeft <= 0 || isExamFrozen) return;
    const timer = setTimeout(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          if (currentQuestion < questions.length) {
            toast.warning(`Waktu untuk Soal No. ${currentQuestion} telah habis! Berpindah ke nomor berikutnya.`, { autoClose: 2500 });
            dispatch(setCurrentQuestion(currentQuestion + 1));
          } else {
            toast.warning(`Waktu untuk Soal No. ${currentQuestion} telah habis!`, { autoClose: 2500 });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [questionTimeLeft, currentSession, question?.id, currentQuestion, questions.length, isExamFrozen]);

  const handleSelect = (val) => {
    if (isExamFrozen) {
      toast.warning('Waktu pengerjaan telah habis! Lembar soal telah dibekukan.');
      return;
    }

    let newAnswer = val;
    const qType = question?.question_type || 'single_choice';

    if (qType === 'multiple_choice' || qType === 'complex_choice') {
      const currentSelected = answers[currentQuestion]?.selected_option || '';
      const selectedArr = currentSelected ? currentSelected.split(',') : [];
      if (selectedArr.includes(val)) {
        newAnswer = selectedArr.filter(v => v !== val).join(',');
      } else {
        newAnswer = [...selectedArr, val].sort().join(',');
      }
    }

    dispatch(setLocalAnswer({ question_number: currentQuestion, selected_option: newAnswer }));
    dispatch(saveAnswer({ sessionId: currentSession.id, question_number: currentQuestion, selected_option: newAnswer }));
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      const res = await dispatch(cancelSession(currentSession.id));
      if (cancelSession.fulfilled.match(res)) {
        toast.info(res.payload?.message || 'Ujian berhasil dibatalkan. Kuota pengerjaan Anda tidak terpotong.');
        setShowCancelModal(false);
        dispatch(fetchAvailableExams());
        dispatch(fetchSessions());
      } else {
        toast.error(res.payload || 'Gagal membatalkan ujian.');
      }
    } catch (e) {
      toast.error('Gagal membatalkan ujian.');
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenSubmitModal = () => {
    if (currentAnswers?.selected_option !== undefined && currentSession?.id) {
      dispatch(saveAnswer({
        sessionId: currentSession.id,
        question_number: currentQuestion,
        selected_option: currentAnswers.selected_option,
      }));
    }
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    const result = await dispatch(submitSession(currentSession.id));
    if (submitSession.fulfilled.match(result)) {
      toast.success(`Ujian selesai! Skor Anda: ${result.payload.score} 🎉`);
    } else {
      toast.error(result.payload || 'Gagal menyelesaikan ujian.');
    }
  };

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
              {quotaInfo && (
                <div className={`p-4 rounded-xl border transition-all ${
                  quotaInfo.is_limit_reached 
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50' 
                    : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎯</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Kuota Pengerjaan CBT — {quotaInfo.program_name || 'Program Belajar'}
                      </span>
                    </div>
                    {quotaInfo.is_unlimited ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        ♾️ Tak Terbatas
                      </span>
                    ) : (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        quotaInfo.is_limit_reached
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300 animate-pulse'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                      }`}>
                        {quotaInfo.used} / {quotaInfo.quota} Sesi ({quotaInfo.remaining} tersisa)
                      </span>
                    )}
                  </div>

                  {!quotaInfo.is_unlimited && (
                    <div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            quotaInfo.is_limit_reached ? 'bg-red-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.round((quotaInfo.used / (quotaInfo.quota || 1)) * 100))}%` }}
                        />
                      </div>
                      {quotaInfo.is_limit_reached ? (
                        <div className="mt-3 flex items-center justify-between text-xs text-red-600 dark:text-red-400 font-semibold">
                          <span>⚠️ Batas kuota CBT Anda telah tercapai. Tidak dapat memulai sesi baru.</span>
                          <button
                            type="button"
                            onClick={() => setShowLimitModal(true)}
                            className="underline hover:text-red-700 dark:hover:text-red-300 ml-2 font-bold whitespace-nowrap cursor-pointer"
                          >
                            Lihat Solusi
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Sisa {quotaInfo.remaining} kali kesempatan pengerjaan pada program ini.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">Pilih Jenis Ujian</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Pilih subtes yang ingin Anda kerjakan hari ini.</p>
              </div>

          {availableExams && availableExams.length > 0 ? (
            <div className="flex flex-col gap-3">
              {availableExams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => {
                    if (exam.cooldown_info?.in_cooldown) {
                      toast.warning(`Ujian ini dalam masa jeda istirahat (sisa ${exam.cooldown_info.remaining_minutes} menit). Anda dapat mengulang kembali pada pukul ${exam.cooldown_info.retry_at_time} WIB.`);
                      return;
                    }
                    if (exam.is_open === false) {
                      if (exam.schedule_status === 'upcoming') {
                        toast.info(`Ujian belum dibuka. Jadwal: ${exam.schedule_description}`);
                      } else if (exam.schedule_status === 'expired') {
                        toast.error(`Jadwal ujian ini telah berakhir. (${exam.schedule_description})`);
                      }
                      return;
                    }
                    setSelectedType({
                      id: exam.id,
                      is_real: true,
                      label: exam.title,
                      description: exam.description,
                      duration: exam.duration_minutes * 60,
                      total_questions: exam.questions_count,
                      is_open: exam.is_open,
                      schedule_status: exam.schedule_status,
                      schedule_description: exam.schedule_description,
                      start_time: exam.start_time,
                      end_time: exam.end_time,
                    });
                  }}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    exam.cooldown_info?.in_cooldown || exam.is_open === false
                      ? 'opacity-80 cursor-not-allowed border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50'
                      : 'cursor-pointer border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  } ${selectedType?.id === exam.id ? 'border-blue-500 bg-blue-500/10' : ''}`}
                >
                  <span className="text-2xl mt-0.5">{exam.exam_type?.icon || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{exam.title}</p>
                      {exam.exam_type && (
                        <Badge color="blue" className="text-[10px] font-bold">
                          {exam.exam_type.icon} {exam.exam_type.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{exam.duration_minutes} menit · {exam.questions_count} soal</p>
                      {exam.cooldown_info?.in_cooldown && (
                        <Badge color="purple" className="text-[10px] font-bold">
                          ⏱️ Jeda: Sisa {exam.cooldown_info.remaining_minutes}m ({exam.cooldown_info.retry_at_time})
                        </Badge>
                      )}
                      {exam.schedule_status === 'upcoming' && (
                        <Badge color="amber" className="text-[10px]">⏰ {exam.schedule_description}</Badge>
                      )}
                      {exam.schedule_status === 'expired' && (
                        <Badge color="rose" className="text-[10px]">❌ {exam.schedule_description}</Badge>
                      )}
                      {exam.schedule_status === 'ongoing' && exam.schedule_type !== 'always' && (
                        <Badge color="emerald" className="text-[10px]">🟢 Sedang Dibuka</Badge>
                      )}
                    </div>
                    
                    {/* Daftar Subtes Terkandung */}
                    {exam.subtests_list && exam.subtests_list.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Subtes:</span>
                        {exam.subtests_list.map((st, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                            {st}
                          </span>
                        ))}
                      </div>
                    )}

                    {exam.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        {exam.description}
                      </p>
                    )}
                  </div>
                  {selectedType?.id === exam.id && <span className="text-blue-500 font-bold text-lg">✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm rounded-lg border border-orange-200 dark:border-orange-800">
                Belum ada paket ujian aktif dari admin. Menampilkan soal latihan berdasarkan tipe ujian.
              </div>
              {examTypes && examTypes.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {examTypes.map((et) => {
                    const typeId = et.code || et.id;
                    const typeLabel = et.name || et.label;
                    const typeDuration = et.duration_seconds || et.duration || 3600;
                    const typeQuestions = et.total_questions || 20;
                    const isSelected = selectedType?.id === typeId;

                    return (
                      <button
                        key={typeId}
                        onClick={() => setSelectedType({
                          id: typeId,
                          code: typeId,
                          label: typeLabel,
                          description: et.description,
                          name: typeLabel,
                          icon: et.icon || '📝',
                          duration: typeDuration,
                          total_questions: typeQuestions,
                          is_real: false,
                        })}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="text-2xl">{et.icon || '📝'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{typeLabel}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {Math.floor(typeDuration / 60)} menit · {typeQuestions} soal
                          </p>
                          {et.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-1">
                              {et.description}
                            </p>
                          )}
                        </div>
                        {isSelected && <span className="text-blue-500 font-bold text-lg">✓</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  Belum ada tipe ujian yang tersedia saat ini.
                </div>
              )}
            </>
          )}

              {selectedType?.description && (
                <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-sm space-y-1.5 animate-fadeIn">
                  <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                    <span>📋 Panduan & Petunjuk Ujian:</span>
                  </div>
                  <p className="whitespace-pre-line text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                    {selectedType.description}
                  </p>
                </div>
              )}

              {selectedType?.is_real && selectedType.schedule_status && selectedType.schedule_status !== 'always' && (
                <div className={`p-4 rounded-xl border text-sm space-y-1.5 animate-fadeIn ${
                  selectedType.schedule_status === 'ongoing'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : selectedType.schedule_status === 'upcoming'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🕐 Status Jadwal Ujian:</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed pl-5">
                    {selectedType.schedule_status === 'ongoing' && (
                      <span>Ujian sedang berlangsung dan dapat dikerjakan saat ini. ({selectedType.schedule_description})</span>
                    )}
                    {selectedType.schedule_status === 'upcoming' && (
                      <span>
                        Ujian belum dapat dimulai. ({selectedType.schedule_description})
                      </span>
                    )}
                    {selectedType.schedule_status === 'expired' && (
                      <span>
                        Jadwal pengerjaan ujian ini telah berakhir. ({selectedType.schedule_description})
                      </span>
                    )}
                  </p>
                </div>
              )}

              <Button
                size="lg"
                disabled={!selectedType || (selectedType?.is_real && selectedType.schedule_status !== 'always' && selectedType.schedule_status !== 'ongoing')}
                loading={loading}
                onClick={handleStartExam}
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
        <CbtLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          quotaInfo={quotaInfo}
        />
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

          {/* Subtest Analysis Breakdown */}
          {result.subtest_breakdown && result.subtest_breakdown.length > 0 && (
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>📊 Analisis Per Subtes:</span>
              </h4>
              <div className="space-y-2">
                {result.subtest_breakdown.map((sb, i) => {
                  const pct = sb.total > 0 ? Math.round((sb.correct / sb.total) * 100) : 0;
                  return (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{sb.icon || '🧩'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{sb.subtest}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-medium">{sb.correct}/{sb.total} Benar</span>
                        <span className={`font-black ${pct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={() => dispatch(clearSession())} variant="ghost">Pilih Ujian Lain</Button>
            <Button onClick={handleRetryExam}>
              Ulangi Ujian
            </Button>
          </div>
        </div>
        <CbtLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          quotaInfo={quotaInfo}
        />
      </AppLayout>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Exam main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Exam topbar */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <Badge color="blue">{currentSession.exam_type?.toUpperCase()}</Badge>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 hidden sm:block truncate max-w-xs">
              {currentSession.exam_title}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Total Waktu Ujian / Status Beku */}
            {isExamFrozen ? (
              <div 
                onClick={() => setShowFrozenModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 shadow-2xs cursor-pointer animate-pulse"
                title="Waktu ujian habis, lembar soal dibekukan. Klik untuk melihat konfirmasi serahkan ujian."
              >
                <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">❄️</span>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[11px] sm:text-xs font-bold text-rose-700 dark:text-rose-300 whitespace-nowrap">Dibekukan:</span>
                  <span className="text-xs sm:text-sm font-black text-rose-800 dark:text-rose-100 font-mono">
                    Auto-Submit 00:{String(graceTimeLeft).padStart(2, '0')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-2xs">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">⏱</span>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Total Waktu:</span>
                  <CountdownTimer
                    durationSeconds={totalRemainingSeconds}
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100"
                    onExpire={() => {
                      setIsFrozen(true);
                      setShowFrozenModal(true);
                      toast.warning('Waktu pengerjaan ujian telah berakhir! Lembar soal dibekukan.', { autoClose: 5000 });
                    }}
                  />
                </div>
              </div>
            )}

            {/* Answered indicator or Cancel button */}
            {answeredCount === 0 ? (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Batalkan sesi ujian (hanya dapat dibatalkan jika belum menjawab soal)"
              >
                <span>✕ Batalkan Ujian</span>
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{answeredCount}/{questions.length} Terjawab</span>
              </div>
            )}

            <Button variant="danger" size="sm" onClick={handleOpenSubmitModal} loading={submitting}>
              Serahkan Ujian
            </Button>
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {question ? (
            <div className="max-w-2xl mx-auto flex flex-col gap-5">
              {/* Exam Frozen Warning Banner */}
              {isExamFrozen && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">❄️</span>
                    <div>
                      <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Waktu Pengerjaan Habis — Lembar Soal Dibekukan
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        Pilihan jawaban tidak dapat diubah lagi. Menyerahkan otomatis dalam{' '}
                        <strong className="font-mono underline font-black">00:{String(graceTimeLeft).padStart(2, '0')}</strong> detik.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                    onClick={() => setShowFrozenModal(true)}
                  >
                    Serahkan Sekarang
                  </Button>
                </div>
              )}

              {/* Question Header & Per-Question Timer */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soal</span>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">{question.number}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">{questions.length}</span>
                    {question.exam_type ? (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ml-1 border border-blue-200 dark:border-blue-800/60">
                        <span>{question.exam_type.icon || '🧩'}</span>
                        <span>{question.exam_type.name}</span>
                      </span>
                    ) : question.subtest ? (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ml-1 border border-blue-200 dark:border-blue-800/60">
                        <span>🧩</span>
                        <span>{question.subtest}</span>
                      </span>
                    ) : question.subject ? (
                      <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ml-1 border border-blue-200 dark:border-blue-800/60">
                        {question.subject}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Per-Question Countdown Timer Badge */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                        isExamFrozen
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                          : questionTimeLeft <= 10
                          ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 animate-pulse'
                          : questionTimeLeft <= 30
                          ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                      title="Batas waktu pengerjaan khusus untuk soal ini"
                    >
                      <span className="text-xs">⏱ Sisa Waktu Soal:</span>
                      <span className="font-mono text-sm font-black">
                        {isExamFrozen ? '00:00' : `${String(Math.floor(questionTimeLeft / 60)).padStart(2, '0')}:${String(questionTimeLeft % 60).padStart(2, '0')}`}
                      </span>
                    </div>

                    <button
                      disabled={isExamFrozen}
                      onClick={() => !isExamFrozen && dispatch(toggleFlag(currentQuestion))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isExamFrozen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        currentAnswers?.is_flagged
                          ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500'
                      }`}
                    >
                      🚩 {currentAnswers?.is_flagged ? 'Ragu-Ragu' : 'Tandai Ragu'}
                    </button>
                  </div>
                </div>

                {/* Linear progress bar for per-question timer */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isExamFrozen
                        ? 'bg-slate-300 dark:bg-slate-700'
                        : questionTimeLeft <= 10
                        ? 'bg-rose-500'
                        : questionTimeLeft <= 30
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      width: isExamFrozen ? '0%' : `${Math.max(0, Math.min(100, (questionTimeLeft / (question.duration_seconds || 90)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Question Text Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                <div 
                  className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: question.text }}
                />
              </div>

              {/* Dynamic Answer Options / Input based on question_type */}
              {question.question_type === 'short_answer' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg w-fit">
                    <span>✍️</span>
                    <span>Tipe Soal: Isian Singkat (Ketikkan angka atau jawaban pasti Anda)</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">Jawaban Anda:</label>
                    <input
                      type="text"
                      disabled={isExamFrozen}
                      className={`w-full px-4 py-3 text-lg font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${isExamFrozen ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                      placeholder={isExamFrozen ? 'Lembar soal telah dibekukan (read-only)' : 'Ketikkan jawaban di sini...'}
                      value={currentAnswers?.selected_option || ''}
                      onChange={(e) => {
                        if (isExamFrozen) return;
                        const val = e.target.value;
                        dispatch(setLocalAnswer({ question_number: currentQuestion, selected_option: val }));
                      }}
                      onBlur={(e) => {
                        if (isExamFrozen) return;
                        const val = e.target.value;
                        dispatch(saveAnswer({ sessionId: currentSession.id, question_number: currentQuestion, selected_option: val }));
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    💡 Tips: Masukkan angka atau teks jawaban tanpa spasi tambahan. Jawaban otomatis tersimpan saat Anda berpindah soal.
                  </p>
                </div>
              ) : question.question_type === 'multiple_choice' || question.question_type === 'complex_choice' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg w-fit">
                    <span>☑️</span>
                    <span>Tipe Soal: Pilihan Ganda Kompleks (Pilih satu atau lebih opsi yang benar)</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {Object.entries(question.options || {}).map(([letter, text]) => {
                      const isSelected = (currentAnswers?.selected_option || '')
                        .split(',')
                        .map(s => s.trim())
                        .includes(letter);
                      return (
                        <CbtAnswerOption
                          key={letter}
                          letter={letter}
                          text={text}
                          selected={isSelected}
                          disabled={isExamFrozen}
                          onClick={() => handleSelect(letter)}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg w-fit">
                    <span>⚪</span>
                    <span>Pilihan Ganda (Pilih satu jawaban yang paling tepat)</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {Object.entries(question.options || {}).map(([letter, text]) => (
                      <CbtAnswerOption
                        key={letter}
                        letter={letter}
                        text={text}
                        selected={currentAnswers?.selected_option === letter}
                        disabled={isExamFrozen}
                        onClick={() => handleSelect(letter)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentQuestion <= 1}
                  onClick={() => {
                    if (!isExamFrozen && currentAnswers?.selected_option !== undefined) {
                      dispatch(saveAnswer({ sessionId: currentSession.id, question_number: currentQuestion, selected_option: currentAnswers.selected_option }));
                    }
                    dispatch(setCurrentQuestion(currentQuestion - 1));
                  }}
                >
                  ← Sebelumnya
                </Button>

                {currentQuestion < questions.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isExamFrozen && currentAnswers?.selected_option !== undefined) {
                        dispatch(saveAnswer({ sessionId: currentSession.id, question_number: currentQuestion, selected_option: currentAnswers.selected_option }));
                      }
                      dispatch(setCurrentQuestion(currentQuestion + 1));
                    }}
                  >
                    Lanjut →
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    onClick={handleOpenSubmitModal}
                    loading={submitting}
                  >
                    <span>✓ Serahkan / Akhiri Ujian</span>
                  </Button>
                )}
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

      {/* Cancel Exam Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl mx-auto">
              ⚠️
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Batalkan Pengerjaan Ujian?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Anda belum menjawab soal apa pun. Sesi ini akan dibatalkan tanpa mengurangi kuota pengerjaan CBT Anda atau memengaruhi riwayat nilai.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1 text-xs"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Kembali Mengerjakan
              </Button>
              <Button
                variant="danger"
                className="flex-1 text-xs"
                loading={cancelling}
                onClick={handleConfirmCancel}
              >
                Ya, Batalkan Ujian
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submit / End Exam Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto shadow-xs">
              📝
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Konfirmasi Akhiri & Serahkan Ujian
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin menyelesaikan ujian ini? Pastikan Anda telah memeriksa kembali seluruh jawaban sebelum menyerahkan.
              </p>
            </div>

            {/* Rekap Pengerjaan */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Total Soal</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-200">{questions.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Terjawab</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{answeredCount}</span>
              </div>
              <div className={`p-2 rounded-lg border ${
                questions.length - answeredCount > 0
                  ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-800/40'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
              }`}>
                <span className={`text-[10px] font-medium block ${questions.length - answeredCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  Belum Diisi
                </span>
                <span className={`text-base font-black ${questions.length - answeredCount > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>
                  {questions.length - answeredCount}
                </span>
              </div>
            </div>

            {/* Warning if any unanswered */}
            {questions.length - answeredCount > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <span className="text-base shrink-0">⚠️</span>
                <p className="leading-relaxed text-[11px]">
                  <strong>Perhatian:</strong> Masih terdapat <strong>{questions.length - answeredCount} butir soal</strong> yang belum Anda jawab. Soal yang tidak dijawab tidak akan mendapatkan skor.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <span>🎉</span>
                <p className="text-[11px] font-medium">Luar biasa! Anda telah menjawab seluruh butir soal.</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="ghost"
                className="flex-1 text-xs"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Periksa Kembali
              </Button>
              <Button
                variant="danger"
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white font-bold"
                loading={submitting}
                onClick={handleConfirmSubmit}
              >
                Ya, Serahkan Ujian
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Frozen Exam Modal with 60-Second Grace Period Countdown */}
      {showFrozenModal && isExamFrozen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-rose-200 dark:border-rose-900 shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl mx-auto shadow-xs animate-pulse">
              ⏳
            </div>

            <div className="text-center space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Waktu Habis • Lembar Soal Dibekukan
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Waktu Ujian Telah Selesai
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Seluruh lembar soal telah <strong>dibekukan</strong> dan jawaban tidak dapat diubah lagi. Silakan serahkan ujian sekarang sebelum sistem menyerahkan secara otomatis.
              </p>
            </div>

            {/* Grace Period Countdown Display */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                Penyerahan Otomatis Dalam:
              </span>
              <div className="text-4xl font-black font-mono tracking-widest text-rose-600 dark:text-rose-400">
                00:{String(graceTimeLeft).padStart(2, '0')}
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${Math.max(0, Math.min(100, (graceTimeLeft / 60) * 100))}%` }}
                />
              </div>
            </div>

            {/* Rekap Jawaban */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Total</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{questions.length}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                <span className="text-[10px] block">Terjawab</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                <span className="text-[10px] block">Kosong</span>
                <span className="font-bold">{questions.length - answeredCount}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="danger"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white font-bold text-sm shadow-md rounded-xl cursor-pointer"
                loading={submitting}
                onClick={async () => {
                  setShowFrozenModal(false);
                  const result = await dispatch(submitSession(currentSession.id));
                  if (submitSession.fulfilled.match(result)) {
                    toast.success(`Ujian selesai! Skor Anda: ${result.payload.score} 🎉`);
                  } else {
                    toast.error(result.payload || 'Gagal menyelesaikan ujian.');
                  }
                }}
              >
                ✓ Serahkan Jawaban Sekarang
              </Button>
              <button
                type="button"
                onClick={() => setShowFrozenModal(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-center py-1 cursor-pointer font-medium underline"
              >
                Lihat Lembar Jawaban (Mode Beku)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
