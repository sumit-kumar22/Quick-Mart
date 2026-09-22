import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.show('Account created! Welcome to QuickMart 🎉');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="text-sm text-slate-500 mt-1">Join QuickMart and start ordering in minutes.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="label">Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="name" className="input pl-10" placeholder="Aarav Mehta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="email" type="email" className="input pl-10" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="phone" type="tel" className="input pl-10" placeholder="98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="password" type="password" className="input pl-10" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="confirm" type="password" className="input pl-10" placeholder="Repeat password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required minLength={6} />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}

        <label className="flex items-start gap-2 text-xs text-slate-500 cursor-pointer">
          <input type="checkbox" required className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <><Loader2 size={17} className="animate-spin" /> Creating account...</> : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}