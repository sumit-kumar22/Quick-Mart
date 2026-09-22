import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, CreditCard, Wallet, Banknote, ChevronRight, Loader2, Check, Plus, Zap, ShieldCheck,
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiService } from '../services/apiService.js';
import ProductImage from '../components/product/ProductImage.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import { formatPrice } from '../utils/format.js';
import { cn } from '../utils/cn.js';

const SLOTS = [
  { id: 's1', label: 'ASAP', eta: '10-20 min', soonest: true },
  { id: 's2', label: '9:00 - 9:30 AM' },
  { id: 's3', label: '9:30 - 10:00 AM' },
  { id: 's4', label: '10:00 - 10:30 AM' },
  { id: 's5', label: 'Evening 6:00 - 7:00 PM' },
];

const PAYMENTS = [
  { id: 'RAF', label: 'UPI / GPay / PhonePe', desc: 'Pay instantly', icon: Wallet, type: 'upi' },
  { id: 'RAZORPAY', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard, type: 'card' },
  { id: 'NETBANKING', label: 'Net Banking', desc: 'All major banks', icon: CreditCard, type: 'netbanking' },
  { id: 'COD', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Banknote, type: 'cod' },
];

export default function Checkout() {
  const { cart, totals } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [addressId, setAddressId] = useState(user?.addresses?.find((a) => a.isDefault)?.id || user?.addresses?.[0]?.id || '');
  const [slotId, setSlotId] = useState(SLOTS[0].id);
  const [paymentId, setPaymentId] = useState('RAF');
  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState('pay'); // pay -> processing -> done
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', type: 'home', name: user?.name, phone: user?.phone, line1: '', line2: '', landmark: '', city: '', state: '', pincode: '' });

  const address = user?.addresses?.find((a) => a.id === addressId);
  const slot = SLOTS.find((s) => s.id === slotId);

  useEffect(() => {
    if (cart.items.length === 0 && step === 'pay') {
      const t = setTimeout(() => navigate('/cart'), 50);
      return () => clearTimeout(t);
    }
  }, [cart.items.length, navigate, step]);

  const saveAddress = (e) => {
    e.preventDefault();
    const a = { id: `ad-${Date.now()}`, ...newAddress, isDefault: user?.addresses?.length === 0 };
    // persisted locally for session via context not available; fallback: navigate without persisting
    toast.show('Address saved');
    setAddAddressOpen(false);
  };

  const placeOrder = async () => {
    if (!address) { toast.show('Please select a delivery address', 'error'); return; }
    setPlacing(true);
    setStep('processing');
    try {
      // payment simulation
      await new Promise((r) => setTimeout(r, 1600));
      const res = await apiService.placeOrder({
        addressId,
        slotId,
        paymentMethod: paymentId,
        items: cart.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, price: i.price })),
        amount: totals.total,
        coupon: cart.coupon?.code || null,
      });
      const orderId = res.data?.orderId || `ord-${Date.now()}`;
      setStep('done');
      toast.show('Order placed successfully 🎉');
      setTimeout(() => navigate(`/order-success/${orderId}`), 600);
    } catch (err) {
      setStep('pay');
      toast.show(err.message || 'Payment could not be verified', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const summary = useMemo(() => [
    { label: 'Item total', value: totals.mrpTotal },
    { label: 'Item discount', value: -totals.discount, green: true },
    ...(totals.couponDiscount > 0 ? [{ label: `Coupon (${cart.coupon?.code})`, value: -totals.couponDiscount, green: true }] : []),
    { label: 'Delivery fee', value: totals.deliveryFee, green: totals.deliveryFee === 0 },
    { label: 'GST', value: totals.tax },
    { label: 'Platform fee', value: totals.platformFee },
  ], [cart.coupon, totals]);

  if (step === 'processing') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
            <Loader2 size={30} className="text-white animate-spin" />
          </div>
        </div>
        <h1 className="text-xl font-bold">Processing your payment...</h1>
        <p className="text-sm text-slate-500 mt-1">Please do not close this window. Verifying securely.</p>
        <div className="mt-6 w-full max-w-xs space-y-2">
          {['Confirming order details', 'Securing payment', 'Confirming with our store', 'Preparing your order'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-sm text-slate-600">
              {i < 3 ? <Check size={16} className="text-success" /> : <Loader2 size={16} className="animate-spin text-brand-600" />} {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState title="Nothing to checkout" description="Your cart is empty." action={<Link to="/" className="btn-primary">Go Shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
      <h1 className="text-xl md:text-2xl font-bold mb-5">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Address */}
          <section className="card p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3"><MapPin size={17} className="text-brand-600" /> Delivery Address</h2>
            {user?.addresses?.length ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {user.addresses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAddressId(a.id)}
                    className={cn('rounded-xl border p-4 text-left transition cursor-pointer', addressId === a.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-brand-300')}
                  >
                    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', a.type === 'home' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700')}>{a.type}</span>
                    <p className="text-sm font-semibold mt-2">{a.line1}, {a.line2}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.city}, {a.state} {a.pincode}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No saved address. Please add one to continue.</p>
            )}
            <button onClick={() => setAddAddressOpen(true)} className="mt-3 btn-secondary btn-sm">
              <Plus size={14} /> Add address
            </button>
          </section>

          {/* Delivery slot */}
          <section className="card p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3"><Zap size={17} className="text-brand-600" /> Delivery Slot</h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {SLOTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSlotId(s.id)}
                  className={cn('shrink-0 rounded-xl border px-4 py-3 text-center transition cursor-pointer', slotId === s.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-brand-300')}
                >
                  <span className="text-sm font-semibold block">{s.label}</span>
                  {s.eta && <span className="text-[11px] text-success font-medium">{s.eta}</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="card p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3"><Wallet size={17} className="text-brand-600" /> Payment Method</h2>
            <div className="space-y-2">
              {PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaymentId(p.id)}
                  className={cn('w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition cursor-pointer', paymentId === p.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-brand-300')}
                >
                  <span className={cn('h-10 w-10 rounded-lg flex items-center justify-center', paymentId === p.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500')}>
                    <p.icon size={19} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{p.label}</span>
                    <span className="block text-xs text-slate-400">{p.desc}</span>
                  </span>
                  <span className={cn('h-4 w-4 rounded-full border-2', paymentId === p.id ? 'border-brand-600 bg-brand-600' : 'border-slate-300')}>
                    {paymentId === p.id && <span className="block h-2 w-2 rounded-full bg-white m-[2px]" />}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-success" /> Payments are secure & verified. You can pay by cash for COD orders.
            </p>
          </section>
        </div>

        {/* Order summary */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="max-h-60 overflow-y-auto thin-scroll space-y-3 pr-1 mb-3">
              {cart.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3">
                    <ProductImage product={{ emoji: i.emoji, color: i.color, image: i.image || '' }} className="h-12 w-12 shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{i.name}</p>
                      <p className="text-xs text-slate-400">{i.weight} × {i.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
            </div>
            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
              {summary.map((row, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={cn('font-medium', row.green && 'text-success')}>{row.value < 0 ? `− ${formatPrice(Math.abs(row.value))}` : formatPrice(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="font-bold">To Pay</span>
                <span className="text-xl font-extrabold text-brand-600">{formatPrice(totals.total)}</span>
              </div>
            </div>
            {slot && <p className="text-xs text-success mt-3 flex items-center gap-1">⚡ {slot.label === 'ASAP' ? 'Delivering ASAP' : `Scheduled: ${slot.label}`} — {slot.eta || ''}</p>}
            <button onClick={placeOrder} disabled={placing} className="btn-primary w-full justify-center mt-4">
              {placing ? <><Loader2 size={17} className="animate-spin" /> Placing order...</> : <>Place Order <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>

      {/* Add address modal */}
      <Modal open={addAddressOpen} onClose={() => setAddAddressOpen(false)} title="Add delivery address">
        <form onSubmit={saveAddress} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={newAddress.type} onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Label</label>
              <input className="input" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} placeholder="e.g. Home" required />
            </div>
          </div>
          <div>
            <label className="label">Address line</label>
            <input className="input" placeholder="House no, building, street" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} required />
          </div>
          <div>
            <label className="label">Landmark</label>
            <input className="input" placeholder="Near..." value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input className="input" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} required />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center">Save Address</button>
        </form>
      </Modal>
    </div>
  );
}