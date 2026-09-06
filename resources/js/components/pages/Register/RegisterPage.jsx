import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { register } from '../../../features/auth/authSlice';
import AuthLayout from '../../templates/AuthLayout';
import Input from '../../atoms/Input';
import Button from '../../atoms/Button';

const PROGRAMS = [
  { id: 'mandiri', label: 'Mandiri', price: 'Rp 350.000/bln', desc: '10 soal/bln', icon: '📚' },
  { id: 'intensif', label: 'Intensif', price: 'Rp 750.000/bln', desc: 'Unlimited', icon: '🚀', popular: true },
  { id: 'garansi', label: 'Garansi', price: 'Rp 1.200.000/bln', desc: 'Unlimited + 1-on-1', icon: '🏆' },
];

const STEPS = ['Data Diri', 'Pilih Program', 'Akun & Password', 'Konfirmasi'];

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', phone: '', school: '', nisn: '', program: 'intensif',
    email: '', password: '', password_confirmation: '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setVal = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      toast.success('Pendaftaran berhasil! Selamat bergabung 🎉');
      navigate('/dashboard');
    } else {
      const errs = result.payload?.errors;
      if (errs) {
        Object.values(errs).flat().forEach((msg) => toast.error(msg));
      } else {
        toast.error(result.payload ?? 'Registrasi gagal.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8 px-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i < step ? 'bg-blue-500 text-white' : i === step ? 'bg-blue-500 text-white ring-4 ring-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium ${i === step ? 'text-blue-400' : 'text-slate-600'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-3 mx-1 transition-all ${i < step ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-md p-8 shadow-2xl">
          {/* Step 0: Data Diri */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Data Diri Calon Siswa</h2>
              <Input id="name" label="Nama Lengkap" placeholder="Nama sesuai ijazah" value={form.name} onChange={set('name')} required />
              <Input id="phone" label="No. WhatsApp" placeholder="08xxxxxxxxxx" value={form.phone} onChange={set('phone')} />
              <div className="grid grid-cols-2 gap-4">
                <Input id="school" label="Asal Sekolah" placeholder="SMA/MA/SMK..." value={form.school} onChange={set('school')} />
                <Input id="nisn" label="NISN" placeholder="10 digit NISN" value={form.nisn} onChange={set('nisn')} />
              </div>
              <Button onClick={() => setStep(1)} disabled={!form.name} size="lg" className="w-full mt-2">
                Lanjut →
              </Button>
            </div>
          )}

          {/* Step 1: Program */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Pilih Program Belajar</h2>
              <div className="flex flex-col gap-3">
                {PROGRAMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setVal('program', p.id)}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left
                      ${form.program === p.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-100 dark:bg-slate-800/40 hover:border-slate-600'
                      }`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{p.label}</span>
                        {p.popular && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-semibold">POPULER</span>}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{p.desc}</p>
                    </div>
                    <span className="font-bold text-blue-400 text-sm">{p.price}</span>
                    {form.program === p.id && <span className="text-blue-400">✓</span>}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(0)} className="flex-1">← Kembali</Button>
                <Button onClick={() => setStep(2)} className="flex-1">Lanjut →</Button>
              </div>
            </div>
          )}

          {/* Step 2: Akun */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Buat Akun Login</h2>
              <Input id="reg-email" type="email" label="Email" placeholder="nama@email.com" value={form.email} onChange={set('email')} required />
              <Input id="reg-password" type="password" label="Password" placeholder="Min. 8 karakter" value={form.password} onChange={set('password')} required />
              <Input id="reg-password-confirm" type="password" label="Ulangi Password" placeholder="Sama dengan password" value={form.password_confirmation} onChange={set('password_confirmation')} required />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← Kembali</Button>
                <Button onClick={() => setStep(3)} disabled={!form.email || !form.password} className="flex-1">Lanjut →</Button>
              </div>
            </div>
          )}

          {/* Step 3: Konfirmasi */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Konfirmasi Pendaftaran</h2>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-4 flex flex-col gap-2 text-sm">
                {[['Nama', form.name], ['Sekolah', form.school], ['NISN', form.nisn], ['Program', form.program?.toUpperCase()], ['Email', form.email]].map(([label, val]) => (
                  val && <div key={label} className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">{label}</span><span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span></div>
                ))}
              </div>
              <p className="text-xs text-slate-500">Dengan mendaftar, Anda menyetujui syarat & ketentuan SkorPluss.</p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">← Kembali</Button>
                <Button onClick={handleSubmit} loading={loading} className="flex-1">🎉 Daftar Sekarang</Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-4 text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
