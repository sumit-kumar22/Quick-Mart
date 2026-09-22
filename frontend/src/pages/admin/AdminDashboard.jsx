import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, IndianRupee, Users, Clock, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAsync } from '../../hooks/useAsync.js';
import { apiService } from '../../services/apiService.js';
import StatCard from '../../components/ui/StatCard.jsx';
import { Card } from '../../components/ui/Card.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { RowSkeleton, Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatPrice } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';
import ProductImage from '../../components/product/ProductImage.jsx';

const PIE_COLORS = ['#16a34a', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [range, setRange] = useState('7d');
  const { data, loading, error, refetch } = useAsync(() => apiService.getAdminDashboard(), []);
  const { data: recent, loading: recentLoading } = useAsync(() => apiService.getRecentOrders(), []);
  const { data: inventory } = useAsync(() => apiService.getAdminInventory(), []);

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-danger font-medium">{error.message}</p>
        <button onClick={refetch} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  const lowStock = (inventory || []).filter((p) => (p.stock || 0) < 15).sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Store performance & daily summary</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 text-sm font-medium">
          {['7d', '30d'].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={cn('px-3 py-1.5 rounded-lg cursor-pointer transition', range === r ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700')}>
              Last {r === '7d' ? '7 days' : '30 days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={loading ? '—' : data?.today?.orders ?? '—'} icon={ShoppingCart} change="+8.2% vs yesterday" color="brand" />
        <StatCard title="Revenue" value={loading ? '—' : formatPrice(data?.today?.revenue ?? 0)} icon={IndianRupee} change="+12.4%" color="green" />
        <StatCard title="Active Users" value={loading ? '—' : data?.today?.activeUsers ?? '—'} icon={Users} change="+4.1%" color="violet" />
        <StatCard title="Pending Orders" value={loading ? '—' : data?.today?.pendingOrders ?? '—'} icon={Clock} change="3 overdue" color="amber" />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          <Skeleton className="h-72 md:col-span-2 rounded-card" />
          <Skeleton className="h-72 rounded-card" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          <Card className="p-5 md:col-span-2">
            <h2 className="font-semibold mb-1">Sales Overview</h2>
            <p className="text-xs text-slate-400 mb-4">Orders & revenue over time</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.salesChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-4">Order Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.orderStatusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {data.orderStatusDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {data.orderStatusDistribution.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-500 flex-1">{s.name}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {recentLoading ? <RowSkeleton rows={3} /> : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-130">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase">
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(recent || []).map((o) => (
                    <tr key={o.id} className="border-t border-slate-100">
                      <td className="py-3 font-semibold">#{o.id.slice(-5)}</td>
                      <td className="py-3">{o.customer}</td>
                      <td className="py-3 font-medium">{formatPrice(o.amount)}</td>
                      <td className="py-3"><StatusBadge status={o.status} /></td>
                      <td className="py-3 text-slate-400">{o.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Low stock */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-warning" /> Low Stock Alerts</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto thin-scroll">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <ProductImage product={{ emoji: p.emoji, color: p.color, image: p.image || '' }} className="h-10 w-10 shrink-0" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.weight}</p>
                </div>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md', p.stock === 0 ? 'bg-red-50 text-danger' : 'bg-amber-50 text-warning')}>
                  {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">All stock levels are healthy.</p>}
          </div>
          <Link to="/admin/inventory" className="btn-secondary btn-sm w-full justify-center mt-4">Manage Inventory</Link>
        </Card>
      </div>
    </div>
  );
}