import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { apiService } from '../../services/apiService.js';
import { formatDate } from '../../utils/format.js';

export default function SuperAdminAuditLogs() {
  const [filter, setFilter] = useState('ALL');
  const { data, loading, error, refetch } = useAsync(() => apiService.getAuditLogs(), []);

  const rows = (data || []).filter((l) => filter === 'ALL' || l.action === filter);
  const actions = [...new Set((data || []).map((l) => l.action))];

  const columns = [
    { key: 'admin', label: 'Admin', render: (r) => (
      <div className="flex items-center gap-2.5">
        <span className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white text-xs font-bold flex items-center justify-center">{r.admin[0]}</span>
        <div><p className="font-medium text-sm">{r.admin}</p><p className="text-[11px] text-slate-400">{r.ip}</p></div>
      </div>
    )},
    { key: 'action', label: 'Action', render: (r) => <StatusBadge status={r.action} /> },
    { key: 'detail', label: 'Detail', render: (r) => <span className="text-sm text-slate-600">{r.detail}</span> },
    { key: 'date', label: 'Date', render: (r) => <span className="text-xs text-slate-400">{formatDate(r.date, true)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Immutable trail of admin activity" />

      <div className="card mb-4 p-4 flex flex-wrap items-center gap-3 border-l-4 border-l-brand-600">
        <ScrollText size={18} className="text-brand-600" />
        <p className="text-sm text-slate-600 flex-1">Every privileged action is recorded for compliance. Logs cannot be edited or deleted.</p>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input cursor-pointer w-56">
          <option value="ALL">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={refetch} emptyTitle="No audit records match" emptyIcon={ScrollText} onRowClick={() => undefined} />
      </Card>
    </div>
  );
}