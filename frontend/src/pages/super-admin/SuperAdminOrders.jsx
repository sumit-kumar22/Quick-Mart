import { useState, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { apiService } from '../../services/apiService.js';
import { formatPrice, formatDate } from '../../utils/format.js';
import { Link } from 'react-router-dom';

export default function SuperAdminOrders() {
  const { data, loading, error, refetch } = useAsync(() => apiService.getAdminOrders(), []);
  const [search, setSearch] = useState('');
  const [view, setView] = useState(null);

  const rows = useMemo(() => {
    let list = data ? [...data] : [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.id.toLowerCase().includes(q) || o.userName.toLowerCase().includes(q) || o.storeName.toLowerCase().includes(q));
    }
    return list;
  }, [data, search]);

  const columns = [
    { key: 'id', label: 'Order' },
    { key: 'customer', label: 'Customer', render: (r) => r.userName },
    { key: 'store', label: 'Store', render: (r) => <span className="text-xs text-slate-500">{r.storeName}</span> },
    { key: 'total', label: 'Amount', render: (r) => <span className="font-semibold">{formatPrice(r.total)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'open', label: '', render: (r) => (
      <button onClick={() => setView(r)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer" aria-label="View"><Eye size={16} /></button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle="View every order across all stores" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total', value: data?.length || 0, tone: 'text-slate-900' },
          { label: 'Delivered', value: (data || []).filter((o) => ['DELIVERED'].includes(o.status)).length, tone: 'text-success' },
          { label: 'In Transit', value: (data || []).filter((o) => ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ASSIGNED'].includes(o.status)).length, tone: 'text-brand-600' },
          { label: 'Cancelled', value: (data || []).filter((o) => o.status === 'CANCELLED').length, tone: 'text-danger' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${s.tone}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="card mb-4 p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search order id, customer, store..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={refetch} emptyTitle="No orders yet" emptyIcon={Search} onRowClick={() => undefined} />
      </Card>

      <Modal open={!!view} onClose={() => setView(null)} title={`Order #${view?.id}`} size="lg" footer={
        <div className="flex w-full gap-2">
          <button onClick={() => setView(null)} className="btn-secondary btn-sm flex-1">Close</button>
          <Link to={`/orders/${view?.id}`} onClick={() => setView(null)} className="btn-primary btn-sm flex-1">Open customer view</Link>
        </div>
      }>
        {view && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Customer', value: view.userName },
                { label: 'Store', value: view.storeName },
                { label: 'Total', value: formatPrice(view.total) },
                { label: 'Status', value: <StatusBadge status={view.status} /> },
              ].map((f) => (
                <div key={f.label} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-400">{f.label}</p><div className="text-sm font-semibold mt-0.5">{f.value}</div></div>
              ))}
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {view.items.map((i) => (
                <div key={`${i.productId}-${i.variantId}`} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-2.5"><ProductImage product={{ emoji: i.emoji, color: i.color, image: i.image || '' }} className="h-8 w-8 shrink-0" size={14} />{i.name} <span className="text-xs text-slate-400">× {i.quantity}</span></span>
                  <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}