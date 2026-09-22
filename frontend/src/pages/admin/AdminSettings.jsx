import { useState } from 'react';
import { Save, Bell, Truck, IndianRupee, TrendingUp, ShieldCheck } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiService } from '../../services/apiService.js';

export default function AdminSettings() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    freeDeliveryThreshold: 499,
    deliveryFee: 39,
    slotGapMins: 15,
    lowStockThreshold: 10,
    autoRestock: true,
    onboarding: false,
  });

  const save = async () => {
    setSaving(true);
    try {
      await apiService.updateSettings({
        freeDeliveryThreshold: form.freeDeliveryThreshold,
        deliveryFee: form.deliveryFee,
      });
      toast.show('Settings saved');
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store & platform configuration" />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-6 space-y-6">
          <section>
            <h2 className="font-semibold flex items-center gap-2 mb-4"><IndianRupee size={17} className="text-brand-600" /> Delivery & Charges</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Free delivery threshold (₹)', value: form.freeDeliveryThreshold, key: 'freeDeliveryThreshold' },
                { label: 'Delivery fee below threshold (₹)', value: form.deliveryFee, key: 'deliveryFee' },
                { label: 'Slot gap (minutes)', value: form.slotGapMins, key: 'slotGapMins' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="label">{f.label}</label>
                  <input
                    type="number"
                    className="input"
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: +e.target.value })}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-100 pt-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4"><TrendingUp size={17} className="text-brand-600" /> Inventory Alerts</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Low stock threshold (units)</label>
                <input type="number" className="input" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: +e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={form.autoRestock} onChange={(e) => setForm({ ...form, autoRestock: e.target.checked })} className="h-4 w-4 accent-brand-600" />
              Auto-restock products when below threshold
            </label>
          </section>

          <section className="border-t border-slate-100 pt-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4"><Bell size={17} className="text-brand-600" /> Notifications</h2>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={form.onboarding} onChange={(e) => setForm({ ...form, onboarding: e.target.checked })} className="h-4 w-4 accent-brand-600" />
              Onboarding walkthrough for new customers
            </label>
          </section>

          <section className="border-t border-slate-100 pt-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4"><ShieldCheck size={17} className="text-brand-600" /> Serviceability</h2>
            <p className="text-sm text-slate-500 mb-3">Base delivery zone around each store: 8 km.</p>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-600" />
              Pre-primary serviceable area override under each store
            </label>
          </section>

          <div className="border-t border-slate-100 pt-5 flex justify-end">
            <button onClick={save} className="btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </Card>

        <Card className="p-6 h-fit">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Truck size={17} className="text-brand-600" /> Quick Info</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between pb-2 border-b border-slate-100"><span className="text-slate-500">Store fare setup</span><span className="font-semibold">Auto + Manual</span></li>
            <li className="flex justify-between pb-2 border-b border-slate-100"><span className="text-slate-500">Delivery medium</span><span className="font-semibold">Own bikes</span></li>
            <li className="flex justify-between pb-2 border-b border-slate-100"><span className="text-slate-500">ASAP slot cap</span><span className="font-semibold">Enabled</span></li>
            <li className="flex justify-between pb-2 border-b border-slate-100"><span className="text-slate-500">Pre-primary assignment</span><span className="font-semibold">Zone-based</span></li>
            <li className="flex justify-between"><span className="text-slate-500">Sub-store zones</span><span className="font-semibold">8 km radius</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}