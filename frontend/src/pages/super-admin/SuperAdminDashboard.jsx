import { Link } from 'react-router-dom';
import { Store, IndianRupee, Users, Package, TrendingUp, ArrowUpRight, ShieldCheck } from 'lucide-react';
import StatCard from '../../components/ui/StatCard.jsx';
import { Card } from '../../components/ui/Card.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { formatPrice } from '../../utils/format.js';

export default function SuperAdminDashboard() {
  const { data: stats } = useAsync(() => apiService.getSuperStats(), []);
  const { data: recentOrders } = useAsync(() => apiService.getRecentOrders(), []);
  const { data: stores } = useAsync(() => apiService.getStores(), []);
  const { data: admins } = useAsync(() => apiService.getAdmins(), []);

  const activeStores = (stores || []).filter((s) => s.active !== false).length;
  const revenue = stats?.grossRevenue || 0;
  const customers = stats?.customers || 0;
  const storeList = stores || [];
  const adminIds = (admins || []).filter((u) => u.role === 'ADMIN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-1">All stores, all orders, all in one place</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Stores" value={`${activeStores}/${storeList.length}`} icon={Store} change="1 awaiting setup" color="brand" />
        <StatCard title="GMV (This Month)" value={formatPrice(revenue)} icon={IndianRupee} change="+18.6% MoM" color="green" />
        <StatCard title="Registered Users" value={customers.toLocaleString()} icon={Users} change="+6.2% MoM" color="violet" />
        <StatCard title="Orders" value={stats?.orders || 0} icon={Package} change="+8.9%" color="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Latest Orders Across Stores</h2>
            <Link to="/super-admin/orders" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-130">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase">
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Store</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders || []).map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold">#{o.id.slice(-5)}</td>
                    <td className="py-3">{o.customer}</td>
                    <td className="py-3 text-xs text-slate-500">{o.storeName || '—'}</td>
                    <td className="py-3 font-medium">{formatPrice(o.amount)}</td>
                    <td className="py-3"><StatusBadge status={o.status} /></td>
                    <td className="py-3 text-slate-400">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Store size={16} className="text-brand-600" /> Store Health</h2>
          <div className="space-y-3">
            {storeList.map((s) => (
              <div key={s.id || s._id} className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white text-xs font-bold flex items-center justify-center">{(s.city || 'S')[0]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.active !== false ? 'Operating' : 'Closed'}</p>
                </div>
                <StatusBadge status={s.active !== false ? 'OPEN' : 'CLOSED'} />
              </div>
            ))}
          </div>
          <Link to="/super-admin/stores" className="btn-secondary btn-sm w-full justify-center mt-5">
            <ArrowUpRight size={14} /> Manage Stores
          </Link>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-success" /> Growth Snapshot</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { v: '+18.6%', l: 'GMV MoM' },
              { v: '+9.4%', l: 'Orders MoM' },
              { v: '+6.2%', l: 'Users MoM' },
            ].map((g) => (
              <div key={g.l} className="rounded-xl bg-success/5 border border-success/20 p-3">
                <p className="font-extrabold text-success">{g.v}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{g.l}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">Compounded across all stores — steady expansion since launch.</p>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><ShieldCheck size={16} className="text-amber-500" /> Admin Accounts</h2>
          <div className="space-y-3">
            {adminIds.slice(0, 5).map((a) => (
              <div key={a._id || a.id} className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white text-xs font-bold flex items-center justify-center">{a.name[0]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-slate-400 truncate">{a.email}</p>
                </div>
                <StatusBadge status={a.status === 'active' ? 'ACTIVE' : 'INACTIVE'} />
              </div>
            ))}
            {adminIds.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No admin accounts yet.</p>}
          </div>
          <Link to="/super-admin/admins" className="btn-secondary btn-sm w-full justify-center mt-5">Manage Admins</Link>
        </Card>
      </div>
    </div>
  );
}