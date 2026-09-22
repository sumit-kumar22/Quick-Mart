import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { PageHeader } from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../utils/cn.js';

export default function AdminCategories() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { data: categories, loading, refetch } = useAsync(() => apiService.getCategories(), []);

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organize your catalog" action={
        <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> Add Category</button>
      } />

      {loading ? <p className="text-sm text-slate-400 py-6">Loading categories...</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {(categories || []).map((c) => {
            const Icon = Icons[c.icon] || Icons.ShoppingBasket;
            return (
              <div key={c.id || c._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className={cn('h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br overflow-hidden flex items-center justify-center text-slate-700', c.color)}>{c.image ? <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <Icon size={22} strokeWidth={1.8} />}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold capitalize">{c.name}</h3>
                    <p className="text-xs text-slate-400">{c.productCount || 0} products</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(c)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(c)} className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-red-50 cursor-pointer" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400">#{String(c.slug).toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryModal
        open={creating || !!editing}
        initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { setCreating(false); setEditing(null); refetch(); }}
      />

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        message={`Products attached to this category will become uncategorized.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await apiService.deleteCategory(deleting.id || deleting._id);
            toast.show('Category deleted');
            setDeleting(null);
            refetch();
          } catch (err) {
            toast.show(err.message, 'error');
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function CategoryModal({ open, initial, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: initial?.name || '', icon: initial?.icon || 'ShoppingBasket', color: initial?.color || 'from-green-100 to-lime-100' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, icon: form.icon, color: form.color };
      if (initial) await apiService.updateCategory(initial.id || initial._id, payload);
      else await apiService.createCategory(payload);
      toast.show(initial ? 'Category updated' : 'Category created');
      onSaved();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Category' : 'Add Category'} footer={
      <div className="flex w-full gap-2">
        <button onClick={onClose} className="btn-secondary btn-sm flex-1">Cancel</button>
        <button className="btn-primary btn-sm flex-1" form="cat-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    }>
      <form id="cat-form" className="space-y-4" onSubmit={save}>
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vegetables" required />
        </div>
        <div>
          <label className="label">Icon (lucide name)</label>
          <input className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Carrot" />
        </div>
      </form>
    </Modal>
  );
}