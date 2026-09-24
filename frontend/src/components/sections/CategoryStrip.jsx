import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import * as Icons from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { apiService } from '../../services/apiService.js';
import { Skeleton } from '../ui/Skeleton.jsx';

export default function CategoryStrip({ limit = 12 }) {
  const { data, loading } = useAsync(() => apiService.getCategories(), []);
  const cats = useMemo(() => (Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])), [data]);

  if (loading) return <Skeleton className="h-24 w-full rounded-card" />;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">Shop by Category</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {cats.slice(0, limit).map((c) => {
          const Icon = Icons[c.icon] || Icons.ShoppingBasket;
          return (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className="group flex flex-col items-center gap-2 shrink-0 w-20"
            >
              <span className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${c.color} overflow-hidden flex items-center justify-center shadow-sm transition group-hover:scale-105 group-hover:shadow-cardHover`}>
                {c.image ? (
                  <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-110 transition duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <Icon size={26} className="text-slate-700" strokeWidth={1.8} />
                )}
              </span>
              <span className="text-[11px] font-medium text-slate-600 text-center leading-tight group-hover:text-brand-700">
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}