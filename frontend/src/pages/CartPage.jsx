import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Ticket, X, ArrowRight, ShoppingBag, Tag } from 'lucide-react';
import CartItem from '../components/cart/CartItem.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { apiService } from '../services/apiService.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/format.js';
import { cn } from '../utils/cn.js';

function BillRow({ label, value, accent }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-slate-500">{label}</span>
      <span className={cn('font-medium', accent === 'green' ? 'text-success' : accent === 'red' ? 'text-danger' : 'text-slate-800')}>{value}</span>
    </div>
  );
}

export default function CartPage() {
  const { cart, totals, updateQuantity, removeItem, moveItemToWishlist, applyCoupon, removeCoupon } = useCart();
  const { toggle } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const moveToWishlist = (item) => {
    toggle(item.productId);
    moveItemToWishlist(item.id, () => toast.show('Moved to wishlist', 'info'));
  };

  const apply = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await apiService.validateCoupon(couponCode, totals.subtotal);
      applyCoupon(res.data);
      toast.show('Coupon applied!');
      setCouponCode('');
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Let's fix that!"
          icon={ShoppingBag}
          action={<button onClick={() => navigate('/')} className="btn-primary">Start Shopping</button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
      <h1 className="text-xl md:text-2xl font-bold mb-5">My Cart <span className="text-slate-400 text-base font-medium">({totals.itemCount} items)</span></h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="divide-y divide-slate-100">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} onUpdateQty={updateQuantity} onRemove={removeItem} onMoveToWishlist={moveToWishlist} />
              ))}
            </div>
          </div>

          {/* Coupons */}
          <div className="card p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3"><Ticket size={17} className="text-brand-600" /> Apply Coupon</h2>
            {cart.coupon ? (
              <div className="flex items-center justify-between rounded-xl border border-success/40 bg-success/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-success" />
                  <div>
                    <p className="text-sm font-semibold text-success">{cart.coupon.code}</p>
                    <p className="text-xs text-slate-500">{cart.coupon.description}</p>
                  </div>
                </div>
                <button onClick={() => { removeCoupon(); toast.show('Coupon removed', 'info'); }} className="btn-ghost btn-sm text-danger">
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code" className="input uppercase" aria-label="Coupon code" />
                <button onClick={apply} disabled={couponLoading || !couponCode.trim()} className="btn-primary shrink-0">
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}
            <Link to="/coupons" className="inline-block mt-3 text-xs text-brand-600 hover:underline">View available coupons →</Link>
          </div>
        </div>

        {/* Bill summary */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Bill Details</h2>
            <div className="space-y-1">
              <BillRow label="Item total" value={formatPrice(totals.mrpTotal)} />
              <BillRow label="Item discount" value={`− ${formatPrice(totals.discount)}`} accent="green" />
              {totals.couponDiscount > 0 && <BillRow label={`Coupon ${cart.coupon?.code || ''}`} value={`− ${formatPrice(totals.couponDiscount)}`} accent="green" />}
              <BillRow label="Delivery fee" value={totals.deliveryFee === 0 ? 'FREE' : formatPrice(totals.deliveryFee)} accent="green" />
              <BillRow label="GST" value={formatPrice(totals.tax)} />
              <BillRow label="Platform fee" value={formatPrice(totals.platformFee)} />
            </div>
            <div className="border-t border-dashed border-slate-200 mt-3 pt-3 flex justify-between">
              <span className="font-bold">To Pay</span>
              <span className="text-xl font-extrabold text-brand-600">{formatPrice(totals.total)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">You'll save {formatPrice(totals.discount + totals.couponDiscount)} on this order 🎉</p>
            <Link to="/checkout" className="btn-primary w-full justify-center mt-4">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/" className="btn-ghost w-full justify-center mt-2">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}