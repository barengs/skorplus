import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import Button from '../atoms/Button';
import api from '../../services/api';

const CATEGORIES = [
  'TPS UTBK-SNBT',
  'Literasi Bahasa Indonesia',
  'Literasi Bahasa Inggris',
  'Penalaran Matematika',
  'Kedinasan',
  'Olimpiade Sains',
  'Pengembangan Diri',
  'Teknologi & AI',
];

const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];
const MAX_FILE_MB = 20;

const inputClass =
  'w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden';

/**
 * AiCourseGeneratorModal
 * Alur 3 langkah: Unggah dokumen → AI menyusun draf + Tag KC BKT → Tutor meninjau, memilih sinkronisasi CBT & menyimpan.
 */
export default function AiCourseGeneratorModal({ isOpen, onClose, onSaved }) {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({
    category: CATEGORIES[0],
    module_count: '',
    questions_per_quiz: 5,
    additional_instructions: '',
  });
  const [draft, setDraft] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [syncToCbt, setSyncToCbt] = useState(true);
  const [cbtTargetMode, setCbtTargetMode] = useState('new'); // 'new' | 'existing'
  const [cbtExamId, setCbtExamId] = useState('');
  const [cbtExamTitle, setCbtExamTitle] = useState('');
  const [existingExams, setExistingExams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState(null);

  useEffect(() => {
    if (isOpen && step === 'review' && existingExams.length === 0) {
      api
        .get('/admin/cbt/exams')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setExistingExams(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, step, existingExams.length]);

  const stats = useMemo(() => {
    if (!draft) return { modules: 0, readings: 0, quizzes: 0, questions: 0, kcs: 0 };
    const lessons = draft.modules.flatMap((m) => m.lessons);
    const allQuestions = lessons.flatMap((l) => l.quiz_questions || []);
    const kcSet = new Set(
      [
        ...draft.modules.map((m) => m.knowledge_component).filter(Boolean),
        ...allQuestions.map((q) => q.knowledge_component).filter(Boolean),
      ].map((s) => s.trim().toLowerCase())
    );
    return {
      modules: draft.modules.length,
      readings: lessons.filter((l) => l.type === 'reading').length,
      quizzes: lessons.filter((l) => l.type === 'quiz').length,
      questions: allQuestions.length,
      kcs: kcSet.size,
    };
  }, [draft]);

  if (!isOpen) return null;

  const resetAndClose = () => {
    if (step === 'generating' || saving) return;
    setStep('upload');
    setFile(null);
    setDraft(null);
    setExpandedLesson(null);
    onClose();
  };

  const handleFileChange = (selected) => {
    if (!selected) return;
    const ext = selected.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Format tidak didukung. Gunakan PDF, DOCX, TXT, atau MD.');
      return;
    }
    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${MAX_FILE_MB} MB.`);
      return;
    }
    setFile(selected);
  };

  const handleGenerate = async () => {
    if (!file) {
      toast.error('Pilih dokumen terlebih dahulu.');
      return;
    }
    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', options.category);
    formData.append('questions_per_quiz', options.questions_per_quiz);
    if (options.module_count) formData.append('module_count', options.module_count);
    if (options.additional_instructions) formData.append('additional_instructions', options.additional_instructions);

    setStep('generating');
    try {
      const res = await api.post('/admin/elearning/ai-generator/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      const generatedDraft = res.data.draft;
      setDraft(generatedDraft);
      setCbtExamTitle(`Evaluasi CBT: ${generatedDraft?.course?.title || 'Modul Baru'}`);
      setSourceName(res.data.source_document);
      setStep('review');
      toast.success('Draf modul & pemetaan Knowledge Component (BKT) berhasil disusun.');
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memproses dokumen dengan AI.';
      toast.error(message);
      setStep('upload');
    }
  };

  const handleSave = async () => {
    if (syncToCbt && cbtTargetMode === 'existing' && !cbtExamId) {
      toast.error('Pilih paket ujian CBT tujuan terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        draft,
        is_active: isActive,
        sync_to_cbt: syncToCbt,
        cbt_exam_id: syncToCbt && cbtTargetMode === 'existing' ? Number(cbtExamId) : null,
        cbt_exam_title: syncToCbt && cbtTargetMode === 'new' ? cbtExamTitle : null,
      };
      const res = await api.post('/admin/elearning/ai-generator/store', payload);
      const syncedCbt = res.data?.synced_cbt_exam;
      if (syncedCbt) {
        toast.success(
          `Kursus & ${syncedCbt.questions_synced_count} soal pada "${syncedCbt.title}" berhasil disimpan!`
        );
      } else {
        toast.success('Kursus hasil AI berhasil disimpan!');
      }
      setStep('upload');
      setFile(null);
      setDraft(null);
      onSaved?.(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kursus.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Draft mutators ---------- */
  const updateCourse = (field, value) => setDraft((d) => ({ ...d, course: { ...d.course, [field]: value } }));

  const updateModule = (mi, field, value) =>
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, i) => (i === mi ? { ...m, [field]: value } : m)),
    }));

  const removeModule = (mi) => {
    if (draft.modules.length <= 1) {
      toast.error('Minimal harus ada 1 modul.');
      return;
    }
    setDraft((d) => ({ ...d, modules: d.modules.filter((_, i) => i !== mi) }));
  };

  const updateLesson = (mi, li, field, value) =>
    updateModule(
      mi,
      'lessons',
      draft.modules[mi].lessons.map((l, i) => (i === li ? { ...l, [field]: value } : l))
    );

  const removeLesson = (mi, li) => {
    if (draft.modules[mi].lessons.length <= 1) {
      toast.error('Setiap modul minimal memiliki 1 materi.');
      return;
    }
    updateModule(mi, 'lessons', draft.modules[mi].lessons.filter((_, i) => i !== li));
  };

  const updateQuestion = (mi, li, qi, field, value) => {
    const questions = draft.modules[mi].lessons[li].quiz_questions.map((q, i) => (i === qi ? { ...q, [field]: value } : q));
    updateLesson(mi, li, 'quiz_questions', questions);
  };

  const updateOption = (mi, li, qi, oi, value) => {
    const q = draft.modules[mi].lessons[li].quiz_questions[qi];
    updateQuestion(mi, li, qi, 'options', q.options.map((o, i) => (i === oi ? value : o)));
  };

  const removeQuestion = (mi, li, qi) => {
    const questions = draft.modules[mi].lessons[li].quiz_questions;
    if (questions.length <= 1) {
      toast.error('Kuis minimal memiliki 1 soal.');
      return;
    }
    updateLesson(mi, li, 'quiz_questions', questions.filter((_, i) => i !== qi));
  };

  /* ---------- Render helpers ---------- */
  const renderUploadStep = () => (
    <div className="p-6 space-y-5 overflow-y-auto">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileChange(e.dataTransfer.files?.[0]);
        }}
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
      >
        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl">
          <FontAwesomeIcon icon={['fas', file ? 'file-circle-check' : 'cloud-arrow-up']} />
        </div>
        {file ? (
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • klik untuk mengganti</p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">Klik atau seret dokumen ke sini</p>
            <p className="text-xs text-slate-500">PDF, DOCX, TXT, atau MD • maks. {MAX_FILE_MB} MB</p>
          </div>
        )}
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Kategori</label>
          <select value={options.category} onChange={(e) => setOptions({ ...options, category: e.target.value })} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Jumlah Modul</label>
          <select value={options.module_count} onChange={(e) => setOptions({ ...options, module_count: e.target.value })} className={inputClass}>
            <option value="">Otomatis (AI)</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} modul</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Soal per Kuis</label>
          <input
            type="number"
            min={3}
            max={15}
            value={options.questions_per_quiz}
            onChange={(e) => setOptions({ ...options, questions_per_quiz: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Instruksi Tambahan (opsional)</label>
        <textarea
          rows={3}
          maxLength={1000}
          placeholder="Contoh: fokus pada soal tipe HOTS, gunakan contoh kontekstual kehidupan sehari-hari."
          value={options.additional_instructions}
          onChange={(e) => setOptions({ ...options, additional_instructions: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
        <FontAwesomeIcon icon={['fas', 'circle-info']} className="mt-0.5" />
        <p>
          AI menyusun <strong>draf modul</strong>, memberikan label <strong>Knowledge Component (BKT)</strong> pada setiap soal, serta
          mendukung sinkronisasi otomatis ke <strong>Bank Soal & Paket Ujian CBT</strong> setelah Anda meninjaunya.
        </p>
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">AI sedang membaca dokumen, menyusun modul & memetakan KC BKT…</p>
        <p className="text-sm text-slate-500">Proses ini biasanya memakan waktu 30–90 detik. Jangan tutup jendela ini.</p>
      </div>
    </div>
  );

  const renderQuiz = (lesson, mi, li) => (
    <div className="space-y-3">
      {lesson.quiz_questions.map((q, qi) => (
        <div key={qi} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex gap-2 items-start">
            <span className="text-xs font-bold text-slate-500 mt-2.5">{qi + 1}.</span>
            <div className="flex-1 space-y-2">
              <textarea rows={2} value={q.question} onChange={(e) => updateQuestion(mi, li, qi, 'question', e.target.value)} className={inputClass} />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                  <FontAwesomeIcon icon={['fas', 'tag']} /> KC BKT
                </span>
                <input
                  value={q.knowledge_component || ''}
                  placeholder="Komponen pengetahuan spesifik (mis. Silogisme Kategorik)"
                  onChange={(e) => updateQuestion(mi, li, qi, 'knowledge_component', e.target.value)}
                  className={`${inputClass} py-1 text-xs`}
                />
              </div>
            </div>
            <button type="button" onClick={() => removeQuestion(mi, li, qi)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded" title="Hapus soal">
              <FontAwesomeIcon icon={['fas', 'trash-can']} />
            </button>
          </div>
          <div className="pl-5 space-y-1.5">
            {q.options.map((opt, oi) => (
              <label key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`q-${mi}-${li}-${qi}`}
                  checked={q.correct_index === oi}
                  onChange={() => updateQuestion(mi, li, qi, 'correct_index', oi)}
                  className="accent-emerald-600"
                  title="Tandai sebagai jawaban benar"
                />
                <input
                  value={opt}
                  onChange={(e) => updateOption(mi, li, qi, oi, e.target.value)}
                  className={`${inputClass} py-1.5 ${q.correct_index === oi ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                />
              </label>
            ))}
            <input
              value={q.explanation}
              placeholder="Pembahasan"
              onChange={(e) => updateQuestion(mi, li, qi, 'explanation', e.target.value)}
              className={`${inputClass} py-1.5 text-xs italic`}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderReviewStep = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Modul', value: stats.modules, icon: 'layer-group', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
          { label: 'Materi Bacaan', value: stats.readings, icon: 'book-open', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
          { label: 'Kuis', value: stats.quizzes, icon: 'clipboard-question', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
          { label: 'Total Soal', value: stats.questions, icon: 'list-check', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
          { label: 'Tag KC (BKT)', value: stats.kcs, icon: 'tags', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <FontAwesomeIcon icon={['fas', s.icon]} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Course Meta */}
      <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Judul Kursus</label>
            <input value={draft.course.title} onChange={(e) => updateCourse('title', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Kategori</label>
            <select value={draft.course.category} onChange={(e) => updateCourse('category', e.target.value)} className={inputClass}>
              {[...new Set([draft.course.category, ...CATEGORIES])].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Deskripsi (HTML)</label>
          <textarea rows={3} value={draft.course.description} onChange={(e) => updateCourse('description', e.target.value)} className={`${inputClass} font-mono text-xs`} />
        </div>
      </div>

      {/* CBT Bank Soal Sync Panel */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={syncToCbt}
              onChange={(e) => setSyncToCbt(e.target.checked)}
              className="accent-blue-600 w-4 h-4"
            />
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FontAwesomeIcon icon={['fas', 'database']} className="text-blue-600 dark:text-blue-400" />
              Sinkronkan {stats.questions} Soal Kuis ke Bank Soal & Paket Ujian CBT
            </span>
          </label>
          <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
            Otomatis membawa label Subtes Modul & Knowledge Component (BKT)
          </span>
        </div>

        {syncToCbt && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Paket Ujian CBT</label>
              <select
                value={cbtTargetMode}
                onChange={(e) => setCbtTargetMode(e.target.value)}
                className={inputClass}
              >
                <option value="new">Buat Paket Ujian CBT Baru</option>
                <option value="existing">Tambahkan ke Paket Ujian yang Ada</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              {cbtTargetMode === 'new' ? (
                <>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Paket Ujian CBT Baru</label>
                  <input
                    value={cbtExamTitle}
                    onChange={(e) => setCbtExamTitle(e.target.value)}
                    placeholder={`Evaluasi CBT: ${draft.course.title}`}
                    className={inputClass}
                  />
                </>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Pilih Paket Ujian CBT</label>
                  <select
                    value={cbtExamId}
                    onChange={(e) => setCbtExamId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">-- Pilih Paket Ujian CBT --</option>
                    {existingExams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} ({ex.questions_count ?? ex.total_questions ?? 0} soal)
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modules & Lessons */}
      {draft.modules.map((mod, mi) => (
        <div key={mi} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <span className="w-7 h-7 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{mi + 1}</span>
              <input value={mod.title} onChange={(e) => updateModule(mi, 'title', e.target.value)} className={`${inputClass} font-semibold`} placeholder="Judul Modul" />
            </div>
            <div className="flex items-center gap-2 sm:w-72">
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded shrink-0">
                <FontAwesomeIcon icon={['fas', 'tag']} className="mr-1" /> KC
              </span>
              <input
                value={mod.knowledge_component || ''}
                onChange={(e) => updateModule(mi, 'knowledge_component', e.target.value)}
                placeholder="Tag KC Modul"
                className={`${inputClass} py-1.5 text-xs`}
              />
              <button type="button" onClick={() => removeModule(mi)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded shrink-0" title="Hapus modul">
                <FontAwesomeIcon icon={['fas', 'trash-can']} />
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mod.lessons.map((lesson, li) => {
              const key = `${mi}-${li}`;
              const isExpanded = expandedLesson === key;
              const isQuiz = lesson.type === 'quiz';
              return (
                <div key={li} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded shrink-0 ${
                        isQuiz ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}
                    >
                      <FontAwesomeIcon icon={['fas', isQuiz ? 'clipboard-question' : 'book-open']} className="mr-1" />
                      {isQuiz ? `Kuis • ${lesson.quiz_questions.length} soal` : `Bacaan • ${lesson.duration_minutes} mnt`}
                    </span>
                    <input value={lesson.title} onChange={(e) => updateLesson(mi, li, 'title', e.target.value)} className={`${inputClass} py-1.5`} />
                    <button
                      type="button"
                      onClick={() => setExpandedLesson(isExpanded ? null : key)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      title={isExpanded ? 'Tutup' : 'Tinjau isi'}
                    >
                      <FontAwesomeIcon icon={['fas', isExpanded ? 'chevron-up' : 'eye']} />
                    </button>
                    <button type="button" onClick={() => removeLesson(mi, li)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded" title="Hapus materi">
                      <FontAwesomeIcon icon={['fas', 'trash-can']} />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 space-y-3 pl-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ringkasan</label>
                        <textarea rows={2} value={lesson.summary} onChange={(e) => updateLesson(mi, li, 'summary', e.target.value)} className={inputClass} />
                      </div>
                      {isQuiz ? (
                        renderQuiz(lesson, mi, li)
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Konten (HTML)</label>
                            <textarea rows={12} value={lesson.content} onChange={(e) => updateLesson(mi, li, 'content', e.target.value)} className={`${inputClass} font-mono text-xs`} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Pratinjau</label>
                            <div
                              className="h-[17.5rem] overflow-y-auto p-3 rounded-lg border border-slate-200 dark:border-slate-700 rich-text prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: lesson.content }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={['fas', 'wand-magic-sparkles']} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">Generate Modul dari Dokumen (AI)</h3>
              <p className="text-xs text-slate-500 truncate">
                {step === 'review' ? `Tinjau draf & tag KC dari: ${sourceName}` : 'Langkah 1 dari 2 • Unggah dokumen sumber materi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            disabled={step === 'generating' || saving}
            className="w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
            title="Tutup"
          >
            <FontAwesomeIcon icon={['fas', 'xmark']} />
          </button>
        </div>

        {step === 'upload' && renderUploadStep()}
        {step === 'generating' && renderGeneratingStep()}
        {step === 'review' && draft && renderReviewStep()}

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/30">
          {step === 'review' ? (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                Langsung publikasikan ke siswa
              </label>
              <div className="flex gap-2 justify-end">
                <Button variant="soft-secondary" onClick={() => setStep('upload')} disabled={saving}>
                  <FontAwesomeIcon icon={['fas', 'rotate-left']} /> Ulangi
                </Button>
                <Button variant="soft-success" onClick={handleSave} loading={saving}>
                  {!saving && <FontAwesomeIcon icon={['fas', 'floppy-disk']} />} Simpan Kursus{syncToCbt ? ' & CBT' : ''}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-500">Didukung oleh Google Gemini • dokumen tidak disimpan di server</span>
              <div className="flex gap-2 justify-end">
                <Button variant="soft-secondary" onClick={resetAndClose} disabled={step === 'generating'}>
                  <FontAwesomeIcon icon={['fas', 'xmark']} /> Batal
                </Button>
                <Button variant="soft" onClick={handleGenerate} loading={step === 'generating'} disabled={!file}>
                  {step !== 'generating' && <FontAwesomeIcon icon={['fas', 'wand-magic-sparkles']} />} Generate Draf
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
