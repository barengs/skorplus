import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import api from '../../../../services/api';
import { toast } from 'react-toastify';

export default function AdminLandingPage() {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(false);

  // States for each section
  const [hero, setHero] = useState({
    title: '',
    subtitle: '',
    description: '',
    badge_text: '',
    cta_primary_text: '',
    cta_primary_link: '',
    cta_secondary_text: '',
    cta_secondary_link: '',
  });

  const [promo, setPromo] = useState({
    text: '',
    countdown_seconds: 0,
    is_active: true,
  });

  const [features, setFeatures] = useState([]);
  const [stats, setStats] = useState([]);

  // Modal states
  const [modalType, setModalType] = useState(null); // 'feature' | 'stat'
  const [editingItem, setEditingItem] = useState(null);

  // Fetch all CMS data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, pRes, fRes, sRes] = await Promise.all([
        api.get('/admin/landing-hero'),
        api.get('/admin/landing-promo'),
        api.get('/admin/features'),
        api.get('/admin/stats'),
      ]);

      if (hRes.data) setHero(hRes.data);
      if (pRes.data) setPromo(pRes.data);
      setFeatures(fRes.data || []);
      setStats(sRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data CMS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Hero
  const handleSaveHero = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/landing-hero', hero);
      toast.success('Hero section berhasil disimpan! ✨');
    } catch (err) {
      toast.error('Gagal menyimpan Hero section.');
    }
  };

  // Save Promo
  const handleSavePromo = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/landing-promo', promo);
      toast.success('Promo banner berhasil disimpan! ✨');
    } catch (err) {
      toast.error('Gagal menyimpan Promo banner.');
    }
  };

  // Delete item handler
  const handleDelete = async (type, id) => {
    if (!window.confirm('Yakin ingin menghapus item ini?')) return;
    try {
      await api.delete(`/admin/${type}s/${id}`);
      toast.success('Item berhasil dihapus.');
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus item.');
    }
  };

  // Save Modal Item handler
  const handleSaveModalItem = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'feature') {
        if (editingItem.id) {
          await api.put(`/admin/features/${editingItem.id}`, editingItem);
        } else {
          await api.post('/admin/features', editingItem);
        }
      } else if (modalType === 'stat') {
        if (editingItem.id) {
          await api.put(`/admin/stats/${editingItem.id}`, editingItem);
        } else {
          await api.post('/admin/stats', editingItem);
        }
      }

      toast.success('Perubahan berhasil disimpan! ✨');
      setModalType(null);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error('Gagal menyimpan perubahan.');
    }
  };

  return (
    <AppLayout title="Kelola Landing Page">
      <div className="w-full pb-16 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Content Management Landing Page</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Atur konten dinamis landing page secara langsung tanpa mengubah kode sumber.</p>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="gap-2">
              Lihat Tampilan Live ↗
            </Button>
          </a>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 mb-6">
          {[
            { id: 'hero', label: '🎯 Hero Section' },
            { id: 'promo', label: '📢 Promo Banner' },
            { id: 'features', label: '⚡ Fitur' },
            { id: 'stats', label: '📊 Statistik' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-md font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Hero */}
        {activeTab === 'hero' && (
          <form onSubmit={handleSaveHero} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Hero Section Utama</h3>
            
            <FormField label="Badge / Tagline Atas">
              <Input
                value={hero.badge_text || ''}
                onChange={(e) => setHero({ ...hero, badge_text: e.target.value })}
                placeholder="Contoh: Platform Bimbel & LMS #1..."
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField label="Judul Utama">
                <Input
                  value={hero.title || ''}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  placeholder="Raih Kampus Impian"
                  required
                />
              </FormField>
              <FormField label="Sub-Judul (Gradient Highlight)">
                <Input
                  value={hero.subtitle || ''}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  placeholder="Bersama SkorPluss"
                />
              </FormField>
            </div>

            <FormField label="Deskripsi Hero">
              <textarea
                className="w-full p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={hero.description || ''}
                onChange={(e) => setHero({ ...hero, description: e.target.value })}
                placeholder="Persiapan komprehensif UTBK-SNBT..."
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField label="Teks Tombol Utama (Primary CTA)">
                <Input
                  value={hero.cta_primary_text || ''}
                  onChange={(e) => setHero({ ...hero, cta_primary_text: e.target.value })}
                  placeholder="🚀 Mulai Belajar Gratis"
                />
              </FormField>
              <FormField label="Link Tombol Utama">
                <Input
                  value={hero.cta_primary_link || ''}
                  onChange={(e) => setHero({ ...hero, cta_primary_link: e.target.value })}
                  placeholder="/daftar"
                />
              </FormField>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField label="Teks Tombol Sekunder">
                <Input
                  value={hero.cta_secondary_text || ''}
                  onChange={(e) => setHero({ ...hero, cta_secondary_text: e.target.value })}
                  placeholder="Lihat Program →"
                />
              </FormField>
              <FormField label="Link Tombol Sekunder">
                <Input
                  value={hero.cta_secondary_link || ''}
                  onChange={(e) => setHero({ ...hero, cta_secondary_link: e.target.value })}
                  placeholder="#program"
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Simpan Hero Section</Button>
            </div>
          </form>
        )}

        {/* Tab 2: Promo */}
        {activeTab === 'promo' && (
          <form onSubmit={handleSavePromo} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Banner Promo Pengumuman (Atas Navigasi)</h3>
            
            <FormField label="Teks Promo">
              <Input
                value={promo.text || ''}
                onChange={(e) => setPromo({ ...promo, text: e.target.value })}
                placeholder="🎉 Promo Gelombang Emas — Diskon 40%!"
                required
              />
            </FormField>

            <FormField label="Durasi Countdown (Detik)">
              <Input
                type="number"
                value={promo.countdown_seconds || 0}
                onChange={(e) => setPromo({ ...promo, countdown_seconds: parseInt(e.target.value) || 0 })}
                placeholder="Contoh: 172800 (48 jam)"
              />
            </FormField>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="promo_active"
                checked={!!promo.is_active}
                onChange={(e) => setPromo({ ...promo, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="promo_active" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tampilkan Banner Promo di Landing Page
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Simpan Promo Banner</Button>
            </div>
          </form>
        )}

        {/* Tab 3: Features */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Daftar Fitur Unggulan</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem({
                    icon: '🚀',
                    title: '',
                    description: '',
                    is_active: true,
                    sort_order: features.length + 1,
                  });
                  setModalType('feature');
                }}
              >
                + Tambah Fitur
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-3xl mb-3">{f.icon}</div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{f.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{f.description}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItem(f);
                        setModalType('feature');
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete('feature', f.id)}>
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Stats */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Daftar Statistik (Counter)</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem({
                    label: '',
                    value: '',
                    is_active: true,
                    sort_order: stats.length + 1,
                  });
                  setModalType('stat');
                }}
              >
                + Tambah Stat
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center flex flex-col justify-between">
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItem(s);
                        setModalType('stat');
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete('stat', s.id)}>
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Editor */}
        {modalType && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {editingItem.id ? 'Edit' : 'Tambah'} {modalType.toUpperCase()}
              </h3>

              <form onSubmit={handleSaveModalItem} className="space-y-4">
                {modalType === 'feature' && (
                  <>
                    <FormField label="Icon Emoji">
                      <Input
                        value={editingItem.icon || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                        required
                      />
                    </FormField>
                    <FormField label="Judul Fitur">
                      <Input
                        value={editingItem.title || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        required
                      />
                    </FormField>
                    <FormField label="Deskripsi Singkat">
                      <textarea
                        className="w-full p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        value={editingItem.description || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        required
                      />
                    </FormField>
                  </>
                )}

                {modalType === 'stat' && (
                  <>
                    <FormField label="Nilai (Value)">
                      <Input
                        value={editingItem.value || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                        placeholder="Contoh: 12.400+"
                        required
                      />
                    </FormField>
                    <FormField label="Label Keterangan">
                      <Input
                        value={editingItem.label || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                        placeholder="Contoh: Siswa Aktif"
                        required
                      />
                    </FormField>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setModalType(null);
                      setEditingItem(null);
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    Simpan
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
