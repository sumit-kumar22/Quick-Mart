import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ChevronDown, X, Clock, TrendingUp, SearchX } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import ProductGrid from '../components/product/ProductGrid.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useAsync } from '../hooks/useAsync.js';

const POPULAR = ['milk', 'bread', 'egg', 'potato', 'colgate', 'soap'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price — Low to High' },
  { value: 'price-desc', label: 'Price — High to Low' },
  { value: 'discount', label: 'Discount' },
];

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem('quickmart_recent_searches') || '[]');
  } catch { return []; }
}

export default function Search() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initial = params.get('q') || '';
  const [input, setInput] = useState(initial);
  const [query, setQuery] = useState(initial);
  const debounced = useDebounce(input, 400);
  const [sort, setSort] = useState(params.get('sort') || 'relevance');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [recent, setRecent] = useState(getRecent());

  useEffect(() => {
    if (debounced.trim()) {
      const t = setTimeout(() => {
        setQuery(debounced.trim());
        setInput(debounced.trim());
      }, 300);
      return () => clearTimeout(t);
    }
    setQuery(initial);
  }, [debounced, initial]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService.getProducts({ search: query, sort, page, limit: 20 })
      .then((res) => {
        setData(res);
        if (query) {
          const list = getRecent();
          const next = [query, ...list.filter((r) => r.toLowerCase() !== query.toLowerCase())].slice(0, 6);
          localStorage.setItem('quickmart_recent_searches', JSON.stringify(next));
          setRecent(next);
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [query, sort, page]);

  const { data: recommendations } = useAsync(() => apiService.getProducts({ bestseller: true, limit: 8 }), []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-6">
      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (input.trim()) { setQuery(input.trim()); navigate(`/search?q=${encodeURIComponent(input.trim())}`); } }}
        className="card flex items-center gap-2 px-4 py-2.5 sticky top-20 z-30"
      >
        <SearchIcon size={19} className="text-brand-600 shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for milk, bread, eggs..."
          className="flex-1 bg-transparent outline-none text-sm py-1"
          aria-label="Search products"
        />
        {input && (
          <button type="button" onClick={() => { setInput(''); setQuery(''); setData(null); }} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Clear search">
            <X size={16} />
          </button>
        )}
        <button type="submit" className="btn-primary btn-sm">Search</button>
      </form>

      {/* Suggestions / popular when no query */}
      {!query && !loading && (
        <div className="space-y-6">
          {recent.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2.5"><Clock size={15} /> Recent searches</h2>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => { setInput(r); setQuery(r); }} className="chip border-slate-200 hover:border-brand-400 hover:text-brand-700 bg-white text-slate-600">{r}</button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2.5"><TrendingUp size={15} /> Popular searches</h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((r) => (
                <button key={r} onClick={() => { setInput(r); setQuery(r); }} className="chip border-slate-200 hover:border-brand-400 hover:text-brand-700 bg-white text-slate-600">🔥 {r}</button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-3">Popular right now</h2>
            <ProductGrid products={recommendations} loading={false} />
          </section>
        </div>
      )}

      {/* Results */}
      {query && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {data?.meta?.total || 0} result{data?.meta?.total === 1 ? '' : 's'} for <span className="font-semibold text-slate-800">"{query}"</span>
            </p>
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="input pr-9 w-44 cursor-pointer" aria-label="Sort">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <ProductGrid products={data?.data} loading={loading} error={error} onRetry={() => setPage((p) => p + 1)} emptyTitle={`No results for "${query}"`} emptyDescription="Try checking the spelling, or search for something more general." />
          {!loading && data?.meta?.total === 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold mb-3">You might like these</h2>
              <ProductGrid products={recommendations} loading={false} />
            </section>
          )}
          <Pagination page={page} totalPages={Math.ceil((data?.meta?.total || 0) / 20)} onChange={setPage} />
        </>
      )}
    </div>
  );
}