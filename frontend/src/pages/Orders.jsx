import { Link } from 'react-router-dom';
import { Package, Repeat } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatPrice, formatDate } from '../utils/format.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ProductImage from '../components/product/ProductImage.jsx';

export default function Orders() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => apiService.getOrders(), [user?.id]);
  const orders = (data || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Track, cancel or reorder your recent purchases.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading your orders...</p>
      ) : error ? (
        <p className="text-sm text-danger">Could not load orders.</p>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Your orders will appear here once you place them." icon={Package} action={<Link to="/" className="btn-primary">Start Shopping</Link>} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-4 sm:p-5 hover:shadow-cardHover transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Package size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">#{o.id}</p>
                    <p className="text-xs text-slate-400">{formatDate(o.createdAt, true)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex -space-x-2">
                  {o.items.slice(0, 4).map((i) => (
                    <ProductImage key={i.productId || i.id} product={{ emoji: i.emoji, color: i.color, image: i.image || '' }} className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white" size={16} />
                  ))}
                </div>
                <p className="text-sm text-slate-500 flex-1">
                  {o.items.map((i) => i.name).slice(0, 2).join(', ')}
                  {o.items.length > 2 && ` +${o.items.length - 2} more`}
                </p>
                <p className="text-sm font-bold">{formatPrice(o.total)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/orders/${o.id}`} className="btn-secondary btn-sm">View Details</Link>
                <Link to={`/track-order/${o.id}`} className="btn-secondary btn-sm">Track</Link>
                {(o.status === 'DELIVERED' || o.status === 'CANCELLED') && (
                  <button className="btn-ghost btn-sm text-brand-600"><Repeat size={14} /> Reorder</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}