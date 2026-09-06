import React, { useState, useEffect } from 'react';
import AppLayout from '../../templates/AppLayout';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import api from '../../../services/api';
import { toast } from 'react-toastify';

export default function RiasecPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Cek apakah sudah pernah tes
      const resResult = await api.get('/riasec/result');
      if (resResult.data) {
        setResult(resResult.data);
      } else {
        // Kalau belum, load pertanyaan
        const resQ = await api.get('/riasec/questions');
        setQuestions(resQ.data || []);
      }
    } catch (err) {
      toast.error('Gagal memuat data RIASEC');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, dimension, score) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { dimension, score },
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error('Silakan jawab semua pertanyaan terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        answers: Object.values(answers),
      };
      const res = await api.post('/riasec/submit', payload);
      toast.success('Analisa berhasil disimpan! 🎉');
      setResult(res.data);
    } catch (err) {
      toast.error('Terjadi kesalahan saat memproses jawaban.');
    } finally {
      setSubmitting(false);
    }
  };

  // Retake test handler
  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    fetchData(); // Reload questions if not loaded
  };

  if (loading) {
    return (
      <AppLayout title="Analisa RIASEC">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analisa Minat Bakat (RIASEC)">
      <div className="max-w-4xl mx-auto pb-16">
        
        {/* === HASIL ANALISA === */}
        {result ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-md p-8 text-white text-center shadow-xl shadow-blue-500/20">
              <h2 className="text-3xl font-black mb-2">Holland Code Anda:</h2>
              <div className="text-6xl font-black text-amber-300 tracking-widest mb-4">
                {result.primary_type}{result.secondary_type}
              </div>
              <p className="text-blue-100 max-w-xl mx-auto">
                Tipe kepribadian dominan Anda adalah kombinasi dari {result.primary_type} dan {result.secondary_type}. Ini menunjukkan kecenderungan minat yang kuat pada lingkungan kerja tertentu.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Score Breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">Distribusi Skor RIASEC</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Realistic (R)', score: result.r_score, color: 'bg-red-500' },
                    { label: 'Investigative (I)', score: result.i_score, color: 'bg-orange-500' },
                    { label: 'Artistic (A)', score: result.a_score, color: 'bg-yellow-500' },
                    { label: 'Social (S)', score: result.s_score, color: 'bg-green-500' },
                    { label: 'Enterprising (E)', score: result.e_score, color: 'bg-blue-500' },
                    { label: 'Conventional (C)', score: result.c_score, color: 'bg-purple-500' },
                  ].sort((a, b) => b.score - a.score).map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1 text-slate-700 dark:text-slate-300">
                        <span>{item.label}</span>
                        <span className="font-bold">{item.score}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${(item.score / 25) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-slate-100">Rekomendasi Jurusan 🎓</h3>
                  <div className="flex flex-wrap gap-2">
                    {(result.major_recommendations || []).map((m, i) => (
                      <Badge key={i} color="blue">{m}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-slate-100">Prospek Karier 💼</h3>
                  <div className="flex flex-wrap gap-2">
                    {(result.career_recommendations || []).map((c, i) => (
                      <Badge key={i} color="emerald">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="ghost" className="w-full" onClick={handleRetake}>
                    🔄 Ulangi Tes Analisa
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* === KUISIONER === */
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Kuisioner Minat Bakat</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Berikan penilaian (1-5) seberapa besar Anda menyukai aktivitas berikut. Tidak ada jawaban yang salah, jawablah sejujur mungkin.
              </p>

              <div className="flex items-center justify-between mb-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <span>Total Dijawab:</span>
                <span className="text-blue-600 dark:text-blue-400">{Object.keys(answers).length} / {questions.length}</span>
              </div>

              <div className="space-y-8">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-0 last:pb-0">
                    <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
                      <span className="text-slate-400 mr-2">{idx + 1}.</span> {q.question}
                    </p>
                    <div className="flex items-center gap-2 sm:gap-4 justify-between max-w-lg">
                      <span className="text-xs text-slate-500 font-medium w-16 text-right hidden sm:block">Sangat Tidak Suka</span>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleAnswer(q.id, q.dimension, score)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold transition-all ${
                            answers[q.id]?.score === score
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                      <span className="text-xs text-slate-500 font-medium w-16 hidden sm:block">Sangat Suka</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button size="lg" onClick={handleSubmit} loading={submitting}>
                  Lihat Hasil Analisa ✨
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
