import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, Heart, Package, User } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { cn } from '../../utils/cn.js';

const items = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/categories', icon: LayoutGrid, label: 'Categories' },
  { to: '/cart', icon: Package, label: 'Cart' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileBottomNav() {
  const { totals } = useCart();
  const navigate = useNavigate();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition relative',
                isActive ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.to === '/cart' && totals.itemCount > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-4 h-4 min-w-4 px-0.5 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center animate-cart-bounce">
                    {totals.itemCount}
                  </span>
                )}
                <item.icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}