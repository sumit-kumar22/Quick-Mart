import { cn } from '../../utils/cn.js';
import { formatPrice } from '../../utils/format.js';

export default function PriceDisplay({ mrp, price, size = 'md', discount, showDiscount = true }) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };
  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      <span className={cn('font-semibold text-slate-900', sizes[size])}>{formatPrice(price)}</span>
      {mrp > price && <span className={cn('text-slate-400 line-through', size === 'sm' ? 'text-xs' : 'text-sm')}>{formatPrice(mrp)}</span>}
      {showDiscount && discount > 0 && (
        <span className="text-[11px] font-semibold text-success bg-success/10 rounded-md px-1.5 py-0.5">
          {discount}% OFF
        </span>
      )}
    </div>
  );
}