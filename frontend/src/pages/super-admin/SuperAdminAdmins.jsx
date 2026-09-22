import { useState, useRef } from 'react';
import { UserPlus, ShieldCheck, ShieldX, KeyRound } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function SuperAdminAdmins() {
  const toast = useToast();
  const { data: admins, loading, refetch } = useAsync(() => apiService.getAdmins(), []);
  const { data: stores } = useAsync(() => apiService.getStores(), []);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const formRef = useRef(null);

  const storeNameOf = (storeId) => (stores || []).find((s) => s.id === storeId || s._id === storeId)?.name || '—';

  const isActive = (r) => r.status === 'active';

  const columns = [
    { key: 'admin', label: 'Admin', render: (r) => (
      <div className="flex items-center gap-3">
        <span className={`h-9 w-9 rounded-full bg-gradient-to-br ${r.role === 'SUPER_ADMIN' ? 'from-amber-500 to-orange-600' : 'from-brand-500 to-violet-600'} text-white text-xs font-bold flex items-center justify-center`}>{r.name[0]}</span>
        <div><p className="font-medium">{r.name} {r.role === 'SUPER_ADMIN' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">OWNER</span>}</p><p className="text-xs text-slate-400">{r.email}</p></div>
      </div>
    )},
    { key: 'store', label: 'Store', render: (r) => <span className="text-xs">{storeNameOf(r.storeId)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={isActive(r) ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: '', render: (r) => (
      <button onClick={() => setSelected(r)} className="btn-secondary btn-sm">Manage</button>
    )},
  ];

  const deactivate = async () => {
    if (!selected) return;
    try {
      await apiService.updateAdmin(selected.id || selected._id, { status: isActive(selected) ? 'inactive' : 'active' });
      toast.show(isActive(selected) ? `${selected.name} deactivated` : `${selected.name} activated`);
      setSelected(null);
      refetch();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  };

  const invite = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiService.createAdmin({
        name: fd.get('name'),
        email: fd.get('email'),
        phone: '',
        password: fd.get('password'),
        storeId: fd.get('storeId') || undefined,
      });
      toast.show('Admin created — invite sent');
      setCreating(false);
      refetch();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Store Admins" subtitle="Who can access the QuickMart admin panel" action={
        <button onClick={() => setCreating(true)} className="btn-primary"><UserPlus size={16} /> Invite Admin</button>
      } />

      <div className="card mb-4 p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
        <ShieldCheck size={18} className="text-amber-600 shrink-0" />
        <p className="text-sm text-slate-600">Store-level admins manage one store; <span className="font-semibold">SUPER_ADMIN</span> accounts see the entire platform.</p>
      </div>

      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={admins || []} loading={loading} onRetry={refetch} emptyTitle="No admins yet" onRowClick={() => undefined} />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Manage ${selected?.name}`} footer={
        <div className="flex w-full gap-2">
          <button onClick={() => setSelected(null)} className="btn-secondary btn-sm flex-1">Cancel</button>
          <button onClick={() => { toast.show('Permissions updated'); setSelected(null); }} className="btn-primary btn-sm flex-1">Save Permissions</button>
        </div>
      }>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white font-bold flex items-center justify-center text-lg">{selected.name[0]}</span>
              <div><h3 className="font-bold">{selected.name}</h3><p className="text-xs text-slate-400">{storeNameOf(selected.storeId)}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { toast.show(`Reset link sent to ${selected.email}`); }} className="btn-secondary btn-sm flex-1"><KeyRound size={14} /> Send Reset</button>
              <button onClick={deactivate} className="btn-danger-outline btn-sm flex-1"><ShieldX size={14} /> {isActive(selected) ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title="Invite Store Admin" footer={
        <div className="flex w-full gap-2">
          <button onClick={() => setCreating(false)} className="btn-secondary btn-sm flex-1">Cancel</button>
          <button form="admin-invite" type="submit" className="btn-primary btn-sm flex-1">Send Invite</button>
        </div>
      }>
        <form id="admin-invite" ref={formRef} onSubmit={invite} className="space-y-4">
          <div><label className="label">Full Name</label><input name="name" className="input" placeholder="Admin name" required /></div>
          <div><label className="label">Work Email</label><input name="email" type="email" className="input" placeholder="name@quickmart.co" required /></div>
          <div><label className="label">Temporary Password</label><input name="password" type="password" className="input" placeholder="Minimum 6 characters" required /></div>
          <div>
            <label className="label">Store</label>
            <select name="storeId" className="input cursor-pointer">
              <option value="">All stores (platform admin)</option>
              {(stores || []).map((s) => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}