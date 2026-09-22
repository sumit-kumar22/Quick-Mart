import { cn } from '../../utils/cn.js';
import { DELIVERY_TIMELINE, ORDER_STATUS } from '../../utils/constants.js';
import { Check, Loader2 } from 'lucide-react';

export default function OrderTimeline({ status, className }) {
  const idx = DELIVERY_TIMELINE.indexOf(status);
  const current = idx >= 0 ? idx : DELIVERY_TIMELINE.length;

  return (
    <ol className={cn('space-y-0', className)}>
      {DELIVERY_TIMELINE.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const meta = ORDER_STATUS[s] || { label: s };
        return (
          <li key={s} className="relative flex gap-3 pb-6 last:pb-0">
            {i < DELIVERY_TIMELINE.length - 1 && (
              <span className={cn('absolute left-[11px] top-6 h-full w-0.5', i < current ? 'bg-success' : 'bg-slate-200')} aria-hidden="true" />
            )}
            <span
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center shrink-0 ring-4',
                done ? 'bg-success text-white ring-success/15'
                : active ? 'bg-brand-600 text-white ring-brand-500/20'
                : 'bg-slate-100 text-slate-400 ring-slate-100'
              )}
            >
              {done ? <Check size={13} /> : active ? <Loader2 size={13} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <div className="flex-1 pt-0.5">
              <p className={cn('text-sm font-medium', active ? 'text-brand-700' : done ? 'text-slate-700' : 'text-slate-400')}>{meta.label}</p>
              {active && <p className="text-xs text-slate-400 mt-0.5">In progress</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}