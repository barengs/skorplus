import React, { useState, useEffect } from 'react';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Input from '../../../atoms/Input';
import FormField from '../../../molecules/FormField';
import api from '../../../../services/api';
import { toast } from 'react-toastify';

export default function AdminRolesPage() {
  const [matrix, setMatrix] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal new role
  const [modalOpen, setModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/roles/matrix');
      setMatrix(res.data.menus || []);
      setRoles(res.data.roles || []);
    } catch (err) {
      toast.error('Gagal memuat matrix Role & Menu');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (menuId, roleId, currentAccess) => {
    try {
      // Optimistic UI update
      setMatrix((prevMatrix) =>
        prevMatrix.map((menu) => {
          if (menu.id === menuId) {
            const newRoles = currentAccess
              ? menu.roles.filter((r) => r !== roleId)
              : [...menu.roles, roleId];
            return { ...menu, roles: newRoles };
          }
          return menu;
        })
      );

      await api.post('/admin/roles/matrix/toggle', {
        menu_id: menuId,
        role_id: roleId,
        has_access: !currentAccess,
      });

      toast.success('Matrix akses berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui akses');
      fetchMatrix(); // Revert on failure
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/roles', { name: newRoleName });
      toast.success(`Role '${newRoleName}' berhasil dibuat!`);
      setNewRoleName('');
      setModalOpen(false);
      fetchMatrix();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan role');
    }
  };

  const handleDeleteRole = async (role) => {
    if (confirm(`Yakin ingin menghapus role '${role.name}'? Akses menu terkait role ini akan hilang.`)) {
      try {
        await api.delete(`/admin/roles/${role.id}`);
        toast.success(`Role '${role.name}' berhasil dihapus!`);
        fetchMatrix();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal menghapus role');
      }
    }
  };

  const isCoreRole = (name) => ['admin', 'siswa', 'tutor'].includes(name.toLowerCase());

  return (
    <AppLayout title="Kelola Role & Menu">
      <div className="max-w-6xl mx-auto pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Role & Menu Matrix</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Buat role baru secara dinamis dan tentukan hak akses navigasi menu aplikasi.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>+ Tambah Role Baru</Button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 uppercase w-1/3">
                    Menu Aplikasi
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 uppercase w-1/6 text-center">
                    Bagian
                  </th>
                  {roles.map((role) => (
                    <th key={role.id} className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 uppercase text-center relative group">
                      <div className="flex items-center justify-center gap-1">
                        <span>{role.name}</span>
                        {!isCoreRole(role.name) && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="text-red-500 hover:text-red-700 text-xs px-1 rounded hover:bg-red-50"
                            title="Hapus Role Ini"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {matrix.map((menu) => (
                  <tr key={menu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{menu.icon}</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{menu.label}</p>
                          <p className="text-xs text-slate-500">{menu.path}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${menu.section === 'main' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {menu.section.toUpperCase()}
                      </span>
                    </td>
                    {roles.map((role) => {
                      const hasAccess = menu.roles.includes(role.id);
                      return (
                        <td key={role.id} className="px-6 py-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer justify-center">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={hasAccess}
                              onChange={() => handleToggle(menu.id, role.id, hasAccess)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Tambah Role */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Tambah Role Baru</h3>
              <form onSubmit={handleAddRole} className="space-y-4">
                <FormField label="Nama Role (Misal: staf_akademik, staf_keuangan)">
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="nama_role"
                    required
                  />
                </FormField>
                <p className="text-xs text-slate-500">
                  Role baru akan langsung ditambahkan ke kolom matriks dan dapat dipetakan ke menu mana pun.
                </p>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
                  <Button type="submit">Buat Role</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
