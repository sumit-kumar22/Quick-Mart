import { Link } from 'react-router-dom';
import { Package, CheckCircle2, Wallet, Star, ChevronRight, Navigation } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import StatCard from '../../components/ui/StatCard.jsx';
import { formatPrice } from '../../utils/format.js';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { data: partner } = useAsync(() => apiService.getDeliveryProfile(), []);
  const { data: activeOrder } = useAsync(
    () => (partner?.currentOrder ? apiService.getOrder(partner.currentOrder) : Promise.resolve(null)),
    [partner?.currentOrder]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Here's your delivery summary for today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Deliveries Today" value={partner?.deliveriesToday || 0} icon={CheckCircle2} color="green" />
        <StatCard title="Total Deliveries" value={partner?.deliveriesTotal || 0} icon={Package} color="brand" />
        <StatCard title="Earnings Today" value={formatPrice(partner?.earningsToday || 0)} icon={Wallet} color="amber" />
        <StatCard title="Rating" value={`★ ${partner?.rating || '—'}`} icon={Star} color="violet" />
      </div>

      {activeOrder ? (
        <div className="card p-5 border-l-4 border-l-emerald-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Active Delivery</p>
              <h2 className="text-lg font-bold mt-1">#{activeOrder.id}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{activeOrder.items.length} items · {formatPrice(activeOrder.total)} · {activeOrder.paymentMethod}</p>
              <p className="text-sm text-slate-500">Pickup: {activeOrder.storeName}</p>
            </div>
            <Link to={`/delivery/orders/${activeOrder.id}`} className="btn-success">
              <Navigation size={16} /> Continue Delivery
            </Link>
          </div>
        </div>
      ) : (
        <div className="card p-5 border-l-4 border-l-amber-500 flex items-center gap-3">
          <span className="text-2xl">🛌</span>
          <div>
            <p className="font-semibold">No active delivery</p>
            <p className="text-sm text-slate-500">You'll be assigned an order automatically when you're online.</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-bold mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/delivery/orders" className="card p-4 flex items-center gap-3 hover:shadow-cardHover transition group">
            <span className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition"><Package size={20} /></span>
            <div className="flex-1"><p className="font-semibold text-sm">My Orders</p><p className="text-xs text-slate-400">View all assigned deliveries</p></div>
            <ChevronRight size={17} className="text-slate-300" />
          </Link>
          <Link to="/delivery/earnings" className="card p-4 flex items-center gap-3 hover:shadow-cardHover transition group">
            <span className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition"><Wallet size={20} /></span>
            <div className="flex-1"><p className="font-semibold text-sm">Earnings</p><p className="text-xs text-slate-400">Track your income</p></div>
            <ChevronRight size={17} className="text-slate-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}