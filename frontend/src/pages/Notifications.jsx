import { Link } from 'react-router-dom';
import { Bell, Package, Tag, Wallet } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils/format.js';
import { cn } from '../utils/cn.js';

const TYPE_ICONS = { order: Package, offer: Tag, wallet: Wallet, default: Bell };

export default function Notifications() {
  const { user } = useAuth();
  const { data, refetch } = useAsync(() => apiService.getNotifications(), [user?.id]);
  const list = (data || []).slice().sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

  const markAllRead = async () => {
    try {
      await apiService.markNotificationsRead();
      refetch();
    } catch {
      /* noop */
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">{list.filter((n) => !n.read).length} unread</p>
        </div>
        <button onClick={markAllRead} className="btn-secondary btn-sm">Mark all read</button>
      </div>

      <div className="space-y-2">
        {list.map((n) => {
          const Icon = TYPE_ICONS[n.type] || TYPE_ICONS.default;
          return (
            <Link key={n.id || n._id} to={n.link || '/'} className={cn('card flex gap-4 p-4 hover:shadow-cardHover transition', !n.read && 'ring-1 ring-brand-200')}>
              <span className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', n.read ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white')}>
                <Icon size={19} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <span className="text-[11px] text-slate-400 shrink-0">{formatDate(n.date || n.createdAt, true)}</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
              </div>
              {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600 mt-2 shrink-0" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}