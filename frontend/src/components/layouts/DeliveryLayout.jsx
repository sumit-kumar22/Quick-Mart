import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Bike, LayoutDashboard, Package, Wallet, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

const NAV = [
  { to: '/delivery/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/delivery/orders', icon: Package, label: 'Orders' },
  { to: '/delivery/earnings', icon: Wallet, label: 'Earnings' },
];

export default function DeliveryLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(true);

  const Nav = (
    <div className="flex-1 space-y-1">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition',
              isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')
          }
        >
          <n.icon size={18} /> {n.label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 sticky top-0 h-screen">
        <Link to="/delivery/dashboard" className="flex items-center gap-2 px-2 mb-6">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center"><Bike size={20} /></span>
          <span className="font-extrabold text-lg">Quick<span className="text-emerald-600">Rider</span></span>
        </Link>
        {/* online toggle */}
        <button onClick={() => setOnline((o) => !o)} className={cn('flex items-center justify-between rounded-xl border px-4 py-3 mb-4 text-sm font-semibold cursor-pointer', online ? 'border-success/40 bg-success/5 text-success' : 'border-slate-200 bg-slate-50 text-slate-500')}>
          <span className="flex items-center gap-2"><span className={cn('h-2.5 w-2.5 rounded-full', online ? 'bg-success animate-pulse' : 'bg-slate-400')} />{online ? 'Online' : 'Offline'}</span>
          <span className={cn('h-5 w-10 rounded-full relative transition', online ? 'bg-success' : 'bg-slate-300')}>
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', online ? 'left-[22px]' : 'left-0.5')} />
          </span>
        </button>
        {Nav}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 px-2 pb-3">
            <span className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.split(' ').map((s) => s[0]).join('').slice(0, 2)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">Delivery Partner</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/delivery/login'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-red-50 cursor-pointer">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200 md:hidden flex items-center justify-between px-4 h-14">
        <button onClick={() => setMobileOpen((o) => !o)} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link to="/delivery/dashboard" className="font-extrabold flex items-center gap-1.5"><Bike size={18} className="text-emerald-600" /> QuickRider</Link>
        <div className="w-8" />
      </div>
      {mobileOpen && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-40 bg-white md:hidden p-4 flex flex-col animate-fade-in">
          <button onClick={() => setOnline((o) => !o)} className={cn('flex items-center justify-between rounded-xl border px-4 py-3 mb-4 text-sm font-semibold cursor-pointer', online ? 'border-success/40 bg-success/5 text-success' : 'border-slate-200 bg-slate-50 text-slate-500')}>
            <span className="flex items-center gap-2"><span className={cn('h-2.5 w-2.5 rounded-full', online ? 'bg-success' : 'bg-slate-400')} />{online ? 'Online' : 'Offline'}</span>
            Toggle
          </button>
          {Nav}
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}