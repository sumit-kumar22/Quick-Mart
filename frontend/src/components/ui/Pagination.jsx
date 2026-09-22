import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function Pagination({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) return null;
  return (
    <div className={cn('flex items-center justify-center gap-2 mt-8', className)}>
      <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} /> Prev
      </button>
      {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
        const p = i + 1;
        const isActive = p === page;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'h-8 min-w-8 px-2 rounded-lg text-sm font-medium border transition cursor-pointer',
              isActive ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'
            )}
          >
            {p}
          </button>
        );
      })}
      <button className="btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}