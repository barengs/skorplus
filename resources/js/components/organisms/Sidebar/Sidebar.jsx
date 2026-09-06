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
  const user = useSelector((s) => s.auth.user);
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
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {!collapsed && <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1">Menu Utama</p>}
        {menus.main.map((item) => (
          <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} collapsed={collapsed} />
        ))}

        <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
        {!collapsed && <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1">Sistem</p>}
        {menus.system.map((item) => (
          <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} collapsed={collapsed} />
        ))}
      </nav>

      {/* User info & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {user ? (
          !collapsed && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-white dark:bg-slate-900 mb-2">
              <Avatar name={user.name} src={user.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.nisn ?? user.email}</p>
              </div>
              {user.program && (
                <Badge color={programBadge[user.program] ?? 'slate'} className="text-[10px]">
                  {user.program}
                </Badge>
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
