import { useState } from 'react';
import { Bike, Star, Phone, MapPin, MoreVertical } from 'lucide-react';
import { PageHeader } from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../utils/cn.js';

export default function AdminDelivery() {
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const { data: partners, loading, refetch } = useAsync(() => apiService.getDeliveryPartners(), []);

  const fleetTotal = (partners || []).reduce((s, d) => s + (d.deliveriesTotal || 0), 0);
  const fleetAvg = (partners || []).length ? (partners || []).reduce((s, d) => s + (d.rating || 0), 0) / partners.length : 0;

  const setStatus = async (id, status) => {
    try {
      await apiService.updateDeliveryPartner(id, { status });
      toast.show(`Partner ${status === 'active' ? 'approved' : 'deactivated'}`);
      setSelected(null);
      refetch();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  };

  const columns = [
    { key: 'partner', label: 'Partner', render: (r) => (
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xs font-bold flex items-center justify-center">
          {r.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
        </span>
        <div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.phone}</p></div>
      </div>
    )},
    { key: 'zone', label: 'Zone', render: (r) => <span className="text-xs">{r.zone || 'Zone A'}</span> },
    { key: 'deliveries', label: 'Deliveries', render: (r) => <span className="font-semibold">{r.deliveriesTotal || 0}</span> },
    { key: 'rating', label: 'Rating', render: (r) => <span className="flex items-center gap-1 text-sm font-semibold"><Star size={13} className="text-warning fill-warning" /> {r.rating || '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'active' && r.online !== false ? 'AVAILABLE' : 'OFFLINE'} /> },
    { key: 'actions', label: '', render: (r) => (
      <button onClick={() => setSelected(r)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer" aria-label="Details"><MoreVertical size={16} /></button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Delivery Partners" subtitle={`${(partners || []).length} riders on the fleet`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Riders" value={loading ? '—' : (partners || []).length} icon={Bike} color="brand" />
        <StatCard title="Online Now" value={(partners || []).filter((d) => d.status !== 'inactive' && d.online !== false).length} icon={Bike} color="green" />
        <StatCard title="Avg Rating" value={`★ ${fleetAvg.toFixed(1)}`} icon={Star} color="amber" />
        <StatCard title="Deliveries Done" value={fleetTotal} icon={Phone} color="violet" />
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} rows={partners || []} loading={loading} onRetry={refetch} emptyTitle="No partners" onRowClick={() => undefined} />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Partner Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center text-lg">
                {selected.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
              </span>
              <div>
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5"><Phone size={13} /> {selected.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { v: selected.deliveriesTotal || 0, l: 'Deliveries' },
                { v: `★ ${selected.rating || '—'}`, l: 'Rating' },
                { v: selected.status === 'active' && selected.online !== false ? 'Online' : 'Offline', l: 'Status' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-bold">{s.v}</p>
                  <p className="text-[11px] text-slate-400">{s.l}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1.5"><MapPin size={14} /> Serving zone: <span className="font-semibold text-slate-700">{selected.zone || 'Zone A'}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setStatus(selected.id || selected._id, 'active')} className="btn-primary btn-sm flex-1">Approve / Verify</button>
              <button onClick={() => setStatus(selected.id || selected._id, 'inactive')} className="btn-danger-outline btn-sm flex-1">Deactivate</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}