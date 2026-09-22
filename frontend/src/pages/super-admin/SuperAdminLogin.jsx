import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Crown, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function SuperAdminLogin() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email: form.email, password: form.password, role: 'SUPER_ADMIN' });
      toast.show('Welcome, Super Admin!');
      navigate('/super-admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-6 text-white">
          <span className="inline-flex h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 backdrop-blur items-center justify-center"><Crown size={30} className="text-amber-400" /></span>
          <h1 className="mt-3 text-2xl font-extrabold">QuickMart Super Admin</h1>
          <p className="text-sm text-slate-400">Platform-wide control</p>
        </div>
        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Super Admin Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-10" placeholder="superadmin@quickmart.co" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" className="input pl-10" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
            </div>
            {error && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 bg-slate-900 border-slate-900 hover:bg-slate-800">
              {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1"><ShieldAlert size={12} className="text-warning" /> Max security zone — demo: superadmin@quickmart.co</p>
          <p className="mt-2 text-center text-xs text-slate-500"><Link to="/admin/login" className="text-brand-600 font-semibold">Store Admin? Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
}