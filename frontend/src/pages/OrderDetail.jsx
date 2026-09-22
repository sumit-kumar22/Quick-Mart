import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Truck, Printer, MessageCircle, Repeat } from 'lucide-react';
import { formatPrice, formatDateTime } from '../utils/format.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import OrderTimeline from '../components/ui/OrderTimeline.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import ProductImage from '../components/product/ProductImage.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { data: order, loading, error, refetch } = useAsync(() => apiService.getOrder(id), [id]);
  const { data: partner } = useAsync(
    () => (order?.deliveryPartnerId ? apiService.getDeliveryPartnerById(order.deliveryPartnerId) : Promise.resolve({ data: null })),
    [order?.deliveryPartnerId],
    !!order?.deliveryPartnerId
  );

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12"><p className="text-sm text-slate-400">Loading order...</p></div>;

  if (error || !order) {
    return <div className="max-w-3xl mx-auto px-4 py-12"><EmptyState title="Order not found" description="We couldn't find this order." action={<Link to="/orders" className="btn-primary">Back to Orders</Link>} /></div>;
  }

  const cancellable = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      await apiService.cancelOrder(order.id);
      toast.show('Order cancelled successfully', 'info');
      setCancelOpen(false);
      refetch();
      navigate('/orders');
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = () => {
    toast.show('Items added to cart');
    navigate('/cart');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 mb-4 cursor-pointer">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold">Order #{order.id}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          {cancellable && (
            <button onClick={() => setCancelOpen(true)} className="btn-danger btn-sm">Cancel Order</button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="md:col-span-2 space-y-5">
          {/* Items */}
          <section className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Package size={17} className="text-brand-600" /> Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</h2>
            <div className="divide-y divide-slate-100">
              {order.items.map((i) => (
                  <div key={`${i.productId}-${i.variantId}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <ProductImage product={{ emoji: i.emoji, color: i.color, image: i.image || '' }} className="h-14 w-14 shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{i.name}</p>
                      <p className="text-xs text-slate-400">{i.weight} × {i.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="card p-5">
            <h2 className="font-semibold mb-4">Order Progress</h2>
            <OrderTimeline status={order.status} />
          </section>

          {/* Payment summary */}
          <section className="card p-5">
            <h2 className="font-semibold mb-3">Payment Summary</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Item total</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-success">− {formatPrice(order.discount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery fee</span><span>{order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">GST ({order.tax}%)</span><span>{formatPrice(order.taxAmount)}</span></div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold"><span>Total Paid</span><span className="text-brand-700">{formatPrice(order.total)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Payment</span><span className="capitalize">{order.paymentMethod.toLowerCase()} — {order.paymentStatus}</span></div>
            </div>
            <button onClick={() => toast.show('Invoice download started', 'info')} className="btn-secondary btn-sm mt-4">
              <Printer size={14} /> Download Invoice
            </button>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><MapPin size={17} className="text-brand-600" /> Delivery Address</h2>
            <p className="text-sm font-semibold">{order.address?.name}</p>
            <p className="text-sm text-slate-500 mt-1">{order.address?.line1}<br />{order.address?.line2}<br />{order.address?.city} {order.address?.pincode}</p>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Truck size={17} className="text-brand-600" /> Delivery Partner</h2>
            {partner ? (
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">{partner.name.split(' ').map((s) => s[0]).join('')}</span>
                <div>
                  <p className="text-sm font-semibold">{partner.name}</p>
                  <p className="text-xs text-success flex items-center gap-1">● {order.status === 'OUT_FOR_DELIVERY' ? 'On the way to you' : 'Assigned'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">A partner will be assigned soon.</p>
            )}
          </section>

          <div className="space-y-2">
            <button onClick={handleReorder} className="btn-primary w-full justify-center"><Repeat size={16} /> Reorder</button>
            <Link to="/support" state={{ orderId: order.id }} className="btn-secondary w-full justify-center"><MessageCircle size={16} /> Need Help?</Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelOrder}
        title="Cancel this order?"
        message={`Your payment of ${formatPrice(order.total)} will be refunded if already paid. This action cannot be undone.`}
        confirmText="Yes, cancel order"
        danger
        loading={cancelling}
      />
    </div>
  );
}