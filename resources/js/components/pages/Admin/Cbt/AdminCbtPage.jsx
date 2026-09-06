import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import { fetchAdminExams, createAdminExam, updateAdminExam, deleteAdminExam } from '../../../../features/admin/adminCbtSlice';
import { toast } from 'react-toastify';

export default function AdminCbtPage() {
  const dispatch = useDispatch();
  const { exams, loading } = useSelector((state) => state.adminCbt);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', duration_minutes: 120, is_active: true });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminExams());
  }, [dispatch]);

  const openModal = (exam = null) => {
    if (exam) {
      setFormData({
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        is_active: exam.is_active,
      });
      setEditingId(exam.id);
    } else {
      setFormData({ title: '', duration_minutes: 120, is_active: true });
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await dispatch(updateAdminExam({ id: editingId, data: formData })).unwrap();
        toast.success('Paket ujian berhasil diperbarui!');
      } else {
        await dispatch(createAdminExam(formData)).unwrap();
        toast.success('Paket ujian berhasil ditambahkan!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err || 'Gagal menyimpan paket ujian');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus paket ujian ini?')) {
      try {
        await dispatch(deleteAdminExam(id)).unwrap();
        toast.success('Paket ujian berhasil dihapus!');
      } catch (err) {
        toast.error('Gagal menghapus paket ujian');
      }
    }
  };

  return (
    <AppLayout title="Kelola Ujian & Soal (CBT)">
      <div className="max-w-6xl mx-auto pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Manajemen Paket Ujian CBT</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Kelola tryout, bank soal, dan kunci jawaban.</p>
          </div>
          <Button onClick={() => openModal()}>+ Tambah Paket Ujian</Button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Judul Paket</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Durasi</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Jumlah Soal</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {exams.map(exam => (
                  <tr key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-bold">{exam.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{exam.duration_minutes} menit</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{exam.questions_count || 0} soal</td>
                    <td className="px-6 py-4">
                      <Badge color={exam.is_active ? 'emerald' : 'slate'}>
                        {exam.is_active ? 'Aktif' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/admin/cbt/${exam.id}/questions`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">Kelola Soal</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => openModal(exam)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(exam.id)}>Hapus</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md w-full max-w-lg p-6 sm:p-8">
              <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Paket Ujian' : 'Tambah Paket Ujian Baru'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <FormField label="Judul Paket">
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </FormField>
                <FormField label="Durasi (menit)">
                  <Input type="number" min="1" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} required />
                </FormField>
                <FormField label="Status">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    <span>Aktif (Ditampilkan)</span>
                  </label>
                </FormField>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
