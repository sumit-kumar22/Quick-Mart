import HeroSection from '../components/sections/HeroSection.jsx';
import CategoryStrip from '../components/sections/CategoryStrip.jsx';
import ProductRow from '../components/sections/ProductRow.jsx';
import PromoBanners from '../components/sections/PromoBanners.jsx';
import { apiService } from '../services/apiService.js';
import { useAsync } from '../hooks/useAsync.js';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useLocationCtx } from '../context/LocationContext.jsx';

export default function Home() {
  const { location, selectedStore } = useLocationCtx();
  const { data: deals, loading: dealsLoading } = useAsync(() => apiService.getProducts({ bestseller: true, limit: 12 }), []);
  const { data: fresh, loading: freshLoading } = useAsync(() => apiService.getProducts({ newArrival: true, limit: 10 }), []);
  const { data: featured, loading: featuredLoading } = useAsync(() => apiService.getProducts({ featured: true, limit: 10 }), []);
  const { data: veg, loading: vegLoading } = useAsync(() => apiService.getProducts({ category: 'fruits-vegetables', limit: 10 }), []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-8">
      {/* Delivery location banner */}
      <div className="card flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-brand-600">📍</span>
          <span className="text-slate-600">
            {location ? (
              <>
                Delivering to <span className="font-semibold text-slate-800">{location.label.split(',').slice(0, 2).join(',')}</span>
              </>
            ) : (
              <>Please select a delivery location to see your store</>
            )}
          </span>
        </div>
        {selectedStore && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-success/10 text-success border border-success/25 px-3 py-1 text-xs font-semibold">
            {selectedStore.name}
          </span>
        )}
        {!location && <Skeleton className="h-6 w-28 rounded-lg" />}
      </div>

      <HeroSection />
      <CategoryStrip />

      <ProductRow
        title="Top Deals"
        subtitle="Best selling products at the best prices today"
        products={deals?.sort((a, b) => b.discount - a.discount)}
        loading={dealsLoading}
        viewAllLink="/search?sort=discount"
      />

      <PromoBanners />

      <ProductRow
        title="Fresh Picks"
        subtitle="Recently added favourites"
        products={fresh}
        loading={freshLoading}
        viewAllLink="/search?sort=newest"
      />

      <ProductRow
        title="Fruits & Vegetables"
        subtitle="Farm-fresh produce every morning"
        products={veg}
        loading={vegLoading}
        viewAllLink="/category/fruits-vegetables"
      />

      <ProductRow
        title="Trending Now"
        subtitle="Customers love these most"
        products={featured}
        loading={featuredLoading}
        viewAllLink="/search"
      />
    </div>
  );
}