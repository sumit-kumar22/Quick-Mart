import { useState } from 'react';
import { Plus, Pencil, Power, Tag } from 'lucide-react';
import { PageHeader } from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../utils/cn.js';

function couponMeta(c) {
  const value = c.value ?? c.amount ?? c.percentage;
  if (!value) return 'Free delivery';
  if (c.type === 'flat') return `Flat ₹${value} off${c.maxDiscount ? ` up to ${c.maxDiscount}` : ''}`;
  if (c.type === 'percentage') return `${value}% off${c.maxDiscount ? ` up to ₹${c.maxDiscount}` : ''}`;
  return 'Free delivery';
}

const CATEGORY_LABELS = { 'fruits-vegetables': 'Fruits & Vegetables', 'dairy-breakfast': 'Dairy & Breakfast', 'snacks-munchies': 'Snacks', beverages: 'Beverages', 'personal-care': 'Personal Care', 'home-cleaning': 'Home & Cleaning', 'baby-care': 'Baby Care', 'pet-care': 'Pet Care', bakery: 'Bakery', 'meat-seafood': 'Meat & Seafood', stationery: 'Stationery', household: 'Household' };

export default function AdminOffers() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const { data: coupons, loading, refetch } = useAsync(() => apiService.getAdminOffers(), []);

  const toggle = async (c) => {
    const next = !(c.active !== false);
    try {
      await apiService.updateCoupon(c.id || c._id, { active: next });
      toast.show(`${c.code} ${next ? 'activated' : 'disabled'}`);
      refetch();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Offers & Coupons" subtitle="Discounts available to customers" action={
        <button onClick={() => setEditing({})} className="btn-primary"><Plus size={16} /> New Coupon</button>
      } />

      {loading ? <p className="text-sm text-slate-400 py-6">Loading coupons...</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(coupons || []).map((c) => (
            <div key={c.code} className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-warning/10 to-amber-100 rounded-bl-3xl flex items-center justify-end pb-2 pr-2"><Tag size={20} className="text-warning" /></div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg uppercase">{c.code}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold capitalize">{String(c.type || 'flat').replace('_', ' ')}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{c.description}</p>
              <p className="text-xs text-slate-400 mt-2">Min order ₹{c.minCartValue} · {couponMeta(c)}</p>
              <div className="flex items-center justify-between mt-4">
                <StatusBadge status={c.active !== false ? 'ACTIVE' : 'INACTIVE'} />
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer" aria-label="Edit"><Pencil size={15} /></button>
                  <button onClick={() => toggle(c)} className={cn('p-2 rounded-lg cursor-pointer', c.active !== false ? 'text-success hover:bg-success/10' : 'text-slate-400 hover:bg-slate-100')} aria-label="Toggle"><Power size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CouponModal open={!!editing} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
    </div>
  );
}

function CouponModal({ open, initial, onClose, onSaved }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const f = e.currentTarget;
    const type = f.type.value;
    const payload = {
      code: f.code.value.toUpperCase(),
      type,
      value: Number(f.value.value),
      minCartValue: Number(f.min.value || 0),
      maxDiscount: Number(f.max.value || 0) || undefined,
      description: f.desc.value,
    };
    try {
      if (initial?.code) await apiService.updateCoupon(initial.id || initial._id, payload);
      else await apiService.createCoupon(payload);
      toast.show('Coupon saved');
      onSaved();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial?.code ? `Edit ${initial.code}` : 'New Coupon'} footer={
      <div className="flex w-full gap-2">
        <button onClick={onClose} className="btn-secondary btn-sm flex-1">Cancel</button>
        <button className="btn-primary btn-sm flex-1" form="coupon-form" type="submit" disabled={saving}>{saving ? 'Saving...' : (initial?.code ? 'Save' : 'Create')}</button>
      </div>
    }>
      <form id="coupon-form" className="space-y-4" onSubmit={save}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Code</label><input name="code" className="input uppercase" defaultValue={initial?.code || ''} placeholder="SAVE20" required /></div>
          <div><label className="label">Type</label>
            <select name="type" className="input cursor-pointer" defaultValue={initial?.type || 'percentage'}>
              <option value="percentage">Percentage</option>
              <option value="flat">Flat amount</option>
              <option value="free_delivery">Free delivery</option>
            </select>
          </div>
          <div><label className="label">Value (₹ or %)</label><input name="value" type="number" min="1" className="input" defaultValue={initial ? (initial.value ?? initial.amount ?? initial.percentage ?? 20) : 20} required /></div>
          <div><label className="label">Min cart (₹)</label><input name="min" type="number" min="0" className="input" defaultValue={initial?.minCartValue || 299} /></div>
        </div>
        <div><label className="label">Max discount (₹)</label><input name="max" type="number" min="0" className="input" defaultValue={initial?.maxDiscount || ''} placeholder="Optional" /></div>
        <div><label className="label">Description</label><input name="desc" className="input" defaultValue={initial?.description || ''} placeholder="Extra 20% off" /></div>
      </form>
    </Modal>
  );
}