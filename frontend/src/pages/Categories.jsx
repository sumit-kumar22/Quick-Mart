import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';

export default function Categories() {
  const { data: categories } = useAsync(() => apiService.getCategories(), []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Browse Categories</h1>
        <p className="mt-2 text-sm text-slate-500">Everything you need, organised simply.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {(categories || []).map((c) => {
          const Icon = Icons[c.icon] || Icons.ShoppingBasket;
          return (
            <Link
              key={c.id || c._id}
              to={`/category/${c.slug}`}
              className="card group relative overflow-hidden rounded-card transition hover:shadow-cardHover hover:-translate-y-0.5"
            >
              <div className={`h-28 bg-gradient-to-br ${c.color} overflow-hidden`}>
                {c.image ? (
                  <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-110 transition duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <span className="h-full w-full flex items-center justify-center">
                    <Icon size={40} className="text-slate-700" strokeWidth={1.6} />
                  </span>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5">
                <h2 className="font-semibold text-white group-hover:text-brand-100">{c.name}</h2>
                <p className="text-[11px] text-white/75">{c.productCount || 0} products</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}