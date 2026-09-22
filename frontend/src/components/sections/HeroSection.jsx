import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { apiService } from '../../services/apiService.js';
import { Skeleton } from '../ui/Skeleton.jsx';
import { cn } from '../../utils/cn.js';

export default function HeroSection() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    apiService.getBanners()
      .then((res) => setBanners(res.data || []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || loading) return;
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length, loading]);

  if (loading) return <Skeleton className="h-44 sm:h-56 w-full rounded-card" />;
  if (!banners.length) return null;

  const current = banners[active];

  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-br">
      <div className="relative h-44 sm:h-56 md:h-64 flex">
        {banners.map((b, i) => (
          <div
            key={b.id}
            onClick={() => { const el = document.getElementById('hero-scroll'); if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); }}
            className={cn('relative h-full overflow-hidden transition-all duration-500 cursor-pointer', i === active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none')}
            style={{ zIndex: banners.length - i }}
          >
            {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />}
            <div className={`absolute inset-0 bg-gradient-to-r ${b.gradient} ${b.imageUrl ? 'opacity-90' : ''}`} />
            {b.imageUrl && <div className="absolute inset-0 bg-black/20" />}
            <div className="relative max-w-7xl mx-auto h-full flex items-center justify-between px-5 sm:px-8 md:px-12">
              <div className="text-white max-w-lg">
                {b.badge && (
                  <span className="inline-flex items-center rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-semibold backdrop-blur">
                    ⚡ {b.badge}
                  </span>
                )}
                <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">{b.title}</h2>
                <p className="mt-2 text-sm sm:text-base text-white/85">{b.subtitle}</p>
                <Link
                  to={b.ctaLink}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-5 py-2.5 text-sm font-bold shadow-sm transition active:scale-95 hover:bg-slate-100"
                >
                  {b.cta} <ArrowRight size={16} />
                </Link>
              </div>
              <span className="hidden sm:block text-7xl md:text-8xl drop-shadow-lg select-none" aria-hidden="true">
                {b.image}
              </span>
            </div>
          </div>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setActive(i)}
              className={cn('h-1.5 rounded-full transition-all cursor-pointer', i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/50')}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}