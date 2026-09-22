import { useState, useMemo } from 'react';
import { Search, Ban } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';

export default function SuperAdminUsers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { data: users, loading, refetch } = useAsync(() => apiService.getSuperAdminUsers({ limit: 500 }), []);

  const rows = useMemo(() => {
    let all = users || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q));
    }
    return all;
  }, [users, search]);

  const isSuspended = (r) => r.status === 'suspended' || r.status === 'blocked' || r.blocked;

  const columns = [
    { key: 'user', label: 'User', render: (r) => (
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">{r.name[0]}</span>
        <div><p className="font-medium">{r.name}{r.role === 'ADMIN' && <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-1.5 py-0.5 rounded ml-1">ADMIN</span>}</p><p className="text-xs text-slate-400">{r.email}</p></div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (r) => <span className="text-xs font-semibold">{r.role === 'ADMIN' ? 'Store Admin' : 'Customer'}</span> },
    { key: 'joined', label: 'Joined', render: (r) => <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span> },
    { key: 'status', label: 'Status', render: (r) => isSuspended(r) ? <StatusBadge status="SUSPENDED" /> : <StatusBadge status="ACTIVE_USER" /> },
    { key: 'actions', label: '', render: (r) => (
      <button onClick={async () => {
        const next = !isSuspended(r);
        try {
          await apiService.updateUserStatus(r.id || r._id, next ? 'suspended' : 'active');
          toast.show(next ? `${r.name} suspended` : `${r.name} reinstated`);
          refetch();
        } catch (err) {
          toast.show(err.message, 'error');
        }
      }} className="btn-secondary btn-sm"><Ban size={14} /> {isSuspended(r) ? 'Reinstate' : 'Suspend'}</button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="Every customer and admin across the platform" />
      <div className="card mb-4 p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={rows} loading={loading} onRetry={refetch} emptyTitle="No users found" emptyIcon={Search} onRowClick={() => undefined} />
      </Card>
    </div>
  );
}