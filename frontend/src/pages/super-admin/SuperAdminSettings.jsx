import { useState } from 'react';
import { Save, Building2 } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { apiService } from '../../services/apiService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function SuperAdminSettings() {
  const toast = useToast();
  const [form, setForm] = useState({
    commissionPercent: 12,
    platformFee: 5,
    minDeliveryFee: 15,
    maxDeliveryFee: 60,
    codEnabled: true,
    rewardsEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiService.updateSettings(form);
      toast.show('Platform settings saved');
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform-wide configuration" />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-6 space-y-6">
          <section>
            <h2 className="font-semibold flex items-center gap-2 mb-4"><Building2 size={17} className="text-brand-600" /> Revenue & Commission</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'commissionPercent', label: 'Store commission (%)' },
                { key: 'platformFee', label: 'Platform fee (₹)' },
                { key: 'minDeliveryFee', label: 'Min delivery fee (₹)' },
                { key: 'maxDeliveryFee', label: 'Max delivery fee (₹)' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input type="number" className="input" value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: +e.target.value })} />
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-100 pt-5 space-y-3">
            <h2 className="font-semibold mb-2">Feature Toggles</h2>
            {[
              { key: 'codEnabled', label: 'Cash on Delivery' },
              { key: 'rewardsEnabled', label: 'QuickCoins rewards' },
            ].map((t) => (
              <label key={t.key} className="flex items-center justify-between py-1 cursor-pointer">
                <span className="text-sm font-medium">{t.label}</span>
                <div className="relative">
                  <input type="checkbox" checked={form[t.key]} onChange={(e) => setForm({ ...form, [t.key]: e.target.checked })} className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-brand-600 transition relative">
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form[t.key] ? 'left-[22px]' : 'left-0.5'}`} />
                  </div>
                </div>
              </label>
            ))}
          </section>

          <div className="border-t border-slate-100 pt-5 flex justify-end">
            <button onClick={save} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </Card>

        <Card className="p-6 h-fit">
          <h2 className="font-semibold mb-4">Support & Policy</h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="py-2 border-b border-slate-100 cursor-pointer hover:text-brand-600">Platform Terms of Use</li>
            <li className="py-2 border-b border-slate-100 cursor-pointer hover:text-brand-600">Privacy Policy</li>
            <li className="py-2 border-b border-slate-100 cursor-pointer hover:text-brand-600">Refund & Cancellation Policy</li>
            <li className="py-2 cursor-pointer hover:text-brand-600">Support Center</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}