import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, LayoutGrid, Boxes, Users, Bike, Store, Tag, BarChart3, Settings, LogOut, Menu, X, Bell, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiService } from '../../services/apiService.js';
import { useAsync } from '../../hooks/useAsync.js';
import { cn } from '../../utils/cn.js';

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders', icon: Package, label: 'Orders' },
  { to: '/admin/products', icon: Boxes, label: 'Products' },
  { to: '/admin/categories', icon: LayoutGrid, label: 'Categories' },
  { to: '/admin/inventory', icon: Package, label: 'Inventory' },
  { to: '/admin/users', icon: Users, label: 'Customers' },
  { to: '/admin/delivery', icon: Bike, label: 'Delivery Partners' },
  { to: '/admin/stores', icon: Store, label: 'Stores' },
  { to: '/admin/offers', icon: Tag, label: 'Offers & Coupons' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: notifs } = useAsync(() => apiService.getNotifications(), []);
  const unread = (notifs || []).filter((n) => !n.read).length;

  const sidebar = (
    <>
      <Link to="/admin/dashboard" className="flex items-center gap-2 px-2 mb-6">
        <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white flex items-center justify-center"><Zap size={20} fill="currentColor" /></span>
        <div>
          <p className="font-extrabold leading-none">QuickMart</p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Admin Panel</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-1">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn('flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition',
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')
            }
          >
            <n.icon size={18} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 px-2 pb-3">
          <span className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">
            {user?.name?.split(' ').map((s) => s[0]).join('').slice(0, 2)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.storeName || 'Store Admin'}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/admin/login'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-red-50 cursor-pointer">
          <LogOut size={17} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-4 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white p-4 flex flex-col animate-slide-in-right">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 lg:px-8 h-16 flex items-center gap-3">
          <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Menu">
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold hidden sm:block">{user?.storeName || 'Store Dashboard'}</h2>
            <h2 className="font-bold sm:hidden">Admin</h2>
          </div>
          <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Notifications">
            <Bell size={19} />
            {unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>}
          </button>
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.split(' ').map((s) => s[0]).join('').slice(0, 2)}
            </span>
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}