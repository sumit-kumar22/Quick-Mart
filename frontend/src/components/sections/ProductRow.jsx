import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../product/ProductCard.jsx';
import { ProductGridSkeleton } from '../ui/Skeleton.jsx';
import { cn } from '../../utils/cn.js';

export default function ProductRow({ title, subtitle, products, loading, viewAllLink, className }) {
  return (
    <section className={className}>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2 transition-all">
            View all <ArrowRight size={15} />
          </Link>
        )}
      </div>
      {loading ? (
        <ProductGridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {(Array.isArray(products) ? products : (Array.isArray(products?.data) ? products.data : [])).slice(0, 10).map((p, i) => (
            <div key={p?.id || i}> 
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}