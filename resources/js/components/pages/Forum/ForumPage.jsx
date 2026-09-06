import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { createPost } from '../../../features/forum/forumSlice';
import AppLayout from '../../templates/AppLayout';
import ForumList from '../../organisms/ForumList';
import Button from '../../atoms/Button';
import Input from '../../atoms/Input';

const SUBJECTS = ['semua', 'matematika', 'fisika', 'kimia', 'biologi', 'tps', 'bahasa'];

export default function ForumPage() {
  const dispatch = useDispatch();
  const { submitting } = useSelector((s) => s.forum);

  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showAsk, setShowAsk] = useState(false);
  const [form, setForm] = useState({ subject: 'matematika', title: '', content: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleAsk = async () => {
    if (!form.title || form.content.length < 10) {
      toast.warn('Isi judul dan deskripsi minimal 10 karakter.');
      return;
    }
    const result = await dispatch(createPost(form));
    if (createPost.fulfilled.match(result)) {
      toast.success('Pertanyaan berhasil dikirim! Tutor akan segera menjawab.');
      setShowAsk(false);
      setForm({ subject: 'matematika', title: '', content: '' });
    } else {
      toast.error('Gagal mengirim pertanyaan.');
    }
  };

  return (
    <AppLayout title="Forum Tanya Jawab">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Diskusi & Tanya Jawab</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Tanya tutor alumni UI/ITB — rata-rata jawab dalam 14 menit</p>
          </div>
          <Button onClick={() => setShowAsk(!showAsk)} variant={showAsk ? 'ghost' : 'primary'}>
            {showAsk ? 'Batal' : '✏️ Ajukan Pertanyaan'}
          </Button>
        </div>

        {/* Ask form */}
        {showAsk && (
          <div className="bg-white dark:bg-slate-900 border border-blue-500/20 rounded-lg p-5 flex flex-col gap-4 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Pertanyaan Baru</h3>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Mata Pelajaran</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
              >
                {SUBJECTS.filter((s) => s !== 'semua').map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <Input
              label="Judul Pertanyaan"
              placeholder="Singkat & jelas — contoh: Cara mencari nilai limit?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Deskripsi Lengkap</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="Jelaskan soal atau materi yang membingungkan..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none resize-none"
              />
            </div>
            <Button onClick={handleAsk} loading={submitting} className="self-end">Kirim Pertanyaan →</Button>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Cari soal atau topik..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            prefix="🔍"
            className="flex-1"
          />
          <Button type="submit" variant="ghost">Cari</Button>
        </form>

        {/* Subject filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize
                ${filter === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-700 hover:text-slate-800 dark:text-slate-200'
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Forum list */}
        <ForumList filter={filter} search={search} />
      </div>
    </AppLayout>
  );
}
