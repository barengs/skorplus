import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminExamQuestionsPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [excelDropdownOpen, setExcelDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);
  const excelDropdownRef = useRef(null);

  // Quill Image Handler & Configuration
  const questionQuillRef = useRef(null);
  const explanationQuillRef = useRef(null);

  const uploadAndInsertImage = async (file, quill, customSuccessMsg = 'Gambar berhasil disisipkan! 🖼️') => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 20MB.');
      return;
    }

    const toastId = toast.loading('Mengunggah gambar...');
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/admin/upload/thumbnail', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.url) {
        const range = quill.getSelection(true) || { index: quill.getLength() };
        quill.insertEmbed(range.index, 'image', res.data.url);
        quill.setSelection(range.index + 1);
        toast.update(toastId, {
          render: customSuccessMsg,
          type: 'success',
          isLoading: false,
          autoClose: 2000,
        });
      } else {
        throw new Error('URL gambar tidak ditemukan');
      }
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.message || 'Gagal mengunggah gambar',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleImageUpload = (getQuill) => {
    return function () {
      const quill = this?.quill || (typeof getQuill === 'function' ? getQuill() : getQuill?.current?.getEditor());
      if (!quill) {
        toast.error('Editor tidak ditemukan.');
        return;
      }
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          uploadAndInsertImage(file, quill);
        }
      };
    };
  };

  const quillModulesQuestion = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ script: 'sub' }, { script: 'super' }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload(() => questionQuillRef.current?.getEditor()),
      },
    },
  }), []);

  const quillModulesExplanation = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ script: 'sub' }, { script: 'super' }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload(() => explanationQuillRef.current?.getEditor()),
      },
    },
  }), []);

  // Form states
  const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [examTypes, setExamTypes] = useState([]);
  const [selectedSubtestFilter, setSelectedSubtestFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    exam_type_id: '', subject: '', subtest: '', question_text: '', points: 1, duration_seconds: 90, explanation_text: '', is_active: true,
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
      const [res, typesRes] = await Promise.all([
        api.get(`/admin/cbt/exams/${examId}/questions`),
        api.get('/admin/cbt/exam-types').catch(() => ({ data: [] }))
      ]);
      setExam(res.data.exam);
      setQuestions(res.data.questions);
      setExamTypes(typesRes.data || []);
    } catch (err) {
      toast.error('Gagal memuat data soal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  // Close Excel dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (excelDropdownRef.current && !excelDropdownRef.current.contains(event.target)) {
        setExcelDropdownOpen(false);
      }
    };
    if (excelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [excelDropdownOpen]);

  // Handle clipboard paste and drag & drop for images directly in editors
  useEffect(() => {
    if (!modalOpen) return;

    const cleanups = [];
    const timer = setTimeout(() => {
      [questionQuillRef, explanationQuillRef].forEach((ref) => {
        const editor = ref.current?.getEditor();
        if (!editor || !editor.root) return;

        const handlePaste = (e) => {
          const clipboardData = e.clipboardData || window.clipboardData;
          if (!clipboardData || !clipboardData.items) return;

          for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];
            if (item.type.indexOf('image') !== -1) {
              e.preventDefault();
              const file = item.getAsFile();
              if (file) {
                uploadAndInsertImage(file, editor, 'Gambar dari clipboard disisipkan! 📋🖼️');
              }
              break;
            }
          }
        };

        const handleDrop = (e) => {
          if (e.dataTransfer?.files?.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
              e.preventDefault();
              uploadAndInsertImage(file, editor, 'Gambar berhasil disisipkan! 🖼️');
            }
          }
        };

        editor.root.addEventListener('paste', handlePaste);
        editor.root.addEventListener('drop', handleDrop);

        cleanups.push(() => {
          editor.root.removeEventListener('paste', handlePaste);
          editor.root.removeEventListener('drop', handleDrop);
        });
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [modalOpen]);

  const openModal = (question = null) => {
    if (question) {
      setFormData({
        exam_type_id: question.exam_type_id || (question.exam_type?.id || ''),
        subject: question.subject || '',
        subtest: question.subtest || '',
        question_text: question.question_text || '',
        points: question.points || 1,
        duration_seconds: question.duration_seconds || 90,
        explanation_text: question.explanation_text || '',
        is_active: question.is_active,
        options: question.options && question.options.length > 0 ? question.options : [
          { option_key: 'A', option_text: '', is_correct: true },
          { option_key: 'B', option_text: '', is_correct: false }
        ]
      });
      setEditingId(question.id);
    } else {
      setFormData({
        exam_type_id: exam?.exam_type_id || '',
        subject: exam?.exam_type?.name || '',
        subtest: exam?.exam_type?.name || '',
        question_text: '',
        points: 1,
        duration_seconds: 90,
        explanation_text: '',
        is_active: true,
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

  const handleApplyPreset = (count) => {
    const newOptions = OPTION_KEYS.slice(0, count).map((key, i) => {
      const existing = formData.options[i];
      return {
        option_key: key,
        option_text: existing ? existing.option_text : '',
        is_correct: existing ? existing.is_correct : (i === 0),
      };
    });
    // Ensure at least one correct option
    if (!newOptions.some(o => o.is_correct)) {
      newOptions[0].is_correct = true;
    }
    setFormData({ ...formData, options: newOptions });
  };

  const handleAddOption = () => {
    if (formData.options.length >= 5) return;
    const nextKey = OPTION_KEYS[formData.options.length];
    const newOptions = [
      ...formData.options,
      { option_key: nextKey, option_text: '', is_correct: false },
    ];
    setFormData({ ...formData, options: newOptions });
  };

  const handleRemoveOption = (indexToRemove) => {
    if (formData.options.length <= 2) {
      toast.warning('Minimal harus ada 2 pilihan jawaban.');
      return;
    }
    const filtered = formData.options.filter((_, i) => i !== indexToRemove);
    const reindexed = filtered.map((opt, i) => ({
      ...opt,
      option_key: OPTION_KEYS[i],
    }));
    if (!reindexed.some(o => o.is_correct)) {
      reindexed[0].is_correct = true;
    }
    setFormData({ ...formData, options: reindexed });
  };

  const handleSave = async (e, shouldCreateNew = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.options.some(o => o.is_correct)) {
      toast.error('Pilih salah satu opsi sebagai kunci jawaban yang benar.');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/admin/cbt/exams/${examId}/questions/${editingId}`, formData);
        toast.success('Soal berhasil diperbarui');
      } else {
        await api.post(`/admin/cbt/exams/${examId}/questions`, formData);
        toast.success('Soal berhasil ditambahkan');
      }

      fetchData();

      if (shouldCreateNew) {
        // Reset question content and options, but keep category parameters (subtest, points, duration)
        setFormData(prev => ({
          ...prev,
          question_text: '',
          explanation_text: '',
          is_active: true,
          options: [
            { option_key: 'A', option_text: '', is_correct: true },
            { option_key: 'B', option_text: '', is_correct: false },
            { option_key: 'C', option_text: '', is_correct: false },
            { option_key: 'D', option_text: '', is_correct: false },
            { option_key: 'E', option_text: '', is_correct: false },
          ]
        }));
        setEditingId(null);
        toast.info('Formulir siap untuk menginput soal berikutnya ✨');
      } else {
        setModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan soal');
    } finally {
      setSaving(false);
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

  const handleExport = async () => {
    try {
      const response = await api.get(`/admin/cbt/exams/${examId}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `soal-${exam?.title?.replace(/\s+/g, '-') || examId}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('File Excel berhasil diunduh!');
    } catch (err) {
      toast.error('Gagal mengexport soal');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/admin/cbt/template-excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template-import-soal-cbt.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template Excel berhasil diunduh!');
    } catch (err) {
      toast.error('Gagal mengunduh template Excel');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Pilih file Excel terlebih dahulu');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setImporting(true);
      const response = await api.post(`/admin/cbt/exams/${examId}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success(response.data.message || 'Soal berhasil diimport!');
      if (response.data.imported) {
        toast.info(`${response.data.imported} soal berhasil diimport`);
      }
      
      setImportModalOpen(false);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchData();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        errors.forEach(e => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || 'Gagal mengimport soal');
      }
    } finally {
      setImporting(false);
    }
  };

  const distinctSubtests = React.useMemo(() => {
    const set = new Set();
    questions.forEach(q => {
      const name = q.exam_type?.name || q.subtest || q.subject;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [questions]);

  const filteredQuestions = React.useMemo(() => {
    if (selectedSubtestFilter === 'ALL') return questions;
    return questions.filter(q => {
      const name = q.exam_type?.name || q.subtest || q.subject;
      return name === selectedSubtestFilter;
    });
  }, [questions, selectedSubtestFilter]);

  return (
    <AppLayout title="Manajemen Soal Ujian">
      <div className="w-full pb-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <Link to="/admin/cbt">
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-1.5 text-xs">
                <FontAwesomeIcon icon={['fas', 'arrow-left']} />
                <span>Kembali</span>
              </Button>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {exam ? exam.title : 'Memuat...'}
                </h2>
                {exam?.exam_type && (
                  <Badge color="blue" className="text-xs">
                    {exam.exam_type.icon || '🎯'} {exam.exam_type.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Total Soal: <span className="font-bold text-slate-700 dark:text-slate-300">{questions.length}</span> · Durasi Ujian: <span className="font-bold text-slate-700 dark:text-slate-300">{exam?.duration_minutes || 0} menit</span>
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2.5 shrink-0">
            {/* Dropdown Menu Berkas Excel (Template, Import, Export) */}
            <div className="relative" ref={excelDropdownRef}>
              <button
                type="button"
                onClick={() => setExcelDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer shadow-2xs ${
                  excelDropdownOpen
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
                title="Aksi berkas Excel: Unduh Template, Import, dan Export Soal"
              >
                <FontAwesomeIcon icon={['fas', 'file-excel']} className="text-emerald-600 dark:text-emerald-400 text-base" />
                <span>Kelola Excel</span>
                <FontAwesomeIcon
                  icon={['fas', 'chevron-down']}
                  className={`text-xs text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                    excelDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {excelDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-40 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Opsi Berkas Excel
                  </div>

                  {/* 1. Unduh Template Excel */}
                  <button
                    type="button"
                    onClick={() => {
                      setExcelDropdownOpen(false);
                      handleDownloadTemplate();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FontAwesomeIcon icon={['fas', 'file-lines']} className="text-sm" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        Template Excel
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Unduh format template untuk input soal
                      </div>
                    </div>
                  </button>

                  {/* 2. Import Excel */}
                  <button
                    type="button"
                    onClick={() => {
                      setExcelDropdownOpen(false);
                      setImportModalOpen(true);
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-2xs">
                      <FontAwesomeIcon icon={['fas', 'upload']} className="text-xs" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                        <span>Import Excel</span>
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                          Upload
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Unggah & impor banyak butir soal
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  {/* 3. Export Excel */}
                  <button
                    type="button"
                    onClick={() => {
                      setExcelDropdownOpen(false);
                      handleExport();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FontAwesomeIcon icon={['fas', 'download']} className="text-xs" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Export Excel
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Unduh seluruh butir soal paket ini
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Tombol Utama Tambah Soal */}
            <Button onClick={() => openModal()} className="font-bold h-10 px-4 text-sm inline-flex items-center gap-1.5 shadow-xs">
              <FontAwesomeIcon icon={['fas', 'plus']} className="text-xs" />
              <span>Tambah Soal</span>
            </Button>
          </div>
        </div>

        {/* Subtests Filter Pills */}
        {distinctSubtests.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Filter Subtes:</span>
            <button
              type="button"
              onClick={() => setSelectedSubtestFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedSubtestFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua Subtes ({questions.length})
            </button>
            {distinctSubtests.map((st, i) => {
              const count = questions.filter(q => (q.exam_type?.name || q.subtest || q.subject) === st).length;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedSubtestFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedSubtestFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500">
            {questions.length === 0 ? 'Belum ada soal pada ujian ini.' : 'Tidak ada soal untuk subtes yang dipilih.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 relative shadow-xs">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge color="blue">{q.points} Poin</Badge>
                  <Button variant="ghost" size="sm" onClick={() => openModal(q)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(q.id)}>Hapus</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-bold text-lg text-slate-900 dark:text-slate-100">{idx + 1}.</span>
                  {q.exam_type ? (
                    <Badge color="blue" className="text-xs font-semibold">
                      {q.exam_type.icon || '🧩'} {q.exam_type.name}
                    </Badge>
                  ) : q.subject ? (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                      {q.subject}
                    </span>
                  ) : null}
                  {q.subtest && q.subtest !== q.exam_type?.name && (
                    <span className="text-xs text-slate-500 font-medium">({q.subtest})</span>
                  )}
                  {q.duration_seconds && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                      ⏱️ {q.duration_seconds} dtk
                    </span>
                  )}
                </div>
                <div className="prose dark:prose-invert max-w-none mb-4 whitespace-pre-wrap text-slate-900 dark:text-slate-100" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                
                <div className="grid md:grid-cols-2 gap-2 mt-4 pl-4 sm:pl-6">
                  {q.options?.map((opt) => (
                    <div key={opt.id} className={`p-3 border rounded-xl text-sm flex gap-3 ${opt.is_correct ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      <span className="font-bold">{opt.option_key}.</span>
                      <span className={opt.is_correct ? 'font-semibold' : ''}>{opt.option_text}</span>
                      {opt.is_correct && <span className="ml-auto font-bold text-emerald-600 dark:text-emerald-400">✅ Kunci</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Import Modal */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-lg">
                    📤
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Import Soal dari Excel</h3>
                    <p className="text-xs text-slate-500">Unggah file spreadsheet untuk menambahkan banyak soal sekaligus.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Download Template Box */}
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        📄 Belum Punya Template?
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        Gunakan template resmi kami agar format kolom sesuai.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
                    >
                      <span>📥 Unduh Template (.xlsx)</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                    <p className="font-semibold">Format Kolom Excel:</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Mata Pelajaran, Sub Test, Pertanyaan, Poin, Penjelasan, Status, Pilihan A-E, dan Benar A-E (Y/N).
                    </p>
                  </div>
                </div>
                
                <FormField label="Pilih File Excel (.xlsx / .xls)">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950/60 dark:file:text-blue-300 cursor-pointer"
                  />
                </FormField>

                <div className="flex justify-end gap-3 pt-3">
                  <Button type="button" variant="ghost" onClick={() => setImportModalOpen(false)} disabled={importing}>
                    Batal
                  </Button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || !importFile}
                    className="inline-flex items-center justify-center font-bold text-sm px-5 py-2.5 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {importing ? 'Mengimport...' : 'Mulai Import Soal'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Responsive Question Studio Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950 animate-in fade-in duration-200 overflow-hidden">
            {/* Top Bar (Sticky / Fixed) */}
            <div className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-lg leading-none"
                  title="Tutup formulir"
                >
                  ✕
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                      {editingId ? 'Edit Soal Ujian' : 'Tambah Soal Baru'}
                    </h3>
                    <Badge color={formData.is_active ? 'emerald' : 'slate'}>
                      {formData.is_active ? 'Aktif' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {exam?.title || 'Paket Ujian CBT'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <button
                  type="button"
                  onClick={(e) => handleSave(e, true)}
                  disabled={saving}
                  className="inline-flex items-center justify-center font-bold text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 rounded-md gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Simpan soal ini dan langsung bersihkan formulir untuk membuat soal berikutnya"
                >
                  <span>➕ Simpan dan Buat Baru</span>
                </button>
                <Button
                  type="submit"
                  form="question-form"
                  size="sm"
                  loading={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 sm:px-5"
                >
                  💾 {editingId ? 'Simpan Perubahan' : 'Simpan Soal'}
                </Button>
              </div>
            </div>

            {/* Scrollable Form Body: 2-Column Responsive Layout */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <form id="question-form" onSubmit={handleSave} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Metadata Soal, Pertanyaan, & Pembahasan (7 cols on lg+) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Card 1: Metadata Soal */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        📋 Parameter & Kategori Soal
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={e => setFormData({...formData, is_active: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Soal Aktif Ditampilkan</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Tipe / Subtes Ujian (Master)" required>
                        <select
                          value={formData.exam_type_id || ''}
                          onChange={e => {
                            const selId = e.target.value ? parseInt(e.target.value) : '';
                            const matched = examTypes.find(t => t.id === selId);
                            setFormData({
                              ...formData,
                              exam_type_id: selId,
                              subtest: matched ? matched.name : formData.subtest,
                              subject: matched ? matched.name : formData.subject,
                            });
                          }}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          required
                        >
                          <option value="">-- Pilih Tipe / Subtes Ujian --</option>
                          {examTypes.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.icon || '📝'} {t.name} ({t.code || t.id})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Pilih subtes dari master data tipe ujian.
                        </p>
                      </FormField>

                      <FormField label="Topik / Materi Spesifik (Opsional)">
                        <Input
                          value={formData.subtest}
                          onChange={e => setFormData({...formData, subtest: e.target.value})}
                          placeholder="Contoh: Logika Analitik, Silogisme, dll."
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Materi atau bab spesifik dari subtes di atas.
                        </p>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <FormField label="Bobot Skor Poin">
                        <Input
                          type="number"
                          min="1"
                          value={formData.points}
                          onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 1})}
                        />
                      </FormField>
                      <FormField label="Batas Waktu Soal (Detik)">
                        <Input
                          type="number"
                          min="10"
                          max="3600"
                          placeholder="Contoh: 90"
                          value={formData.duration_seconds || ''}
                          onChange={e => setFormData({...formData, duration_seconds: e.target.value ? parseInt(e.target.value) : null})}
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Card 2: Konten Pertanyaan */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>📝 Isi Pertanyaan Soal</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleImageUpload(() => questionQuillRef.current?.getEditor())()}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/60 transition"
                          title="Unggah dan sisipkan gambar ke dalam pertanyaan"
                        >
                          <span>🖼️ Sisipkan Gambar</span>
                        </button>
                        <span className="hidden sm:inline text-xs text-slate-400">Dukungan format teks kaya & gambar</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500">
                      <ReactQuill
                        ref={questionQuillRef}
                        theme="snow"
                        value={formData.question_text}
                        onChange={(content) => setFormData({...formData, question_text: content})}
                        className="h-44 sm:h-52 mb-11"
                        placeholder="Ketikkan teks pertanyaan di sini..."
                        modules={quillModulesQuestion}
                      />
                    </div>
                  </div>

                  {/* Card 3: Penjelasan / Pembahasan */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        💡 Penjelasan & Kunci Pembahasan
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleImageUpload(() => explanationQuillRef.current?.getEditor())()}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/60 transition"
                          title="Unggah dan sisipkan gambar ke pembahasan"
                        >
                          <span>🖼️ Sisipkan Gambar</span>
                        </button>
                        <span className="hidden sm:inline text-xs text-slate-400">Muncul setelah evaluasi selesai</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500">
                      <ReactQuill
                        ref={explanationQuillRef}
                        theme="snow"
                        value={formData.explanation_text}
                        onChange={(content) => setFormData({...formData, explanation_text: content})}
                        className="h-32 mb-11"
                        placeholder="Tuliskan langkah-langkah penyelesaian atau pembahasan..."
                        modules={quillModulesExplanation}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Pilihan Jawaban Soal (5 cols on lg+) */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 lg:sticky lg:top-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>🎯 Pilihan Jawaban</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                            {formData.options.length} Opsi
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Tandai radio button sebagai kunci jawaban benar.
                        </p>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-400 mr-1">Preset:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(2)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          formData.options.length === 2
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        2 Opsi (Benar/Salah)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(4)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          formData.options.length === 4
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        4 Opsi (A-D)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(5)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          formData.options.length === 5
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        5 Opsi (A-E)
                      </button>
                    </div>

                    {/* Options list */}
                    <div className="space-y-3">
                      {formData.options.map((opt, i) => {
                        const isCorrect = opt.is_correct;
                        return (
                          <div
                            key={opt.option_key}
                            className={`p-3 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="is_correct"
                                  checked={isCorrect}
                                  onChange={() => handleOptionChange(i, 'is_correct', true)}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className={`font-black text-xs px-2 py-0.5 rounded-md border ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                }`}>
                                  Opsi {opt.option_key}
                                </span>
                                {isCorrect && (
                                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    ✓ Kunci Jawaban Benar
                                  </span>
                                )}
                              </label>

                              {formData.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(i)}
                                  className="text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded-md transition-colors cursor-pointer"
                                  title={`Hapus opsi ${opt.option_key}`}
                                >
                                  🗑️ Hapus
                                </button>
                              )}
                            </div>

                            <textarea
                              rows={2}
                              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all resize-y"
                              placeholder={`Teks pilihan jawaban ${opt.option_key}...`}
                              value={opt.option_text}
                              onChange={e => handleOptionChange(i, 'option_text', e.target.value)}
                              required
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Add option button */}
                    {formData.options.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="w-full py-2.5 text-xs font-bold rounded-xl border-2 border-dashed border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <span>➕ Tambah Pilihan Jawaban ({OPTION_KEYS[formData.options.length]})</span>
                      </button>
                    )}

                    {/* Quick status summary footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>Kunci Jawaban: <strong className="text-emerald-600 dark:text-emerald-400">{formData.options.find(o => o.is_correct)?.option_key || '-'}</strong></span>
                      <span>Total: <strong>{formData.options.length} Opsi</strong></span>
                    </div>

                    {/* Bottom action buttons on mobile */}
                    <div className="lg:hidden flex flex-col gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="flex-1"
                          onClick={() => setModalOpen(false)}
                          disabled={saving}
                        >
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          form="question-form"
                          className="flex-1"
                          loading={saving}
                        >
                          💾 {editingId ? 'Simpan Perubahan' : 'Simpan Soal'}
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleSave(e, true)}
                        disabled={saving}
                        className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        ➕ Simpan dan Buat Baru
                      </button>
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
