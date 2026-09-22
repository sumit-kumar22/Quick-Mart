import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiService } from '../../services/apiService.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const ROLE_OPTIONS = [
  { role: 'CUSTOMER', label: 'Customer', hint: 'Shop groceries' },
  { role: 'ADMIN', label: 'Store Admin', hint: 'Store admin@quickmart.co' },
  { role: 'SUPER_ADMIN', label: 'Super Admin', hint: 'superadmin@quickmart.co' },
  { role: 'DELIVERY_PARTNER', label: 'Delivery Partner', hint: 'ajay@quickmart.co' },
];

export default function Login() {
  const { login, socialLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [role, setRole] = useState('CUSTOMER');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiService.login({ email: form.email, password: form.password, role });
      await login({ email: form.email, password: form.password, role });
      toast.show('Welcome back!');
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'SUPER_ADMIN') navigate('/super-admin/dashboard');
      else if (role === 'DELIVERY_PARTNER') navigate('/delivery/dashboard');
      else navigate(from === '/login' ? '/' : from);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const afterSocialLogin = (msg) => {
    toast.show(msg);
    navigate(from === '/login' ? '/' : from);
  };

  const signInWithGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      if (!GOOGLE_CLIENT_ID) {
        // Demo mode: no Google credentials configured yet.
        await apiService.login({ email: 'aarav@example.com', password: 'customer123', role: 'CUSTOMER' });
        await login({ email: 'aarav@example.com', password: 'customer123', role: 'CUSTOMER' });
        afterSocialLogin('Signed in with Google (demo)');
        return;
      }
      // Real Google Identity Services popup flow.
      const loadGis = () =>
        new Promise((resolve, reject) => {
          if (window.google?.accounts?.id) return resolve();
          const s = document.createElement('script');
          s.src = 'https://accounts.google.com/gsi/client';
          s.async = true;
          s.onload = resolve;
          s.onerror = () => reject(new Error('Could not load Google Sign-In'));
          document.head.appendChild(s);
        });
      await loadGis();
      await new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: async (resp) => {
            try {
              if (!resp?.credential) throw new Error('Google sign-in cancelled');
              await socialLogin(resp.credential);
              afterSocialLogin('Signed in with Google');
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });
        window.google.accounts.id.prompt();
        setTimeout(() => resolve(), 1500);
      });
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Login to QuickMart</h1>
      <p className="text-sm text-slate-500 mt-1">Welcome back! Please enter your details.</p>

      <div className="mt-5">
        <p className="label">Login as</p>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => setRole(r.role)}
              className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${role === r.role ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-brand-300'}`}
            >
              <p className="text-sm font-semibold text-slate-800">{r.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{r.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="label">Email or Phone</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="email" type="text" className="input pl-10" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="password" type={showPw ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Toggle password visibility">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-brand-600 hover:underline">Forgot password?</Link>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : 'Sign In'}
        </button>
      </form>

      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="btn-secondary w-full justify-center mt-3 py-3"
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : <span className="font-bold text-brand-600">G</span>}
        {loading ? 'Signing in...' : GOOGLE_CLIENT_ID ? 'Continue with Google' : 'Continue with Google (demo)'}
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-600 font-semibold hover:underline">Create one</Link>
      </p>

      {role !== 'CUSTOMER' && (
        <p className="mt-3 text-center text-[11px] text-slate-400">Demo: {ROLE_OPTIONS.find((r) => r.role === role)?.hint}</p>
      )}
    </div>
  );
}