import { useState } from 'react';
import { MapPin, Plus, Home, Briefcase, Star, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { cn } from '../utils/cn.js';

const emptyForm = { label: '', type: 'home', name: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '' };

export default function Addresses() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const addresses = user?.addresses || [];

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm, name: user.name, phone: user.phone }); setModalOpen(true); };
  const openEdit = (a) => { setEditingId(a.id); setForm({ ...emptyForm, ...a }); setModalOpen(true); };

  const save = (e) => {
    e.preventDefault();
    const exists = addresses.some((a) => a.id === editingId);
    const updated = exists
      ? addresses.map((a) => (a.id === editingId ? { ...a, ...form } : a))
      : [...addresses, { id: `ad-${Date.now()}`, ...form, isDefault: addresses.length === 0 }];
    updateProfile({ addresses: updated });
    setModalOpen(false);
    toast.show(exists ? 'Address updated' : 'Address added');
  };

  const remove = () => {
    const updated = addresses.filter((a) => a.id !== deleteId);
    updateProfile({ addresses: updated });
    setDeleteId(null);
    toast.show('Address removed', 'info');
  };

  const setDefault = (a) => {
    updateProfile({ addresses: addresses.map((x) => ({ ...x, isDefault: x.id === a.id })) });
    toast.show('Default address set');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Addresses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your saved delivery addresses.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Address</button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState title="No addresses saved" description="Add your first delivery address to start ordering." icon={MapPin} action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Address</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className={cn('card p-5 relative', a.isDefault && 'ring-2 ring-brand-500/30')}>
              {a.isDefault && <button onClick={() => setDefault(a)} className="absolute top-4 right-4 text-amber-500 cursor-pointer" title="Default address" aria-label="Default address"><Star size={17} fill="currentColor" /></button>}
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-200">
                {a.type === 'home' ? <Home size={11} /> : a.type === 'work' ? <Briefcase size={11} /> : <MapPin size={11} />} {a.label || a.type}
              </span>
              <p className="text-sm font-semibold mt-3">{a.line1}</p>
              <p className="text-sm text-slate-500">{a.line2}</p>
              {a.landmark && <p className="text-sm text-slate-500">{a.landmark}</p>}
              <p className="text-sm text-slate-500">{a.city}, {a.state} {a.pincode}</p>
              <p className="text-xs text-slate-400 mt-2">{a.phone}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(a)} className="btn-secondary btn-sm"><Pencil size={13} /> Edit</button>
                {!a.isDefault && <button onClick={() => setDeleteId(a.id)} className="btn-ghost btn-sm text-danger"><Trash2 size={13} /> Delete</button>}
                {!a.isDefault && <button onClick={() => setDefault(a)} className="btn-ghost btn-sm text-brand-600 ml-auto">Set default</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit address' : 'Add address'}>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Label</label>
              <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home" required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="House no, building, street" required />
          </div>
          <div>
            <label className="label">Area / Locality</label>
            <input className="input" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Landmark</label>
              <input className="input" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center">Save Address</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete address?" message="This address will be removed from your account." confirmText="Delete" danger />
    </div>
  );
}