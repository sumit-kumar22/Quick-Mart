import { useState, useMemo } from 'react';
import { Search, TrendingDown } from 'lucide-react';
import DataTable from '../../components/ui/DataTable.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { Card, PageHeader } from '../../components/ui/Card.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { cn } from '../../utils/cn.js';
import ProductImage from '../../components/product/ProductImage.jsx';
import { useToast } from '../../context/ToastContext.jsx';

function splitStoreStock(storeStock) {
  if (Array.isArray(storeStock)) return storeStock;
  return Object.entries(storeStock || {}).map(([storeId, stock]) => ({ storeId, stock }));
}

export default function AdminInventory() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('ALL');
  const { data, loading, refetch } = useAsync(() => apiService.getAdminInventory(), []);

  const rows = useMemo(() => {
    let list = (data || []).map((p) => {
      const perStore = splitStoreStock(p.storeStock);
      const total = perStore.reduce((a, e) => a + Number(e.stock || 0), 0);
      return { ...p, perStore, total };
    });
    if (storeFilter !== 'ALL') {
      list = list.filter((p) => p.perStore.some((s) => s.storeId === storeFilter && s.stock > 0));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [data, search, storeFilter]);

  const stores = useMemo(() => {
    const first = (data || [])[0];
    return first?.stores || {};
  }, [data]);

  const low = rows.filter((p) => p.total < 10);
  const out = rows.filter((p) => p.total === 0);

  const columns = [
    { key: 'product', label: 'Product', render: (r) => (
      <span className="flex items-center gap-2.5"><ProductImage product={{ emoji: r.emoji, color: r.color, image: r.image || '' }} className="h-9 w-9 shrink-0" size={14} /><span className="font-medium">{r.name}</span></span>
    )},
    { key: 'weight', label: 'Pack', render: (r) => <span className="text-xs text-slate-500">{r.weight}</span> },
    { key: 'stock', label: 'Total Stock', render: (r) => <span className={cn('font-bold', r.total === 0 ? 'text-danger' : r.total < 10 ? 'text-warning' : 'text-success')}>{r.total}</span> },
    { key: 'perstore', label: 'Per Store', render: (r) => (
      <div className="flex flex-wrap gap-1 max-w-60">
        {r.perStore.map((s) => (
          <span key={s.storeId} className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold', s.stock === 0 ? 'bg-red-50 text-danger' : s.stock < 5 ? 'bg-amber-50 text-warning' : 'bg-success/10 text-success')}>
            {stores[s.storeId]?.city || s.storeId}: {s.stock}
          </span>
        ))}
      </div>
    )},
    { key: 'status', label: 'Status', render: (r) => {
      if (r.total === 0) return <StatusBadge status="OUT_OF_STOCK" />;
      if (r.total < 10) return <StatusBadge status="LOW_STOCK" />;
      return <StatusBadge status="IN_STOCK" />;
    }},
    { key: 'restock', label: '', render: (r) => (
      <button
        onClick={async () => {
          try {
            await apiService.updateInventory(r.id, { stock: 50, storeStock: {} });
            toast.show(`Restocked ${r.name}`);
            refetch();
          } catch (err) {
            toast.show(err.message, 'error');
          }
        }}
        disabled={r.total > 0}
        className={cn('btn-secondary btn-sm', r.total === 0 && '!border-success !text-success')}
      >
        {r.total === 0 ? 'Restock Now' : 'Set Alert'}
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock levels across all stores" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total SKUs', value: rows.length, tone: '' },
          { label: 'In Stock', value: rows.filter((r) => r.total >= 10).length, tone: 'text-success' },
          { label: 'Low Stock', value: low.length, tone: 'text-warning' },
          { label: 'Out of Stock', value: out.length, tone: 'text-danger' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={cn('text-2xl font-extrabold mt-1', s.tone)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {out.length > 0 && (
        <div className="mb-4 card p-4 flex items-center gap-3 border-l-4 border-l-danger">
          <TrendingDown size={20} className="text-danger shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Products running out</p>
            <p className="text-xs text-slate-500">{out.map((o) => o.name).slice(0, 4).join(', ')}{out.length > 4 ? ` +${out.length - 4} more` : ''}</p>
          </div>
          <button onClick={() => toast.show('Auto-restock scheduled (demo)')} className="btn-primary btn-sm">Auto-restock</button>
        </div>
      )}

      <div className="card mb-4 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="input cursor-pointer">
          <option value="ALL">All stores</option>
          {Object.values(stores).map((s) => <option key={s._id} value={s._id}>{s.name} — {s.city}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No inventory matches" emptyIcon={TrendingDown} onRowClick={() => undefined} />
      </div>
    </div>
  );
}