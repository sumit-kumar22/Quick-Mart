import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Navigation, Check, Package, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import OrderTimeline from '../components/ui/OrderTimeline.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { formatPrice, formatDateTime } from '../utils/format.js';
import { cn } from '../utils/cn.js';

function FakeMap({ storeName, status }) {
  const delivering = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVING'].includes(status);
  return (
    <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-200 bg-[#eef2f7]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute left-6 top-6 flex flex-col items-center">
        <span className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg">
          <Package size={18} />
        </span>
        <p className="mt-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow border border-slate-100">
          {storeName || 'Store'}
        </p>
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 250" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M40 60 C 120 30, 260 200, 340 170"
          fill="none"
          stroke={delivering ? '#4f46e5' : '#e2e8f0'}
          strokeWidth="3"
          strokeDasharray="7 5"
          strokeLinecap="round"
        >
          {delivering && <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.2s" repeatCount="indefinite" />}
        </path>
      </svg>

      {delivering && (
        <div className="absolute" style={{ left: '48%', top: '58%' }}>
          <span className="h-10 w-10 rounded-full bg-white border-2 border-brand-600 flex items-center justify-center text-lg shadow-card animate-cart-bounce">🛵</span>
        </div>
      )}

      <div className="absolute right-6 bottom-6 flex flex-col items-center">
        <span className="h-9 w-9 rounded-full bg-success text-white flex items-center justify-center shadow-lg">
          <MapPin size={18} />
        </span>
        <p className="mt-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow border border-slate-100">Your location</p>
      </div>
    </div>
  );
}

export default function TrackOrder() {
  const { id } = useParams();
  const { data: order, loading, error } = useAsync(() => apiService.getOrder(id), [id]);
  const { data: partner } = useAsync(
    () => (order?.deliveryPartnerId ? apiService.getDeliveryPartnerById(order.deliveryPartnerId) : Promise.resolve({ data: null })),
    [order?.deliveryPartnerId],
    !!order?.deliveryPartnerId
  );

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12"><p className="text-sm text-slate-400">Loading order...</p></div>;

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState title="Order not found" description="We couldn't find this order." action={<Link to="/orders" className="btn-primary">Back to Orders</Link>} />
      </div>
    );
  }

  const storeName = order.storeName || 'QuickMart Store';
  const delivering = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVING'].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to={`/orders/${order.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 mb-4">
        <ArrowLeft size={16} /> Order details
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold">Track Order #{order.id}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Live banner */}
      <div className={cn('rounded-card p-4 mb-5 flex items-center gap-3 border text-white', delivering ? 'bg-gradient-to-r from-brand-600 to-violet-600 border-brand-700' : 'bg-gradient-to-r from-slate-700 to-slate-800 border-slate-700')}>
        <span className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center animate-cart-bounce">
          <Navigation size={22} />
        </span>
        <div className="flex-1">
          <p className="font-bold">Your order is {delivering ? 'on the way!' : order.status === 'DELIVERED' ? 'delivered 🎉' : 'being prepared'}</p>
          <p className="text-xs text-white/80 mt-0.5">
            {order.status === 'DELIVERED' ? 'Thank you for ordering with QuickMart.' : `Estimated to arrive in ${order.etd}`}
          </p>
        </div>
        <span className="hidden sm:block text-3xl" aria-hidden="true">{delivering ? '🛵' : '🥘'}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-5">
          <FakeMap storeName={storeName} status={order.status} />

          {partner && (
            <div className="card p-5">
              <h2 className="font-semibold mb-3">Your Delivery Partner</h2>
              <div className="flex items-center gap-3">
                <span className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-bold text-base">
                  {partner.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{partner.name} <span className="text-xs font-medium text-slate-400 ml-1">★ {partner.rating}</span></p>
                  <p className="text-xs text-slate-500">{partner.vehicle} · {partner.vehicleNumber}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary btn-sm" aria-label="Call delivery partner"><Phone size={15} /></button>
                  <button className="btn-secondary btn-sm" aria-label="Message delivery partner"><MessageCircle size={15} /></button>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-semibold mb-3">Delivery OTP</h2>
            <p className="text-xs text-slate-500 mb-2">Share this OTP with your delivery partner to complete the delivery.</p>
            <div className="flex gap-2">
              {String(order.otp).split('').map((d, i) => (
                <span key={i} className="h-12 w-11 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 flex items-center justify-center text-xl font-extrabold text-brand-700">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Delivery Progress</h2>
            <OrderTimeline status={order.status} />
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Items</span><span>{order.items.reduce((s, i) => s + i.quantity, 0)}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">From</span><span className="font-medium text-right max-w-[60%]">{storeName}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Payment</span><span className="capitalize font-medium">{order.paymentMethod.toLowerCase()}</span></div>
            <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between font-bold"><span>Total</span><span className="text-brand-700">{formatPrice(order.total)}</span></div>
            <div className="mt-3 space-y-2">
              <button className="btn-primary w-full justify-center"><MessageCircle size={15} /> Message Support</button>
              <Link to={`/orders/${order.id}`} className="btn-secondary w-full justify-center"><Package size={15} /> View full details</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}