import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CartItem from './CartItem.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { formatPrice, formatDiscount } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

export default function CartDrawer() {
  const { cartOpen, closeCart } = useUI();
  const { cart, totals, updateQuantity, removeItem, moveItemToWishlist } = useCart();
  const { toggle } = useWishlist();
  const navigate = useNavigate();

  if (!cartOpen) return null;

  const moveToWishlist = (item) => {
    toggle(item.productId);
    moveItemToWishlist(item.id);
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={closeCart} />
      <aside className="fixed inset-y-0 right-0 z-[80] w-full max-w-md bg-white shadow-modal animate-slide-in-right flex flex-col" aria-label="Shopping cart">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-600" />
            My Cart
            {totals.itemCount > 0 && <span className="text-sm font-semibold text-slate-400">({totals.itemCount})</span>}
          </h2>
          <button onClick={closeCart} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll px-5">
          {cart.items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Add products to get them delivered in minutes."
              action={
                <button onClick={() => { closeCart(); navigate('/'); }} className="btn-primary btn-sm">
                  Start Shopping
                </button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQty={updateQuantity}
                  onRemove={removeItem}
                  onMoveToWishlist={moveToWishlist}
                />
              ))}
            </div>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 space-y-2 bg-slate-50/60">
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Item Discount</span>
                <span className="font-semibold text-success">− {formatPrice(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">GST & Charges</span>
              <span className="font-medium">{formatPrice(totals.tax + totals.platformFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Delivery Fee</span>
              <span className={cn('font-medium', totals.deliveryFee === 0 ? 'text-success' : '')}>
                {totals.deliveryFee === 0 ? 'FREE' : formatPrice(totals.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between items-end pt-2">
              <span className="font-semibold text-slate-900">{totals.itemCount} item{totals.itemCount > 1 ? 's' : ''}</span>
              <span className="text-xl font-bold text-slate-900">{formatPrice(totals.total)}</span>
            </div>
            <Link to="/cart" onClick={closeCart} className="btn-primary w-full mt-2">
              View Cart & Checkout <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}