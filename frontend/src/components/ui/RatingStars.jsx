import { Star, StarHalf } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function RatingStars({ rating = 0, count, size = 14, className }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) return <Star key={i} size={size} fill="currentColor" strokeWidth={0} />;
          if (i === full && half) return <StarHalf key={i} size={size} fill="currentColor" strokeWidth={0} />;
          return <Star key={i} size={size} className="text-slate-200" fill="currentColor" strokeWidth={0} />;
        })}
      </div>
      {count != null && <span className="text-xs text-slate-500">({count})</span>}
    </div>
  );
}