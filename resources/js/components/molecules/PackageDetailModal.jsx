import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatRupiah } from '../../utils/currencyHelper';

export default function PackageDetailModal({ pkg, onClose }) {
  if (!pkg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl my-8 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with image or gradient */}
        <div className="relative">
          {pkg.thumbnail ? (
            <div className="h-48 w-full bg-slate-100 dark:bg-slate-800 relative">
              <img src={pkg.thumbnail} alt={pkg.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <FontAwesomeIcon icon={['fas', 'box-open']} className="text-white text-5xl opacity-40" />
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={['fas', 'xmark']} />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <Badge color="blue" className="mb-2 shadow">Paket Belajar</Badge>
              <h2 className="text-2xl font-black text-white drop-shadow-md">{pkg.name}</h2>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Price */}
          <div className="flex items-baseline gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold mb-1">Harga Investasi</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  {formatRupiah(pkg.price)}
                </span>
                {pkg.discount_price && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatRupiah(pkg.discount_price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {pkg.description && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Deskripsi Paket</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {pkg.description}
              </p>
            </div>
          )}

          {/* Features */}
          {pkg.features && pkg.features.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Fasilitas yang Didapatkan:</h3>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {pkg.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-slate-100 dark:border-slate-800/60">
                    <FontAwesomeIcon icon={['fas', 'circle-check']} className="text-emerald-500 text-sm shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bundled Courses */}
          {pkg.courses && pkg.courses.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={['fas', 'book-open']} className="text-blue-500" />
                Kursus Tersedia dalam Paket Ini ({pkg.courses.length})
              </h3>
              <div className="space-y-2.5">
                {pkg.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg"
                  >
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-12 h-12 object-cover rounded shadow-sm shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={['fas', 'graduation-cap']} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{course.title}</h4>
                      <p className="text-xs text-slate-500">{course.category || 'Materi Belajar'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Link to="/daftar">
            <Button color="blue" className="shadow-lg shadow-blue-500/20">
              Daftar & Ambil Paket Ini →
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
