import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductImage from './ProductImage.jsx';
import PriceDisplay from '../ui/PriceDisplay.jsx';
import RatingStars from '../ui/RatingStars.jsx';
import QuantitySelector from '../ui/QuantitySelector.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { cn } from '../../utils/cn.js';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="card p-3 transition-all duration-200 hover:shadow-cardHover hover:-translate-y-0.5 group relative">
      <button
        onClick={() => toggle(product.id)}
        className={cn(
          'absolute top-2 right-2 z-10 h-8 w-8 rounded-full flex items-center justify-center transition cursor-pointer border bg-white/90 backdrop-blur',
          wishlisted ? 'text-danger border-danger/30' : 'text-slate-400 border-transparent hover:text-danger'
        )}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
      </button>

      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative">
          <ProductImage product={product} className="aspect-square w-full" />
          {product.newArrival && (
            <span className="absolute bottom-2 left-2 rounded-md bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5">NEW</span>
          )}
          {product.stock <= 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
              <span className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-semibold text-slate-500">Out of stock</span>
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3">
        <Link to={`/product/${product.slug}`} className="block">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{product.brand}</p>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-brand-700 transition">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500">{product.weight}</p>
        </Link>

        <div className="mt-1.5">
          <RatingStars rating={product.rating} size={13} />
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <PriceDisplay mrp={product.mrp} price={product.sellingPrice} discount={product.discount} size="sm" showDiscount={false} />
          <div className="shrink-0">
            {product.stock > 0 ? (
              <div className="rounded-lg border border-brand-600 overflow-hidden w-24">
                <div className="flex items-center justify-between">
                  <button className="h-7" aria-hidden="true" tabIndex={-1} />
                  <QuantitySelector quantity={quantity} onChange={setQuantity} min={1} max={Math.min(product.maxQty || 10, product.stock || 99)} size="sm" />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <button
          onClick={() => addItem(product, null, quantity)}
          disabled={product.stock <= 0}
          className="mt-2 w-full btn-primary btn-sm"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}