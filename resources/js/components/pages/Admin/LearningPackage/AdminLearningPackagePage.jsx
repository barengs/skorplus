import React, { useState, useEffect } from 'react';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import FormField from '../../../molecules/FormField';
import Input from '../../../atoms/Input';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatRupiah } from '../../../../utils/currencyHelper';

export default function AdminLearningPackagePage() {
  const [packages, setPackages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    discount_price: null,
    thumbnail: '',
    features: [],
    is_published: false,
    course_ids: []
  });

  const [newFeature, setNewFeature] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchCourses();
  }, []);

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setThumbnailUploading(true);
      const res = await api.post('/admin/upload/thumbnail', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm({ ...form, thumbnail: res.data.url });
      toast.success('Thumbnail berhasil diunggah');
    } catch (err) {
      toast.error('Gagal mengunggah thumbnail');
    } finally {
      setThumbnailUploading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/learning-packages');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPackages(data);
    } catch (err) {
      toast.error('Gagal memuat paket');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/admin/learning-packages/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Gagal memuat kursus');
    }
  };

  const openModal = (pkg = null) => {
    if (pkg) {
      setForm({
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        discount_price: pkg.discount_price,
        thumbnail: pkg.thumbnail,
        features: pkg.features || [],
        is_published: pkg.is_published,
        course_ids: pkg.courses?.map(c => c.id) || []
      });
      setEditingId(pkg.id);
    } else {
      setForm({
        name: '',
        description: '',
        price: 0,
        discount_price: null,
        thumbnail: '',
        features: [],
        is_published: false,
        course_ids: []
      });
      setEditingId(null);
    }
    setNewFeature('');
    setModalOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm({ ...form, features: [...form.features, newFeature] });
      setNewFeature('');
    }
  };

  const removeFeature = (idx) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  const toggleCourse = (courseId) => {
    const ids = form.course_ids;
    if (ids.includes(courseId)) {
      setForm({ ...form, course_ids: ids.filter(id => id !== courseId) });
    } else {
      setForm({ ...form, course_ids: [...ids, courseId] });
    }
  };

  const savePackage = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/learning-packages/${editingId}`, form);
        toast.success('Paket diperbarui');
      } else {
        await api.post('/admin/learning-packages', form);
        toast.success('Paket ditambahkan');
      }
      setModalOpen(false);
      fetchPackages();
    } catch (err) {
      toast.error('Gagal menyimpan paket');
    }
  };

  const deletePackage = async (id) => {
    if (confirm('Yakin ingin menghapus paket ini?')) {
      try {
        await api.delete(`/admin/learning-packages/${id}`);
        toast.success('Paket dihapus');
        fetchPackages();
      } catch (err) {
        toast.error('Gagal menghapus paket');
      }
    }
  };

  return (
    <AppLayout title="Paket Belajar">
      <div className="max-w-6xl mx-auto pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Paket Belajar</h2>
          <Button onClick={() => openModal()}>+ Tambah Paket Belajar</Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">Belum ada paket belajar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {pkg.thumbnail && (
                  <div className="h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img src={pkg.thumbnail} alt={pkg.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2">{pkg.name}</h3>
                    {pkg.is_published && <Badge color="emerald" size="sm">Publish</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{pkg.description}</p>
                  
                  <div className="mb-3">
                    <div className="text-lg font-bold text-blue-600">{formatRupiah(pkg.price)}</div>
                    {pkg.discount_price && (
                      <div className="text-sm text-slate-500 line-through">{formatRupiah(pkg.discount_price)}</div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mb-3">
                    <FontAwesomeIcon icon={['fas', 'book']} className="mr-1" /> {pkg.courses?.length || 0} kursus
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" size="sm" className="flex-1 text-blue-600" onClick={() => openModal(pkg)}>
                      <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-red-600" onClick={() => deletePackage(pkg.id)}>
                      <FontAwesomeIcon icon={['fas', 'trash-can']} className="mr-1" /> Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-2xl my-8 p-6">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Paket' : 'Tambah Paket Belajar'}
              </h3>

              <form onSubmit={savePackage} className="space-y-4 max-h-[70vh] overflow-y-auto">
                <FormField label="Nama Paket" required>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </FormField>

                <FormField label="Deskripsi">
                  <textarea rows={3} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Harga (Rp)" required>
                    <Input type="number" min="0" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)})} required />
                  </FormField>
                  <FormField label="Harga Diskon (Rp)">
                    <Input type="number" min="0" value={form.discount_price || ''} onChange={e => setForm({...form, discount_price: e.target.value ? parseInt(e.target.value) : null})} />
                  </FormField>
                </div>

                <FormField label="Thumbnail Paket">
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={thumbnailUploading}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent text-sm"
                    />
                    {thumbnailUploading && <p className="text-xs text-blue-500">Mengunggah...</p>}
                    {form.thumbnail && (
                      <div className="mt-2">
                        <img src={form.thumbnail} alt="Preview" className="h-32 w-full object-cover rounded border border-slate-200 dark:border-slate-700" />
                      </div>
                    )}
                  </div>
                </FormField>

                <FormField label="Fitur Paket">
                  <div className="flex gap-2 mb-2">
                    <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="Tambah fitur..." />
                    <Button type="button" onClick={addFeature} variant="ghost">+ Tambah</Button>
                  </div>
                  {form.features.length > 0 && (
                    <div className="space-y-1">
                      {form.features.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm">
                          <span><FontAwesomeIcon icon={['fas', 'check']} className="text-emerald-500 mr-2" /> {f}</span>
                          <button type="button" onClick={() => removeFeature(idx)} className="text-red-500 hover:text-red-700">
                            <FontAwesomeIcon icon={['fas', 'xmark']} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </FormField>

                <FormField label="Kursus Dalam Paket">
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-300 dark:border-slate-700 rounded">
                    {courses.map(course => (
                      <label key={course.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.course_ids.includes(course.id)}
                          onChange={() => toggleCourse(course.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{course.title}</span>
                      </label>
                    ))}
                  </div>
                </FormField>

                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} className="w-4 h-4" />
                  <span className="text-sm">Publikasikan ke Landing Page</span>
                </label>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan Paket</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
