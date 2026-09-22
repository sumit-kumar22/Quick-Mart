import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, Home, MessageCircle } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatPrice, formatDateTime } from '../utils/format.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const { data: order } = useAsync(() => apiService.getOrder(orderId), [orderId]);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="card p-6 sm:p-8 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
          <CheckCircle2 size={44} className="text-success" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Order Placed!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your order <span className="font-semibold text-slate-700">#{orderId}</span> has been placed successfully.
          {order && <> It will be delivered to you by <span className="font-semibold text-brand-700">{order.etd}</span>.</>}
        </p>

        {order && (
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-100 p-4 text-left space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Estimated delivery</span><span className="font-semibold">{order.etd}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Payment</span><span className="font-semibold capitalize">{order.paymentMethod.toLowerCase()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Amount paid</span><span className="font-semibold">{formatPrice(order.total)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Placed at</span><span className="font-semibold">{formatDateTime(order.createdAt)}</span></div>
            <div className="flex justify-between text-sm items-center"><span className="text-slate-500">Status</span><StatusBadge status={order.status} /></div>
          </div>
        )}

        <div className="mt-7 grid grid-cols-2 gap-3">
          <Link to={`/track-order/${orderId}`} className="btn-primary justify-center">
            <Package size={17} /> Track Order
          </Link>
          <Link to="/orders" className="btn-secondary justify-center">
            <Home size={17} /> My Orders
          </Link>
        </div>
        <Link to="/" className="btn-ghost w-full justify-center mt-2">Continue Shopping</Link>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-400">Any issue with your order? </p>
          <Link to="/support" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mt-1">
            <MessageCircle size={14} /> Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}