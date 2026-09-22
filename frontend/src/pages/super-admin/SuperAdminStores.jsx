import { useState } from 'react';
import { Plus, Store as StoreIcon, MapPin, Phone, Clock } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../utils/cn.js';

export default function SuperAdminStores() {
  const toast = useToast();
  const { data: stores, loading, refetch } = useAsync(() => apiService.getStores(), []);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', phone: '', address: '' });

  const toggle = async (s) => {
    const next = s.active === false;
    try {
      await apiService.updateStore(s.id || s._id, { active: next });
      toast.show(`${s.name} ${next ? 'activated' : 'deactivated'}`);
      refetch();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createStore({ ...form, timings: '9:00 AM - 10:00 PM', zones: [], active: true });
      toast.show('Store onboarded');
      setCreating(false);
      setForm({ name: '', city: '', phone: '', address: '' });
      refetch();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Stores" subtitle="Create and manage every store on the platform" action={
        <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> Onboard Store</button>
      } />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(stores || []).map((s) => {
          const open = s.active !== false;
          return (
          <div key={s.id || s._id} className="card p-5">
            <div className="flex items-start justify-between">
              <span className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white flex items-center justify-center">
                <StoreIcon size={22} />
              </span>
              <StatusBadge status={open ? 'OPEN' : 'CLOSED'} />
            </div>
            <h3 className="font-bold mt-3">{s.name}</h3>
            <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">{s.city} · #{(s.id || s._id).toUpperCase()}</p>
            <div className="mt-3 space-y-1.5 text-xs text-slate-500">
              <p className="flex items-center gap-2"><MapPin size={13} /> {s.address}</p>
              <p className="flex items-center gap-2"><Phone size={13} /> {s.phone}</p>
              <p className="flex items-center gap-2"><Clock size={13} /> {s.timings || '9:00 AM - 10:00 PM'}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">{s.zones?.length || 6} pincodes covered</p>
              <button onClick={() => toggle(s)} className={cn('btn-secondary btn-sm', !open && '!border-success !text-success')}>
                {open ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
          );
        })}
        {!loading && (stores || []).length === 0 && <p className="text-sm text-slate-400 col-span-full text-center py-8">No stores found.</p>}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Onboard New Store" footer={
        <div className="flex w-full gap-2">
          <button onClick={() => setCreating(false)} className="btn-secondary btn-sm flex-1">Cancel</button>
          <button form="store-onboard" type="submit" className="btn-primary btn-sm flex-1">Create Store</button>
        </div>
      }>
        <form id="store-onboard" className="space-y-4" onSubmit={submit}>
            <div><label className="label">Store Name</label><input className="input" placeholder="QuickMart Lakeside" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">City</label><input className="input" placeholder="Mumbai" required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
              <div><label className="label">Phone</label><input className="input" placeholder="+91 98xxxxxxxx" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div><label className="label">Address</label><input className="input" placeholder="Street, area, city" required value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
        </form>
      </Modal>
    </div>
  );
}