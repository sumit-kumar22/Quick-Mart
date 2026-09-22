import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import CartDrawer from '../cart/CartDrawer.jsx';
import LocationModal from './LocationModal.jsx';

export default function CustomerLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />
      <CartDrawer />
      <LocationModal />
    </div>
  );
}