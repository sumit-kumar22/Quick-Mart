import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Camera, MapPin, Package, Heart, Ticket, Bell, Shield, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import { initials } from '../utils/format.js';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
  const { data: myOrders } = useAsync(() => apiService.getOrders(), [user?.id]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <User size={40} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-xl font-bold">You're not signed in</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your profile, orders and more.</p>
        <button onClick={() => navigate('/login')} className="btn-primary mt-6">Go to Login</button>
      </div>
    );
  }

  const isDelivered = (s) => s.status === 'DELIVERED';

  const menuItems = [
    { label: 'My Orders', desc: `${myOrders.length} orders placed`, icon: Package, to: '/orders' },
    { label: 'My Addresses', desc: `${(user.addresses || []).length} saved addresses`, icon: MapPin, to: '/addresses' },
    { label: 'Wishlist', desc: `${user.wishlist?.length || 0} items saved`, icon: Heart, to: '/wishlist' },
    { label: 'Coupons & Offers', desc: 'Deals waiting for you', icon: Ticket, to: '/coupons' },
    { label: 'Notifications', desc: 'Updates on your orders', icon: Bell, to: '/notifications' },
    { label: 'Security', desc: 'Password & sessions', icon: Shield, to: '/profile/security' },
  ];

  const saveProfile = () => {
    updateProfile(form);
    setEditing(false);
    toast.show('Profile updated');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center text-2xl font-bold">
              {user.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover rounded-2xl" /> : initials(user.name)}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white shadow border border-slate-200 flex items-center justify-center text-brand-600 cursor-pointer" aria-label="Change photo">
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={() => toast.show('Photo upload coming soon', 'info')} />
          </div>
          {!editing ? (
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
              <p className="text-sm text-slate-500">{user.phone}</p>
              <button onClick={() => setEditing(true)} className="btn-secondary btn-sm mt-2">Edit Profile</button>
            </div>
          ) : (
            <div className="flex-1 min-w-0 space-y-2">
              <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={saveProfile} className="btn-primary btn-sm">Save</button>
                <button onClick={() => setEditing(false)} className="btn-ghost btn-sm">Cancel</button>
              </div>
            </div>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-extrabold text-brand-600">{isDelivered && myOrders.length}</div>
            <div className="text-xs text-slate-400">Lowest active spend not tracked</div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Orders', value: myOrders.length },
          { label: 'Wishlist', value: user.wishlist?.length || 0 },
          { label: 'Member since', value: String(user.createdAt || 'Feb 2026').slice(0, 7) },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="card divide-y divide-slate-100">
        {menuItems.map((m) => (
          <Link key={m.label} to={m.to} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition group">
            <span className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-100">
              <m.icon size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{m.label}</p>
              <p className="text-xs text-slate-400">{m.desc}</p>
            </div>
            <ChevronRight size={17} className="text-slate-300 group-hover:text-brand-500" />
          </Link>
        ))}
        <button onClick={() => { logout(); toast.show('Logged out', 'info'); navigate('/'); }} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 transition text-danger">
          <span className="h-10 w-10 rounded-xl bg-red-50 text-danger flex items-center justify-center"><LogOut size={18} /></span>
          <p className="text-sm font-semibold">Logout</p>
        </button>
      </div>
    </div>
  );
}