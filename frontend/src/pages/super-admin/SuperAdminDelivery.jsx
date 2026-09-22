import { useState } from 'react';
import { Bike, Star } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../utils/cn.js';

export default function SuperAdminDelivery() {
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const { data: deliveryPartners, loading, refetch } = useAsync(() => apiService.getDeliveryPartners(), []);

  const partners = deliveryPartners || [];
  const online = partners.filter((d) => d.status === 'active' && (d.online === undefined || d.online === true)).length || partners.filter((d) => d.status === 'active').length;
  const rating = partners.length ? (partners.reduce((s, d) => s + (d.rating || 4.5), 0) / partners.length) : 0;
  const high = partners.filter((d) => (d.rating || 0) >= 4.6).length;

  const columns = [
    { key: 'partner', label: 'Partner', render: (r) => (
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xs font-bold flex items-center justify-center">{r.name[0]}</span>
        <div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.phone}</p></div>
      </div>
    )},
    { key: 'store', label: 'Home Store', render: (r) => <span className="text-xs text-slate-500">Store {(r.storeId || r.storeName || '—').toUpperCase()}</span> },
    { key: 'deliveries', label: 'Deliveries', render: (r) => <span className="font-semibold">{r.deliveriesTotal || r.deliveriesCompleted || 0}</span> },
    { key: 'rating', label: 'Rating', render: (r) => <span className="flex items-center gap-1 text-sm font-semibold"><Star size={13} className="text-warning fill-warning" /> {r.rating || '—'}</span> },
    { key: 'online', label: 'Online', render: (r) => <StatusBadge status={r.status === 'active' ? 'AVAILABLE' : 'OFFLINE'} /> },
  ];

  return (
    <div>
      <PageHeader title="Delivery Network" subtitle="Fleet health across all stores" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Riders" value={partners.length} icon={Bike} color="brand" />
        <StatCard title="Online Now" value={online} icon={Bike} color="green" />
        <StatCard title="Fleet Rating" value={`★ ${rating.toFixed(1)}`} icon={Star} color="amber" />
        <StatCard title="High Performers" value={high} icon={Bike} color="violet" />
      </div>

      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={partners} loading={loading} onRetry={refetch} onRowClick={setSelected} emptyTitle="No partners" />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Rider Details" footer={
        <div className="flex w-full gap-2">
          <button onClick={() => setSelected(null)} className="btn-secondary btn-sm flex-1">Close</button>
          <button onClick={() => { toast.show(`Payout processed for ${selected?.name} (demo)`); }} className="btn-primary btn-sm flex-1">Process Payout</button>
        </div>
      }>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center text-lg">{selected.name[0]}</span>
              <div>
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.phone} · {selected.vehicle || 'Bike'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selected.vehicleNumber || ''}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { v: selected.deliveriesTotal || selected.deliveriesCompleted || 0, l: 'Deliveries' },
                { v: `★ ${selected.rating || '—'}`, l: 'Rating' },
                { v: `₹${(selected.earningsTotal || 0).toLocaleString()}`, l: 'Lifetime' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-slate-50 p-3"><p className="font-bold">{s.v}</p><p className="text-[11px] text-slate-400">{s.l}</p></div>
              ))}
            </div>
            <div className={cn('rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2', selected.status === 'active' ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500')}>
              <span className={cn('h-2 w-2 rounded-full', selected.status === 'active' ? 'bg-success animate-pulse' : 'bg-slate-400')} />
              {selected.status === 'active' ? 'Online — accepting deliveries' : 'Currently offline'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}