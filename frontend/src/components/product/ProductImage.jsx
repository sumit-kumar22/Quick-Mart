import { cn } from '../../utils/cn.js';

export default function ProductImage({ product, className, size = 20 }) {
  if (!product) return null;
  return (
    <div
      className={cn(
        'relative flex items-center justify-center bg-gradient-to-br overflow-hidden rounded-xl',
        product.color || 'from-slate-100 to-slate-200',
        className
      )}
      role="img"
      aria-label={product.name || 'Product'}
    >
      {product.image ? (
        <img
          src={product.image}
          alt={product.name || 'Product'}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <span className="drop-shadow-sm select-none" style={{ fontSize: typeof size === 'number' ? `${size}px` : size }} aria-hidden="true">
          {product.emoji || '📦'}
        </span>
      )}
    </div>
  );
}