import { Plus, Minus } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function QuantitySelector({ quantity, onChange, min = 1, max = 10, size = 'md' }) {
  const btnClass = cn(
    'inline-flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-700 transition hover:bg-brand-100 active:scale-95 cursor-pointer',
    size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'
  );
  return (
    <div className="inline-flex items-center gap-1">
      <button type="button" className={btnClass} onClick={() => onChange(Math.max(min, quantity - 1))} aria-label="Decrease quantity" disabled={quantity <= min}>
        <Minus size={size === 'sm' ? 12 : 14} />
      </button>
      <span className={cn('min-w-8 text-center font-semibold tabular-nums', size === 'sm' ? 'text-xs' : 'text-sm')}>{quantity}</span>
      <button type="button" className={btnClass} onClick={() => onChange(Math.min(max, quantity + 1))} aria-label="Increase quantity" disabled={quantity >= max}>
        <Plus size={size === 'sm' ? 12 : 14} />
      </button>
    </div>
  );
}