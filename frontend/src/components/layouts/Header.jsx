import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import {
  Menu, MapPin, Search, Bell, ShoppingBag, ChevronDown, User, Package, Heart, LogOut, Zap, Headphones,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocationCtx } from '../../context/LocationContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useAsync } from '../../hooks/useAsync.js';
import { apiService } from '../../services/apiService.js';
import { cn } from '../../utils/cn.js';

function Logo({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2 shrink-0" aria-label="QuickMart home">
      <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
        <Zap size={20} fill="currentColor" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">
        Quick<span className="text-brand-600">Mart</span>
      </span>
    </Link>
  );
}

function SearchBar({ className }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const debounced = useDebounce(query, 250);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  useEffect(() => {
    if (!debounced || debounced.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    apiService.getSearchSuggestions(debounced).then((res) => {
      setSuggestions(res.data || []);
      setSuggestOpen(true);
    }).catch(() => setSuggestions([]));
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setSuggestOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setSuggestOpen(false);
    navigate(query.trim() ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  return (
    <form onSubmit={submit} ref={boxRef} className={cn('relative', className)} role="search">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setSuggestOpen(true)}
          placeholder="Search products, brands and more"
          className="input pl-10 bg-slate-50 border-slate-200 focus:bg-white"
          aria-label="Search products"
        />
      </div>
      {suggestOpen && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full bg-white rounded-xl shadow-modal border border-slate-100 py-2 overflow-hidden">
          {suggestions.slice(0, 6).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 text-left cursor-pointer"
                onClick={() => { setQuery(''); setSuggestOpen(false); navigate(`/product/${s.slug || s.id}`); }}
              >
                <span className="text-lg" aria-hidden="true">{s.emoji}</span>
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-xs font-medium text-slate-400">₹{s.price}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

export default function Header() {
  const { cart, totals } = useCart();
  const { user, logout } = useAuth();
  const { location } = useLocationCtx();
  const { setLocationOpen, openCart } = useUI();
  const navigate = useNavigate();
  const toast = useToast();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const accountRef = useRef(null);
  const notifRef = useRef(null);

  const { data: notifs } = useAsync(
    () => (user ? apiService.getNotifications() : Promise.resolve({ data: [] })),
    [user?.id]
  );

  const unreadCount = (notifs || []).filter((n) => !n.read).length;

  useEffect(() => {
    const onDoc = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    toast.show('Logged out successfully', 'info');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      {/* top bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3 h-16">
          {/* Desktop logo */}
          <div className="hidden md:block">
            <Logo />
          </div>

          {/* Location selector */}
          <button
            onClick={() => setLocationOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-brand-700 transition shrink-0 group"
            aria-label="Change delivery location"
          >
            <MapPin size={18} className="text-brand-600 group-hover:scale-110 transition" />
            <span className="max-w-28 sm:max-w-none truncate">
              {location ? location.label.split(',').slice(-2).join(',') || location.label : 'Select location'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          <div className="hidden md:block flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>

          <div className="flex-1 md:hidden" />

          {/* mobile search */}
          <button onClick={() => navigate('/search')} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Search">
            <Search size={20} />
          </button>

          {/* notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen((o) => !o)} className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Notifications">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-cart-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-modal border border-slate-100 overflow-hidden z-40">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="font-semibold text-sm">Notifications</p>
                  <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-brand-600 hover:underline">View all</Link>
                </div>
                <div className="max-h-80 overflow-y-auto thin-scroll">
                  {notifs.slice(0, 5).map((n) => (
                    <button key={n.id || n._id} onClick={() => { setNotifOpen(false); navigate(n.link || '/notifications'); }} className={cn('w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer', !n.read && 'bg-brand-50/50')}>
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* cart */}
          <button onClick={openCart} className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer md:hidden" aria-label="Open cart" >
            <ShoppingBag size={20} />
            {totals.itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center animate-cart-bounce">
                {totals.itemCount}
              </span>
            )}
          </button>

          <CartButton />

          {/* account */}
          <div className="relative hidden md:block" ref={accountRef}>
            <button onClick={() => setAccountOpen((o) => !o)} className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200" aria-label="Account">
              <span className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() : 'GU'}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {accountOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-modal border border-slate-100 overflow-hidden z-40 py-1">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{user?.name || 'Guest User'}</p>
                  <p className="text-xs text-slate-400">{user?.email || 'Sign in for more'}</p>
                </div>
                {user ? (
                  <>
                    <MenuItem icon={User} label="My Profile" to="/profile" onClick={() => setAccountOpen(false)} />
                    <MenuItem icon={Package} label="My Orders" to="/orders" onClick={() => setAccountOpen(false)} />
                    <MenuItem icon={Heart} label="Wishlist" to="/wishlist" onClick={() => setAccountOpen(false)} />
                    <MenuItem icon={Headphones} label="Support" to="/support" onClick={() => setAccountOpen(false)} />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-red-50 cursor-pointer">
                      <LogOut size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <div className="p-3">
                    <button onClick={() => { setAccountOpen(false); navigate('/login'); }} className="btn-primary btn-sm w-full">Login</button>
                    <button onClick={() => { setAccountOpen(false); navigate('/register'); }} className="btn-ghost btn-sm w-full mt-1">Create Account</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon: Icon, label, to, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-700">
      <Icon size={16} className="text-slate-400" /> {label}
    </Link>
  );
}

function CartButton() {
  const { totals } = useCart();
  const { openCart } = useUI();
  return (
    <button
      onClick={openCart}
      className="hidden md:flex relative items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-semibold transition active:scale-95 cursor-pointer"
      aria-label={`Open cart with ${totals.itemCount} items`}
    >
      <ShoppingBag size={17} />
      My Cart
      {totals.itemCount > 0 && <span key={totals.itemCount} className="h-5 min-w-5 px-1 rounded-full bg-white text-brand-700 text-xs font-bold flex items-center justify-center animate-cart-bounce">{totals.itemCount}</span>}
    </button>
  );
}