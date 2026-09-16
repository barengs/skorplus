import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import { fetchAdminCourses, createAdminCourse, updateAdminCourse, deleteAdminCourse } from '../../../../features/admin/adminElearningSlice';
import { toast } from 'react-toastify';
import api from '../../../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AdminElearningPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courses, loading } = useSelector((state) => state.adminElearning);
  
  useEffect(() => {
    dispatch(fetchAdminCourses());
  }, [dispatch]);

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
          <Button onClick={() => navigate('/admin/elearning/courses/create')}>+ Tambah Pelajaran</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            courses.map(course => (
              <div key={course.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between">
                {/* Clickable Area for Card */}
                <Link to={`/admin/elearning/courses/${course.id}/curriculum`} className="block hover:opacity-90 transition-opacity cursor-pointer">
                  {/* Thumbnail */}
                  <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
                        <FontAwesomeIcon icon={['fas', 'image']} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 pb-0">
                    <Badge color="blue" className="mb-2">{course.category}</Badge>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{course.title}</h3>
                    <div 
                      className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3" 
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1.5"><FontAwesomeIcon icon={['fas', 'users']} /> {course.participants || 0} peserta</span>
                      <div className="flex items-center gap-1">
                        {renderStars(course.rating || 0)}
                        <span className="ml-1">{(Number(course.rating) || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Actions */}
                <div className="p-4 pt-3 mt-auto border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                  <Link to={`/admin/elearning/courses/${course.id}/curriculum`}>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 font-semibold">
                      <FontAwesomeIcon icon={['fas', 'folder-open']} className="mr-2" /> Kurikulum
                    </Button>
                  </Link>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => navigate(`/admin/elearning/courses/${course.id}/edit`)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" 
                      title="Edit Course"
                    >
                      <FontAwesomeIcon icon={['fas', 'pen-to-square']} />
                    </button>
                    <button 
                      onClick={() => handleDelete(course.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" 
                      title="Hapus Course"
                    >
                      <FontAwesomeIcon icon={['fas', 'trash-can']} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </AppLayout>
  );
}
