import { useState, useMemo } from 'react';
import { Search, Eye, ChevronDown } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { apiService } from '../../services/apiService.js';
import DataTable from '../../components/ui/DataTable.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageHeader } from '../../components/ui/Card.jsx';
import { ORDER_STATUS } from '../../utils/constants.js';
import { formatPrice, formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn.js';

const STATUSES = Object.keys(ORDER_STATUS);

export default function AdminOrders() {
  const { data, loading, error, refetch } = useAsync(() => apiService.getAdminOrders(), []);
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewOrder, setViewOrder] = useState(null);

  const rows = useMemo(() => {
    let list = data || [];
    if (statusFilter !== 'ALL') list = list.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.id.toLowerCase().includes(q) || o.userName.toLowerCase().includes(q) || o.storeName.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data, search, statusFilter]);

  const updateStatus = async (status) => {
    try {
      await apiService.updateOrderStatus(viewOrder.id, status);
      toast.show(`Order ${viewOrder.id} marked ${ORDER_STATUS[status]?.label.toUpperCase()}`);
      setViewOrder(null);
      refetch();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  };

  const columns = [
    { key: 'id', label: 'Order' },
    { key: 'customer', label: 'Customer', render: (r) => r.userName },
    { key: 'store', label: 'Store', render: (r) => <span className="text-xs text-slate-500">{r.storeName}</span> },
    { key: 'total', label: 'Amount', render: (r) => <span className="font-semibold">{formatPrice(r.total)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payment', label: 'Payment', render: (r) => <span className="text-xs capitalize">{r.paymentMethod.toLowerCase()}</span> },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage and track all orders" />
      <div className="card mb-4 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by order id, customer, store..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input pr-9 cursor-pointer">
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={refetch}
          onRowClick={setViewOrder}
          emptyTitle="No orders found"
        />
      </div>

      {/* Order detail modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order #${viewOrder?.id}`} size="lg" footer={
        <div className="flex gap-2 w-full flex-wrap">
          <button onClick={() => setViewOrder(null)} className="btn-secondary btn-sm">Close</button>
          <div className="flex-1" />
          <div className="relative">
            <select onChange={(e) => updateStatus(e.target.value)} defaultValue={viewOrder?.status} className="input pr-9 cursor-pointer w-52">
              {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      }>
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Customer', value: viewOrder.userName },
                { label: 'Store', value: viewOrder.storeName },
                { label: 'Total', value: formatPrice(viewOrder.total) },
                { label: 'Placed', value: formatDate(viewOrder.createdAt, true) },
              ].map((f) => (
                <div key={f.label} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-400">{f.label}</p><p className="text-sm font-semibold mt-0.5">{f.value}</p></div>
              ))}
            </div>
            <div>
              <p className="label">Items</p>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {viewOrder.items.map((i) => (
                  <div key={`${i.productId}-${i.variantId}`} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-2.5"><ProductImage product={{ emoji: i.emoji, color: i.color, image: i.image || '' }} className="h-8 w-8 shrink-0" size={14} />{i.name} <span className="text-xs text-slate-400">× {i.quantity}</span></span>
                    <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p className="text-slate-500">Delivery address</p>
              <p className="text-right font-medium">{viewOrder.address?.line1}, {viewOrder.address?.city}</p>
              <p className="text-slate-500">Payment</p>
              <p className="text-right font-medium capitalize">{viewOrder.paymentMethod.toLowerCase()}</p>
            </div>
            <Link to={`/orders/${viewOrder.id}`} onClick={() => setViewOrder(null)} className="btn-secondary btn-sm w-full justify-center"><Eye size={14} /> Open in customer view</Link>
          </div>
        )}
      </Modal>
    </div>
  );
}