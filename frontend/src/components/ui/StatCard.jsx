import { cn } from '../../utils/cn.js';

export default function StatCard({ title, value, icon: Icon, change, trend = 'up', color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="card p-5 flex items-start justify-between hover:shadow-cardHover transition-shadow">
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
        {change != null && (
          <p className={cn('mt-1.5 text-xs font-semibold', trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-slate-500')}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'} {change}
          </p>
        )}
      </div>
      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', colors[color])}>
        <Icon size={20} />
      </div>
    </div>
  );
}