import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatRupiah } from '../../../../utils/currencyHelper';

export default function AdminLearningPackagePage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/learning-packages');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPackages(data);
    } catch (err) {
      toast.error('Gagal memuat paket belajar');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePackage = async (id) => {
    if (confirm('Yakin ingin menghapus paket belajar ini?')) {
      try {
        await api.delete(`/admin/learning-packages/${id}`);
        toast.success('Paket belajar berhasil dihapus');
        fetchPackages();
      } catch (err) {
        toast.error('Gagal menghapus paket belajar');
      }
    }
  };

  return (
    <AppLayout title="Paket Belajar">
      <div className="w-full pb-16 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Manajemen E-Learning
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500">Program & Paket</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              Daftar Paket Belajar
            </h1>
          </div>

          <Button
            onClick={() => navigate('/admin/learning-packages/create')}
            className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
          >
            <FontAwesomeIcon icon={['fas', 'plus']} />
            <span>Tambah Paket Belajar</span>
          </Button>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Memuat data paket belajar...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-2xl">
              <FontAwesomeIcon icon={['fas', 'box-open']} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Belum ada paket belajar
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Buat bundel paket belajar pertama Anda untuk menggabungkan beberapa kursus dan simulasi CBT.
              </p>
            </div>
            <Button
              onClick={() => navigate('/admin/learning-packages/create')}
              className="!bg-blue-600 text-white font-bold text-xs px-4 py-2"
            >
              + Tambah Paket Pertama
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => navigate(`/admin/learning-packages/${pkg.id}`)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer flex flex-col"
              >
                {pkg.thumbnail ? (
                  <div className="h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <img
                      src={pkg.thumbnail}
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-xs font-semibold flex items-center gap-1">
                        <FontAwesomeIcon icon={['fas', 'eye']} /> Klik untuk lihat detil
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <FontAwesomeIcon icon={['fas', 'box-archive']} className="text-3xl" />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-base">
                      {pkg.name}
                    </h3>
                    {pkg.is_published ? (
                      <Badge color="emerald" size="sm">Publish</Badge>
                    ) : (
                      <Badge color="slate" size="sm">Draft</Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {pkg.description ? pkg.description.replace(/<[^>]*>?/gm, '') : 'Tidak ada deskripsi untuk paket ini.'}
                  </p>

                  {/* Metadata Chips: Kursus, Paket Ujian & CBT Quota */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px]">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <FontAwesomeIcon icon={['fas', 'book-open']} className="text-blue-500 text-[10px]" />
                      <span>{pkg.courses?.length || 0} Kursus</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-800/50">
                      <FontAwesomeIcon icon={['fas', 'clipboard-list']} className="text-indigo-500 text-[10px]" />
                      <span>{pkg.exams?.length || 0} Ujian</span>
                    </span>

                    {pkg.cbt_quota ? (
                      <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1 border border-purple-200/50 dark:border-purple-800/50">
                        <FontAwesomeIcon icon={['fas', 'file-signature']} className="text-purple-500 text-[10px]" />
                        <span>{pkg.cbt_quota}x CBT</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200/50 dark:border-emerald-800/50">
                        <FontAwesomeIcon icon={['fas', 'infinity']} className="text-emerald-500 text-[10px]" />
                        <span>CBT Bebas</span>
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mb-4 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {formatRupiah(pkg.price)}
                    </div>
                    {pkg.discount_price && (
                      <div className="text-xs text-slate-400 line-through">
                        {formatRupiah(pkg.discount_price)}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons (Navigate to regular edit page) */}
                  <div
                    className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs"
                      onClick={() => navigate(`/admin/learning-packages/${pkg.id}/edit`)}
                    >
                      <FontAwesomeIcon icon={['fas', 'pen-to-square']} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                      onClick={() => deletePackage(pkg.id)}
                    >
                      <FontAwesomeIcon icon={['fas', 'trash-can']} className="mr-1" /> Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
