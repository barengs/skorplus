import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { lockScreen, logoutUser, setToken, unlockScreen, login } from '../../features/auth/authSlice';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const LOGOUT_TIMEOUT = 55 * 60 * 1000; // 55 minutes
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export default function SessionManager({ children }) {
  const dispatch = useDispatch();
  const { token, isLocked, user } = useSelector((s) => s.auth);
  
  const lastActivity = useRef(Date.now());
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!token) return;

    const handleActivity = () => {
      lastActivity.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    // Check lock/logout every second for testing
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivity.current;

      if (idleTime >= LOGOUT_TIMEOUT) {
        dispatch(logoutUser());
        toast.info('Sesi Anda telah berakhir karena tidak ada aktivitas.');
      } else if (idleTime >= LOCK_TIMEOUT && !isLocked) {
        dispatch(lockScreen());
        toast.info('Layar dikunci karena tidak ada aktivitas.');
      }
    }, 1000); // Check every second

    // Proactive token refresh every 15 minutes if user is active
    const refreshInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivity.current;
      // Only refresh if user has been active in last 15 minutes
      if (idleTime < REFRESH_INTERVAL && !isLocked) {
        api.post('/auth/refresh')
          .then(res => {
            if (res.data && res.data.token) {
              dispatch(setToken(res.data.token));
            }
          })
          .catch(() => {
            // Silent fail, axios interceptor will handle it on next request
          });
      }
    }, REFRESH_INTERVAL);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(checkInterval);
      clearInterval(refreshInterval);
    };
  }, [token, isLocked, dispatch]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlocking(true);
    try {
      // Re-authenticate to unlock
      await dispatch(login({ email: user.email, password })).unwrap();
      dispatch(unlockScreen());
      setPassword('');
      lastActivity.current = Date.now();
    } catch (err) {
      toast.error('Password salah!');
    } finally {
      setUnlocking(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            <FontAwesomeIcon icon={['fas', 'lock']} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Layar Terkunci</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Sesi Anda dikunci karena tidak ada aktivitas selama 30 menit. Masukkan password Anda untuk melanjutkan.
          </p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="text-left">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
              <Input value={user?.email || ''} disabled className="bg-slate-50 dark:bg-slate-900" />
            </div>
            <div className="text-left">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                autoFocus
                placeholder="Masukkan password..."
              />
            </div>
            <Button type="submit" className="w-full" disabled={unlocking}>
              {unlocking ? 'Membuka...' : 'Buka Kunci'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600 font-medium">
              Atau login dengan akun lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
