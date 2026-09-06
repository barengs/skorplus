import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { login } from '../../../features/auth/authSlice';
import AuthLayout from '../../templates/AuthLayout';
import Input from '../../atoms/Input';
import Button from '../../atoms/Button';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      toast.success(`Selamat datang kembali, ${result.payload.user.name}! 🎉`);
      navigate('/dashboard');
    } else {
      toast.error(result.payload ?? 'Login gagal.');
    }
  };

  return (
    <AuthLayout title="Masuk ke Akun" subtitle="Lanjutkan perjalanan belajar Anda bersama SkorPluss">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="nama@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          autoComplete="email"
        />

        <Input
          id="password"
          type={showPw ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          suffix={
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200">
              {showPw ? '🙈' : '👁'}
            </button>
          }
        />

        {error && typeof error === 'string' && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Masuk
        </Button>

        <p className="text-center text-sm text-slate-500">
          Belum punya akun?{' '}
          <Link to="/daftar" className="text-blue-400 hover:text-blue-300 font-semibold">
            Daftar sekarang
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
