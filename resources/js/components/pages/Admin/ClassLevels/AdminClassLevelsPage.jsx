import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import DataTable from '../../../organisms/DataTable/DataTable';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap,
  faPlus,
  faEdit,
  faTrash,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

export default function AdminClassLevelsPage() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'SMA/MA/SMK',
    description: '',
    sort_order: 1,
    is_active: true,
  });

  const loadLevels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/class-levels');
      setLevels(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Gagal memuat master tingkat kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevels();
  }, []);

  const openModal = (level = null) => {
    if (level) {
      setEditingLevel(level);
      setFormData({
        name: level.name || '',
        category: level.category || 'SMA/MA/SMK',
        description: level.description || '',
        sort_order: level.sort_order ?? 1,
        is_active: Boolean(level.is_active),
      });
    } else {
      setEditingLevel(null);
      setFormData({
        name: '',
        category: 'SMA/MA/SMK',
        description: '',
        sort_order: levels.length + 1,
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        sort_order: parseInt(formData.sort_order, 10) || 0,
      };
      if (editingLevel) {
        const res = await api.put(`/admin/class-levels/${editingLevel.id}`, payload);
        setLevels((prev) =>
          prev.map((item) => (item.id === editingLevel.id ? res.data.class_level : item))
        );
        toast.success('Master tingkat kelas berhasil diperbarui!');
      } else {
        const res = await api.post('/admin/class-levels', payload);
        setLevels((prev) => [...prev, res.data.class_level]);
        toast.success('Master tingkat kelas berhasil ditambahkan!');
      }
      setModalOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : err?.response?.data?.message || 'Gagal menyimpan tingkat kelas';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (level) => {
    if (!window.confirm(`Hapus tingkat kelas "${level.name}"?`)) return;
    try {
      await api.delete(`/admin/class-levels/${level.id}`);
      setLevels((prev) => prev.filter((item) => item.id !== level.id));
      toast.success('Tingkat kelas berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus tingkat kelas');
    }
  };

  const filteredLevels = useMemo(() => {
    return levels.filter((lvl) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (lvl.name || '').toLowerCase().includes(q) ||
        (lvl.category || '').toLowerCase().includes(q) ||
        (lvl.description || '').toLowerCase().includes(q)
      );
    });
  }, [levels, searchTerm]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'sort_order',
        header: 'Urutan',
        cell: (info) => (
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            #{info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Nama Tingkat Kelas',
        cell: (info) => (
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</div>
            <div className="text-xs text-slate-400 font-mono">slug: {info.row.original.slug}</div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Jenjang / Kategori',
        cell: (info) => <Badge color="blue">{info.getValue() || 'Umum'}</Badge>,
      },
      {
        accessorKey: 'description',
        header: 'Keterangan',
        cell: (info) => (
          <span className="text-xs text-slate-600 dark:text-slate-400">{info.getValue() || '-'}</span>
        ),
      },
      {
        accessorKey: 'student_profiles_count',
        header: 'Jumlah Siswa',
        cell: (info) => <Badge color="slate">{info.getValue() || 0} siswa</Badge>,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: (info) =>
          info.getValue() ? (
            <Badge color="emerald">✓ Aktif</Badge>
          ) : (
            <Badge color="slate">Nonaktif</Badge>
          ),
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="sm" onClick={() => openModal(row.original)}>
              <FontAwesomeIcon icon={faEdit} className="mr-1" /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(row.original)}>
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <AppLayout title="Master Tingkat Kelas">
      <div className="w-full pb-16 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Kembali ke Kelola Pengguna
              </Link>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
              <span>Master Data Tingkat Kelas</span>
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Kelola opsi tingkat kelas secara dinamis untuk digunakan pada Profil Siswa, Admin Sekolah, dan Pendaftaran.
            </p>
          </div>

          <Button onClick={() => openModal()}>
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Tambah Tingkat Kelas
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Input
            placeholder="Cari tingkat kelas atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <DataTable columns={columns} data={filteredLevels} loading={loading} />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {editingLevel ? 'Edit Tingkat Kelas' : 'Tambah Tingkat Kelas Baru'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Tingkat Kelas <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kelas 12 (XII)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jenjang / Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
                  >
                    <option value="SMA/MA/SMK">SMA/MA/SMK</option>
                    <option value="SMP/MTs">SMP/MTs</option>
                    <option value="SD/MI">SD/MI</option>
                    <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                    <option value="Umum">Umum / Alumni</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Urutan Tampil
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Keterangan Singkat
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi tingkat kelas..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="class_level_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label
                  htmlFor="class_level_active"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Aktifkan (Tampil di pilihan dropdown siswa)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

