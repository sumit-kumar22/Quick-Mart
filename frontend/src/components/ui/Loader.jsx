import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function Loader({ size = 20, className, label }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-brand-600', className)}>
      <Loader2 size={size} className="animate-spin" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}

export function FullPageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 animate-pulse" />
          <Loader2 size={22} className="absolute inset-0 m-auto text-white animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}