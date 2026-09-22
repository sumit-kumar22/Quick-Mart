import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Package, CheckCircle2, KeyRound } from 'lucide-react';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPrice } from '../../utils/format.js';

const STEP_META = {
  READY_FOR_PICKUP: { step: 'Accept delivery', action: 'accept' },
  ASSIGNED: { step: 'Pick up order', next: 'PICKED_UP' },
  PICKED_UP: { step: 'Mark out for delivery', next: 'OUT_FOR_DELIVERY' },
  OUT_FOR_DELIVERY: { step: 'Verify OTP & deliver', otp: true },
  ARRIVING: { step: 'Verify OTP & deliver', otp: true },
};

export default function DeliveryOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [working, setWorking] = useState(false);

  const { data: order, loading, error, refetch } = useAsync(() => apiService.getOrder(id), [id]);

  if (loading) return <EmptyState title="Loading order..." icon={Package} />;
  if (!order || error) {
    return <EmptyState title={error?.message || 'Order not found'} action={<Link to="/delivery/orders" className="btn-primary">Back</Link>} />;
  }

  const meta = STEP_META[order.status] || null;
  const needsOtp = !!meta?.otp;

  const advance = async () => {
    setWorking(true);
    try {
      if (meta.action === 'accept') {
        await apiService.acceptDeliveryOrder(order.id);
        toast.show('Order accepted');
      } else if (meta.next) {
        await apiService.updateDeliveryStatus(order.id, { status: meta.next });
        toast.show(`Order marked as ${meta.next.replace(/_/g, ' ').toLowerCase()}`);
      }
      refetch();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setWorking(false);
    }
  };

  const verifyOtp = async () => {
    setWorking(true);
    setOtpError('');
    try {
      await apiService.verifyDeliveryOtp(order.id, otp);
      toast.show('OTP verified — delivery completed! 🎉');
      navigate('/delivery/dashboard');
    } catch (err) {
      setOtpError(err.message || 'Incorrect OTP. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const done = ['DELIVERED', 'CANCELLED'].includes(order.status);

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/delivery/orders')} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 mb-4 cursor-pointer">
        <ArrowLeft size={16} /> Back to deliveries
      </button>

      <div className="card p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Order #{order.id}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{order.userName} · {order.address?.phone || '98xxxxxx21'}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><span className="text-slate-500">Amount:</span> <span className="font-bold">{formatPrice(order.total)}</span> · {order.paymentMethod}</div>
      </div>

      <div className="card p-5 mb-4 space-y-3">
        <h2 className="font-semibold">Delivery Flow</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 p-3.5">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase"><MapPin size={13} className="text-brand-600" /> Pickup</p>
            <p className="text-sm font-semibold mt-1">{order.storeName || 'Store'}</p>
            <button className="btn-secondary btn-sm mt-2 w-full"><Navigation size={13} /> Navigate to Store</button>
          </div>
          <div className="rounded-xl border border-slate-200 p-3.5">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase"><MapPin size={13} className="text-success" /> Drop</p>
            <p className="text-sm font-semibold mt-1">{order.address?.line1}</p>
            <p className="text-xs text-slate-400 mt-0.5">{order.address?.city} {order.address?.pincode}</p>
            <button className="btn-secondary btn-sm mt-2 w-full"><Navigation size={13} /> Navigate to Customer</button>
          </div>
        </div>

        {meta && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={advance} disabled={working} className="btn-primary flex-1">
              <CheckCircle2 size={16} /> {meta.step}
            </button>
          </div>
        )}
      </div>

      {needsOtp ? (
        <div className="card p-5 mb-4">
          <h2 className="font-semibold flex items-center gap-2 mb-1"><KeyRound size={17} className="text-brand-600" /> Delivery OTP</h2>
          <p className="text-xs text-slate-500 mb-3">Enter the OTP shared by the customer to mark the order delivered.</p>
          <div className="flex gap-2">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="input text-center tracking-[0.5em] font-bold w-32"
              inputMode="numeric"
              aria-label="Delivery OTP"
            />
            <button onClick={verifyOtp} disabled={working || otp.length < 6} className="btn-success flex-1">
              <KeyRound size={16} /> Verify & Complete Delivery
            </button>
          </div>
          {otpError && <p className="text-sm text-danger mt-2">{otpError}</p>}
        </div>
      ) : (
        !done && (
          <div className="card p-5 mb-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2"><Package size={17} className="text-brand-600" /> Delivery OTP</h2>
            <p className="text-sm text-slate-500">OTP verification unlocks once the order is marked <span className="font-semibold">Out for Delivery</span>.</p>
          </div>
        )
      )}

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Items ({order.items.length})</h2>
        <div className="divide-y divide-slate-100">
          {order.items.map((i) => (
            <div key={i.productId} className="flex items-center justify-between py-2.5 text-sm">
              <span className="flex items-center gap-2.5"><ProductImage product={{ emoji: i.emoji, color: i.color, image: i.image || '' }} className="h-8 w-8 shrink-0" size={14} /> {i.name} <span className="text-xs text-slate-400">× {i.quantity}</span></span>
              <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}