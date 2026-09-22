import { cn } from '../../utils/cn.js';

export default function Badge({ children, color = 'brand', className }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', colors[color], className)}>
      {children}
    </span>
  );
}