import { PageHeader, Card } from '../../components/ui/Card.jsx';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';

export default function SuperAdminReports() {
  const { data } = useAsync(() => apiService.getAdminReports(), []);

  const revenueTrend = data?.revenueTrend || [];
  const storeRevenue = (data?.storePerformance || []).map((s) => ({ name: s.name, revenue: s.revenue }));
  const channel = (data?.paymentMethods || []).map((p) => ({ name: p.name, revenue: p.value * 100000 }));

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Reports" subtitle="Consolidated business intelligence" />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Platform Revenue (All Stores)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${Math.round(v / 100000)}L`} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Revenue by Store</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={storeRevenue} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v / 100000}L`} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Revenue by Payment Channel</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channel} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip />
              <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Key Platform Metrics</h2>
          <div className="divide-y divide-slate-100">
            {[
              { k: 'Avg order value', v: `₹${(data?.avgOrderValue || 0).toLocaleString()}` },
              { k: 'Total orders', v: String(data?.ordersCount || 0) },
              { k: 'Gross revenue', v: `₹${(data?.totalRevenue || 0).toLocaleString()}` },
              { k: 'Active delivery partners', v: '42' },
              { k: 'Monthly active users', v: '12,480' },
              { k: 'On-time delivery rate', v: '94%' },
            ].map((m) => (
              <div key={m.k} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-sm">
                <span className="text-slate-500">{m.k}</span>
                <span className="font-bold">{m.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}