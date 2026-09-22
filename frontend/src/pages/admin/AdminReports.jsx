import { useState } from 'react';
import { PageHeader, Card } from '../../components/ui/Card.jsx';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAsync } from '../../hooks/useAsync.js';
import { apiService } from '../../services/apiService.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { cn } from '../../utils/cn.js';

const PIE_COLORS = ['#4f46e5', '#16a34a', '#f59e0b', '#06b6d4', '#ef4444'];

export default function AdminReports() {
  const [month, setMonth] = useState('0');
  const { data, loading, error } = useAsync(() => apiService.getAdminReports(), []);

  if (loading) return <div className="space-y-5"><Skeleton className="h-40 rounded-card" /><Skeleton className="h-80 rounded-card" /></div>;
  if (error) return <Card className="p-8 text-center text-danger">{error.message}</Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Sales, category & payment analytics</p>
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="input cursor-pointer w-40">
          <option value="0">This month</option>
          <option value="1">Last month</option>
          <option value="3">Last 3 months</option>
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Gross Revenue</h2>
          <p className="text-3xl font-extrabold">{data.grossRevenue}</p>
          <p className="text-xs text-success mt-1">+{data.revenueGrowth}% vs previous period</p>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Orders</h2>
          <p className="text-3xl font-extrabold">{data.totalOrders}</p>
          <p className="text-xs text-success mt-1">+{data.orderGrowth}% vs previous period</p>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Avg Order Value</h2>
          <p className="text-3xl font-extrabold">{data.avgOrderValue}</p>
          <p className="text-xs text-slate-400 mt-1">across {data.storeCount} stores</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.revenueTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.categorySales} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v / 1000}k`} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.paymentMethods} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {data.paymentMethods.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {data.paymentMethods.map((m, i) => (
              <div key={m.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-slate-500 flex-1 capitalize">{m.name.replace('_', ' ')}</span>
                <span className="font-semibold">{m.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {(data.topProducts || []).map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className={cn('h-8 w-8 rounded-lg text-sm font-bold flex items-center justify-center', i === 0 ? 'bg-warning/20 text-warning' : 'bg-slate-100 text-slate-500')}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.units} units sold</p>
                </div>
                <span className="text-sm font-semibold">{p.revenue}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Store Performance</h2>
          <div className="divide-y divide-slate-100">
            {(data.storePerformance || []).map((s) => (
              <div key={s.name} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="font-semibold">{s.revenue}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-violet-500" style={{ width: `${s.share}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{s.orders} orders · {s.share}% of revenue</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}