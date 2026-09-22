import { Link } from 'react-router-dom';
import { Zap, MapPin, Phone, Mail, ShieldCheck, Truck, BadgeCheck, Headphones } from 'lucide-react';

const quickLinks = [
  { label: 'About Us', to: '/support' },
  { label: 'Contact', to: '/support' },
  { label: 'FAQs', to: '/support' },
  { label: 'Track Order', to: '/orders' },
  { label: 'Coupons', to: '/coupons' },
];

const categories = [
  { label: 'Fruits & Vegetables', to: '/category/fruits-vegetables' },
  { label: 'Dairy & Breakfast', to: '/category/dairy-breakfast' },
  { label: 'Snacks & Munchies', to: '/category/snacks-munchies' },
  { label: 'Beverages', to: '/category/beverages' },
  { label: 'Personal Care', to: '/category/personal-care' },
];

const benefits = [
  { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹499' },
  { icon: BadgeCheck, title: 'Easy Returns', desc: 'Hassle-free refunds' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: '256-bit encryption' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-slate-100">
      <div className="bg-gradient-to-r from-brand-600 via-violet-600 to-brand-700">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-center gap-3 text-white">
                <span className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <b.icon size={22} />
                </span>
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-xs text-white/70">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-white">
                <Zap size={20} fill="currentColor" />
              </span>
              <span className="text-xl font-extrabold">Quick<span className="text-brand-600">Mart</span></span>
            </Link>
            <p className="mt-3 text-sm text-slate-500">
              Groceries and everyday essentials delivered to your doorstep in minutes.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-500">
              <p className="flex items-center gap-2"><MapPin size={14} className="text-brand-600" /> 12 MG Road, Mumbai, MH 400050</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-brand-600" /> +91 98765 43210</p>
              <p className="flex items-center gap-2"><Mail size={14} className="text-brand-600" /> hello@quickmart.co</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-800 mb-3">Company</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-500 hover:text-brand-600 transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-800 mb-3">Categories</h3>
            <ul className="space-y-2">
              {categories.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-500 hover:text-brand-600 transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-800 mb-3">Download our App</h3>
            <p className="text-sm text-slate-500 mb-3">Order faster with the QuickMart app.</p>
            <div className="flex flex-col gap-2">
              <button className="btn-secondary btn-sm justify-start"><span className="text-lg">🍏</span> App Store</button>
              <button className="btn-secondary btn-sm justify-start"><span className="text-lg">📱</span> Google Play</button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 QuickMart. All rights reserved. An original quick-commerce platform.</p>
          <div className="flex gap-4">
            <Link to="/support" className="hover:text-brand-600">Terms</Link>
            <Link to="/support" className="hover:text-brand-600">Privacy</Link>
            <Link to="/support" className="hover:text-brand-600">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}