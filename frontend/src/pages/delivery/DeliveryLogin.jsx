import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function DeliveryLogin() {
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
      await login({ email: form.email, password: form.password, role: 'DELIVERY_PARTNER' });
      toast.show('Welcome, Rider!');
      navigate('/delivery/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 text-white">
          <span className="inline-flex h-16 w-16 rounded-2xl bg-white/15 backdrop-blur items-center justify-center"><Bike size={34} /></span>
          <h1 className="mt-3 text-2xl font-extrabold">QuickRider</h1>
          <p className="text-sm text-white/80">Delivery Partner Portal</p>
        </div>
        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-10" placeholder="ajay@quickmart.co" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
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
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 bg-emerald-600 border-emerald-600 hover:bg-emerald-700">
              {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] text-slate-400">Demo: ajay@quickmart.co / any password (6+ chars)</p>
          <p className="mt-2 text-center text-xs text-slate-500">Not a rider? <Link to="/login" className="text-brand-600 font-semibold">Customer login</Link></p>
        </div>
      </div>
    </div>
  );
}