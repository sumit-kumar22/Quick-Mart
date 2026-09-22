import { cn } from '../../utils/cn.js';
import { ORDER_STATUS } from '../../utils/constants.js';

const COLOR_MAP = {
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  stone: 'bg-stone-100 text-stone-600 border-stone-200',
};

export default function StatusBadge({ status, className }) {
  const meta = ORDER_STATUS[status] || { label: status || 'Unknown', color: 'slate' };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', COLOR_MAP[meta.color] || COLOR_MAP.slate, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
      {meta.label}
    </span>
  );
}