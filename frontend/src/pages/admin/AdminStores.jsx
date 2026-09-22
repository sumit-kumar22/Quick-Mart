import { useState } from 'react';
import { MapPin, Clock, Phone, Building2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../utils/cn.js';

export default function AdminStores() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const { data: stores, loading, refetch } = useAsync(() => apiService.getStores(), []);

  const isOpen = (s) => s.active !== false && s.status !== 'inactive' && s.status !== 'closed';

  return (
    <div>
      <PageHeader title="Stores" subtitle="Manage your store network" />

      {loading ? <p className="text-sm text-slate-400 py-6">Loading stores...</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stores || []).map((s) => (
            <div key={s.id || s._id} className="card p-5">
              <div className="flex items-start justify-between">
                <span className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white flex items-center justify-center">
                  <Building2 size={22} />
                </span>
                <StatusBadge status={isOpen(s) ? 'OPEN' : 'CLOSED'} />
              </div>
              <h3 className="font-bold mt-3">{s.name}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">{s.city}</p>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p className="flex items-center gap-2"><MapPin size={13} /> {s.address}</p>
                <p className="flex items-center gap-2"><Phone size={13} /> {s.phone}</p>
                <p className="flex items-center gap-2"><Clock size={13} /> {s.timings || '8 AM – 10 PM'}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{s.zones?.length || 3} zones covered</p>
                <button onClick={() => setEditing(s)} className="btn-secondary btn-sm">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <StoreModal open={!!editing} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
    </div>
  );
}

function StoreModal({ open, initial, onClose, onSaved }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = e.currentTarget;
      await apiService.updateStore(initial.id || initial._id, {
        name: form.name.value,
        address: form.address.value,
        city: form.city.value,
        phone: form.phone.value,
        status: form.active.checked ? 'active' : 'inactive',
      });
      toast.show('Store updated');
      onSaved();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Store" footer={
      <div className="flex w-full gap-2">
        <button onClick={onClose} className="btn-secondary btn-sm flex-1">Cancel</button>
        <button className="btn-primary btn-sm flex-1" form="store-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    }>
      {initial && (
        <form id="store-form" className="space-y-4" onSubmit={save}>
          <div>
            <label className="label">Store Name</label>
            <input name="name" className="input" defaultValue={initial.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input name="city" className="input" defaultValue={initial.city} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" defaultValue={initial.phone} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input name="address" className="input" defaultValue={initial.address} />
          </div>
          <label className={cn('flex items-center gap-2 text-sm font-medium cursor-pointer')}>
            <input name="active" type="checkbox" defaultChecked={initial.active !== false && initial.status !== 'inactive'} className="h-4 w-4 accent-brand-600" /> Store is accepting orders
          </label>
        </form>
      )}
    </Modal>
  );
}