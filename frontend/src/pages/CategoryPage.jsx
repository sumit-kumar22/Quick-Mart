import { useParams, useSearchParams } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { SlidersHorizontal, X, ChevronDown, Star } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import ProductGrid from '../components/product/ProductGrid.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Modal from '../components/ui/Modal.jsx';
import { cn } from '../utils/cn.js';
import { formatPrice } from '../utils/format.js';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price — Low to High' },
  { value: 'price-desc', label: 'Price — High to Low' },
  { value: 'discount', label: 'Discount' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const initialQuery = params.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(params.get('sort') || 'relevance');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ brands: [], priceMax: null, maxDiscount: null, rating: null });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: allCategories } = useAsync(() => apiService.getCategories(), []);
  const category = (allCategories || []).find((c) => c.slug === slug);

  const products = useMemo(() => {
    if (!data?.data) return null;
    return data.data;
  }, [data]);

  // collect brands for this category
  const availableBrands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.brand))];
  }, [products]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService.getProducts({ category: slug, sort, page, limit: 20, filters })
      .then(setData)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [slug, sort, page, JSON.stringify(filters)]);

  const toggleBrand = (brand) => {
    setFilters((f) => ({
      ...f,
      brands: f.brands.includes(brand) ? f.brands.filter((b) => b !== brand) : [...f.brands, brand],
    }));
    setPage(1);
  };

  const applyFilters = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setFilterOpen(false);
  };

  const activeFilterCount = filters.brands.length + (filters.priceMax ? 1 : 0) + (filters.maxDiscount ? 1 : 0) + (filters.rating ? 1 : 0);

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-sm mb-2.5">Brand</h4>
        <div className="space-y-2">
          {availableBrands.map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={filters.brands.includes(b)} onChange={() => toggleBrand(b)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              {b}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2.5">Price</h4>
        <div className="space-y-2">
          {[50, 100, 200].flatMap((p) => [p]).map((pr) => (
            <label key={pr} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="price"
                checked={filters.priceMax === pr}
                onChange={() => applyFilters({ priceMax: filters.priceMax === pr ? null : pr })}
                className="border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Under {formatPrice(pr)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2.5">Discount</h4>
        <div className="space-y-2">
          {[10, 25, 30].map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="discount"
                checked={filters.maxDiscount === d}
                onChange={() => applyFilters({ maxDiscount: filters.maxDiscount === d ? null : d })}
                className="border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {d}% or more
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2.5">Rating</h4>
        <div className="space-y-2">
          {[4, 3].map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={filters.rating === r}
                onChange={() => applyFilters({ rating: filters.rating === r ? null : r })}
                className="border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="inline-flex items-center gap-1"><Star size={13} className="text-amber-400" fill="currentColor" /> {r}+</span>
            </label>
          ))}
        </div>
      </div>

      {(activeFilterCount > 0 || filters.priceMax) && (
        <button onClick={() => { setFilters({ brands: [], priceMax: null, maxDiscount: null, rating: null }); setPage(1); }} className="btn-ghost btn-sm w-full">
          <X size={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 mb-3" aria-label="Breadcrumb">
        <span>Home</span> <span className="mx-1">/</span> <span className="text-slate-600 font-medium">{category?.name || 'Category'}</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="card p-4 sticky top-20">
            <h3 className="font-bold mb-4 flex items-center gap-2"><SlidersHorizontal size={16} /> Filters</h3>
            {FilterPanel}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{category?.name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{data?.meta?.total || 0} products</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterOpen(true)} className="md:hidden btn-secondary btn-sm">
                <SlidersHorizontal size={14} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="input pr-9 w-44 cursor-pointer" aria-label="Sort products">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <ProductGrid products={products} loading={loading} error={error} onRetry={() => { setLoading(true); apiService.getProducts({ category: slug, sort, page, limit: 20, filters }).then(setData).catch(setError).finally(() => setLoading(false)); }} />

          <Pagination page={page} totalPages={Math.ceil((data?.meta?.total || 0) / 20)} onChange={setPage} />
        </div>
      </div>

      {/* Mobile filter modal */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        {FilterPanel}
      </Modal>
    </div>
  );
}