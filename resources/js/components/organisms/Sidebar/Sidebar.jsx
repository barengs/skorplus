import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Logo from '../../atoms/Logo';
import NavItem from '../../molecules/NavItem';
import Avatar from '../../atoms/Avatar';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';
import ThemeToggle from '../../atoms/ThemeToggle';
import { logoutUser } from '../../../features/auth/authSlice';
import { toast } from 'react-toastify';



export default function Sidebar({ collapsed = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, settings } = useSelector((s) => s.auth);
  const token = useSelector((s) => s.auth.token);
  
  const [menus, setMenus] = React.useState({ main: [], system: [] });

  React.useEffect(() => {
    if (user && token) {
      // Fetch dynamic menus for this user's role
      fetch('/api/my-menus', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      .then(res => res.json())
      .then(data => {
        const main = data.filter(m => m.section === 'main');
        const system = data.filter(m => m.section === 'system');
        setMenus({ main, system });
      })
      .catch(err => console.error("Gagal memuat menu", err));
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
    } finally {
      localStorage.removeItem('skorpluss_token');
      toast.success('Sampai jumpa! 👋');
      navigate('/login');
      window.location.reload(); // Force reload to clear all states
    }
  };

  const programBadge = { mandiri: 'slate', intensif: 'blue', garansi: 'gold' };

  return (
    <aside className={`flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} h-screen sticky top-0 overflow-y-auto`}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <Logo collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
        {menus.main.length > 0 && (
          <div>
            <div className={`px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
              {!collapsed ? 'Menu Utama' : '•••'}
            </div>
            <ul className="space-y-1">
              {menus.main.map((menu) => (
                <NavItem key={menu.id} icon={menu.icon} label={menu.label} to={menu.path} collapsed={collapsed} />
              ))}
            </ul>
          </div>
        )}

        {menus.system.length > 0 && (
          <div>
            <div className={`px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
              {!collapsed ? 'Sistem' : '•••'}
            </div>
            <ul className="space-y-1">
              {menus.system.map((menu) => (
                <NavItem key={menu.id} icon={menu.icon} label={menu.label} to={menu.path} collapsed={collapsed} />
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* User info & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {user ? (
          !collapsed && (
            <div className="flex items-center gap-2.5 px-2">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded" />
          ) : (
            <img src="/assets/skorpluss_logo.png" alt="Logo" className="w-8 h-8 object-contain shrink-0" />
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white leading-tight">
                {settings?.app_name || 'SkorPluss'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Learning Center</span>
            </div>
          )}
        </div>
          )
        ) : (
          !collapsed && (
            <div className="flex items-center justify-center p-3 rounded-md bg-white dark:bg-slate-900 mb-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )
        )}
        <Button
          variant="ghost"
          size="sm"
          className={`w-full ${collapsed ? 'justify-center' : ''}`}
          onClick={handleLogout}
        >
          {collapsed ? '🚪' : '🚪 Logout'}
        </Button>
      </div>
    </aside>
  );
}
