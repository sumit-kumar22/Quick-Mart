import { Trash2, Heart } from 'lucide-react';
import ProductImage from '../product/ProductImage.jsx';
import QuantitySelector from '../ui/QuantitySelector.jsx';
import { formatPrice } from '../../utils/format.js';

export default function CartItem({ item, onUpdateQty, onRemove, onMoveToWishlist }) {
  const product = { emoji: item.emoji || '📦', color: item.color || 'from-slate-100 to-slate-200', image: item.image || '' };

  return (
    <div className="flex gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <ProductImage product={product} className="h-16 w-16 shrink-0" size={28} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</p>
        <p className="text-xs text-slate-500">{item.weight}</p>
        <p className="text-sm font-semibold text-slate-900 mt-1">{formatPrice(item.price)}</p>
        <div className="mt-2 flex items-center justify-between">
          <QuantitySelector quantity={item.quantity} onChange={(q) => onUpdateQty(item.id, q)} min={1} max={item.maxQty} size="sm" />
          <span className="text-xs font-medium text-slate-500">{formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between gap-2">
        <button onClick={() => onRemove(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-red-50 transition cursor-pointer" aria-label="Remove item">
          <Trash2 size={16} />
        </button>
        <button onClick={() => onMoveToWishlist(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer" title="Move to wishlist" aria-label="Move to wishlist">
          <Heart size={16} />
        </button>
      </div>
    </div>
  );
}