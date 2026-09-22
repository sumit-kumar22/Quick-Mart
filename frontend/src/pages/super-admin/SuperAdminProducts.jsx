import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { formatPrice } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';
import ProductImage from '../../components/product/ProductImage.jsx';

export default function SuperAdminProducts() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('ALL');
  const { data: products, loading, refetch } = useAsync(() => apiService.getAdminProducts({ limit: 500 }), []);
  const { data: categories } = useAsync(() => apiService.getCategories(), []);

  const rows = useMemo(() => {
    let list = products || [];
    if (cat !== 'ALL') list = list.filter((p) => p.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [search, cat, products]);

  const columns = [
    { key: 'p', label: 'Product', render: (r) => (
      <span className="flex items-center gap-2.5"><ProductImage product={{ emoji: r.emoji, color: r.color, image: r.image || '' }} className="h-9 w-9 shrink-0" size={14} /><span className="font-medium">{r.name}</span></span>
    )},
    { key: 'cat', label: 'Category', render: (r) => <span className="text-xs capitalize">{(categories || []).find((c) => c.slug === r.category)?.name || '—'}</span> },
    { key: 'price', label: 'Price', render: (r) => (
      <div><span className="font-semibold">{formatPrice(r.price ?? r.sellingPrice)}</span><span className="text-xs text-slate-400 line-through ml-1.5">{formatPrice(r.mrp)}</span></div>
    )},
    { key: 'stock', label: 'Active Stores', render: (r) => <span className="text-xs font-semibold text-slate-500">{r.storeStock && typeof r.storeStock === 'object' ? Object.keys(r.storeStock).length : (r.storeStock?.length || 1)} stores</span> },
  ];

  return (
    <div>
      <PageHeader title="Products" subtitle={`${products?.length || 0} products across all stores`} />
      <div className="card mb-4 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input cursor-pointer capitalize">
          <option value="ALL">All categories</option>
          {(categories || []).map((c) => <option key={c.id || c._id} value={c.slug} className="capitalize">{c.name}</option>)}
        </select>
      </div>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={rows} loading={loading} onRetry={refetch} emptyTitle="No products found" onRowClick={() => undefined} />
      </Card>
    </div>
  );
}