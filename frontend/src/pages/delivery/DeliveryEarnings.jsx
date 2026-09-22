import { Wallet, TrendingUp, CreditCard } from 'lucide-react';
import StatCard from '../../components/ui/StatCard.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { formatPrice } from '../../utils/format.js';
import { Card } from '../../components/ui/Card.jsx';

export default function DeliveryEarnings() {
  const { data: partner } = useAsync(() => apiService.getDeliveryProfile(), []);

  const weekly = [
    { day: 'Mon', amount: 420 },
    { day: 'Tue', amount: 380 },
    { day: 'Wed', amount: 510 },
    { day: 'Thu', amount: 300 },
    { day: 'Fri', amount: 470 },
    { day: 'Sat', amount: 620 },
    { day: 'Sun', amount: partner?.earningsToday || 0 },
  ];

  const transactions = [
    { id: 'tx-1', desc: 'Delivery payout — order #1002', amount: 54, date: 'Today, 10:40 AM' },
    { id: 'tx-2', desc: 'Delivery payout — order #995', amount: 48, date: 'Today, 9:25 AM' },
    { id: 'tx-3', desc: 'Delivery payout — order #988', amount: 61, date: 'Yesterday' },
    { id: 'tx-4', desc: 'Delivery payout — order #981', amount: 39, date: 'Yesterday' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-sm text-slate-500 mt-1">Track your income as you ride.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-emerald-600 to-green-700 text-white lg:col-span-2">
          <p className="text-sm text-white/80 flex items-center gap-1.5"><Wallet size={15} /> Total Earnings</p>
          <p className="mt-2 text-3xl font-extrabold">{formatPrice(partner?.earningsTotal || 0)}</p>
          <p className="text-xs text-white/70 mt-1">+ {formatPrice(partner?.earningsToday || 0)} today</p>
        </div>
        <StatCard title="This Week" value={formatPrice(weekly.reduce((s, w) => s + w.amount, 0))} icon={TrendingUp} color="green" />
        <StatCard title="Payout Due" value={formatPrice(1240)} icon={CreditCard} color="amber" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">This Week</h2>
          <div className="flex items-end justify-between gap-2 h-36">
            {weekly.map((w) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-green-400 transition hover:from-emerald-600" style={{ height: `${(w.amount / 620) * 100}%` }} title={formatPrice(w.amount)} />
                <span className="text-[10px] text-slate-400">{w.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Recent Payouts</h2>
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="h-9 w-9 rounded-lg bg-success/10 text-success flex items-center justify-center"><TrendingUp size={16} /></span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.desc}</p>
                  <p className="text-xs text-slate-400">{t.date}</p>
                </div>
                <span className="text-sm font-bold text-success">+{formatPrice(t.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}