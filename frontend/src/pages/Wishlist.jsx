import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductImage from '../components/product/ProductImage.jsx';
import PriceDisplay from '../components/ui/PriceDisplay.jsx';
import RatingStars from '../components/ui/RatingStars.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useState } from 'react';

export default function Wishlist() {
  const { products, toggle } = useWishlist();
  const { addItem } = useCart();
  const toast = useToast();
  const [justMoved, setJustMoved] = useState(null);

  const moveToCart = (p) => {
    addItem(p);
    toggle(p.id);
    setJustMoved(p.id);
    setTimeout(() => setJustMoved(null), 1500);
    toast.show(`${p.name} moved to cart`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Heart size={24} className="text-danger" /> My Wishlist</h1>
      <p className="text-sm text-slate-500 mb-6">{products.length} saved product{products.length !== 1 ? 's' : ''}</p>

      {products.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here for later."
          icon={Heart}
          action={<Link to="/" className="btn-primary">Discover Products</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="card p-3.5 hover:shadow-cardHover transition">
              <Link to={`/product/${p.slug}`}>
                <ProductImage product={p} className="aspect-square w-full" size={52} />
              </Link>
              <Link to={`/product/${p.slug}`}>
                <p className="text-[10px] text-slate-400 uppercase mt-2">{p.brand}</p>
                <h3 className="text-sm font-semibold line-clamp-1 mt-0.5 hover:text-brand-700">{p.name}</h3>
              </Link>
              <p className="text-xs text-slate-400">{p.weight}</p>
              <div className="mt-1"><RatingStars rating={p.rating} size={12} /></div>
              <div className="mt-2"><PriceDisplay mrp={p.mrp} price={p.sellingPrice} discount={p.discount} size="sm" /></div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => moveToCart(p)} disabled={justMoved === p.id} className="btn-primary btn-sm flex-1">
                  {justMoved === p.id ? <CheckShort /> : <><ShoppingBag size={14} /> Move to Cart</>}
                </button>
                <button onClick={() => { toggle(p.id); toast.show('Removed from wishlist', 'info'); }} className="btn-ghost btn-sm text-danger px-2">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckShort() {
  return <span className="flex items-center gap-1.5 justify-center"><span className="h-3 w-3 rounded-full bg-white/30 flex items-center justify-center"><span className="text-[8px]">✓</span></span> Added</span>;
}