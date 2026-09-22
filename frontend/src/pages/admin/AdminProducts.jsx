import { useState, useMemo } from 'react';
import { Search, Plus, Pencil, SearchX } from 'lucide-react';
import DataTable from '../../components/ui/DataTable.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageHeader } from '../../components/ui/Card.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPrice } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';
import ProductImage from '../../components/product/ProductImage.jsx';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { data: products, loading, refetch } = useAsync(() => apiService.getAdminProducts({ limit: 500 }), []);
  const { data: categories } = useAsync(() => apiService.getCategories(), []);

  const rows = useMemo(() => {
    let list = products || [];
    if (categoryFilter !== 'ALL') list = list.filter((p) => p.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
    }
    return list;
  }, [search, categoryFilter, products]);

  const columns = [
    { key: 'product', label: 'Product', render: (r) => (
      <div className="flex items-center gap-3">
        <ProductImage product={{ emoji: r.emoji, color: r.color, image: r.image || '' }} className="h-10 w-10 shrink-0" size={16} />
        <div className="min-w-0"><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.brand} · {r.weight}</p></div>
      </div>
    )},
    { key: 'category', label: 'Category', render: (r) => <span className="text-xs capitalize">{(categories || []).find((c) => c.slug === r.category)?.name || '—'}</span> },
    { key: 'price', label: 'Price', render: (r) => (
      <div><span className="font-semibold">{formatPrice(r.price)}</span><span className="text-xs text-slate-400 line-through ml-1.5">{formatPrice(r.mrp)}</span></div>
    )},
    { key: 'stock', label: 'Stock', render: (r) => {
      const s = Array.isArray(r.storeStock) ? r.storeStock[0]?.stock : r.stock;
      return <span className={cn('text-xs font-bold px-2 py-1 rounded-md', s === 0 ? 'bg-red-50 text-danger' : s < 10 ? 'bg-amber-50 text-warning' : 'bg-success/10 text-success')}>{s ?? r.stock ?? 0}</span>;
    }},
    { key: 'status', label: 'Status', render: (r) => <span className={cn('text-xs font-bold px-2 py-1 rounded-md', r.active === false ? 'bg-slate-100 text-slate-500' : 'bg-success/10 text-success')}>{r.active === false ? 'Inactive' : 'Active'}</span> },
    { key: 'actions', label: '', render: (r) => (
      <button onClick={() => { setEditing(r); setShowForm(true); }} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer" aria-label="Edit"><Pencil size={16} /></button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Products" subtitle={loading ? 'Loading products...' : `${(products || []).length} products in catalog`} action={
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      } />

      <div className="card mb-4 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input cursor-pointer">
          <option value="ALL">All categories</option>
          {(categories || []).map((c) => <option key={c.id} value={c.slug} className="capitalize">{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} rows={rows} loading={loading} emptyTitle="No products found" emptyIcon={SearchX} onRowClick={() => undefined} />
      </div>

      <ProductForm open={showForm} onClose={() => setShowForm(false)} initial={editing} categories={categories || []} onSaved={refetch} />
    </div>
  );
}

const EMPTY = { name: '', brand: '', price: 0, mrp: 0, weight: '1 kg', emoji: '🛒', category: '', stock: 0 };

function ProductForm({ open, onClose, initial, categories, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => initial ? { ...initial } : { ...EMPTY, category: categories[0]?.slug || '' });
  const [saving, setSaving] = useState(false);
  const reset = () => setForm(initial ? { ...initial } : { ...EMPTY, category: categories[0]?.slug || '' });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.id;
      delete payload.sku;
      delete payload.variants;
      if (initial) {
        await apiService.updateProduct(initial.id, payload);
        toast.show('Product updated');
      } else {
        await apiService.createProduct(payload);
        toast.show('Product created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={initial ? 'Edit Product' : 'Add Product'} footer={
      <div className="flex w-full gap-2">
        <button onClick={() => { reset(); onClose(); }} className="btn-secondary btn-sm flex-1">Cancel</button>
        <button form="product-form" type="submit" className="btn-primary btn-sm flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
      </div>
    }>
      <form id="product-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Product Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Brand</label>
            <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>
          <div>
            <label className="label">Weight / Pack</label>
            <input className="input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div>
            <label className="label">Price (₹)</label>
            <input type="number" min="0" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} required />
          </div>
          <div>
            <label className="label">MRP (₹)</label>
            <input type="number" min="0" className="input" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: +e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input cursor-pointer capitalize" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c.id || c._id} value={c.slug} className="capitalize">{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Emoji</label>
            <input className="input" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
          </div>
          <div>
            <label className="label">Stock</label>
            <input type="number" min="0" className="input" value={form.stock ?? 0} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
          </div>
        </div>
      </form>
    </Modal>
  );
}