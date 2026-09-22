import { useState, useMemo } from 'react';
import { Search, Shield, Ban, UserCheck } from 'lucide-react';
import DataTable from '../../components/ui/DataTable.jsx';
import { PageHeader } from '../../components/ui/Card.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

export default function AdminUsers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { data: users, loading, refetch } = useAsync(() => apiService.getAllUsers(), []);

  const rows = useMemo(() => {
    let list = (users || []).filter((u) => u.role === 'CUSTOMER');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q));
    }
    return list;
  }, [users, search]);

  const isBlocked = (r) => r.blocked || r.status === 'blocked' || r.status === 'suspended';

  const columns = [
    { key: 'user', label: 'Customer', render: (r) => (
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
          {r.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
        </span>
        <div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.email}</p></div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (r) => <span className="text-sm">{r.phone}</span> },
    { key: 'joined', label: 'Joined', render: (r) => <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={isBlocked(r) ? 'BLOCKED' : 'ACTIVE_USER'} /> },
    { key: 'actions', label: '', render: (r) => (
      <button
        onClick={async () => {
          const next = !isBlocked(r);
          try {
            await apiService.updateUserStatus(r.id, next ? 'blocked' : 'active');
            toast.show(next ? `${r.name} blocked` : `${r.name} unblocked`);
            refetch();
          } catch (err) {
            toast.show(err.message, 'error');
          }
        }}
        className={cn('btn-secondary btn-sm', isBlocked(r) && '!border-success')}
        aria-label={isBlocked(r) ? 'Unblock' : 'Block'}
      >
        {isBlocked(r) ? <><UserCheck size={14} /> Unblock</> : <><Ban size={14} /> Block</>}
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${rows.length} registered customers`} />
      <div className="card mb-4 p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card overflow-hidden">
        <DataTable columns={columns} rows={rows} loading={loading} onRetry={refetch} emptyTitle="No customers found" emptyIcon={Shield} onRowClick={() => undefined} />
      </div>
    </div>
  );
}