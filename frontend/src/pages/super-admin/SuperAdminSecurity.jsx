import { useState } from 'react';
import { ShieldCheck, KeyRound, Laptop, Smartphone, RotateCcw } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../utils/cn.js';

export default function SuperAdminSecurity() {
  const toast = useToast();
  const { data: settings } = useAsync(() => apiService.getSecuritySettings(), []);
  const [toggles, setToggles] = useState(null);

  const effective = toggles || {
    mfa: settings?.twoFactor ?? true,
    ipWhitelist: settings?.ipWhitelist ?? false,
    passwordExpiry: settings?.passwordExpiry ?? true,
    lockout: settings?.lockout ?? true,
  };

  const flip = async (k, label) => {
    const next = { ...effective, [k]: !effective[k] };
    setToggles(next);
    try {
      await apiService.updateSecuritySettings({ [k === 'mfa' ? 'twoFactor' : k]: next[k] });
      toast.show(`${label} ${next[k] ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.show(err.message, 'error');
      setToggles(null);
    }
  };

  const Switch = ({ on, onClick, label }) => (
    <button type="button" onClick={onClick} className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors" style={{ background: on ? '#16a34a' : '#e2e8f0' }} aria-label={label}>
      <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );

  const sessions = [
    { device: 'MacBook Pro — Chrome', location: 'Bengaluru, IN', ip: '49.207.xx.xx', active: true },
    { device: 'iPhone 15 — QuickMart App', location: 'Bengaluru, IN', ip: '152.58.xx.xx', active: true },
    { device: 'Windows 11 — Firefox', location: 'New Delhi, IN', ip: '103.26.xx.xx', active: false },
  ];

  return (
    <div>
      <PageHeader title="Security" subtitle="Harden access to the platform" />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-6 space-y-6">
          <section className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2 mb-2"><ShieldCheck size={17} className="text-brand-600" /> Access Controls</h2>
            {[
              { key: 'mfa', label: 'Two-factor authentication', desc: 'Require TOTP for all super admin logins' },
              { key: 'ipWhitelist', label: 'IP whitelisting', desc: 'Only allow sign-ins from approved IP ranges' },
              { key: 'passwordExpiry', label: 'Password expiry', desc: 'Force password rotation every 90 days' },
              { key: 'lockout', label: 'Brute-force lockout', desc: 'Lock account after 5 failed attempts' },
            ].map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                </div>
                <Switch on={effective[s.key]} onClick={() => flip(s.key, s.label)} label={s.label} />
              </div>
            ))}
          </section>

          <section>
            <h2 className="font-semibold flex items-center gap-2 mb-4"><KeyRound size={17} className="text-brand-600" /> Credentials</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button onClick={() => toast.show('Password reset email sent (demo)')} className="btn-secondary btn-sm"><RotateCcw size={14} /> Force password reset</button>
              <button onClick={() => toast.show('2FA recovery codes regenerated (demo)')} className="btn-secondary btn-sm"><ShieldCheck size={14} /> Regenerate recovery codes</button>
            </div>
          </section>
        </Card>

        <Card className="p-6 h-fit">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Laptop size={17} className="text-brand-600" /> Active Sessions</h2>
          <div className="space-y-4">
            {sessions.map((s) => (
              <div key={s.ip} className="flex items-start gap-3">
                <span className={cn('h-9 w-9 rounded-lg flex items-center justify-center', s.active ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400')}>
                  {s.device.includes('iPhone') ? <Smartphone size={16} /> : <Laptop size={16} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.device}</p>
                  <p className="text-xs text-slate-400">{s.location} · {s.ip}</p>
                </div>
                {s.active && <button onClick={() => toast.show(`Session at ${s.ip} revoked (demo)`)} className="text-xs text-danger font-semibold hover:underline">Revoke</button>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}