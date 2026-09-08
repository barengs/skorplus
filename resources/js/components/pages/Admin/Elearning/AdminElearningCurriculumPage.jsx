import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import Badge from '../../../atoms/Badge';
import FormField from '../../../molecules/FormField';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toEmbedUrl } from '../../../../utils/videoHelper';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminElearningCurriculumPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: '' });
  const [previewLesson, setPreviewLesson] = useState(null);

  const [activeModuleId, setActiveModuleId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', type: 'video', video_url: '', content: '', is_preview: false, duration_seconds: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, modulesRes] = await Promise.all([
        api.get(`/admin/elearning/courses/${courseId}`),
        api.get(`/admin/elearning/courses/${courseId}/modules`)
      ]);
      setCourse(courseRes.data);
      setModules(modulesRes.data);
    } catch (err) {
      toast.error('Gagal memuat kurikulum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // MODULE HANDLERS
  const openModuleModal = (mod = null) => {
    if (mod) {
      setModuleForm({ title: mod.title });
      setEditingModuleId(mod.id);
    } else {
      setModuleForm({ title: '' });
      setEditingModuleId(null);
    }
    setModuleModalOpen(true);
  };

  const saveModule = async (e) => {
    e.preventDefault();
    try {
      if (editingModuleId) {
        await api.put(`/admin/elearning/courses/${courseId}/modules/${editingModuleId}`, moduleForm);
        toast.success('Kelompok materi diperbarui');
      } else {
        await api.post(`/admin/elearning/courses/${courseId}/modules`, moduleForm);
        toast.success('Kelompok materi ditambahkan');
      }
      setModuleModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan kelompok materi');
    }
  };

  const deleteModule = async (id) => {
    if (confirm('Yakin ingin menghapus kelompok materi ini dan semua isinya?')) {
      try {
        await api.delete(`/admin/elearning/courses/${courseId}/modules/${id}`);
        toast.success('Kelompok materi dihapus');
        fetchData();
      } catch (err) {
        toast.error('Gagal menghapus');
      }
    }
  };

  // LESSON HANDLERS
  const openLessonModal = (moduleId, lesson = null) => {
    setActiveModuleId(moduleId);
    if (lesson) {
      setLessonForm({
        title: lesson.title,
        type: lesson.type || 'video',
        video_url: lesson.video_url || '',
        content: lesson.content || '',
        is_preview: lesson.is_preview || false,
        duration_seconds: lesson.duration_seconds || 0,
      });
      setEditingLessonId(lesson.id);
    } else {
      setLessonForm({ title: '', type: 'video', video_url: '', content: '', is_preview: false, duration_seconds: 0 });
      setEditingLessonId(null);
    }
    setLessonModalOpen(true);
  };

  const saveLesson = async (e) => {
    e.preventDefault();
    try {
      if (editingLessonId) {
        await api.put(`/admin/elearning/modules/${activeModuleId}/lessons/${editingLessonId}`, lessonForm);
        toast.success('Materi diperbarui');
      } else {
        await api.post(`/admin/elearning/modules/${activeModuleId}/lessons`, lessonForm);
        toast.success('Materi ditambahkan');
      }
      setLessonModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan materi');
    }
  };

  const deleteLesson = async (moduleId, lessonId) => {
    if (confirm('Yakin ingin menghapus materi ini?')) {
      try {
        await api.delete(`/admin/elearning/modules/${moduleId}/lessons/${lessonId}`);
        toast.success('Materi dihapus');
        fetchData();
      } catch (err) {
        toast.error('Gagal menghapus materi');
      }
    }
  };

  return (
    <AppLayout title="Silabus & Kurikulum">
      <div className="max-w-4xl mx-auto pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/elearning">
              <Button variant="ghost" size="sm">← Kembali</Button>
            </Link>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Silabus: {course?.title || 'Memuat...'}
              </h2>
            </div>
          </div>
          <Button onClick={() => openModuleModal()}>+ Tambah Kelompok Materi (Section)</Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : modules.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500">
            Belum ada silabus. Mulai dengan membuat Kelompok Materi (Section).
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map((mod, idx) => (
              <div key={mod.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                {/* Module Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Section {idx + 1}: {mod.title}</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openModuleModal(mod)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteModule(mod.id)}>Hapus</Button>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="p-4">
                  {mod.lessons?.length === 0 ? (
                    <p className="text-sm text-slate-500 italic mb-4">Belum ada materi di section ini.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {mod.lessons.map((lesson, lIdx) => (
                        <div key={lesson.id} className="group flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer" onClick={() => openLessonModal(mod.id, lesson)}>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono text-sm">{idx + 1}.{lIdx + 1}</span>
                            <span className="text-lg w-6 text-center text-slate-500">
                              {lesson.type === 'video' ? <FontAwesomeIcon icon={['fas', 'video']} /> : 
                               lesson.type === 'quiz' ? <FontAwesomeIcon icon={['fas', 'circle-question']} /> : 
                               lesson.type === 'assignment' ? <FontAwesomeIcon icon={['fas', 'pen-to-square']} /> : 
                               <FontAwesomeIcon icon={['fas', 'book-open']} />}
                            </span>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                {lesson.title}
                                {lesson.is_preview && <Badge color="gold" className="text-[10px]">Preview</Badge>}
                              </p>
                              <p className="text-xs text-slate-500 capitalize">{lesson.type} • {lesson.duration_seconds > 0 ? Math.round(lesson.duration_seconds/60) + ' mnt' : '-'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            {lesson.type === 'video' && lesson.video_url && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setPreviewLesson(lesson); }}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded flex items-center justify-center w-8 h-8"
                                title="Preview Video"
                              >
                                <FontAwesomeIcon icon={['fas', 'play']} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); openLessonModal(mod.id, lesson); }}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded flex items-center justify-center w-8 h-8"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={['fas', 'pen-to-square']} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteLesson(mod.id, lesson.id); }}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded flex items-center justify-center w-8 h-8"
                              title="Hapus"
                            >
                              <FontAwesomeIcon icon={['fas', 'trash-can']} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="text-blue-600 w-full border border-dashed border-blue-200 dark:border-blue-900" onClick={() => openLessonModal(mod.id)}>
                    + Tambah Materi ke Section Ini
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Module */}
        {moduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-md w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">{editingModuleId ? 'Edit Section' : 'Tambah Section Baru'}</h3>
              <form onSubmit={saveModule} className="space-y-4">
                <FormField label="Judul Section (Kelompok Materi)">
                  <Input value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} required placeholder="Misal: Pengantar Aljabar" />
                </FormField>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setModuleModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Lesson */}
        {lessonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-md w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">{editingLessonId ? 'Edit Materi' : 'Tambah Materi Baru'}</h3>
              <form onSubmit={saveLesson} className="space-y-4">
                <FormField label="Judul Materi">
                  <Input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required />
                </FormField>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Tipe Materi">
                    <select value={lessonForm.type} onChange={e => setLessonForm({...lessonForm, type: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent">
                      <option value="video">Video Pembelajaran</option>
                      <option value="reading">Artikel / Teks</option>
                      <option value="quiz">Kuis Pilihan Ganda</option>
                      <option value="assignment">Tugas Akhir / Proyek</option>
                    </select>
                  </FormField>
                  <FormField label="Durasi Estimasi (Menit)">
                    <Input type="number" min="0" value={Math.round(lessonForm.duration_seconds/60)} onChange={e => setLessonForm({...lessonForm, duration_seconds: parseInt(e.target.value)*60})} />
                  </FormField>
                </div>

                {lessonForm.type === 'video' && (
                  <FormField label="URL Video (Youtube/Vimeo Embed URL)">
                    <Input value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} placeholder="https://www.youtube.com/embed/..." />
                  </FormField>
                )}

                {(lessonForm.type === 'reading' || lessonForm.type === 'assignment') && (
                  <FormField label="Konten / Instruksi Materi">
                    <div className="bg-white text-slate-900 rounded-md overflow-hidden border border-slate-300">
                      <ReactQuill 
                        theme="snow" 
                        value={lessonForm.content || ''} 
                        onChange={val => setLessonForm({...lessonForm, content: val})} 
                        className="h-48 pb-10"
                        placeholder="Ketik materi atau instruksi tugas di sini..." 
                      />
                    </div>
                  </FormField>
                )}

                <FormField label="Hak Akses">
                  <label className="flex items-center gap-2 mt-1">
                    <input type="checkbox" checked={lessonForm.is_preview} onChange={e => setLessonForm({...lessonForm, is_preview: e.target.checked})} className="w-4 h-4 text-gold-500" />
                    <span>Jadikan Preview (Bisa diakses gratis tanpa enroll)</span>
                  </label>
                </FormField>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setLessonModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan Materi</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Video Preview Modal */}
        {previewLesson && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewLesson(null)}>
            <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{previewLesson.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Preview Video</p>
                  </div>
                  <button
                    onClick={() => setPreviewLesson(null)}
                    className="w-8 h-8 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-900 dark:text-slate-100"
                  >
                    <FontAwesomeIcon icon={['fas', 'xmark']} />
                  </button>
                </div>
                <div className="aspect-video bg-slate-900">
                  <iframe
                    width="100%"
                    height="100%"
                    src={toEmbedUrl(previewLesson.video_url)}
                    title={previewLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
