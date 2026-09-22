import { useState } from 'react';
import { Copy, Ticket, Check } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Coupons() {
  const toast = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(null);
  const { data: coupons } = useAsync(() => apiService.getCoupons(), []);
  const { data: offers } = useAsync(() => apiService.getOffers(), []);

  const copy = (code) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(code);
      toast.show(`Coupon ${code} copied`);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => toast.show(`Use code ${code} at checkout`, 'info'));
  };

  const list = coupons || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Coupons & Offers</h1>
      <p className="text-sm text-slate-500 mb-6">Save more on every order with these deals.</p>

      {/* Offers strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {(offers || []).map((o) => (
          <div key={o.id} className="card p-4 hover:shadow-cardHover transition">
            <span className="inline-block rounded-md bg-violet-100 text-violet-700 px-2 py-0.5 text-[10px] font-bold">{o.tag}</span>
            <p className="font-semibold mt-2 text-sm">{o.title}</p>
            <p className="text-xs text-slate-500 mt-1">{o.description}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-bold mb-4 flex items-center gap-2"><Ticket size={18} className="text-brand-600" /> Available coupons</h2>
        <div className="space-y-3">
          {list.filter((c) => c.active).map((c) => (
            <div key={c.id} className="card overflow-hidden flex">
              <div className="bg-gradient-to-b from-brand-600 to-violet-600 text-white px-5 flex flex-col items-center justify-center min-w-32 relative">
                <Ticket size={28} className="opacity-40" />
                <span className="font-extrabold tracking-wider mt-1">{c.code}</span>
                <span className="absolute left-0 right-0 bottom-0 text-center text-[10px] bg-black/10 py-1 font-semibold">{c.type === 'flat' ? 'FLAT' : c.type === 'free_delivery' ? 'DELIVERY' : 'PERCENT'}</span>
              </div>
              <div className="flex-1 p-5 relative">
                <div className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-slate-200" />
                <p className="font-semibold">{c.description}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Minimum order {formatPrice(c.minCartValue)} · Max discount {c.maxDiscount ? formatPrice(c.maxDiscount) : '—'} · Valid till {c.endDate}
                </p>
                {user && (
                  <button onClick={() => copy(c.code)} className="absolute top-1/2 -translate-y-1/2 right-4 btn-secondary btn-sm">
                    {copied === c.code ? <><Check size={14} className="text-success" /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}