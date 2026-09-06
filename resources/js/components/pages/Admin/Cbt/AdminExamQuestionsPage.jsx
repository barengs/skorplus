import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import api from '../../../../services/api';
import { toast } from 'react-toastify';

export default function AdminExamQuestionsPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subject: '', subtest: '', question_text: '', points: 1, explanation_text: '', is_active: true,
    options: [
      { option_key: 'A', option_text: '', is_correct: true },
      { option_key: 'B', option_text: '', is_correct: false },
      { option_key: 'C', option_text: '', is_correct: false },
      { option_key: 'D', option_text: '', is_correct: false },
      { option_key: 'E', option_text: '', is_correct: false }
    ]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/cbt/exams/${examId}/questions`);
      setExam(res.data.exam);
      setQuestions(res.data.questions);
    } catch (err) {
      toast.error('Gagal memuat data soal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  const openModal = (question = null) => {
    if (question) {
      setFormData({
        subject: question.subject || '',
        subtest: question.subtest || '',
        question_text: question.question_text || '',
        points: question.points || 1,
        explanation_text: question.explanation_text || '',
        is_active: question.is_active,
        options: question.options || []
      });
      setEditingId(question.id);
    } else {
      setFormData({
        subject: '', subtest: '', question_text: '', points: 1, explanation_text: '', is_active: true,
        options: [
          { option_key: 'A', option_text: '', is_correct: true },
          { option_key: 'B', option_text: '', is_correct: false },
          { option_key: 'C', option_text: '', is_correct: false },
          { option_key: 'D', option_text: '', is_correct: false },
          { option_key: 'E', option_text: '', is_correct: false }
        ]
      });
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    if (field === 'is_correct' && value === true) {
      newOptions.forEach(o => o.is_correct = false); // single correct answer
    }
    newOptions[index][field] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/cbt/exams/${examId}/questions/${editingId}`, formData);
        toast.success('Soal berhasil diperbarui');
      } else {
        await api.post(`/admin/cbt/exams/${examId}/questions`, formData);
        toast.success('Soal berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan soal');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus soal ini?')) {
      try {
        await api.delete(`/admin/cbt/exams/${examId}/questions/${id}`);
        toast.success('Soal dihapus');
        fetchData();
      } catch (err) {
        toast.error('Gagal menghapus soal');
      }
    }
  };

  return (
    <AppLayout title="Manajemen Soal Ujian">
      <div className="max-w-6xl mx-auto pb-16">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/cbt">
            <Button variant="ghost" size="sm">← Kembali</Button>
          </Link>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {exam ? exam.title : 'Memuat...'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Soal: {questions.length}</p>
          </div>
          <div className="ml-auto">
            <Button onClick={() => openModal()}>+ Tambah Soal</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500">
            Belum ada soal pada ujian ini.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge color="blue">{q.points} Poin</Badge>
                  <Button variant="ghost" size="sm" onClick={() => openModal(q)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(q.id)}>Hapus</Button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg">{idx + 1}.</span>
                  {q.subject && <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">{q.subject}</span>}
                  {q.subtest && <span className="text-xs text-slate-500">{q.subtest}</span>}
                </div>
                <div className="prose dark:prose-invert max-w-none mb-4 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                
                <div className="grid md:grid-cols-2 gap-2 mt-4 pl-6">
                  {q.options?.map((opt) => (
                    <div key={opt.id} className={`p-3 border rounded-md text-sm flex gap-3 ${opt.is_correct ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-800'}`}>
                      <span className="font-bold">{opt.option_key}.</span>
                      <span className={opt.is_correct ? 'font-medium text-emerald-700 dark:text-emerald-400' : ''}>{opt.option_text}</span>
                      {opt.is_correct && <span className="ml-auto">✅</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal form */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md w-full max-w-3xl my-8 p-6 sm:p-8 relative">
              <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Mata Pelajaran (Subject)">
                    <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Contoh: Penalaran Umum" />
                  </FormField>
                  <FormField label="Sub-test">
                    <Input value={formData.subtest} onChange={e => setFormData({...formData, subtest: e.target.value})} placeholder="Contoh: Logika Analitik" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Skor Poin">
                    <Input type="number" min="1" value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value)})} />
                  </FormField>
                  <FormField label="Status">
                    <label className="flex items-center gap-2 mt-2">
                      <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                      <span>Soal Aktif</span>
                    </label>
                  </FormField>
                </div>
                
                <FormField label="Pertanyaan (Bisa menggunakan HTML dasar)">
                  <textarea rows={4} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent font-mono text-sm" value={formData.question_text} onChange={e => setFormData({...formData, question_text: e.target.value})} required placeholder="<p>Masukkan teks soal di sini...</p>" />
                </FormField>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                  <h4 className="font-bold mb-3">Pilihan Jawaban</h4>
                  <div className="space-y-3">
                    {formData.options.map((opt, i) => (
                      <div key={opt.option_key} className="flex items-start gap-3">
                        <div className="pt-2">
                          <input type="radio" name="is_correct" checked={opt.is_correct} onChange={() => handleOptionChange(i, 'is_correct', true)} className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex gap-2">
                          <span className="font-bold py-2">{opt.option_key}.</span>
                          <textarea rows={1} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-sm" value={opt.option_text} onChange={e => handleOptionChange(i, 'option_text', e.target.value)} required />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <FormField label="Penjelasan (Pembahasan)">
                  <textarea rows={3} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-sm" value={formData.explanation_text} onChange={e => setFormData({...formData, explanation_text: e.target.value})} placeholder="Pembahasan soal (opsional)" />
                </FormField>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan Soal</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
