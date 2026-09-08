import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import { formatRupiah } from '../../../utils/currencyHelper';

export default function LearningPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/learning-packages');
      setPackages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || packages.length === 0) return null;

  return (
    <div className="py-24 bg-slate-50 dark:bg-slate-900/50" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">Pilihan Paket Belajar</h2>
          <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 mb-4">
            Investasi Terbaik Untuk Masa Depanmu
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Pilih paket belajar yang sesuai dengan kebutuhanmu. Akses ribuan materi dan kuis interaktif.
          </p>
        </div>

        <div className="overflow-x-auto pb-8 snap-x snap-mandatory flex gap-6 hide-scrollbar">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className="flex-none w-[320px] snap-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col"
            >
              {pkg.thumbnail && (
                <div className="h-40 bg-slate-200 dark:bg-slate-800 relative">
                  <img src={pkg.thumbnail} alt={pkg.name} className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{pkg.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{pkg.description}</p>
                
                <div className="mb-6">
                  {pkg.discount_price && (
                    <div className="text-sm text-slate-500 line-through mb-1">
                      {formatRupiah(pkg.discount_price)}
                    </div>
                  )}
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                      {formatRupiah(pkg.price)}
                    </span>
                  </div>
                </div>

                {pkg.features && pkg.features.length > 0 && (
                  <ul className="space-y-3 mb-8 flex-1">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <FontAwesomeIcon icon={['fas', 'check-circle']} className="text-emerald-500 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto">
                  <Button className="w-full font-bold py-3" color="blue" size="lg">
                    Pilih Paket
                  </Button>
                  <p className="text-center text-xs text-slate-500 mt-3">
                    Bebas akses {pkg.courses?.length || 0} kursus premium
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Style for hide-scrollbar */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
      </div>
    </div>
  );
}
