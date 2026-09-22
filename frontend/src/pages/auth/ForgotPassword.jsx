import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../services/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.forgotPassword({ email });
      setOtpSent(true);
      toast.show('Reset link sent to your email', 'info');
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-sm text-slate-500 mt-1">We'll email you a link to reset your password.</p>

      {otpSent ? (
        <div className="mt-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="mt-4 font-semibold text-lg">Check your email</h2>
          <p className="mt-1 text-sm text-slate-500">
            A password reset link has been sent to <span className="font-medium text-slate-700">{email}</span>.
          </p>
          <button onClick={() => setOtpSent(false)} className="btn-secondary w-full mt-6">Back</button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="email" type="email" className="input pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? <><Loader2 size={17} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered your password?{' '}
        <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}