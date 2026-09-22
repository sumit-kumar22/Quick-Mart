import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { formatPrice } from '../../utils/format.js';

export default function DeliveryOrders() {
  const { data: myOrders, loading, refetch } = useAsync(() => apiService.getDeliveryOrders('assigned'), []);

  return (
    <div>
      <h1 className="text-2xl font-bold">My Deliveries</h1>
      <p className="text-sm text-slate-500 mt-1">All orders assigned to you.</p>

      {loading ? (
        <div className="mt-8"><EmptyState title="Loading deliveries..." description="" icon={Package} /></div>
      ) : !myOrders || myOrders.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No deliveries assigned" description="New deliveries will appear here as soon as you're assigned." icon={Package} />
        </div>
      ) : (
        <div className="mt-6 space-y-3" onRefresh={refetch}>
          {myOrders.map((o) => (
            <Link key={o.id} to={`/delivery/orders/${o.id}`} className="card p-4 flex flex-wrap items-center gap-4 hover:shadow-cardHover transition">
              <span className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Package size={20} /></span>
              <div className="flex-1 min-w-40">
                <p className="font-semibold">#{o.id}</p>
                <p className="text-xs text-slate-400">{o.items.length} items · {o.storeName}</p>
              </div>
              <StatusBadge status={o.status} />
              <span className="font-bold text-sm">{formatPrice(o.total)}</span>
              <span className="text-[11px] text-slate-400">Pickup: {o.slot || '—'}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}