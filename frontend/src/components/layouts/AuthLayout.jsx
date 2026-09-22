import { Link, Outlet } from 'react-router-dom';
import { Zap, Truck, ShieldCheck, Headphones } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 p-10 text-white">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur">
            <Zap size={22} fill="currentColor" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight">Quick<span className="text-white/80">Mart</span></span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Groceries in<br />minutes, not hours.
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Fresh daily essentials from your nearby QuickMart stores — delivered to your doorstep.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { icon: Truck, text: '10-minute delivery in serviceable areas' },
              { icon: ShieldCheck, text: 'Secure payments — GPay, cards & COD' },
              { icon: Headphones, text: '24/7 customer support' },
            ].map((f) => (
              <p key={f.text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center"><f.icon size={17} /></span>
                {f.text}
              </p>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/50">© 2026 QuickMart. An original quick-commerce platform.</p>
      </div>

      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-white">
                <Zap size={22} fill="currentColor" />
              </span>
              <span className="text-2xl font-extrabold">Quick<span className="text-brand-600">Mart</span></span>
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}