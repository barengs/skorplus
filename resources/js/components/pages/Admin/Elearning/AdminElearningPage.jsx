import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import { fetchAdminCourses, createAdminCourse, updateAdminCourse, deleteAdminCourse } from '../../../../features/admin/adminElearningSlice';
import { toast } from 'react-toastify';
import api from '../../../../services/api';

export default function AdminElearningPage() {
  const dispatch = useDispatch();
  const { courses, loading } = useSelector((state) => state.adminElearning);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '',
    category: 'TPS UTBK-SNBT',
    description: '',
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminCourses());
  }, [dispatch]);

  const openModal = (course = null) => {
    if (course) {
      setFormData({
        title: course.title,
        category: course.category,
        description: course.description || '',
        is_active: course.is_active,
      });
      setEditingId(course.id);
      setPreviewImg(course.thumbnail || null);
      setThumbnailFile(null);
    } else {
      setFormData({ title: '', category: 'TPS UTBK-SNBT', description: '', is_active: true });
      setEditingId(null);
      setPreviewImg(null);
      setThumbnailFile(null);
    }
    setModalOpen(true);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          const webpFile = new File([blob], file.name.split('.')[0] + '.webp', { type: 'image/webp' });
          setThumbnailFile(webpFile);
          setPreviewImg(URL.createObjectURL(webpFile));
        }, 'image/webp', 0.9);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let thumbnailUrl = null;
      
      // Upload thumbnail if present
      if (thumbnailFile) {
        const fd = new FormData();
        fd.append('file', thumbnailFile);
        const { data } = await api.post('/upload/thumbnail', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        thumbnailUrl = data.url;
      }

      const payload = { ...formData };
      if (thumbnailUrl) payload.thumbnail = thumbnailUrl;

      if (editingId) {
        await dispatch(updateAdminCourse({ id: editingId, data: payload })).unwrap();
        toast.success('Pelajaran berhasil diperbarui!');
      } else {
        await dispatch(createAdminCourse(payload)).unwrap();
        toast.success('Pelajaran berhasil ditambahkan!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan pelajaran');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus pelajaran ini?')) {
      try {
        await dispatch(deleteAdminCourse(id)).unwrap();
        toast.success('Pelajaran berhasil dihapus!');
      } catch (err) {
        toast.error('Gagal menghapus pelajaran');
      }
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <AppLayout title="Kelola E-Learning">
      <div className="max-w-6xl mx-auto pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Manajemen Materi E-Learning</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Kelola daftar pelajaran, modul, dan video.</p>
          </div>
          <Button onClick={() => openModal()}>+ Tambah Pelajaran</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            courses.map(course => (
              <div key={course.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-slate-400">
                      📚
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <Badge color="blue" className="mb-2">{course.category}</Badge>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{course.title}</h3>
                  <div 
                    className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3" 
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>👥 {course.participants || 0} peserta</span>
                    <div className="flex items-center gap-1">
                      {renderStars(course.rating || 0)}
                      <span className="ml-1">{(Number(course.rating) || 0).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Link to={`/admin/elearning/courses/${course.id}/curriculum`}>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">Kurikulum</Button>
                    </Link>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(course)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" 
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md w-full max-w-2xl p-6 sm:p-8 my-8">
              <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Pelajaran' : 'Tambah Pelajaran Baru'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <FormField label="Judul Pelajaran">
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    required 
                  />
                </FormField>
                
                <FormField label="Kategori">
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
                  >
                    <option>TPS UTBK-SNBT</option>
                    <option>Saintek</option>
                    <option>Soshum</option>
                    <option>Kedinasan</option>
                  </select>
                </FormField>
                
                <FormField label="Deskripsi">
                  <textarea 
                    rows={6} 
                    className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent resize-none" 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi pelajaran..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Gunakan HTML untuk formatting (contoh: &lt;b&gt;tebal&lt;/b&gt;, &lt;i&gt;miring&lt;/i&gt;)</p>
                </FormField>
                
                <FormField label="Thumbnail Pelajaran">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleThumbnailChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {previewImg && (
                    <div className="mt-3">
                      <img src={previewImg} alt="preview" className="w-32 h-32 object-cover rounded border border-slate-200" />
                      <p className="text-xs text-slate-500 mt-1">Preview (akan dikonversi ke WebP)</p>
                    </div>
                  )}
                </FormField>
                
                <FormField label="Status Publikasi">
                  <label className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active} 
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">Aktif (Ditampilkan ke siswa)</span>
                  </label>
                </FormField>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={uploading}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
