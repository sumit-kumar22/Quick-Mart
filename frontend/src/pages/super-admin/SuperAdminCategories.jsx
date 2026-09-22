import { PageHeader, Card } from '../../components/ui/Card.jsx';
import * as Icons from 'lucide-react';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { cn } from '../../utils/cn.js';

export default function SuperAdminCategories() {
  const { data: categories } = useAsync(() => apiService.getCategories(), []);

  return (
    <div>
      <PageHeader title="Categories" subtitle="Global catalog structure" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(categories || []).map((c) => {
          const Icon = Icons[c.icon] || Icons.ShoppingBasket;
          return (
            <Card key={c.id || c._id} className="p-4">
              <div className="flex items-start gap-3">
                <span className={cn('h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br overflow-hidden flex items-center justify-center text-slate-700', c.color)}>{c.image ? <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <Icon size={22} strokeWidth={1.8} />}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold capitalize">{c.name}</h3>
                  <p className="text-xs text-slate-400">{c.productCount || 0} products live</p>
                </div>
                <span className={cn('text-[10px] px-2 py-1 rounded-md font-bold capitalize bg-slate-100 text-slate-500')}>{String(c.slug).replace('-', ' ')}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}